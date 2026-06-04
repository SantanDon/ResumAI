import { SwarmOrchestrator } from '../swarm/orchestrator';
import { pdfGeneratorService } from './pdfGenerator';

export interface TailorRequest {
    cvContent: string; // The full text of the CV
    jobDescription: string;
    jobTitle: string;
    company: string;
    originalPdfPath?: string; // Optional path to original PDF
}

export interface TailoredCV {
    content: string; // The tailored text
    summary: string; // The new summary
    skills: string[]; // The prioritized skills
    pdfPath?: string; // Path to generated PDF
}

class CVTailorService {
    private swarm: SwarmOrchestrator;

    constructor() {
        this.swarm = new SwarmOrchestrator(3); // Uses 3 agents for consensus
    }

    /**
     * Tailor a CV for a specific job
     */
    async tailorCV(request: TailorRequest): Promise<TailoredCV> {
        console.log(`[CVTailor] Tailoring CV for ${request.jobTitle} at ${request.company}...`);

        try {
            // Step 1: Extract Keywords (Analyst Agent)
            const keywords = await this.extractKeywords(request.jobDescription);
            
            // Step 2: Rewrite Summary (Writer Agent)
            const newSummary = await this.rewriteSummary(request.cvContent, keywords, request.jobTitle);

            // Step 3: Prioritize Skills (Strategist Agent)
            const newSkills = await this.prioritizeSkills(request.cvContent, keywords);

            // Step 4: Generate tailored PDF
            let pdfPath: string | undefined;
            try {
                pdfPath = await pdfGeneratorService.generateSimpleCVPDF({
                    summary: newSummary,
                    skills: newSkills,
                    experience: [], // Could extract from CV content
                    education: [], // Could extract from CV content
                }, `${request.jobTitle} - ${request.company}`);
            } catch (pdfError) {
                console.warn('[CVTailor] PDF generation failed, continuing without PDF:', pdfError);
                // Continue without PDF - not a critical failure
            }

            return {
                content: request.cvContent,
                summary: newSummary,
                skills: newSkills,
                pdfPath,
            };
        } catch (error) {
            console.error('[CVTailor] Tailoring failed:', error);
            throw error;
        }
    }

    private async extractKeywords(jd: string): Promise<string[]> {
        const prompt = `
        Analyze this Job Description and extract the top 5 most critical technical keywords or skills required.
        Output ONLY the keywords as a comma-separated list.
        
        Job Description:
        ${jd.slice(0, 1000)}
        `;

        try {
            const result = await this.swarm.runAtomicTask(prompt);
            return result.split(',').map(k => k.trim());
        } catch (error) {
            console.error('[CVTailor] Keyword extraction failed:', error);
            return ['Collaborative', 'Problem Solving', 'Communication']; // Fallback
        }
    }

    private async rewriteSummary(cv: string, keywords: string[], jobTitle: string): Promise<string> {
        const prompt = `
        Rewrite the following Professional Summary to target the role of "${jobTitle}".
        Ensure these keywords are naturally integrated: ${keywords.join(', ')}.
        Keep it under 3 sentences. Professional and impactful tone.
        
        Original CV Context:
        ${cv.slice(0, 500)}...
        `;

        return this.swarm.runAtomicTask(prompt);
    }

    private async prioritizeSkills(cv: string, keywords: string[]): Promise<string[]> {
        // In a full implementation, this would reorder the skills list
        return keywords;
    }
}

export const cvTailorService = new CVTailorService();
