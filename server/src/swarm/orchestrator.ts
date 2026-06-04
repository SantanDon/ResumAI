import { SwarmClient } from './client';
import { GURU_PERSONAS, Persona } from './personas';

/**
 * SwarmOrchestrator - Simplified for HuggingFace deployment
 * 
 * Now defaults to single-shot mode (1 worker) to save API calls.
 * The workerCount parameter is kept for backwards compatibility but
 * defaults to 1 for cloud deployment efficiency.
 * 
 * With Mistral-7B on HuggingFace, single calls are reliable enough
 * that consensus is unnecessary overhead.
 */
export class SwarmOrchestrator {
    private client: SwarmClient;
    private workerCount: number;

    constructor(workerCount: number = 1) {
        this.client = new SwarmClient();
        // Default to 1 worker for HuggingFace efficiency
        // Can be overridden via constructor for local Ollama development
        this.workerCount = workerCount;
    }

    /**
     * Enhanced Swarm Task:
     * With single worker (default or remote LLM), just returns the direct LLM response.
     * With multiple workers, uses persona-based consensus.
     */
    async runGuruTask(basePrompt: string, usePersonas: boolean = true): Promise<{ winner: string; feedback: Record<string, string> }> {
        const personas = Object.values(GURU_PERSONAS);
        const feedback: Record<string, string> = {};
        
        // Dynamically scale down workers for remote APIs to avoid rate limits
        const backendName = await this.client.getBackendInfo();
        const actualWorkerCount = (backendName.toLowerCase() === 'ollama') ? this.workerCount : 1;

        // Single-shot mode: just one call, no consensus needed
        if (actualWorkerCount === 1) {
            console.log(`[LLM] Single-shot mode (optimized for remote API: ${backendName})`);
            const persona = personas[0];
            const identityPrompt = usePersonas ? `${persona.prompt}\n\nTask: ${basePrompt}` : basePrompt;
            const result = await this.client.generate(identityPrompt);
            feedback[persona.name] = result;
            return { winner: result, feedback };
        }
        
        // Multi-worker mode (for local Ollama development)
        console.log(`[Swarm] Dispatching task with ${actualWorkerCount} workers`);

        const results = [];
        for (let i = 0; i < actualWorkerCount; i++) {
            const persona = personas[i % personas.length];
            const identityPrompt = usePersonas ? `${persona.prompt}\n\nTask: ${basePrompt}` : basePrompt;
            const result = await this.client.generate(identityPrompt);
            feedback[persona.name] = result;
            results.push({ result, persona });
        }
        return {
            winner: this.weightedConsensus(results),
            feedback
        };
    }

    /**
     * Simple task execution:
     * With single worker (default or remote LLM), just returns the direct LLM response.
     * With multiple workers, uses simple consensus.
     */
    async runAtomicTask(prompt: string): Promise<string> {
        // Dynamically scale down workers for remote APIs to avoid rate limits
        const backendName = await this.client.getBackendInfo();
        const actualWorkerCount = (backendName.toLowerCase() === 'ollama') ? this.workerCount : 1;

        // Single-shot mode: just one call
        if (actualWorkerCount === 1) {
            return await this.client.generate(prompt);
        }
        
        // Multi-worker consensus mode
        const results = [];
        for (let i = 0; i < actualWorkerCount; i++) {
            results.push(await this.client.generate(prompt));
        }
        return this.simpleConsensus(results);
    }

    private weightedConsensus(results: { result: string; persona: Persona }[]): string {
        const votes: Record<string, number> = {};

        results.forEach(({ result, persona }) => {
            const key = result.toLowerCase().trim();
            votes[key] = (votes[key] || 0) + persona.weight;
        });

        let winner = results[0].result;
        let maxWeight = 0;

        for (const [key, weight] of Object.entries(votes)) {
            if (weight > maxWeight) {
                maxWeight = weight;
                winner = results.find(r => r.result.toLowerCase().trim() === key)?.result || key;
            }
        }

        console.log(`[Swarm] Weighted consensus reached with weight ${maxWeight.toFixed(1)}.`);
        return winner;
    }

    private simpleConsensus(results: string[]): string {
        const votes: Record<string, number> = {};
        results.forEach(res => {
            const key = res.toLowerCase().trim();
            votes[key] = (votes[key] || 0) + 1;
        });

        let winner = results[0];
        let maxVotes = 0;
        for (const [key, count] of Object.entries(votes)) {
            if (count > maxVotes) {
                maxVotes = count;
                winner = results.find(r => r.toLowerCase().trim() === key) || key;
            }
        }
        return winner;
    }
}
