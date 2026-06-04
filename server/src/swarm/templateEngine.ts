import { SwarmOrchestrator } from './orchestrator';

export class TemplateEngine {
    private swarm: SwarmOrchestrator;
    
    // The "Zachary Nelson" Style Guide Constants
    private readonly STYLE_GUIDE = `
ZACHARY NELSON STYLE GUIDE:
1. ACHIEVEMENT-FIRST TONE: Replace passive duties with active, measurable achievements.
   - WRONG: "Responsible for managing the team."
   - RIGHT: "Orchestrated a cross-functional team of 10 to deliver X project 2 weeks ahead of schedule, increasing efficiency by 15%."
2. HIGH-IMPACT DICTION: Use strong action verbs like: Spearheaded, Optimized, Orchestrated, Tailored, Analyzed, Executed.
3. MINIMALIST STRUCTURE: Single-column, clear headers, high "scannability".
4. QUANTIFIABLE METRICS: Every bullet point should ideally have a number (%, $, time).
    `;

    constructor(workerCount: number = 5) {
        this.swarm = new SwarmOrchestrator(workerCount);
    }

    /**
     * Enhances a single bullet point using the Zachary Nelson "Gold Standard".
     */
    async enhanceBullet(original: string): Promise<string> {
        const prompt = `
${this.STYLE_GUIDE}

Translate the following CV bullet point into the Zachary Nelson style. 
Focus on impact and strong verbs. If no metrics are provided, add a [METRIC] placeholder where they should go.

Original: "${original}"
Zachary Style:`;

        const { winner } = await this.swarm.runGuruTask(prompt);
        return winner;
    }

    /**
     * Tailors a summary section.
     */
    async enhanceSummary(summary: string): Promise<string> {
        const prompt = `
${this.STYLE_GUIDE}

Rewrite the following professional summary to be more punchy and "achievement-first". 
Limit to 2-3 high-impact sentences. Avoid cliches like "passionate" or "hard-working".

Original Summary: "${summary}"
Enhanced summary:`;

        const { winner } = await this.swarm.runGuruTask(prompt);
        return winner;
    }

    /**
     * Identifies the best 3 achievements from a list of tasks.
     */
    async prioritizeAchievements(tasks: string[]): Promise<string[]> {
        const prompt = `
${this.STYLE_GUIDE}

From the following list of tasks/experiences, identify and rewrite the TOP 3 most impressive milestones that would wow a hiring manager. 
Format as a bulleted list.

Tasks:
${tasks.map(t => `- ${t}`).join('\n')}

Top 3 Achievement-First Milestones:`;

        const { winner } = await this.swarm.runGuruTask(prompt);
        return winner.split('\n').filter(s => s.trim().startsWith('-') || s.trim().match(/^\d\./)).map(s => s.replace(/^-|\d\./, '').trim());
    }
}
