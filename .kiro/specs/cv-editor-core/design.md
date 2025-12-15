# Design Document: CV Editor Core Foundation

## Overview

This design document outlines the architecture and implementation for the CV Editor Core Foundation phase of ResumAI. The system transforms the current prototype into a fully functional MVP with complete CRUD operations for CV data, real PDF generation, multiple professional templates, and a file-based storage system.

The design follows the project's core "Ideology" of fault-tolerant AI systems using Maximal Agentic Decomposition and Ensemble Voting, while focusing on delivering a polished user experience for CV creation.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ CV Wizard    │  │ Template     │  │ PDF Generator        │  │
│  │ (6 Steps)    │  │ Renderer     │  │ (react-pdf)          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ CV State     │  │ Storage      │  │ Completeness         │  │
│  │ Manager      │  │ Service      │  │ Calculator           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Express)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ CV Parser    │  │ Swarm        │  │ File Storage         │  │
│  │ (PDF Import) │  │ Orchestrator │  │ (JSON)               │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Model        │  │ Enhancement  │                            │
│  │ Manager      │  │ Service      │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Ollama (Local LLMs)                          │
├─────────────────────────────────────────────────────────────────┤
│  llama3.2:1b │ tinyllama:1.1b │ phi:2.7b │ qwen3-vl:2b │ ...   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input → CV State Manager → Auto-Save → Local Storage
                    │
                    ▼
            Template Renderer → Live Preview
                    │
                    ▼
            PDF Generator → Download
```

## Components and Interfaces

### 1. CVData Model (TypeScript Interface)

```typescript
interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
}

interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  description: string[]; // Bullet points
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
  achievements: string[];
}

interface SkillCategory {
  category: string;
  items: string[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link: string;
  startDate: string;
  endDate: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl: string;
}

interface CVData {
  id: string;
  userId: string;
  templateId: 'harvard' | 'modern' | 'analytics';
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: SkillCategory[];
  projects: Project[];
  certifications: Certification[];
  createdAt: string;
  updatedAt: string;
}
```

### 2. CV Wizard Component Structure

```
CVEditor/
├── CVWizard.tsx              # Main wizard container
├── steps/
│   ├── TemplateStep.tsx      # Step 0: Template selection
│   ├── PersonalInfoStep.tsx  # Step 1: Personal information
│   ├── ExperienceStep.tsx    # Step 2: Work experience
│   ├── EducationStep.tsx     # Step 3: Education
│   ├── SkillsStep.tsx        # Step 4: Skills
│   └── ProjectsCertsStep.tsx # Step 5: Projects & Certifications
├── components/
│   ├── WizardProgress.tsx    # Progress indicator
│   ├── ExperienceCard.tsx    # Editable experience entry
│   ├── EducationCard.tsx     # Editable education entry
│   ├── SkillCategoryCard.tsx # Editable skill category
│   ├── BulletPointEditor.tsx # Bullet point with AI enhance
│   └── DraggableList.tsx     # Reorderable list wrapper
├── preview/
│   ├── CVPreview.tsx         # Live preview container
│   └── PreviewFrame.tsx      # A4 frame wrapper
└── hooks/
    ├── useCVState.ts         # CV state management
    ├── useAutoSave.ts        # Auto-save logic
    └── useCompleteness.ts    # Completeness calculation
```

### 3. Storage Service Interface

```typescript
interface StorageService {
  // CV Operations
  saveCV(cv: CVData): Promise<void>;
  getCV(cvId: string): Promise<CVData | null>;
  listCVs(userId: string): Promise<CVMetadata[]>;
  deleteCV(cvId: string): Promise<void>;
  
  // Auto-save
  setAutoSave(cvId: string, data: CVData): void;
  getAutoSave(cvId: string): CVData | null;
  clearAutoSave(cvId: string): void;
}

interface CVMetadata {
  id: string;
  name: string;
  templateId: string;
  updatedAt: string;
  completeness: number;
}
```

### 4. PDF Generator Interface

```typescript
interface PDFGenerator {
  generate(cv: CVData): Promise<Blob>;
  getFilename(cv: CVData): string;
}

// Implementation using @react-pdf/renderer
const generatePDF = async (cv: CVData): Promise<Blob> => {
  const Template = getTemplateComponent(cv.templateId);
  const doc = <Template data={cv} />;
  const blob = await pdf(doc).toBlob();
  return blob;
};
```

### 5. Swarm Orchestrator Enhancement

```typescript
interface ModelConfig {
  name: string;
  priority: number;
  capabilities: ('text' | 'vision')[];
}

interface SwarmConfig {
  workerCount: number;
  models: ModelConfig[];
  timeout: number;
}

class EnhancedSwarmOrchestrator {
  private config: SwarmConfig;
  private availableModels: string[];
  
  async initialize(): Promise<void>;
  async detectModels(): Promise<string[]>;
  async runAtomicTask(prompt: string, model?: string): Promise<string>;
  async enhanceBulletPoint(bullet: string): Promise<string>;
  async scoreBulletPoint(bullet: string): Promise<number>;
  async parseCV(pdfBuffer: Buffer): Promise<Partial<CVData>>;
}
```

## Data Models

### Database Schema (File-Based JSON)

```
data/
├── users/
│   └── {userId}/
│       ├── profile.json      # User preferences
│       └── cvs/
│           ├── {cvId}.json   # Full CV data
│           └── ...
└── autosave/
    └── {cvId}.json           # Temporary auto-save
```

### CV JSON Structure

```json
{
  "id": "cv_abc123",
  "userId": "user_xyz",
  "templateId": "harvard",
  "personalInfo": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1 (555) 123-4567",
    "location": "New York, NY",
    "linkedin": "linkedin.com/in/johndoe",
    "website": "johndoe.dev",
    "summary": "Experienced software engineer..."
  },
  "experience": [...],
  "education": [...],
  "skills": [...],
  "projects": [...],
  "certifications": [...],
  "createdAt": "2024-12-04T10:00:00Z",
  "updatedAt": "2024-12-04T15:30:00Z"
}
```

### Validation Rules

| Field | Validation |
|-------|------------|
| email | RFC 5322 email format |
| phone | Accepts various formats, normalizes to E.164 |
| linkedin | Must start with `linkedin.com/` or be empty |
| website | Valid URL format or empty |
| gpa | Number 0-4.0 or 0-100 |
| dates | ISO 8601 format (YYYY-MM) |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: CVData Structure Completeness
*For any* valid CVData object, it SHALL contain all required fields: personalInfo (with fullName, email, phone, location, linkedin, website, summary), experience array, education array, skills array, and optional projects and certifications arrays.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

### Property 2: Email Validation Correctness
*For any* string input to the email validator, the validator SHALL return true only for strings matching RFC 5322 email format, and false for all other strings.
**Validates: Requirements 2.2**

### Property 3: Phone Normalization Idempotence
*For any* valid phone number input, normalizing it twice SHALL produce the same result as normalizing it once (idempotent operation).
**Validates: Requirements 2.3**

### Property 4: LinkedIn URL Validation
*For any* string input to the LinkedIn validator, the validator SHALL return true only for strings starting with "linkedin.com/" or empty strings.
**Validates: Requirements 2.6**

### Property 5: Unique ID Generation
*For any* sequence of N calls to the ID generator (for experiences, education, projects, etc.), all N generated IDs SHALL be unique.
**Validates: Requirements 3.2, 4.2, 9.6**

### Property 6: Array Append Invariant
*For any* array and item, appending the item SHALL increase the array length by exactly 1 and the item SHALL be present at the last index.
**Validates: Requirements 3.5, 5.3**

### Property 7: Array Remove Invariant
*For any* array containing item X, removing X SHALL decrease the array length by exactly 1 and X SHALL not be present in the resulting array.
**Validates: Requirements 3.6, 3.7, 4.5, 5.4, 5.5**

### Property 8: Reorder Permutation Property
*For any* array reordering operation, the resulting array SHALL be a permutation of the original (same elements, potentially different order).
**Validates: Requirements 3.8**

### Property 9: Experience Chronological Sorting
*For any* array of experience entries with dates, sorting by date descending SHALL place entries with later endDates before entries with earlier endDates.
**Validates: Requirements 3.9**

### Property 10: GPA Validation Range
*For any* GPA input, the validator SHALL return true only for numbers in range [0, 4.0] or [0, 100], and false otherwise.
**Validates: Requirements 4.4**

### Property 11: Comma-Separated Skill Parsing
*For any* comma-separated string with N commas, parsing SHALL produce exactly N+1 skill items (after trimming empty strings).
**Validates: Requirements 5.7**

### Property 12: URL Validation Correctness
*For any* string input to the URL validator, the validator SHALL return true only for valid URL formats or empty strings.
**Validates: Requirements 6.4**

### Property 13: PDF Generation Validity
*For any* valid CVData, generating a PDF SHALL produce a valid PDF file (parseable by PDF readers) with A4 dimensions.
**Validates: Requirements 8.1, 8.3**

### Property 14: PDF Text Extractability
*For any* generated PDF, all text content from the CVData SHALL be extractable from the PDF (for ATS compatibility).
**Validates: Requirements 8.4**

### Property 15: PDF Filename Format
*For any* CVData with fullName and timestamp, the generated filename SHALL match the pattern "{fullName}_CV_{timestamp}.pdf".
**Validates: Requirements 8.7**

### Property 16: Storage Round-Trip Consistency
*For any* valid CVData, saving to storage and then loading SHALL return an equivalent CVData object.
**Validates: Requirements 9.2, 9.3**

### Property 17: Multiple CV Independence
*For any* two CVs saved for the same user, modifying one SHALL not affect the other.
**Validates: Requirements 9.5**

### Property 18: Navigation Data Preservation
*For any* wizard navigation (forward or backward), all entered data SHALL be preserved after navigation.
**Validates: Requirements 10.6**

### Property 19: Model Fallback Behavior
*For any* unavailable primary model, the Swarm Orchestrator SHALL successfully use the next available model in priority order.
**Validates: Requirements 11.3**

### Property 20: Bullet Point Enhancement Difference
*For any* bullet point input to the AI enhancer, the enhanced output SHALL be different from the input (non-identity transformation).
**Validates: Requirements 12.2**

### Property 21: Bullet Point Score Range
*For any* bullet point scored by the AI, the score SHALL be an integer in the range [1, 5].
**Validates: Requirements 12.4**

### Property 22: Completeness Calculation Accuracy
*For any* CVData, the completeness percentage SHALL equal the sum of: Personal Info filled (15%), Experience present (30%), Education present (15%), Skills present (20%), Summary present (10%), Projects/Certs present (10%).
**Validates: Requirements 13.1, 13.2**

### Property 23: Completeness Threshold Indicator
*For any* CVData with completeness below 70%, the system SHALL identify at least one incomplete section.
**Validates: Requirements 13.3**

### Property 24: CV Ready Indicator Correctness
*For any* CVData with all required fields complete, the system SHALL show "CV Ready" indicator.
**Validates: Requirements 13.5**

### Property 25: CV Parser Section Classification
*For any* PDF containing identifiable CV sections, the parser SHALL classify content into at least one of: name, email, phone, experience, education, or skills.
**Validates: Requirements 14.2, 14.4**

### Property 26: Parser Unclassified Fallback
*For any* content that cannot be confidently classified, the parser SHALL place it in the "Unclassified" section rather than discarding it.
**Validates: Requirements 14.5**

## Error Handling

### Frontend Error Boundaries

```typescript
// Error boundary for wizard steps
class WizardErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <WizardErrorFallback error={this.state.error} onRetry={...} />;
    }
    return this.props.children;
  }
}
```

### Error Types and Handling

| Error Type | Handling Strategy |
|------------|-------------------|
| Validation Error | Display inline error message, prevent progression |
| Storage Error | Show toast, retry with exponential backoff |
| PDF Generation Error | Show error modal with retry option |
| Swarm/AI Error | Fallback to non-AI mode, show warning |
| Network Error | Queue operation, retry when online |

### Validation Error Messages

```typescript
const ValidationMessages = {
  email: {
    invalid: "Please enter a valid email address",
    required: "Email is required"
  },
  phone: {
    invalid: "Please enter a valid phone number"
  },
  linkedin: {
    invalid: "Please enter a valid LinkedIn URL (e.g., linkedin.com/in/username)"
  },
  gpa: {
    invalid: "GPA must be between 0-4.0 or 0-100"
  },
  url: {
    invalid: "Please enter a valid URL"
  }
};
```

## Testing Strategy

### Dual Testing Approach

This project uses both unit tests and property-based tests for comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and integration points
- **Property-based tests** verify universal properties that should hold across all inputs

### Property-Based Testing Framework

**Framework**: fast-check (TypeScript/JavaScript)

**Configuration**: Minimum 100 iterations per property test

### Test File Structure

```
tests/
├── unit/
│   ├── validators.test.ts
│   ├── storage.test.ts
│   ├── pdf-generator.test.ts
│   └── completeness.test.ts
├── property/
│   ├── cvdata.property.test.ts
│   ├── validators.property.test.ts
│   ├── storage.property.test.ts
│   └── pdf.property.test.ts
└── integration/
    ├── wizard-flow.test.ts
    └── import-export.test.ts
```

### Property Test Annotation Format

Each property-based test MUST be tagged with:
```typescript
/**
 * Feature: cv-editor-core, Property 16: Storage Round-Trip Consistency
 * For any valid CVData, saving to storage and then loading SHALL return 
 * an equivalent CVData object.
 */
test('storage round-trip preserves data', () => {
  fc.assert(
    fc.property(cvDataArbitrary, async (cvData) => {
      await storage.saveCV(cvData);
      const loaded = await storage.getCV(cvData.id);
      expect(loaded).toEqual(cvData);
    }),
    { numRuns: 100 }
  );
});
```

### Test Generators (Arbitraries)

```typescript
// CVData generator for property tests
const personalInfoArb = fc.record({
  fullName: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  phone: fc.string({ minLength: 10, maxLength: 20 }),
  location: fc.string({ maxLength: 100 }),
  linkedin: fc.oneof(fc.constant(''), fc.string().map(s => `linkedin.com/in/${s}`)),
  website: fc.oneof(fc.constant(''), fc.webUrl()),
  summary: fc.string({ maxLength: 500 })
});

const experienceArb = fc.record({
  id: fc.uuid(),
  company: fc.string({ minLength: 1, maxLength: 100 }),
  role: fc.string({ minLength: 1, maxLength: 100 }),
  startDate: fc.date().map(d => d.toISOString().slice(0, 7)),
  endDate: fc.date().map(d => d.toISOString().slice(0, 7)),
  current: fc.boolean(),
  location: fc.string({ maxLength: 100 }),
  description: fc.array(fc.string({ maxLength: 200 }), { maxLength: 10 })
});

const cvDataArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  templateId: fc.constantFrom('harvard', 'modern', 'analytics'),
  personalInfo: personalInfoArb,
  experience: fc.array(experienceArb, { maxLength: 10 }),
  education: fc.array(educationArb, { maxLength: 5 }),
  skills: fc.array(skillCategoryArb, { maxLength: 10 }),
  projects: fc.array(projectArb, { maxLength: 5 }),
  certifications: fc.array(certificationArb, { maxLength: 5 }),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString())
});
```

### Unit Test Coverage Requirements

| Component | Coverage Target |
|-----------|-----------------|
| Validators | 100% |
| Storage Service | 95% |
| PDF Generator | 90% |
| Completeness Calculator | 100% |
| Swarm Orchestrator | 85% |
