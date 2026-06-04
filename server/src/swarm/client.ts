/**
 * Swarm Client - LLM Abstraction
 * Uses LLMFactory to automatically select best available backend
 * Supports: HuggingFace Inference, Ollama (local), or Fallback
 */

import { LLMFactory } from '../llm/LLMFactory';
import { LLMBackend } from '../llm/LLMBackend';

export class SwarmClient {
    private backend: LLMBackend | null = null;

    async initialize(): Promise<void> {
        this.backend = await LLMFactory.getInstance();
        console.log(`[SwarmClient] Initialized with ${this.backend.getName()}`);
    }

    async generate(prompt: string): Promise<string> {
        // Lazy initialization
        if (!this.backend) {
            await this.initialize();
        }

        try {
            const response = await this.backend!.generate(prompt);
            return response.trim();
        } catch (error: any) {
            console.error("[SwarmClient] Generation error:", error.message);
            
            // Try fallback if it's a backend source error
            if (this.backend) {
                // Fallback logic disabled for now
                console.warn("[SwarmClient] Backend error, skipping fallback");
            }
            
            throw error;
        }
    }

    /**
     * Get current backend info (for debugging)
     */
    async getBackendInfo(): Promise<string> {
        if (!this.backend) {
            await this.initialize();
        }
        return this.backend!.getName();
    }
}
