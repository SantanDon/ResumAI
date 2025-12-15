import { SwarmOrchestrator } from '../swarm/orchestrator';
import { powerWordsService, PowerWord } from './powerWords';
import { industryProfileService } from './industryProfiles';
import { MasterCVEntry } from '../db';

export interface BulletAnalysis {
  text: string;
  actionVerbStrength: 1 | 2 | 3 | 4 | 5;
  hasQuantification: boolean;
  impactClarity: 1 | 2 | 3 | 4 | 5;
  issues: string[];
  suggestions: string[];
  weakWordsFound: string[];
  clichesFound: string[];
}

export interface CVAnalysis {
  strengthScore: number;
  completeness: number;
  powerWordUsage: number;
  quantificationRate: number;
  atsCompatibility: number;
  topExperiences: string[];
  skillGaps: string[];
  outdatedPractices: string[];
  improvements: string[];
  bulletScores: { text: string; score: number }[];
}

// Common action verbs for detecting bullet point starts
const ACTION_VERBS = [
  'achieved', 'administered', 'analyzed', 'architected', 'automated',
  'boosted', 'built', 'championed', 'coached', 'collaborated',
  'completed', 'conducted', 'configured', 'consolidated', 'coordinated',
  'created', 'debugged', 'delivered', 'deployed', 'designed',
  'developed', 'devised', 'directed', 'documented', 'doubled',
  'drove', 'educated', 'eliminated', 'empowered', 'enabled',
  'engineered', 'established', 'evaluated', 'executed', 'expanded',
  'facilitated', 'finalized', 'forecasted', 'formulated', 'founded',
  'generated', 'grew', 'guided', 'headed', 'identified',
  'implemented', 'improved', 'increased', 'influenced', 'initiated',
  'innovated', 'integrated', 'introduced', 'investigated', 'launched',
  'led', 'leveraged', 'managed', 'maximized', 'mentored',
  'migrated', 'minimized', 'mobilized', 'modernized', 'monitored',
  'negotiated', 'onboarded', 'optimized', 'orchestrated', 'organized',
  'outperformed', 'overhauled', 'partnered', 'performed', 'pioneered',
  'planned', 'presented', 'prioritized', 'produced', 'programmed',
  'promoted', 'proposed', 'provided', 'published', 'quantified',
  'raised', 'reached', 'realized', 'recommended', 'recruited',
  'redesigned', 'reduced', 'refactored', 'refined', 'reengineered',
  'reorganized', 'replaced', 'reported', 'represented', 'researched',
  'resolved', 'restructured', 'revamped', 'reviewed', 'revised',
  'saved', 'scaled', 'scheduled', 'secured', 'simplified',
  'slashed', 'solved', 'spearheaded', 'standardized', 'steered',
  'strategized', 'streamlined', 'strengthened', 'structured', 'supervised',
  'supported', 'surpassed', 'synthesized', 'tested', 'tracked',
  'trained', 'transformed', 'translated', 'tripled', 'troubleshot',
  'unified', 'upgraded', 'validated', 'verified', 'won'
];

// Outdated CV practices to detect
const OUTDATED_PRACTICES = [
  { pattern: /objective\s*:/i, message: 'Objective statements are outdated. Use a professional summary instead.' },
  { pattern: /references\s*(available\s*)?(upon\s*request|on\s*request)/i, message: '"References available upon request" is unnecessary and wastes space.' },
  { pattern: /\b(photo|picture|headshot)\b/i, message: 'Including photos is not recommended for most industries in the US.' },
  { pattern: /\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)\b/i, message: 'Full street address is unnecessary. City and state are sufficient.' },
  { pattern: /\b(microsoft\s*office|ms\s*office|word|excel|powerpoint)\b/i, message: 'Basic Microsoft Office skills are assumed. Only list if advanced.' },
  { pattern: /\b(duties\s*included|responsible\s*for)\b/i, message: 'Avoid "duties included" or "responsible for". Start with action verbs.' },
  { pattern: /\b(i\s+|my\s+|me\s+)/i, message: 'Avoid first-person pronouns (I, my, me) in CV bullet points.' }
];

class CVIntelligenceService {
  private swarm: SwarmOrchestrator;

  constructor(workerCount: number = 3) {
    this.swarm = new SwarmOrchestrator(workerCount);
  }

  /**
   * Analyze a single bullet point
   */
  analyzeBullet(bullet: string): BulletAnalysis {
    const text = bullet.trim();
    const words = text.toLowerCase().split(/\s+/);
    const firstWord = words[0]?.replace(/[^a-z]/g, '') || '';

    // Check action verb strength
    let actionVerbStrength: 1 | 2 | 3 | 4 | 5 = 1;
    const powerWordStrength = powerWordsService.getStrength(firstWord);
    if (powerWordStrength > 0) {
      actionVerbStrength = powerWordStrength as 1 | 2 | 3 | 4 | 5;
    } else if (ACTION_VERBS.includes(firstWord)) {
      actionVerbStrength = 3;
    }

    // Check for quantification (numbers, percentages, dollar amounts)
    const hasQuantification = /\d+%|\$[\d,]+|\d+\s*(million|billion|thousand|k\b|m\b)|increased\s*by\s*\d|reduced\s*by\s*\d|\d+\s*(users|customers|clients|projects|team\s*members)/i.test(text);

    // Analyze impact clarity (1-5 based on specificity)
    let impactClarity: 1 | 2 | 3 | 4 | 5 = 2;
    if (hasQuantification) impactClarity = Math.min(5, impactClarity + 2) as 1 | 2 | 3 | 4 | 5;
    if (text.length > 50 && text.length < 150) impactClarity = Math.min(5, impactClarity + 1) as 1 | 2 | 3 | 4 | 5;
    if (/resulting\s*in|leading\s*to|which\s*(led|resulted)|achieving/i.test(text)) {
      impactClarity = Math.min(5, impactClarity + 1) as 1 | 2 | 3 | 4 | 5;
    }

    // Find issues
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check if starts with action verb
    if (!ACTION_VERBS.includes(firstWord) && powerWordStrength === 0) {
      issues.push('Bullet point should start with a strong action verb');
      const suggestion = powerWordsService.getBestReplacement(firstWord);
      if (suggestion) {
        suggestions.push(`Consider starting with "${suggestion.word}" instead of "${firstWord}"`);
      }
    }

    // Check for weak words
    const textAnalysis = powerWordsService.analyzeText(text);
    if (textAnalysis.weakWordsFound.length > 0) {
      issues.push(`Contains weak words: ${textAnalysis.weakWordsFound.join(', ')}`);
      for (const { weakWord, replacements } of textAnalysis.suggestions) {
        if (replacements.length > 0) {
          suggestions.push(`Replace "${weakWord}" with "${replacements[0].word}"`);
        }
      }
    }

    // Check for clichés
    if (textAnalysis.clichesFound.length > 0) {
      issues.push(`Contains clichés: ${textAnalysis.clichesFound.join(', ')}`);
      suggestions.push('Remove clichés and use specific, measurable achievements');
    }

    // Check for quantification
    if (!hasQuantification) {
      issues.push('Missing quantifiable metrics');
      suggestions.push('Add specific numbers, percentages, or dollar amounts to demonstrate impact');
    }

    // Check length
    if (text.length < 30) {
      issues.push('Bullet point is too short');
      suggestions.push('Expand with more detail about your impact and results');
    } else if (text.length > 200) {
      issues.push('Bullet point is too long');
      suggestions.push('Consider breaking into multiple bullet points or condensing');
    }

    return {
      text,
      actionVerbStrength,
      hasQuantification,
      impactClarity,
      issues,
      suggestions,
      weakWordsFound: textAnalysis.weakWordsFound,
      clichesFound: textAnalysis.clichesFound
    };
  }

  /**
   * Enhance a bullet point using AI
   */
  async enhanceBullet(bullet: string, industry?: string): Promise<string> {
    const analysis = this.analyzeBullet(bullet);
    
    const industryContext = industry 
      ? `for the ${industry} industry` 
      : '';

    const prompt = `You are a 2025 Career Strategist. Rewrite this CV bullet point to be more impactful ${industryContext}.

Original: "${bullet}"

Requirements:
1. Start with a strong action verb
2. Include quantifiable metrics if possible (suggest placeholders like [X%] if unknown)
3. Show clear impact/results
4. Keep it concise (under 150 characters)
5. Remove any clichés or weak words
6. Do NOT fabricate facts - only enhance the language

Improved bullet point:`;

    try {
      const enhanced = await this.swarm.runAtomicTask(prompt);
      return enhanced.trim();
    } catch (error) {
      console.error('Error enhancing bullet:', error);
      return bullet; // Return original if enhancement fails
    }
  }

  /**
   * Score a bullet point (1-5)
   */
  scoreBullet(bullet: string): number {
    const analysis = this.analyzeBullet(bullet);
    
    let score = 0;
    score += analysis.actionVerbStrength; // 1-5
    score += analysis.hasQuantification ? 5 : 0;
    score += analysis.impactClarity; // 1-5
    score -= analysis.issues.length; // Penalty for issues
    score -= analysis.clichesFound.length * 2; // Extra penalty for clichés

    // Normalize to 1-5 scale
    const normalizedScore = Math.max(1, Math.min(5, Math.round(score / 3)));
    return normalizedScore;
  }

  /**
   * Detect outdated practices in CV text
   */
  detectOutdatedPractices(cvText: string): string[] {
    const found: string[] = [];
    
    for (const { pattern, message } of OUTDATED_PRACTICES) {
      if (pattern.test(cvText)) {
        found.push(message);
      }
    }

    return found;
  }

  /**
   * Calculate CV strength score (0-100)
   */
  calculateStrengthScore(entries: MasterCVEntry[], industry?: string): number {
    let score = 0;
    const maxScore = 100;

    // Completeness (30 points)
    const sectionTypes = new Set(entries.map(e => e.section_type));
    const requiredSections = ['email', 'phone', 'skill', 'experience', 'education'];
    const presentSections = requiredSections.filter(s => 
      entries.some(e => e.section_type.toLowerCase().includes(s))
    );
    score += (presentSections.length / requiredSections.length) * 30;

    // Content quality (40 points)
    const allContent = entries.map(e => e.content).join(' ');
    
    // Power word usage
    const words = allContent.toLowerCase().split(/\s+/);
    const powerWordCount = words.filter(w => powerWordsService.getStrength(w) > 0).length;
    const powerWordRatio = Math.min(1, powerWordCount / 20); // Cap at 20 power words
    score += powerWordRatio * 15;

    // Quantification
    const quantificationMatches = allContent.match(/\d+%|\$[\d,]+|\d+\s*(million|billion|thousand)/gi) || [];
    const quantificationScore = Math.min(1, quantificationMatches.length / 5) * 15;
    score += quantificationScore;

    // No outdated practices
    const outdatedPractices = this.detectOutdatedPractices(allContent);
    score += Math.max(0, 10 - outdatedPractices.length * 2);

    // Industry alignment (30 points)
    if (industry) {
      const profile = industryProfileService.getProfile(industry);
      if (profile) {
        const keywords = profile.keywords;
        const matchedKeywords = keywords.filter(kw => 
          allContent.toLowerCase().includes(kw.toLowerCase())
        );
        score += (matchedKeywords.length / Math.min(10, keywords.length)) * 30;
      }
    } else {
      score += 15; // Default if no industry specified
    }

    return Math.round(Math.min(maxScore, Math.max(0, score)));
  }

  /**
   * Analyze full CV
   */
  analyzeCV(entries: MasterCVEntry[], industry?: string): CVAnalysis {
    const allContent = entries.map(e => e.content).join('\n');
    
    // Calculate strength score
    const strengthScore = this.calculateStrengthScore(entries, industry);

    // Calculate completeness
    const sectionTypes = new Set(entries.map(e => e.section_type.toLowerCase()));
    const requiredSections = ['email', 'phone', 'skill'];
    const completeness = Math.round(
      (requiredSections.filter(s => 
        Array.from(sectionTypes).some(st => st.includes(s))
      ).length / requiredSections.length) * 100
    );

    // Power word usage
    const words = allContent.toLowerCase().split(/\s+/);
    const powerWordCount = words.filter(w => powerWordsService.getStrength(w) > 0).length;
    const powerWordUsage = Math.round((powerWordCount / Math.max(1, words.length)) * 1000); // Per 1000 words

    // Quantification rate
    const bulletPoints = entries.filter(e => 
      e.section_type === 'unknown' || e.section_type === 'experience'
    );
    const quantifiedBullets = bulletPoints.filter(e => 
      /\d+%|\$[\d,]+|\d+\s*(million|billion|thousand|k\b|m\b)/i.test(e.content)
    );
    const quantificationRate = bulletPoints.length > 0 
      ? Math.round((quantifiedBullets.length / bulletPoints.length) * 100)
      : 0;

    // ATS compatibility (simplified)
    const outdatedPractices = this.detectOutdatedPractices(allContent);
    const atsCompatibility = Math.max(0, 100 - outdatedPractices.length * 15);

    // Top experiences (by content length and power words)
    const experienceEntries = entries.filter(e => 
      e.section_type === 'unknown' || e.section_type === 'experience'
    );
    const scoredExperiences = experienceEntries.map(e => ({
      content: e.content,
      score: this.scoreBullet(e.content)
    }));
    scoredExperiences.sort((a, b) => b.score - a.score);
    const topExperiences = scoredExperiences.slice(0, 5).map(e => e.content);

    // Skill gaps (if industry specified)
    let skillGaps: string[] = [];
    if (industry) {
      const profile = industryProfileService.getProfile(industry);
      if (profile) {
        const userSkills = entries
          .filter(e => e.section_type === 'skill')
          .map(e => e.content.toLowerCase());
        
        skillGaps = profile.prioritySkills.filter(skill =>
          !userSkills.some(us => us.includes(skill.toLowerCase()))
        ).slice(0, 5);
      }
    }

    // Generate improvements
    const improvements: string[] = [];
    if (strengthScore < 70) {
      if (completeness < 100) {
        improvements.push('Add missing contact information or sections');
      }
      if (powerWordUsage < 20) {
        improvements.push('Use more action verbs and power words in your bullet points');
      }
      if (quantificationRate < 50) {
        improvements.push('Add quantifiable metrics to demonstrate your impact');
      }
      if (outdatedPractices.length > 0) {
        improvements.push(...outdatedPractices);
      }
      if (skillGaps.length > 0) {
        improvements.push(`Consider adding skills: ${skillGaps.slice(0, 3).join(', ')}`);
      }
    }

    // Bullet scores
    const bulletScores = bulletPoints.map(e => ({
      text: e.content,
      score: this.scoreBullet(e.content)
    }));

    return {
      strengthScore,
      completeness,
      powerWordUsage,
      quantificationRate,
      atsCompatibility,
      topExperiences,
      skillGaps,
      outdatedPractices,
      improvements,
      bulletScores
    };
  }
}

// Export singleton instance
export const cvIntelligenceService = new CVIntelligenceService();
export default cvIntelligenceService;
