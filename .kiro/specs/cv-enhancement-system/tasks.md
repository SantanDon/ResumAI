# Implementation Plan

## Phase 1: Knowledge Base & Data Foundation

- [x] 1. Create Power Words Database




  - [ ] 1.1 Create power words JSON file at `server/src/data/powerWords.json`
    - Add 100+ power words across 5 categories: Leadership, Achievement, Technical, Communication, Problem-Solving
    - Include strength ratings (1-5) for each word
    - Map weak words to strong replacements
    - Add industry associations for each word
    - _Requirements: 3.1, 3.2_
  - [x]* 1.2 Write property test for power words database completeness


    - **Property 6: Power Words Database Completeness**
    - **Validates: Requirements 3.1**
  - [x] 1.3 Create PowerWordsService in `server/src/services/powerWords.ts`




    - Implement getByCategory(), getByIndustry(), suggestReplacement()
    - Implement weak word detection
    - Implement cliché detection
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 2. Create Industry Profiles


  - [ ] 2.1 Create industry profiles JSON at `server/src/data/industryProfiles.json`
    - Define profiles for: Technology, Finance, Healthcare, Marketing, Engineering, Education, Legal




    - Include required/optional sections, priority skills, power words, certifications, keywords
    - Define format preferences per industry
    - _Requirements: 9.1, 9.2, 9.3_
  - [ ]* 2.2 Write property test for industry profile coverage
    - **Property 27: Industry Profile Coverage**
    - **Validates: Requirements 9.1**
  - [ ] 2.3 Create IndustryProfileService in `server/src/services/industryProfiles.ts`
    - Implement getProfile(), getKeywords(), getCertifications()




    - Implement industry-specific validation
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ] 3. Extend Database Schema
  - [ ] 3.1 Update `server/src/db.ts` with new tables
    - Add tailored_cvs table

    - Add job_queue table
    - Add user_preferences table
    - _Requirements: 6.5, 6.7, 7.1, 8.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: CV Intelligence Service

- [ ] 5. Implement Bullet Point Analysis
  - [ ] 5.1 Create CVIntelligenceService in `server/src/services/cvIntelligence.ts`
    - Implement analyzeBullet() returning action verb strength, quantification, impact clarity
    - Integrate with PowerWordsService for verb strength scoring
    - Detect missing metrics and vague language
    - _Requirements: 3.3, 4.1_
  - [ ]* 5.2 Write property test for bullet score range
    - **Property 8: Bullet Score Range**
    - **Validates: Requirements 3.3**
  - [ ] 5.3 Implement bullet enhancement using Swarm
    - Create enhanceBullet() method
    - Use 2025 Career Strategist persona
    - Replace weak verbs with power words
    - Suggest adding metrics
    - _Requirements: 3.2, 3.5_
  - [ ]* 5.4 Write property test for weak verb replacement
    - **Property 7: Weak Verb Replacement**
    - **Validates: Requirements 3.2**

- [ ] 6. Implement CV Analysis
  - [ ] 6.1 Create analyzeCV() method in CVIntelligenceService
    - Calculate CV Strength Score (0-100)
    - Identify top 5 strongest experiences
    - Detect skill gaps
    - Find quantifiable achievements
    - _Requirements: 4.1, 4.2_
  - [ ]* 6.2 Write property test for strength score range
    - **Property 11: Strength Score Range**
    - **Validates: Requirements 4.2**
  - [ ] 6.3 Implement improvement suggestions
    - Generate specific improvements when score < 70
    - Detect redundant information
    - Flag missing critical sections
    - _Requirements: 4.3, 4.4_
  - [ ]* 6.4 Write property test for low score improvements
    - **Property 12: Low Score Improvements**
    - **Validates: Requirements 4.3**

- [ ] 7. Implement Outdated Practice Detection
  - [ ] 7.1 Create detectOutdatedPractices() method
    - Detect objective statements
    - Detect "references available upon request"
    - Detect photo mentions




    - Detect full street addresses
    - _Requirements: 2.2_
  - [ ]* 7.2 Write property test for outdated practice detection
    - **Property 5: Outdated Practice Detection**
    - **Validates: Requirements 2.2**

- [x] 8. Implement Cliché Detection

  - [ ] 8.1 Create detectCliches() method
    - Check against cliché database
    - Return list of found clichés with suggestions
    - _Requirements: 3.4_
  - [ ]* 8.2 Write property test for cliché detection
    - **Property 9: Cliché Detection**
    - **Validates: Requirements 3.4**


- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Job Matching Service

- [x] 10. Implement Job Requirements Extraction

  - [x] 10.1 Create JobMatcherService in `server/src/services/jobMatcher.ts`

    - Implement extractRequirements() using Swarm
    - Extract required skills, preferred skills, responsibilities, keywords
    - Identify experience level and industry
    - _Requirements: 5.1_
  - [ ]* 10.2 Write property test for job requirements extraction
    - **Property 14: Job Requirements Extraction**
    - **Validates: Requirements 5.1**

- [ ] 11. Implement Match Score Calculation
  - [ ] 11.1 Create calculateMatch() method
    - Compare Master CV skills to job requirements
    - Calculate percentage match



    - Identify matched and missing skills
    - _Requirements: 5.5_
  - [ ]* 11.2 Write property test for match score range
    - **Property 17: Match Score Range**

    - **Validates: Requirements 5.5**
  - [ ] 11.3 Implement low match warnings
    - Generate warning when match < 60%
    - Suggest skill development areas
    - _Requirements: 5.6_
  - [ ]* 11.4 Write property test for low match warning
    - **Property 18: Low Match Warning**

    - **Validates: Requirements 5.6**

- [ ] 12. Implement Experience Ranking
  - [ ] 12.1 Create rankExperiences() method
    - Score each experience against job requirements
    - Sort by relevance
    - Return top N most relevant

    - _Requirements: 5.2_

  - [ ]* 12.2 Write property test for relevant experience selection
    - **Property 15: Relevant Experience Selection**
    - **Validates: Requirements 5.2**

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Tailored CV Generator

- [x] 14. Implement Tailored CV Generation


  - [x] 14.1 Create TailoredCVGenerator in `server/src/services/tailoredCVGenerator.ts`

    - Implement generate() method
    - Select relevant experiences from Master CV
    - Reorder bullet points by relevance
    - Generate tailored summary
    - _Requirements: 5.2, 5.3_

  - [ ] 14.2 Implement keyword injection
    - Naturally inject job keywords into content
    - Avoid keyword stuffing
    - Track injected keywords
    - _Requirements: 5.4_
  - [ ]* 14.3 Write property test for keyword injection
    - **Property 16: Keyword Injection**

    - **Validates: Requirements 5.4**
  - [ ] 14.4 Implement factual preservation check
    - Ensure no fabricated information
    - Validate all content exists in Master CV
    - _Requirements: 5.7_
  - [ ]* 14.5 Write property test for factual preservation
    - **Property 13: Optimization Factual Preservation**
    - **Validates: Requirements 4.5, 5.7**

- [x] 15. Create API Endpoints for CV Generation


  - [x] 15.1 Add POST /api/cv/tailor-for-job endpoint

    - Accept job description and user ID
    - Return tailored CV with match score
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


  - [ ] 15.2 Add POST /api/cv/analyze-job endpoint
    - Extract and return job requirements




    - Return match score without generating CV
    - _Requirements: 5.1, 5.5_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: ATS Analyzer


- [ ] 17. Implement ATS Analysis
  - [ ] 17.1 Create ATSAnalyzerService in `server/src/services/atsAnalyzer.ts`
    - Implement analyze() returning score and issues
    - Check for parseable text
    - Validate section headers

    - Check font compatibility
    - _Requirements: 10.1, 10.2_

  - [ ]* 17.2 Write property test for ATS score range
    - **Property 29: ATS Score Range**
    - **Validates: Requirements 10.1**
  - [ ] 17.3 Implement issue detection with fixes
    - Provide specific fix for each issue
    - Categorize as critical/warning/suggestion
    - _Requirements: 10.3_

  - [ ]* 17.4 Write property test for ATS issue fixes
    - **Property 30: ATS Issue Fixes**
    - **Validates: Requirements 10.3**


- [ ] 18. Implement ATS Parsing Simulation
  - [ ] 18.1 Create simulateParsing() method
    - Extract name, email, phone

    - Extract skills list

    - Extract experience entries
    - Extract education entries
    - _Requirements: 10.4_

  - [ ]* 18.2 Write property test for ATS parsing simulation
    - **Property 31: ATS Parsing Simulation**
    - **Validates: Requirements 10.4**

- [ ] 19. Implement PDF Text Extraction Check
  - [ ] 19.1 Create checkTextExtractability() method
    - Verify PDF has text layer


    - Test text extraction
    - _Requirements: 1.6, 10.5_
  - [ ]* 19.2 Write property test for PDF text extractability
    - **Property 4: PDF Text Extractability**
    - **Validates: Requirements 1.6, 10.5**

- [ ] 20. Create ATS API Endpoints
  - [ ] 20.1 Add POST /api/cv/ats-check endpoint
    - Accept CV content or PDF
    - Return ATS score and issues
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ] 20.2 Add POST /api/cv/ats-simulate endpoint
    - Return simulated ATS extraction
    - _Requirements: 10.4_

- [ ] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Batch Application System

- [x] 22. Implement Job Queue Manager

  - [x] 22.1 Create JobQueueManager in `server/src/services/jobQueueManager.ts`

    - Implement addJob(), removeJob(), getQueueStatus()
    - Store jobs in database
    - _Requirements: 6.1_

  - [ ] 22.2 Implement batch processing
    - Process all jobs in queue
    - Generate tailored CV for each
    - Track status per job
    - _Requirements: 6.2_
  - [ ]* 22.3 Write property test for batch CV generation count
    - **Property 19: Batch CV Generation Count**
    - **Validates: Requirements 6.2**



- [ ] 23. Implement Batch Save and Status Tracking
  - [ ] 23.1 Implement saveBatch() method
    - Save all tailored CVs with metadata
    - Update job queue status
    - _Requirements: 6.5_
  - [x]* 23.2 Write property test for batch save completeness

    - **Property 20: Batch Save Completeness**
    - **Validates: Requirements 6.5**
  - [ ] 23.3 Implement status tracking
    - Track draft/ready/sent status
    - Log timestamps for transitions
    - _Requirements: 6.7_
  - [ ]* 23.4 Write property test for status tracking
    - **Property 21: Application Status Tracking**
    - **Validates: Requirements 6.7**



- [ ] 24. Create Batch API Endpoints
  - [x] 24.1 Add POST /api/jobs/queue endpoint

    - Add job to queue
    - _Requirements: 6.1_
  - [x] 24.2 Add POST /api/jobs/process endpoint

    - Process entire queue
    - Return all generated CVs
    - _Requirements: 6.2_
  - [ ] 24.3 Add GET /api/jobs/status endpoint
    - Return queue status
    - _Requirements: 6.3_

- [ ] 25. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


## Phase 7: CV Version Management


- [ ] 26. Implement CV Version Storage
  - [ ] 26.1 Create CVVersionManager in `server/src/services/cvVersionManager.ts`
    - Implement save(), get(), list(), delete()
    - Link tailored CVs to Master CV
    - _Requirements: 7.1, 7.3_
  - [ ]* 26.2 Write property test for CV version linkage
    - **Property 22: CV Version Linkage**
    - **Validates: Requirements 7.1**

- [x] 27. Implement PDF Export with Naming

  - [x] 27.1 Update PDF generator for consistent naming

    - Format: "{Name}_{Company}_{Date}.pdf"
    - _Requirements: 7.5_
  - [ ]* 27.2 Write property test for PDF filename format
    - **Property 23: PDF Filename Format**
    - **Validates: Requirements 7.5**



- [ ] 28. Create Version Management API Endpoints
  - [ ] 28.1 Add GET /api/cv/versions endpoint
    - List all CV versions for user
    - Include metadata (job, company, date, score)

    - _Requirements: 7.2_
  - [ ] 28.2 Add DELETE /api/cv/versions/:id endpoint
    - Delete specific version
    - _Requirements: 7.3_

- [ ] 29. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Real-Time Suggestions


- [x] 30. Implement Real-Time Analysis

  - [ ] 30.1 Create RealTimeSuggestionService in `server/src/services/realTimeSuggestions.ts`
    - Implement fast bullet analysis (< 2 seconds)
    - Generate inline suggestions
    - _Requirements: 8.1, 8.2_
  - [ ]* 30.2 Write property test for analysis speed
    - **Property 24: Real-Time Analysis Speed**
    - **Validates: Requirements 8.1**
  - [ ]* 30.3 Write property test for suggestion generation
    - **Property 25: Suggestion Generation**

    - **Validates: Requirements 8.2**


- [ ] 31. Implement User Preference Learning
  - [ ] 31.1 Create preference storage
    - Store accepted/rejected suggestions
    - Track suggestion types
    - _Requirements: 8.5_
  - [ ]* 31.2 Write property test for preference learning
    - **Property 26: User Preference Learning**
    - **Validates: Requirements 8.5**




- [ ] 32. Create Suggestion API Endpoint
  - [ ] 32.1 Add POST /api/cv/suggest endpoint
    - Accept bullet point text

    - Return suggestions within 2 seconds
    - _Requirements: 8.1, 8.2_
  - [ ] 32.2 Add POST /api/cv/suggestion-feedback endpoint
    - Record acceptance/rejection
    - _Requirements: 8.5_

- [ ] 33. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Harvard Template Enhancement

- [ ] 34. Update Harvard Template
  - [ ] 34.1 Update HarvardTemplate in `frontend/src/components/templates/HarvardTemplate.tsx`
    - Ensure correct section order
    - Use serif fonts (Times New Roman style)
    - Implement consistent date formatting
    - Ensure action verb bullet points
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 34.2 Write property test for section order
    - **Property 1: Harvard Template Section Order**
    - **Validates: Requirements 1.2**
  - [ ]* 34.3 Write property test for date format
    - **Property 2: Date Format Consistency**
    - **Validates: Requirements 1.3**
  - [ ]* 34.4 Write property test for action verb bullets
    - **Property 3: Action Verb Bullet Points**
    - **Validates: Requirements 1.4**

- [ ] 35. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 10: Frontend Integration

- [ ] 36. Create Batch Application UI
  - [ ] 36.1 Create BatchApplicationDashboard in `frontend/src/components/BatchApplication/`
    - Job queue management UI
    - Add jobs via URL or paste
    - Display queue with status
    - _Requirements: 6.1, 6.3_
  - [ ] 36.2 Create TailoredCVPreview component
    - Show generated CV with match score
    - Allow editing before finalizing
    - _Requirements: 6.3, 6.4_
  - [ ] 36.3 Integrate with Mass Mail
    - Connect approved CVs to email sending
    - _Requirements: 6.6_

- [ ] 37. Create CV Version Manager UI
  - [ ] 37.1 Create CVVersionList component
    - Display all CV versions
    - Show job, company, date, scores
    - _Requirements: 7.2_
  - [ ] 37.2 Add version actions
    - Duplicate, edit, delete, export
    - _Requirements: 7.3_

- [ ] 38. Create Real-Time Suggestion UI
  - [ ] 38.1 Update BulletPointEditor with suggestions
    - Show inline suggestions
    - One-click acceptance
    - _Requirements: 8.3, 8.4_

- [ ] 39. Create ATS Checker UI
  - [ ] 39.1 Create ATSCheckerPanel component
    - Display ATS score
    - List issues with fixes
    - Show simulated extraction
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 40. Update AI Chat with Industry Selection
  - [ ] 40.1 Add industry selector to AIChatInterface
    - Allow selecting target industry
    - Adjust suggestions based on industry
    - _Requirements: 9.2_

- [ ] 41. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
