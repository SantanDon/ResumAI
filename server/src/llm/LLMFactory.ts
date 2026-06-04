/**
 * LLM Factory - Multi-Provider Free API Support
 * Supports: Groq, Gemini, HuggingFace Inference
 * 
 * Free tier priorities:
 * 1. Groq - Extremely fast, generous free tier
 * 2. Gemini - Google AI Studio free tier
 * 3. HuggingFace - Serverless Inference API
 */

import { LLMBackend } from './LLMBackend';
import { GroqBackend } from './GroqBackend';
import { GeminiBackend } from './GeminiBackend';
import { HFInferenceBackend } from './HFInferenceBackend';
import { OllamaBackend } from './OllamaBackend';

export class LLMFactory {
    private static instance: LLMBackend | null = null;
    private static initializationPromise: Promise<LLMBackend> | null = null;

    static async getInstance(): Promise<LLMBackend> {
        if (this.instance) {
            return this.instance;
        }

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this.createBackend();
        
        try {
            this.instance = await this.initializationPromise;
            return this.instance;
        } finally {
            this.initializationPromise = null;
        }
    }

    private static async createBackend(): Promise<LLMBackend> {
        const providers: { name: string; factory: () => Promise<LLMBackend> }[] = [];

        // Store API keys in local variables (TypeScript narrowing fix)
        const groqKey = process.env.GROQ_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
        const hfToken = process.env.HF_TOKEN;

        // Check for Groq API key
        if (groqKey) {
            providers.push({
                name: 'Groq',
                factory: async () => {
                    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
                    console.log(`[LLMFactory] Trying Groq with model: ${model}`);
                    const backend = new GroqBackend(groqKey, model);
                    // Test with a simple generation
                    await backend.generate('Hi');
                    return backend;
                }
            });
        }

        // Check for Gemini API key
        if (geminiKey) {
            providers.push({
                name: 'Gemini',
                factory: async () => {
                    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';
                    console.log(`[LLMFactory] Trying Gemini with model: ${model}`);
                    const backend = new GeminiBackend(geminiKey, model);
                    // Test with a simple generation
                    await backend.generate('Hi');
                    return backend;
                }
            });
        }

        // Check for Ollama (local, always available if enabled)
        const ollamaEnabled = process.env.OLLAMA_ENABLED === 'true';
        if (ollamaEnabled) {
            providers.push({
                name: 'Ollama',
                factory: async () => {
                    const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
                    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
                    console.log(`[LLMFactory] Trying Ollama with model: ${model} at ${baseUrl}`);
                    const backend = new OllamaBackend(model, baseUrl);
                    await backend.generate('Hi');
                    return backend;
                }
            });
        }

        // Check for HuggingFace token
        if (hfToken) {
            providers.push({
                name: 'HuggingFace',
                factory: async () => {
                    const model = process.env.HF_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';
                    console.log(`[LLMFactory] Trying HuggingFace with model: ${model}`);
                    const backend = new HFInferenceBackend(hfToken, model);
                    // Test with a simple generation
                    await backend.generate('Hi');
                    return backend;
                }
            });
        }

        if (providers.length === 0) {
            throw new Error(
                'No LLM backend available.\n' +
                'Set at least one of:\n' +
                '  - GROQ_API_KEY (get free key at: https://console.groq.com/)\n' +
                '  - GEMINI_API_KEY (get free key at: https://ai.studio.google.com/app/apikey)\n' +
                '  - HF_TOKEN (get free token at: https://huggingface.co/settings/tokens)\n' +
                '  - OLLAMA_ENABLED=true (with Ollama running at http://localhost:11434)\n'
            );
        }

        // Try each provider in order
        let lastError: Error | null = null;
        
        for (const provider of providers) {
            try {
                console.log(`[LLMFactory] Attempting ${provider.name}...`);
                const backend = await provider.factory();
                console.log(`[LLM] Connected to ${backend.getName()}`);
                return backend;
            } catch (error: any) {
                console.error(`[LLMFactory] ${provider.name} failed:`, error.message);
                lastError = error as Error;
            }
        }

        throw new Error(
            `All LLM providers failed.\n` +
            `Last error: ${lastError?.message}\n\n` +
            `Ensure at least one API key is valid and the service is available.`
        );
    }

    static reset(): void {
        if (this.instance) {
            console.log('[LLM] Resetting backend instance');
        }
        this.instance = null;
        this.initializationPromise = null;
    }

    static async getBackendName(): Promise<string> {
        try {
            const backend = await this.getInstance();
            return backend.getName();
        } catch {
            return 'Not initialized';
        }
    }

    static async isReady(): Promise<boolean> {
        try {
            const backend = await this.getInstance();
            return await backend.isAvailable();
        } catch {
            return false;
        }
    }

    static getRecommendedModels(): Record<string, string> {
        return {
            fast: 'llama-3.3-70b-versatile',      // Groq
            balanced: 'llama-3.1-8b-instant',     // Groq
            quality: 'gemini-2.5-flash-preview-04-17', // Gemini
        };
    }
}
