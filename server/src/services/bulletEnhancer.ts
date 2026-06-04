/**
 * Bullet Enhancement Service
 * Uses swarm consensus to improve CV bullet points
 */

import { SwarmOrchestrator } from '../swarm/orchestrator';
import { powerWordsService } from './powerWords';

// Weak verbs to replace
const WEAK_VERBS: Record<string, string[]> = {
  'helped': ['Facilitated', 'Enabled', 'Supported', 'Contributed to'],
  'worked': ['Collaborated', 'Partnered', 'Executed', 'Delivered'],
  'worked on': ['Developed', 'Built', 'Created', 'Engineered'],
  'assisted': ['Supported', 'Aided', 'Facilitated', 'Enabled'],
  'responsible for': ['Managed', 'Oversaw', 'Led', 'Directed'],
  'handled': ['Managed', 'Processed', 'Coordinated', 'Executed'],
  'dealt with': ['Resolved', 'Addressed', 'Managed', 'Handled'],
  'participated': ['Contributed', 'Engaged', 'Collaborated', 'Partnered'],
  'involved in': ['Contributed to', 'Participated in', 'Engaged in', 'Supported'],
  'supported': ['Enabled', 'Facilitated', 'Assisted', 'Aided'],
  'contributed': ['Delivered', 'Provided', 'Generated', 'Produced'],
  'made': ['Created', 'Developed', 'Built', 'Designed'],
  'did': ['Executed', 'Performed', 'Completed', 'Accomplished'],
  'got': ['Achieved', 'Obtained', 'Secured', 'Acquired'],
  'was': ['Served as', 'Functioned as', 'Acted as', 'Operated as']
};

// Power verbs by category
const POWER_VERBS = {
  leadership: ['Spearheaded', 'Orchestrated', 'Championed', 'Pioneered', 'Led', 'Directed', 'Managed'],
  achievement: ['Achieved', 'Accomplished', 'Delivered', 'Exceeded', 'Surpassed', 'Attained'],
  technical: ['Engineered', 'Architected', 'Developed', 'Implemented', 'Automated', 'Optimized'],
  communication: ['Presented', 'Negotiated', 'Collaborated', 'Facilitated', 'Coordinated'],
  problemSolving: ['Resolved', 'Streamlined', 'Transformed', 'Revamped', 'Redesigned']
};

interface EnhancementResult {
  original: string;
  enhanced: string;
  changes: string[];
  metricsAdded: boolean;
}

class BulletEnhancerService {
  private swarm: SwarmOrchestrator;

  constructor(workerCount: number = 3) {
    this.swarm = new SwarmOrchestrator(workerCount);
  }

  /**
   * Enhance a single bullet point
   */
  async enhanceBullet(bullet: string, industry?: string): Promise<EnhancementResult> {
    const changes: string[] = [];
    let enhanced = bullet.trim();

    // Step 1: Replace weak verbs with power words
    const weakVerbResult = this.replaceWeakVerbs(enhanced);
    if (weakVerbResult.changed) {
      enhanced = weakVerbResult.text;
      changes.push(`Replaced weak verb with "${weakVerbResult.replacement}"`);
    }

    // Step 2: Check for metrics and suggest if missing
    const hasMetrics = this.hasMetrics(enhanced);
    let metricsAdded = false;

    if (!hasMetrics) {
      // Add metric placeholder
      enhanced = this.addMetricPlaceholder(enhanced);
      metricsAdded = true;
      changes.push('Added metric placeholder [X%/X+/$X]');
    }

    // Step 3: Use swarm for advanced enhancement (if available)
    try {
      const swarmEnhanced = await this.swarmEnhance(enhanced, industry);
      if (swarmEnhanced && swarmEnhanced !== enhanced) {
        // Verify no fabrication
        if (this.verifyNoFabrication(bullet, swarmEnhanced)) {
          enhanced = swarmEnhanced;
          changes.push('AI-enhanced for impact');
        }
      }
    } catch (error) {
      // Swarm enhancement failed, use rule-based result
      console.log('Swarm enhancement unavailable, using rule-based enhancement');
    }

    // Step 4: Clean up formatting
    enhanced = this.cleanFormatting(enhanced);

    return {
      original: bullet,
      enhanced,
      changes,
      metricsAdded
    };
  }

  /**
   * Enhance multiple bullet points
   */
  async enhanceBullets(bullets: string[], industry?: string): Promise<EnhancementResult[]> {
    const results: EnhancementResult[] = [];
    
    for (const bullet of bullets) {
      const result = await this.enhanceBullet(bullet, industry);
      results.push(result);
    }

    return results;
  }

  /**
   * Replace weak verbs with power words
   */
  replaceWeakVerbs(text: string): { text: string; changed: boolean; replacement?: string } {
    const words = text.split(/\s+/);
    const firstWord = words[0]?.toLowerCase() || '';
    const firstTwoWords = words.slice(0, 2).join(' ').toLowerCase();

    // Check two-word phrases first
    for (const [weak, replacements] of Object.entries(WEAK_VERBS)) {
      if (firstTwoWords.startsWith(weak)) {
        const replacement = replacements[Math.floor(Math.random() * replacements.length)];
        const newText = replacement + text.slice(weak.length);
        return { text: newText, changed: true, replacement };
      }
    }

    // Check single words
    for (const [weak, replacements] of Object.entries(WEAK_VERBS)) {
      if (firstWord === weak || firstWord.startsWith(weak)) {
        const replacement = replacements[Math.floor(Math.random() * replacements.length)];
        words[0] = replacement;
        return { text: words.join(' '), changed: true, replacement };
      }
    }

    // Ensure first word is capitalized
    if (words[0] && words[0][0] !== words[0][0].toUpperCase()) {
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      return { text: words.join(' '), changed: true };
    }

    return { text, changed: false };
  }

  /**
   * Check if text contains metrics
   */
  hasMetrics(text: string): boolean {
    const metricsPattern = /\d+%|\$[\d,]+|\d+\+?|\d+x|\d+K|\d+M|\d+ (users|customers|clients|projects|teams|members)/i;
    return metricsPattern.test(text);
  }

  /**
   * Add metric placeholder to bullet
   */
  addMetricPlaceholder(text: string): string {
    // Find a good place to insert metric
    const patterns = [
      { regex: /increased|improved|grew|boosted|enhanced/i, placeholder: ' by [X%]' },
      { regex: /reduced|decreased|cut|lowered|minimized/i, placeholder: ' by [X%]' },
      { regex: /managed|led|oversaw|directed/i, placeholder: ' [X+] ' },
      { regex: /saved|generated|produced|delivered/i, placeholder: ' [$X] ' },
      { regex: /completed|finished|delivered/i, placeholder: ' [X] ' }
    ];

    for (const { regex, placeholder } of patterns) {
      const match = text.match(regex);
      if (match) {
        const index = match.index! + match[0].length;
        // Check if there's already a number after
        const afterMatch = text.slice(index, index + 10);
        if (!/^\s*\d/.test(afterMatch) && !/^\s*by\s*\d/.test(afterMatch)) {
          return text.slice(0, index) + placeholder + text.slice(index);
        }
      }
    }

    // Default: add at end if no good place found
    if (!text.includes('[')) {
      return text.replace(/\.?$/, ', resulting in [X% improvement/X+ impact]');
    }

    return text;
  }

  /**
   * Use swarm for advanced enhancement
   */
  private async swarmEnhance(bullet: string, industry?: string): Promise<string> {
    const industryContext = industry ? ` for the ${industry} industry` : '';
    
    const prompt = `Enhance this CV bullet point to be more impactful${industryContext}. 
Use strong action verbs and quantify achievements where possible.
Keep the same factual content - do not add new information.
Keep it concise (1-2 lines max).

Original: "${bullet}"

Enhanced version (just the bullet, no explanation):`;

    try {
      const result = await this.swarm.runAtomicTask(prompt);
      return result.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify that enhancement doesn't fabricate information
   */
  verifyNoFabrication(original: string, enhanced: string): boolean {
    // Extract key entities from original
    const originalLower = original.toLowerCase();
    const enhancedLower = enhanced.toLowerCase();

    // Check for new numbers that weren't in original (except placeholders)
    const originalNumbers: string[] = original.match(/\d+/g) || [];
    const enhancedNumbers: string[] = enhanced.match(/\d+/g) || [];
    
    for (const num of enhancedNumbers) {
      // Allow placeholder-like numbers (X, 0, common percentages)
      if (!originalNumbers.includes(num) && !['0', '1', '2', '3', '5', '10'].includes(num)) {
        // Check if it's a reasonable metric placeholder
        if (parseInt(num) > 100 && !originalNumbers.some(n => parseInt(n) > 50)) {
          return false; // Likely fabricated large number
        }
      }
    }

    // Check for new company/product names (capitalized words)
    const originalCaps: string[] = original.match(/[A-Z][a-z]+/g) || [];
    const enhancedCaps: string[] = enhanced.match(/[A-Z][a-z]+/g) || [];
    
    const leadershipVerbs = POWER_VERBS.leadership;
    const achievementVerbs = POWER_VERBS.achievement;
    const technicalVerbs = POWER_VERBS.technical;
    
    const newCaps = enhancedCaps.filter(cap => 
      !originalCaps.includes(cap) && 
      !leadershipVerbs.includes(cap) &&
      !achievementVerbs.includes(cap) &&
      !technicalVerbs.includes(cap)
    );

    // Allow some new capitalized words (action verbs), but flag if too many
    if (newCaps.length > 3) {
      return false;
    }

    return true;
  }

  /**
   * Clean up formatting
   */
  cleanFormatting(text: string): string {
    let cleaned = text.trim();
    
    // Capitalize first letter
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    
    // Remove trailing period (Harvard style)
    cleaned = cleaned.replace(/\.+$/, '');
    
    // Remove double spaces
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Remove leading bullets/dashes
    cleaned = cleaned.replace(/^[\s\-•*]+/, '');

    return cleaned;
  }

  /**
   * Get suggested power verbs for a category
   */
  getSuggestedVerbs(category: string): string[] {
    return (POWER_VERBS as Record<string, string[]>)[category] || [];
  }

  /**
   * Get all power verb categories
   */
  getVerbCategories(): string[] {
    return Object.keys(POWER_VERBS);
  }
}

// Export singleton instance
export const bulletEnhancer = new BulletEnhancerService();
