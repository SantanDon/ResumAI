import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { CVParser } from './cvparser';
import { SwarmOrchestrator } from './swarm/orchestrator';
import { CVAnalyzer } from './swarm/prompts';
import { db } from './db';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { LLMFactory } from './llm/LLMFactory';

// Import validation and middleware
import { validate, cvAnalyzeSchema, cvTailorSchema, chatMessageSchema, cvEnhancementSchema } from './validation';
import { apiLimiter, cvLimiter, authLimiter, cvGenerationLimiter, chatLimiter } from './middleware/rateLimiter';

// Import routes
import cvGenerationRoutes from './routes/cvGeneration';
import jobAssistantRoutes from './routes/jobAssistant';
import autoJobHunterRoutes from './routes/autoJobHunter';

// Import services
import { powerWordsService } from './services/powerWords';
import { industryProfileService } from './services/industryProfiles';
import { cvIntelligenceService } from './services/cvIntelligence';
import { jobMatcherService } from './services/jobMatcher';
import { tailoredCVGeneratorService } from './services/tailoredCVGenerator';
import { atsAnalyzerService } from './services/atsAnalyzer';
import { cvVersionManager } from './services/cvVersionManager';
import { realTimeSuggestionService } from './services/realTimeSuggestions';
import { cvRegeneratorService } from './services/cvRegenerator';
import { authService } from './services/auth';
import { masterCVSyncService } from './services/masterCVSync';
import { pdfGeneratorService } from './services/pdfGenerator';
import { coverLetterGenerator } from './services/coverLetterGenerator';
import { jobParserService } from './services/jobParserService';
import { massApplyService } from './services/massApply';
import { jobAggregatorService } from './services/jobAggregator';
import { messageFormatterService } from './services/messageFormatter';
import { industryManager } from './services/industryManager';
import { humanVerificationDetector } from './services/humanVerificationDetector';
import { remoteJobScoutService } from './services/remoteJobScout';
import { cvEvolutionEngine } from './services/cvEvolutionEngine';
import { resumAIAgentService } from './services/agentService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(apiLimiter);

// Mount CV generation routes
app.use('/api/cv', cvGenerationRoutes);

// Mount job assistant routes
app.use('/api', jobAssistantRoutes);

// Mount auto job hunter routes
app.use('/api/hunter', autoJobHunterRoutes);

app.get('/', (req, res) => {
    res.send('🚀 ResumAI Server is running!');
});

const swarm = new SwarmOrchestrator(5);
const cvAnalyzer = new CVAnalyzer(5);

const upload = multer({ dest: path.join(__dirname, '../../tmp') });

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Google OAuth login
app.post('/api/auth/google', authLimiter, express.json(), async (req, res) => {
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

// CV Analysis endpoint - Extract key information using swarm consensus
app.post('/api/cv/analyze', cvLimiter, async (req, res) => {
    try {
        // Validate input
        const validationResult = validate(cvAnalyzeSchema, req.body);
        if (!validationResult.success) {
            return res.status(400).json({ success: false, error: validationResult.error });
        }

        const { text } = validationResult.data!;
        console.log(`[/api/cv/analyze] Analyzing CV (${text.length} chars)...`);

        // Use swarm for consensus-based analysis
        const analyzer = new CVAnalyzer(5);
        
        // Extract key sections in parallel
        const [overview, skills, experience, education] = await Promise.all([
            analyzer.extractOverview(text),
            analyzer.extractSkills(text),
            analyzer.extractExperience(text),
            analyzer.extractEducation(text),
        ]);

        res.json({
            success: true,
            analysis: {
                overview,
                keySkills: skills,
                experience,
                education,
                totalLength: text.length,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error: any) {
        console.error('[/api/cv/analyze] Error:', error);
        res.status(500).json({ success: false, error: error.message || String(error) });
    }
});

// CV Parsing endpoint

app.post('/api/cv/parse', upload.single('cv'), async (req: any, res: any) => {
    console.log('📥 Received CV Parse Request');
    console.log('⚡ OPTIMIZED FAST PARSING v3');
    try {
        if (!req.file) {
            console.error('❌ No file received in request');
            return res.status(400).json({ success: false, error: 'No CV file uploaded' });
        }
        console.log(`📄 File received: ${req.file.path} (${req.file.size} bytes)`);
        
        const parser = new CVParser();
        const pdfPath = req.file.path;
        
        console.log('🔄 Starting fast parser...');
        const result = await parser.parseCV(pdfPath);
        console.log('✅ Parser finished successfully');
        
        const userId = result.userId || 'default';
        
        // OPTIMIZATION: Skip slow LLM sync during upload
        // The fast parser already saves classified data to master_cv
        // LLM-enhanced analysis happens later when user clicks "Start Chat"
        console.log(`⚡ Fast parse complete for ${userId} - skipping LLM sync for speed`);
        
        // Clean up temporary file
        fs.unlink(pdfPath, (err) => {
            if (err) console.error('⚠️ Failed to delete temp file:', err);
        });
        
        res.json({ success: true, result, userId });
    } catch (error: any) {
        console.error('🔥 CRITICAL ERROR in /api/cv/parse:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ success: false, error: error.message || String(error), details: error.stack });
    }
});

app.get('/api/cv/master/:userId', (req, res) => {
    const { userId } = req.params;
    const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ? ORDER BY id').all(userId);
    res.json({ success: true, masterCV: entries });
});

app.get('/api/cv/master', (req, res) => {
    const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ? ORDER BY id').all('default');
    res.json({ success: true, masterCV: entries });
});

app.put('/api/cv/master/:id', express.json(), (req, res) => {
    const { id } = req.params;
    const { content, visible } = req.body;
    try {
        if (content !== undefined && visible !== undefined) {
            db.prepare('UPDATE master_cv SET content = ?, visible = ? WHERE id = ?').run(content, visible ? 1 : 0, id);
        } else if (content !== undefined) {
            db.prepare('UPDATE master_cv SET content = ? WHERE id = ?').run(content, id);
        } else if (visible !== undefined) {
            db.prepare('UPDATE master_cv SET visible = ? WHERE id = ?').run(visible ? 1 : 0, id);
        }
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
    const { user_id, section_type, content, visible } = req.body;
    try {
        const isVisible = visible === false ? 0 : 1;
        const stmt = db.prepare('INSERT INTO master_cv (user_id, section_type, content, visible) VALUES (?, ?, ?, ?)');
        const info = stmt.run(user_id, section_type, content, isVisible);
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// JSON Export endpoint for user's master CV
app.get('/api/cv/master/:userId/export', (req, res) => {
    const { userId } = req.params;
    try {
        const entries = db.prepare('SELECT section_type, content, visible FROM master_cv WHERE user_id = ? ORDER BY id').all(userId) as any[];
        res.json({
            success: true,
            exported_at: new Date().toISOString(),
            userId,
            sections: entries.map(e => ({
                section_type: e.section_type,
                content: e.content,
                visible: e.visible !== 0
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// JSON Import endpoint for user's master CV
app.post('/api/cv/master/:userId/import', express.json(), (req, res) => {
    const { userId } = req.params;
    const { sections } = req.body;
    
    if (!sections || !Array.isArray(sections)) {
        return res.status(400).json({ success: false, error: 'Invalid payload: sections array is required' });
    }

    try {
        const deleteStmt = db.prepare('DELETE FROM master_cv WHERE user_id = ?');
        const insertStmt = db.prepare('INSERT INTO master_cv (user_id, section_type, content, visible) VALUES (?, ?, ?, ?)');

        // Run transaction
        const runTransaction = db.transaction(() => {
            deleteStmt.run(userId);
            for (const s of sections) {
                const section_type = s.section_type || s.type;
                const content = s.content;
                const visible = s.visible === false ? 0 : 1;
                if (section_type && content) {
                    insertStmt.run(userId, section_type, content, visible);
                }
            }
        });

        runTransaction();

        res.json({ success: true, message: `Successfully imported ${sections.length} sections.` });
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

// CV Regenerate endpoint - Generate enhanced CV with proper template rendering
app.post('/api/cv/regenerate', express.json(), async (req, res) => {
    try {
        const { userId, industry } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        console.log(`[/api/cv/regenerate] Regenerating CV for ${userId} with industry: ${industry || 'default'}`);

        // Use cvRegenerator service to enhance CV
        const regeneratedCV = await cvRegeneratorService.regenerate(userId, industry);

        // Map RegeneratedCV to JSONResume format for template renderer
        const jsonResume = {
            basics: {
                name: regeneratedCV.personalInfo.fullName,
                email: regeneratedCV.personalInfo.email,
                phone: regeneratedCV.personalInfo.phone,
                summary: regeneratedCV.summary,
                location: regeneratedCV.personalInfo.location ? { city: regeneratedCV.personalInfo.location } : undefined,
                profiles: regeneratedCV.personalInfo.linkedin ? [{ network: 'LinkedIn', url: regeneratedCV.personalInfo.linkedin }] : []
            },
            work: regeneratedCV.experience.map(exp => ({
                name: exp.company,
                position: exp.role,
                startDate: exp.startDate,
                endDate: exp.endDate,
                highlights: exp.description
            })),
            education: regeneratedCV.education.map(edu => ({
                institution: edu.school,
                studyType: edu.degree.split(' in ')[0] || edu.degree,
                area: edu.degree.split(' in ')[1] || '',
                startDate: edu.startDate,
                endDate: edu.endDate,
                score: edu.gpa
            })),
            skills: regeneratedCV.skills.map(skill => ({
                name: skill.category,
                keywords: skill.items
            })),
            projects: regeneratedCV.projects?.map(proj => ({
                name: proj.name,
                description: proj.description,
                keywords: proj.technologies
            })) || []
        };

        // Use templateRenderer to render to HTML
        const { templateRenderer } = require('./services/templateRenderer');
        const htmlOutput = templateRenderer.renderToHTML(jsonResume as any, {
            templateId: 'gold-standard',
            highlightChanges: []
        });

        // Generate PDF
        const pdfBuffer = await templateRenderer.renderToPDF(jsonResume as any, {
            templateId: 'gold-standard'
        });

        // Save PDF to downloads folder
        const filename = templateRenderer.generateFilename(jsonResume as any);
        const filepath = await templateRenderer.savePDF(jsonResume as any, filename);

        res.json({
            success: true,
            cv: regeneratedCV,
            html: htmlOutput,
            pdfPath: filepath,
            pdfFilename: filename,
            improvements: regeneratedCV.improvements,
            enhancementScore: regeneratedCV.enhancementScore
        });

    } catch (error: any) {
        console.error('[/api/cv/regenerate] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to regenerate CV' 
        });
    }
});

// CV Summary endpoint
app.post('/api/cv/summary', express.json(), async (req, res) => {
    const { userId } = req.body;
    try {
        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
        
        if (entries.length === 0) {
            return res.json({ success: false, error: 'No CV data found for this user' });
        }

        // Extract key information from fast-parsed data
        const skills = entries.filter((e: any) => e.section_type === 'skill').map((e: any) => e.content);
        const experience = entries.filter((e: any) => 
            e.section_type === 'experience' || e.section_type === 'date' || e.section_type === 'unknown'
        ).map((e: any) => e.content);
        const education = entries.filter((e: any) => e.section_type === 'education').map((e: any) => e.content);
        const nameEntry = entries.find((e: any) => e.section_type === 'name');
        const name = nameEntry?.content || 'Professional';
        
        // OPTIMIZATION: Generate fast local summary first, then try LLM enhancement
        let overview = `${name} is a professional with expertise in ${skills.slice(0, 3).join(', ') || 'various skills'}. `;
        if (experience.length > 0) {
            overview += `Background includes ${experience.slice(0, 2).join(' and ').substring(0, 100)}.`;
        }
        
        // Try LLM enhancement with timeout (non-blocking)
        try {
            const llmPromise = cvAnalyzer.generateSummary(skills, experience);
            const timeoutPromise = new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('LLM timeout')), 3000)
            );
            const llmOverview = await Promise.race([llmPromise, timeoutPromise]);
            if (llmOverview && llmOverview.length > 20) {
                overview = llmOverview;
            }
        } catch (llmError) {
            console.log('[Summary] Using fast local summary (LLM unavailable/slow)');
        }
        
        res.json({
            success: true,
            summary: {
                overview: overview,
                keySkills: skills.slice(0, 10),
                experience: experience.slice(0, 5),
                education: education.slice(0, 3)
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
        
        // Fetch the latest compiled CV draft from cv_store to let the agent review the actual output structure
        const latestCV = db.prepare('SELECT cv_data FROM cv_store WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1').get(userId || 'default') as any;
        let draftContext = '';
        if (latestCV && latestCV.cv_data) {
            try {
                const parsed = JSON.parse(latestCV.cv_data);
                draftContext = `\n\nCURRENT COMPILED DRAFT (JSON RESUME):\n${JSON.stringify(parsed, null, 2)}`;
            } catch (e) {
                draftContext = `\n\nCURRENT COMPILED DRAFT (JSON RESUME):\n${latestCV.cv_data}`;
            }
        }

        const cvContext = (entries.map((e: any) => `${e.section_type}: ${e.content}`).join('\n') + draftContext).slice(0, 6000);
        
        // Use CVAnalyzer with 2025 Persona
        const response = await cvAnalyzer.chat(cvContext, message);
        
        // Format the response using messageFormatterService
        const formattedResponse = messageFormatterService.formatMessage(response);
        
        res.json({ success: true, response: formattedResponse });
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

// ============================================
// INDUSTRY MANAGEMENT ENDPOINTS
// ============================================

// List all industries (predefined + custom)
app.post('/api/industries/list', express.json(), async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        const industries = await industryManager.listIndustries(userId);
        res.json({ success: true, industries });
    } catch (error: any) {
        console.error('[/api/industries/list] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create custom industry
app.post('/api/industries/create', express.json(), async (req, res) => {
    try {
        const { userId, name, requiredSections, optionalSections, prioritySkills, powerWords, certifications, keywords, formatPreferences, outdatedPractices } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        const industry = await industryManager.createCustomIndustry(userId, {
            name,
            requiredSections,
            optionalSections,
            prioritySkills,
            powerWords,
            certifications,
            keywords,
            formatPreferences,
            outdatedPractices
        });

        res.json({ success: true, industry });
    } catch (error: any) {
        console.error('[/api/industries/create] Error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// Update custom industry
app.post('/api/industries/update/:industryId', express.json(), async (req, res) => {
    try {
        const { userId } = req.body;
        const { industryId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        const industry = await industryManager.updateCustomIndustry(userId, industryId, req.body);
        res.json({ success: true, industry });
    } catch (error: any) {
        console.error('[/api/industries/update] Error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// Delete custom industry
app.delete('/api/industries/:industryId', express.json(), async (req, res) => {
    try {
        const { userId } = req.body;
        const { industryId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }

        await industryManager.deleteCustomIndustry(userId, industryId);
        res.json({ success: true, message: 'Industry deleted' });
    } catch (error: any) {
        console.error('[/api/industries/delete] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// CV Tailoring endpoint
app.post('/api/cv/tailor', express.json(), async (req, res) => {
    const { userId, jobDescription } = req.body;
    try {
        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
        const skills = entries.filter((e: any) => e.section_type === 'skill').map((e: any) => e.content);
        
        // Generate tailored content using the new CVAnalyzer
        const [overview, experiences, education] = await Promise.all([
            cvAnalyzer.generateSummary(skills, []),
            cvAnalyzer.extractExperience(entries.map(e => e.content).join('\n')),
            cvAnalyzer.extractEducation(entries.map(e => e.content).join('\n'))
        ]);

        const cvContent = {
            summary: overview,
            skills: skills,
            experience: experiences,
            education: education,
            candidateName: 'Candidate' 
        };

        const pdfFilepath = await pdfGeneratorService.generateSimpleCVPDF(cvContent, cvContent.candidateName);
        const pdfFilename = path.basename(pdfFilepath);
        
        const changeLog = [
            { type: 'added' as const, item: 'Zachary Nelson Typography', reason: 'Modern high-impact aesthetic' },
            { type: 'modified' as const, item: 'Consensus 2.0 Summary', reason: 'Weighted voting from Guru Swarm' },
            { type: 'added' as const, item: 'ATS-Optimized PDF', reason: 'Puppeteer rendering for pixel-perfection' }
        ];
        
        res.json({
            success: true,
            result: {
                message: `Enhanced CV ready with Zachary Nelson style guide.`,
                pdfPath: `/api/pdf/download/${pdfFilename}`,
                changeLog
            }
        });
    } catch (error) {
        console.error('[/api/cv/tailor] Error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});

// New Direct Download Endpoint
app.get('/api/pdf/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '../../downloads', filename);
    
    if (fs.existsSync(filepath)) {
        res.download(filepath);
    } else {
        res.status(404).json({ success: false, error: 'File not found' });
    }
});

// Download PDF of Master CV Directly
app.get('/api/cv/master/:userId/download-pdf', async (req, res) => {
    const { userId } = req.params;
    try {
        const entries = db.prepare(
            'SELECT * FROM master_cv WHERE user_id = ? ORDER BY id'
        ).all(userId) as any[];

        if (entries.length === 0) {
            return res.status(404).json({ success: false, error: 'No Master CV data found for this user.' });
        }

        const visibleEntries = entries.filter(e => e.visible !== 0);

        const skills: string[] = [];
        const experience: string[] = [];
        const education: string[] = [];
        let name = 'Applicant Name';
        let email = 'user@example.com';
        let phone = '+1 555 123 4567';
        let location = 'City, Country';

        visibleEntries.forEach(entry => {
            const content = entry.content?.trim() || '';
            const type = (entry.section_type || '').toLowerCase();

            if (type.includes('name')) {
                name = content;
            } else if (type.includes('email')) {
                email = content;
            } else if (type.includes('phone')) {
                phone = content;
            } else if (type.includes('location')) {
                location = content;
            } else if (type.includes('skill')) {
                skills.push(content);
            } else if (type.includes('experience') || type.includes('work') || type.includes('job')) {
                experience.push(content);
            } else if (type.includes('education') || type.includes('degree')) {
                education.push(content);
            }
        });

        // Get professional summary
        const summaryEntry = visibleEntries.find(e => {
            const t = (e.section_type || '').toLowerCase();
            return t.includes('summary') || t.includes('objective');
        });
        const summary = summaryEntry ? summaryEntry.content : 'Full Stack Developer with a strong focus on building responsive and optimized applications.';

        const pdfContent = {
            candidateName: name,
            summary: summary,
            skills: skills,
            experience: experience,
            education: education,
            contact: { email, phone, location }
        };

        const pdfPath = await pdfGeneratorService.generateSimpleCVPDF(pdfContent, name);
        const filename = path.basename(pdfPath);
        const filepath = path.join(__dirname, '../../downloads', filename);

        if (fs.existsSync(filepath)) {
            res.download(filepath, `${name.replace(/\s+/g, '_')}_CV.pdf`, (err) => {
                try {
                    if (fs.existsSync(filepath)) {
                        fs.unlinkSync(filepath);
                    }
                } catch (unlinkErr) {
                    console.error('[PDF master download unlink error]:', unlinkErr);
                }
            });
        } else {
            res.status(404).json({ success: false, error: 'Failed to generate PDF' });
        }
    } catch (error) {
        console.error('[GET /api/cv/master/:userId/download-pdf] Error:', error);
        res.status(500).json({ success: false, error: String(error) });
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
app.get('/api/cv/tailored-list/:userId', (req, res) => {
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

// Generate PDF from regenerated CV data
app.post('/api/cv/download-pdf', express.json(), async (req, res) => {
    const { cvData } = req.body;
    try {
        if (!cvData) {
            return res.status(400).json({ success: false, error: 'No CV data provided' });
        }

        // Convert regenerated CV format to PDF generator format
        const pdfContent = {
            candidateName: cvData.personalInfo?.fullName || 'Candidate',
            summary: cvData.summary || 'Professional with diverse experience',
            skills: cvData.skills?.flatMap((s: any) => s.items) || [],
            experience: cvData.experience?.map((exp: any) => {
                const header = `${exp.role} at ${exp.company} | ${exp.startDate} - ${exp.endDate}`;
                const bullets = exp.description?.join('\n') || '';
                return `${header}\n${bullets}`;
            }) || [],
            education: cvData.education?.map((edu: any) => 
                `${edu.degree} - ${edu.school} (${edu.startDate} - ${edu.endDate})${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`
            ) || [],
            contact: {
                email: cvData.personalInfo?.email,
                phone: cvData.personalInfo?.phone,
                location: cvData.personalInfo?.location,
                linkedin: cvData.personalInfo?.linkedin
            }
        };

        const pdfPath = await pdfGeneratorService.generateSimpleCVPDF(pdfContent, pdfContent.candidateName);
        
        // Read the file and send as base64 for frontend download
        const pdfBuffer = fs.readFileSync(pdfPath);
        const base64Pdf = pdfBuffer.toString('base64');
        
        // Clean up the file after sending
        fs.unlinkSync(pdfPath);
        
        res.json({ 
            success: true, 
            pdf: base64Pdf,
            filename: `${pdfContent.candidateName.replace(/\s+/g, '_')}_CV.pdf`
        });
    } catch (error) {
        console.error('[PDF Download] Error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ============================================
// COVER LETTER GENERATION ENDPOINTS
// ============================================

// Generate cover letter based on user CV and job details
app.post('/api/cover-letter/generate', express.json(), async (req, res) => {
    const { userId, jobTitle, companyName, jobDescription, keyRequirements, tone } = req.body;
    try {
        if (!jobTitle || !companyName) {
            return res.status(400).json({ 
                success: false, 
                error: 'Job title and company name are required' 
            });
        }

        const result = await coverLetterGenerator.generateCoverLetter({
            userId: userId || 'default',
            jobTitle,
            companyName,
            jobDescription,
            keyRequirements,
            tone: tone || 'professional'
        });

        res.json({ 
            success: true, 
            coverLetter: result.coverLetter,
            wordCount: result.wordCount,
            matchedSkills: result.matchedSkills,
            suggestions: result.suggestions
        });
    } catch (error) {
        console.error('[Cover Letter] Error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Quick cover letter generation (minimal input)
app.post('/api/cover-letter/quick', express.json(), async (req, res) => {
    const { userId, jobTitle, companyName } = req.body;
    try {
        if (!jobTitle || !companyName) {
            return res.status(400).json({ 
                success: false, 
                error: 'Job title and company name are required' 
            });
        }

        const coverLetter = await coverLetterGenerator.quickGenerate(
            userId || 'default',
            jobTitle,
            companyName
        );

        res.json({ success: true, coverLetter });
    } catch (error) {
        console.error('[Quick Cover Letter] Error:', error);
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
        const jobPosting = jobParserService.getJobPosting(jobId);
        if (!jobPosting) return res.status(404).json({ success: false, error: 'Job not found' });
        const result = await coverLetterGenerator.generateCoverLetter({
            userId: userId || 'default',
            jobTitle: jobPosting.title,
            companyName: jobPosting.company,
            jobDescription: jobPosting.raw_text,
        });
        res.json({ success: true, coverLetter: result.coverLetter });
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
    const { keywords, userId } = req.body;
    try {
        const jobs = await jobAggregatorService.searchJobs({
            userId: userId || 'default',
            keywords: keywords ? (Array.isArray(keywords) ? keywords : keywords.split(',').map((k: string) => k.trim()).filter(Boolean)) : ['software engineer', 'developer'],
            remoteOnly: true,
            maxResults: 20,
        });
        res.json({ success: true, jobs, count: jobs.length });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

interface JobApplyResult {
    status: string;
    jobId: string;
    error?: string;
}

// Apply to selected jobs with CV
app.post('/api/jobs/apply-batch', express.json(), async (req, res) => {
    const { jobs, userId } = req.body;
    try {
        if (!jobs || jobs.length === 0) {
            return res.status(400).json({ success: false, error: 'No jobs selected' });
        }
        
        const applyJobs = jobs.map((j: any) => ({
            jobText: j.description || `${j.title || 'Job'} at ${j.company || 'Company'}`,
            jobUrl: j.url,
            title: j.title,
            company: j.company,
            recruiterEmail: j.recruiterEmail,
        }));

        const results = await massApplyService.addJobsToQueue(userId || 'default', applyJobs);
        
        res.json({ 
            success: true, 
            ...results,
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

// ============================================
// CV GENERATION SYSTEM ENDPOINTS
// ============================================

import { cvGenerator } from './services/cvGenerator';
import { changeHistoryManager } from './services/changeHistoryManager';
import { bulletEnhancer } from './services/bulletEnhancer';

// Generate/Regenerate CV from Master CV
app.post('/api/cv/generate', express.json(), async (req, res) => {
    const { userId, options } = req.body;
    try {
        const result = await cvGenerator.regenerate(userId || 'default', options || {});
        res.json({ 
            success: true, 
            cvId: result.changeId,
            cv: result.cv,
            html: result.html,
            qualityScore: result.qualityScore,
            suggestions: result.suggestions
        });
    } catch (error) {
        console.error('[/api/cv/generate] Error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Apply delta changes to CV
app.patch('/api/cv/:cvId', express.json(), async (req, res) => {
    const { cvId } = req.params;
    const { changes } = req.body;
    try {
        if (!changes || !Array.isArray(changes)) {
            return res.status(400).json({ success: false, error: 'Changes array is required' });
        }
        
        const result = await cvGenerator.applyMultipleDeltas(cvId, changes);
        res.json({
            success: true,
            cv: result.cv,
            html: result.html,
            qualityScore: result.qualityScore,
            suggestions: result.suggestions,
            changeId: result.changeId
        });
    } catch (error) {
        console.error('[PATCH /api/cv/:cvId] Error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get CV preview (HTML)
app.get('/api/cv/:cvId/preview', (req, res) => {
    const { cvId } = req.params;
    const { templateId } = req.query;
    try {
        const cv = cvGenerator.getCV(cvId);
        if (!cv) {
            return res.status(404).json({ success: false, error: 'CV not found' });
        }
        
        const html = cvGenerator.renderPreview(cv, templateId as string);
        res.json({ success: true, html });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Export CV as PDF
app.get('/api/cv/:cvId/export/pdf', async (req, res) => {
    const { cvId } = req.params;
    const { templateId } = req.query;
    try {
        const cv = cvGenerator.getCV(cvId);
        if (!cv) {
            return res.status(404).json({ success: false, error: 'CV not found' });
        }
        
        const pdfBuffer = await cvGenerator.exportToPDF(cvId, templateId as string);
        const filename = cvGenerator.generateFilename(cv);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('[/api/cv/:cvId/export/pdf] Error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Export CV as JSON Resume
app.get('/api/cv/:cvId/export/json', (req, res) => {
    const { cvId } = req.params;
    try {
        const cv = cvGenerator.exportToJSON(cvId);
        res.json({ success: true, cv });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Export CV as plain text
app.get('/api/cv/:cvId/export/text', (req, res) => {
    const { cvId } = req.params;
    try {
        const text = cvGenerator.exportToText(cvId);
        res.setHeader('Content-Type', 'text/plain');
        res.send(text);
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get CV change history
app.get('/api/cv/:cvId/history', (req, res) => {
    const { cvId } = req.params;
    const { limit } = req.query;
    try {
        const history = changeHistoryManager.getHistorySummary(cvId, parseInt(limit as string) || 10);
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Undo last change
app.post('/api/cv/:cvId/undo', (req, res) => {
    const { cvId } = req.params;
    try {
        const previousState = changeHistoryManager.undo(cvId);
        if (!previousState) {
            return res.status(400).json({ success: false, error: 'No changes to undo' });
        }
        
        // Update CV store
        const scoreResult = require('./services/qualityScorer').qualityScorer.calculateScore(previousState);
        cvGenerator.saveCV(cvId, previousState, scoreResult.score);
        
        res.json({ 
            success: true, 
            cv: previousState,
            qualityScore: scoreResult.score
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Restore to specific history entry
app.post('/api/cv/:cvId/restore/:historyId', (req, res) => {
    const { cvId, historyId } = req.params;
    try {
        const restoredState = changeHistoryManager.restore(cvId, historyId);
        if (!restoredState) {
            return res.status(400).json({ success: false, error: 'History entry not found' });
        }
        
        // Update CV store
        const scoreResult = require('./services/qualityScorer').qualityScorer.calculateScore(restoredState);
        cvGenerator.saveCV(cvId, restoredState, scoreResult.score);
        
        res.json({ 
            success: true, 
            cv: restoredState,
            qualityScore: scoreResult.score
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Enhance a single bullet point
app.post('/api/cv/enhance-bullet', express.json(), async (req, res) => {
    const { bullet, industry } = req.body;
    try {
        if (!bullet) {
            return res.status(400).json({ success: false, error: 'Bullet text is required' });
        }
        
        const result = await bulletEnhancer.enhanceBullet(bullet, industry);
        res.json({ 
            success: true, 
            original: result.original,
            enhanced: result.enhanced,
            changes: result.changes,
            metricsAdded: result.metricsAdded
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Enhance entire CV
app.post('/api/cv/:cvId/enhance', express.json(), async (req, res) => {
    const { cvId } = req.params;
    const { industry } = req.body;
    try {
        const cv = cvGenerator.getCV(cvId);
        if (!cv) {
            return res.status(404).json({ success: false, error: 'CV not found' });
        }
        
        // Re-generate with enhancement
        const result = await cvGenerator.regenerate(cv.meta?.canonical || 'default', {
            enhanceContent: true,
            targetIndustry: industry
        });
        
        res.json({
            success: true,
            cv: result.cv,
            html: result.html,
            qualityScore: result.qualityScore,
            suggestions: result.suggestions
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get CV by ID
app.get('/api/cv/store/:cvId', (req, res) => {
    const { cvId } = req.params;
    try {
        const cv = cvGenerator.getCV(cvId);
        if (!cv) {
            return res.status(404).json({ success: false, error: 'CV not found' });
        }
        res.json({ success: true, cv });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Get all CVs for user
app.get('/api/cv/store/user/:userId', (req, res) => {
    const { userId } = req.params;
    try {
        const cvs = cvGenerator.getUserCVs(userId);
        res.json({ success: true, cvs });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Delete CV
app.delete('/api/cv/store/:cvId', (req, res) => {
    const { cvId } = req.params;
    try {
        cvGenerator.deleteCV(cvId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Validate CV
app.post('/api/cv/validate', express.json(), (req, res) => {
    const { cv } = req.body;
    try {
        const result = cvGenerator.validate(cv);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 ResumAI Server running on http://localhost:${PORT}`);
    console.log(`🐝 Swarm Orchestrator initialized with 5 workers`);
    console.log(`📊 CV Intelligence Service loaded with ${powerWordsService.getStats().totalPowerWords} power words`);
    console.log(`🏢 Industry Profiles loaded: ${industryProfileService.getSupportedIndustries().join(', ')}`);
    
    // Log active LLM backend
    LLMFactory.getBackendName().then(name => {
        console.log(`🤖 LLM Backend: ${name}`);
    }).catch(err => {
        console.warn(`⚠️ LLM Backend failed to initialize: ${err.message}`);
    });
    
    // Start autonomous job hunting scheduler (runs every 30 minutes)
    try {
        resumAIAgentService.startAutonomousScheduler(30 * 60 * 1000);
    } catch (err) {
        console.error('⚠️ Failed to start autonomous agent scheduler:', err);
    }
    
    // Auto Job Hunter Scheduler - periodic market analysis
    setInterval(async () => {
        try {
            const users = db.prepare('SELECT DISTINCT user_id FROM scraped_jobs').all() as any[];
            for (const u of users) {
                try {
                    const jobs = jobAggregatorService.getUserScrapedJobs(u.user_id);
                    if (jobs.length > 0) {
                        await cvEvolutionEngine.analyzeJobMarket(u.user_id, jobs);
                    }
                } catch { /* per-user schedule skip */ }
            }
        } catch { /* scheduler skip */ }
    }, 1000 * 60 * 60 * 6); // Every 6 hours
    
    // Heartbeat
    setInterval(() => {}, 1000 * 60 * 60);
});
