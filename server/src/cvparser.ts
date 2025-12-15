import fs from 'fs';
import pdfParse = require('pdf-parse');
import { SwarmOrchestrator } from './swarm/orchestrator';
import { db } from './db';

export class CVParser {
    private swarm: SwarmOrchestrator;

    constructor() {
        this.swarm = new SwarmOrchestrator(5);
    }
    /** Extract raw text from a PDF file */
    async extractTextFromPDF(pdfPath: string): Promise<string> {
        const dataBuffer = fs.readFileSync(pdfPath);
        console.log(`PDF Buffer Size: ${dataBuffer.length}`);
        try {
            // Standard pdf-parse usage
            // @ts-ignore
            const data = await pdfParse(dataBuffer);
            return data.text;
        } catch (error: any) {
            console.error('❌ PDF Parse Error:', error);
            throw new Error(`Failed to parse PDF: ${error.message || error}`);
        }
    }

    /** Split raw text into non‑empty trimmed lines */
    decomposeIntoLines(text: string): string[] {
        return text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    }

    /** Classify a line using Swarm */
    async classifyLine(line: string): Promise<'email' | 'phone' | 'date' | 'skill' | 'unknown'> {
        // Email detection
        if (/@/.test(line)) {
            try {
                const prompt = `Is this text an email address? Answer only "yes" or "no".\n\nText: "${line}"`;
                const result = await this.swarm.runAtomicTask(prompt);
                if (result.toLowerCase().includes('yes')) return 'email';
            } catch (e) {
                console.warn('⚠️ Swarm unavailable, using regex fallback for email');
                // Strict regex fallback
                if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line)) return 'email';
            }
        }
        // Phone detection
        if (/\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/.test(line)) return 'phone';
        // Date detection
        if (/\d{4}/.test(line) && line.length < 30) {
            try {
                const prompt = `Is this text a date or date range (e.g., "2020-2023", "Jan 2020")? Answer only "yes" or "no".\n\nText: "${line}"`;
                const result = await this.swarm.runAtomicTask(prompt);
                if (result.toLowerCase().includes('yes')) return 'date';
            } catch (e) {
                console.warn('⚠️ Swarm unavailable, using regex fallback for date');
                // Basic date fallback
                if (/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d\d|19\d\d)/i.test(line)) return 'date';
            }
        }
        // Skill detection (simple keyword list)
        const skillKeywords = ['JavaScript', 'TypeScript', 'Node', 'React', 'Python', 'SQL', 'AWS', 'Docker'];
        if (skillKeywords.some((kw) => line.toLowerCase().includes(kw.toLowerCase()))) return 'skill';
        return 'unknown';
    }

    /** Extract email using swarm verification */
    private async extractEmail(text: string): Promise<string | null> {
        const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
        const candidates = text.match(emailRegex) || [];
        for (const candidate of candidates) {
            try {
                const prompt = `Is "${candidate}" a valid email address? Answer only "yes" or "no".`;
                const result = await this.swarm.runAtomicTask(prompt);
                if (result.toLowerCase().trim() === 'yes') {
                    return candidate;
                }
            } catch (e) {
                console.warn('⚠️ Swarm unavailable, accepting email candidate via regex');
                return candidate; // Fallback: accept the first regex match
            }
        }
        return null;
    }

    /** Save parsed data to MasterCV DB */
    private saveToMasterCV(userId: string, classifications: Record<string, string[]>) {
        for (const [sectionType, items] of Object.entries(classifications)) {
            for (const content of items) {
                db.prepare(`
                    INSERT OR IGNORE INTO master_cv (user_id, section_type, content)
                    VALUES (?, ?, ?)
                `).run(userId, sectionType, content);
            }
        }
    }

    /** Main parsing workflow - UPDATED */
    async parseCV(pdfPath: string) {
        console.log('🔍 Starting CV Parsing with Swarm...');
        console.log('Step 1: Extracting text from PDF...');
        const rawText = await this.extractTextFromPDF(pdfPath);
        console.log(`✅ Extracted ${rawText.length} characters`);
        console.log('Step 2: Decomposing into atomic lines...');
        const lines = this.decomposeIntoLines(rawText);
        console.log(`✅ Found ${lines.length} non‑empty lines`);
        console.log('Step 3: Classifying lines...');
        const classifications: Record<string, string[]> = {
            email: [],
            phone: [],
            date: [],
            skill: [],
            unknown: [],
        };
        
        // Process all lines (with a safety cap of 200 to prevent timeouts during demo)
        const maxLines = 200; 
        for (let i = 0; i < Math.min(maxLines, lines.length); i++) {
            const line = lines[i];
            // Skip very short lines
            if (line.length < 3) continue;
            
            const type = await this.classifyLine(line);
            classifications[type].push(line);
            
            // Log progress every 10 lines
            if (i % 10 === 0) console.log(`   Processed ${i}/${lines.length} lines...`);
        }

        // NEW: Extract user_id and save to DB
        const email = await this.extractEmail(rawText);
        const userId = email || 'anonymous_' + Date.now();
        this.saveToMasterCV(userId, classifications);
        console.log(`💾 Saved to MasterCV for user: ${userId}`);

        return { rawText, lines, classifications, userId };
    }
}
