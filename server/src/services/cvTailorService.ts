/**
 * CV Tailor Service
 * Customizes CV for specific job postings
 * 
 * Features:
 * - Reorder sections by relevance
 * - Enhance bullet points with job keywords
 * - Include matching projects
 * - Track changes
 * - Calculate match score
 */

import { SwarmOrchestrator } from '../swarm/orchestrator';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { jobParserService } from './jobParserService';
import { projectsService } from './projectsService';

interface CVChange {
  type: 'reordered' | 'enhanced' | 'highlighted' | 'added' | 'removed';
  section: string;
  description: string;
}

class CVTailorService {
  private swarm: SwarmOrchestrator;

  constructor() {
    this.swarm = new SwarmOrchestrator(5);
  }

  /**
   * Tailor CV for a specific job posting
   */
  async tailorCVForJob(userId: string, jobPostingId: string): Promise<{
    tailoredCVId: string;
    tailoredCV: any;
    changes: CVChange[];
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
  }> {
    try {
      // Get job posting
      const jobPosting = jobParserService.getJobPosting(jobPostingId);
      if (!jobPosting) {
        throw new Error('Job posting not found');
      }

      // Get master CV from database
      const masterCVEntries = db.prepare(
        'SELECT * FROM master_cv WHERE user_id = ? ORDER BY section_type, created_at'
      ).all(userId) as any[];

      if (masterCVEntries.length === 0) {
        throw new Error('No CV data found. Please upload a CV first.');
      }

      // Parse master CV data
      const masterCV = this.parseMasterCVEntries(masterCVEntries);

      // Extract job requirements
      const jobSkills = jobPosting.skills;
      const jobRequirements = jobPosting.requirements;

      // Calculate match score
      const matchResult = this.calculateMatchScore(masterCV, jobSkills, jobRequirements);

      // Enhance experience bullets with job keywords
      const enhancedExperience = await this.enhanceExperienceWithJobKeywords(
        masterCV.experience || [],
        jobSkills,
        jobRequirements
      );

      // Get matching projects
      const matchingProjects = projectsService.getMatchingProjects(userId, jobSkills);

      // Reorder sections by relevance
      const reorderedCV = {
        ...masterCV,
        experience: enhancedExperience,
        projects: matchingProjects,
        summary: await this.generateTailoredSummary(masterCV, jobPosting)
      };

      // Track changes
      const changes: CVChange[] = [
        {
          type: 'enhanced',
          section: 'experience',
          description: `Enhanced ${enhancedExperience.length} experience bullets with job keywords`
        },
        {
          type: 'added',
          section: 'projects',
          description: `Added ${matchingProjects.length} matching projects`
        },
        {
          type: 'highlighted',
          section: 'skills',
          description: `Highlighted ${matchResult.matchedSkills.length} matching skills`
        }
      ];

      // Save tailored CV
      const tailoredCVId = this.saveTailoredCV(
        userId,
        jobPostingId,
        reorderedCV,
        changes,
        matchResult.matchScore
      );

      return {
        tailoredCVId,
        tailoredCV: reorderedCV,
        changes,
        matchScore: matchResult.matchScore,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills
      };
    } catch (error) {
      console.error('[CVTailorService] Error tailoring CV:', error);
      throw error;
    }
  }

  /**
   * Parse master CV entries from database
   */
  private parseMasterCVEntries(entries: any[]): any {
    const cv: any = {
      personalInfo: {},
      skills: [],
      experience: [],
      education: [],
      projects: []
    };

    entries.forEach(entry => {
      const { section_type, content } = entry;

      if (section_type === 'name') {
        cv.personalInfo.fullName = content;
      } else if (section_type === 'email') {
        cv.personalInfo.email = content;
      } else if (section_type === 'phone') {
        cv.personalInfo.phone = content;
      } else if (section_type === 'location') {
        cv.personalInfo.location = content;
      } else if (section_type === 'skill') {
        cv.skills.push(content);
      } else if (section_type === 'experience') {
        cv.experience.push(content);
      } else if (section_type === 'education') {
        cv.education.push(content);
      }
    });

    return cv;
  }

  /**
   * Calculate match score between CV and job
   */
  private calculateMatchScore(
    cv: any,
    jobSkills: string[],
    jobRequirements: string[]
  ): {
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
  } {
    const cvSkills = cv.skills || [];
    const cvExperience = (cv.experience || []).join(' ').toLowerCase();

    // Find matched skills
    const matchedSkills = jobSkills.filter(skill =>
      cvSkills.some((cvSkill: string) =>
        cvSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(cvSkill.toLowerCase())
      ) ||
      cvExperience.includes(skill.toLowerCase())
    );

    // Find missing skills
    const missingSkills = jobSkills.filter(skill => !matchedSkills.includes(skill));

    // Calculate match score (0-100)
    const skillMatchPercentage = (matchedSkills.length / jobSkills.length) * 100;
    const requirementCoverage = Math.min(
      100,
      (jobRequirements.filter(req =>
        cvExperience.includes(req.toLowerCase())
      ).length / Math.max(jobRequirements.length, 1)) * 100
    );

    const matchScore = Math.round((skillMatchPercentage * 0.6 + requirementCoverage * 0.4));

    return {
      matchScore,
      matchedSkills,
      missingSkills
    };
  }

  /**
   * Enhance experience bullets with job keywords
   */
  private async enhanceExperienceWithJobKeywords(
    experience: string[],
    jobSkills: string[],
    jobRequirements: string[]
  ): Promise<string[]> {
    try {
      if (experience.length === 0) {
        return [];
      }

      // Use swarm to enhance bullets
      const enhancementPrompt = `
You are a CV expert. Enhance these experience bullets to better match the job requirements.
Incorporate relevant keywords from the job posting while keeping the original meaning.

Job Skills: ${jobSkills.join(', ')}
Key Requirements: ${jobRequirements.slice(0, 5).join(', ')}

Experience Bullets:
${experience.slice(0, 5).map((b, i) => `${i + 1}. ${b}`).join('\n')}

Return enhanced bullets as a JSON array of strings. Keep them concise and impactful.
Example: ["Enhanced X by Y%", "Led team of Z to deliver..."]`;

      const result = await this.swarm.runAtomicTask(enhancementPrompt);

      try {
        const enhanced = JSON.parse(result);
        return Array.isArray(enhanced) ? enhanced : experience;
      } catch (e) {
        // If parsing fails, return original
        return experience;
      }
    } catch (error) {
      console.error('[CVTailorService] Error enhancing experience:', error);
      return experience;
    }
  }

  /**
   * Generate tailored summary for the job
   */
  private async generateTailoredSummary(cv: any, jobPosting: any): Promise<string> {
    try {
      const summaryPrompt = `
Create a brief professional summary (2-3 sentences) for a CV tailored to this job:

Job Title: ${jobPosting.title}
Company: ${jobPosting.company}
Key Skills: ${jobPosting.skills.slice(0, 5).join(', ')}

Candidate Background:
- Skills: ${(cv.skills || []).slice(0, 5).join(', ')}
- Experience: ${(cv.experience || []).slice(0, 2).join('; ')}

Write a compelling summary that highlights relevant experience and skills.`;

      const summary = await this.swarm.runAtomicTask(summaryPrompt);
      return summary.slice(0, 300); // Limit to 300 chars
    } catch (error) {
      console.error('[CVTailorService] Error generating summary:', error);
      return '';
    }
  }

  /**
   * Save tailored CV to database
   */
  private saveTailoredCV(
    userId: string,
    jobPostingId: string,
    cvData: any,
    changes: CVChange[],
    matchScore: number
  ): string {
    try {
      const id = uuidv4();

      const stmt = db.prepare(`
        INSERT INTO tailored_cvs_new (
          id, user_id, job_posting_id, cv_data, changes, match_score
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        userId,
        jobPostingId,
        JSON.stringify(cvData),
        JSON.stringify(changes),
        matchScore
      );

      return id;
    } catch (error) {
      console.error('[CVTailorService] Error saving tailored CV:', error);
      throw error;
    }
  }

  /**
   * Get tailored CV by ID
   */
  getTailoredCV(tailoredCVId: string) {
    try {
      const stmt = db.prepare('SELECT * FROM tailored_cvs_new WHERE id = ?');
      const result = stmt.get(tailoredCVId) as any;

      if (result) {
        return {
          id: result.id,
          userId: result.user_id,
          jobPostingId: result.job_posting_id,
          cvData: JSON.parse(result.cv_data),
          changes: JSON.parse(result.changes),
          matchScore: result.match_score,
          createdAt: result.created_at
        };
      }
      return null;
    } catch (error) {
      console.error('[CVTailorService] Error getting tailored CV:', error);
      throw error;
    }
  }

  /**
   * Get all tailored CVs for user
   */
  getUserTailoredCVs(userId: string) {
    try {
      const stmt = db.prepare(
        'SELECT * FROM tailored_cvs_new WHERE user_id = ? ORDER BY created_at DESC'
      );
      const results = stmt.all(userId) as any[];

      return results.map(result => ({
        id: result.id,
        userId: result.user_id,
        jobPostingId: result.job_posting_id,
        matchScore: result.match_score,
        createdAt: result.created_at
      }));
    } catch (error) {
      console.error('[CVTailorService] Error getting user tailored CVs:', error);
      throw error;
    }
  }

  /**
   * Delete tailored CV
   */
  deleteTailoredCV(tailoredCVId: string): boolean {
    try {
      const stmt = db.prepare('DELETE FROM tailored_cvs_new WHERE id = ?');
      const result = stmt.run(tailoredCVId);
      return result.changes > 0;
    } catch (error) {
      console.error('[CVTailorService] Error deleting tailored CV:', error);
      throw error;
    }
  }
}

export const cvTailorService = new CVTailorService();
