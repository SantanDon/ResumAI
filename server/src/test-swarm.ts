import dotenv from 'dotenv';
dotenv.config();
import { SwarmOrchestrator } from './swarm/orchestrator';

async function main() {
    const swarm = new SwarmOrchestrator(5); // 5 workers

    console.log("Testing Swarm Consensus...");

    // A simple atomic task: Math or Logic
    const prompt = "What is 2 + 2? Answer with just the number.";

    const result = await swarm.runAtomicTask(prompt);

    console.log("\nFinal Swarm Result:", result);
}

main().catch(console.error);
