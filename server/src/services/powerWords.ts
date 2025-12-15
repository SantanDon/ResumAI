import powerWordsData from '../data/powerWords.json';

export interface PowerWord {
  word: string;
  category: 'leadership' | 'achievement' | 'technical' | 'communication' | 'problem-solving';
  strength: 1 | 2 | 3 | 4 | 5;
  industries: string[];
  replacesWeakWords: string[];
}

export interface PowerWordsDatabase {
  powerWords: PowerWord[];
  weakWords: string[];
  cliches: string[];
}

class PowerWordsService {
  private data: PowerWordsDatabase;

  constructor() {
    this.data = powerWordsData as PowerWordsDatabase;
  }

  /**
   * Get all power words
   */
  getAllPowerWords(): PowerWord[] {
    return this.data.powerWords;
  }

  /**
   * Get power words by category
   */
  getByCategory(category: string): PowerWord[] {
    return this.data.powerWords.filter(pw => pw.category === category);
  }

  /**
   * Get power words by industry
   */
  getByIndustry(industry: string): PowerWord[] {
    return this.data.powerWords.filter(pw => 
      pw.industries.includes(industry.toLowerCase())
    );
  }

  /**
   * Get power words by minimum strength
   */
  getByStrength(minStrength: number): PowerWord[] {
    return this.data.powerWords.filter(pw => pw.strength >= minStrength);
  }

  /**
   * Suggest replacement power words for a weak word
   */
  suggestReplacement(weakWord: string): PowerWord[] {
    const normalizedWeak = weakWord.toLowerCase().trim();
    return this.data.powerWords.filter(pw =>
      pw.replacesWeakWords.some(w => w.toLowerCase() === normalizedWeak)
    );
  }

  /**
   * Get the strength of a word (0 if not a power word)
   */
  getStrength(word: string): number {
    const normalizedWord = word.toLowerCase().trim();
    const powerWord = this.data.powerWords.find(pw => 
      pw.word.toLowerCase() === normalizedWord
    );
    return powerWord?.strength || 0;
  }

  /**
   * Check if a word is a weak word
   */
  isWeakWord(word: string): boolean {
    const normalizedWord = word.toLowerCase().trim();
    return this.data.weakWords.some(w => 
      normalizedWord.includes(w.toLowerCase())
    );
  }

  /**
   * Get all weak words
   */
  getWeakWords(): string[] {
    return this.data.weakWords;
  }

  /**
   * Check if text contains a cliché
   */
  containsCliche(text: string): string[] {
    const normalizedText = text.toLowerCase();
    return this.data.cliches.filter(cliche => 
      normalizedText.includes(cliche.toLowerCase())
    );
  }

  /**
   * Get all clichés
   */
  getCliches(): string[] {
    return this.data.cliches;
  }

  /**
   * Detect weak words in text and suggest replacements
   */
  analyzeText(text: string): {
    weakWordsFound: string[];
    clichesFound: string[];
    suggestions: { weakWord: string; replacements: PowerWord[] }[];
  } {
    const words = text.toLowerCase().split(/\s+/);
    const weakWordsFound: string[] = [];
    const suggestions: { weakWord: string; replacements: PowerWord[] }[] = [];

    // Check for weak words
    for (const weakWord of this.data.weakWords) {
      if (text.toLowerCase().includes(weakWord.toLowerCase())) {
        weakWordsFound.push(weakWord);
        const replacements = this.suggestReplacement(weakWord);
        if (replacements.length > 0) {
          suggestions.push({ weakWord, replacements });
        }
      }
    }

    // Check for clichés
    const clichesFound = this.containsCliche(text);

    return {
      weakWordsFound,
      clichesFound,
      suggestions
    };
  }

  /**
   * Get statistics about the power words database
   */
  getStats(): {
    totalPowerWords: number;
    byCategory: Record<string, number>;
    totalWeakWords: number;
    totalCliches: number;
  } {
    const byCategory: Record<string, number> = {};
    
    for (const pw of this.data.powerWords) {
      byCategory[pw.category] = (byCategory[pw.category] || 0) + 1;
    }

    return {
      totalPowerWords: this.data.powerWords.length,
      byCategory,
      totalWeakWords: this.data.weakWords.length,
      totalCliches: this.data.cliches.length
    };
  }

  /**
   * Get the best replacement for a weak word based on industry
   */
  getBestReplacement(weakWord: string, industry?: string): PowerWord | null {
    let replacements = this.suggestReplacement(weakWord);
    
    if (industry) {
      const industrySpecific = replacements.filter(pw => 
        pw.industries.includes(industry.toLowerCase())
      );
      if (industrySpecific.length > 0) {
        replacements = industrySpecific;
      }
    }

    // Sort by strength and return the strongest
    replacements.sort((a, b) => b.strength - a.strength);
    return replacements[0] || null;
  }
}

// Export singleton instance
export const powerWordsService = new PowerWordsService();
export default powerWordsService;
