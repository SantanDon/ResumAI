/**
 * JSON Resume Validator Service
 * Validates CV data against the JSON Resume schema v1.0.0
 * Uses Zod for schema validation
 */

import { z } from 'zod';
import { 
  JSONResume, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  DeltaChange 
} from '../types/jsonResume';

// ============================================
// ZOD SCHEMAS
// ============================================

const LocationSchema = z.object({
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  countryCode: z.string().max(2).optional(),
  region: z.string().optional()
}).optional();

const ProfileSchema = z.object({
  network: z.string().min(1),
  username: z.string().optional(),
  url: z.string().url().optional()
});

const BasicsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  label: z.string().optional(),
  image: z.string().url().optional(),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  url: z.string().url().optional(),
  summary: z.string().optional(),
  location: LocationSchema,
  profiles: z.array(ProfileSchema).optional()
});

// Date format: YYYY-MM-DD or YYYY-MM or YYYY
const DateStringSchema = z.string().regex(
  /^\d{4}(-\d{2})?(-\d{2})?$|^Present$/i,
  'Date must be in format YYYY, YYYY-MM, or YYYY-MM-DD'
).optional();

const WorkSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  url: z.string().url().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string()).optional()
});

const VolunteerSchema = z.object({
  organization: z.string().min(1),
  position: z.string().min(1),
  url: z.string().url().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string()).optional()
});

const EducationSchema = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  url: z.string().url().optional(),
  area: z.string().optional(),
  studyType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  score: z.string().optional(),
  courses: z.array(z.string()).optional()
});

const AwardSchema = z.object({
  title: z.string().min(1),
  date: z.string().optional(),
  awarder: z.string().optional(),
  summary: z.string().optional()
});

const CertificateSchema = z.object({
  name: z.string().min(1),
  date: z.string().optional(),
  issuer: z.string().optional(),
  url: z.string().url().optional()
});

const PublicationSchema = z.object({
  name: z.string().min(1),
  publisher: z.string().optional(),
  releaseDate: z.string().optional(),
  url: z.string().url().optional(),
  summary: z.string().optional()
});

const SkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  level: z.string().optional(),
  keywords: z.array(z.string()).optional()
});

const LanguageSchema = z.object({
  language: z.string().min(1),
  fluency: z.string().optional()
});

const InterestSchema = z.object({
  name: z.string().min(1),
  keywords: z.array(z.string()).optional()
});

const ReferenceSchema = z.object({
  name: z.string().min(1),
  reference: z.string().optional()
});

const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  url: z.string().url().optional(),
  roles: z.array(z.string()).optional(),
  entity: z.string().optional(),
  type: z.string().optional()
});

const MetaSchema = z.object({
  canonical: z.string().url().optional(),
  version: z.string().optional(),
  lastModified: z.string().optional()
}).optional();

// Complete JSON Resume Schema
const JSONResumeSchema = z.object({
  basics: BasicsSchema,
  work: z.array(WorkSchema).optional(),
  volunteer: z.array(VolunteerSchema).optional(),
  education: z.array(EducationSchema).optional(),
  awards: z.array(AwardSchema).optional(),
  certificates: z.array(CertificateSchema).optional(),
  publications: z.array(PublicationSchema).optional(),
  skills: z.array(SkillSchema).optional(),
  languages: z.array(LanguageSchema).optional(),
  interests: z.array(InterestSchema).optional(),
  references: z.array(ReferenceSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  meta: MetaSchema
});

// Delta Change Schema
const DeltaChangeSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  operation: z.enum(['set', 'add', 'remove']),
  value: z.any().optional()
});

// ============================================
// VALIDATOR SERVICE
// ============================================

class JSONResumeValidatorService {
  /**
   * Validate a complete JSON Resume object
   */
  validate(cv: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Schema validation
    const result = JSONResumeSchema.safeParse(cv);
    
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        });
      }
    }

    // Additional business rule validation
    if (result.success) {
      const validCV = result.data as JSONResume;
      
      // Check for at least one work or education entry
      const hasWork = validCV.work && validCV.work.length > 0;
      const hasEducation = validCV.education && validCV.education.length > 0;
      
      if (!hasWork && !hasEducation) {
        errors.push({
          path: 'work/education',
          message: 'At least one work or education entry is required',
          code: 'missing_experience'
        });
      }

      // Generate warnings
      this.generateWarnings(validCV, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a delta change before applying
   */
  validateDeltaChange(change: DeltaChange): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate change structure
    const result = DeltaChangeSchema.safeParse(change);
    
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        });
      }
    }

    // Validate path format
    if (!this.isValidPath(change.path)) {
      errors.push({
        path: 'path',
        message: `Invalid JSON path format: ${change.path}`,
        code: 'invalid_path'
      });
    }

    // Validate operation requirements
    if (change.operation === 'set' && change.value === undefined) {
      errors.push({
        path: 'value',
        message: 'Value is required for set operation',
        code: 'missing_value'
      });
    }

    if (change.operation === 'add' && change.value === undefined) {
      errors.push({
        path: 'value',
        message: 'Value is required for add operation',
        code: 'missing_value'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate that a delta change can be applied to a CV
   */
  validateDeltaAgainstCV(cv: JSONResume, change: DeltaChange): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // First validate the change itself
    const changeValidation = this.validateDeltaChange(change);
    if (!changeValidation.valid) {
      return changeValidation;
    }

    // Check if path exists for remove/set operations
    if (change.operation === 'remove' || change.operation === 'set') {
      if (!this.pathExists(cv, change.path)) {
        // For set, we allow creating new paths
        if (change.operation === 'remove') {
          errors.push({
            path: change.path,
            message: `Path does not exist: ${change.path}`,
            code: 'path_not_found'
          });
        }
      }
    }

    // For add operation, check if parent is an array
    if (change.operation === 'add') {
      const parentPath = this.getParentPath(change.path);
      if (parentPath) {
        const parent = this.getValueAtPath(cv, parentPath);
        if (!Array.isArray(parent)) {
          errors.push({
            path: change.path,
            message: `Cannot add to non-array at path: ${parentPath}`,
            code: 'not_array'
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate warnings for CV quality issues
   */
  private generateWarnings(cv: JSONResume, warnings: ValidationWarning[]): void {
    // Missing phone number
    if (!cv.basics.phone) {
      warnings.push({
        path: 'basics.phone',
        message: 'Phone number is missing',
        suggestion: 'Adding a phone number makes it easier for recruiters to contact you'
      });
    }

    // No skills listed
    if (!cv.skills || cv.skills.length === 0) {
      warnings.push({
        path: 'skills',
        message: 'No skills listed',
        suggestion: 'Add relevant skills to improve ATS matching'
      });
    }

    // Check bullet points for metrics
    if (cv.work) {
      for (let i = 0; i < cv.work.length; i++) {
        const job = cv.work[i];
        if (job.highlights) {
          for (let j = 0; j < job.highlights.length; j++) {
            const bullet = job.highlights[j];
            if (!this.hasMetrics(bullet)) {
              warnings.push({
                path: `work[${i}].highlights[${j}]`,
                message: 'Bullet point lacks quantifiable metrics',
                suggestion: 'Add numbers, percentages, or dollar amounts to demonstrate impact'
              });
            }
          }
        }
      }
    }

    // Missing summary
    if (!cv.basics.summary) {
      warnings.push({
        path: 'basics.summary',
        message: 'Professional summary is missing',
        suggestion: 'A 2-3 sentence summary helps recruiters quickly understand your value'
      });
    }

    // Check for LinkedIn profile
    const hasLinkedIn = cv.basics.profiles?.some(p => 
      p.network.toLowerCase() === 'linkedin'
    );
    if (!hasLinkedIn) {
      warnings.push({
        path: 'basics.profiles',
        message: 'LinkedIn profile is missing',
        suggestion: 'Adding your LinkedIn profile increases credibility'
      });
    }
  }

  /**
   * Check if a bullet point contains metrics
   */
  private hasMetrics(text: string): boolean {
    // Look for numbers, percentages, dollar amounts
    const metricsPattern = /\d+%|\$[\d,]+|\d+\+?|\d+x/i;
    return metricsPattern.test(text);
  }

  /**
   * Validate JSON path format
   */
  private isValidPath(path: string): boolean {
    // Valid paths: "basics.name", "work[0].highlights[2]", "skills[0].keywords"
    const pathPattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\[\d+\])?(\.[a-zA-Z_][a-zA-Z0-9_]*(\[\d+\])?)*$/;
    return pathPattern.test(path);
  }

  /**
   * Check if a path exists in the CV
   */
  private pathExists(cv: JSONResume, path: string): boolean {
    try {
      const value = this.getValueAtPath(cv, path);
      return value !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get value at a JSON path
   */
  getValueAtPath(obj: any, path: string): any {
    const parts = this.parsePath(path);
    let current = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      
      if (typeof part === 'number') {
        current = current[part];
      } else {
        current = current[part];
      }
    }
    
    return current;
  }

  /**
   * Set value at a JSON path
   */
  setValueAtPath(obj: any, path: string, value: any): void {
    const parts = this.parsePath(path);
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      
      if (current[part] === undefined) {
        // Create intermediate objects/arrays as needed
        current[part] = typeof nextPart === 'number' ? [] : {};
      }
      
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
  }

  /**
   * Remove value at a JSON path
   */
  removeValueAtPath(obj: any, path: string): void {
    const parts = this.parsePath(path);
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined) {
        return; // Path doesn't exist
      }
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    if (Array.isArray(current) && typeof lastPart === 'number') {
      current.splice(lastPart, 1);
    } else {
      delete current[lastPart];
    }
  }

  /**
   * Parse a JSON path into parts
   */
  private parsePath(path: string): (string | number)[] {
    const parts: (string | number)[] = [];
    const regex = /([a-zA-Z_][a-zA-Z0-9_]*)|\[(\d+)\]/g;
    let match;
    
    while ((match = regex.exec(path)) !== null) {
      if (match[1]) {
        parts.push(match[1]);
      } else if (match[2]) {
        parts.push(parseInt(match[2], 10));
      }
    }
    
    return parts;
  }

  /**
   * Get parent path from a path
   */
  private getParentPath(path: string): string | null {
    const lastDot = path.lastIndexOf('.');
    const lastBracket = path.lastIndexOf('[');
    
    const lastSeparator = Math.max(lastDot, lastBracket);
    if (lastSeparator <= 0) {
      return null;
    }
    
    return path.substring(0, lastSeparator);
  }

  /**
   * Get all paths in a JSON Resume (for testing)
   */
  getAllPaths(obj: any, prefix: string = ''): string[] {
    const paths: string[] = [];
    
    if (obj === null || obj === undefined) {
      return paths;
    }
    
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const newPrefix = prefix ? `${prefix}[${i}]` : `[${i}]`;
        paths.push(newPrefix);
        paths.push(...this.getAllPaths(obj[i], newPrefix));
      }
    } else if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        paths.push(newPrefix);
        paths.push(...this.getAllPaths(obj[key], newPrefix));
      }
    }
    
    return paths;
  }
}

// Export singleton instance
export const jsonResumeValidator = new JSONResumeValidatorService();
export { JSONResumeSchema, DeltaChangeSchema };
