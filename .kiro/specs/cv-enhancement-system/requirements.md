# Requirements Document

## Introduction

This specification focuses on enhancing the existing ResumAI system with advanced CV intelligence features. The system already has CV parsing, AI chat, mass mail, and basic CV editing. This enhancement adds: (1) Harvard-style professional CV templates with 2025 hiring trends knowledge, (2) intelligent CV content optimization based on hiring manager preferences, (3) automated job-specific CV generation from a Master CV, and (4) streamlined mass job application workflow.

## Glossary

- **Master CV**: The comprehensive CV containing all user's experiences, skills, and achievements stored in the database
- **Tailored CV**: A job-specific CV generated from the Master CV, optimized for a particular job posting
- **Harvard Style**: Traditional, ATS-optimized CV format with serif fonts, clear sections, and professional layout
- **ATS**: Applicant Tracking System - automated resume screening software used by employers
- **Power Words**: Action verbs and impactful phrases that appeal to hiring managers
- **CV Intelligence**: AI-powered analysis and optimization of CV content based on hiring trends
- **Batch Application**: Applying to multiple jobs with automatically tailored CVs

## Requirements

### Requirement 1: Harvard-Style Professional Template

**User Story:** As a job seeker, I want my CV to follow the Harvard professional format, so that it looks credible and passes ATS systems.

#### Acceptance Criteria

1. THE Harvard template SHALL use Times New Roman or similar serif font at 10-12pt size
2. THE Harvard template SHALL include sections in order: Contact Info, Summary, Experience, Education, Skills, (Optional: Projects, Certifications)
3. THE Harvard template SHALL use consistent date formatting (Month Year - Month Year) aligned to the right
4. THE Harvard template SHALL use bullet points starting with action verbs for experience descriptions
5. THE Harvard template SHALL maintain 0.5-1 inch margins and single-page preference for <10 years experience
6. WHEN generating a CV THEN the system SHALL ensure all text is selectable for ATS parsing

### Requirement 2: 2025 Hiring Trends Knowledge Base

**User Story:** As a job seeker, I want the AI to understand current hiring trends, so that my CV reflects what employers are looking for in 2025.

#### Acceptance Criteria

1. THE AI persona SHALL incorporate 2025 hiring trends including: skills-first hiring, remote work experience, AI/automation literacy, and soft skills emphasis
2. WHEN analyzing a CV THEN the system SHALL identify outdated practices (objective statements, references available, photo inclusion, full address)
3. WHEN suggesting improvements THEN the system SHALL recommend trending skills relevant to the user's field
4. THE system SHALL maintain a knowledge base of industry-specific keywords and phrases
5. WHEN the user asks about CV best practices THEN the system SHALL provide 2025-specific guidance

### Requirement 3: Power Words and Hiring Manager Appeal

**User Story:** As a job seeker, I want my CV to use language that appeals to hiring managers, so that I stand out from other candidates.

#### Acceptance Criteria

1. THE system SHALL maintain a database of 100+ power words categorized by: Leadership, Achievement, Technical, Communication, Problem-Solving
2. WHEN enhancing a bullet point THEN the system SHALL replace weak verbs with power words (e.g., "helped" → "spearheaded", "worked on" → "engineered")
3. WHEN analyzing bullet points THEN the system SHALL score them on: Action verb strength (1-5), Quantification presence (yes/no), Impact clarity (1-5)
4. THE system SHALL flag and suggest removal of: Clichés ("team player", "hard worker"), Passive voice, First-person pronouns, Vague descriptions
5. WHEN the user adds a new bullet point THEN the system SHALL suggest power word alternatives in real-time

### Requirement 4: CV Content Optimization

**User Story:** As a job seeker, I want the AI to optimize my CV content, so that it highlights my most relevant qualifications.

#### Acceptance Criteria

1. WHEN analyzing the Master CV THEN the system SHALL identify: Top 5 strongest experiences, Key transferable skills, Quantifiable achievements, Skill gaps for target roles
2. THE system SHALL calculate a "CV Strength Score" (0-100) based on: Completeness, Power word usage, Quantification, Relevance, ATS compatibility
3. WHEN the score is below 70 THEN the system SHALL provide specific actionable improvements
4. THE system SHALL identify and flag: Redundant information, Missing critical sections, Inconsistent formatting, Spelling/grammar issues
5. WHEN the user requests optimization THEN the system SHALL generate an improved version preserving factual accuracy

### Requirement 5: Job-Specific CV Generation

**User Story:** As a job seeker, I want to automatically generate tailored CVs for specific jobs, so that I can apply to many positions efficiently.

#### Acceptance Criteria

1. WHEN the user provides a job description THEN the system SHALL extract: Required skills, Preferred qualifications, Key responsibilities, Company values/culture keywords
2. WHEN generating a tailored CV THEN the system SHALL select the most relevant experiences from the Master CV
3. WHEN generating a tailored CV THEN the system SHALL reorder bullet points to prioritize job-relevant achievements
4. WHEN generating a tailored CV THEN the system SHALL inject relevant keywords from the job description naturally
5. THE system SHALL generate a "Match Score" (0-100%) showing how well the tailored CV matches the job requirements
6. WHEN the match score is below 60% THEN the system SHALL warn the user and suggest skill development areas
7. THE system SHALL preserve the user's factual information and not fabricate experiences

### Requirement 6: Batch Job Application Workflow

**User Story:** As a job seeker, I want to apply to multiple jobs at once with tailored CVs, so that I can maximize my job search efficiency.

#### Acceptance Criteria

1. THE system SHALL allow users to add multiple job postings (URL or pasted text) to a queue
2. WHEN processing the job queue THEN the system SHALL generate a tailored CV for each job
3. THE system SHALL display a summary showing: Job title, Company, Match score, Generated CV preview
4. THE system SHALL allow the user to review and edit each tailored CV before finalizing
5. WHEN the user approves a batch THEN the system SHALL save all tailored CVs with job metadata
6. THE system SHALL integrate with the existing Mass Mail feature to send applications
7. THE system SHALL track application status: Draft, Ready, Sent, with timestamps

### Requirement 7: CV Version Management

**User Story:** As a job seeker, I want to manage multiple CV versions, so that I can track which CV I sent to which company.

#### Acceptance Criteria

1. THE system SHALL store each tailored CV as a separate version linked to the Master CV
2. WHEN viewing CV history THEN the system SHALL display: Version name, Target job/company, Created date, Match score
3. THE system SHALL allow users to duplicate, edit, or delete CV versions
4. WHEN the Master CV is updated THEN the system SHALL offer to regenerate affected tailored CVs
5. THE system SHALL export CV versions as PDF with consistent naming: "{Name}_{Company}_{Date}.pdf"

### Requirement 8: Real-Time Enhancement Suggestions

**User Story:** As a job seeker, I want real-time suggestions while editing my CV, so that I can improve it as I write.

#### Acceptance Criteria

1. WHEN the user types a bullet point THEN the system SHALL analyze it within 2 seconds
2. THE system SHALL display inline suggestions for: Stronger action verbs, Adding metrics, Clarifying impact
3. WHEN a suggestion is available THEN the system SHALL show it as a non-intrusive tooltip or sidebar hint
4. THE system SHALL allow one-click acceptance of suggestions
5. THE system SHALL learn from user acceptances/rejections to improve future suggestions

### Requirement 9: Industry-Specific Optimization

**User Story:** As a job seeker, I want CV advice specific to my industry, so that my CV meets sector expectations.

#### Acceptance Criteria

1. THE system SHALL support industry profiles for: Technology, Finance, Healthcare, Marketing, Engineering, Education, Legal
2. WHEN the user selects an industry THEN the system SHALL adjust: Recommended sections, Keyword priorities, Format preferences
3. THE system SHALL provide industry-specific power words and phrases
4. WHEN analyzing a CV for a specific industry THEN the system SHALL flag missing industry-standard sections
5. THE system SHALL suggest industry-relevant certifications and skills to add

### Requirement 10: ATS Compatibility Checker

**User Story:** As a job seeker, I want to ensure my CV passes ATS systems, so that it reaches human recruiters.

#### Acceptance Criteria

1. THE system SHALL analyze CV for ATS compatibility and provide a score (0-100)
2. THE system SHALL check for: Parseable text (no images/graphics for key info), Standard section headers, Compatible file format, Readable fonts
3. WHEN ATS issues are found THEN the system SHALL provide specific fixes
4. THE system SHALL simulate ATS parsing and show what information would be extracted
5. WHEN generating PDF THEN the system SHALL ensure text layer is preserved for ATS parsing
