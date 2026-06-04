/**
 * Delta Change Handler Service
 * Handles small, targeted modifications to CV data
 */

import { 
  JSONResume, 
  DeltaChange, 
  ValidationResult 
} from '../types/jsonResume';
import { jsonResumeValidator } from './jsonResumeValidator';

export interface DeltaResult {
  success: boolean;
  cv: JSONResume;
  appliedChanges: DeltaChange[];
  errors: string[];
}

class DeltaChangeHandlerService {
  /**
   * Apply a single delta change to a CV
   */
  applyDelta(cv: JSONResume, change: DeltaChange): DeltaResult {
    return this.applyMultipleDeltas(cv, [change]);
  }

  /**
   * Apply multiple delta changes to a CV in sequence
   */
  applyMultipleDeltas(cv: JSONResume, changes: DeltaChange[]): DeltaResult {
    const errors: string[] = [];
    const appliedChanges: DeltaChange[] = [];
    
    // Deep clone the CV to avoid mutating the original
    let workingCV = this.deepClone(cv);

    for (const change of changes) {
      // Validate the change
      const validation = jsonResumeValidator.validateDeltaAgainstCV(workingCV, change);
      
      if (!validation.valid) {
        errors.push(...validation.errors.map(e => `${e.path}: ${e.message}`));
        continue;
      }

      // Apply the change
      try {
        workingCV = this.applyChange(workingCV, change);
        appliedChanges.push(change);
      } catch (error) {
        errors.push(`Failed to apply change at ${change.path}: ${error}`);
      }
    }

    // Validate the final CV
    const finalValidation = jsonResumeValidator.validate(workingCV);
    if (!finalValidation.valid) {
      errors.push(...finalValidation.errors.map(e => `${e.path}: ${e.message}`));
    }

    return {
      success: errors.length === 0,
      cv: workingCV,
      appliedChanges,
      errors
    };
  }

  /**
   * Apply a single change to the CV
   */
  private applyChange(cv: JSONResume, change: DeltaChange): JSONResume {
    const result = this.deepClone(cv);

    switch (change.operation) {
      case 'set':
        jsonResumeValidator.setValueAtPath(result, change.path, change.value);
        break;
      
      case 'add':
        this.addToArray(result, change.path, change.value);
        break;
      
      case 'remove':
        jsonResumeValidator.removeValueAtPath(result, change.path);
        break;
      
      default:
        throw new Error(`Unknown operation: ${change.operation}`);
    }

    // Update meta.lastModified
    if (!result.meta) {
      result.meta = {};
    }
    result.meta.lastModified = new Date().toISOString();

    return result;
  }

  /**
   * Add a value to an array at the specified path
   */
  private addToArray(obj: any, path: string, value: any): void {
    const parentPath = this.getParentPath(path);
    
    if (parentPath) {
      const parent = jsonResumeValidator.getValueAtPath(obj, parentPath);
      if (Array.isArray(parent)) {
        parent.push(value);
      } else {
        throw new Error(`Cannot add to non-array at path: ${parentPath}`);
      }
    } else {
      // Path is a top-level array
      const arr = jsonResumeValidator.getValueAtPath(obj, path);
      if (Array.isArray(arr)) {
        arr.push(value);
      } else {
        throw new Error(`Cannot add to non-array at path: ${path}`);
      }
    }
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
   * Deep clone an object
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Create a delta change for setting a value
   */
  createSetChange(path: string, value: any): DeltaChange {
    return { path, operation: 'set', value };
  }

  /**
   * Create a delta change for adding to an array
   */
  createAddChange(path: string, value: any): DeltaChange {
    return { path, operation: 'add', value };
  }

  /**
   * Create a delta change for removing a value
   */
  createRemoveChange(path: string): DeltaChange {
    return { path, operation: 'remove' };
  }

  /**
   * Get the difference between two CVs as delta changes
   */
  getDiff(original: JSONResume, modified: JSONResume): DeltaChange[] {
    const changes: DeltaChange[] = [];
    const originalPaths = jsonResumeValidator.getAllPaths(original);
    const modifiedPaths = jsonResumeValidator.getAllPaths(modified);

    // Find changed and added paths
    for (const path of modifiedPaths) {
      const originalValue = jsonResumeValidator.getValueAtPath(original, path);
      const modifiedValue = jsonResumeValidator.getValueAtPath(modified, path);

      if (!this.isEqual(originalValue, modifiedValue)) {
        if (originalValue === undefined) {
          // New path - this is an add
          changes.push(this.createSetChange(path, modifiedValue));
        } else {
          // Changed value
          changes.push(this.createSetChange(path, modifiedValue));
        }
      }
    }

    // Find removed paths
    for (const path of originalPaths) {
      const modifiedValue = jsonResumeValidator.getValueAtPath(modified, path);
      if (modifiedValue === undefined) {
        changes.push(this.createRemoveChange(path));
      }
    }

    return changes;
  }

  /**
   * Check if two values are equal
   */
  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    return false;
  }

  /**
   * Supported field paths for delta changes
   */
  getSupportedPaths(): string[] {
    return [
      // Contact info
      'basics.name',
      'basics.email',
      'basics.phone',
      'basics.url',
      'basics.summary',
      'basics.location.city',
      'basics.location.region',
      'basics.location.countryCode',
      
      // Work experience
      'work[*].name',
      'work[*].position',
      'work[*].startDate',
      'work[*].endDate',
      'work[*].summary',
      'work[*].highlights[*]',
      'work[*].url',
      
      // Education
      'education[*].institution',
      'education[*].area',
      'education[*].studyType',
      'education[*].startDate',
      'education[*].endDate',
      'education[*].score',
      
      // Skills
      'skills[*].name',
      'skills[*].level',
      'skills[*].keywords[*]',
      
      // Projects
      'projects[*].name',
      'projects[*].description',
      'projects[*].url',
      'projects[*].highlights[*]',
      
      // Profiles (LinkedIn, etc.)
      'basics.profiles[*].network',
      'basics.profiles[*].url',
      'basics.profiles[*].username'
    ];
  }

  /**
   * Check if a path is supported for delta changes
   */
  isPathSupported(path: string): boolean {
    const supportedPatterns = this.getSupportedPaths();
    
    for (const pattern of supportedPatterns) {
      // Convert pattern to regex (replace [*] with [\d+])
      const regexPattern = pattern
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\\\[\*\\\]/g, '\\[\\d+\\]')
        .replace(/\./g, '\\.');
      
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(path)) {
        return true;
      }
    }
    
    return false;
  }
}

// Export singleton instance
export const deltaChangeHandler = new DeltaChangeHandlerService();
