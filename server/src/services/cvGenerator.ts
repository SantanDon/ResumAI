/**
 * CV Generator Service
 * Main orchestrator for CV generation, delta changes, and exports
 */

import { v4 as uuidv4 } from 'uuid';
import { db, MasterCVEntry } from '../db';
import {
  JSONResume,
  DeltaChange,
  GenerationResult,
  RegenerationOptions,
  ValidationResult,
  createEmptyJSONResume
} from '../types/jsonResume';
import { jsonResumeValidator } from './jsonResumeValidator';
import { masterCVTransformer } from './masterCVTransformer';
import { deltaChangeHandler } from './deltaChangeHandler';
import { changeHistoryManager } from './changeHistoryManager';
import { qualityScorer } from './qualityScorer';
import { bulletEnhancer } from './bulletEnhancer';
import { templateRenderer } from './templateRenderer';
import { sectionOrderer } from './sectionOrderer';

interface CVStoreEntry {
  id: string;
  user_id: string;
  cv_data: string;
  quality_score: number;
  template_id: string;
  created_at: string;
  updated_at: string;
}

class CVGeneratorService {
  /**
   * Apply a single delta change to a CV
   */
  async applyDelta(cvId: string, change: DeltaChange): Promise<GenerationResult> {
    return this.applyMultipleDeltas(cvId, [change]);
  }

  /**
   * Apply multiple delta changes to a CV
   */
  async applyMultipleDeltas(cvId: string, changes: DeltaChange[]): Promise<GenerationResult> {
    // Get current CV
    const currentCV = this.getCV(cvId);
    if (!currentCV) {
      throw new Error(`CV not found: ${cvId}`);
    }

    // Calculate score before changes
    const scoreBefore = qualityScorer.calculateScore(currentCV).score;

    // Apply changes
    const result = deltaChangeHandler.applyMultipleDeltas(currentCV, changes);
    
    if (!result.success) {
      throw new Error(`Failed to apply changes: ${result.errors.join(', ')}`);
    }

    // Calculate score after changes
    const scoreResult = qualityScorer.calculateScore(result.cv);

    // Record in history
    const changeId = changeHistoryManager.recordChange(
      cvId,
      'delta',
      currentCV,
      result.cv,
      changes,
      scoreBefore,
      scoreResult.score
    );

    // Save updated CV
    this.saveCV(cvId, result.cv, scoreResult.score);

    // Render preview
    const html = templateRenderer.renderToHTML(result.cv, {
      highlightChanges: changes.map(c => c.path)
    });

    return {
      cv: result.cv,
      html,
      qualityScore: scoreResult.score,
      suggestions: scoreResult.suggestions,
      changeId
    };
  }

  /**
   * Regenerate CV from Master CV data
   */
  async regenerate(userId: string, options: RegenerationOptions = {}): Promise<GenerationResult> {
    // Get Master CV entries
    const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ? ORDER BY id').all(userId) as MasterCVEntry[];
    
    if (entries.length === 0) {
      throw new Error('No Master CV data found for user');
    }

    // Transform to JSON Resume
    let cv = masterCVTransformer.toJSONResume(entries);

    // Apply section ordering
    cv = sectionOrderer.orderSections(cv, options.sectionOrder);

    // Enhance content if requested
    if (options.enhanceContent) {
      cv = await this.enhanceCV(cv, options.targetIndustry);
    }

    // Calculate quality score
    const scoreResult = qualityScorer.calculateScore(cv, options.targetIndustry);

    // Get or create CV ID
    const existingCV = this.getCVByUserId(userId);
    const cvId = existingCV?.id || uuidv4();

    // Record in history if updating existing CV
    if (existingCV) {
      const previousCV = JSON.parse(existingCV.cv_data) as JSONResume;
      changeHistoryManager.recordChange(
        cvId,
        'full_regeneration',
        previousCV,
        cv,
        null,
        existingCV.quality_score,
        scoreResult.score
      );
    }

    // Save CV
    this.saveCV(cvId, cv, scoreResult.score, userId, options.templateId);

    // Render preview
    const html = templateRenderer.renderToHTML(cv, {
      templateId: options.templateId
    });

    return {
      cv,
      html,
      qualityScore: scoreResult.score,
      suggestions: scoreResult.suggestions,
      changeId: cvId
    };
  }

  /**
   * Enhance CV content using AI
   */
  private async enhanceCV(cv: JSONResume, industry?: string): Promise<JSONResume> {
    const enhanced = { ...cv };

    // Enhance work experience bullets
    if (enhanced.work) {
      for (let i = 0; i < enhanced.work.length; i++) {
        const job = enhanced.work[i];
        if (job.highlights) {
          const enhancedHighlights: string[] = [];
          for (const highlight of job.highlights) {
            const result = await bulletEnhancer.enhanceBullet(highlight, industry);
            enhancedHighlights.push(result.enhanced);
          }
          enhanced.work[i] = { ...job, highlights: enhancedHighlights };
        }
      }
    }

    // Enhance project highlights
    if (enhanced.projects) {
      for (let i = 0; i < enhanced.projects.length; i++) {
        const project = enhanced.projects[i];
        if (project.highlights) {
          const enhancedHighlights: string[] = [];
          for (const highlight of project.highlights) {
            const result = await bulletEnhancer.enhanceBullet(highlight, industry);
            enhancedHighlights.push(result.enhanced);
          }
          enhanced.projects[i] = { ...project, highlights: enhancedHighlights };
        }
      }
    }

    return enhanced;
  }

  /**
   * Import Master CV data and create JSON Resume
   */
  async importFromMasterCV(userId: string): Promise<JSONResume> {
    const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ? ORDER BY id').all(userId) as MasterCVEntry[];
    
    if (entries.length === 0) {
      return createEmptyJSONResume();
    }

    return masterCVTransformer.toJSONResume(entries);
  }

  /**
   * Export CV as JSON Resume
   */
  exportToJSON(cvId: string): JSONResume {
    const cv = this.getCV(cvId);
    if (!cv) {
      throw new Error(`CV not found: ${cvId}`);
    }
    return cv;
  }

  /**
   * Export CV as PDF
   */
  async exportToPDF(cvId: string, templateId?: string): Promise<Buffer> {
    const cv = this.getCV(cvId);
    if (!cv) {
      throw new Error(`CV not found: ${cvId}`);
    }

    return templateRenderer.renderToPDF(cv, { templateId });
  }

  /**
   * Export CV as plain text
   */
  exportToText(cvId: string): string {
    const cv = this.getCV(cvId);
    if (!cv) {
      throw new Error(`CV not found: ${cvId}`);
    }

    return templateRenderer.exportToText(cv);
  }

  /**
   * Validate a CV
   */
  validate(cv: JSONResume): ValidationResult {
    return jsonResumeValidator.validate(cv);
  }

  /**
   * Render preview HTML
   */
  renderPreview(cv: JSONResume, templateId?: string): string {
    return templateRenderer.renderToHTML(cv, { templateId });
  }

  /**
   * Get CV by ID
   */
  getCV(cvId: string): JSONResume | null {
    try {
      const stmt = db.prepare('SELECT * FROM cv_store WHERE id = ?');
      const row = stmt.get(cvId) as CVStoreEntry | undefined;
      
      if (!row) return null;
      
      return JSON.parse(row.cv_data) as JSONResume;
    } catch (error) {
      console.error('Error getting CV:', error);
      return null;
    }
  }

  /**
   * Get CV by user ID
   */
  getCVByUserId(userId: string): CVStoreEntry | null {
    try {
      const stmt = db.prepare('SELECT * FROM cv_store WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1');
      return stmt.get(userId) as CVStoreEntry | undefined || null;
    } catch (error) {
      console.error('Error getting CV by user:', error);
      return null;
    }
  }

  /**
   * Save CV to database
   */
  saveCV(cvId: string, cv: JSONResume, score: number, userId?: string, templateId?: string): void {
    try {
      const existing = db.prepare('SELECT id FROM cv_store WHERE id = ?').get(cvId);
      
      if (existing) {
        // Update existing
        const stmt = db.prepare(`
          UPDATE cv_store 
          SET cv_data = ?, quality_score = ?, template_id = ?, updated_at = ?
          WHERE id = ?
        `);
        stmt.run(
          JSON.stringify(cv),
          score,
          templateId || 'gold-standard',
          new Date().toISOString(),
          cvId
        );
      } else {
        // Insert new
        const stmt = db.prepare(`
          INSERT INTO cv_store (id, user_id, cv_data, quality_score, template_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          cvId,
          userId || 'default',
          JSON.stringify(cv),
          score,
          templateId || 'gold-standard',
          new Date().toISOString(),
          new Date().toISOString()
        );
      }
    } catch (error) {
      console.error('Error saving CV:', error);
      throw error;
    }
  }

  /**
   * Delete CV
   */
  deleteCV(cvId: string): void {
    try {
      // Delete history first
      changeHistoryManager.clearHistory(cvId);
      
      // Delete CV
      const stmt = db.prepare('DELETE FROM cv_store WHERE id = ?');
      stmt.run(cvId);
    } catch (error) {
      console.error('Error deleting CV:', error);
      throw error;
    }
  }

  /**
   * Get all CVs for a user
   */
  getUserCVs(userId: string): CVStoreEntry[] {
    try {
      const stmt = db.prepare('SELECT * FROM cv_store WHERE user_id = ? ORDER BY updated_at DESC');
      return stmt.all(userId) as CVStoreEntry[];
    } catch (error) {
      console.error('Error getting user CVs:', error);
      return [];
    }
  }

  /**
   * Generate PDF filename
   */
  generateFilename(cv: JSONResume): string {
    return templateRenderer.generateFilename(cv);
  }

  /**
   * Save PDF to file and return path
   */
  async savePDF(cvId: string, templateId?: string): Promise<string> {
    const cv = this.getCV(cvId);
    if (!cv) {
      throw new Error(`CV not found: ${cvId}`);
    }

    const filename = this.generateFilename(cv);
    return templateRenderer.savePDF(cv, filename, { templateId });
  }
}

// Export singleton instance
export const cvGenerator = new CVGeneratorService();
