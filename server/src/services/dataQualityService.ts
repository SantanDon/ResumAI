/**
 * Data Quality Service
 * Validates and corrects CV data for spelling, grammar, and formatting
 */

import { JSONResume } from '../types/jsonResume';

/**
 * Spelling Error
 */
export interface SpellingError {
  word: string;
  suggestions: string[];
  context: string;
  position: number;
}

/**
 * Grammar Error
 */
export interface GrammarError {
  text: string;
  suggestion: string;
  rule: string;
  position: number;
}

/**
 * Format Issue
 */
export interface FormatIssue {
  field: string;
  issue: string;
  value: string;
  suggestion: string;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  score: number; // 0-100
  spellingErrors: SpellingError[];
  grammarErrors: GrammarError[];
  formatIssues: FormatIssue[];
  duplicates: string[];
  suggestions: string[];
}

/**
 * Common CV spelling corrections
 */
const SPELLING_CORRECTIONS: Record<string, string> = {
  'responsibilites': 'responsibilities',
  'managment': 'management',
  'developement': 'development',
  'achived': 'achieved',
  'recieved': 'received',
  'occured': 'occurred',
  'seperate': 'separate',
  'definately': 'definitely',
  'untill': 'until',
  'begining': 'beginning',
  'occassion': 'occasion',
  'succesful': 'successful',
  'experiance': 'experience',
  'knowlege': 'knowledge',
  'bussiness': 'business',
  'comunication': 'communication',
  'analize': 'analyze',
  'recomend': 'recommend',
  'wich': 'which',
  'reccomend': 'recommend'
};

/**
 * Common CV power words (for enhancement)
 */
const POWER_WORDS = [
  'accelerated', 'achieved', 'advanced', 'amplified', 'analyzed',
  'boosted', 'built', 'championed', 'collaborated', 'created',
  'delivered', 'designed', 'developed', 'directed', 'discovered',
  'drove', 'enabled', 'engineered', 'enhanced', 'established',
  'exceeded', 'executed', 'expanded', 'expedited', 'facilitated',
  'generated', 'guided', 'implemented', 'improved', 'increased',
  'innovated', 'integrated', 'launched', 'led', 'leveraged',
  'maximized', 'mentored', 'optimized', 'orchestrated', 'pioneered',
  'produced', 'promoted', 'proposed', 'recognized', 'redesigned',
  'reduced', 'refined', 'reorganized', 'revitalized', 'scaled',
  'secured', 'spearheaded', 'streamlined', 'strengthened', 'succeeded',
  'transformed', 'transitioned', 'tripled', 'upgraded', 'utilized'
];

/**
 * Date format patterns
 */
const DATE_PATTERNS = {
  iso: /^\d{4}-\d{2}-\d{2}$/,
  mmddyyyy: /^\d{2}\/\d{2}\/\d{4}$/,
  mmyyyy: /^\d{2}\/\d{4}$/,
  mmmyyyy: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}$/i,
  present: /^(present|current|ongoing)$/i
};

/**
 * Email pattern
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone pattern
 */
const PHONE_PATTERN = /^[\d\s\-\+\(\)]{10,}$/;

/**
 * Data Quality Service - Singleton
 */
class DataQualityService {
  /**
   * Validate entire CV
   */
  validateCV(cv: JSONResume): ValidationResult {
    const errors: SpellingError[] = [];
    const grammarErrors: GrammarError[] = [];
    const formatIssues: FormatIssue[] = [];
    const duplicates: string[] = [];
    const suggestions: string[] = [];

    // Validate basics
    if (cv.basics) {
      const basicIssues = this.validateBasics(cv.basics);
      formatIssues.push(...basicIssues);
    }

    // Validate work experience
    if (cv.work && cv.work.length > 0) {
      for (let i = 0; i < cv.work.length; i++) {
        const job = cv.work[i];
        
        // Check spelling in highlights
        if (job.highlights) {
          for (const highlight of job.highlights) {
            const spellingErrors = this.checkSpelling(highlight);
            errors.push(...spellingErrors);
          }
        }

        // Check date format
        const dateIssue = this.validateDateFormat(job.startDate, `work[${i}].startDate`);
        if (dateIssue) formatIssues.push(dateIssue);
      }
    }

    // Validate education
    if (cv.education && cv.education.length > 0) {
      for (let i = 0; i < cv.education.length; i++) {
        const edu = cv.education[i];
        
        // Check date format
        const startDateIssue = this.validateDateFormat(edu.startDate, `education[${i}].startDate`);
        if (startDateIssue) formatIssues.push(startDateIssue);
        
        const endDateIssue = this.validateDateFormat(edu.endDate, `education[${i}].endDate`);
        if (endDateIssue) formatIssues.push(endDateIssue);
      }
    }

    // Check for duplicates
    const dupes = this.findDuplicates(cv);
    duplicates.push(...dupes);

    // Generate suggestions
    if (errors.length > 0) {
      suggestions.push(`Found ${errors.length} spelling errors. Consider reviewing and correcting them.`);
    }
    if (formatIssues.length > 0) {
      suggestions.push(`Found ${formatIssues.length} formatting issues. Ensure consistent date formats and contact information.`);
    }
    if (duplicates.length > 0) {
      suggestions.push(`Found ${duplicates.length} duplicate entries. Consider removing duplicates.`);
    }

    // Calculate score
    const score = this.calculateScore(errors, grammarErrors, formatIssues, duplicates);

    return {
      valid: errors.length === 0 && formatIssues.length === 0 && duplicates.length === 0,
      score,
      spellingErrors: errors,
      grammarErrors,
      formatIssues,
      duplicates,
      suggestions
    };
  }

  /**
   * Validate basics section
   */
  private validateBasics(basics: JSONResume['basics']): FormatIssue[] {
    const issues: FormatIssue[] = [];

    // Check email format
    if (basics.email && !EMAIL_PATTERN.test(basics.email)) {
      issues.push({
        field: 'basics.email',
        issue: 'Invalid email format',
        value: basics.email,
        suggestion: 'Use format: name@domain.com'
      });
    }

    // Check phone format
    if (basics.phone && !PHONE_PATTERN.test(basics.phone)) {
      issues.push({
        field: 'basics.phone',
        issue: 'Invalid phone format',
        value: basics.phone,
        suggestion: 'Use format: +1 (555) 123-4567 or similar'
      });
    }

    return issues;
  }

  /**
   * Validate date format
   */
  private validateDateFormat(date: string | undefined, field: string): FormatIssue | null {
    if (!date) return null;

    // Check if it matches any known pattern
    for (const [format, pattern] of Object.entries(DATE_PATTERNS)) {
      if (pattern.test(date)) {
        return null; // Valid format
      }
    }

    return {
      field,
      issue: 'Invalid date format',
      value: date,
      suggestion: 'Use format: YYYY-MM-DD, MM/DD/YYYY, MM/YYYY, or "Present"'
    };
  }

  /**
   * Check spelling in text
   */
  checkSpelling(text: string): SpellingError[] {
    const errors: SpellingError[] = [];
    const words = text.toLowerCase().split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^\w]/g, '');
      
      if (SPELLING_CORRECTIONS[word]) {
        errors.push({
          word,
          suggestions: [SPELLING_CORRECTIONS[word]],
          context: text,
          position: i
        });
      }
    }

    return errors;
  }

  /**
   * Correct spelling in text
   */
  correctSpelling(text: string): string {
    let corrected = text;

    for (const [wrong, correct] of Object.entries(SPELLING_CORRECTIONS)) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, correct);
    }

    return corrected;
  }

  /**
   * Find duplicate entries
   */
  private findDuplicates(cv: JSONResume): string[] {
    const duplicates: string[] = [];
    const seen = new Set<string>();

    // Check work experience
    if (cv.work) {
      for (const job of cv.work) {
        const key = `${job.position}:${job.name}`;
        if (seen.has(key)) {
          duplicates.push(`Duplicate job: ${job.position} at ${job.name}`);
        }
        seen.add(key);
      }
    }

    // Check education
    if (cv.education) {
      for (const edu of cv.education) {
        const key = `${edu.studyType}:${edu.institution}`;
        if (seen.has(key)) {
          duplicates.push(`Duplicate education: ${edu.studyType} from ${edu.institution}`);
        }
        seen.add(key);
      }
    }

    // Check skills
    if (cv.skills) {
      for (const skill of cv.skills) {
        if (seen.has(skill.name)) {
          duplicates.push(`Duplicate skill: ${skill.name}`);
        }
        seen.add(skill.name);
      }
    }

    return duplicates;
  }

  /**
   * Calculate quality score
   */
  private calculateScore(
    spellingErrors: SpellingError[],
    grammarErrors: GrammarError[],
    formatIssues: FormatIssue[],
    duplicates: string[]
  ): number {
    let score = 100;

    // Deduct points for errors
    score -= spellingErrors.length * 2;
    score -= grammarErrors.length * 3;
    score -= formatIssues.length * 5;
    score -= duplicates.length * 10;

    return Math.max(0, score);
  }

  /**
   * Normalize CV formatting
   */
  normalizeFormatting(cv: JSONResume): JSONResume {
    const normalized = JSON.parse(JSON.stringify(cv));

    // Normalize dates
    if (normalized.work) {
      for (const job of normalized.work) {
        if (job.startDate) job.startDate = this.normalizeDate(job.startDate);
        if (job.endDate) job.endDate = this.normalizeDate(job.endDate);
      }
    }

    if (normalized.education) {
      for (const edu of normalized.education) {
        if (edu.startDate) edu.startDate = this.normalizeDate(edu.startDate);
        if (edu.endDate) edu.endDate = this.normalizeDate(edu.endDate);
      }
    }

    // Correct spelling
    if (normalized.basics?.summary) {
      normalized.basics.summary = this.correctSpelling(normalized.basics.summary);
    }

    if (normalized.work) {
      for (const job of normalized.work) {
        if (job.highlights) {
          job.highlights = job.highlights.map((h: string) => this.correctSpelling(h));
        }
      }
    }

    return normalized;
  }

  /**
   * Normalize date to YYYY-MM-DD format
   */
  private normalizeDate(date: string): string {
    if (!date) return date;

    // Already in ISO format
    if (DATE_PATTERNS.iso.test(date)) return date;

    // MM/DD/YYYY format
    if (DATE_PATTERNS.mmddyyyy.test(date)) {
      const [month, day, year] = date.split('/');
      return `${year}-${month}-${day}`;
    }

    // MM/YYYY format
    if (DATE_PATTERNS.mmyyyy.test(date)) {
      const [month, year] = date.split('/');
      return `${year}-${month}-01`;
    }

    // Present/Current
    if (DATE_PATTERNS.present.test(date)) {
      return 'Present';
    }

    return date;
  }

  /**
   * Deduplicate CV content
   */
  deduplicateContent(cv: JSONResume): JSONResume {
    const deduped = JSON.parse(JSON.stringify(cv));

    // Deduplicate work experience
    if (deduped.work) {
      const seen = new Set<string>();
      deduped.work = deduped.work.filter((job: any) => {
        const key = `${job.position}:${job.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Deduplicate education
    if (deduped.education) {
      const seen = new Set<string>();
      deduped.education = deduped.education.filter((edu: any) => {
        const key = `${edu.studyType}:${edu.institution}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // Deduplicate skills
    if (deduped.skills) {
      const seen = new Set<string>();
      deduped.skills = deduped.skills.filter((skill: any) => {
        if (seen.has(skill.name)) return false;
        seen.add(skill.name);
        return true;
      });
    }

    return deduped;
  }

  /**
   * Optimize content length
   */
  optimizeLength(cv: JSONResume): JSONResume {
    const optimized = JSON.parse(JSON.stringify(cv));

    // Limit summary to 150 words
    if (optimized.basics?.summary) {
      const words = optimized.basics.summary.split(/\s+/);
      if (words.length > 150) {
        optimized.basics.summary = words.slice(0, 150).join(' ') + '...';
      }
    }

    // Limit highlights to 5 per job
    if (optimized.work) {
      for (const job of optimized.work) {
        if (job.highlights && job.highlights.length > 5) {
          job.highlights = job.highlights.slice(0, 5);
        }
      }
    }

    return optimized;
  }

  /**
   * Check for placeholder text
   */
  hasPlaceholderText(cv: JSONResume): boolean {
    const placeholders = [
      'Course_Title',
      'Your Name',
      'Your Email',
      'Your Phone',
      '[Your',
      'TODO',
      'FIXME'
    ];

    const cvString = JSON.stringify(cv);

    for (const placeholder of placeholders) {
      if (cvString.includes(placeholder)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get placeholder text locations
   */
  findPlaceholderText(cv: JSONResume): string[] {
    const placeholders = [
      'Course_Title',
      'Your Name',
      'Your Email',
      'Your Phone',
      '[Your',
      'TODO',
      'FIXME'
    ];

    const found: string[] = [];
    const cvString = JSON.stringify(cv);

    for (const placeholder of placeholders) {
      if (cvString.includes(placeholder)) {
        found.push(placeholder);
      }
    }

    return found;
  }

  /**
   * Get power word suggestions for text
   */
  getPowerWordSuggestions(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const suggestions: string[] = [];

    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (POWER_WORDS.includes(cleanWord)) {
        suggestions.push(cleanWord);
      }
    }

    return suggestions;
  }

  /**
   * Enhance text with power words
   */
  enhanceWithPowerWords(text: string): string {
    // This is a simple implementation
    // In production, you'd use NLP to identify weak verbs and replace them
    return text;
  }

  /**
   * Get quality metrics
   */
  getQualityMetrics(cv: JSONResume): {
    completeness: number;
    consistency: number;
    clarity: number;
    impact: number;
  } {
    let completeness = 0;
    let consistency = 0;
    let clarity = 0;
    let impact = 0;

    // Completeness: check if all sections are filled
    if (cv.basics?.name) completeness += 10;
    if (cv.basics?.email) completeness += 10;
    if (cv.basics?.phone) completeness += 10;
    if (cv.work && cv.work.length > 0) completeness += 20;
    if (cv.education && cv.education.length > 0) completeness += 20;
    if (cv.skills && cv.skills.length > 0) completeness += 20;
    if (cv.basics?.summary) completeness += 10;

    // Consistency: check formatting consistency
    const validation = this.validateCV(cv);
    consistency = Math.max(0, 100 - validation.formatIssues.length * 10);

    // Clarity: check for placeholder text and spelling
    clarity = Math.max(0, 100 - validation.spellingErrors.length * 5);

    // Impact: check for power words and achievement-focused language
    let powerWordCount = 0;
    if (cv.work) {
      for (const job of cv.work) {
        if (job.highlights) {
          for (const highlight of job.highlights) {
            powerWordCount += this.getPowerWordSuggestions(highlight).length;
          }
        }
      }
    }
    impact = Math.min(100, powerWordCount * 5);

    return {
      completeness: Math.min(100, completeness),
      consistency: Math.min(100, consistency),
      clarity: Math.min(100, clarity),
      impact: Math.min(100, impact)
    };
  }
}

// Export singleton instance
export const dataQualityService = new DataQualityService();

/**
 * Helper functions
 */
export function validateCV(cv: JSONResume): ValidationResult {
  return dataQualityService.validateCV(cv);
}

export function checkSpelling(text: string): SpellingError[] {
  return dataQualityService.checkSpelling(text);
}

export function correctSpelling(text: string): string {
  return dataQualityService.correctSpelling(text);
}

export function normalizeFormatting(cv: JSONResume): JSONResume {
  return dataQualityService.normalizeFormatting(cv);
}

export function deduplicateContent(cv: JSONResume): JSONResume {
  return dataQualityService.deduplicateContent(cv);
}

export function optimizeLength(cv: JSONResume): JSONResume {
  return dataQualityService.optimizeLength(cv);
}
