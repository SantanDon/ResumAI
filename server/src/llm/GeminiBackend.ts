/**
 * Gemini API Backend
 * Free tier via Google AI Studio
 * 
 * Get free key at: https://aistudio.google.com/app/apikey
 * Free tier: 10 RPM, 250 RPD (Gemini 2.5 Flash)
 */

import { LLMBackend } from './LLMBackend';

export class GeminiBackend implements LLMBackend {
    private apiKey: string;
    private model: string;
    private maxRetries: number = 3;
    private retryDelayMs: number = 1000;
    private maxTokens: number = 2048;
    private temperature: number = 0.7;

    constructor(apiKey?: string, model?: string) {
        this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
        this.model = model || process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';
        
        if (!this.apiKey) {
            throw new Error(
                'GEMINI_API_KEY environment variable required.\n' +
                'Get a free key at: https://aistudio.google.com/app/apikey'
            );
        }
        
        console.log(`[GeminiBackend] Initialized with model: ${this.model}`);
    }

    async generate(prompt: string, systemPrompt?: string): Promise<string> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        
        const contents: any[] = [];
        
        // Add system prompt if provided (Gemini uses a different format)
        if (systemPrompt) {
            contents.push({
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser: ${prompt}` }]
            });
        } else {
            contents.push({
                role: 'user',
                parts: [{ text: prompt }]
            });
        }

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents,
                        generationConfig: {
                            maxOutputTokens: this.maxTokens,
                            temperature: this.temperature
                        }
                    })
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Gemini API error: ${response.status} - ${error}`);
                }

                const data = await response.json();
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                
                if (!content) {
                    throw new Error('Empty response from Gemini');
                }
                
                return content;
            } catch (error: any) {
                console.error(`[GeminiBackend] Attempt ${attempt + 1}/${this.maxRetries} failed:`, error.message);
                
                if (attempt < this.maxRetries - 1) {
                    await this.delay(this.retryDelayMs * (attempt + 1));
                }
                
                if (attempt === this.maxRetries - 1) {
                    throw new Error(`Gemini API failed after ${this.maxRetries} attempts: ${error.message}`);
                }
            }
        }
        
        throw new Error('Unexpected error in Gemini generate');
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Try a simple generation instead of models endpoint
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hi' }] }],
                    generationConfig: { maxOutputTokens: 5 }
                })
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    getName(): string {
        return `Gemini (${this.model})`;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default GeminiBackend;
