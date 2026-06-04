/**
 * Fallback LLM Backend
 * Returns sensible defaults when no real backend is available
 * Used for testing or when no API keys are configured
 */

import { LLMBackend } from './LLMBackend';

export class FallbackBackend implements LLMBackend {
    private responseMap: Map<string, string> = new Map([
        // Skills extraction
        ['extract the top', 'Python, JavaScript, React, TypeScript, Node.js, AWS, PostgreSQL, Docker, Git, REST APIs'],
        ['top 10 technical and professional skills', 'Python, JavaScript, React, TypeScript, Node.js, AWS, PostgreSQL, Docker, Git, REST APIs'],

        // Yes/No questions
        ['is the following text an email', 'yes'],
        ['is this text a date', 'yes'],
        ['is the following text a job title', 'yes'],
        ['answer only "yes" or "no"', 'yes'],

        // Scoring
        ['score (1-5)', '4'],
        ['rate this cv bullet point from 1-5', '4'],
        ['rating from 1-10', '7'],

        // Summaries & analysis
        ['write a powerful', 'Accomplished professional with proven track record of delivering high-impact solutions. Strong communicator with expertise in multiple domains. Committed to continuous growth and technical excellence.'],
        ['professional summary', 'Innovative software engineer with 8+ years of experience building scalable systems. Passionate about solving complex problems and mentoring junior developers. Expertise spans full-stack development, cloud infrastructure, and team leadership.'],
        ['rewrite this cv bullet point', 'Led cross-functional team to deliver mission-critical feature, improving performance by 40% and increasing user satisfaction scores.'],

        // CV editing/changes
        ['make minor changes', 'I understand you want to make changes to your CV. To help you with specific edits like updating dates or modifying content, please use the "Regenerate CV" feature which will apply your changes and generate an updated PDF.'],
        ['change', 'I can help you make changes to your CV. For specific edits, please describe what you\'d like to change and I\'ll provide guidance on how to update it.'],
        ['update', 'To update your CV content, you can use the Regenerate CV feature. What specific changes would you like to make?'],
        ['remove', 'I can help you remove content from your CV. Please specify which section or item you\'d like to remove.'],
        ['replace', 'I can help you replace content in your CV. Please specify what you\'d like to change and what the new content should be.'],

        // Generic fallback
        ['', 'This is a fallback response. Configure HF_API_TOKEN or run Ollama for real AI responses.'],
    ]);

    async generate(prompt: string): Promise<string> {
        const lowerPrompt = prompt.toLowerCase();

        // Find matching response
        for (const [key, response] of this.responseMap) {
            if (key && lowerPrompt.includes(key)) {
                return response;
            }
        }

        // Default fallback
        return this.responseMap.get('') || 'Unable to process. Please configure a real LLM backend.';
    }

    async isAvailable(): Promise<boolean> {
        // Fallback is always available
        return true;
    }

    getName(): string {
        return 'Fallback (Mock)';
    }
}
