import { SwarmOrchestrator } from './orchestrator';
import { TemplateEngine } from './templateEngine';

const PERSONA = `You are an expert Career Strategist and Resume Consultant in 2025. 
Your goal is to help candidates create modern, high-impact CVs that pass ATS (Applicant Tracking Systems) and impress human recruiters.
Key Principles:
1. Minimalist & Clean: No fluff, no cliches.
2. Quantifiable Achievements: Always ask for metrics (numbers, %, $).
3. Skills-First: Emphasize core competencies.
4. Hyper-Personalization: Tailor content to the specific job.
5. Tone: Professional, encouraging, but critical of generic content.`;

/**
 * Atomic Prompts Library
 * Each prompt should ask for ONE simple decision that a 1B model can answer reliably.
 */

export const AtomicPrompts = {
    /**
     * CV Parsing Prompts
     */
    isDate: (text: string) => ({
        prompt: `Is the following text a date (e.g., "2020-2023", "Jan 2020")? Answer only "yes" or "no".\n\nText: "${text}"`,
        validator: (response: string) => ['yes', 'no'].includes(response.toLowerCase()),
    }),

    isEmail: (text: string) => ({
        prompt: `Is the following text an email address? Answer only "yes" or "no".\n\nText: "${text}"`,
        validator: (response: string) => ['yes', 'no'].includes(response.toLowerCase()),
    }),

    isJobTitle: (text: string) => ({
        prompt: `Is the following text a job title (e.g., "Software Engineer", "Marketing Manager")? Answer only "yes" or "no".\n\nText: "${text}"`,
        validator: (response: string) => ['yes', 'no'].includes(response.toLowerCase()),
    }),

    /**
     * CV Enhancement Prompts
     */
    improveBulletPoint: (bullet: string) => ({
        prompt: `Rewrite this CV bullet point to be more impactful using action verbs and 2025 standards. Keep it concise (1 sentence). Do not add skills or facts that aren't present, but do suggest where metrics could be added.\n\nOriginal: "${bullet}"\n\nImproved version:`,
        validator: (response: string) => response.length > 10 && response.length < 300,
    }),

    scorePersuasiveness: (bullet: string) => ({
        prompt: `Rate this CV bullet point from 1-5 for persuasiveness and impact. Answer with just the number.\n\nBullet: "${bullet}"\n\nScore (1-5):`,
        validator: (response: string) => ['1', '2', '3', '4', '5'].includes(response.trim()),
    }),

    /**
     * High-Level Analysis Prompts
     */
    generateSummary: (skills: string[], experience: string[]) => ({
        prompt: `Based on these skills: ${skills.slice(0, 10).join(', ')} and experience: ${experience.slice(0, 3).join(', ')}, write a powerful "Unique Value Proposition" summary (2-3 sentences). Focus on what value the candidate brings, not just what they've done.`,
        validator: (response: string) => response.length > 50,
    }),

    chatResponse: (context: string, question: string) => ({
        prompt: `Context from CV:\n${context}\n\nUser Question: "${question}"\n\nProvide a helpful, strategic response. If the user asks for advice, give specific, actionable steps aligned with 2025 trends.`,
        validator: (response: string) => response.length > 10,
    }),

    enhanceSuggestions: (skills: string[]) => ({
        prompt: `Analyze these skills: ${skills.join(', ')}. Suggest 3 specific ways to modernize this skill set for 2025 (e.g., new tools, certifications, or project types). Format as a numbered list.`,
        validator: (response: string) => response.length > 50,
    }),
    
    tailorCV: (jobDesc: string, currentSkills: string[]) => ({
        prompt: `Job Description: "${jobDesc.slice(0, 500)}..."\nCurrent Skills: ${currentSkills.join(', ')}\n\nIdentify the top 3 gaps in the current skills relative to the job description. Be specific.`,
        validator: (response: string) => response.length > 50,
    })
};

/**
 * High-Level CV Analysis Functions
 * These use the Swarm to decompose complex tasks
 */
export class CVAnalyzer {
    private swarm: SwarmOrchestrator;
    private templateEngine: TemplateEngine;

    constructor(workerCount: number = 5) {
        this.swarm = new SwarmOrchestrator(workerCount);
        this.templateEngine = new TemplateEngine(workerCount);
    }

    async extractEmail(cvText: string): Promise<string | null> {
        const emailPattern = /\S+@\S+\.\S+/g;
        const matches = cvText.match(emailPattern);

        if (!matches) return null;

        for (const candidate of matches) {
            const { prompt } = AtomicPrompts.isEmail(candidate);
            const result = await this.swarm.runAtomicTask(prompt);
            if (result.toLowerCase() === 'yes') {
                return candidate;
            }
        }

        return null;
    }

    async improveBullet(originalBullet: string): Promise<string> {
        return await this.templateEngine.enhanceBullet(originalBullet);
    }
    
    async generateSummary(skills: string[], experience: string[]): Promise<string> {
        const skillsSnippet = skills.slice(0, 10).join(', ');
        const experienceSnippet = experience.slice(0, 3).join(', ');
        return await this.templateEngine.enhanceSummary(`Skills: ${skillsSnippet}. Experience: ${experienceSnippet}`);
    }

    async chat(context: string, question: string): Promise<string> {
        const { prompt } = AtomicPrompts.chatResponse(context, question);
        const { winner } = await this.swarm.runGuruTask(prompt);
        return winner;
    }

    async getEnhancementSuggestions(skills: string[]): Promise<string> {
        const { prompt } = AtomicPrompts.enhanceSuggestions(skills);
        const { winner } = await this.swarm.runGuruTask(prompt);
        return winner;
    }

    async tailorAnalysis(jobDesc: string, skills: string[]): Promise<string> {
        const { prompt } = AtomicPrompts.tailorCV(jobDesc, skills);
        const { winner } = await this.swarm.runGuruTask(prompt);
        return winner;
    }

    /**
     * Extract professional overview/summary from CV
     */
    async extractOverview(cvText: string): Promise<string> {
        const baseRequest = `Based on the following CV content, write a 2-3 sentence professional summary/overview that captures the candidate's core value proposition:\n\n${cvText.slice(0, 1500)}`;
        return await this.templateEngine.enhanceSummary(baseRequest);
    }

    /**
     * Extract key skills from CV
     */
    async extractSkills(cvText: string): Promise<string[]> {
        const prompt = `Extract the top 10 technical and professional skills from this CV. Return as a comma-separated list.\n\n${cvText.slice(0, 1500)}\n\nTop Skills:`;
        const { winner } = await this.swarm.runGuruTask(prompt);
        return winner.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    /**
     * Extract experience summary from CV
     */
    async extractExperience(cvText: string): Promise<string[]> {
        const prompt = `Extract the main professional experiences (job titles + companies) from this CV. Format as a numbered list with 1-2 sentences per item, highlighting key achievements.\n\n${cvText.slice(0, 2000)}\n\nKey Experiences:`;
        const { winner } = await this.swarm.runGuruTask(prompt);
        return winner.split('\n').filter(line => line.trim().length > 0);
    }

    /**
     * Extract education from CV
     */
    async extractEducation(cvText: string): Promise<string[]> {
        const prompt = `Extract all education entries (degrees, institutions, years) from this CV. Format as a list.\n\n${cvText.slice(0, 1500)}\n\nEducation:`;
        const { winner } = await this.swarm.runGuruTask(prompt);
        return winner.split('\n').filter(line => line.trim().length > 0);
    }
}
