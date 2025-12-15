# Design Document: CV Enhancement System

## Overview

This design document outlines the architecture for enhancing the existing ResumAI system with advanced CV intelligence features. Building on the current CV parsing, AI chat, mass mail, and CV editor functionality, this enhancement adds: Harvard-style professional templates with 2025 hiring trends knowledge, intelligent CV content optimization, automated job-specific CV generation from Master CV, and streamlined batch job application workflow.

The system leverages the existing Swarm Orchestrator architecture for fault-tolerant AI operations while adding new intelligence layers for CV optimization and job matching.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │ CV Editor      │  │ Job Queue      │  │ Batch Application          │ │
│  │ (Enhanced)     │  │ Manager        │  │ Dashboard                  │ │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘ │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │ Real-Time      │  │ CV Version     │  │ ATS Checker                │ │
│  │ Suggestions    │  │ Manager        │  │ UI                         │ │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Backend (Express)                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │ CV Intelligence│  │ Job Matcher    │  │ Tailored CV                │ │
│  │ Service        │  │ Service        │  │ Generator                  │ │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘ │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │ Power Words    │  │ Industry       │  │ ATS Analyzer               │ │
│  │ Database       │  │ Profiles       │  │ Service                    │ │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Swarm Orchestrator (Enhanced)                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │ Master CV      │  │ Tailored CVs   │  │ Job Queue                  │ │
│  │ (SQLite)       │  │ (SQLite)       │  │ (SQLite)                   │ │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘ │
│  ┌────────────────┐  ┌────────────────┐                                 │
│  │ Power Words    │  │ Industry       │                                 │
│  │ (JSON)         │  │ Profiles (JSON)│                                 │
│  └────────────────┘  └────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Job-Specific CV Generation

```
Job Description → Job Matcher Service → Extract Requirements
                                              │
                                              ▼
Master CV ──────────────────────────→ Tailored CV Generator
                                              │
                                              ├─→ Select Relevant Experiences
                                              ├─→ Reorder Bullet Points
                                              ├─→ Inject Keywords
                                              ├─→ Calculate Match Score
                                              │
                                              ▼
                                       Tailored CV + Match Score
                                              │
                                              ▼
                                       ATS Analyzer → ATS Score
                                              │
                                              ▼
                                       PDF Generator → Download
```

## Components and Interfaces

### 1. Power Words Database

```typescript
interface PowerWord {
  word: string;
  category: 'leadership' | 'achievement' | 'technical' | 'communication' | 'problem-solving';
  strength: 1 | 2 | 3 | 4 | 5; // 5 = strongest
  industries: string[]; // Which industries this word is particularly effective for
  replacesWeakWords: string[]; // Weak words this can replace
}

interface PowerWordsDatabase {
  words: PowerWord[];
  weakWords: string[]; // Words to flag for replacement
  cliches: string[]; // Phrases to remove
  
  getByCategory(category: string): PowerWord[];
  getByIndustry(industry: string): PowerWord[];
  suggestReplacement(weakWord: string): PowerWord[];
  getStrength(word: string): number;
}
```

### 2. Industry Profiles

```typescript
interface IndustryProfile {
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
}

// Supported industries
const INDUSTRIES = [
  'technology',
  'finance', 
  'healthcare',
  'marketing',
  'engineering',
  'education',
  'legal'
];
```

### 3. CV Intelligence Service

```typescript
interface BulletAnalysis {
  text: string;
  actionVerbStrength: 1 | 2 | 3 | 4 | 5;
  hasQuantification: boolean;
  impactClarity: 1 | 2 | 3 | 4 | 5;
  issues: string[];
  suggestions: string[];
}

interface CVAnalysis {
  strengthScore: number; // 0-100
  completeness: number;
  powerWordUsage: number;
  quantificationRate: number;
  atsCompatibility: number;
  topExperiences: string[];
  skillGaps: string[];
  outdatedPractices: string[];
  improvements: string[];
}

interface CVIntelligenceService {
  analyzeBullet(bullet: string): Promise<BulletAnalysis>;
  analyzeCV(masterCV: MasterCVEntry[]): Promise<CVAnalysis>;
  enhanceBullet(bullet: string): Promise<string>;
  detectOutdatedPractices(cvText: string): string[];
  calculateStrengthScore(cv: MasterCVEntry[]): number;
}
```

### 4. Job Matcher Service

```typescript
interface JobRequirements {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  keywords: string[];
  experienceLevel: string;
  industry: string;
}

interface MatchResult {
  matchScore: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  relevantExperiences: string[];
  keywordMatches: string[];
  recommendations: string[];
}

interface JobMatcherService {
  extractRequirements(jobDescription: string): Promise<JobRequirements>;
  calculateMatch(masterCV: MasterCVEntry[], requirements: JobRequirements): MatchResult;
  rankExperiences(experiences: Experience[], requirements: JobRequirements): Experience[];
}
```

### 5. Tailored CV Generator

```typescript
interface TailoredCV {
  id: string;
  masterCVId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  atsScore: number;
  content: {
    summary: string;
    experiences: Experience[];
    skills: string[];
    education: Education[];
  };
  injectedKeywords: string[];
  createdAt: string;
  status: 'draft' | 'ready' | 'sent';
}

interface TailoredCVGenerator {
  generate(masterCV: MasterCVEntry[], jobRequirements: JobRequirements): Promise<TailoredCV>;
  selectRelevantExperiences(experiences: Experience[], requirements: JobRequirements): Experience[];
  reorderBullets(experience: Experience, requirements: JobRequirements): Experience;
  injectKeywords(content: string, keywords: string[]): string;
  generateSummary(masterCV: MasterCVEntry[], requirements: JobRequirements): string;
}
```

### 6. ATS Analyzer Service

```typescript
interface ATSIssue {
  type: 'critical' | 'warning' | 'suggestion';
  description: string;
  fix: string;
  location?: string;
}

interface ATSAnalysis {
  score: number; // 0-100
  issues: ATSIssue[];
  extractedData: {
    name: string | null;
    email: string | null;
    phone: string | null;
    skills: string[];
    experiences: string[];
    education: string[];
  };
  recommendations: string[];
}

interface ATSAnalyzerService {
  analyze(cvContent: string): ATSAnalysis;
  simulateParsing(cvContent: string): ATSAnalysis['extractedData'];
  checkSectionHeaders(cvContent: string): ATSIssue[];
  checkTextExtractability(pdfBuffer: Buffer): boolean;
}
```

### 7. Job Queue Manager

```typescript
interface JobQueueItem {
  id: string;
  jobDescription: string;
  jobUrl?: string;
  company: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  tailoredCVId?: string;
  matchScore?: number;
  createdAt: string;
}

interface JobQueueManager {
  addJob(jobDescription: string, metadata?: { url?: string; company?: string; title?: string }): JobQueueItem;
  removeJob(jobId: string): void;
  processQueue(masterCV: MasterCVEntry[]): Promise<TailoredCV[]>;
  getQueueStatus(): JobQueueItem[];
}
```

## Data Models

### Database Schema Extensions

```sql
-- Tailored CVs table
CREATE TABLE IF NOT EXISTS tailored_cvs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  master_cv_version TEXT,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_description TEXT,
  match_score INTEGER,
  ats_score INTEGER,
  content TEXT NOT NULL, -- JSON blob
  injected_keywords TEXT, -- JSON array
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME
);

-- Job queue table
CREATE TABLE IF NOT EXISTS job_queue (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_description TEXT NOT NULL,
  job_url TEXT,
  company TEXT,
  title TEXT,
  status TEXT DEFAULT 'pending',
  tailored_cv_id TEXT,
  match_score INTEGER,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  FOREIGN KEY (tailored_cv_id) REFERENCES tailored_cvs(id)
);

-- User preferences for suggestions
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  suggestion_type TEXT NOT NULL,
  original_text TEXT,
  suggested_text TEXT,
  accepted BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Power Words JSON Structure

```json
{
  "powerWords": [
    {
      "word": "spearheaded",
      "category": "leadership",
      "strength": 5,
      "industries": ["technology", "marketing", "finance"],
      "replacesWeakWords": ["led", "managed", "headed"]
    },
    {
      "word": "engineered",
      "category": "technical",
      "strength": 5,
      "industries": ["technology", "engineering"],
      "replacesWeakWords": ["built", "made", "created", "developed"]
    }
  ],
  "weakWords": [
    "helped", "worked on", "assisted", "was responsible for",
    "handled", "dealt with", "participated in"
  ],
  "cliches": [
    "team player", "hard worker", "detail-oriented",
    "results-driven", "self-starter", "think outside the box"
  ]
}
```

### Industry Profile JSON Structure

```json
{
  "technology": {
    "id": "technology",
    "name": "Technology",
    "requiredSections": ["summary", "experience", "skills", "education"],
    "optionalSections": ["projects", "certifications", "publications"],
    "prioritySkills": ["programming", "cloud", "agile", "data"],
    "powerWords": ["engineered", "architected", "optimized", "automated", "deployed"],
    "certifications": ["AWS", "Azure", "GCP", "Kubernetes", "Scrum"],
    "keywords": ["scalable", "microservices", "CI/CD", "DevOps", "API"],
    "formatPreferences": {
      "summaryLength": 3,
      "bulletPointsPerJob": 5,
      "skillsFormat": "categories"
    }
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Harvard Template Section Order
*For any* generated Harvard-style CV, the sections SHALL appear in order: Contact Info, Summary, Experience, Education, Skills, with optional sections following.
**Validates: Requirements 1.2**

### Property 2: Date Format Consistency
*For any* date displayed in the CV, the format SHALL match "Month Year" (e.g., "January 2024") or "Month Year - Month Year" for ranges.
**Validates: Requirements 1.3**

### Property 3: Action Verb Bullet Points
*For any* bullet point in the experience section, the first word SHALL be a verb from the approved action verbs list.
**Validates: Requirements 1.4**

### Property 4: PDF Text Extractability
*For any* generated PDF, all visible text content SHALL be extractable using standard PDF text extraction tools.
**Validates: Requirements 1.6, 10.5**

### Property 5: Outdated Practice Detection
*For any* CV containing known outdated practices (objective statements, "references available", photo mentions, full street address), the analyzer SHALL flag at least one issue.
**Validates: Requirements 2.2**

### Property 6: Power Words Database Completeness
*For any* query to the power words database, there SHALL be at least 100 total words distributed across all 5 categories (Leadership, Achievement, Technical, Communication, Problem-Solving).
**Validates: Requirements 3.1**

### Property 7: Weak Verb Replacement
*For any* bullet point containing a known weak verb, the enhancement function SHALL return a version with the weak verb replaced by a stronger alternative.
**Validates: Requirements 3.2**

### Property 8: Bullet Score Range
*For any* bullet point analysis, the action verb strength SHALL be in range [1,5], quantification SHALL be boolean, and impact clarity SHALL be in range [1,5].
**Validates: Requirements 3.3**

### Property 9: Cliché Detection
*For any* CV text containing known clichés ("team player", "hard worker", etc.), the analyzer SHALL flag each cliché found.
**Validates: Requirements 3.4**

### Property 10: CV Analysis Structure
*For any* Master CV analysis, the result SHALL contain: top 5 experiences (or fewer if CV has fewer), skill gaps array, and quantifiable achievements list.
**Validates: Requirements 4.1**

### Property 11: Strength Score Range
*For any* CV strength score calculation, the result SHALL be a number in the range [0, 100].
**Validates: Requirements 4.2**

### Property 12: Low Score Improvements
*For any* CV with strength score below 70, the analysis SHALL return at least one specific improvement suggestion.
**Validates: Requirements 4.3**

### Property 13: Optimization Factual Preservation
*For any* CV optimization, the output SHALL contain only information present in the input (no fabricated experiences, skills, or achievements).
**Validates: Requirements 4.5, 5.7**

### Property 14: Job Requirements Extraction
*For any* job description input, the extraction SHALL return a structured object containing: required skills array, preferred skills array, responsibilities array, and keywords array.
**Validates: Requirements 5.1**

### Property 15: Relevant Experience Selection
*For any* tailored CV generation, selected experiences SHALL contain at least one keyword match with the job requirements (when matches exist in Master CV).
**Validates: Requirements 5.2**

### Property 16: Keyword Injection
*For any* tailored CV, at least 3 keywords from the job description SHALL appear in the output (when the Master CV supports them).
**Validates: Requirements 5.4**

### Property 17: Match Score Range
*For any* job match calculation, the match score SHALL be a number in the range [0, 100].
**Validates: Requirements 5.5**

### Property 18: Low Match Warning
*For any* match score below 60%, the system SHALL return a warning message and at least one skill development suggestion.
**Validates: Requirements 5.6**

### Property 19: Batch CV Generation Count
*For any* job queue with N jobs, processing SHALL generate exactly N tailored CVs (one per job).
**Validates: Requirements 6.2**

### Property 20: Batch Save Completeness
*For any* approved batch of N tailored CVs, all N CVs SHALL be saved to the database with job metadata.
**Validates: Requirements 6.5**

### Property 21: Application Status Tracking
*For any* tailored CV, the status SHALL be one of: 'draft', 'ready', 'sent', and status transitions SHALL be logged with timestamps.
**Validates: Requirements 6.7**

### Property 22: CV Version Linkage
*For any* tailored CV, it SHALL have a valid reference to its source Master CV.
**Validates: Requirements 7.1**

### Property 23: PDF Filename Format
*For any* exported CV PDF, the filename SHALL match the pattern "{Name}_{Company}_{Date}.pdf".
**Validates: Requirements 7.5**

### Property 24: Real-Time Analysis Speed
*For any* bullet point analysis request, the response SHALL be returned within 2 seconds.
**Validates: Requirements 8.1**

### Property 25: Suggestion Generation
*For any* bullet point with improvement potential, the system SHALL generate at least one suggestion for: stronger verb, adding metrics, or clarifying impact.
**Validates: Requirements 8.2**

### Property 26: User Preference Learning
*For any* user suggestion acceptance or rejection, the preference SHALL be stored in the database for future reference.
**Validates: Requirements 8.5**

### Property 27: Industry Profile Coverage
*For any* of the 7 supported industries (Technology, Finance, Healthcare, Marketing, Engineering, Education, Legal), a complete profile SHALL exist with required sections, power words, and keywords.
**Validates: Requirements 9.1**

### Property 28: Industry-Specific Adjustment
*For any* industry selection, the CV analysis SHALL use that industry's specific power words and section requirements.
**Validates: Requirements 9.2, 9.3, 9.4**

### Property 29: ATS Score Range
*For any* ATS compatibility analysis, the score SHALL be a number in the range [0, 100].
**Validates: Requirements 10.1**

### Property 30: ATS Issue Fixes
*For any* ATS issue detected, the analysis SHALL provide a specific fix recommendation.
**Validates: Requirements 10.3**

### Property 31: ATS Parsing Simulation
*For any* CV submitted for ATS simulation, the result SHALL contain extracted fields for: name, email, phone, skills, experiences, and education.
**Validates: Requirements 10.4**

## Error Handling

### Error Types

| Error Type | Handling Strategy |
|------------|-------------------|
| Job Description Parse Error | Return partial extraction with confidence scores, flag for manual review |
| Match Score Calculation Error | Default to 0% with error message, allow manual override |
| PDF Generation Error | Retry up to 3 times, fallback to HTML export |
| Swarm Timeout | Use cached/fallback response, notify user of degraded quality |
| Database Error | Queue operation for retry, show offline indicator |

### Validation Error Messages

```typescript
const ErrorMessages = {
  jobDescription: {
    tooShort: "Job description is too short. Please provide more details.",
    parseError: "Could not extract job requirements. Please check the format."
  },
  matchScore: {
    lowMatch: "Your CV matches less than 60% of the requirements. Consider adding relevant skills.",
    noMatch: "No matching skills found. This role may not be suitable."
  },
  ats: {
    criticalIssue: "Critical ATS issue found. Your CV may not be parsed correctly.",
    formatError: "CV format may cause ATS parsing issues."
  }
};
```

## Testing Strategy

### Property-Based Testing Framework

**Framework**: fast-check (TypeScript/JavaScript)

**Configuration**: Minimum 100 iterations per property test

### Test Generators

```typescript
// Job description generator
const jobDescriptionArb = fc.record({
  title: fc.string({ minLength: 5, maxLength: 100 }),
  company: fc.string({ minLength: 2, maxLength: 50 }),
  description: fc.string({ minLength: 100, maxLength: 5000 }),
  requirements: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 3, maxLength: 15 })
});

// Bullet point generator
const bulletPointArb = fc.string({ minLength: 20, maxLength: 200 });

// Master CV generator (uses existing CVData structure)
const masterCVArb = fc.array(
  fc.record({
    section_type: fc.constantFrom('skill', 'experience', 'education', 'email', 'phone'),
    content: fc.string({ minLength: 5, maxLength: 500 })
  }),
  { minLength: 5, maxLength: 50 }
);
```

### Test File Structure

```
tests/
├── unit/
│   ├── powerWords.test.ts
│   ├── industryProfiles.test.ts
│   ├── cvIntelligence.test.ts
│   ├── jobMatcher.test.ts
│   └── atsAnalyzer.test.ts
├── property/
│   ├── bulletAnalysis.property.test.ts
│   ├── matchScore.property.test.ts
│   ├── tailoredCV.property.test.ts
│   └── atsScore.property.test.ts
└── integration/
    ├── batchApplication.test.ts
    └── cvGeneration.test.ts
```

### Property Test Annotation Format

```typescript
/**
 * Feature: cv-enhancement-system, Property 17: Match Score Range
 * For any job match calculation, the match score SHALL be a number in range [0, 100].
 */
test('match score is always in valid range', () => {
  fc.assert(
    fc.property(masterCVArb, jobDescriptionArb, async (masterCV, jobDesc) => {
      const requirements = await jobMatcher.extractRequirements(jobDesc.description);
      const result = jobMatcher.calculateMatch(masterCV, requirements);
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
      expect(result.matchScore).toBeLessThanOrEqual(100);
    }),
    { numRuns: 100 }
  );
});
```
