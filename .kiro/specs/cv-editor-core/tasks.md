# Implementation Plan

## Phase 1: Data Model & Core Infrastructure

- [ ] 1. Create CVData type definitions and validation utilities
  - [ ] 1.1 Create comprehensive CVData TypeScript interfaces in `frontend/src/types/cv.ts`
    - Define PersonalInfo, Experience, Education, SkillCategory, Project, Certification interfaces
    - Define main CVData interface with all required and optional fields
    - Add type guards and factory functions for creating empty instances
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [ ]* 1.2 Write property test for CVData structure completeness
    - **Property 1: CVData Structure Completeness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
  - [ ] 1.3 Create validation utilities in `frontend/src/utils/validators.ts`
    - Implement email validator (RFC 5322 format)
    - Implement phone normalizer and validator
    - Implement LinkedIn URL validator
    - Implement GPA validator (0-4.0 or 0-100 range)
    - Implement generic URL validator
    - _Requirements: 2.2, 2.3, 2.6, 4.4, 6.4_
  - [ ]* 1.4 Write property tests for validators
    - **Property 2: Email Validation Correctness**
    - **Property 3: Phone Normalization Idempotence**
    - **Property 4: LinkedIn URL Validation**
    - **Property 10: GPA Validation Range**
    - **Property 12: URL Validation Correctness**
    - **Validates: Requirements 2.2, 2.3, 2.6, 4.4, 6.4**
  - [ ] 1.5 Create unique ID generator utility in `frontend/src/utils/id.ts`
    - Implement UUID-based ID generation for CV entries
    - _Requirements: 3.2, 4.2, 9.6_
  - [ ]* 1.6 Write property test for unique ID generation
    - **Property 5: Unique ID Generation**
    - **Validates: Requirements 3.2, 4.2, 9.6**

- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Storage System

- [ ] 3. Implement file-based storage service
  - [ ] 3.1 Create StorageService class in `frontend/src/services/storage.ts`
    - Implement localStorage-based storage for browser
    - Implement saveCV, getCV, listCVs, deleteCV methods
    - Implement JSON serialization/deserialization
    - _Requirements: 9.2, 9.3, 9.5, 9.6_
  - [ ]* 3.2 Write property test for storage round-trip
    - **Property 16: Storage Round-Trip Consistency**
    - **Validates: Requirements 9.2, 9.3**
  - [ ]* 3.3 Write property test for multiple CV independence
    - **Property 17: Multiple CV Independence**
    - **Validates: Requirements 9.5**
  - [ ] 3.4 Create useAutoSave hook in `frontend/src/hooks/useAutoSave.ts`
    - Implement debounced auto-save (2 second delay)
    - Handle auto-save to localStorage
    - Implement auto-save recovery on page load
    - _Requirements: 9.1, 9.2, 9.4_
  - [ ] 3.5 Create useCVState hook in `frontend/src/hooks/useCVState.ts`
    - Implement CV state management with React useState/useReducer
    - Integrate with StorageService for persistence
    - Provide methods for updating each CV section
    - _Requirements: 9.1, 9.2, 10.6_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Wizard Steps Implementation

- [ ] 5. Create wizard infrastructure
  - [ ] 5.1 Create CVWizard container component in `frontend/src/components/CVEditor/CVWizard.tsx`
    - Implement step navigation state
    - Create step rendering logic
    - Add progress indicator component
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ] 5.2 Create WizardProgress component in `frontend/src/components/CVEditor/components/WizardProgress.tsx`
    - Display current step and total steps
    - Allow clicking on completed steps for direct navigation
    - Visual indication of current, completed, and upcoming steps
    - _Requirements: 10.1, 10.4_
  - [ ]* 5.3 Write property test for navigation data preservation
    - **Property 18: Navigation Data Preservation**
    - **Validates: Requirements 10.6**

- [ ] 6. Implement Template Selection Step (Step 0)
  - [ ] 6.1 Create TemplateStep component in `frontend/src/components/CVEditor/steps/TemplateStep.tsx`
    - Display 3 template cards: Harvard Classic, Modern Minimalist, Data & Analytics
    - Implement template selection with visual feedback
    - Show template preview thumbnails
    - _Requirements: 7.1, 7.2_

- [ ] 7. Implement Personal Info Step (Step 1)
  - [ ] 7.1 Create PersonalInfoStep component in `frontend/src/components/CVEditor/steps/PersonalInfoStep.tsx`
    - Create input fields for fullName, email, phone, location, linkedin, website, summary
    - Integrate validators with real-time validation feedback
    - Display validation errors inline
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 8. Implement Experience Step (Step 2)
  - [ ] 8.1 Create ExperienceStep component in `frontend/src/components/CVEditor/steps/ExperienceStep.tsx`
    - Display list of experience entries
    - Add "Add Experience" button
    - _Requirements: 3.1, 3.2_
  - [ ] 8.2 Create ExperienceCard component in `frontend/src/components/CVEditor/components/ExperienceCard.tsx`
    - Editable fields for company, role, dates, location
    - "Current Position" checkbox that disables endDate
    - Delete button with confirmation
    - _Requirements: 3.3, 3.4, 3.7_
  - [ ] 8.3 Create BulletPointEditor component in `frontend/src/components/CVEditor/components/BulletPointEditor.tsx`
    - Add/remove bullet points
    - Editable text for each bullet
    - "Enhance with AI" button placeholder
    - _Requirements: 3.5, 3.6, 12.1_
  - [ ] 8.4 Implement drag-and-drop reordering with DraggableList
    - Use react-beautiful-dnd or similar library
    - Reorder experience entries via drag-and-drop
    - _Requirements: 3.8_
  - [ ]* 8.5 Write property tests for array operations
    - **Property 6: Array Append Invariant**
    - **Property 7: Array Remove Invariant**
    - **Property 8: Reorder Permutation Property**
    - **Validates: Requirements 3.5, 3.6, 3.7, 3.8**
  - [ ]* 8.6 Write property test for chronological sorting
    - **Property 9: Experience Chronological Sorting**
    - **Validates: Requirements 3.9**

- [ ] 9. Implement Education Step (Step 3)
  - [ ] 9.1 Create EducationStep component in `frontend/src/components/CVEditor/steps/EducationStep.tsx`
    - Display list of education entries
    - Add "Add Education" button
    - _Requirements: 4.1, 4.2, 4.6_
  - [ ] 9.2 Create EducationCard component in `frontend/src/components/CVEditor/components/EducationCard.tsx`
    - Editable fields for school, degree, field, dates, GPA, achievements
    - GPA validation with error display
    - Delete button with confirmation
    - _Requirements: 4.3, 4.4, 4.5_

- [ ] 10. Implement Skills Step (Step 4)
  - [ ] 10.1 Create SkillsStep component in `frontend/src/components/CVEditor/steps/SkillsStep.tsx`
    - Display skill categories with items
    - Add "Add Category" button
    - Suggest common categories: Languages, Frameworks, Tools, Soft Skills
    - _Requirements: 5.1, 5.2, 5.6_
  - [ ] 10.2 Create SkillCategoryCard component in `frontend/src/components/CVEditor/components/SkillCategoryCard.tsx`
    - Editable category name
    - Add/remove skills within category
    - Support comma-separated bulk input
    - Delete category button with confirmation
    - _Requirements: 5.3, 5.4, 5.5, 5.7_
  - [ ]* 10.3 Write property test for comma-separated parsing
    - **Property 11: Comma-Separated Skill Parsing**
    - **Validates: Requirements 5.7**

- [ ] 11. Implement Projects & Certifications Step (Step 5)
  - [ ] 11.1 Create ProjectsCertsStep component in `frontend/src/components/CVEditor/steps/ProjectsCertsStep.tsx`
    - Display projects section and certifications section
    - Add buttons for both types
    - _Requirements: 6.1, 6.5_
  - [ ] 11.2 Create ProjectCard component in `frontend/src/components/CVEditor/components/ProjectCard.tsx`
    - Editable fields for name, description, technologies, link, dates
    - URL validation for project link
    - _Requirements: 6.2, 6.4_
  - [ ] 11.3 Create CertificationCard component in `frontend/src/components/CVEditor/components/CertificationCard.tsx`
    - Editable fields for name, issuer, date, credentialUrl
    - _Requirements: 6.3_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Templates & Preview

- [ ] 13. Implement CV templates
  - [ ] 13.1 Update HarvardTemplate in `frontend/src/components/templates/HarvardTemplate.tsx`
    - Ensure all CVData fields are rendered
    - Use serif fonts, traditional layout
    - Optimize for ATS compatibility
    - _Requirements: 7.5_
  - [ ] 13.2 Update ModernTemplate in `frontend/src/components/templates/ModernTemplate.tsx`
    - Sidebar layout with skills section
    - Clean sans-serif fonts
    - _Requirements: 7.6_
  - [ ] 13.3 Update AnalyticsTemplate in `frontend/src/components/templates/AnalyticsTemplate.tsx`
    - Grid-based layout
    - Emphasize projects and technical skills
    - _Requirements: 7.7_
  - [ ] 13.4 Create CVPreview component in `frontend/src/components/CVEditor/preview/CVPreview.tsx`
    - Render selected template with current CVData
    - A4 dimensions (210mm x 297mm)
    - Real-time updates on data change
    - _Requirements: 7.3, 7.4_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: PDF Generation

- [ ] 15. Implement PDF generation
  - [ ] 15.1 Install and configure @react-pdf/renderer
    - Add dependency to frontend package.json
    - Create PDF-compatible template components
    - _Requirements: 8.1_
  - [ ] 15.2 Create PDFGenerator service in `frontend/src/services/pdfGenerator.ts`
    - Implement generate(cvData) method returning Blob
    - Implement getFilename(cvData) method
    - Handle A4 page size
    - _Requirements: 8.1, 8.3, 8.7_
  - [ ] 15.3 Create PDF template components in `frontend/src/components/templates/pdf/`
    - HarvardPDF.tsx - PDF version of Harvard template
    - ModernPDF.tsx - PDF version of Modern template
    - AnalyticsPDF.tsx - PDF version of Analytics template
    - _Requirements: 8.2_
  - [ ] 15.4 Integrate PDF download into wizard final step
    - Add "Download PDF" button
    - Show loading indicator during generation
    - Handle errors with retry option
    - _Requirements: 8.1, 8.5, 8.6, 10.5_
  - [ ]* 15.5 Write property tests for PDF generation
    - **Property 13: PDF Generation Validity**
    - **Property 14: PDF Text Extractability**
    - **Property 15: PDF Filename Format**
    - **Validates: Requirements 8.1, 8.3, 8.4, 8.7**

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Completeness & Scoring

- [ ] 17. Implement completeness calculator
  - [ ] 17.1 Create useCompleteness hook in `frontend/src/hooks/useCompleteness.ts`
    - Calculate completeness percentage based on filled sections
    - Apply weights: Personal (15%), Experience (30%), Education (15%), Skills (20%), Summary (10%), Projects/Certs (10%)
    - Identify incomplete sections
    - _Requirements: 13.1, 13.2, 13.3_
  - [ ]* 17.2 Write property tests for completeness calculation
    - **Property 22: Completeness Calculation Accuracy**
    - **Property 23: Completeness Threshold Indicator**
    - **Property 24: CV Ready Indicator Correctness**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.5**
  - [ ] 17.3 Create CompletenessIndicator component in `frontend/src/components/CVEditor/components/CompletenessIndicator.tsx`
    - Display percentage with progress bar
    - Show "CV Ready" when complete
    - List incomplete sections when below 70%
    - _Requirements: 13.1, 13.3, 13.4, 13.5_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: AI Enhancement Integration

- [ ] 19. Enhance Swarm Orchestrator for multi-model support
  - [ ] 19.1 Update SwarmOrchestrator in `server/src/swarm/orchestrator.ts`
    - Add model detection via Ollama API
    - Implement configurable model selection
    - Add fallback logic for unavailable models
    - Support worker count configuration via environment variable
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ]* 19.2 Write property test for model fallback
    - **Property 19: Model Fallback Behavior**
    - **Validates: Requirements 11.3**
  - [ ] 19.3 Create enhancement API endpoints in `server/src/index.ts`
    - POST /api/cv/enhance-bullet - Enhance single bullet point
    - POST /api/cv/score-bullet - Score bullet point (1-5)
    - _Requirements: 12.2, 12.4_
  - [ ]* 19.4 Write property tests for AI enhancement
    - **Property 20: Bullet Point Enhancement Difference**
    - **Property 21: Bullet Point Score Range**
    - **Validates: Requirements 12.2, 12.4**

- [ ] 20. Integrate AI features into frontend
  - [ ] 20.1 Update BulletPointEditor with AI enhancement
    - Add "Enhance with AI" button functionality
    - Display original and enhanced versions
    - Allow user to accept or reject enhancement
    - _Requirements: 12.1, 12.2, 12.3_
  - [ ] 20.2 Add bullet scoring to Experience step
    - Score bullets when section is complete
    - Display scores visually (1-5 stars or similar)
    - _Requirements: 12.4_

- [ ] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: CV Import

- [ ] 22. Implement CV import functionality
  - [ ] 22.1 Create ImportCV component in `frontend/src/components/CVEditor/ImportCV.tsx`
    - Add "Import CV" option on landing/editor page
    - PDF upload with drag-and-drop
    - _Requirements: 14.1_
  - [ ] 22.2 Enhance CV Parser in `server/src/cvparser.ts`
    - Improve section classification using Swarm
    - Extract structured data into CVData format
    - Handle unclassified content
    - _Requirements: 14.2, 14.4, 14.5_
  - [ ]* 22.3 Write property tests for CV parsing
    - **Property 25: CV Parser Section Classification**
    - **Property 26: Parser Unclassified Fallback**
    - **Validates: Requirements 14.2, 14.4, 14.5**
  - [ ] 22.4 Create import review flow
    - Display parsed data for user review
    - Allow editing before saving
    - _Requirements: 14.3, 14.6_

- [ ] 23. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Final Integration & Polish

- [ ] 24. Wire up complete wizard flow
  - [ ] 24.1 Update App.tsx to integrate new CVEditor
    - Add route/view for CV Editor
    - Connect to existing navigation
    - _Requirements: All_
  - [ ] 24.2 Add unsaved changes warning
    - Prompt user when leaving with unsaved changes
    - _Requirements: 10.7_
  - [ ] 24.3 Create "My CVs" list view
    - Display all saved CVs with metadata
    - Show last modified date and completeness
    - Allow opening, duplicating, deleting CVs
    - _Requirements: 9.7_

- [ ] 25. Error handling and edge cases
  - [ ] 25.1 Add error boundaries to wizard components
    - Wrap each step in error boundary
    - Provide fallback UI with retry option
    - _Requirements: Error Handling_
  - [ ] 25.2 Handle offline/storage errors gracefully
    - Show toast notifications for errors
    - Implement retry logic
    - _Requirements: Error Handling_

- [ ] 26. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
