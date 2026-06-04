/**
 * Cover Letter Generator Service
 * Generates natural, human-sounding cover letters based on user CV and job details
 * Uses natural writing principles - no AI buzzwords, conversational tone
 */

import { db } from '../db';
import { SwarmOrchestrator } from '../swarm/orchestrator';

const swarm = new SwarmOrchestrator(3); // Use 3 workers for faster generation

// Natural writing system prompt
const NATURAL_WRITING_PROMPT = `
You are a professional cover letter writer. Write in a natural, human voice.

CRITICAL RULES - Follow these exactly:

LANGUAGE:
- Use simple, direct words. Write like you are talking to a colleague you respect.
- Keep sentences punchy. Break up complex ideas.
- Be direct. Say what you mean without corporate fluff.
- It's fine to start sentences with "and," "but," or "so".

NEVER USE THESE AI BUZZWORDS:
- "dive into" / "deep dive"
- "unleash" / "unlock potential"
- "game-changing" / "revolutionary" / "transformative"
- "synergy" / "leverage" / "optimize"
- "I am excited to apply" / "I am thrilled to apply"
- "I believe I would be a great fit" (generic)
- "passionate about" (overused)

CONTENT TO INCLUDE (Recruiter Eye Candy & Market Analytics):
1. **T-Shaped Stack Depth**: Show that you have broad developer skills but focus deeply on a specific core competency (e.g. distributed backend APIs, frontend component styling, database speed).
2. **AI Developer Velocity**: Explicitly mention how you use AI coding assistants and automation to ship features twice as fast without compromising safety.
3. **Remote & Async Mastery**: Talk about how you operate independently in remote teams using written docs and async collaboration.
4. **Quantified Business Metrics**: Always frame achievements with numbers (e.g., cut API delays by 40%, saved 25% on cloud costs).

FORMAT:
- Opening: Centered on the company and why their specific challenges or product caught your eye (2-3 sentences).
- Middle: 2 paragraphs detailing your specific projects, highlighting T-shaped depth, AI velocity, and business-focused metrics (4-6 sentences each).
- Closing: A simple, direct call to action (1-2 sentences).
`;

export interface CoverLetterRequest {
  userId: string;
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  keyRequirements?: string[];
  tone?: 'professional' | 'casual' | 'confident';
}

export interface CoverLetterResult {
  coverLetter: string;
  wordCount: number;
  matchedSkills: string[];
  suggestions?: string[];
}

class CoverLetterGeneratorService {
  /**
   * Generate a cover letter based on user's CV and job details
   */
  async generateCoverLetter(request: CoverLetterRequest): Promise<CoverLetterResult> {
    const { userId, jobTitle, companyName, jobDescription, keyRequirements, tone = 'professional' } = request;

    // Get user's CV data from database
    const cvData = this.getUserCVData(userId);
    
    // Extract relevant experience and skills
    const relevantExperience = this.findRelevantExperience(cvData, jobDescription, keyRequirements);
    const matchedSkills = this.matchSkills(cvData.skills, keyRequirements || []);

    // Build the prompt
    const prompt = this.buildPrompt(cvData, jobTitle, companyName, jobDescription, relevantExperience, tone);

    // Generate using swarm (or fallback)
    let coverLetter: string;
    try {
      coverLetter = await swarm.runAtomicTask(prompt);
    } catch (error) {
      console.warn('[CoverLetter] Swarm unavailable, using template fallback');
      coverLetter = this.generateFallbackLetter(cvData, jobTitle, companyName, relevantExperience);
    }

    // Clean up the output
    coverLetter = this.cleanOutput(coverLetter);

    return {
      coverLetter,
      wordCount: coverLetter.split(/\s+/).length,
      matchedSkills,
      suggestions: this.generateSuggestions(coverLetter, matchedSkills)
    };
  }

  /**
   * Get user's CV data from the master_cv database
   */
  private getUserCVData(userId: string): any {
    const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
    
    const data: any = {
      name: '',
      email: '',
      phone: '',
      summary: '',
      skills: [],
      experience: [],
      education: []
    };

    for (const entry of entries) {
      const content = entry.content?.trim() || '';
      const type = entry.section_type?.toLowerCase() || '';

      if (type.includes('name')) {
        data.name = content;
      } else if (type.includes('email')) {
        data.email = content;
      } else if (type.includes('phone')) {
        data.phone = content;
      } else if (type.includes('summary')) {
        data.summary = content;
      } else if (type.includes('skill')) {
        data.skills.push(content);
      } else if (type.includes('experience') || type.includes('work')) {
        data.experience.push(content);
      } else if (type.includes('education')) {
        data.education.push(content);
      }
    }

    return data;
  }

  /**
   * Find experience entries relevant to the job
   */
  private findRelevantExperience(cvData: any, jobDescription?: string, requirements?: string[]): string[] {
    if (!jobDescription && (!requirements || requirements.length === 0)) {
      return cvData.experience.slice(0, 3);
    }

    const searchTerms = [
      ...(jobDescription?.toLowerCase().split(/\s+/) || []),
      ...(requirements?.map(r => r.toLowerCase()) || [])
    ];

    // Score each experience by relevance
    const scored = cvData.experience.map((exp: string) => {
      const expLower = exp.toLowerCase();
      const score = searchTerms.filter(term => expLower.includes(term)).length;
      return { exp, score };
    });

    // Return top 3 most relevant
    return scored
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3)
      .map((s: any) => s.exp);
  }

  /**
   * Match user skills with job requirements
   */
  private matchSkills(userSkills: string[], requirements: string[]): string[] {
    const matched: string[] = [];
    const reqLower = requirements.map(r => r.toLowerCase());

    for (const skill of userSkills) {
      const skillLower = skill.toLowerCase();
      if (reqLower.some(req => skillLower.includes(req) || req.includes(skillLower))) {
        matched.push(skill);
      }
    }

    return matched;
  }

  /**
   * Build the prompt for cover letter generation
   */
  private buildPrompt(
    cvData: any,
    jobTitle: string,
    companyName: string,
    jobDescription?: string,
    relevantExperience?: string[],
    tone: string = 'professional'
  ): string {
    const toneGuide = {
      professional: 'Keep it professional but not stiff. Like talking to a hiring manager you respect.',
      casual: 'Keep it friendly and approachable. Like emailing someone you might work with.',
      confident: 'Be direct and assured. Show you know your worth without being arrogant.'
    };

    return `${NATURAL_WRITING_PROMPT}

TONE: ${toneGuide[tone as keyof typeof toneGuide] || toneGuide.professional}

CANDIDATE INFO:
Name: ${cvData.name || 'Candidate'}
${cvData.summary ? `Background: ${cvData.summary.substring(0, 200)}` : ''}

RELEVANT EXPERIENCE:
${relevantExperience?.join('\n') || 'General professional experience'}

SKILLS: ${cvData.skills?.slice(0, 10).join(', ') || 'Various technical and professional skills'}

JOB DETAILS:
Position: ${jobTitle}
Company: ${companyName}
${jobDescription ? `Description: ${jobDescription.substring(0, 500)}` : ''}

Write a cover letter for this position. Remember:
- No AI buzzwords
- Sound human and natural
- Be specific, not generic
- Under 300 words
- Get to the point fast`;
  }

  /**
   * Generate a fallback letter when AI is unavailable
   */
  private generateFallbackLetter(
    cvData: any,
    jobTitle: string,
    companyName: string,
    relevantExperience: string[]
  ): string {
    const name = cvData.name || 'Candidate';
    const topExperience = relevantExperience[0] || 'my professional background';

    return `Hi,

I saw the ${jobTitle} position at ${companyName} and wanted to reach out.

Here's the thing - ${topExperience}. That experience taught me a lot about what it takes to deliver real results, not just check boxes.

${cvData.skills?.length > 0 ? `I've worked with ${cvData.skills.slice(0, 3).join(', ')}, and I'm always picking up new tools when the job needs it.` : ''}

I'd love to chat about how I could help ${companyName}. Let me know if you'd like to set up a quick call.

Thanks for your time,
${name}
${cvData.email || ''}
${cvData.phone || ''}`;
  }

  /**
   * Clean up the generated output
   */
  private cleanOutput(text: string): string {
    // Remove any AI-sounding phrases that slipped through
    const aiPhrases = [
      /dive into/gi,
      /deep dive/gi,
      /unleash/gi,
      /game-?changing/gi,
      /revolutionary/gi,
      /transformative/gi,
      /leverage/gi,
      /synergy/gi,
      /unlock potential/gi,
      /I am excited to/gi,
      /I am thrilled to/gi,
      /passionate about/gi,
      /I believe I would be/gi,
    ];

    let cleaned = text;
    for (const phrase of aiPhrases) {
      cleaned = cleaned.replace(phrase, '');
    }

    // Clean up double spaces and empty lines
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');

    return cleaned;
  }

  /**
   * Generate suggestions for improving the cover letter
   */
  private generateSuggestions(coverLetter: string, matchedSkills: string[]): string[] {
    const suggestions: string[] = [];

    if (coverLetter.length < 500) {
      suggestions.push('Consider adding a specific example of a project or achievement');
    }

    if (matchedSkills.length < 2) {
      suggestions.push('Try to mention more skills that match the job requirements');
    }

    if (!coverLetter.includes('$') && !coverLetter.includes('%') && !coverLetter.includes('number')) {
      suggestions.push('Adding specific numbers or metrics can make your achievements more concrete');
    }

    return suggestions;
  }

  /**
   * Quick cover letter generation with minimal input
   */
  async quickGenerate(userId: string, jobTitle: string, companyName: string): Promise<string> {
    const result = await this.generateCoverLetter({
      userId,
      jobTitle,
      companyName,
      tone: 'professional'
    });
    return result.coverLetter;
  }
}

export const coverLetterGenerator = new CoverLetterGeneratorService();
