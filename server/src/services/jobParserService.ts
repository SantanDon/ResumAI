/**
 * Job Parser Service
 * Extracts structured data from job posting text using LLM
 */

import { SwarmOrchestrator } from '../swarm/orchestrator';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

interface ParsedJobData {
  title: string;
  company: string;
  location: string;
  salary?: string;
  requirements: string[];
  skills: string[];
  recruiterEmail?: string;
}

class JobParserService {
  private swarm: SwarmOrchestrator;

  constructor() {
    this.swarm = new SwarmOrchestrator(5);
  }

  /**
   * Parse job posting text and extract structured data
   */
  async parseJobPosting(jobText: string): Promise<ParsedJobData> {
    try {
      // Use swarm to extract job information with consensus voting
      const extractionPrompt = `
Extract the following information from this job posting. Return as JSON:
{
  "title": "Job title",
  "company": "Company name",
  "location": "Location or 'Remote'",
  "salary": "Salary range if available",
  "requirements": ["requirement 1", "requirement 2", ...],
  "skills": ["skill 1", "skill 2", ...],
  "recruiterEmail": "email if available"
}

Job Posting:
${jobText.slice(0, 2000)}

Return ONLY valid JSON, no other text.`;

      const result = await this.swarm.runAtomicTask(extractionPrompt);
      
      // Parse the JSON response
      let parsed: ParsedJobData;
      try {
        parsed = JSON.parse(result);
      } catch (e) {
        // If JSON parsing fails, try to extract from the text
        parsed = this.fallbackParse(jobText);
      }

      return parsed;
    } catch (error) {
      console.error('[JobParserService] Error parsing job posting:', error);
      throw error;
    }
  }

  /**
   * Fallback parsing when LLM fails
   */
  private fallbackParse(jobText: string): ParsedJobData {
    // Extract title (usually in first line or after "Position:" or "Job Title:")
    const titleMatch = jobText.match(/(?:Position|Job Title|Role):\s*([^\n]+)/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown Position';

    // Extract company
    const companyMatch = jobText.match(/(?:Company|Employer):\s*([^\n]+)/i);
    const company = companyMatch ? companyMatch[1].trim() : 'Unknown Company';

    // Extract location
    const locationMatch = jobText.match(/(?:Location|Based):\s*([^\n]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : 'Not specified';

    // Extract salary
    const salaryMatch = jobText.match(/(?:Salary|Compensation):\s*([^\n]+)/i);
    const salary = salaryMatch ? salaryMatch[1].trim() : undefined;

    // Extract email
    const emailMatch = jobText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const recruiterEmail = emailMatch ? emailMatch[1] : undefined;

    // Extract requirements and skills (simple heuristic)
    const requirements: string[] = [];
    const skills: string[] = [];

    // Look for common skill keywords
    const skillKeywords = [
      'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'C++', 'Go', 'Rust',
      'PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
      'Git', 'REST API', 'GraphQL', 'SQL', 'HTML', 'CSS', 'JavaScript', 'Vue',
      'Angular', 'Express', 'Django', 'Flask', 'Spring', 'Microservices', 'CI/CD'
    ];

    skillKeywords.forEach(skill => {
      if (jobText.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    // Extract requirements (lines with bullets or numbers)
    const lines = jobText.split('\n');
    lines.forEach(line => {
      if (line.match(/^[\s]*[-•*]\s+/) || line.match(/^[\s]*\d+\.\s+/)) {
        const req = line.replace(/^[\s]*[-•*\d.]\s+/, '').trim();
        if (req.length > 10) {
          requirements.push(req);
        }
      }
    });

    return {
      title,
      company,
      location,
      salary,
      requirements: requirements.slice(0, 10),
      skills: [...new Set(skills)], // Remove duplicates
      recruiterEmail
    };
  }

  /**
   * Save parsed job posting to database
   */
  async saveJobPosting(userId: string, jobText: string): Promise<string> {
    try {
      const parsed = await this.parseJobPosting(jobText);
      const id = uuidv4();

      const stmt = db.prepare(`
        INSERT INTO job_postings (
          id, user_id, title, company, location, salary,
          requirements, skills, recruiter_email, raw_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        userId,
        parsed.title,
        parsed.company,
        parsed.location,
        parsed.salary || null,
        JSON.stringify(parsed.requirements),
        JSON.stringify(parsed.skills),
        parsed.recruiterEmail || null,
        jobText
      );

      return id;
    } catch (error) {
      console.error('[JobParserService] Error saving job posting:', error);
      throw error;
    }
  }

  /**
   * Get job posting by ID
   */
  getJobPosting(jobId: string) {
    try {
      const stmt = db.prepare('SELECT * FROM job_postings WHERE id = ?');
      const result = stmt.get(jobId) as any;
      
      if (result) {
        return {
          ...result,
          requirements: JSON.parse(result.requirements),
          skills: JSON.parse(result.skills)
        };
      }
      return null;
    } catch (error) {
      console.error('[JobParserService] Error getting job posting:', error);
      throw error;
    }
  }

  /**
   * Get all job postings for user
   */
  getUserJobPostings(userId: string) {
    try {
      const stmt = db.prepare('SELECT * FROM job_postings WHERE user_id = ? ORDER BY created_at DESC');
      const results = stmt.all(userId) as any[];
      
      return results.map(result => ({
        ...result,
        requirements: JSON.parse(result.requirements),
        skills: JSON.parse(result.skills)
      }));
    } catch (error) {
      console.error('[JobParserService] Error getting user job postings:', error);
      throw error;
    }
  }

  /**
   * Delete job posting
   */
  deleteJobPosting(jobId: string): boolean {
    try {
      const stmt = db.prepare('DELETE FROM job_postings WHERE id = ?');
      const result = stmt.run(jobId);
      return result.changes > 0;
    } catch (error) {
      console.error('[JobParserService] Error deleting job posting:', error);
      throw error;
    }
  }
}

export const jobParserService = new JobParserService();
