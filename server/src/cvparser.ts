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

    /** OPTIMIZED: Fast regex-based classification (no LLM calls) */
    classifyLineFast(line: string): 'email' | 'phone' | 'date' | 'skill' | 'experience' | 'education' | 'name' | 'summary' | 'unknown' {
        const lowerLine = line.toLowerCase();
        
        // Email detection (strict regex)
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line) || /[\w\.-]+@[\w\.-]+\.\w+/.test(line)) {
            return 'email';
        }
        
        // Phone detection
        if (/\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/.test(line) && line.length < 25) {
            return 'phone';
        }
        
        // Date/date range detection (for experience/education entries)
        if (/\d{4}\s*[-–]\s*(present|\d{4}|current)/i.test(line) || 
            /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}/i.test(line)) {
            return 'date';
        }
        
        // Experience keywords (job titles, companies, and structured labels)
        if (lowerLine.startsWith('company :') || lowerLine.startsWith('company:') ||
            lowerLine.startsWith('designation :') || lowerLine.startsWith('designation:') ||
            lowerLine.startsWith('duration :') || lowerLine.startsWith('duration:') ||
            /(developer|engineer|manager|analyst|designer|consultant|specialist|lead|senior|junior|intern|director|ceo|cto|vp)/i.test(lowerLine)) {
            return 'experience';
        }
        
        // Education keywords
        if (/(university|college|bachelor|master|degree|diploma|phd|bsc|msc|mba|school|institute)/i.test(lowerLine)) {
            return 'education';
        }
        
        // Skill detection (expanded keyword list)
        const skillKeywords = [
            'javascript', 'typescript', 'node', 'react', 'python', 'sql', 'aws', 'docker',
            'kubernetes', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
            'html', 'css', 'sass', 'tailwind', 'bootstrap', 'vue', 'angular', 'svelte',
            'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'graphql', 'rest',
            'git', 'github', 'gitlab', 'jenkins', 'ci/cd', 'terraform', 'ansible',
            'azure', 'gcp', 'firebase', 'heroku', 'vercel', 'netlify',
            'agile', 'scrum', 'jira', 'confluence', 'figma', 'sketch',
            'machine learning', 'ai', 'deep learning', 'tensorflow', 'pytorch',
            'data analysis', 'excel', 'powerbi', 'tableau', 'pandas', 'numpy'
        ];
        if (skillKeywords.some(kw => lowerLine.includes(kw))) {
            return 'skill';
        }
        
        // Summary/objective detection
        if (/(summary|objective|profile|about me|professional summary)/i.test(lowerLine) && line.length < 50) {
            return 'summary';
        }
        
        // Name detection (first line, capitalized, short)
        if (line.length < 40 && /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(line)) {
            return 'name';
        }
        
        return 'unknown';
    }

    /** Classify a line using Swarm (legacy, slower) */
    async classifyLine(line: string): Promise<'email' | 'phone' | 'date' | 'skill' | 'unknown'> {
        // Use fast classification first
        const fastResult = this.classifyLineFast(line);
        if (fastResult !== 'unknown') {
            return fastResult as 'email' | 'phone' | 'date' | 'skill' | 'unknown';
        }
        
        // Only use swarm for truly ambiguous cases
        return 'unknown';
    }

    /** Extract email using regex (fast, no LLM) */
    private extractEmailFast(text: string): string | null {
        const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
        const candidates = text.match(emailRegex) || [];
        return candidates[0] || null;
    }

    /** Save parsed data to MasterCV DB in chronological order */
    private saveToMasterCV(userId: string, orderedEntries: Array<{ sectionType: string; content: string }>) {
        console.log(`DEBUG: saveToMasterCV called with ${orderedEntries.length} entries.`);
        orderedEntries.slice(0, 5).forEach((e, i) => console.log(`  DEBUG: Entry ${i} -> [${e.sectionType}] "${e.content}"`));

        // Delete existing entries for this user to avoid accumulation/duplication
        db.prepare('DELETE FROM master_cv WHERE user_id = ?').run(userId);

        for (const entry of orderedEntries) {
            db.prepare(`
                INSERT OR IGNORE INTO master_cv (user_id, section_type, content)
                VALUES (?, ?, ?)
            `).run(userId, entry.sectionType, entry.content);
        }
    }

    /** OPTIMIZED: Main parsing workflow - Fast mode (no LLM calls) */
    async parseCV(pdfPath: string) {
        const startTime = Date.now();
        console.log('🔍 Starting OPTIMIZED CV Parsing...');
        
        console.log('Step 1: Extracting text from PDF...');
        const rawText = await this.extractTextFromPDF(pdfPath);
        console.log(`✅ Extracted ${rawText.length} characters (${Date.now() - startTime}ms)`);
        
        console.log('Step 2: Decomposing into atomic lines...');
        const lines = this.decomposeIntoLines(rawText);
        console.log(`✅ Found ${lines.length} non‑empty lines (${Date.now() - startTime}ms)`);
        
        console.log('Step 3: Fast classification (no LLM)...');
        const classifications: Record<string, string[]> = {
            email: [],
            phone: [],
            date: [],
            skill: [],
            experience: [],
            education: [],
            name: [],
            summary: [],
            unknown: [],
        };
        
        const orderedEntries: Array<{ sectionType: string; content: string }> = [];
        
        // FAST: Process all lines with regex-based classification
        for (const line of lines) {
            if (line.length < 3) continue;
            const type = this.classifyLineFast(line);
            classifications[type].push(line);
            orderedEntries.push({ sectionType: type, content: line });
        }
        
        console.log(`✅ Classified ${lines.length} lines (${Date.now() - startTime}ms)`);

        // Extract user_id and save to DB
        const email = this.extractEmailFast(rawText);
        const userId = email || `anonymous_${Date.now()}`;
        this.saveToMasterCV(userId, orderedEntries);
        
        const totalTime = Date.now() - startTime;
        console.log(`💾 Saved to MasterCV for user: ${userId}`);
        console.log(`⚡ Total parsing time: ${totalTime}ms`);

        return { rawText, lines, classifications, userId };
    }
}
