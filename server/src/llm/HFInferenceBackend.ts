/**
 * Hugging Face Inference API Backend
 * Production-ready single model implementation
 * 
 * IMPORTANT: Uses router.huggingface.co (not api-inference.huggingface.co)
 * 
 * Recommended models:
 * - microsoft/Phi-3-mini-4k-instruct (fast, good quality)
 * - meta-llama/Meta-Llama-3-8B-Instruct (higher quality, requires Pro)
 * - HuggingFaceH4/zephyr-7b-beta (good for instructions)
 * - facebook/bart-large-mnli (classification)
 */

import { LLMBackend } from './LLMBackend';
import { HfInference } from '@huggingface/inference';

export class HFInferenceBackend implements LLMBackend {
    private client: HfInference;
    private model: string;
    private maxRetries: number = 3;
    private retryDelayMs: number = 1000;
    private maxTokens: number = 1024;
    private temperature: number = 0.7;

    constructor(apiToken: string, model?: string) {
        if (!apiToken || apiToken === 'your_huggingface_token_here') {
            throw new Error(
                'Valid HuggingFace API token required. ' +
                'Get a free token at https://huggingface.co/settings/tokens'
            );
        }
        
        this.client = new HfInference(apiToken, {
            endpointUrl: 'https://router.huggingface.co'
        });
        this.model = model || process.env.HF_MODEL || 'HuggingFaceH4/zephyr-7b-beta';
        
        console.log(`[HFInference] Initialized with model: ${this.model}`);
    }

    /**
     * Generate text with optional system prompt
     */
    async generate(prompt: string, systemPrompt?: string): Promise<string> {
        const messages: Array<{ role: string; content: string }> = [];
        
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const result = await this.client.chatCompletion({
                    model: this.model,
                    messages,
                    max_tokens: this.maxTokens,
                    temperature: this.temperature,
                });

                const content = result.choices?.[0]?.message?.content?.trim();
                
                if (!content) {
                    throw new Error('Empty response from model');
                }
                
                // Check for refusal responses
                if (this.isRefusalResponse(content)) {
                    console.warn('[HFInference] Model returned refusal, retrying with different prompt...');
                    if (attempt < this.maxRetries - 1) {
                        await this.delay(this.retryDelayMs);
                        continue;
                    }
                }
                
                return content;
            } catch (error: any) {
                console.error(`[HFInference] Attempt ${attempt + 1}/${this.maxRetries} failed:`, error.message);
                
                // Handle specific error types
                if (error.message?.includes('rate limit')) {
                    console.warn('[HFInference] Rate limited, waiting longer...');
                    await this.delay(this.retryDelayMs * 3);
                } else if (error.message?.includes('model is loading')) {
                    console.warn('[HFInference] Model loading, waiting...');
                    await this.delay(this.retryDelayMs * 5);
                } else if (attempt < this.maxRetries - 1) {
                    await this.delay(this.retryDelayMs * (attempt + 1));
                }
                
                if (attempt === this.maxRetries - 1) {
                    throw new Error(
                        `HuggingFace API failed after ${this.maxRetries} attempts: ${error.message}`
                    );
                }
            }
        }
        
        throw new Error('Unexpected error in HF generate');
    }

    /**
     * Generate with streaming (for real-time responses)
     */
    async generateWithStream(
        prompt: string, 
        systemPrompt: string,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ];

        let fullResponse = '';

        try {
            const stream = await this.client.chatCompletionStream({
                model: this.model,
                messages,
                max_tokens: this.maxTokens,
                temperature: this.temperature,
            });

            for await (const chunk of stream) {
                const content = chunk.choices?.[0]?.delta?.content || '';
                if (content) {
                    fullResponse += content;
                    onChunk(content);
                }
            }

            return fullResponse;
        } catch (error: any) {
            console.error('[HFInference] Streaming failed:', error.message);
            // Fall back to non-streaming
            return await this.generate(prompt, systemPrompt);
        }
    }

    /**
     * Check if the API is available and the model is ready
     */
    async isAvailable(): Promise<boolean> {
        try {
            const result = await this.client.chatCompletion({
                model: this.model,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5,
            });
            
            const hasResponse = !!result.choices?.[0]?.message?.content;
            
            if (hasResponse) {
                console.log('[HFInference] ✅ Model available and responding');
                return true;
            }
            
            console.warn('[HFInference] Model returned empty response');
            return false;
        } catch (error: any) {
            // Try text generation as fallback for some models
            try {
                await this.client.textGeneration({
                    model: this.model,
                    inputs: 'Hello',
                    parameters: { max_new_tokens: 5 }
                });
                console.log('[HFInference] ✅ Model available via text generation');
                return true;
            } catch {
                console.warn('[HFInference] ❌ Model not available:', error.message);
                return false;
            }
        }
    }

    /**
     * Get backend name for logging
     */
    getName(): string {
        return `HuggingFace (${this.model})`;
    }

    /**
     * Check if response is a refusal
     */
    private isRefusalResponse(content: string): boolean {
        const refusalPatterns = [
            "i can't assist",
            "i cannot assist",
            "i'm not able to",
            "i am not able to",
            "i can't help with",
            "cannot help with",
            "as an ai",
            "as a language model"
        ];
        
        const lowerContent = content.toLowerCase();
        return refusalPatterns.some(pattern => lowerContent.includes(pattern));
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Update model at runtime
     */
    setModel(model: string): void {
        this.model = model;
        console.log(`[HFInference] Model changed to: ${model}`);
    }

    /**
     * Update generation parameters
     */
    setParameters(params: { maxTokens?: number; temperature?: number }): void {
        if (params.maxTokens) this.maxTokens = params.maxTokens;
        if (params.temperature) this.temperature = params.temperature;
    }
}
