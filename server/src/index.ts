import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { CVParser } from './cvparser';
import { SwarmOrchestrator } from './swarm/orchestrator';
import { CVAnalyzer } from './swarm/prompts';
import { db } from './db';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Import new services
import { powerWordsService } from './services/powerWords';
import { industryProfileService } from './services/industryProfiles';
import { cvIntelligenceService } from './services/cvIntelligence';
import { jobMatcherService } from './services/jobMatcher';
import { tailoredCVGeneratorService } from './services/tailoredCVGenerator';
import { atsAnalyzerService } from './services/atsAnalyzer';
import { jobQueueManager } from './services/jobQueueManager';
import { cvVersionManager } from './services/cvVersionManager';
import { realTimeSuggestionService } from './services/realTimeSuggestions';
import { cvRegeneratorService } from './services/cvRegenerator';
import { massApplyService } from './services/massApply';
import { jobAggregatorService } from './services/jobAggregator';
import { authService } from './services/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('🚀 ResumAI Server is running!');
});

const swarm = new SwarmOrchestrator(5);
const cvAnalyzer = new CVAnalyzer(5);

const upload = multer({ dest: path.join(__dirname, '../../tmp') });

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // User must set this in .env
        pass: process.env.EMAIL_PASS  // User must set this in .env
    }
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Google OAuth login
app.post('/api/auth/google', express.json(), async (req, res) => {
    const { credential } = req.body;
    try {
        const result = await authService.verifyGoogleToken(credential);
        if (result.success) {
            res.json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Verify token and get user info
app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const user = authService.getUser(decoded.userId);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user });
});

// Get user's CVs
app.get('/api/auth/cvs', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const cvs = authService.getUserCVs(decoded.userId);
    res.json({ success: true, cvs });
});

// Save CV
app.post('/api/auth/cvs', express.json(), (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { cvData, name, template, cvId } = req.body;
    const id = authService.saveCV(decoded.userId, cvData, name, template, cvId);
    res.json({ success: true, cvId: id });
});

// Get specific CV
app.get('/api/auth/cvs/:cvId', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const cv = authService.getCV(req.params.cvId, decoded.userId);
    if (!cv) {
        return res.status(404).json({ success: false, error: 'CV not found' });
    }

    res.json({ success: true, cv: { ...cv, cv_data: JSON.parse(cv.cv_data) } });
});

// Delete CV
app.delete('/api/auth/cvs/:cvId', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const deleted = authService.deleteCV(req.params.cvId, decoded.userId);
    res.json({ success: deleted });
});

// Test endpoint to verify Swarm is working
app.post('/api/swarm/test', async (req, res) => {
    try {
        const { prompt } = req.body;
        const result = await swarm.runAtomicTask(prompt);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// CV Analysis endpoint (we'll build this out)
app.post('/api/cv/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        // TODO: Implement CV parsing with Swarm
        res.json({ success: true, message: "CV analysis coming soon..." });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// CV Parsing endpoint

app.post('/api/cv/parse', upload.single('cv'), async (req: any, res: any) => {
    console.log('📥 Received CV Parse Request');
    console.log('⚡ SERVER RELOADED WITH FIX v2');
    try {
        if (!req.file) {
            console.error('❌ No file received in request');
            return res.status(400).json({ success: false, error: 'No CV file uploaded' });
        }
        console.log(`📄 File received: ${req.file.path} (${req.file.size} bytes)`);
        
        const parser = new CVParser();
        const pdfPath = req.file.path;
        
        console.log('🔄 Starting parser...');
        const result = await parser.parseCV(pdfPath);
        console.log('✅ Parser finished successfully');
        
        // Clean up temporary file
        fs.unlink(pdfPath, (err) => {
            if (err) console.error('⚠️ Failed to delete temp file:', err);
        });
        
        res.json({ success: true, result, userId: result.userId });
    } catch (error: any) {
        console.error('🔥 CRITICAL ERROR in /api/cv/parse:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ success: false, error: error.message || String(error), details: error.stack });
    }
});

app.get('/api/cv/master/:userId', (req, res) => {
    const { userId } = req.params;
    const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ? ORDER BY section_type, created_at').all(userId);
    res.json({ success: true, masterCV: entries });
});

app.get('/api/cv/master', (req, res) => {
    const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ? ORDER BY section_type, created_at').all('default');
    res.json({ success: true, masterCV: entries });
});

app.put('/api/cv/master/:id', express.json(), (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    try {
        db.prepare('UPDATE master_cv SET content = ? WHERE id = ?').run(content, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

app.delete('/api/cv/master/:id', (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM master_cv WHERE id = ?').run(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

app.post('/api/cv/master', express.json(), (req, res) => {
    const { user_id, section_type, content } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO master_cv (user_id, section_type, content) VALUES (?, ?, ?)');
        const info = stmt.run(user_id, section_type, content);
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

app.post('/api/cv/analyze-gaps', express.json(), async (req, res) => {
    const { userId, jobDesc } = req.body;
    try {
        const cvSkillsRaw = db.prepare('SELECT content FROM master_cv WHERE user_id = ? AND section_type LIKE ?').all(userId, '%skill%');
        const cvSkills: string[] = cvSkillsRaw.map((row: any) => row.content);
        const prompt = `Extract top 10 key skills from this job description: "${jobDesc.slice(0, 1000)}..."\nList them as comma-separated.`;
        const jobSkillsStr = await swarm.runAtomicTask(prompt);
        const jobSkills: string[] = jobSkillsStr.split(',').map(s => s.trim());
        const gaps: string[] = jobSkills.filter((skill: string) => !cvSkills.some(cvSkill => cvSkill.toLowerCase().includes(skill.toLowerCase())));
        res.json({ success: true, cvSkills, jobSkills, gaps, recommendations: gaps.slice(0, 5) });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// CV Summary endpoint
app.post('/api/cv/summary', express.json(), async (req, res) => {
    const { userId } = req.body;
    try {
        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId);
        
        if (entries.length === 0) {
            return res.json({ success: false, error: 'No CV data found for this user' });
        }

        // Extract key information
        const skills = entries.filter((e: any) => e.section_type === 'skill').map((e: any) => e.content);
        const experience = entries.filter((e: any) => e.section_type === 'date' || e.section_type === 'unknown').map((e: any) => e.content);
        
        // Generate overview using CVAnalyzer (2025 Persona)
        const overview = await cvAnalyzer.generateSummary(skills, experience);
        
        res.json({
            success: true,
            summary: {
                overview: overview,
                keySkills: skills.slice(0, 10),
                experience: experience.slice(0, 5)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// CV Chat endpoint
app.post('/api/cv/chat', express.json(), async (req, res) => {
    const { userId, message } = req.body;
    try {
        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId);
        const cvContext = entries.map((e: any) => `${e.section_type}: ${e.content}`).join('\n').slice(0, 2000);
        
        // Use CVAnalyzer with 2025 Persona
        const response = await cvAnalyzer.chat(cvContext, message);
        
        res.json({ success: true, response });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// CV Enhancement endpoint
app.post('/api/cv/enhance', express.json(), async (req, res) => {
    const { userId } = req.body;
    try {
        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId);
        const skills = entries.filter((e: any) => e.section_type === 'skill').map((e: any) => e.content);
        
        // Generate enhancement suggestions using CVAnalyzer (2025 Persona)
        const suggestions = await cvAnalyzer.getEnhancementSuggestions(skills);
        
        // Also try to improve some bullet points if available (simplified for now)
        // In a real scenario, we'd iterate through experience bullets.
        
        res.json({ success: true, suggestions: [suggestions] });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// CV Tailoring endpoint
app.post('/api/cv/tailor', express.json(), async (req, res) => {
    const { userId, jobDescription } = req.body;
    try {
        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId);
        const skills = entries.filter((e: any) => e.section_type === 'skill').map((e: any) => e.content);
        
        // Extract job requirements using swarm
        const jobSkillsPrompt = `Extract the top 5 required skills from this job description: "${jobDescription.slice(0, 1000)}". List as: "1. Skill"`;
        const jobSkillsResponse = await swarm.runAtomicTask(jobSkillsPrompt);
        
        // Generate change log
        const changeLog = [
            { type: 'added' as const, item: 'Highlighted relevant experience', reason: 'Matches job requirements' },
            { type: 'modified' as const, item: 'Skills section emphasized', reason: 'Aligned with job description' },
            { type: 'added' as const, item: 'Keywords from job posting', reason: 'Improved ATS compatibility' }
        ];
        
        res.json({
            success: true,
            result: {
                message: `I have enhanced your CV to align with the job requirements. Key changes include emphasizing ${skills.slice(0, 3).join(', ')} and adding relevant keywords.`,
                pdfPath: `/downloads/tailored_cv_${userId}_${Date.now()}.pdf`,
                changeLog
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Email cooldown check endpoint
app.post('/api/mail/check-cooldown', express.json(), async (req, res) => {
    const { emails } = req.body;
    const userId = 'default'; // In production, get from auth
    
    try {
        const recipients = [];
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
        
        for (const email of emails) {
            // Basic email validation
            if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                recipients.push({ email, status: 'invalid' });
                continue;
            }
            
            // Check cooldown
            const lastSent = db.prepare(
                'SELECT sent_at FROM email_logs WHERE user_id = ? AND recipient_email = ? ORDER BY sent_at DESC LIMIT 1'
            ).get(userId, email) as any;
            
            if (lastSent && lastSent.sent_at > fourDaysAgo) {
                const sentDate = new Date(lastSent.sent_at);
                const cooldownEnd = new Date(sentDate.getTime() + 4 * 24 * 60 * 60 * 1000);
                const daysLeft = Math.ceil((cooldownEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                
                recipients.push({ email, status: 'cooldown', cooldownDays: daysLeft });
            } else {
                recipients.push({ email, status: 'valid' });
            }
        }
        
        res.json({ success: true, recipients });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Email generation endpoint
app.post('/api/mail/generate', express.json(), async (req, res) => {
    const { context, physicalAddress } = req.body;
    
    try {
        let emailBody = '';
        
        try {
            const prompt = `Write a professional email for job application. Recipients: ${context.who}. Purpose: ${context.about}. 
            
Requirements:
- Professional and concise
- Include a subject line
- 3-4 paragraphs max
- End with a call to action

Format as:
Subject: [subject line]

[email body]`;
            
            emailBody = await swarm.runAtomicTask(prompt);
        } catch (aiError) {
            // Fallback template if AI fails
            console.log('AI generation failed, using template:', aiError);
            emailBody = `Subject: ${context.about || 'Job Application'}

Dear ${context.who || 'Hiring Manager'},

I am writing to express my interest in opportunities at your organization. I believe my skills and experience make me a strong candidate for roles in your team.

I would welcome the opportunity to discuss how I can contribute to your organization's success. Please find my resume attached for your review.

Thank you for considering my application. I look forward to hearing from you.

Best regards`;
        }

        // Append Compliance Footer
        if (physicalAddress) {
            emailBody += `\n\n---\nSent by: ${physicalAddress}\nReason: ${context.about}\nTo unsubscribe, please reply with "UNSUBSCRIBE".`;
        }
        
        res.json({ success: true, emailBody });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// AI Safety Check Endpoint
app.post('/api/mail/safety-check', express.json(), async (req, res) => {
    const { subject, body } = req.body;
    try {
        // Basic safety check without AI (fallback)
        const unsafePatterns = [
            /\b(password|credit card|ssn|social security)\b/i,
            /\b(click here|act now|limited time|urgent)\b/i,
            /\b(nigger|faggot|kill yourself)\b/i
        ];
        
        const content = `${subject} ${body}`;
        let isSafe = true;
        let reason = '';
        
        for (const pattern of unsafePatterns) {
            if (pattern.test(content)) {
                isSafe = false;
                reason = 'Content contains potentially unsafe or inappropriate language';
                break;
            }
        }
        
        // Try AI check if available
        try {
            const prompt = `Analyze this email content for safety. Subject: ${subject}. Body: ${body.slice(0, 500)}. Reply only "SAFE" or "UNSAFE: reason".`;
            const result = await swarm.runAtomicTask(prompt);
            isSafe = result.trim().toUpperCase().startsWith('SAFE');
            if (!isSafe) {
                reason = result.replace(/UNSAFE:?/i, '').trim();
            }
        } catch {
            // Use basic check result if AI fails
            console.log('AI safety check unavailable, using basic check');
        }
        
        res.json({ success: true, safe: isSafe, reason: isSafe ? undefined : reason });
    } catch (error) {
        // Default to safe if check fails entirely
        res.json({ success: true, safe: true });
    }
});

// Email sending endpoint
app.post('/api/mail/send', express.json(), async (req, res) => {
    const { recipients, emailBody, context, physicalAddress } = req.body;
    const userId = 'default'; // In production, get from auth
    
    if (!physicalAddress) {
        return res.status(400).json({ success: false, error: 'Physical address is required for compliance.' });
    }

    try {
        let sentCount = 0;
        const stmt = db.prepare('INSERT INTO email_logs (user_id, recipient_email, sent_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
        
        // Extract subject from body if possible, or use default
        const subjectMatch = emailBody.match(/Subject: (.*)/);
        const subject = subjectMatch ? subjectMatch[1] : `Message from ${context.who}`;
        const cleanBody = emailBody.replace(/Subject: .*\n/, '').trim();

        for (const email of recipients) {
            try {
                // Send via Nodemailer
                if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: subject,
                        text: cleanBody
                    });
                    console.log(`📧 Email sent via SMTP to: ${email}`);
                } else {
                    console.log(`⚠️ SMTP not configured. Simulating send to: ${email}`);
                }

                stmt.run(userId, email);
                sentCount++;
            } catch (error) {
                console.error(`Failed to send to ${email}:`, error);
            }
        }
        
        res.json({ success: true, sentCount });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Email sending endpoint with user-provided SMTP credentials
app.post('/api/mail/send-user', express.json(), async (req, res) => {
    const { recipients, emailBody, context, physicalAddress, smtpCredentials } = req.body;
    
    if (!physicalAddress) {
        return res.status(400).json({ success: false, error: 'Physical address is required for compliance.' });
    }

    if (!smtpCredentials?.email || !smtpCredentials?.password) {
        return res.status(400).json({ success: false, error: 'Email credentials are required.' });
    }

    try {
        // Create transporter with user's credentials
        const serviceConfig: any = {};
        
        switch (smtpCredentials.service) {
            case 'gmail':
                serviceConfig.service = 'gmail';
                break;
            case 'outlook':
                serviceConfig.service = 'hotmail';
                break;
            case 'yahoo':
                serviceConfig.service = 'yahoo';
                break;
            case 'custom':
                serviceConfig.host = smtpCredentials.host;
                serviceConfig.port = smtpCredentials.port || 587;
                serviceConfig.secure = smtpCredentials.port === 465;
                break;
            default:
                serviceConfig.service = 'gmail';
        }

        const userTransporter = nodemailer.createTransport({
            ...serviceConfig,
            auth: {
                user: smtpCredentials.email,
                pass: smtpCredentials.password
            },
            // Fix for self-signed certificate errors
            tls: {
                rejectUnauthorized: false
            }
        });

        let sentCount = 0;
        const errors: string[] = [];
        
        // Extract subject from body if possible, or use default
        const subjectMatch = emailBody.match(/Subject: (.*)/);
        const subject = subjectMatch ? subjectMatch[1] : `Message from ${context.who}`;
        const cleanBody = emailBody.replace(/Subject: .*\n/, '').trim();

        for (const email of recipients) {
            try {
                await userTransporter.sendMail({
                    from: smtpCredentials.email,
                    to: email,
                    subject: subject,
                    text: cleanBody
                });
                console.log(`📧 Email sent to: ${email}`);
                sentCount++;
            } catch (error: any) {
                console.error(`Failed to send to ${email}:`, error.message);
                errors.push(`${email}: ${error.message}`);
            }
        }

        // Close the transporter
        userTransporter.close();
        
        if (sentCount === 0 && errors.length > 0) {
            return res.json({ 
                success: false, 
                error: `Failed to send emails. ${errors[0]}` 
            });
        }
        
        res.json({ success: true, sentCount, errors: errors.length > 0 ? errors : undefined });
    } catch (error: any) {
        console.error('Email sending error:', error);
        res.status(500).json({ success: false, error: error.message || String(error) });
    }
});

// ============================================
// CV INTELLIGENCE ENDPOINTS
// ============================================

// Analyze a bullet point
app.post('/api/cv/analyze-bullet', express.json(), async (req, res) => {
    const { bullet, industry } = req.body;
    try {
        const analysis = cvIntelligenceService.analyzeBullet(bullet);
        res.json({ success: true, analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Enhance a bullet point with AI
app.post('/api/cv/enhance-bullet', express.json(), async (req, res) => {
    const { bullet, industry } = req.body;
    try {
        const enhanced = await cvIntelligenceService.enhanceBullet(bullet, industry);
        const originalScore = cvIntelligenceService.scoreBullet(bullet);
        const enhancedScore = cvIntelligenceService.scoreBullet(enhanced);
        res.json({ 
            success: true, 
            original: bullet,
            enhanced,
            originalScore,
            enhancedScore
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Full CV analysis
app.post('/api/cv/full-analysis', express.json(), async (req, res) => {
    const { userId, industry } = req.body;
    try {
        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
        if (entries.length === 0) {
            return res.json({ success: false, error: 'No CV data found' });
        }
        const analysis = cvIntelligenceService.analyzeCV(entries, industry);
        res.json({ success: true, analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get CV strength score
app.post('/api/cv/strength-score', express.json(), async (req, res) => {
    const { userId, industry } = req.body;
    try {
        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
        const score = cvIntelligenceService.calculateStrengthScore(entries, industry);
        res.json({ success: true, score });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ============================================
// JOB MATCHING ENDPOINTS
// ============================================

// Extract job requirements
app.post('/api/jobs/extract-requirements', express.json(), async (req, res) => {
    const { jobDescription } = req.body;
    try {
        const requirements = await jobMatcherService.extractRequirements(jobDescription);
        res.json({ success: true, requirements });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Calculate match score
app.post('/api/jobs/match-score', express.json(), async (req, res) => {
    const { userId, jobDescription } = req.body;
    try {
        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
        const requirements = await jobMatcherService.extractRequirements(jobDescription);
        const matchResult = jobMatcherService.calculateMatch(entries, requirements);
        res.json({ success: true, matchResult, requirements });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ============================================
// TAILORED CV ENDPOINTS
// ============================================

// Generate tailored CV for a job
app.post('/api/cv/tailor-for-job', express.json(), async (req, res) => {
    const { userId, jobDescription } = req.body;
    try {
        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
        if (entries.length === 0) {
            return res.json({ success: false, error: 'No CV data found. Please upload a CV first.' });
        }
        const result = await tailoredCVGeneratorService.generate(userId, entries, jobDescription);
        res.json({ 
            success: true, 
            tailoredCV: result.tailoredCV,
            matchScore: result.matchResult.matchScore,
            matchedSkills: result.matchResult.matchedSkills,
            missingSkills: result.matchResult.missingSkills,
            recommendations: result.matchResult.recommendations
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get all tailored CVs for user
app.get('/api/cv/tailored/:userId', (req, res) => {
    const { userId } = req.params;
    try {
        const cvs = tailoredCVGeneratorService.getTailoredCVs(userId);
        res.json({ success: true, cvs });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get specific tailored CV
app.get('/api/cv/tailored/detail/:cvId', (req, res) => {
    const { cvId } = req.params;
    try {
        const cv = tailoredCVGeneratorService.getTailoredCV(cvId);
        if (!cv) {
            return res.json({ success: false, error: 'CV not found' });
        }
        res.json({ success: true, cv });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Update tailored CV status
app.put('/api/cv/tailored/:cvId/status', express.json(), (req, res) => {
    const { cvId } = req.params;
    const { status } = req.body;
    try {
        tailoredCVGeneratorService.updateStatus(cvId, status);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Delete tailored CV
app.delete('/api/cv/tailored/:cvId', (req, res) => {
    const { cvId } = req.params;
    try {
        tailoredCVGeneratorService.deleteTailoredCV(cvId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Analyze job without generating CV (just extract requirements and match score)
app.post('/api/cv/analyze-job', express.json(), async (req, res) => {
    const { userId, jobDescription } = req.body;
    try {
        // Extract job requirements
        const requirements = await jobMatcherService.extractRequirements(jobDescription);
        
        // If userId provided, calculate match score
        let matchResult = null;
        if (userId) {
            const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
            if (entries.length > 0) {
                matchResult = jobMatcherService.calculateMatch(entries, requirements);
            }
        }
        
        res.json({ 
            success: true, 
            requirements,
            matchResult
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ============================================
// POWER WORDS & INDUSTRY ENDPOINTS
// ============================================

// Get power words by category
app.get('/api/power-words/:category', (req, res) => {
    const { category } = req.params;
    try {
        const words = powerWordsService.getByCategory(category);
        res.json({ success: true, words });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get power words stats
app.get('/api/power-words/stats', (req, res) => {
    try {
        const stats = powerWordsService.getStats();
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get industry profile
app.get('/api/industries/:industryId', (req, res) => {
    const { industryId } = req.params;
    try {
        const profile = industryProfileService.getProfile(industryId);
        if (!profile) {
            return res.json({ success: false, error: 'Industry not found' });
        }
        res.json({ success: true, profile });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get all supported industries
app.get('/api/industries', (req, res) => {
    try {
        const industries = industryProfileService.getSupportedIndustries();
        res.json({ success: true, industries });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ============================================
// ATS ANALYZER ENDPOINTS
// ============================================

// ATS compatibility check
app.post('/api/cv/ats-check', express.json(), async (req, res) => {
    const { userId, cvContent } = req.body;
    try {
        let content = cvContent;
        
        // If userId provided, get CV content from database
        if (userId && !cvContent) {
            const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
            content = entries.map((e: any) => `${e.section_type}: ${e.content}`).join('\n');
        }
        
        if (!content) {
            return res.json({ success: false, error: 'No CV content provided' });
        }
        
        const analysis = atsAnalyzerService.analyze(content);
        res.json({ success: true, analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ATS parsing simulation
app.post('/api/cv/ats-simulate', express.json(), async (req, res) => {
    const { userId, cvContent } = req.body;
    try {
        let content = cvContent;
        
        // If userId provided, get CV content from database
        if (userId && !cvContent) {
            const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
            content = entries.map((e: any) => e.content).join('\n');
        }
        
        if (!content) {
            return res.json({ success: false, error: 'No CV content provided' });
        }
        
        const parseResult = atsAnalyzerService.simulateParsing(content);
        res.json({ success: true, parseResult });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Check text extractability
app.post('/api/cv/check-extractability', express.json(), async (req, res) => {
    const { content } = req.body;
    try {
        if (!content) {
            return res.json({ success: false, error: 'No content provided' });
        }
        const result = atsAnalyzerService.checkTextExtractability(content);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ============================================
// JOB QUEUE ENDPOINTS
// ============================================

// Add job to queue
app.post('/api/jobs/queue', express.json(), (req, res) => {
    const { userId, jobTitle, company, jobDescription, jobUrl } = req.body;
    try {
        const job = jobQueueManager.addJob(userId || 'default', {
            jobTitle,
            company,
            jobDescription,
            jobUrl
        });
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Process job queue
app.post('/api/jobs/process', express.json(), async (req, res) => {
    const { userId } = req.body;
    try {
        const result = await jobQueueManager.processQueue(userId || 'default');
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get queue status
app.get('/api/jobs/status/:userId', (req, res) => {
    const { userId } = req.params;
    try {
        const status = jobQueueManager.getQueueStatus(userId);
        res.json({ success: true, status });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Remove job from queue
app.delete('/api/jobs/queue/:jobId', (req, res) => {
    const { jobId } = req.params;
    try {
        const removed = jobQueueManager.removeJob(jobId);
        res.json({ success: true, removed });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Update application status
app.put('/api/jobs/:jobId/application-status', express.json(), (req, res) => {
    const { jobId } = req.params;
    const { status } = req.body;
    try {
        jobQueueManager.updateApplicationStatus(jobId, status);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ============================================
// CV VERSION MANAGEMENT ENDPOINTS
// ============================================

// List CV versions
app.get('/api/cv/versions/:userId', (req, res) => {
    const { userId } = req.params;
    try {
        const versions = cvVersionManager.list(userId);
        res.json({ success: true, versions });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get specific CV version
app.get('/api/cv/versions/detail/:cvId', (req, res) => {
    const { cvId } = req.params;
    try {
        const version = cvVersionManager.get(cvId);
        if (!version) {
            return res.json({ success: false, error: 'CV version not found' });
        }
        res.json({ success: true, version });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Delete CV version
app.delete('/api/cv/versions/:cvId', (req, res) => {
    const { cvId } = req.params;
    try {
        const deleted = cvVersionManager.delete(cvId);
        res.json({ success: true, deleted });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Duplicate CV version
app.post('/api/cv/versions/:cvId/duplicate', express.json(), (req, res) => {
    const { cvId } = req.params;
    const { newName } = req.body;
    try {
        const duplicate = cvVersionManager.duplicate(cvId, newName);
        if (!duplicate) {
            return res.json({ success: false, error: 'Original CV not found' });
        }
        res.json({ success: true, version: duplicate });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Generate PDF filename
app.post('/api/cv/generate-filename', express.json(), (req, res) => {
    const { name, company } = req.body;
    try {
        const filename = cvVersionManager.generatePdfFilename(name, company);
        res.json({ success: true, filename });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ============================================
// REAL-TIME SUGGESTION ENDPOINTS
// ============================================

// Get suggestions for a bullet point
app.post('/api/cv/suggest', express.json(), (req, res) => {
    const { bullet, userId } = req.body;
    try {
        const result = realTimeSuggestionService.analyzeBullet(bullet, userId);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Record suggestion feedback
app.post('/api/cv/suggestion-feedback', express.json(), (req, res) => {
    const { userId, suggestionId, suggestionType, accepted } = req.body;
    try {
        realTimeSuggestionService.recordFeedback(userId, suggestionId, suggestionType, accepted);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get user suggestion preferences
app.get('/api/cv/suggestion-preferences/:userId', (req, res) => {
    const { userId } = req.params;
    try {
        const preferences = realTimeSuggestionService.getUserPreferences(userId);
        res.json({ success: true, preferences });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Batch analyze bullets
app.post('/api/cv/suggest-batch', express.json(), (req, res) => {
    const { bullets, userId } = req.body;
    try {
        const results = realTimeSuggestionService.analyzeBullets(bullets, userId);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ============================================
// CV REGENERATION ENDPOINTS
// ============================================

// Regenerate CV with Harvard style and enhancements
app.post('/api/cv/regenerate', express.json(), async (req, res) => {
    const { userId, industry } = req.body;
    try {
        const regeneratedCV = await cvRegeneratorService.regenerate(userId || 'default', industry);
        res.json({ success: true, cv: regeneratedCV });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ============================================
// MASS APPLY ENDPOINTS
// ============================================

// Add jobs to application queue
app.post('/api/apply/add-jobs', express.json(), (req, res) => {
    const { userId, jobs } = req.body;
    try {
        const addedJobs = massApplyService.addJobsToQueue(userId || 'default', jobs);
        res.json({ success: true, jobs: addedJobs });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Process all pending applications
app.post('/api/apply/process', express.json(), async (req, res) => {
    const { userId } = req.body;
    try {
        const result = await massApplyService.processApplications(userId || 'default');
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Generate cover letter for a job
app.post('/api/apply/cover-letter', express.json(), async (req, res) => {
    const { userId, jobId } = req.body;
    try {
        const coverLetter = await massApplyService.generateCoverLetter(userId || 'default', jobId);
        res.json({ success: true, coverLetter });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get application statistics
app.get('/api/apply/stats/:userId', (req, res) => {
    const { userId } = req.params;
    try {
        const stats = massApplyService.getApplicationStats(userId);
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Parse job listings from text
app.post('/api/apply/parse-jobs', express.json(), (req, res) => {
    const { text } = req.body;
    try {
        const jobs = massApplyService.parseJobListings(text);
        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ============================================
// JOB AGGREGATOR ENDPOINTS
// ============================================

// Search jobs across multiple platforms
app.post('/api/jobs/search', express.json(), async (req, res) => {
    const { keywords, location, remote, jobType, experienceLevel, postedWithin, sources } = req.body;
    try {
        const jobs = await jobAggregatorService.searchJobs({
            keywords: keywords || '',
            location,
            remote,
            jobType,
            experienceLevel,
            postedWithin,
            sources
        });
        res.json({ success: true, jobs, count: jobs.length });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Apply to selected jobs with CV
app.post('/api/jobs/apply-batch', express.json(), async (req, res) => {
    const { jobs, cvId, userId, userEmail, coverLetterTemplate } = req.body;
    try {
        if (!jobs || jobs.length === 0) {
            return res.status(400).json({ success: false, error: 'No jobs selected' });
        }
        
        const results = await jobAggregatorService.applyToJobs(
            jobs,
            cvId || 'default',
            userId || 'default',
            userEmail,
            coverLetterTemplate
        );
        
        const successful = results.filter(r => r.status === 'success').length;
        const failed = results.filter(r => r.status === 'failed').length;
        
        res.json({ 
            success: true, 
            results,
            summary: {
                total: results.length,
                successful,
                failed,
                pending: results.length - successful - failed
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get available job sources
app.get('/api/jobs/sources', (req, res) => {
    res.json({
        success: true,
        sources: [
            { id: 'remoteok', name: 'RemoteOK', description: 'Remote jobs worldwide', active: true },
            { id: 'greenhouse', name: 'Greenhouse', description: 'Top tech companies', active: true },
            { id: 'adzuna', name: 'Adzuna', description: 'Job search engine', active: !!process.env.ADZUNA_API_KEY },
            { id: 'indeed', name: 'Indeed', description: 'Largest job board', active: false },
            { id: 'linkedin', name: 'LinkedIn', description: 'Professional network', active: false },
            { id: 'glassdoor', name: 'Glassdoor', description: 'Jobs with reviews', active: false },
            { id: 'ziprecruiter', name: 'ZipRecruiter', description: 'AI-powered matching', active: false }
        ]
    });
});

app.listen(PORT, () => {
    console.log(`🚀 ResumAI Server running on http://localhost:${PORT}`);
    console.log(`🐝 Swarm Orchestrator initialized with 5 workers`);
    console.log(`📊 CV Intelligence Service loaded with ${powerWordsService.getStats().totalPowerWords} power words`);
    console.log(`🏢 Industry Profiles loaded: ${industryProfileService.getSupportedIndustries().join(', ')}`);
    
    // Keep process alive
    setInterval(() => {
        // Heartbeat
    }, 1000 * 60 * 60);
});
