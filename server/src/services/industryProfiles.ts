import industryData from '../data/industryProfiles.json';

export interface IndustryProfile {
  id: string;
  name: string;
  requiredSections: string[];
  optionalSections: string[];
  prioritySkills: string[];
  powerWords: string[];
  certifications: string[];
  keywords: string[];
  formatPreferences: {
    summaryLength: number;
    bulletPointsPerJob: number;
    skillsFormat: 'categories' | 'list' | 'proficiency';
  };
  outdatedPractices: string[];
}

export const SUPPORTED_INDUSTRIES = [
  'technology',
  'finance',
  'healthcare',
  'marketing',
  'engineering',
  'education',
  'legal'
] as const;

export type IndustryId = typeof SUPPORTED_INDUSTRIES[number];

class IndustryProfileService {
  private profiles: Record<string, IndustryProfile>;

  constructor() {
    this.profiles = industryData.industries as Record<string, IndustryProfile>;
  }

  /**
   * Get all supported industry IDs
   */
  getSupportedIndustries(): string[] {
    return Object.keys(this.profiles);
  }

  /**
   * Get a specific industry profile
   */
  getProfile(industryId: string): IndustryProfile | null {
    return this.profiles[industryId.toLowerCase()] || null;
  }

  /**
   * Get all industry profiles
   */
  getAllProfiles(): IndustryProfile[] {
    return Object.values(this.profiles);
  }

  /**
   * Get keywords for an industry
   */
  getKeywords(industryId: string): string[] {
    const profile = this.getProfile(industryId);
    return profile?.keywords || [];
  }

  /**
   * Get certifications for an industry
   */
  getCertifications(industryId: string): string[] {
    const profile = this.getProfile(industryId);
    return profile?.certifications || [];
  }

  /**
   * Get power words for an industry
   */
  getPowerWords(industryId: string): string[] {
    const profile = this.getProfile(industryId);
    return profile?.powerWords || [];
  }

  /**
   * Get required sections for an industry
   */
  getRequiredSections(industryId: string): string[] {
    const profile = this.getProfile(industryId);
    return profile?.requiredSections || ['summary', 'experience', 'education', 'skills'];
  }

  /**
   * Get priority skills for an industry
   */
  getPrioritySkills(industryId: string): string[] {
    const profile = this.getProfile(industryId);
    return profile?.prioritySkills || [];
  }

  /**
   * Check if a section is required for an industry
   */
  isSectionRequired(industryId: string, section: string): boolean {
    const requiredSections = this.getRequiredSections(industryId);
    return requiredSections.includes(section.toLowerCase());
  }

  /**
   * Validate CV sections against industry requirements
   */
  validateSections(industryId: string, presentSections: string[]): {
    missing: string[];
    present: string[];
    optional: string[];
  } {
    const profile = this.getProfile(industryId);
    if (!profile) {
      return { missing: [], present: presentSections, optional: [] };
    }

    const normalizedPresent = presentSections.map(s => s.toLowerCase());
    const missing = profile.requiredSections.filter(
      s => !normalizedPresent.includes(s.toLowerCase())
    );
    const present = profile.requiredSections.filter(
      s => normalizedPresent.includes(s.toLowerCase())
    );
    const optional = profile.optionalSections.filter(
      s => normalizedPresent.includes(s.toLowerCase())
    );

    return { missing, present, optional };
  }

  /**
   * Get format preferences for an industry
   */
  getFormatPreferences(industryId: string): IndustryProfile['formatPreferences'] {
    const profile = this.getProfile(industryId);
    return profile?.formatPreferences || {
      summaryLength: 3,
      bulletPointsPerJob: 4,
      skillsFormat: 'list'
    };
  }

  /**
   * Get outdated practices to avoid for an industry
   */
  getOutdatedPractices(industryId: string): string[] {
    const profile = this.getProfile(industryId);
    return profile?.outdatedPractices || [];
  }

  /**
   * Check if a skill is a priority skill for an industry
   */
  isPrioritySkill(industryId: string, skill: string): boolean {
    const prioritySkills = this.getPrioritySkills(industryId);
    const normalizedSkill = skill.toLowerCase();
    return prioritySkills.some(ps => 
      normalizedSkill.includes(ps.toLowerCase()) || 
      ps.toLowerCase().includes(normalizedSkill)
    );
  }

  /**
   * Score how well skills match an industry
   */
  scoreSkillsMatch(industryId: string, skills: string[]): {
    score: number;
    matchedSkills: string[];
    suggestedSkills: string[];
  } {
    const prioritySkills = this.getPrioritySkills(industryId);
    const keywords = this.getKeywords(industryId);
    const allIndustrySkills = [...prioritySkills, ...keywords];

    const matchedSkills: string[] = [];
    
    for (const skill of skills) {
      const normalizedSkill = skill.toLowerCase();
      if (allIndustrySkills.some(is => 
        normalizedSkill.includes(is.toLowerCase()) || 
        is.toLowerCase().includes(normalizedSkill)
      )) {
        matchedSkills.push(skill);
      }
    }

    const score = skills.length > 0 
      ? Math.round((matchedSkills.length / skills.length) * 100)
      : 0;

    const suggestedSkills = prioritySkills.filter(ps =>
      !skills.some(s => s.toLowerCase().includes(ps.toLowerCase()))
    ).slice(0, 5);

    return { score, matchedSkills, suggestedSkills };
  }

  /**
   * Suggest certifications based on industry and current certifications
   */
  suggestCertifications(industryId: string, currentCertifications: string[]): string[] {
    const industryCerts = this.getCertifications(industryId);
    const normalizedCurrent = currentCertifications.map(c => c.toLowerCase());
    
    return industryCerts.filter(cert =>
      !normalizedCurrent.some(cc => 
        cc.includes(cert.toLowerCase()) || 
        cert.toLowerCase().includes(cc)
      )
    ).slice(0, 3);
  }
}

// Export singleton instance
export const industryProfileService = new IndustryProfileService();
export default industryProfileService;
