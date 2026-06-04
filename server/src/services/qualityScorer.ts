/**
 * Quality Scorer Service
 * Calculates CV quality scores and provides improvement suggestions
 */

import { 
  JSONResume, 
  QualityResult, 
  QualityBreakdown 
} from '../types/jsonResume';
import { powerWordsService } from './powerWords';

// Power words for scoring (subset for quick checks)
const POWER_WORDS = [
  'achieved', 'accelerated', 'accomplished', 'architected', 'automated',
  'built', 'championed', 'created', 'delivered', 'designed',
  'developed', 'drove', 'engineered', 'established', 'executed',
  'generated', 'grew', 'implemented', 'improved', 'increased',
  'initiated', 'launched', 'led', 'managed', 'optimized',
  'orchestrated', 'pioneered', 'reduced', 'scaled', 'spearheaded',
  'streamlined', 'transformed', 'upgraded'
];

const WEAK_WORDS = [
  'helped', 'worked', 'assisted', 'responsible', 'handled',
  'dealt', 'participated', 'involved', 'supported', 'contributed'
];

class QualityScorerService {
  /**
   * Calculate overall quality score for a CV
   */
  calculateScore(cv: JSONResume, industry?: string): QualityResult {
    const breakdown = this.calculateBreakdown(cv, industry);
    
    // Weighted average of breakdown scores
    const weights = {
      completeness: 0.25,
      powerWordUsage: 0.20,
      quantification: 0.25,
      atsCompatibility: 0.15,
      relevance: 0.15
    };

    const score = Math.round(
      breakdown.completeness * weights.completeness +
      breakdown.powerWordUsage * weights.powerWordUsage +
      breakdown.quantification * weights.quantification +
      breakdown.atsCompatibility * weights.atsCompatibility +
      breakdown.relevance * weights.relevance
    );

    const suggestions = this.getImprovementSuggestions(cv, score, breakdown);

    return {
      score: Math.max(0, Math.min(100, score)),
      breakdown,
      suggestions
    };
  }

  /**
   * Calculate breakdown scores
   */
  private calculateBreakdown(cv: JSONResume, industry?: string): QualityBreakdown {
    return {
      completeness: this.scoreCompleteness(cv),
      powerWordUsage: this.scorePowerWords(cv),
      quantification: this.scoreQuantification(cv),
      atsCompatibility: this.scoreATSCompatibility(cv),
      relevance: this.scoreRelevance(cv, industry)
    };
  }

  /**
   * Score completeness (required fields filled)
   */
  private scoreCompleteness(cv: JSONResume): number {
    let score = 0;
    let maxScore = 0;

    // Required fields (high weight)
    const requiredFields = [
      { check: () => cv.basics.name?.length > 0, weight: 15 },
      { check: () => cv.basics.email?.length > 0, weight: 15 },
      { check: () => (cv.work?.length || 0) > 0 || (cv.education?.length || 0) > 0, weight: 20 }
    ];

    // Important fields (medium weight)
    const importantFields = [
      { check: () => (cv.basics.phone?.length || 0) > 0, weight: 8 },
      { check: () => (cv.basics.summary?.length || 0) > 20, weight: 10 },
      { check: () => (cv.skills?.length || 0) > 0, weight: 10 },
      { check: () => (cv.basics.location?.city?.length || 0) > 0, weight: 5 }
    ];

    // Nice to have fields (low weight)
    const niceToHaveFields = [
      { check: () => (cv.basics.profiles?.length || 0) > 0, weight: 5 },
      { check: () => (cv.projects?.length || 0) > 0, weight: 5 },
      { check: () => (cv.basics.url?.length || 0) > 0, weight: 3 },
      { check: () => (cv.certificates?.length || 0) > 0, weight: 4 }
    ];

    const allFields = [...requiredFields, ...importantFields, ...niceToHaveFields];

    for (const field of allFields) {
      maxScore += field.weight;
      if (field.check()) {
        score += field.weight;
      }
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Score power word usage in bullet points
   */
  private scorePowerWords(cv: JSONResume): number {
    const bullets = this.getAllBullets(cv);
    
    if (bullets.length === 0) return 50; // Neutral if no bullets

    let powerWordCount = 0;
    let weakWordCount = 0;

    for (const bullet of bullets) {
      const firstWord = bullet.split(/\s+/)[0]?.toLowerCase() || '';
      
      if (POWER_WORDS.some(pw => firstWord.startsWith(pw))) {
        powerWordCount++;
      } else if (WEAK_WORDS.some(ww => firstWord.startsWith(ww))) {
        weakWordCount++;
      }
    }

    // Score based on ratio of power words to total bullets
    const powerRatio = powerWordCount / bullets.length;
    const weakPenalty = (weakWordCount / bullets.length) * 30;

    return Math.round(Math.max(0, Math.min(100, powerRatio * 100 - weakPenalty)));
  }

  /**
   * Score quantification (metrics in bullets)
   */
  private scoreQuantification(cv: JSONResume): number {
    const bullets = this.getAllBullets(cv);
    
    if (bullets.length === 0) return 50;

    let quantifiedCount = 0;

    for (const bullet of bullets) {
      if (this.hasMetrics(bullet)) {
        quantifiedCount++;
      }
    }

    // Ideal: at least 60% of bullets have metrics
    const ratio = quantifiedCount / bullets.length;
    return Math.round(Math.min(100, (ratio / 0.6) * 100));
  }

  /**
   * Score ATS compatibility
   */
  private scoreATSCompatibility(cv: JSONResume): number {
    let score = 100;

    // Check for standard section headers
    if (!cv.work || cv.work.length === 0) score -= 15;
    if (!cv.education || cv.education.length === 0) score -= 10;
    if (!cv.skills || cv.skills.length === 0) score -= 15;

    // Check for proper date formats
    if (cv.work) {
      for (const job of cv.work) {
        if (!this.isValidDateFormat(job.startDate)) score -= 5;
        if (job.endDate && !this.isValidDateFormat(job.endDate)) score -= 5;
      }
    }

    // Check for contact info
    if (!cv.basics.email) score -= 20;
    if (!cv.basics.phone) score -= 10;

    // Check for summary
    if (!cv.basics.summary) score -= 10;

    return Math.max(0, score);
  }

  /**
   * Score relevance (industry keyword match)
   */
  private scoreRelevance(cv: JSONResume, industry?: string): number {
    if (!industry) return 70; // Neutral if no industry specified

    // Get industry keywords
    const industryKeywords = this.getIndustryKeywords(industry);
    if (industryKeywords.length === 0) return 70;

    // Get all CV text
    const cvText = this.getAllText(cv).toLowerCase();

    // Count keyword matches
    let matchCount = 0;
    for (const keyword of industryKeywords) {
      if (cvText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    // Score based on match ratio
    const ratio = matchCount / industryKeywords.length;
    return Math.round(ratio * 100);
  }

  /**
   * Get improvement suggestions based on score
   */
  getImprovementSuggestions(cv: JSONResume, score: number, breakdown?: QualityBreakdown): string[] {
    const suggestions: string[] = [];
    const bd = breakdown || this.calculateBreakdown(cv);

    // Only provide suggestions if score is below 70
    if (score >= 70 && bd.completeness >= 70 && bd.powerWordUsage >= 70 && bd.quantification >= 70) {
      return suggestions;
    }

    // Completeness suggestions
    if (bd.completeness < 70) {
      if (!cv.basics.phone) {
        suggestions.push('Add a phone number to make it easier for recruiters to contact you');
      }
      if (!cv.basics.summary || cv.basics.summary.length < 20) {
        suggestions.push('Add a professional summary (2-3 sentences) highlighting your value proposition');
      }
      if (!cv.skills || cv.skills.length === 0) {
        suggestions.push('Add a skills section to improve ATS matching');
      }
      if (!cv.basics.profiles || cv.basics.profiles.length === 0) {
        suggestions.push('Add your LinkedIn profile to increase credibility');
      }
    }

    // Power word suggestions
    if (bd.powerWordUsage < 70) {
      const weakBullets = this.findWeakBullets(cv);
      if (weakBullets.length > 0) {
        suggestions.push(`Replace weak verbs in ${weakBullets.length} bullet point(s) with action verbs like "Achieved", "Led", "Developed"`);
      }
    }

    // Quantification suggestions
    if (bd.quantification < 70) {
      const unquantifiedCount = this.countUnquantifiedBullets(cv);
      if (unquantifiedCount > 0) {
        suggestions.push(`Add metrics (numbers, percentages, dollar amounts) to ${unquantifiedCount} bullet point(s) to demonstrate impact`);
      }
    }

    // ATS suggestions
    if (bd.atsCompatibility < 70) {
      if (!cv.work || cv.work.length === 0) {
        suggestions.push('Add work experience section for better ATS parsing');
      }
      if (!cv.education || cv.education.length === 0) {
        suggestions.push('Add education section for better ATS parsing');
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Score a single bullet point
   */
  scoreBullet(bullet: string): number {
    let score = 50; // Base score

    // Check for power word start
    const firstWord = bullet.split(/\s+/)[0]?.toLowerCase() || '';
    if (POWER_WORDS.some(pw => firstWord.startsWith(pw))) {
      score += 20;
    } else if (WEAK_WORDS.some(ww => firstWord.startsWith(ww))) {
      score -= 20;
    }

    // Check for metrics
    if (this.hasMetrics(bullet)) {
      score += 20;
    }

    // Check length (ideal: 50-150 characters)
    if (bullet.length >= 50 && bullet.length <= 150) {
      score += 10;
    } else if (bullet.length < 30 || bullet.length > 200) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getAllBullets(cv: JSONResume): string[] {
    const bullets: string[] = [];

    if (cv.work) {
      for (const job of cv.work) {
        if (job.highlights) {
          bullets.push(...job.highlights);
        }
      }
    }

    if (cv.projects) {
      for (const project of cv.projects) {
        if (project.highlights) {
          bullets.push(...project.highlights);
        }
      }
    }

    return bullets;
  }

  private hasMetrics(text: string): boolean {
    // Look for numbers, percentages, dollar amounts
    const metricsPattern = /\d+%|\$[\d,]+|\d+\+?|\d+x|\d+K|\d+M/i;
    return metricsPattern.test(text);
  }

  private isValidDateFormat(date: string): boolean {
    if (!date) return false;
    if (date.toLowerCase() === 'present') return true;
    // Check for YYYY, YYYY-MM, or Month YYYY formats
    return /^\d{4}(-\d{2})?$/.test(date) || /^\w+\s+\d{4}$/.test(date);
  }

  private getAllText(cv: JSONResume): string {
    const parts: string[] = [];

    parts.push(cv.basics.name || '');
    parts.push(cv.basics.summary || '');

    if (cv.work) {
      for (const job of cv.work) {
        parts.push(job.position || '');
        parts.push(job.summary || '');
        if (job.highlights) parts.push(...job.highlights);
      }
    }

    if (cv.skills) {
      for (const skill of cv.skills) {
        parts.push(skill.name || '');
        if (skill.keywords) parts.push(...skill.keywords);
      }
    }

    if (cv.projects) {
      for (const project of cv.projects) {
        parts.push(project.name || '');
        parts.push(project.description || '');
        if (project.keywords) parts.push(...project.keywords);
      }
    }

    return parts.join(' ');
  }

  private getIndustryKeywords(industry: string): string[] {
    const keywords: Record<string, string[]> = {
      technology: ['software', 'development', 'programming', 'agile', 'cloud', 'api', 'database', 'devops', 'ci/cd', 'microservices'],
      finance: ['financial', 'analysis', 'investment', 'portfolio', 'risk', 'compliance', 'trading', 'banking', 'accounting'],
      healthcare: ['patient', 'clinical', 'medical', 'healthcare', 'hipaa', 'ehr', 'diagnosis', 'treatment'],
      marketing: ['marketing', 'campaign', 'brand', 'digital', 'seo', 'analytics', 'content', 'social media'],
      engineering: ['engineering', 'design', 'cad', 'manufacturing', 'quality', 'testing', 'prototype'],
      education: ['teaching', 'curriculum', 'student', 'learning', 'assessment', 'classroom', 'education'],
      legal: ['legal', 'contract', 'compliance', 'litigation', 'regulatory', 'counsel', 'law']
    };

    return keywords[industry.toLowerCase()] || [];
  }

  private findWeakBullets(cv: JSONResume): string[] {
    const weakBullets: string[] = [];
    const bullets = this.getAllBullets(cv);

    for (const bullet of bullets) {
      const firstWord = bullet.split(/\s+/)[0]?.toLowerCase() || '';
      if (WEAK_WORDS.some(ww => firstWord.startsWith(ww))) {
        weakBullets.push(bullet);
      }
    }

    return weakBullets;
  }

  private countUnquantifiedBullets(cv: JSONResume): number {
    const bullets = this.getAllBullets(cv);
    return bullets.filter(b => !this.hasMetrics(b)).length;
  }
}

// Export singleton instance
export const qualityScorer = new QualityScorerService();
