/**
 * Master CV to JSON Resume Transformer Service
 * Transforms existing master_cv database entries to JSON Resume format
 */

import { MasterCVEntry } from '../db';
import {
  JSONResume,
  JSONResumeBasics,
  JSONResumeWork,
  JSONResumeEducation,
  JSONResumeSkill,
  JSONResumeProject,
  createEmptyJSONResume
} from '../types/jsonResume';

class MasterCVTransformerService {
  /**
   * Transform Master CV entries to JSON Resume format
   */
  toJSONResume(entries: MasterCVEntry[]): JSONResume {
    const cv = createEmptyJSONResume();
    
    // First, reclassify "unknown" entries based on content analysis
    const reclassifiedEntries = this.reclassifyUnknownEntries(entries);
    
    // Extract all sections
    cv.basics = this.extractBasics(reclassifiedEntries);
    cv.work = this.extractWork(reclassifiedEntries);
    cv.education = this.extractEducation(reclassifiedEntries);
    cv.skills = this.extractSkills(reclassifiedEntries);
    cv.projects = this.extractProjects(reclassifiedEntries);
    
    // Update meta
    cv.meta = {
      version: '1.0.0',
      lastModified: new Date().toISOString()
    };
    
    return cv;
  }

  /**
   * Reclassify "unknown" entries based on content analysis
   * Also fix misclassified entries (e.g., education classified as phone)
   */
  private reclassifyUnknownEntries(entries: MasterCVEntry[]): MasterCVEntry[] {
    // First pass: identify section boundaries
    const sectionBoundaries: { index: number; section: string }[] = [];
    
    entries.forEach((entry, index) => {
      const content = entry.content.trim().replace(/\s+/g, ' ').toLowerCase();
      if (content === 'profile summary' || content === 'summary' || content === 'profile') {
        sectionBoundaries.push({ index, section: 'summary' });
      } else if (content === 'education' || content === 'academic background' || content === 'academic qualifications') {
        sectionBoundaries.push({ index, section: 'education' });
      } else if (content === 'work experience' || content === 'professional experience' || content === 'experience' || content === 'professional background') {
        sectionBoundaries.push({ index, section: 'work' });
      } else if (content === 'areas of experience' || content === 'skills' || content === 'technical skills' || content === 'skills & competencies') {
        sectionBoundaries.push({ index, section: 'skills' });
      } else if (content === 'final year projects:' || content === 'projects' || content === 'key projects') {
        sectionBoundaries.push({ index, section: 'projects' });
      } else if (content === 'training' || content === 'certifications' || content === 'courses') {
        sectionBoundaries.push({ index, section: 'training' });
      } else if (content === 'soft skills:') {
        sectionBoundaries.push({ index, section: 'soft_skills' });
      } else if (content === 'technical skills:') {
        sectionBoundaries.push({ index, section: 'technical_skills' });
      } else if (content === 'references') {
        sectionBoundaries.push({ index, section: 'references' });
      } else if (content === 'personal details' || content === 'personal profile') {
        sectionBoundaries.push({ index, section: 'personal_details' });
      }
    });

    // Second pass: reclassify entries based on context
    return entries.map((entry, index) => {
      const content = entry.content.trim().replace(/\s+/g, ' ');
      const lower = content.toLowerCase();
      
      // If the current entry itself is a boundary header, immediately classify it as a section header
      const isHeader = sectionBoundaries.some(boundary => boundary.index === index);
      if (isHeader || this.isSectionHeaderContent(lower)) {
        return { ...entry, section_type: 'section_header' };
      }

      // Find current section based on boundaries
      let currentSection = 'header'; // Default for entries before first section
      for (const boundary of sectionBoundaries) {
        if (index >= boundary.index) {
          currentSection = boundary.section;
        }
      }

      // Reclassify mismatched types based on section context
      if (currentSection === 'work' && (entry.section_type === 'education' || entry.section_type === 'name')) {
        if (lower.includes('university') || lower.includes('school') || lower.includes('college') || lower.includes('hyperiondev')) {
          return { ...entry, section_type: 'work_company' };
        }
        return { ...entry, section_type: 'work_position' };
      }

      if (currentSection === 'education' && (entry.section_type === 'experience' || entry.section_type === 'name')) {
        return { ...entry, section_type: 'education' };
      }

      // Fix misclassified entries first
      if (entry.section_type === 'phone') {
        // Check if this is actually education
        if (this.looksLikeEducation(content)) {
          return { ...entry, section_type: 'education' };
        }
        // Check if this contains an email
        if (this.isEmail(content)) {
          return { ...entry, section_type: 'email' };
        }
        // Check if it's actually a phone number
        if (!this.isPhone(content)) {
          // Reclassify based on content
          if (lower.includes('duration') || (currentSection === 'work' && /\d{4}/.test(content))) {
            return { ...entry, section_type: 'work_duration' };
          }
        }
      }

      // Handle unknown entries
      if (entry.section_type.toLowerCase() === 'unknown') {
        // Name detection - check if it looks like a name and is in the header section (before first section header)
        if (currentSection === 'header' && this.looksLikeName(content)) {
          return { ...entry, section_type: 'name' };
        }
        
        // Email detection
        if (this.isEmail(content) || lower.includes('email address:')) {
          return { ...entry, section_type: 'email' };
        }

        // Context-based classification
        if (currentSection === 'summary') {
          return { ...entry, section_type: 'summary' };
        }
        
        if (currentSection === 'work') {
          // Check for structured work fields
          if (lower.startsWith('company :') || lower.startsWith('company:')) {
            return { ...entry, section_type: 'work_company' };
          }
          if (lower.startsWith('designation :') || lower.startsWith('designation:')) {
            return { ...entry, section_type: 'work_position' };
          }
          if (lower.startsWith('duration :') || lower.startsWith('duration:')) {
            return { ...entry, section_type: 'work_duration' };
          }
          if (lower.startsWith('location :') || lower.startsWith('location:')) {
            return { ...entry, section_type: 'work_location' };
          }
          return { ...entry, section_type: 'work_highlight' };
        }
        
        if (currentSection === 'skills' || currentSection === 'soft_skills' || currentSection === 'technical_skills') {
          return { ...entry, section_type: 'skill' };
        }
        
        if (currentSection === 'projects') {
          return { ...entry, section_type: 'project' };
        }
        
        if (currentSection === 'education') {
          return { ...entry, section_type: 'education' };
        }
        
        if (currentSection === 'training') {
          return { ...entry, section_type: 'training' };
        }
        
        if (currentSection === 'personal_details') {
          if (lower.includes('address') || lower.includes('johannesburg') || lower.includes('south africa')) {
            return { ...entry, section_type: 'location' };
          }
          return { ...entry, section_type: 'personal' };
        }
        
        // Fallback content-based detection
        if (this.looksLikeEducation(content)) {
          return { ...entry, section_type: 'education' };
        }
        if (this.looksLikeSkill(content)) {
          return { ...entry, section_type: 'skill' };
        }
      }

      return entry;
    });
  }

  private looksLikeName(text: string): boolean {
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();
    
    // Exclude obvious non-names
    if (lower.includes('gender') || lower.includes('male') || lower.includes('female') ||
        lower.includes('marital') || lower.includes('single') || lower.includes('married') ||
        lower.includes('address') || lower.includes('email') || lower.includes('phone') ||
        lower.includes('university') || lower.includes('company') || lower.includes('experience') ||
        lower.includes('education') || lower.includes('skills') || lower.includes('summary') ||
        lower.includes('profile') || lower.includes('references') || lower.includes('training') ||
        lower.includes('languages:') || lower.includes('date of birth') || lower.includes('identity')) {
      return false;
    }
    
    // Name: 2-4 words, no special chars except spaces, no numbers, not too long
    const words = trimmed.split(/\s+/);
    return words.length >= 2 && 
           words.length <= 5 && 
           trimmed.length < 50 &&
           trimmed.length > 5 &&
           !/[@\d•\-:]/.test(trimmed) &&
           /^[A-Za-z\s.]+$/.test(trimmed);
  }

  private isSectionHeaderContent(lowerText: string): boolean {
    const headers = [
      'education', 'academic background', 'academic qualifications',
      'work experience', 'professional experience', 'experience', 'professional background',
      'skills', 'technical skills', 'skills & competencies', 'areas of experience',
      'projects', 'final year projects:', 'key projects',
      'training', 'certifications', 'courses',
      'soft skills:', 'technical skills:',
      'references',
      'personal details', 'personal profile', 'summary', 'profile summary', 'profile', 'key duties'
    ];
    return headers.includes(lowerText.trim());
  }

  private isValidInstitution(name: string): boolean {
    const lower = name.toLowerCase().trim();
    const schoolKeywords = ['university', 'college', 'school', 'academy', 'institute', 'hyperiondev', 'high', 'campus'];
    if (schoolKeywords.some(kw => lower.includes(kw))) {
      return true;
    }
    // Match standalone "dev" but not inside "development" or "developer"
    return /\bdev\b/i.test(lower);
  }

  private looksLikeEducation(text: string): boolean {
    const lower = text.toLowerCase();
    if (this.isSectionHeaderContent(lower)) return false;
    
    return lower.includes('university') ||
           lower.includes('college') ||
           lower.includes('school') ||
           lower.includes('degree') ||
           lower.includes('bachelor') ||
           /\bmaster\b/i.test(text) ||
           lower.includes('diploma') ||
           lower.includes('certificate') ||
           lower.includes('paralegal') ||
           (lower.includes('january') && lower.includes('present')) ||
           /\(\w+\s+\d{4}\s*-/.test(text);
  }

  private looksLikeWorkExperience(text: string): boolean {
    const lower = text.toLowerCase();
    if (this.isSectionHeaderContent(lower)) return false;
    
    return lower.includes('company :') ||
           lower.includes('designation :') ||
           lower.includes('duration :') ||
           lower.includes('location :') ||
           lower.includes('key duties') ||
           (lower.includes('managing') && lower.includes(':')) ||
           (lower.includes('handling') && lower.includes(':')) ||
           (lower.includes('project management') && lower.includes(':')) ||
           lower.includes('responsible for') ||
           lower.includes('collaborated with') ||
           lower.includes('coordinating');
  }

  private looksLikeSkill(text: string): boolean {
    const lower = text.toLowerCase();
    if (this.isSectionHeaderContent(lower)) return false;
    
    return lower.includes('html') ||
           lower.includes('css') ||
           lower.includes('javascript') ||
           lower.includes('jquery') ||
           lower.includes('api') ||
           lower.includes('web development') ||
           lower.includes('programming') ||
           lower.includes('strong background') ||
           lower.includes('expertise in') ||
           lower.includes('proficiency') ||
           lower.includes('technical skills:') ||
           lower.includes('soft skills:');
  }

  private looksLikeSummary(text: string): boolean {
    const lower = text.toLowerCase();
    return (lower.includes('eager to') && lower.includes('learn')) ||
           lower.includes('passionate about') ||
           lower.includes('i am') ||
           lower.includes('my excellent') ||
           lower.includes('asset to any team') ||
           lower.includes('enhance the company') ||
           lower.includes('embrace challenges');
  }

  private looksLikeProject(text: string): boolean {
    const lower = text.toLowerCase();
    return lower.includes('mock website') ||
           lower.includes('web app') ||
           lower.includes('webstore') ||
           lower.includes('front end of') ||
           lower.startsWith('- ');
  }

  private looksLikeLocation(text: string): boolean {
    const lower = text.toLowerCase();
    return lower.includes('current address') ||
           lower.includes('johannesburg') ||
           lower.includes('south africa') ||
           (lower.includes('road') && lower.includes(','));
  }

  /**
   * Extract basics (personal info) from entries
   */
  extractBasics(entries: MasterCVEntry[]): JSONResumeBasics {
    const basics: JSONResumeBasics = {
      name: '',
      email: ''
    };

    // Collect summary parts
    const summaryParts: string[] = [];
    const emails: string[] = [];

    for (const entry of entries) {
      const type = entry.section_type.toLowerCase();
      const content = entry.content.trim().replace(/\s+/g, ' ');

      // Name detection
      if (type === 'name' || type.includes('name') || type === 'personal') {
        if (!content.includes('@') && !/\d{3}/.test(content) && !basics.name) {
          basics.name = content;
        }
      }

      // Email detection - collect all emails
      if (type === 'email' || type.includes('email') || this.isEmail(content)) {
        const email = this.extractEmail(content);
        if (email) {
          emails.push(email);
        }
      }

      // Phone detection
      if (type === 'phone' || type.includes('phone') || type.includes('tel')) {
        const phone = this.extractPhone(content);
        if (phone && !basics.phone && phone.length >= 10) {
          basics.phone = phone;
        }
      }

      // Location detection
      if (type === 'location' || type.includes('location') || type.includes('address') || type.includes('city')) {
        basics.location = basics.location || {};
        if (content.toLowerCase().includes('johannesburg')) {
          basics.location.city = 'Johannesburg';
          basics.location.region = 'Gauteng';
          basics.location.countryCode = 'ZA';
        } else {
          basics.location.city = content;
        }
      }

      // LinkedIn detection
      if (type.includes('linkedin') || content.toLowerCase().includes('linkedin.com')) {
        basics.profiles = basics.profiles || [];
        const linkedInUrl = this.extractUrl(content);
        if (linkedInUrl) {
          basics.profiles.push({
            network: 'LinkedIn',
            url: linkedInUrl
          });
        }
      }

      // Website/Portfolio detection
      if (type.includes('website') || type.includes('portfolio') || type.includes('url')) {
        const url = this.extractUrl(content);
        if (url && !url.includes('linkedin')) {
          basics.url = url;
        }
      }

      // Summary detection - collect all summary parts
      if (type === 'summary' || type.includes('summary') || type.includes('objective') || type.includes('profile')) {
        if (content.length > 20 && !content.toLowerCase().includes('profile summary')) {
          summaryParts.push(this.cleanBulletPoint(content));
        }
      }
    }

    // Choose the best email (prefer personal email domains over institutional)
    if (emails.length > 0) {
      const personalEmail = emails.find(e => 
        e.includes('gmail') || e.includes('yahoo') || e.includes('hotmail') || e.includes('outlook')
      );
      basics.email = personalEmail || emails[0];
    }

    // Combine summary parts
    if (summaryParts.length > 0) {
      basics.summary = summaryParts.join(' ').replace(/\s+/g, ' ').trim();
    }

    // Try to extract name from entries if not found
    if (!basics.name) {
      // Look for entries that look like a name - check all entries, not just first few
      for (const entry of entries) {
        const content = entry.content.trim().replace(/\s+/g, ' ');
        if (this.looksLikeName(content)) {
          basics.name = content;
          break;
        }
      }
    }

    return basics;
  }

  /**
   * Extract work experience from entries
   */
  extractWork(entries: MasterCVEntry[]): JSONResumeWork[] {
    const workEntries: JSONResumeWork[] = [];
    
    // Get all work-related entries
    const workRelated = entries.filter(e => {
      const type = e.section_type.toLowerCase();
      return type === 'work' ||
             type === 'work_company' ||
             type === 'work_position' ||
             type === 'work_duration' ||
             type === 'work_location' ||
             type === 'work_highlight' ||
             type.includes('experience') || 
             type.includes('job') ||
             type.includes('employment');
    });

    // Parse structured work entries
    let currentJob: Partial<JSONResumeWork> | null = null;
    
    for (const entry of workRelated) {
      const content = entry.content.trim().replace(/\s+/g, ' ');
      const type = entry.section_type.toLowerCase();
      const lower = content.toLowerCase();

      // Skip section headers or invalid values
      if (this.isSectionHeaderContent(lower)) {
        continue;
      }
      
      // Handle structured fields
      if (type === 'work_company' || lower.startsWith('company :') || lower.startsWith('company:')) {
        const companyName = content.replace(/company\s*:\s*/i, '').trim();
        if (currentJob && currentJob.name === 'Company') {
          currentJob.name = companyName;
        } else {
          // Save previous job if exists
          if (currentJob && (currentJob.name || currentJob.position)) {
            workEntries.push(this.finalizeJob(currentJob));
          }
          currentJob = {
            name: companyName,
            position: '',
            startDate: 'Unknown',
            highlights: []
          };
        }
      }
      else if (type === 'work_position' || lower.startsWith('designation :') || lower.startsWith('designation:')) {
        const positionName = content.replace(/designation\s*:\s*/i, '').trim();
        if (currentJob) {
          currentJob.position = positionName;
        } else {
          currentJob = {
            name: 'Company',
            position: positionName,
            startDate: 'Unknown',
            highlights: []
          };
        }
      }
      else if (type === 'work_duration' || lower.startsWith('duration :') || lower.startsWith('duration:')) {
        if (currentJob) {
          const dateStr = content.replace(/duration\s*:\s*/i, '').trim();
          currentJob.startDate = this.extractDate(dateStr, 'start') || 'Unknown';
          currentJob.endDate = this.extractDate(dateStr, 'end');
        }
      }
      else if (type === 'work_location') {
        // Skip location for now
      }
      else if (type === 'work_highlight' || type === 'work') {
        // This is a bullet point/highlight
        if (currentJob && content.length > 10) {
          currentJob.highlights = currentJob.highlights || [];
          // Clean and add the highlight
          const cleaned = this.cleanBulletPoint(content);
          if (cleaned.length > 10 && !cleaned.toLowerCase().includes('key duties')) {
            currentJob.highlights.push(cleaned);
          }
        }
      }
      else if (this.looksLikeJobHeader(content)) {
        // Save previous job if exists
        if (currentJob && (currentJob.name || currentJob.position)) {
          workEntries.push(this.finalizeJob(currentJob));
        }
        currentJob = this.parseJobHeader(content);
      }
    }

    // Don't forget the last job
    if (currentJob && (currentJob.name || currentJob.position)) {
      workEntries.push(this.finalizeJob(currentJob));
    }

    // Deduplicate jobs by matching company name & position, and merging highlights
    const uniqueJobs: JSONResumeWork[] = [];
    for (const job of workEntries) {
      const companyClean = job.name.toLowerCase().trim();
      const positionClean = job.position.toLowerCase().trim();

      const existing = uniqueJobs.find(j => 
        j.name.toLowerCase().trim() === companyClean && 
        j.position.toLowerCase().trim() === positionClean
      );

      if (existing) {
        if (job.highlights && job.highlights.length > 0) {
          existing.highlights = Array.from(new Set([...(existing.highlights || []), ...job.highlights]));
        }
      } else {
        uniqueJobs.push(job);
      }
    }

    return uniqueJobs;
  }

  private finalizeJob(job: Partial<JSONResumeWork>): JSONResumeWork {
    return {
      name: job.name || 'Company',
      position: job.position || 'Position',
      startDate: job.startDate || 'Unknown',
      endDate: job.endDate,
      highlights: job.highlights || []
    };
  }

  /**
   * Extract education from entries
   */
  extractEducation(entries: MasterCVEntry[]): JSONResumeEducation[] {
    const educationEntries: JSONResumeEducation[] = [];
    const eduRelated = entries.filter(e => {
      const type = e.section_type.toLowerCase();
      return type === 'education' ||
             type.includes('education') || 
             type.includes('degree') || 
             type.includes('university') ||
             type.includes('school') ||
             type.includes('college') ||
             type.includes('certification');
    });

    for (const entry of eduRelated) {
      const content = entry.content.trim().replace(/\s+/g, ' ');
      const lower = content.toLowerCase();
      
      // Skip section headers and non-education content
      if (this.isSectionHeaderContent(lower) || 
          lower.includes('have experience') || 
          lower.includes('currently studying') || 
          lower.includes('faculty officer')) {
        continue;
      }

      // Skip misclassified work properties
      if (lower.startsWith('company :') || lower.startsWith('company:') || 
          lower.startsWith('designation :') || lower.startsWith('designation:') ||
          lower.startsWith('duration :') || lower.startsWith('duration:')) {
        continue;
      }
      
      if (content.length > 5) {
        // Parse education entry - format: "• Degree, Institution, Location. (Date Range)"
        const edu: JSONResumeEducation = {
          institution: '',
          area: '',
          studyType: '',
          startDate: '',
          endDate: ''
        };
        
        let studyTypeSet = false;
        
        // Extract institution
        if (lower.includes('greenside high school')) {
          edu.institution = 'Greenside High School';
          edu.studyType = 'High School';
          edu.area = 'General Education';
          studyTypeSet = true;
        } else if (lower.includes('university of johannesburg')) {
          edu.institution = 'University of Johannesburg';
          if (lower.includes('paralegal')) {
            edu.studyType = '';
            edu.area = 'Paralegal Studies';
            studyTypeSet = true;
          }
        } else if (lower.includes('hyperiondev')) {
          edu.institution = 'HyperionDev';
          edu.studyType = 'Certificate';
          edu.area = 'Full Stack Web Development';
          studyTypeSet = true;
        } else {
          edu.institution = this.extractInstitution(content);
        }
        
        // Skip if institution parsed matches section headers or invalid values
        const instLower = edu.institution.toLowerCase().trim();
        if (this.isSectionHeaderContent(instLower) || instLower === 'professional experience' || instLower === 'skills' || instLower.length <= 3 || !this.isValidInstitution(edu.institution)) {
          continue;
        }

        // Extract degree type if not already set
        if (!studyTypeSet && !edu.studyType) {
          edu.studyType = this.extractDegreeType(content) || 'Degree';
        }
        
        // Extract area if not already set
        if (!edu.area) {
          edu.area = this.extractDegreeArea(content) || '';
        }
        
        // Extract dates
        edu.startDate = this.extractDate(content, 'start') || '';
        edu.endDate = this.extractDate(content, 'end') || '';
        
        // Only add if we have meaningful data
        if (edu.institution && edu.institution.length > 3 && this.isValidInstitution(edu.institution)) {
          // Check for duplicates (substring / superstring matching to catch "High School" vs "Greenside High School")
          const existingIndex = educationEntries.findIndex(e => 
            e.institution.toLowerCase().includes(edu.institution.toLowerCase()) ||
            edu.institution.toLowerCase().includes(e.institution.toLowerCase())
          );
          
          if (existingIndex >= 0) {
            const existing = educationEntries[existingIndex];
            // Merge details: keep the longer institution name, and fill in missing fields
            if (edu.institution.length > existing.institution.length) {
              existing.institution = edu.institution;
            }
            if (edu.area && edu.area.length > (existing.area || '').length) {
              existing.area = edu.area;
            }
            if (edu.studyType && edu.studyType.length > (existing.studyType || '').length && edu.studyType !== 'Degree') {
              existing.studyType = edu.studyType;
            }
            if (edu.startDate && !existing.startDate) {
              existing.startDate = edu.startDate;
            }
            if (edu.endDate && !existing.endDate) {
              existing.endDate = edu.endDate;
            }
          } else {
            educationEntries.push(edu);
          }
        }
      }
    }

    return educationEntries;
  }

  /**
   * Extract skills from entries
   */
  extractSkills(entries: MasterCVEntry[]): JSONResumeSkill[] {
    const skillEntries: JSONResumeSkill[] = [];
    const skillRelated = entries.filter(e => {
      const type = e.section_type.toLowerCase();
      return type === 'skill' ||
             type.includes('skill') || 
             type.includes('competenc') ||
             type.includes('technolog') ||
             type.includes('tool') ||
             type.includes('language');
    });

    // Categorize skills
    const categories: Record<string, string[]> = {
      'Technical Skills': [],
      'Programming Languages': [],
      'Tools & Frameworks': [],
      'Soft Skills': [],
      'Languages': []
    };

    const techKeywords = ['python', 'java', 'javascript', 'typescript', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'git', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'html', 'css', 'jquery', 'api', 'web development'];
    const langKeywords = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'arabic', 'portuguese', 'italian', 'korean', 'hindi', 'isizulu', 'afrikaans'];
    const toolKeywords = ['excel', 'powerpoint', 'word', 'jira', 'slack', 'figma', 'photoshop', 'illustrator', 'sketch', 'notion', 'trello'];
    const softSkillKeywords = ['communication', 'team player', 'leadership', 'problem solving', 'presentation', 'work under pressure', 'adapt'];

    for (const entry of skillRelated) {
      const content = entry.content.trim().replace(/\s+/g, ' ');
      const lower = content.toLowerCase();

      // Skip section headers
      if (lower === 'technical skills:' || lower === 'soft skills:' || lower === 'skills') {
        continue;
      }

      // Determine category
      if (langKeywords.some(k => lower.includes(k))) {
        categories['Languages'].push(this.cleanBulletPoint(content));
      } else if (softSkillKeywords.some(k => lower.includes(k))) {
        categories['Soft Skills'].push(this.cleanBulletPoint(content));
      } else if (techKeywords.some(k => lower.includes(k))) {
        categories['Technical Skills'].push(this.cleanBulletPoint(content));
      } else if (toolKeywords.some(k => lower.includes(k))) {
        categories['Tools & Frameworks'].push(this.cleanBulletPoint(content));
      } else if (content.length > 10) {
        categories['Technical Skills'].push(this.cleanBulletPoint(content));
      }
    }

    // Convert to JSON Resume format
    for (const [category, skills] of Object.entries(categories)) {
      if (skills.length > 0) {
        skillEntries.push({
          name: category,
          keywords: [...new Set(skills)] // Remove duplicates
        });
      }
    }

    return skillEntries;
  }

  /**
   * Extract projects from entries
   */
  extractProjects(entries: MasterCVEntry[]): JSONResumeProject[] {
    const projectEntries: JSONResumeProject[] = [];
    const projectRelated = entries.filter(e => {
      const type = e.section_type.toLowerCase();
      return type === 'project' || type.includes('project');
    });

    for (const entry of projectRelated) {
      const content = entry.content.trim().replace(/\s+/g, ' ');
      
      // Skip section headers
      if (content.toLowerCase() === 'final year projects:' || content.toLowerCase() === 'projects') {
        continue;
      }
      
      if (content.length > 10) {
        // Clean up the content
        const cleaned = this.cleanBulletPoint(content);
        const parts = cleaned.split(/[-–:]/).map(p => p.trim()).filter(p => p.length > 0);
        
        projectEntries.push({
          name: parts[0] || cleaned,
          description: parts.length > 1 ? parts.slice(1).join(' - ') : cleaned,
          keywords: this.extractTechnologies(content)
        });
      }
    }

    return projectEntries;
  }

  /**
   * Calculate career years from work history
   */
  calculateCareerYears(work: JSONResumeWork[] | undefined): number {
    if (!work || work.length === 0) return 0;

    let totalMonths = 0;
    const now = new Date();

    for (const job of work) {
      const startDate = this.parseDate(job.startDate);
      const endDate = job.endDate ? this.parseDate(job.endDate) : now;

      if (startDate && endDate) {
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                      (endDate.getMonth() - startDate.getMonth());
        totalMonths += Math.max(0, months);
      }
    }

    return Math.round(totalMonths / 12);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private isEmail(text: string): boolean {
    return /\S+@\S+\.\S+/.test(text);
  }

  private extractEmail(text: string): string | null {
    const match = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    return match ? match[0] : null;
  }

  private isPhone(text: string): boolean {
    return /[\d\s\-\(\)]{10,}/.test(text);
  }

  private extractPhone(text: string): string | null {
    const match = text.match(/[\d\s\-\(\)\.]{10,}/);
    return match ? match[0].trim() : null;
  }

  private extractUrl(text: string): string | null {
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
  }

  private looksLikeJobHeader(text: string): boolean {
    return /\d{4}/.test(text) || 
           text.toLowerCase().includes('present') ||
           text.includes(' - ') ||
           text.includes(' at ') ||
           text.includes(' | ');
  }

  private parseJobHeader(text: string): Partial<JSONResumeWork> {
    const job: Partial<JSONResumeWork> = {
      highlights: []
    };

    // Try to extract company and position
    const parts = text.split(/\s+at\s+|\s*[-–|]\s*/i);
    
    if (parts.length >= 2) {
      job.position = parts[0].trim();
      job.name = parts[1].trim();
    } else {
      job.position = parts[0].trim();
      job.name = 'Company';
    }

    // Extract dates
    job.startDate = this.extractDate(text, 'start') || 'Unknown';
    job.endDate = this.extractDate(text, 'end');

    return job;
  }

  private extractDate(text: string, type: 'start' | 'end'): string | undefined {
    // Match patterns like "Jan 2020", "2020", "January 2020", "2020-01"
    const datePattern = /(\w+\s+\d{4}|\d{4}(-\d{2})?)/g;
    const matches = text.match(datePattern) || [];
    
    if (text.toLowerCase().includes('present') && type === 'end') {
      return 'Present';
    }
    
    if (type === 'start') {
      return matches[0];
    } else {
      return matches[1] || (text.toLowerCase().includes('present') ? 'Present' : undefined);
    }
  }

  private parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr || dateStr.toLowerCase() === 'present') {
      return dateStr?.toLowerCase() === 'present' ? new Date() : null;
    }

    // Try parsing various formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try "Month Year" format
    const monthYearMatch = dateStr.match(/(\w+)\s+(\d{4})/);
    if (monthYearMatch) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIndex = monthNames.findIndex(m => monthYearMatch[1].toLowerCase().startsWith(m));
      if (monthIndex >= 0) {
        return new Date(parseInt(monthYearMatch[2]), monthIndex, 1);
      }
    }

    // Try just year
    const yearMatch = dateStr.match(/\d{4}/);
    if (yearMatch) {
      return new Date(parseInt(yearMatch[0]), 0, 1);
    }

    return null;
  }

  private cleanBulletPoint(text: string): string {
    // Remove leading bullets, dashes, numbers
    return text.replace(/^[\s\-•*\d.]+/, '').trim();
  }

  private extractInstitution(text: string): string {
    const uniKeywords = ['university', 'college', 'institute', 'school', 'academy'];
    const lower = text.toLowerCase();
    
    for (const keyword of uniKeywords) {
      if (lower.includes(keyword)) {
        const idx = lower.indexOf(keyword);
        const start = Math.max(0, text.lastIndexOf(',', idx) + 1);
        const end = text.indexOf(',', idx + keyword.length);
        return text.slice(start, end > 0 ? end : undefined).trim();
      }
    }
    
    return text.split(/[-–,]/)[0]?.trim() || text;
  }

  private extractDegreeType(text: string): string | undefined {
    const degreePatterns: [RegExp, string][] = [
      [/ph\.?d\.?|doctorate/i, 'Ph.D.'],
      [/master['']?s?|m\.?s\.?|m\.?a\.?|mba/i, 'Master'],
      [/bachelor['']?s?|b\.?s\.?|b\.?a\.?/i, 'Bachelor'],
      [/associate['']?s?/i, 'Associate']
    ];

    for (const [pattern, type] of degreePatterns) {
      if (pattern.test(text)) {
        return type;
      }
    }

    return undefined;
  }

  private extractDegreeArea(text: string): string | undefined {
    // Look for "in [field]" or "of [field]"
    const match = text.match(/(?:in|of)\s+([A-Za-z\s]+?)(?:,|\.|$|\d)/i);
    return match ? match[1].trim() : undefined;
  }

  private extractGPA(text: string): string | undefined {
    const gpaMatch = text.match(/gpa[:\s]*(\d+\.?\d*)/i) || text.match(/(\d\.\d+)\s*gpa/i);
    return gpaMatch ? gpaMatch[1] : undefined;
  }

  private extractTechnologies(text: string): string[] {
    const techKeywords = [
      'react', 'node', 'python', 'java', 'javascript', 'typescript',
      'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'redis',
      'vue', 'angular', 'express', 'django', 'flask', 'spring',
      'graphql', 'rest', 'api', 'html', 'css', 'sass'
    ];
    
    const lower = text.toLowerCase();
    return techKeywords.filter(tech => lower.includes(tech));
  }
}

// Export singleton instance
export const masterCVTransformer = new MasterCVTransformerService();
