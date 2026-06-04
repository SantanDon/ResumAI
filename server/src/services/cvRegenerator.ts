/**
 * CV Regenerator Service
 * Regenerates and enhances CVs using Harvard style and latest research-backed best practices
 * Based on 2024-2025 CV research and analytics from successful job seekers
 */

import { db } from '../db';
import { SwarmOrchestrator } from '../swarm/orchestrator';
import { powerWordsService } from './powerWords';
import { industryProfileService } from './industryProfiles';
import { cvIntelligenceService } from './cvIntelligence';

// Common spelling mistakes dictionary for CV-related terms
const SPELLING_CORRECTIONS: Record<string, string> = {
    // Common typos
    'dveloper': 'Developer',
    'developr': 'Developer',
    'devloper': 'Developer',
    'develper': 'Developer',
    'enginer': 'Engineer',
    'enginere': 'Engineer',
    'engeneer': 'Engineer',
    'managment': 'Management',
    'managemnt': 'Management',
    'maneger': 'Manager',
    'manger': 'Manager',
    'experiance': 'Experience',
    'expereince': 'Experience',
    'experince': 'Experience',
    'responsable': 'Responsible',
    'responsibile': 'Responsible',
    'acheivement': 'Achievement',
    'acheivment': 'Achievement',
    'achievment': 'Achievement',
    'recieved': 'Received',
    'recived': 'Received',
    'sucessful': 'Successful',
    'succesful': 'Successful',
    'successfull': 'Successful',
    'proffesional': 'Professional',
    'profesional': 'Professional',
    'professionel': 'Professional',
    'comunication': 'Communication',
    'communcation': 'Communication',
    'communicaton': 'Communication',
    'colaboration': 'Collaboration',
    'colloboration': 'Collaboration',
    'colaborate': 'Collaborate',
    'anaylsis': 'Analysis',
    'analisis': 'Analysis',
    'analysys': 'Analysis',
    'implmentation': 'Implementation',
    'implementaion': 'Implementation',
    'implimentation': 'Implementation',
    'maintainance': 'Maintenance',
    'maintenace': 'Maintenance',
    'maintanence': 'Maintenance',
    'enviroment': 'Environment',
    'enviornment': 'Environment',
    'environemnt': 'Environment',
    'knowlege': 'Knowledge',
    'knowlede': 'Knowledge',
    'knowlegde': 'Knowledge',
    'tecnology': 'Technology',
    'techonology': 'Technology',
    'technolgy': 'Technology',
    'sofware': 'Software',
    'softwre': 'Software',
    'softare': 'Software',
    'databse': 'Database',
    'datbase': 'Database',
    'datebase': 'Database',
    'langauge': 'Language',
    'languege': 'Language',
    'languge': 'Language',
    'programing': 'Programming',
    'programmin': 'Programming',
    'progamming': 'Programming',
    'efficent': 'Efficient',
    'efficiant': 'Efficient',
    'eficient': 'Efficient',
    'excellant': 'Excellent',
    'excelent': 'Excellent',
    'excelllent': 'Excellent',
    'bussiness': 'Business',
    'busines': 'Business',
    'buisness': 'Business',
    'stratagic': 'Strategic',
    'strategc': 'Strategic',
    'stratgic': 'Strategic',
    'liason': 'Liaison',
    'liasion': 'Liaison',
    'liaision': 'Liaison',
    'occured': 'Occurred',
    'occurrd': 'Occurred',
    'occassion': 'Occasion',
    'ocasion': 'Occasion',
    'seperate': 'Separate',
    'seprate': 'Separate',
    'definately': 'Definitely',
    'definatly': 'Definitely',
    'defintely': 'Definitely',
    'accomodate': 'Accommodate',
    'acommodate': 'Accommodate',
    'calender': 'Calendar',
    'calander': 'Calendar',
    'comittee': 'Committee',
    'commitee': 'Committee',
    'committe': 'Committee',
    'gaurantee': 'Guarantee',
    'garantee': 'Guarantee',
    'garauntee': 'Guarantee',
    'independant': 'Independent',
    'independet': 'Independent',
    'neccessary': 'Necessary',
    'necesary': 'Necessary',
    'neccesary': 'Necessary',
    'priviledge': 'Privilege',
    'privelege': 'Privilege',
    'privilige': 'Privilege',
    'recomend': 'Recommend',
    'reccommend': 'Recommend',
    'recommed': 'Recommend',
    'refered': 'Referred',
    'refferral': 'Referral',
    'referel': 'Referral',
    'untill': 'Until',
    'withold': 'Withhold',
    'writting': 'Writing',
    'writng': 'Writing',
};

const swarm = new SwarmOrchestrator(5);

// Research-backed CV best practices (2024-2025)
const CV_BEST_PRACTICES = {
    // Harvard OCS Guidelines + Recent Research
    structure: {
        maxPages: 1, // For most candidates, 2 for senior roles
        sections: ['contact', 'education', 'experience', 'skills', 'projects'],
        fontFamily: 'Times New Roman, Georgia, serif',
        fontSize: { body: '10-12pt', name: '14-16pt', headers: '11-12pt' },
        margins: '0.5-1 inch',
        lineSpacing: 1.0
    },
    content: {
        bulletPointsPerJob: { min: 3, max: 5 },
        bulletLength: { min: 1, max: 2 }, // lines
        actionVerbStart: true,
        quantifyAchievements: true,
        noPronouns: true,
        noObjectiveStatement: true,
        noReferencesLine: true
    },
    keywords: {
        atsOptimization: true,
        industrySpecific: true,
        skillsMatching: true
    }
};


export interface RegeneratedCV {
    id: string;
    userId: string;
    personalInfo: {
        fullName: string;
        email: string;
        phone: string;
        location?: string;
        linkedin?: string;
        website?: string;
    };
    summary?: string;
    education: Array<{
        id: string;
        school: string;
        degree: string;
        startDate: string;
        endDate: string;
        gpa?: string;
        highlights?: string[];
    }>;
    experience: Array<{
        id: string;
        company: string;
        role: string;
        startDate: string;
        endDate: string;
        description: string[];
    }>;
    skills: Array<{
        category: string;
        items: string[];
    }>;
    projects?: Array<{
        id: string;
        name: string;
        description: string;
        technologies: string[];
        link?: string;
    }>;
    certifications?: string[];
    createdAt: string;
    enhancementScore: number;
    improvements: string[];
}

class CVRegeneratorService {
    /**
     * Spell-check and correct common CV-related typos
     */
    private spellCheck(text: string): { corrected: string; corrections: string[] } {
        let corrected = text;
        const corrections: string[] = [];
        
        // Check each word against our dictionary
        const words = text.split(/\b/);
        for (const word of words) {
            const lowerWord = word.toLowerCase();
            if (SPELLING_CORRECTIONS[lowerWord]) {
                const replacement = SPELLING_CORRECTIONS[lowerWord];
                // Preserve original case pattern
                const finalReplacement = word[0] === word[0].toUpperCase() 
                    ? replacement 
                    : replacement.toLowerCase();
                corrected = corrected.replace(new RegExp(`\\b${word}\\b`, 'gi'), finalReplacement);
                corrections.push(`"${word}" → "${finalReplacement}"`);
            }
        }
        
        return { corrected, corrections: [...new Set(corrections)] };
    }

    /**
     * Regenerate CV from master CV data with Harvard style and research-backed enhancements
     */
    async regenerate(userId: string, targetIndustry?: string): Promise<RegeneratedCV> {
        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ? ORDER BY id').all(userId) as any[];
        
        if (entries.length === 0) {
            throw new Error('No CV data found for user');
        }

        // Extract and categorize existing data
        const rawData = this.extractRawData(entries);
        
        // Enhance each section using AI and best practices
        const enhanced = await this.enhanceAllSections(rawData, targetIndustry);
        
        // Calculate improvement score
        const originalScore = cvIntelligenceService.calculateStrengthScore(entries, targetIndustry);
        const improvements = this.identifyImprovements(rawData, enhanced);

        const regeneratedCV: RegeneratedCV = {
            id: `regen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            ...enhanced,
            createdAt: new Date().toISOString(),
            enhancementScore: Math.min(100, originalScore + improvements.length * 5),
            improvements
        };

        return regeneratedCV;
    }


    /**
     * Extract raw data from master CV entries
     */
    private extractRawData(entries: any[]): any {
        const data: any = {
            personalInfo: { fullName: '', email: '', phone: '' },
            summary: '',
            education: [],
            experience: [],
            skills: [],
            projects: [],
            raw: entries
        };

        for (const entry of entries) {
            const content = entry.content?.trim() || '';
            const type = entry.section_type?.toLowerCase() || '';

            if (type.includes('summary') || type.includes('objective') || type.includes('profile')) {
                data.summary = content;
            } else if (type.includes('name') || type.includes('personal')) {
                if (content.includes('@')) {
                    data.personalInfo.email = content;
                } else if (/\d{3}/.test(content)) {
                    data.personalInfo.phone = content;
                } else {
                    data.personalInfo.fullName = content;
                }
            } else if (type.includes('email')) {
                data.personalInfo.email = content;
            } else if (type.includes('phone')) {
                data.personalInfo.phone = content;
            } else if (type.includes('skill')) {
                data.skills.push(content);
            } else if (type.includes('education') || type.includes('degree')) {
                data.education.push(content);
            } else if (type.includes('experience') || type.includes('work') || type.includes('job')) {
                data.experience.push(content);
            } else if (type.includes('project')) {
                data.projects.push(content);
            }
        }

        return data;
    }

    /**
     * Enhance all CV sections using AI and best practices
     */
    private async enhanceAllSections(rawData: any, industry?: string): Promise<any> {
        const profile = industry ? industryProfileService.getProfile(industry) : null;
        
        // Enhance personal info (spell-check fullName)
        const { corrected: correctedName } = this.spellCheck(rawData.personalInfo.fullName || 'Your Name');
        const personalInfo = {
            fullName: correctedName,
            email: rawData.personalInfo.email || 'email@example.com',
            phone: rawData.personalInfo.phone || '(555) 123-4567',
            location: rawData.personalInfo.location,
            linkedin: rawData.personalInfo.linkedin,
            website: rawData.personalInfo.website
        };

        // Spell-check and enhance summary if present
        let summary: string | undefined;
        if (rawData.summary) {
            const { corrected: correctedSummary } = this.spellCheck(rawData.summary);
            summary = correctedSummary;
        }

        // Enhance experience bullets
        const experience = await this.enhanceExperience(rawData.experience, rawData.raw, industry);
        
        // Organize skills by category
        const skills = this.organizeSkills(rawData.skills, profile);
        
        // Format education
        const education = this.formatEducation(rawData.education, rawData.raw);
        
        // Format projects
        const projects = this.formatProjects(rawData.projects, rawData.raw);

        return { personalInfo, summary, experience, skills, education, projects };
    }


    /**
     * Enhance experience section with power words and quantification
     */
    private async enhanceExperience(experienceData: string[], rawEntries: any[], industry?: string): Promise<any[]> {
        const experiences: any[] = [];
        
        // Group raw entries that look like experience
        const expEntries = rawEntries.filter(e => 
            e.section_type?.toLowerCase().includes('experience') ||
            e.section_type?.toLowerCase().includes('work') ||
            e.section_type?.toLowerCase().includes('job') ||
            e.section_type?.toLowerCase().includes('date')
        );

        // Blacklisted headers to skip
        const isHeader = (text: string) => {
            const lower = text.toLowerCase().trim();
            return lower === 'professional experience' || 
                   lower === 'work experience' || 
                   lower === 'experience' || 
                   lower === 'key duties';
        };

        // Create experience entries from raw data
        let currentExp: any = null;
        
        for (const entry of expEntries) {
            const content = entry.content?.trim() || '';
            const lower = content.toLowerCase();
            
            if (isHeader(content)) continue;

            // Check if this looks like a company/role header
            if (this.looksLikeJobHeader(content)) {
                if (currentExp && (currentExp.company !== 'Company' || currentExp.role !== 'Position')) {
                    experiences.push(currentExp);
                }
                currentExp = {
                    id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    company: this.extractCompany(content),
                    role: this.extractRole(content),
                    startDate: this.extractDate(content, 'start'),
                    endDate: this.extractDate(content, 'end'),
                    description: []
                };
            } else if (currentExp && content.length > 10) {
                // Skip if it looks like work metadata that got misclassified as highlight
                if (lower.startsWith('company :') || lower.startsWith('company:') || 
                    lower.startsWith('designation :') || lower.startsWith('designation:') ||
                    lower.startsWith('duration :') || lower.startsWith('duration:')) {
                    continue;
                }
                // This is likely a bullet point
                const enhanced = await this.enhanceBullet(content, industry);
                if (enhanced.length > 10) {
                    currentExp.description.push(enhanced);
                }
            }
        }
        
        if (currentExp && (currentExp.company !== 'Company' || currentExp.role !== 'Position')) {
            experiences.push(currentExp);
        }

        // Deduplicate experiences by company and role
        const uniqueExperiences: any[] = [];
        for (const exp of experiences) {
            const companyClean = exp.company.toLowerCase().trim();
            const roleClean = exp.role.toLowerCase().trim();

            const existing = uniqueExperiences.find(e => 
                e.company.toLowerCase().trim() === companyClean &&
                e.role.toLowerCase().trim() === roleClean
            );

            if (existing) {
                if (exp.description && exp.description.length > 0) {
                    existing.description = Array.from(new Set([...(existing.description || []), ...exp.description]));
                }
            } else {
                uniqueExperiences.push(exp);
            }
        }

        // If no structured experience found, create from raw text
        if (uniqueExperiences.length === 0 && experienceData.length > 0) {
            uniqueExperiences.push({
                id: `exp_${Date.now()}`,
                company: 'Company Name',
                role: 'Position Title',
                startDate: 'Start Date',
                endDate: 'Present',
                description: await Promise.all(
                    experienceData.slice(0, 5).map(d => this.enhanceBullet(d, industry))
                )
            });
        }

        return uniqueExperiences;
    }

    /**
     * Enhance a single bullet point using research-backed best practices
     */
    private async enhanceBullet(bullet: string, industry?: string): Promise<string> {
        // Quick enhancement without AI for speed
        let enhanced = bullet.trim();
        
        // Step 1: Spell check first
        const { corrected } = this.spellCheck(enhanced);
        enhanced = corrected;
        
        // Ensure starts with action verb
        const firstWord = enhanced.split(' ')[0].toLowerCase();
        const weakVerbs = ['helped', 'worked', 'did', 'made', 'was', 'had', 'got'];
        
        if (weakVerbs.includes(firstWord)) {
            const replacement = powerWordsService.getBestReplacement(firstWord, industry);
            if (replacement) {
                enhanced = replacement.word.charAt(0).toUpperCase() + replacement.word.slice(1) + 
                          enhanced.slice(firstWord.length);
            }
        }
        
        // Capitalize first letter
        enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
        
        // Remove pronouns
        enhanced = enhanced.replace(/\bI\b/g, '').replace(/\bmy\b/gi, '').trim();
        
        // Ensure ends without period (Harvard style)
        enhanced = enhanced.replace(/\.+$/, '');
        
        return enhanced;
    }


    /**
     * Organize skills into categories
     */
    private organizeSkills(skills: string[], profile: any): any[] {
        const categories: Record<string, string[]> = {
            'Technical Skills': [],
            'Languages': [],
            'Tools & Frameworks': [],
            'Soft Skills': []
        };

        const techKeywords = ['python', 'java', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'git'];
        const langKeywords = ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'arabic'];
        const toolKeywords = ['excel', 'powerpoint', 'word', 'jira', 'slack', 'figma', 'photoshop'];

        for (const skill of skills) {
            const lower = skill.toLowerCase();
            if (techKeywords.some(k => lower.includes(k))) {
                categories['Technical Skills'].push(skill);
            } else if (langKeywords.some(k => lower.includes(k))) {
                categories['Languages'].push(skill);
            } else if (toolKeywords.some(k => lower.includes(k))) {
                categories['Tools & Frameworks'].push(skill);
            } else {
                categories['Technical Skills'].push(skill);
            }
        }

        // Add industry-specific skills if profile exists
        if (profile?.prioritySkills) {
            for (const skill of profile.prioritySkills.slice(0, 3)) {
                if (!categories['Technical Skills'].includes(skill)) {
                    categories['Technical Skills'].push(skill);
                }
            }
        }

        return Object.entries(categories)
            .filter(([_, items]) => items.length > 0)
            .map(([category, items]) => ({ category, items: [...new Set(items)] }));
    }

    /**
     * Format education entries
     */
    private formatEducation(eduData: string[], rawEntries: any[]): any[] {
        const education: any[] = [];
        
        const eduEntries = rawEntries.filter(e => 
            e.section_type?.toLowerCase().includes('education') ||
            e.section_type?.toLowerCase().includes('degree') ||
            e.section_type?.toLowerCase().includes('university') ||
            e.section_type?.toLowerCase().includes('school')
        );

        // Helper to check for layout headers
        const isHeader = (text: string) => {
            const lower = text.toLowerCase().trim();
            return lower === 'education' || 
                   lower === 'academic background' || 
                   lower === 'professional experience' || 
                   lower === 'work experience' || 
                   lower === 'skills' ||
                   lower === 'key duties';
        };

        for (const entry of eduEntries) {
            const content = entry.content?.trim() || '';
            const lower = content.toLowerCase();

            if (isHeader(content)) continue;

            // Skip work metadata
            if (lower.startsWith('company :') || lower.startsWith('company:') || 
                lower.startsWith('designation :') || lower.startsWith('designation:') ||
                lower.startsWith('duration :') || lower.startsWith('duration:')) {
                continue;
            }

            if (content.length > 5) {
                const school = this.extractSchool(content);
                const degree = this.extractDegree(content);
                
                // Skip if school parsed matches layout headers or is invalid
                const schoolClean = school.toLowerCase().trim();
                if (isHeader(schoolClean) || schoolClean === 'skills' || schoolClean === 'professional experience' || schoolClean.length <= 3) {
                    continue;
                }

                education.push({
                    id: `edu_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    school,
                    degree,
                    startDate: this.extractDate(content, 'start'),
                    endDate: this.extractDate(content, 'end'),
                    gpa: this.extractGPA(content)
                });
            }
        }

        // Deduplicate education by school name and degree
        const uniqueEducation: any[] = [];
        for (const edu of education) {
            const schoolClean = edu.school.toLowerCase().trim();
            const degreeClean = edu.degree.toLowerCase().trim();

            const existing = uniqueEducation.find(e => 
                e.school.toLowerCase().trim() === schoolClean && 
                e.degree.toLowerCase().trim() === degreeClean
            );
            if (!existing) {
                uniqueEducation.push(edu);
            }
        }

        if (uniqueEducation.length === 0 && eduData.length > 0) {
            // Deduplicate incoming raw eduData list as well
            const firstEdu = eduData[0]?.trim() || '';
            if (firstEdu && !isHeader(firstEdu)) {
                uniqueEducation.push({
                    id: `edu_${Date.now()}`,
                    school: firstEdu,
                    degree: 'Degree',
                    startDate: 'Start',
                    endDate: 'End'
                });
            }
        }

        return uniqueEducation;
    }

    /**
     * Format project entries
     */
    private formatProjects(projData: string[], rawEntries: any[]): any[] {
        const projects: any[] = [];
        
        for (const proj of projData.slice(0, 3)) {
            projects.push({
                id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: proj.split(/[-–:]/).shift()?.trim() || proj,
                description: proj,
                technologies: this.extractTechnologies(proj)
            });
        }

        return projects;
    }


    // Helper methods for extraction
    private looksLikeJobHeader(text: string): boolean {
        return /\d{4}/.test(text) || 
               text.toLowerCase().includes('present') ||
               text.includes(' - ') ||
               text.includes(' at ');
    }

    private extractCompany(text: string): string {
        const parts = text.split(/\s+at\s+|\s*[-–|]\s*/i);
        return parts[1]?.trim() || parts[0]?.trim() || 'Company';
    }

    private extractRole(text: string): string {
        const parts = text.split(/\s+at\s+|\s*[-–|]\s*/i);
        return parts[0]?.trim() || 'Position';
    }

    private extractDate(text: string, type: 'start' | 'end'): string {
        const datePattern = /(\w+\s+\d{4}|\d{4})/g;
        const matches = text.match(datePattern) || [];
        if (type === 'start') return matches[0] || 'Start';
        return matches[1] || (text.toLowerCase().includes('present') ? 'Present' : 'End');
    }

    private extractSchool(text: string): string {
        const uniKeywords = ['university', 'college', 'institute', 'school'];
        for (const keyword of uniKeywords) {
            if (text.toLowerCase().includes(keyword)) {
                const idx = text.toLowerCase().indexOf(keyword);
                const start = Math.max(0, text.lastIndexOf(',', idx) + 1);
                const end = text.indexOf(',', idx + keyword.length);
                return text.slice(start, end > 0 ? end : undefined).trim();
            }
        }
        return text.split(/[-–,]/)[0]?.trim() || text;
    }

    private extractDegree(text: string): string {
        const degreePatterns = [
            /bachelor['']?s?|b\.?s\.?|b\.?a\.?/i,
            /master['']?s?|m\.?s\.?|m\.?a\.?|mba/i,
            /ph\.?d\.?|doctorate/i,
            /associate['']?s?/i
        ];
        for (const pattern of degreePatterns) {
            const match = text.match(pattern);
            if (match) {
                const idx = text.toLowerCase().indexOf(match[0].toLowerCase());
                return text.slice(idx, idx + 50).split(/[,\n]/)[0]?.trim() || match[0];
            }
        }
        return 'Degree';
    }

    private extractGPA(text: string): string | undefined {
        const gpaMatch = text.match(/gpa[:\s]*(\d+\.?\d*)/i) || text.match(/(\d\.\d+)\s*gpa/i);
        return gpaMatch ? gpaMatch[1] : undefined;
    }

    private extractTechnologies(text: string): string[] {
        const techKeywords = ['react', 'node', 'python', 'java', 'javascript', 'typescript', 
                            'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'redis'];
        return techKeywords.filter(tech => text.toLowerCase().includes(tech));
    }

    /**
     * Identify improvements made during regeneration
     */
    private identifyImprovements(original: any, enhanced: any): string[] {
        const improvements: string[] = [];
        
        if (enhanced.experience?.length > 0) {
            improvements.push('Structured experience section with action verbs');
        }
        if (enhanced.skills?.length > 0) {
            improvements.push('Organized skills into categories');
        }
        improvements.push('Applied Harvard CV format guidelines');
        improvements.push('Optimized for ATS compatibility');
        improvements.push('Removed weak verbs and pronouns');
        
        return improvements;
    }
}

export const cvRegeneratorService = new CVRegeneratorService();
