/**
 * Template Registry Service
 * Manages all available CV templates with metadata and rendering
 */

import { JSONResume, TemplateTheme } from '../types/jsonResume';
import { HARVARD_CSS, renderHarvardTemplate } from './templates/harvardTemplate';
import { MODERN_MINIMAL_CSS, renderModernMinimalTemplate } from './templates/modernMinimalTemplate';
import { EXECUTIVE_CSS, renderExecutiveTemplate } from './templates/executiveTemplate';
import { CREATIVE_CSS, renderCreativeTemplate } from './templates/creativeTemplate';
import { MINIMAL_CLEAN_CSS, renderMinimalCleanTemplate } from './templates/minimalCleanTemplate';

/**
 * Template metadata with ATS scores and styling info
 */
export interface TemplateMetadata extends TemplateTheme {
  atsScore: number;
  category: 'professional' | 'creative' | 'minimal' | 'executive' | 'modern';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  renderFunction: (cv: JSONResume) => string;
}

/**
 * Template Registry - Singleton service for managing all templates
 */
class TemplateRegistry {
  private templates: Map<string, TemplateMetadata> = new Map();
  private renderCache: Map<string, string> = new Map();
  private maxCacheSize = 100;

  constructor() {
    this.registerTemplates();
  }

  /**
   * Register all available templates
   */
  private registerTemplates(): void {
    // Harvard Professional Template
    this.register({
      id: 'harvard',
      name: 'Harvard Professional',
      description: 'Classic, ATS-optimized professional template with traditional styling',
      category: 'professional',
      css: HARVARD_CSS,
      layout: 'single-column',
      fontFamily: 'Open Sans, Lora, serif',
      atsScore: 95,
      colors: {
        primary: '#000000',
        secondary: '#333333',
        accent: '#666666'
      },
      fonts: {
        heading: 'Lora, serif',
        body: 'Open Sans, sans-serif'
      },
      renderFunction: renderHarvardTemplate
    });

    // Modern Minimal Template
    this.register({
      id: 'modern-minimal',
      name: 'Modern Minimal',
      description: 'Clean, contemporary design with subtle blue accents and modern typography',
      category: 'modern',
      css: MODERN_MINIMAL_CSS,
      layout: 'single-column',
      fontFamily: 'Inter, sans-serif',
      atsScore: 92,
      colors: {
        primary: '#1a1a1a',
        secondary: '#2563eb',
        accent: '#e0e0e0'
      },
      fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif'
      },
      renderFunction: renderModernMinimalTemplate
    });

    // Executive Premium Template
    this.register({
      id: 'executive',
      name: 'Executive Premium',
      description: 'Sophisticated, leadership-focused design with elegant serif headings',
      category: 'executive',
      css: EXECUTIVE_CSS,
      layout: 'single-column',
      fontFamily: 'Lato, Playfair Display, serif',
      atsScore: 94,
      colors: {
        primary: '#2c3e50',
        secondary: '#1f1f1f',
        accent: '#555555'
      },
      fonts: {
        heading: 'Playfair Display, serif',
        body: 'Lato, sans-serif'
      },
      renderFunction: renderExecutiveTemplate
    });

    // Creative Bold Template
    this.register({
      id: 'creative',
      name: 'Creative Bold',
      description: 'Design-forward template with vibrant red accents for creative professionals',
      category: 'creative',
      css: CREATIVE_CSS,
      layout: 'single-column',
      fontFamily: 'Roboto, Poppins, sans-serif',
      atsScore: 85,
      colors: {
        primary: '#ff6b6b',
        secondary: '#2c3e50',
        accent: '#f8f9fa'
      },
      fonts: {
        heading: 'Poppins, sans-serif',
        body: 'Roboto, sans-serif'
      },
      renderFunction: renderCreativeTemplate
    });

    // Minimal Clean Template
    this.register({
      id: 'minimal-clean',
      name: 'Minimal Clean',
      description: 'Ultra-simple, scannable design optimized for ATS systems',
      category: 'minimal',
      css: MINIMAL_CLEAN_CSS,
      layout: 'single-column',
      fontFamily: 'Arial, Helvetica, sans-serif',
      atsScore: 98,
      colors: {
        primary: '#000000',
        secondary: '#000000',
        accent: '#000000'
      },
      fonts: {
        heading: 'Arial, sans-serif',
        body: 'Arial, sans-serif'
      },
      renderFunction: renderMinimalCleanTemplate
    });
  }

  /**
   * Register a new template
   */
  private register(template: TemplateMetadata): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): TemplateMetadata | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): TemplateMetadata[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): TemplateMetadata[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Get default template (Harvard)
   */
  getDefaultTemplate(): TemplateMetadata {
    return this.templates.get('harvard')!;
  }

  /**
   * Get template with highest ATS score
   */
  getMostATSFriendlyTemplate(): TemplateMetadata {
    let best = this.getDefaultTemplate();
    for (const template of this.templates.values()) {
      if (template.atsScore > best.atsScore) {
        best = template;
      }
    }
    return best;
  }

  /**
   * Render CV with specified template
   */
  renderCV(cv: JSONResume, templateId: string = 'harvard'): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Check cache
    const cacheKey = this.generateCacheKey(cv, templateId);
    if (this.renderCache.has(cacheKey)) {
      return this.renderCache.get(cacheKey)!;
    }

    // Render using template's render function
    const html = template.renderFunction(cv);

    // Cache the result
    this.cacheRender(cacheKey, html);

    return html;
  }

  /**
   * Render CV to full HTML document
   */
  renderCVDocument(cv: JSONResume, templateId: string = 'harvard'): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const bodyHTML = this.renderCV(cv, templateId);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cv.basics.name} - CV</title>
  <style>${template.css}</style>
</head>
<body>
  <div class="cv-container">
    ${bodyHTML}
  </div>
</body>
</html>`;
  }

  /**
   * Generate cache key for rendered CV
   */
  private generateCacheKey(cv: JSONResume, templateId: string): string {
    // Simple hash based on name and template
    const nameHash = cv.basics.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `${nameHash}:${templateId}`;
  }

  /**
   * Cache rendered CV with LRU eviction
   */
  private cacheRender(key: string, html: string): void {
    if (this.renderCache.size >= this.maxCacheSize) {
      // Remove first (oldest) entry
      const firstKey = this.renderCache.keys().next().value;
      if (firstKey) {
        this.renderCache.delete(firstKey);
      }
    }
    this.renderCache.set(key, html);
  }

  /**
   * Clear render cache
   */
  clearCache(): void {
    this.renderCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.renderCache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0 // Would need to track hits/misses
    };
  }

  /**
   * List all template IDs
   */
  getTemplateIds(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if template exists
   */
  hasTemplate(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  /**
   * Get template count
   */
  getTemplateCount(): number {
    return this.templates.size;
  }
}

// Export singleton instance
export const templateRegistry = new TemplateRegistry();

/**
 * Helper function to get template info
 */
export function getTemplateInfo(templateId: string): TemplateMetadata | undefined {
  return templateRegistry.getTemplate(templateId);
}

/**
 * Helper function to list all templates
 */
export function listAllTemplates(): TemplateMetadata[] {
  return templateRegistry.getAllTemplates();
}

/**
 * Helper function to render CV
 */
export function renderCVWithTemplate(cv: JSONResume, templateId: string = 'harvard'): string {
  return templateRegistry.renderCV(cv, templateId);
}

/**
 * Helper function to render full document
 */
export function renderCVDocument(cv: JSONResume, templateId: string = 'harvard'): string {
  return templateRegistry.renderCVDocument(cv, templateId);
}
