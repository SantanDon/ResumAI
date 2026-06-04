/**
 * Ollama LLM Backend (Local)
 * Requires: ollama serve running on localhost:11434
 */

import ollama from 'ollama';
import { LLMBackend } from './LLMBackend';

export class OllamaBackend implements LLMBackend {
    private model: string;
    private host: string;

    constructor(model: string = 'llama3.2:1b', host: string = 'http://localhost:11434') {
        this.model = model;
        this.host = host;
    }

    async generate(prompt: string): Promise<string> {
        try {
            const response = await ollama.generate({
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7, // Slightly creative but stable
                }
            });
            return response.response.trim();
        } catch (error: any) {
            if (error.cause && error.cause.code === 'ECONNREFUSED') {
                throw new Error(`Cannot connect to Ollama at ${this.host}. Is 'ollama serve' running?`);
            }
            throw error;
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Try a simple generate call to check availability
            await this.generate('hi');
            return true;
        } catch {
            return false;
        }
    }

    getName(): string {
        return `Ollama (${this.model})`;
    }
}
