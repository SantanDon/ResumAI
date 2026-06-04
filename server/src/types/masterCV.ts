/**
 * This defines the core data model for a user's CV
 */
/**
 * Personal Information Section
 */
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

/**
 * Technical Skills - Simple list format, no elaboration
 * Example: ["React", "TypeScript", "Node.js", "PostgreSQL"]
 */
export interface TechnicalSkills {
  skills: string[];
}

/**
 * Work Experience Entry
 * Uses action verbs and quantifiable achievements
 */
export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD or "Present"
  description: string[]; // Array of bullet points with action verbs
  technologies?: string[]; // Tech stack used
}

/**
 * Education Entry
 */
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  gpa?: string;
  honors?: string;
}

/**
 * Project Entry - Brief format (1-2 sentences max)
 * Example: "DocketDive: South African Legal AI Assistant - Simplifies law for researchers, students, and public. Built with React, TypeScript, Vercel"
 */
export interface Project {
  id: string;
  name: string;
  description: string; // 1-2 sentences max
  technologies: string[]; // Tech stack
  url?: string;
  highlights?: string[]; // Optional key achievements
}

/**
 * Job Posting - Extracted from job description text
 */
export interface JobPosting {
  id: string;
  userId: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  requirements: string[]; // Key requirements extracted
  skills: string[]; // Required skills
  recruiterEmail?: string;
  rawText: string; // Original job description
  createdAt: string;
}

/**
 * Tailored CV - Job-specific version
 */
export interface TailoredCV {
  id: string;
  userId: string;
  jobPostingId: string;
  personalInfo: PersonalInfo;
  summary?: string; // Optional tailored summary
  technicalSkills: TechnicalSkills;
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  changes: CVChange[]; // Track what was modified
  matchScore: number; // 0-100
  createdAt: string;
}

/**
 * Track changes made during tailoring
 */
export interface CVChange {
  type: 'reordered' | 'enhanced' | 'highlighted' | 'added' | 'removed';
  section: string; // e.g., "workExperience", "projects"
  description: string;
  originalValue?: any;
  newValue?: any;
}

/**
 * Cover Letter
 */
export interface CoverLetter {
  id: string;
  userId: string;
  jobPostingId: string;
  content: string;
  tone: 'professional' | 'friendly' | 'formal';
  qualityScore: number; // 0-100
  createdAt: string;
}

/**
 * Application Record
 */
export interface Application {
  id: string;
  userId: string;
  jobPostingId: string;
  tailoredCVId: string;
  coverLetterId?: string;
  emailSent: boolean;
  recruiterEmail: string;
  status: 'draft' | 'ready' | 'sent' | 'rejected' | 'interview' | 'offer';
  sentAt?: string;
  createdAt: string;
}

/**
 * Master CV - Complete user CV data
 */
export interface MasterCV {
  userId: string;
  personalInfo: PersonalInfo;
  technicalSkills: TechnicalSkills;
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  updatedAt: string;
}

/**
 * Helper function to create empty Master CV
 */
export function createEmptyMasterCV(userId: string): MasterCV {
  return {
    userId,
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
    },
    technicalSkills: {
      skills: [],
    },
    workExperience: [],
    education: [],
    projects: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Helper function to validate Master CV has minimum content
 */
export function hasMinimumContent(cv: MasterCV): boolean {
  const hasName = (cv.personalInfo.fullName?.length ?? 0) > 0;
  const hasEmail = (cv.personalInfo.email?.length ?? 0) > 0;
  const hasExperience = (cv.workExperience?.length ?? 0) > 0;
  const hasEducation = (cv.education?.length ?? 0) > 0;
  const hasSkills = (cv.technicalSkills.skills?.length ?? 0) > 0;

  return hasName && hasEmail && (hasExperience || hasEducation) && hasSkills;
}
