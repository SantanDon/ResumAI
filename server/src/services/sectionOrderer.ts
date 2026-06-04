/**
 * Section Orderer Service
 * Determines optimal section order based on career stage
 */

import { JSONResume } from '../types/jsonResume';
import { masterCVTransformer } from './masterCVTransformer';

// Default section order for different career stages
const SECTION_ORDER = {
  entry: ['summary', 'education', 'work', 'projects', 'skills', 'certificates', 'languages'],
  mid: ['summary', 'work', 'education', 'skills', 'projects', 'certificates', 'languages'],
  senior: ['summary', 'work', 'skills', 'education', 'projects', 'certificates', 'languages']
};

type CareerStage = 'entry' | 'mid' | 'senior';

class SectionOrdererService {
  /**
   * Determine career stage based on years of experience
   */
  determineCareerStage(careerYears: number): CareerStage {
    if (careerYears < 3) return 'entry';
    if (careerYears < 8) return 'mid';
    return 'senior';
  }

  /**
   * Get optimal section order for a CV
   */
  getOptimalOrder(cv: JSONResume): string[] {
    const careerYears = masterCVTransformer.calculateCareerYears(cv.work);
    const stage = this.determineCareerStage(careerYears);
    return SECTION_ORDER[stage];
  }

  /**
   * Order sections in a CV based on career stage
   */
  orderSections(cv: JSONResume, customOrder?: string[]): JSONResume {
    const order = customOrder || this.getOptimalOrder(cv);
    
    // Create a new CV with sections in the specified order
    // Note: This doesn't actually reorder the JSON structure,
    // but provides metadata for rendering
    const orderedCV: JSONResume = {
      ...cv,
      meta: {
        ...cv.meta,
        // Store section order in meta for renderer to use
        canonical: order.join(',')
      }
    };

    return orderedCV;
  }

  /**
   * Get section order from CV meta
   */
  getSectionOrder(cv: JSONResume): string[] {
    if (cv.meta?.canonical) {
      return cv.meta.canonical.split(',');
    }
    return this.getOptimalOrder(cv);
  }

  /**
   * Check if education should come before work
   */
  shouldEducationFirst(cv: JSONResume): boolean {
    const careerYears = masterCVTransformer.calculateCareerYears(cv.work);
    return careerYears < 3;
  }

  /**
   * Get available sections in a CV
   */
  getAvailableSections(cv: JSONResume): string[] {
    const sections: string[] = [];
    
    if (cv.basics.summary) sections.push('summary');
    if (cv.work && cv.work.length > 0) sections.push('work');
    if (cv.education && cv.education.length > 0) sections.push('education');
    if (cv.skills && cv.skills.length > 0) sections.push('skills');
    if (cv.projects && cv.projects.length > 0) sections.push('projects');
    if (cv.certificates && cv.certificates.length > 0) sections.push('certificates');
    if (cv.languages && cv.languages.length > 0) sections.push('languages');
    if (cv.awards && cv.awards.length > 0) sections.push('awards');
    if (cv.volunteer && cv.volunteer.length > 0) sections.push('volunteer');
    if (cv.publications && cv.publications.length > 0) sections.push('publications');
    if (cv.interests && cv.interests.length > 0) sections.push('interests');
    if (cv.references && cv.references.length > 0) sections.push('references');

    return sections;
  }

  /**
   * Validate custom section order
   */
  validateOrder(order: string[], cv: JSONResume): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const available = this.getAvailableSections(cv);

    // Check for invalid sections
    for (const section of order) {
      if (!available.includes(section) && !['summary', 'work', 'education', 'skills', 'projects', 'certificates', 'languages', 'awards', 'volunteer', 'publications', 'interests', 'references'].includes(section)) {
        errors.push(`Invalid section: ${section}`);
      }
    }

    // Check for missing required sections
    const requiredSections = available.filter(s => ['work', 'education'].includes(s));
    for (const required of requiredSections) {
      if (!order.includes(required)) {
        errors.push(`Missing required section: ${required}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default section order for a career stage
   */
  getDefaultOrder(stage: CareerStage): string[] {
    return SECTION_ORDER[stage];
  }

  /**
   * Get all career stages
   */
  getCareerStages(): CareerStage[] {
    return ['entry', 'mid', 'senior'];
  }
}

// Export singleton instance
export const sectionOrderer = new SectionOrdererService();
