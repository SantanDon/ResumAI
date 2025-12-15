# Requirements Document

## Introduction

This specification covers the Core Foundation phase (Weeks 1-2) of ResumAI, focusing on completing the CV Editor wizard with full CRUD functionality, implementing real PDF generation, creating production-ready templates, and establishing a file-based storage system. This phase transforms the current prototype into a functional MVP that users can actually use to create, edit, and export professional CVs.

## Glossary

- **CV Editor**: The wizard-based interface for creating and editing CVs step-by-step
- **CVData**: The complete data model representing all CV information
- **Template**: A visual layout/design for rendering CV data into a formatted document
- **PDF Generation**: The process of converting CVData into a downloadable PDF file
- **File Storage**: A JSON-based persistence layer for saving CV data per user
- **Wizard Step**: A discrete section of the CV editor focusing on one data category
- **ATS**: Applicant Tracking System - automated resume screening software

## Requirements

### Requirement 1: Complete CV Data Model

**User Story:** As a user, I want a comprehensive data structure for my CV, so that all my professional information can be captured and organized.

#### Acceptance Criteria

1. THE CVData model SHALL include personal information fields: fullName, email, phone, location, linkedin, website, and summary
2. THE CVData model SHALL include an array of experience entries with: id, company, role, startDate, endDate, current (boolean), location, and description (array of bullet points)
3. THE CVData model SHALL include an array of education entries with: id, school, degree, field, startDate, endDate, gpa, and achievements
4. THE CVData model SHALL include an array of skill categories with: category name and items array
5. THE CVData model SHALL include an optional array of project entries with: id, name, description, technologies, link, startDate, and endDate
6. THE CVData model SHALL include an optional array of certification entries with: id, name, issuer, date, and credentialUrl
7. WHEN a new CV is created THEN the CV Editor SHALL initialize with empty/default CVData structure

### Requirement 2: Personal Information Editor (Wizard Step 1-2)

**User Story:** As a user, I want to enter my personal and contact information, so that employers can identify and reach me.

#### Acceptance Criteria

1. WHEN the user is on the Personal Info step THEN the CV Editor SHALL display input fields for fullName, email, phone, location, linkedin, and website
2. WHEN the user enters an email THEN the CV Editor SHALL validate the email format and display an error for invalid formats
3. WHEN the user enters a phone number THEN the CV Editor SHALL accept various formats and normalize the display
4. WHEN the user modifies any personal info field THEN the CV Editor SHALL update the live preview immediately
5. THE CV Editor SHALL allow the user to proceed to the next step even with incomplete personal info
6. WHEN the user enters a LinkedIn URL THEN the CV Editor SHALL validate it starts with linkedin.com or is empty

### Requirement 3: Experience Editor (Wizard Step 3)

**User Story:** As a user, I want to add and edit my work experience, so that I can showcase my professional history.

#### Acceptance Criteria

1. WHEN the user is on the Experience step THEN the CV Editor SHALL display a list of existing experience entries and an "Add Experience" button
2. WHEN the user clicks "Add Experience" THEN the CV Editor SHALL create a new empty experience entry with a unique id
3. WHEN the user edits an experience entry THEN the CV Editor SHALL provide fields for company, role, startDate, endDate, current checkbox, location, and bullet points
4. WHEN the user checks "Current Position" THEN the CV Editor SHALL disable the endDate field and display "Present"
5. WHEN the user adds a bullet point THEN the CV Editor SHALL append a new empty bullet to the description array
6. WHEN the user removes a bullet point THEN the CV Editor SHALL delete that bullet from the description array
7. WHEN the user deletes an experience entry THEN the CV Editor SHALL remove it from the experiences array after confirmation
8. WHEN the user reorders experience entries THEN the CV Editor SHALL update the array order via drag-and-drop
9. THE CV Editor SHALL display experience entries in reverse chronological order by default

### Requirement 4: Education Editor (Wizard Step 4)

**User Story:** As a user, I want to add my educational background, so that I can demonstrate my qualifications.

#### Acceptance Criteria

1. WHEN the user is on the Education step THEN the CV Editor SHALL display existing education entries and an "Add Education" button
2. WHEN the user clicks "Add Education" THEN the CV Editor SHALL create a new empty education entry with a unique id
3. WHEN the user edits an education entry THEN the CV Editor SHALL provide fields for school, degree, field of study, startDate, endDate, gpa, and achievements
4. WHEN the user enters a GPA THEN the CV Editor SHALL validate it is a number between 0 and 4.0 (or 0-100 for percentage systems)
5. WHEN the user deletes an education entry THEN the CV Editor SHALL remove it after confirmation
6. THE CV Editor SHALL allow multiple education entries to be added

### Requirement 5: Skills Editor (Wizard Step 5)

**User Story:** As a user, I want to organize my skills by category, so that employers can quickly assess my capabilities.

#### Acceptance Criteria

1. WHEN the user is on the Skills step THEN the CV Editor SHALL display skill categories with their items
2. WHEN the user clicks "Add Category" THEN the CV Editor SHALL create a new skill category with an empty name and items array
3. WHEN the user adds a skill to a category THEN the CV Editor SHALL append the skill to that category's items array
4. WHEN the user removes a skill THEN the CV Editor SHALL delete it from the category's items array
5. WHEN the user deletes a skill category THEN the CV Editor SHALL remove the entire category after confirmation
6. THE CV Editor SHALL suggest common skill categories: Languages, Frameworks, Tools, Soft Skills
7. WHEN the user types a skill THEN the CV Editor SHALL allow comma-separated input for bulk adding

### Requirement 6: Projects and Certifications Editor (Wizard Step 6)

**User Story:** As a user, I want to add projects and certifications, so that I can highlight additional achievements.

#### Acceptance Criteria

1. WHEN the user is on the Projects/Certifications step THEN the CV Editor SHALL display sections for both projects and certifications
2. WHEN the user adds a project THEN the CV Editor SHALL provide fields for name, description, technologies (array), link, startDate, and endDate
3. WHEN the user adds a certification THEN the CV Editor SHALL provide fields for name, issuer, date, and credentialUrl
4. WHEN the user enters a project link THEN the CV Editor SHALL validate it is a valid URL format
5. THE CV Editor SHALL allow these sections to remain empty as they are optional

### Requirement 7: Template Selection and Preview

**User Story:** As a user, I want to choose from professional templates and see a live preview, so that I can visualize my final CV.

#### Acceptance Criteria

1. WHEN the user is on the Template step THEN the CV Editor SHALL display at least 3 template options: Harvard Classic, Modern Minimalist, and Data & Analytics
2. WHEN the user selects a template THEN the CV Editor SHALL immediately update the preview panel with the selected template
3. THE CV Editor SHALL display a live preview panel that updates in real-time as the user edits any field
4. WHEN the preview is displayed THEN the CV Editor SHALL render the CV at A4 paper dimensions (210mm x 297mm)
5. THE Harvard Classic template SHALL use serif fonts, traditional layout, and be ATS-optimized
6. THE Modern Minimalist template SHALL use a sidebar layout with skills section and clean sans-serif fonts
7. THE Data & Analytics template SHALL use a grid-based layout emphasizing projects and technical skills

### Requirement 8: PDF Generation

**User Story:** As a user, I want to download my CV as a PDF, so that I can share it with employers.

#### Acceptance Criteria

1. WHEN the user clicks "Download PDF" THEN the CV Editor SHALL generate a PDF file matching the selected template
2. THE generated PDF SHALL maintain the exact visual layout shown in the preview
3. THE generated PDF SHALL be A4 size (210mm x 297mm)
4. THE generated PDF SHALL have selectable/copyable text for ATS compatibility
5. WHEN PDF generation is in progress THEN the CV Editor SHALL display a loading indicator
6. IF PDF generation fails THEN the CV Editor SHALL display an error message with retry option
7. THE generated PDF filename SHALL follow the format: "{fullName}_CV_{timestamp}.pdf"

### Requirement 9: File-Based Storage System

**User Story:** As a user, I want my CV data to be saved automatically, so that I don't lose my work.

#### Acceptance Criteria

1. WHEN the user modifies any CV data THEN the system SHALL auto-save to local storage within 2 seconds
2. WHEN the user returns to the CV Editor THEN the system SHALL restore their previously saved CV data
3. THE storage system SHALL save CVData as JSON format
4. WHEN the user explicitly clicks "Save" THEN the system SHALL persist the current CV state immediately
5. THE system SHALL support saving multiple CV versions per user
6. WHEN the user creates a new CV THEN the system SHALL generate a unique CV identifier
7. THE system SHALL provide a "My CVs" list showing all saved CVs with last modified date

### Requirement 10: Wizard Navigation and UX

**User Story:** As a user, I want clear navigation through the CV creation process, so that I can easily complete my CV.

#### Acceptance Criteria

1. THE CV Editor SHALL display a progress indicator showing current step and total steps
2. WHEN the user clicks "Next" THEN the CV Editor SHALL advance to the next wizard step
3. WHEN the user clicks "Back" THEN the CV Editor SHALL return to the previous wizard step
4. THE CV Editor SHALL allow direct navigation to any completed step via the progress indicator
5. WHEN the user is on the final step THEN the CV Editor SHALL display "Download PDF" and "Save" buttons
6. THE CV Editor SHALL preserve all entered data when navigating between steps
7. IF the user attempts to leave with unsaved changes THEN the CV Editor SHALL prompt for confirmation

### Requirement 11: Multi-Model Swarm Support

**User Story:** As a system administrator, I want to configure which Ollama models the swarm uses, so that I can optimize for speed, quality, or cost.

#### Acceptance Criteria

1. THE Swarm Orchestrator SHALL detect available models by querying Ollama's model list
2. THE Swarm Orchestrator SHALL support configurable model selection from available models: llama3.2:1b, tinyllama:1.1b, deepseek-coder:1.3b, phi:2.7b, orca-mini:3b, granite3.3:2b, qwen3-vl:2b
3. WHEN a configured model is unavailable THEN the Swarm Orchestrator SHALL fallback to the next available model in priority order
4. THE Swarm Orchestrator SHALL allow configuring worker count (3-7 workers) via environment variable
5. THE Swarm Orchestrator SHALL log which model and worker count is being used on startup
6. WHEN using vision-capable models (qwen3-vl) THEN the Swarm Orchestrator SHALL enable image-based CV parsing

### Requirement 12: AI-Powered CV Enhancement

**User Story:** As a user, I want AI suggestions to improve my CV content, so that I can create a more impactful resume.

#### Acceptance Criteria

1. WHEN the user enters a bullet point THEN the CV Editor SHALL offer an "Enhance with AI" button
2. WHEN the user clicks "Enhance with AI" on a bullet point THEN the Swarm SHALL generate an improved version using action verbs and metrics
3. THE CV Editor SHALL display both original and enhanced versions for user selection
4. WHEN the user completes the Experience section THEN the CV Editor SHALL offer to analyze and score bullet points (1-5 scale)
5. THE CV Editor SHALL provide AI-generated suggestions for missing sections based on job type
6. WHEN generating suggestions THEN the Swarm SHALL use the 2025 Career Strategist persona for modern, ATS-optimized advice

### Requirement 13: CV Completeness and Scoring

**User Story:** As a user, I want to see how complete and strong my CV is, so that I know what to improve.

#### Acceptance Criteria

1. THE CV Editor SHALL display a completeness percentage based on filled sections
2. THE CV Editor SHALL calculate completeness as: Personal Info (15%), Experience (30%), Education (15%), Skills (20%), Summary (10%), Projects/Certs (10%)
3. WHEN completeness is below 70% THEN the CV Editor SHALL highlight missing or incomplete sections
4. THE CV Editor SHALL display section-specific tips for improvement
5. WHEN all required fields are complete THEN the CV Editor SHALL show a "CV Ready" indicator

### Requirement 14: Import Existing CV

**User Story:** As a user, I want to import my existing CV, so that I don't have to re-enter all my information.

#### Acceptance Criteria

1. THE CV Editor SHALL provide an "Import CV" option on the landing page
2. WHEN the user uploads a PDF THEN the CV Parser SHALL extract text and classify sections using the Swarm
3. WHEN parsing is complete THEN the CV Editor SHALL populate the CVData fields with extracted information
4. THE CV Parser SHALL identify and extract: name, email, phone, experience entries, education entries, and skills
5. WHEN parsing cannot confidently classify content THEN the CV Editor SHALL place it in an "Unclassified" section for manual review
6. THE CV Editor SHALL allow the user to review and correct all imported data before saving
