import { SwarmOrchestrator } from './orchestrator';

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
        prompt: `${PERSONA}\n\nRewrite this CV bullet point to be more impactful using action verbs and 2025 standards. Keep it concise (1 sentence). Do not add skills or facts that aren't present, but do suggest where metrics could be added.\n\nOriginal: "${bullet}"\n\nImproved version:`,
        validator: (response: string) => response.length > 10 && response.length < 300,
    }),

    scorePersuasiveness: (bullet: string) => ({
        prompt: `${PERSONA}\n\nRate this CV bullet point from 1-5 for persuasiveness and impact. Answer with just the number.\n\nBullet: "${bullet}"\n\nScore (1-5):`,
        validator: (response: string) => ['1', '2', '3', '4', '5'].includes(response.trim()),
    }),

    /**
     * High-Level Analysis Prompts
     */
    generateSummary: (skills: string[], experience: string[]) => ({
        prompt: `${PERSONA}\n\nBased on these skills: ${skills.slice(0, 10).join(', ')} and experience: ${experience.slice(0, 3).join(', ')}, write a powerful "Unique Value Proposition" summary (2-3 sentences). Focus on what value the candidate brings, not just what they've done.`,
        validator: (response: string) => response.length > 50,
    }),

    chatResponse: (context: string, question: string) => ({
        prompt: `${PERSONA}\n\nContext from CV:\n${context}\n\nUser Question: "${question}"\n\nProvide a helpful, strategic response. If the user asks for advice, give specific, actionable steps aligned with 2025 trends.`,
        validator: (response: string) => response.length > 10,
    }),

    enhanceSuggestions: (skills: string[]) => ({
        prompt: `${PERSONA}\n\nAnalyze these skills: ${skills.join(', ')}. Suggest 3 specific ways to modernize this skill set for 2025 (e.g., new tools, certifications, or project types). Format as a numbered list.`,
        validator: (response: string) => response.length > 50,
    }),
    
    tailorCV: (jobDesc: string, currentSkills: string[]) => ({
        prompt: `${PERSONA}\n\nJob Description: "${jobDesc.slice(0, 500)}..."\nCurrent Skills: ${currentSkills.join(', ')}\n\nIdentify the top 3 gaps in the current skills relative to the job description. Be specific.`,
        validator: (response: string) => response.length > 50,
    })
};

/**
 * High-Level CV Analysis Functions
 * These use the Swarm to decompose complex tasks
 */
export class CVAnalyzer {
    private swarm: SwarmOrchestrator;

    constructor(workerCount: number = 5) {
        this.swarm = new SwarmOrchestrator(workerCount);
    }

    async extractEmail(cvText: string): Promise<string | null> {
        // Simple heuristic: find text that looks like email pattern
        const emailPattern = /\S+@\S+\.\S+/g;
        const matches = cvText.match(emailPattern);

        if (!matches) return null;

        // Use swarm to verify which match is the actual email
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
        const { prompt } = AtomicPrompts.improveBulletPoint(originalBullet);
        return await this.swarm.runAtomicTask(prompt);
    }
    
    async generateSummary(skills: string[], experience: string[]): Promise<string> {
        const { prompt } = AtomicPrompts.generateSummary(skills, experience);
        return await this.swarm.runAtomicTask(prompt);
    }

    async chat(context: string, question: string): Promise<string> {
        const { prompt } = AtomicPrompts.chatResponse(context, question);
        return await this.swarm.runAtomicTask(prompt);
    }

    async getEnhancementSuggestions(skills: string[]): Promise<string> {
        const { prompt } = AtomicPrompts.enhanceSuggestions(skills);
        return await this.swarm.runAtomicTask(prompt);
    }

    async tailorAnalysis(jobDesc: string, skills: string[]): Promise<string> {
        const { prompt } = AtomicPrompts.tailorCV(jobDesc, skills);
        return await this.swarm.runAtomicTask(prompt);
    }
}
