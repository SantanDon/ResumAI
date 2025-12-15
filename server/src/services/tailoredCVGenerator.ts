import { SwarmOrchestrator } from '../swarm/orchestrator';
import { MasterCVEntry, TailoredCV, db } from '../db';
import { jobMatcherService, JobRequirements, MatchResult } from './jobMatcher';
import { cvIntelligenceService } from './cvIntelligence';
import { v4 as uuidv4 } from 'uuid';

export interface TailoredCVContent {
  summary: string;
  experiences: { content: string; relevanceScore: number }[];
  skills: string[];
  education: string[];
  injectedKeywords: string[];
}

export interface GenerationResult {
  tailoredCV: TailoredCV;
  matchResult: MatchResult;
  content: TailoredCVContent;
}

class TailoredCVGeneratorService {
  private swarm: SwarmOrchestrator;

  constructor(workerCount: number = 3) {
    this.swarm = new SwarmOrchestrator(workerCount);
  }

  /**
   * Generate a tailored CV for a specific job
   */
  async generate(
    userId: string,
    entries: MasterCVEntry[],
    jobDescription: string
  ): Promise<GenerationResult> {
    // Extract job requirements
    const requirements = await jobMatcherService.extractRequirements(jobDescription);
    
    // Calculate match
    const matchResult = jobMatcherService.calculateMatch(entries, requirements);
    
    // Rank and select relevant experiences
    const rankedExperiences = jobMatcherService.rankExperiences(entries, requirements);
    const selectedExperiences = rankedExperiences.slice(0, 8); // Top 8 most relevant

    // Get skills
    const skills = entries
      .filter(e => e.section_type === 'skill')
      .map(e => e.content);

    // Prioritize matched skills
    const prioritizedSkills = [
      ...skills.filter(s => 
        matchResult.matchedSkills.some(ms => 
          s.toLowerCase().includes(ms.toLowerCase())
        )
      ),
      ...skills.filter(s => 
        !matchResult.matchedSkills.some(ms => 
          s.toLowerCase().includes(ms.toLowerCase())
        )
      )
    ];

    // Get education
    const education = entries
      .filter(e => e.section_type === 'education' || e.section_type === 'date')
      .map(e => e.content);

    // Generate tailored summary
    const summary = await this.generateTailoredSummary(entries, requirements);

    // Inject keywords naturally
    const injectedKeywords = this.identifyKeywordsToInject(
      entries,
      requirements,
      matchResult
    );

    // Create content object
    const content: TailoredCVContent = {
      summary,
      experiences: selectedExperiences.map(e => ({
        content: e.content,
        relevanceScore: e.relevanceScore
      })),
      skills: prioritizedSkills,
      education,
      injectedKeywords
    };

    // Calculate ATS score
    const allContent = [
      summary,
      ...selectedExperiences.map(e => e.content),
      ...prioritizedSkills,
      ...education
    ].join('\n');
    
    const cvAnalysis = cvIntelligenceService.analyzeCV(entries, requirements.industry);
    const atsScore = cvAnalysis.atsCompatibility;

    // Create tailored CV record
    const tailoredCV: TailoredCV = {
      id: uuidv4(),
      user_id: userId,
      master_cv_version: null,
      job_title: requirements.title,
      company: requirements.company,
      job_description: jobDescription.slice(0, 5000),
      match_score: matchResult.matchScore,
      ats_score: atsScore,
      content: JSON.stringify(content),
      injected_keywords: JSON.stringify(injectedKeywords),
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sent_at: null
    };

    // Save to database
    this.saveTailoredCV(tailoredCV);

    return {
      tailoredCV,
      matchResult,
      content
    };
  }

  /**
   * Generate a tailored summary for the job
   */
  private async generateTailoredSummary(
    entries: MasterCVEntry[],
    requirements: JobRequirements
  ): Promise<string> {
    const skills = entries
      .filter(e => e.section_type === 'skill')
      .map(e => e.content)
      .slice(0, 10);

    const experiences = entries
      .filter(e => e.section_type === 'unknown' || e.section_type === 'experience')
      .map(e => e.content)
      .slice(0, 3);

    const prompt = `Write a professional CV summary (2-3 sentences) for a ${requirements.title} position at ${requirements.company}.

Candidate's skills: ${skills.join(', ')}
Key experiences: ${experiences.join('; ')}
Required skills for the job: ${requirements.requiredSkills.join(', ')}

Requirements:
1. Highlight relevant skills that match the job
2. Be specific and quantifiable where possible
3. Show value proposition
4. Keep it under 50 words
5. Do NOT fabricate information

Summary:`;

    try {
      const summary = await this.swarm.runAtomicTask(prompt);
      return summary.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      // Fallback to generic summary
      return `Experienced professional with expertise in ${skills.slice(0, 3).join(', ')}. Proven track record of delivering results in ${requirements.industry} environments.`;
    }
  }

  /**
   * Identify keywords to inject into the CV
   */
  private identifyKeywordsToInject(
    entries: MasterCVEntry[],
    requirements: JobRequirements,
    matchResult: MatchResult
  ): string[] {
    const cvContent = entries.map(e => e.content.toLowerCase()).join(' ');
    
    // Find keywords from job that aren't already in CV but could be added
    const potentialKeywords = [
      ...requirements.keywords,
      ...requirements.requiredSkills
    ].filter(kw => {
      const normalized = kw.toLowerCase();
      // Only inject if not already present but related content exists
      return !cvContent.includes(normalized) && 
             matchResult.matchedSkills.some(ms => 
               ms.toLowerCase().includes(normalized.split(' ')[0]) ||
               normalized.includes(ms.toLowerCase().split(' ')[0])
             );
    });

    return potentialKeywords.slice(0, 5);
  }

  /**
   * Save tailored CV to database
   */
  private saveTailoredCV(cv: TailoredCV): void {
    try {
      const stmt = db.prepare(`
        INSERT INTO tailored_cvs (
          id, user_id, master_cv_version, job_title, company, 
          job_description, match_score, ats_score, content, 
          injected_keywords, status, created_at, updated_at, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        cv.id,
        cv.user_id,
        cv.master_cv_version,
        cv.job_title,
        cv.company,
        cv.job_description,
        cv.match_score,
        cv.ats_score,
        cv.content,
        cv.injected_keywords,
        cv.status,
        cv.created_at,
        cv.updated_at,
        cv.sent_at
      );
    } catch (error) {
      console.error('Error saving tailored CV:', error);
    }
  }

  /**
   * Get all tailored CVs for a user
   */
  getTailoredCVs(userId: string): TailoredCV[] {
    try {
      const stmt = db.prepare(`
        SELECT * FROM tailored_cvs 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `);
      return stmt.all(userId) as TailoredCV[];
    } catch (error) {
      console.error('Error fetching tailored CVs:', error);
      return [];
    }
  }

  /**
   * Get a specific tailored CV
   */
  getTailoredCV(cvId: string): TailoredCV | null {
    try {
      const stmt = db.prepare('SELECT * FROM tailored_cvs WHERE id = ?');
      return stmt.get(cvId) as TailoredCV | null;
    } catch (error) {
      console.error('Error fetching tailored CV:', error);
      return null;
    }
  }

  /**
   * Update tailored CV status
   */
  updateStatus(cvId: string, status: 'draft' | 'ready' | 'sent'): void {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'sent') {
        updates.sent_at = new Date().toISOString();
      }

      const stmt = db.prepare(`
        UPDATE tailored_cvs 
        SET status = ?, updated_at = ?${status === 'sent' ? ', sent_at = ?' : ''}
        WHERE id = ?
      `);

      if (status === 'sent') {
        stmt.run(updates.status, updates.updated_at, updates.sent_at, cvId);
      } else {
        stmt.run(updates.status, updates.updated_at, cvId);
      }
    } catch (error) {
      console.error('Error updating tailored CV status:', error);
    }
  }

  /**
   * Delete a tailored CV
   */
  deleteTailoredCV(cvId: string): void {
    try {
      const stmt = db.prepare('DELETE FROM tailored_cvs WHERE id = ?');
      stmt.run(cvId);
    } catch (error) {
      console.error('Error deleting tailored CV:', error);
    }
  }

  /**
   * Generate PDF filename
   */
  generateFilename(cv: TailoredCV, fullName: string): string {
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const date = new Date().toISOString().split('T')[0];
    return `${sanitize(fullName)}_${sanitize(cv.company)}_${date}.pdf`;
  }
}

// Export singleton instance
export const tailoredCVGeneratorService = new TailoredCVGeneratorService();
export default tailoredCVGeneratorService;
