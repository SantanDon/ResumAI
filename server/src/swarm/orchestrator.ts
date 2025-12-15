import { SwarmClient } from './client';

export class SwarmOrchestrator {
    private client: SwarmClient;
    private workerCount: number;

    constructor(workerCount: number = 5) {
        this.client = new SwarmClient();
        this.workerCount = workerCount;
    }

    /**
     * The "Ideology" Engine:
     * 1. Spawns N workers.
     * 2. Sends the same atomic prompt to all.
     * 3. Aggregates votes.
     */
    async runAtomicTask(prompt: string): Promise<string> {
        console.log(`[Swarm] Dispatching task to ${this.workerCount} workers: "${prompt.slice(0, 50)}..."`);

        const promises = Array.from({ length: this.workerCount }, () => this.client.generate(prompt));
        const results = await Promise.all(promises);

        return this.consensus(results);
    }

    private consensus(results: string[]): string {
        const votes: Record<string, number> = {};

        results.forEach(res => {
            // Normalize simple answers (optional, depends on task)
            const key = res.toLowerCase().trim();
            votes[key] = (votes[key] || 0) + 1;
        });

        // Find winner
        let winner = results[0];
        let maxVotes = 0;

        for (const [key, count] of Object.entries(votes)) {
            if (count > maxVotes) {
                maxVotes = count;
                // Find the original case-preserved string that matches this key
                winner = results.find(r => r.toLowerCase().trim() === key) || key;
            }
        }

        console.log(`[Swarm] Consensus reached with ${maxVotes}/${this.workerCount} votes.`);
        return winner;
    }
}
