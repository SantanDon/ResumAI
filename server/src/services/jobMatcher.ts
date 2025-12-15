import { SwarmOrchestrator } from '../swarm/orchestrator';
import { MasterCVEntry } from '../db';
import { industryProfileService } from './industryProfiles';

export interface JobRequirements {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  keywords: string[];
  experienceLevel: string;
  industry: string;
}

export interface MatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  relevantExperiences: string[];
  keywordMatches: string[];
  recommendations: string[];
}

export interface RankedExperience {
  content: string;
  relevanceScore: number;
  matchedKeywords: string[];
}

class JobMatcherService {
  private swarm: SwarmOrchestrator;

  constructor(workerCount: number = 3) {
    this.swarm = new SwarmOrchestrator(workerCount);
  }

  /**
   * Extract requirements from a job description using AI
   */
  async extractRequirements(jobDescription: string): Promise<JobRequirements> {
    const prompt = `Analyze this job description and extract key information.

Job Description:
"${jobDescription.slice(0, 2000)}"

Extract and return in this exact format:
TITLE: [job title]
COMPANY: [company name or "Unknown"]
REQUIRED_SKILLS: [comma-separated list of required skills]
PREFERRED_SKILLS: [comma-separated list of preferred/nice-to-have skills]
RESPONSIBILITIES: [comma-separated list of key responsibilities]
KEYWORDS: [comma-separated list of important keywords/technologies]
EXPERIENCE_LEVEL: [entry/mid/senior/lead/executive]
INDUSTRY: [technology/finance/healthcare/marketing/engineering/education/legal/other]`;

    try {
      const response = await this.swarm.runAtomicTask(prompt);
      return this.parseRequirementsResponse(response, jobDescription);
    } catch (error) {
      console.error('Error extracting requirements:', error);
      return this.fallbackExtraction(jobDescription);
    }
  }

  /**
   * Parse AI response into JobRequirements
   */
  private parseRequirementsResponse(response: string, originalText: string): JobRequirements {
    const extractField = (field: string): string => {
      const regex = new RegExp(`${field}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 'is');
      const match = response.match(regex);
      return match ? match[1].trim() : '';
    };

    const parseList = (value: string): string[] => {
      return value
        .split(/[,;]/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.toLowerCase() !== 'none' && s.toLowerCase() !== 'n/a');
    };

    return {
      title: extractField('TITLE') || 'Unknown Position',
      company: extractField('COMPANY') || 'Unknown Company',
      requiredSkills: parseList(extractField('REQUIRED_SKILLS')),
      preferredSkills: parseList(extractField('PREFERRED_SKILLS')),
      responsibilities: parseList(extractField('RESPONSIBILITIES')),
      keywords: parseList(extractField('KEYWORDS')),
      experienceLevel: extractField('EXPERIENCE_LEVEL') || 'mid',
      industry: extractField('INDUSTRY') || 'technology'
    };
  }

  /**
   * Fallback extraction using regex patterns
   */
  private fallbackExtraction(jobDescription: string): JobRequirements {
    const text = jobDescription.toLowerCase();
    
    // Common skill patterns
    const skillPatterns = [
      /javascript|typescript|python|java|c\+\+|c#|ruby|go|rust|php|swift|kotlin/gi,
      /react|angular|vue|node\.?js|express|django|flask|spring|\.net/gi,
      /aws|azure|gcp|docker|kubernetes|terraform|jenkins|ci\/cd/gi,
      /sql|mysql|postgresql|mongodb|redis|elasticsearch/gi,
      /machine learning|ai|data science|analytics|tableau|power bi/gi
    ];

    const extractedSkills: string[] = [];
    for (const pattern of skillPatterns) {
      const matches = jobDescription.match(pattern) || [];
      extractedSkills.push(...matches.map(m => m.toLowerCase()));
    }

    // Detect experience level
    let experienceLevel = 'mid';
    if (/senior|sr\.|lead|principal|staff/i.test(text)) experienceLevel = 'senior';
    else if (/junior|jr\.|entry|graduate|intern/i.test(text)) experienceLevel = 'entry';
    else if (/director|vp|head of|executive/i.test(text)) experienceLevel = 'executive';

    // Detect industry
    let industry = 'technology';
    if (/healthcare|medical|hospital|clinical/i.test(text)) industry = 'healthcare';
    else if (/finance|banking|investment|trading/i.test(text)) industry = 'finance';
    else if (/marketing|advertising|brand|campaign/i.test(text)) industry = 'marketing';
    else if (/legal|law|attorney|counsel/i.test(text)) industry = 'legal';
    else if (/education|teaching|academic|university/i.test(text)) industry = 'education';

    return {
      title: 'Unknown Position',
      company: 'Unknown Company',
      requiredSkills: [...new Set(extractedSkills)].slice(0, 10),
      preferredSkills: [],
      responsibilities: [],
      keywords: [...new Set(extractedSkills)],
      experienceLevel,
      industry
    };
  }

  /**
   * Calculate match score between CV and job requirements
   */
  calculateMatch(entries: MasterCVEntry[], requirements: JobRequirements): MatchResult {
    const cvContent = entries.map(e => e.content.toLowerCase()).join(' ');
    const cvSkills = entries
      .filter(e => e.section_type === 'skill')
      .map(e => e.content.toLowerCase());

    // Match required skills
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const skill of requirements.requiredSkills) {
      const normalizedSkill = skill.toLowerCase();
      if (cvContent.includes(normalizedSkill) || 
          cvSkills.some(s => s.includes(normalizedSkill) || normalizedSkill.includes(s))) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }

    // Match preferred skills
    for (const skill of requirements.preferredSkills) {
      const normalizedSkill = skill.toLowerCase();
      if (cvContent.includes(normalizedSkill) || 
          cvSkills.some(s => s.includes(normalizedSkill))) {
        matchedSkills.push(skill);
      }
    }

    // Match keywords
    const keywordMatches = requirements.keywords.filter(kw =>
      cvContent.includes(kw.toLowerCase())
    );

    // Find relevant experiences
    const experienceEntries = entries.filter(e => 
      e.section_type === 'unknown' || e.section_type === 'experience'
    );
    const relevantExperiences = experienceEntries
      .filter(e => {
        const content = e.content.toLowerCase();
        return requirements.keywords.some(kw => content.includes(kw.toLowerCase())) ||
               requirements.requiredSkills.some(s => content.includes(s.toLowerCase()));
      })
      .map(e => e.content)
      .slice(0, 5);

    // Calculate match score
    const requiredWeight = 0.6;
    const preferredWeight = 0.2;
    const keywordWeight = 0.2;

    const requiredScore = requirements.requiredSkills.length > 0
      ? (matchedSkills.filter(s => requirements.requiredSkills.includes(s)).length / requirements.requiredSkills.length)
      : 1;

    const preferredScore = requirements.preferredSkills.length > 0
      ? (matchedSkills.filter(s => requirements.preferredSkills.includes(s)).length / requirements.preferredSkills.length)
      : 1;

    const keywordScore = requirements.keywords.length > 0
      ? (keywordMatches.length / requirements.keywords.length)
      : 1;

    const matchScore = Math.round(
      (requiredScore * requiredWeight + preferredScore * preferredWeight + keywordScore * keywordWeight) * 100
    );

    // Generate recommendations
    const recommendations: string[] = [];
    if (matchScore < 60) {
      recommendations.push('Consider gaining experience in: ' + missingSkills.slice(0, 3).join(', '));
    }
    if (missingSkills.length > 0) {
      recommendations.push('Add these skills to your CV if you have them: ' + missingSkills.slice(0, 5).join(', '));
    }
    if (keywordMatches.length < requirements.keywords.length / 2) {
      recommendations.push('Include more relevant keywords from the job description');
    }

    return {
      matchScore,
      matchedSkills: [...new Set(matchedSkills)],
      missingSkills,
      relevantExperiences,
      keywordMatches,
      recommendations
    };
  }

  /**
   * Rank experiences by relevance to job requirements
   */
  rankExperiences(entries: MasterCVEntry[], requirements: JobRequirements): RankedExperience[] {
    const experienceEntries = entries.filter(e => 
      e.section_type === 'unknown' || e.section_type === 'experience'
    );

    const allKeywords = [
      ...requirements.requiredSkills,
      ...requirements.preferredSkills,
      ...requirements.keywords
    ].map(k => k.toLowerCase());

    const ranked: RankedExperience[] = experienceEntries.map(entry => {
      const content = entry.content.toLowerCase();
      const matchedKeywords = allKeywords.filter(kw => content.includes(kw));
      
      // Calculate relevance score
      let relevanceScore = matchedKeywords.length * 10;
      
      // Bonus for required skills
      const requiredMatches = requirements.requiredSkills.filter(s => 
        content.includes(s.toLowerCase())
      );
      relevanceScore += requiredMatches.length * 20;

      // Bonus for quantification
      if (/\d+%|\$[\d,]+|\d+\s*(million|billion|thousand)/i.test(entry.content)) {
        relevanceScore += 15;
      }

      return {
        content: entry.content,
        relevanceScore,
        matchedKeywords
      };
    });

    // Sort by relevance score descending
    ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return ranked;
  }

  /**
   * Get skill development suggestions based on job requirements
   */
  getSkillDevelopmentSuggestions(
    entries: MasterCVEntry[], 
    requirements: JobRequirements
  ): string[] {
    const matchResult = this.calculateMatch(entries, requirements);
    const suggestions: string[] = [];

    // Prioritize missing required skills
    for (const skill of matchResult.missingSkills.slice(0, 3)) {
      suggestions.push(`Learn ${skill} - this is a required skill for this role`);
    }

    // Suggest certifications based on industry
    const profile = industryProfileService.getProfile(requirements.industry);
    if (profile) {
      const currentCerts = entries
        .filter(e => e.section_type === 'certification')
        .map(e => e.content.toLowerCase());
      
      const suggestedCerts = profile.certifications.filter(cert =>
        !currentCerts.some(cc => cc.includes(cert.toLowerCase()))
      ).slice(0, 2);

      for (const cert of suggestedCerts) {
        suggestions.push(`Consider obtaining: ${cert}`);
      }
    }

    return suggestions;
  }
}

// Export singleton instance
export const jobMatcherService = new JobMatcherService();
export default jobMatcherService;
