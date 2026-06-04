/**
 * JSON Resume Schema v1.0.0 TypeScript Interfaces
 * Based on https://jsonresume.org/schema/
 * 
 * This is the standard data format for CV storage and manipulation
 * in the CV Generation System.
 */

export interface JSONResumeLocation {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  region?: string;
}

export interface JSONResumeProfile {
  network: string;
  username?: string;
  url?: string;
}

export interface JSONResumeBasics {
  name: string;
  label?: string;
  image?: string;
  email: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: JSONResumeLocation;
  profiles?: JSONResumeProfile[];
}

export interface JSONResumeWork {
  name: string;
  position: string;
  url?: string;
  startDate: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface JSONResumeVolunteer {
  organization: string;
  position: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface JSONResumeEducation {
  institution: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
}

export interface JSONResumeAward {
  title: string;
  date?: string;
  awarder?: string;
  summary?: string;
}

export interface JSONResumeCertificate {
  name: string;
  date?: string;
  issuer?: string;
  url?: string;
}

export interface JSONResumePublication {
  name: string;
  publisher?: string;
  releaseDate?: string;
  url?: string;
  summary?: string;
}

export interface JSONResumeSkill {
  name: string;
  level?: string;
  keywords?: string[];
}

export interface JSONResumeLanguage {
  language: string;
  fluency?: string;
}

export interface JSONResumeInterest {
  name: string;
  keywords?: string[];
}

export interface JSONResumeReference {
  name: string;
  reference?: string;
}

export interface JSONResumeProject {
  name: string;
  description?: string;
  highlights?: string[];
  keywords?: string[];
  startDate?: string;
  endDate?: string;
  url?: string;
  roles?: string[];
  entity?: string;
  type?: string;
}

export interface JSONResumeMeta {
  canonical?: string;
  version?: string;
  lastModified?: string;
}

/**
 * Complete JSON Resume Schema v1.0.0
 * All sections are optional except basics (which requires name and email)
 */
export interface JSONResume {
  basics: JSONResumeBasics;
  work?: JSONResumeWork[];
  volunteer?: JSONResumeVolunteer[];
  education?: JSONResumeEducation[];
  awards?: JSONResumeAward[];
  certificates?: JSONResumeCertificate[];
  publications?: JSONResumePublication[];
  skills?: JSONResumeSkill[];
  languages?: JSONResumeLanguage[];
  interests?: JSONResumeInterest[];
  references?: JSONResumeReference[];
  projects?: JSONResumeProject[];
  meta?: JSONResumeMeta;
}

/**
 * Delta Change Types for CV modifications
 */
export type DeltaOperation = 'set' | 'add' | 'remove';

export interface DeltaChange {
  path: string;           // JSON path, e.g., "basics.email" or "work[0].highlights[2]"
  operation: DeltaOperation;
  value?: any;
}

/**
 * Validation Result Types
 */
export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * CV Generation Result Types
 */
export interface GenerationResult {
  cv: JSONResume;
  html: string;
  qualityScore: number;
  suggestions?: string[];
  changeId: string;
}

/**
 * Change History Types
 */
export type ChangeType = 'delta' | 'full_regeneration' | 'restore';

export interface ChangeHistoryEntry {
  id: string;
  cvId: string;
  timestamp: string;
  changeType: ChangeType;
  changes: DeltaChange[] | null;  // null for full regeneration
  previousState: JSONResume;
  newState: JSONResume;
  qualityScoreBefore: number;
  qualityScoreAfter: number;
}

/**
 * Quality Score Types
 */
export interface QualityBreakdown {
  completeness: number;      // 0-100: Required fields filled
  powerWordUsage: number;    // 0-100: Strong action verbs
  quantification: number;    // 0-100: Metrics in bullets
  atsCompatibility: number;  // 0-100: ATS-friendly format
  relevance: number;         // 0-100: Industry keyword match
}

export interface QualityResult {
  score: number;             // 0-100 overall
  breakdown: QualityBreakdown;
  suggestions: string[];
}

/**
 * Template Types
 */
export type TemplateLayout = 'single-column' | 'two-column';

export interface TemplateTheme {
  id: string;
  name: string;
  description: string;
  css: string;
  layout: TemplateLayout;
  fontFamily: string;
}

/**
 * Regeneration Options
 */
export interface RegenerationOptions {
  templateId?: string;
  targetIndustry?: string;
  enhanceContent?: boolean;
  sectionOrder?: string[];
}

/**
 * Export Types
 */
export type ExportFormat = 'pdf' | 'json' | 'text';

export interface ExportOptions {
  format: ExportFormat;
  templateId?: string;
  filename?: string;
}

/**
 * Helper function to create an empty JSON Resume
 */
export function createEmptyJSONResume(): JSONResume {
  return {
    basics: {
      name: '',
      email: ''
    },
    work: [],
    education: [],
    skills: [],
    projects: [],
    meta: {
      version: '1.0.0',
      lastModified: new Date().toISOString()
    }
  };
}

/**
 * Helper function to check if a JSON Resume has minimum required content
 */
export function hasMinimumContent(cv: JSONResume): boolean {
  const hasWork = (cv.work?.length ?? 0) > 0;
  const hasEducation = (cv.education?.length ?? 0) > 0;
  return (cv.basics.name?.length ?? 0) > 0 && 
         (cv.basics.email?.length ?? 0) > 0 && 
         (hasWork || hasEducation);
}
