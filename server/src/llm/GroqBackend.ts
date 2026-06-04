/**
 * Groq API Backend
 * Fast inference with generous free tier
 * 
 * Sign up at: https://console.groq.com/
 * Free tier: Unlimited requests, very fast inference
 */

import { LLMBackend } from './LLMBackend';

interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export class GroqBackend implements LLMBackend {
    private apiKey: string;
    private model: string;
    private maxRetries: number = 3;
    private retryDelayMs: number = 1000;
    private maxTokens: number = 2048;
    private temperature: number = 0.7;

    constructor(apiKey?: string, model?: string) {
        this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
        this.model = model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        
        if (!this.apiKey) {
            throw new Error(
                'GROQ_API_KEY environment variable required.\n' +
                'Get a free key at: https://console.groq.com/'
            );
        }
        
        console.log(`[GroqBackend] Initialized with model: ${this.model}`);
    }

    async generate(prompt: string, systemPrompt?: string): Promise<string> {
        if (process.env.MOCK_LLM === 'true') {
            if (prompt.includes('Analyze this job description')) {
                return `TITLE: Remote Full Stack Engineer
COMPANY: Aura Tech
REQUIRED_SKILLS: React, TypeScript, Node.js, SQL
PREFERRED_SKILLS: AWS, Docker
RESPONSIBILITIES: Build swarm intelligence interfaces, develop REST APIs
KEYWORDS: React, TypeScript, Node.js, SQL
EXPERIENCE_LEVEL: mid
INDUSTRY: technology`;
            }
            if (prompt.includes('create a highly marketable resume bullet point')) {
                return JSON.stringify({
                    suggestedBullet: "Leveraged Node.js to optimize API request handling, reducing latency by 20%.",
                    relevance: "Demonstrates backend mastery and performance tuning."
                });
            }
            if (prompt.includes('Write a compelling cover letter') || prompt.includes('Write a professional cover letter')) {
                return `I am writing to express my strong interest in the Remote Full Stack Engineer position. As a T-shaped engineer with deep domain expertise in distributed systems and cloud infrastructure, I bring a unique combination of React/TypeScript frontend mastery and robust Node.js backend engineering. I thrive on bridging the gap between product needs and reliable infrastructure, ensuring that applications are not only visually stunning but also optimized for massive scale.

Throughout my career, I have focused on amplifying engineering velocity and system reliability. By integrating AI-assisted development tools (like GitHub Copilot and LLM code synthesizers) and modern automation pipelines into my daily workflow, I've consistently achieved a 35% increase in feature delivery speed while maintaining clean, secure code. Having worked in highly async, remote-first environments, I value written documentation, proactive communication, and extreme self-reliance.

I pride myself on driving real, quantifiable business outcomes rather than just shipping code. For example, in my previous role, I re-architected a critical API gateway using Node.js and Redis, which reduced average API latency by 42% and slashed cloud infrastructure costs by 28%. I am excited about the opportunity to bring this focus on velocity, domain depth, and measurable impact to your team, and to help build the next generation of your platform.`;
            }
            if (prompt.includes('Rewrite this CV experience description')) {
                return JSON.stringify({
                    improved: "Designed and implemented robust swarm consensus logic for high-fidelity CV parsing using Node.js.",
                    impact: 20
                });
            }
            return "Mocked LLM Response";
        }

        const messages: GroqMessage[] = [];
        
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        let rateLimitRetries = 0;
        const maxRateLimitRetries = 5;

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages,
                        max_tokens: this.maxTokens,
                        temperature: this.temperature
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    if (response.status === 429 && rateLimitRetries < maxRateLimitRetries) {
                        rateLimitRetries++;
                        let waitTimeMs = 15000; // default 15s
                        const match = errorText.match(/try again in ([\d\.]+)s/i);
                        if (match && match[1]) {
                            waitTimeMs = Math.ceil(parseFloat(match[1]) * 1000) + 1500; // Add 1.5s buffer
                        } else {
                            const retryAfterHeader = response.headers.get('retry-after');
                            if (retryAfterHeader) {
                                const parsed = parseFloat(retryAfterHeader);
                                if (!isNaN(parsed)) {
                                    waitTimeMs = Math.ceil(parsed * 1000) + 1500;
                                }
                            }
                        }
                        console.warn(`[GroqBackend] Rate limit hit. Attempt ${rateLimitRetries}/${maxRateLimitRetries}. Waiting ${waitTimeMs / 1000}s before retrying...`);
                        await this.delay(waitTimeMs);
                        attempt--; // Don't count rate limits towards general failures
                        continue;
                    }
                    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                const content = data.choices?.[0]?.message?.content?.trim();
                
                if (!content) {
                    throw new Error('Empty response from Groq');
                }
                
                return content;
            } catch (error: any) {
                console.error(`[GroqBackend] Attempt ${attempt + 1}/${this.maxRetries} failed:`, error.message);
                
                if (attempt < this.maxRetries - 1) {
                    await this.delay(this.retryDelayMs * (attempt + 1));
                }
                
                if (attempt === this.maxRetries - 1) {
                    throw new Error(`Groq API failed after ${this.maxRetries} attempts: ${error.message}`);
                }
            }
        }
        
        throw new Error('Unexpected error in Groq generate');
    }

    async generateWithStream(
        prompt: string, 
        systemPrompt: string,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        // For simplicity, fall back to non-streaming
        return this.generate(prompt, systemPrompt);
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    getName(): string {
        return `Groq (${this.model})`;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default GroqBackend;
