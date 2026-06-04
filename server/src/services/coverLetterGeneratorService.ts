/**
 * Cover Letter Generator Service
 * Generates personalized cover letters for job applications
 * Uses swarm voting for quality assurance
 */

import { SwarmOrchestrator } from '../swarm/orchestrator';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { jobParserService } from './jobParserService';
import { cvTailorService } from './cvTailorService';

interface CoverLetterOptions {
  userId: string;
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  keyRequirements?: string[];
  tone?: 'professional' | 'friendly' | 'formal';
}

class CoverLetterGeneratorService {
  private swarm: SwarmOrchestrator;

  constructor() {
    this.swarm = new SwarmOrchestrator(5);
  }

  /**
   * Generate a personalized cover letter
   */
  async generateCoverLetter(options: CoverLetterOptions): Promise<{
    coverLetterId: string;
    coverLetter: string;
    wordCount: number;
    matchedSkills: string[];
    suggestions: string[];
  }> {
    try {
      const {
        userId,
        jobTitle,
        companyName,
        jobDescription,
        keyRequirements,
        tone = 'professional'
      } = options;

      // Get user's CV data
      const cvEntries = db.prepare(
        'SELECT * FROM master_cv WHERE user_id = ? ORDER BY section_type'
      ).all(userId) as any[];

      if (cvEntries.length === 0) {
        throw new Error('No CV data found. Please upload a CV first.');
      }

      // Extract key information from CV
      const cvData = this.extractCVData(cvEntries);

      // Generate cover letter using swarm
      const coverLetterPrompt = this.buildCoverLetterPrompt(
        jobTitle,
        companyName,
        cvData,
        jobDescription,
        keyRequirements,
        tone
      );

      const coverLetter = await this.swarm.runAtomicTask(coverLetterPrompt);

      // Extract matched skills from cover letter
      const matchedSkills = this.extractMatchedSkills(coverLetter, keyRequirements || []);

      // Generate suggestions for improvement
      const suggestions = await this.generateSuggestions(coverLetter, jobTitle, companyName);

      // Save cover letter
      const coverLetterId = uuidv4();
      const wordCount = coverLetter.split(/\s+/).length;

      // Calculate quality score (0-100)
      const qualityScore = this.calculateQualityScore(coverLetter, wordCount, matchedSkills);

      // Save to database (if jobPostingId available)
      // For now, just return the generated content

      return {
        coverLetterId,
        coverLetter,
        wordCount,
        matchedSkills,
        suggestions
      };
    } catch (error) {
      console.error('[CoverLetterGeneratorService] Error generating cover letter:', error);
      throw error;
    }
  }

  /**
   * Quick cover letter generation with minimal input
   */
  async quickGenerate(userId: string, jobTitle: string, companyName: string): Promise<string> {
    try {
      const result = await this.generateCoverLetter({
        userId,
        jobTitle,
        companyName,
        tone: 'professional'
      });

      return result.coverLetter;
    } catch (error) {
      console.error('[CoverLetterGeneratorService] Error in quick generate:', error);
      throw error;
    }
  }

  /**
   * Extract key CV data
   */
  private extractCVData(entries: any[]): any {
    const data: any = {
      name: '',
      email: '',
      skills: [],
      experience: [],
      education: []
    };

    entries.forEach(entry => {
      const { section_type, content } = entry;

      if (section_type === 'name') {
        data.name = content;
      } else if (section_type === 'email') {
        data.email = content;
      } else if (section_type === 'skill') {
        data.skills.push(content);
      } else if (section_type === 'experience') {
        data.experience.push(content);
      } else if (section_type === 'education') {
        data.education.push(content);
      }
    });

    return data;
  }

  /**
   * Build cover letter prompt
   */
  private buildCoverLetterPrompt(
    jobTitle: string,
    companyName: string,
    cvData: any,
    jobDescription?: string,
    keyRequirements?: string[],
    tone: string = 'professional'
  ): string {
    const toneInstructions = {
      professional: 'Use a formal, professional tone. Be concise and impactful.',
      friendly: 'Use a warm, approachable tone while remaining professional.',
      formal: 'Use a very formal tone with proper business etiquette.'
    };

    return `
Write a compelling, high-fidelity cover letter for the following position:

Position: ${jobTitle}
Company: ${companyName}
Tone: ${tone}

Candidate Information:
- Name: ${cvData.name}
- Email: ${cvData.email}
- Key Skills: ${cvData.skills.slice(0, 6).join(', ')}
- Recent Experience: ${cvData.experience.slice(0, 3).join('; ')}
- Education: ${cvData.education.slice(0, 1).join('; ')}

${jobDescription ? `Job Description Highlights:\n${jobDescription.slice(0, 600)}\n` : ''}

${keyRequirements && keyRequirements.length > 0 ? `Key Requirements to Address:\n${keyRequirements.slice(0, 5).join('\n')}\n` : ''}

Instructions:
1. ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}
2. Structure the letter into exactly 3-4 detailed paragraphs (300-450 words) with deep domain reasoning. Avoid shallow or brief descriptions.
3. Incorporate these key modern tech recruiting themes based on market analytics:
   - **T-Shaped Expertise & Domain Depth**: Highlight broad stack awareness (frontend to database) combined with deep specialization in high-impact areas (e.g. API scale, backend performance tuning, responsive design, or UI/UX integration).
   - **AI-Augmented Developer Velocity**: Proactively explain how you leverage AI-assisted tools, generators, and automated workflows to accelerate engineering throughput, ship features faster, and write high-quality test-driven code.
   - **Async remote communication**: Mention how you excel in remote, async-first teams through strong written documentation, clear communication, and operational autonomy.
   - **Quantifiable Business Metrics**: Reference 2-3 specific achievements from experience and frame them with concrete metrics (e.g. reduced latency, infrastructure cost savings, increased conversion rates, or faster load times).
4. Maintain a natural, authentic, and highly professional flow. Avoid generic fluff phrases, hypophora ("How did I do this? I did this by..."), and AI slop words like "devastating".
5. Do NOT include the candidate's address, date, or sender/receiver headers at the top.
6. Start the body directly. Do NOT generate the salutation (e.g., "Dear Hiring Manager") or signature (e.g., "Sincerely, Candidate"), just the core paragraphs.`;
  }

  /**
   * Extract matched skills from cover letter
   */
  private extractMatchedSkills(coverLetter: string, keyRequirements: string[]): string[] {
    const matched: string[] = [];

    keyRequirements.forEach(requirement => {
      if (coverLetter.toLowerCase().includes(requirement.toLowerCase())) {
        matched.push(requirement);
      }
    });

    return matched;
  }

  /**
   * Generate suggestions for improvement
   */
  private async generateSuggestions(
    coverLetter: string,
    jobTitle: string,
    companyName: string
  ): Promise<string[]> {
    try {
      const suggestionPrompt = `
Review this cover letter and provide 2-3 specific suggestions for improvement:

Job: ${jobTitle} at ${companyName}

Cover Letter:
${coverLetter}

Provide suggestions as a JSON array of strings. Focus on:
1. Relevance to the specific job
2. Strength of achievements mentioned
3. Clarity and impact

Example: ["Add more specific metrics to the achievement", "Strengthen the connection to company values"]`;

      const result = await this.swarm.runAtomicTask(suggestionPrompt);

      try {
        const suggestions = JSON.parse(result);
        return Array.isArray(suggestions) ? suggestions : [];
      } catch (e) {
        return [];
      }
    } catch (error) {
      console.error('[CoverLetterGeneratorService] Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(coverLetter: string, wordCount: number, matchedSkills: string[]): number {
    let score = 50; // Base score

    // Word count check (ideal: 250-350 words)
    if (wordCount >= 250 && wordCount <= 350) {
      score += 20;
    } else if (wordCount >= 200 && wordCount <= 400) {
      score += 10;
    }

    // Matched skills
    if (matchedSkills.length > 0) {
      score += Math.min(20, matchedSkills.length * 5);
    }

    // Check for power words
    const powerWords = [
      'achieved', 'delivered', 'led', 'managed', 'improved', 'increased',
      'developed', 'created', 'implemented', 'designed', 'optimized'
    ];

    const powerWordCount = powerWords.filter(word =>
      coverLetter.toLowerCase().includes(word)
    ).length;

    score += Math.min(10, powerWordCount * 2);

    return Math.min(100, score);
  }

  /**
   * Save cover letter to database
   */
  saveCoverLetter(
    userId: string,
    jobPostingId: string,
    content: string,
    tone: string,
    qualityScore: number
  ): string {
    try {
      const id = uuidv4();

      const stmt = db.prepare(`
        INSERT INTO cover_letters (
          id, user_id, job_posting_id, content, tone, quality_score
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(id, userId, jobPostingId, content, tone, qualityScore);

      return id;
    } catch (error) {
      console.error('[CoverLetterGeneratorService] Error saving cover letter:', error);
      throw error;
    }
  }

  /**
   * Get cover letter by ID
   */
  getCoverLetter(coverLetterId: string) {
    try {
      const stmt = db.prepare('SELECT * FROM cover_letters WHERE id = ?');
      const result = stmt.get(coverLetterId) as any;

      if (result) {
        return {
          id: result.id,
          userId: result.user_id,
          jobPostingId: result.job_posting_id,
          content: result.content,
          tone: result.tone,
          qualityScore: result.quality_score,
          createdAt: result.created_at
        };
      }
      return null;
    } catch (error) {
      console.error('[CoverLetterGeneratorService] Error getting cover letter:', error);
      throw error;
    }
  }

  /**
   * Get all cover letters for user
   */
  getUserCoverLetters(userId: string) {
    try {
      const stmt = db.prepare(
        'SELECT * FROM cover_letters WHERE user_id = ? ORDER BY created_at DESC'
      );
      const results = stmt.all(userId) as any[];

      return results.map(result => ({
        id: result.id,
        jobPostingId: result.job_posting_id,
        tone: result.tone,
        qualityScore: result.quality_score,
        createdAt: result.created_at
      }));
    } catch (error) {
      console.error('[CoverLetterGeneratorService] Error getting user cover letters:', error);
      throw error;
    }
  }

  /**
   * Delete cover letter
   */
  deleteCoverLetter(coverLetterId: string): boolean {
    try {
      const stmt = db.prepare('DELETE FROM cover_letters WHERE id = ?');
      const result = stmt.run(coverLetterId);
      return result.changes > 0;
    } catch (error) {
      console.error('[CoverLetterGeneratorService] Error deleting cover letter:', error);
      throw error;
    }
  }
}

export const coverLetterGeneratorService = new CoverLetterGeneratorService();
