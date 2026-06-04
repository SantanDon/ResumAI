/**
 * Master/Mini CV Generator Service
 * Generates tailored Master CV, Mini CV, and Cover Letter from job descriptions
 */

import { db } from '../db';
import { LLMFactory } from '../llm/LLMFactory';
import { 
    MASTER_CV_PROMPT, 
    MINI_CV_PROMPT, 
    JOB_ANALYSIS_PROMPT 
} from '../prompts/cvGeneration';
import { COVER_LETTER_SYSTEM_PROMPT, COVER_LETTER_TONES } from '../prompts/coverLetter';

// ============================================
// TYPES
// ============================================

export interface JobDescription {
    jobTitle: string;
    company: string;
    description: string;
}

export interface CVGenerationResult {
    masterCV: ParsedCV;
    miniCV: ParsedCV;
    coverLetter: string;
    analysis: JobAnalysis;
    matchScore: number;
    generationId: string;
}

export interface ParsedCV {
    summary: string;
    skills: string[] | SkillCategories;
    experience: ExperienceEntry[];
    education: EducationEntry[];
    certifications?: string[];
}

export interface SkillCategories {
    technical: string[];
    tools: string[];
    soft: string[];
}

export interface ExperienceEntry {
    title: string;
    company: string;
    location?: string;
    period: string;
    bullets: string[];
}

export interface EducationEntry {
    degree: string;
    institution: string;
    year: string;
    details?: string;
}

export interface JobAnalysis {
    keyResponsibilities: string[];
    requiredSkills: string[];
    preferredSkills: string[];
    industryKeywords: string[];
    cultureSignals?: string[];
    matchedSkills: string[];
    gapSkills: string[];
}

export interface UserCVData {
    name: string;
    email: string;
    phone: string;
    summary: string;
    skills: string[];
    experience: string[];
    education: string[];
}

// ============================================
// SERVICE
// ============================================

class MasterMiniCVGeneratorService {
    
    /**
     * Main generation function - creates Master CV, Mini CV, and Cover Letter
     */
    async generateTailoredCVs(
        userId: string, 
        job: JobDescription
    ): Promise<CVGenerationResult> {
        console.log(`[CVGenerator] Starting generation for ${userId} - ${job.jobTitle} at ${job.company}`);
        
        // 1. Get user's current CV data from database
        const currentCV = this.getUserCVData(userId);
        
        if (!currentCV.skills.length && !currentCV.experience.length) {
            throw new Error('No CV data found. Please upload your CV first.');
        }
        
        // 2. Analyze the job description
        console.log('[CVGenerator] Analyzing job description...');
        const analysis = await this.analyzeJobDescription(job, currentCV);
        
        // 3. Generate Master CV (comprehensive)
        console.log('[CVGenerator] Generating Master CV...');
        const masterCV = await this.generateCV(currentCV, job, analysis, 'master');
        
        // 4. Generate Mini CV (concise)
        console.log('[CVGenerator] Generating Mini CV...');
        const miniCV = await this.generateCV(currentCV, job, analysis, 'mini');
        
        // 5. Generate Cover Letter
        console.log('[CVGenerator] Generating Cover Letter...');
        const coverLetter = await this.generateCoverLetter(currentCV, job, analysis);
        
        // 6. Calculate match score
        const matchScore = this.calculateMatchScore(analysis);
        
        // 7. Save to database
        const generationId = await this.saveGeneratedCVs(
            userId, job, masterCV, miniCV, coverLetter, matchScore, analysis
        );
        
        console.log(`[CVGenerator] Complete! Match score: ${matchScore}%, ID: ${generationId}`);
        
        return {
            masterCV,
            miniCV,
            coverLetter,
            analysis,
            matchScore,
            generationId
        };
    }

    /**
     * Get user's CV data from master_cv table
     */
    getUserCVData(userId: string): UserCVData {
        const entries = db.prepare(
            'SELECT * FROM master_cv WHERE user_id = ? ORDER BY section_type'
        ).all(userId) as any[];
        
        const data: UserCVData = {
            name: '',
            email: '',
            phone: '',
            summary: '',
            skills: [],
            experience: [],
            education: []
        };

        for (const entry of entries) {
            const content = entry.content?.trim() || '';
            const type = (entry.section_type || '').toLowerCase();

            if (type.includes('name')) {
                data.name = content;
            } else if (type.includes('email')) {
                data.email = content;
            } else if (type.includes('phone')) {
                data.phone = content;
            } else if (type.includes('summary') || type.includes('objective')) {
                data.summary = content;
            } else if (type.includes('skill')) {
                data.skills.push(content);
            } else if (type.includes('experience') || type.includes('work') || type.includes('job')) {
                data.experience.push(content);
            } else if (type.includes('education') || type.includes('degree')) {
                data.education.push(content);
            }
        }

        return data;
    }

    /**
     * Analyze job description and extract requirements
     */
    private async analyzeJobDescription(
        job: JobDescription, 
        currentCV: UserCVData
    ): Promise<JobAnalysis> {
        const llm = await LLMFactory.getInstance();
        
        const prompt = `Analyze this job description and compare with candidate's skills.

JOB TITLE: ${job.jobTitle}
COMPANY: ${job.company}
DESCRIPTION:
${job.description.slice(0, 3000)}

CANDIDATE'S CURRENT SKILLS:
${currentCV.skills.slice(0, 20).join(', ')}

CANDIDATE'S EXPERIENCE SUMMARY:
${currentCV.experience.slice(0, 3).join('\n').slice(0, 500)}

Return a JSON object with these exact keys:
{
  "keyResponsibilities": ["top 5-7 job responsibilities"],
  "requiredSkills": ["must-have skills from JD"],
  "preferredSkills": ["nice-to-have skills"],
  "industryKeywords": ["important ATS keywords"],
  "matchedSkills": ["skills candidate already has"],
  "gapSkills": ["important skills candidate is missing"]
}`;

        const response = await llm.generate(prompt + '\n\n' + JOB_ANALYSIS_PROMPT);
        
        try {
            const parsed = JSON.parse(this.extractJSON(response));
            return {
                keyResponsibilities: parsed.keyResponsibilities || [],
                requiredSkills: parsed.requiredSkills || [],
                preferredSkills: parsed.preferredSkills || [],
                industryKeywords: parsed.industryKeywords || [],
                matchedSkills: parsed.matchedSkills || currentCV.skills.slice(0, 5),
                gapSkills: parsed.gapSkills || []
            };
        } catch (error) {
            console.warn('[CVGenerator] Failed to parse job analysis, using fallback');
            return this.fallbackAnalysis(job, currentCV);
        }
    }

    /**
     * Fallback job analysis when AI parsing fails
     */
    private fallbackAnalysis(job: JobDescription, currentCV: UserCVData): JobAnalysis {
        const descLower = job.description.toLowerCase();
        const commonSkills = [
            'javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker',
            'communication', 'leadership', 'problem-solving', 'teamwork'
        ];
        
        const foundSkills = commonSkills.filter(s => descLower.includes(s));
        const matchedSkills = currentCV.skills.filter(s => 
            descLower.includes(s.toLowerCase())
        );
        
        return {
            keyResponsibilities: [],
            requiredSkills: foundSkills,
            preferredSkills: [],
            industryKeywords: foundSkills,
            matchedSkills: matchedSkills.slice(0, 5),
            gapSkills: foundSkills.filter(s => !matchedSkills.includes(s))
        };
    }

    /**
     * Generate CV (master or mini version)
     */
    private async generateCV(
        currentCV: UserCVData,
        job: JobDescription,
        analysis: JobAnalysis,
        type: 'master' | 'mini'
    ): Promise<ParsedCV> {
        const llm = await LLMFactory.getInstance();
        const systemPrompt = type === 'master' ? MASTER_CV_PROMPT : MINI_CV_PROMPT;
        
        const experienceLimit = type === 'master' ? 5 : 2;
        const skillsLimit = type === 'master' ? 15 : 7;
        
        const prompt = `Generate a ${type.toUpperCase()} CV tailored for this job.

CANDIDATE INFO:
Name: ${currentCV.name || 'Professional'}
Current Summary: ${currentCV.summary || 'Experienced professional'}
Skills: ${currentCV.skills.slice(0, skillsLimit).join(', ')}
Experience: 
${currentCV.experience.slice(0, experienceLimit).join('\n\n')}
Education: ${currentCV.education.slice(0, 2).join(', ')}

TARGET JOB:
Title: ${job.jobTitle}
Company: ${job.company}
Key Requirements: ${analysis.requiredSkills.slice(0, 8).join(', ')}
Keywords to Include: ${analysis.industryKeywords.slice(0, 10).join(', ')}

INSTRUCTIONS:
- Create a ${type === 'master' ? 'comprehensive 2-page' : 'concise 1-page'} CV
- Use exact keywords from the job description
- Quantify achievements where possible
- Prioritize relevant experience

Return ONLY valid JSON:
{
  "summary": "professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company",
      "period": "2020-2023",
      "bullets": ["achievement with metrics"]
    }
  ],
  "education": [
    {
      "degree": "Degree",
      "institution": "School",
      "year": "2020"
    }
  ]
}`;

        const response = await llm.generate(prompt + '\n\n' + systemPrompt);
        
        try {
            const parsed = JSON.parse(this.extractJSON(response));
            return this.validateParsedCV(parsed, currentCV);
        } catch (error) {
            console.warn(`[CVGenerator] Failed to parse ${type} CV, using enhanced original`);
            return this.createFallbackCV(currentCV, analysis, type);
        }
    }

    /**
     * Validate and clean parsed CV data
     */
    private validateParsedCV(parsed: any, fallback: UserCVData): ParsedCV {
        return {
            summary: parsed.summary || fallback.summary || 'Experienced professional seeking new opportunities.',
            skills: Array.isArray(parsed.skills) ? parsed.skills : fallback.skills,
            experience: Array.isArray(parsed.experience) ? parsed.experience.map((exp: any) => ({
                title: exp.title || 'Position',
                company: exp.company || 'Company',
                location: exp.location || '',
                period: exp.period || '',
                bullets: Array.isArray(exp.bullets) ? exp.bullets : []
            })) : [],
            education: Array.isArray(parsed.education) ? parsed.education.map((edu: any) => ({
                degree: edu.degree || 'Degree',
                institution: edu.institution || 'Institution',
                year: edu.year || '',
                details: edu.details || ''
            })) : [],
            certifications: parsed.certifications || []
        };
    }

    /**
     * Create fallback CV when AI generation fails
     */
    private createFallbackCV(
        currentCV: UserCVData, 
        analysis: JobAnalysis,
        type: 'master' | 'mini'
    ): ParsedCV {
        const skillLimit = type === 'master' ? 15 : 7;
        
        return {
            summary: currentCV.summary || `Experienced professional with expertise in ${currentCV.skills.slice(0, 3).join(', ')}.`,
            skills: [...analysis.matchedSkills, ...currentCV.skills].slice(0, skillLimit),
            experience: currentCV.experience.slice(0, type === 'master' ? 5 : 2).map((exp, i) => ({
                title: 'Position',
                company: 'Company',
                period: '',
                bullets: [exp.slice(0, 200)]
            })),
            education: currentCV.education.slice(0, 2).map(edu => ({
                degree: edu,
                institution: '',
                year: ''
            }))
        };
    }

    /**
     * Generate tailored cover letter
     */
    private async generateCoverLetter(
        currentCV: UserCVData,
        job: JobDescription,
        analysis: JobAnalysis
    ): Promise<string> {
        const llm = await LLMFactory.getInstance();
        
        const prompt = `Write a professional cover letter for this application.

CANDIDATE:
Name: ${currentCV.name || 'Candidate'}
Top Matched Skills: ${analysis.matchedSkills.slice(0, 5).join(', ')}
Key Experience: ${currentCV.experience.slice(0, 2).join('; ').slice(0, 400)}

JOB:
Position: ${job.jobTitle}
Company: ${job.company}
Key Requirements: ${analysis.requiredSkills.slice(0, 5).join(', ')}
Keywords to Use: ${analysis.industryKeywords.slice(0, 5).join(', ')}

STRUCTURE REQUIREMENTS:
1. Opening: State position, source, genuine excitement with company-specific reason
2. Body: 1-2 key experiences with METRICS, use JD keywords, don't repeat resume
3. Closing: Reaffirm interest, thank, clear call to action

Keep under 400 words. Be professional, authentic, and error-free.
Return ONLY the cover letter text.`;

        try {
            const coverLetter = await llm.generate(prompt + '\n\n' + COVER_LETTER_SYSTEM_PROMPT);
            return this.cleanCoverLetter(coverLetter);
        } catch (error) {
            console.warn('[CVGenerator] Cover letter generation failed, using template');
            return this.fallbackCoverLetter(currentCV, job, analysis);
        }
    }

    /**
     * Clean and format cover letter
     */
    private cleanCoverLetter(text: string): string {
        // Remove common AI artifacts
        let cleaned = text
            .replace(/^(Dear Hiring Manager,?\s*)/i, '')
            .replace(/^\[.*?\]\s*/gm, '')
            .replace(/\[Your Name\]/gi, '')
            .replace(/\[.*?\]/g, '')
            .trim();
        
        // Ensure proper paragraph spacing
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        
        return cleaned;
    }

    /**
     * Fallback cover letter template
     */
    private fallbackCoverLetter(
        currentCV: UserCVData,
        job: JobDescription,
        analysis: JobAnalysis
    ): string {
        const name = currentCV.name || 'Candidate';
        const topSkills = analysis.matchedSkills.slice(0, 3).join(', ');
        
        return `I'm excited to apply for the ${job.jobTitle} position at ${job.company}.

With my background in ${topSkills}, I believe I can contribute meaningfully to your team. ${currentCV.experience[0]?.slice(0, 150) || 'My professional experience has prepared me well for this role.'}

I'd welcome the opportunity to discuss how my skills align with your needs. Thank you for considering my application.

Best regards,
${name}`;
    }

    /**
     * Calculate match score based on skill alignment
     */
    private calculateMatchScore(analysis: JobAnalysis): number {
        const totalRequired = analysis.requiredSkills.length + analysis.preferredSkills.length;
        
        if (totalRequired === 0) {
            return 75; // Default score when we can't analyze
        }
        
        const matchedCount = analysis.matchedSkills.length;
        const gapCount = analysis.gapSkills.length;
        
        // Base score from matched skills
        let score = Math.round((matchedCount / Math.max(totalRequired, 1)) * 80);
        
        // Bonus for having more matches than gaps
        if (matchedCount > gapCount) {
            score += 10;
        }
        
        // Ensure score is in reasonable range
        return Math.min(98, Math.max(25, score));
    }

    /**
     * Extract JSON from potentially messy AI response
     */
    private extractJSON(text: string): string {
        // Try to find JSON object
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return jsonMatch[0];
        }
        
        // Try to find JSON array
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            return arrayMatch[0];
        }
        
        return '{}';
    }

    /**
     * Save generated CVs to database
     */
    private async saveGeneratedCVs(
        userId: string,
        job: JobDescription,
        masterCV: ParsedCV,
        miniCV: ParsedCV,
        coverLetter: string,
        matchScore: number,
        analysis: JobAnalysis
    ): Promise<string> {
        const generationId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        
        try {
            // First ensure table exists
            db.exec(`
                CREATE TABLE IF NOT EXISTS generated_cvs (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    job_title TEXT NOT NULL,
                    company TEXT NOT NULL,
                    master_cv TEXT NOT NULL,
                    mini_cv TEXT NOT NULL,
                    cover_letter TEXT NOT NULL,
                    match_score INTEGER DEFAULT 0,
                    analysis TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            const stmt = db.prepare(`
                INSERT INTO generated_cvs 
                (id, user_id, job_title, company, master_cv, mini_cv, cover_letter, match_score, analysis)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run(
                generationId,
                userId,
                job.jobTitle,
                job.company,
                JSON.stringify(masterCV),
                JSON.stringify(miniCV),
                coverLetter,
                matchScore,
                JSON.stringify(analysis)
            );
            
            console.log(`[CVGenerator] Saved generation ${generationId}`);
        } catch (error) {
            console.error('[CVGenerator] Failed to save to database:', error);
        }
        
        return generationId;
    }

    /**
     * Get previous generations for a user
     */
    getGenerationHistory(userId: string, limit: number = 10): any[] {
        try {
            const stmt = db.prepare(`
                SELECT * FROM generated_cvs 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `);
            return stmt.all(userId, limit) as any[];
        } catch {
            return [];
        }
    }

    /**
     * Get a specific generation by ID
     */
    getGeneration(generationId: string): any | null {
        try {
            const stmt = db.prepare('SELECT * FROM generated_cvs WHERE id = ?');
            const result = stmt.get(generationId) as any;
            
            if (result) {
                return {
                    ...result,
                    masterCV: JSON.parse(result.master_cv),
                    miniCV: JSON.parse(result.mini_cv),
                    analysis: JSON.parse(result.analysis || '{}')
                };
            }
            return null;
        } catch {
            return null;
        }
    }
}

export const masterMiniCVGenerator = new MasterMiniCVGeneratorService();
