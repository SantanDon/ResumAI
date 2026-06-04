/**
 * CV Generation Routes
 * Handles Master CV, Mini CV, and Cover Letter generation
 */

import { Router, Request, Response } from 'express';
import { masterMiniCVGenerator } from '../services/masterMiniCVGenerator';
import { coverLetterGenerator } from '../services/coverLetterGenerator';
import { cvGenerationLimiter, coverLetterLimiter } from '../middleware/rateLimiter';
import { 
    validate, 
    cvGenerationRequestSchema, 
    coverLetterRequestSchema,
    jobDescriptionSchema 
} from '../validation';

const router = Router();

// ============================================
// GENERATE TAILORED CVs (Master + Mini + Cover Letter)
// ============================================
router.post('/generate-tailored', cvGenerationLimiter, async (req: Request, res: Response) => {
    try {
        // Validate request
        const validationResult = validate(cvGenerationRequestSchema, req.body);
        if (!validationResult.success) {
            return res.status(400).json({ 
                success: false, 
                error: validationResult.error,
                errors: validationResult.errors
            });
        }

        const { userId, jobDescription, cvType } = validationResult.data!;

        console.log(`[/api/cv/generate-tailored] Generating for ${userId} - ${jobDescription.jobTitle}`);

        // Generate CVs
        const result = await masterMiniCVGenerator.generateTailoredCVs(userId, {
            jobTitle: jobDescription.jobTitle,
            company: jobDescription.company,
            description: jobDescription.description
        });

        res.json({
            success: true,
            generationId: result.generationId,
            matchScore: result.matchScore,
            analysis: result.analysis,
            masterCV: result.masterCV,
            miniCV: result.miniCV,
            coverLetter: result.coverLetter
        });

    } catch (error: any) {
        console.error('[/api/cv/generate-tailored] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to generate CVs' 
        });
    }
});

// ============================================
// ANALYZE JOB-CV MATCH
// ============================================
router.post('/analyze-match', cvGenerationLimiter, async (req: Request, res: Response) => {
    try {
        const validationResult = validate(jobDescriptionSchema, req.body.jobDescription);
        if (!validationResult.success) {
            return res.status(400).json({ success: false, error: validationResult.error });
        }

        const userId = req.body.userId || 'default';
        const job = validationResult.data!;

        // Get user's CV data
        const cvData = masterMiniCVGenerator.getUserCVData(userId);
        
        if (!cvData.skills.length && !cvData.experience.length) {
            return res.status(400).json({ 
                success: false, 
                error: 'No CV data found. Please upload your CV first.' 
            });
        }

        // For now, return a simple analysis
        // The full analysis happens in generateTailoredCVs
        const matchedSkills = cvData.skills.filter((skill: string) => 
            job.description.toLowerCase().includes(skill.toLowerCase())
        );

        const matchScore = Math.min(95, Math.round((matchedSkills.length / Math.max(cvData.skills.length, 1)) * 100) + 20);

        res.json({
            success: true,
            matchScore,
            matchedSkills,
            totalSkills: cvData.skills.length,
            hasExperience: cvData.experience.length > 0,
            hasEducation: cvData.education.length > 0
        });

    } catch (error: any) {
        console.error('[/api/cv/analyze-match] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GENERATE COVER LETTER ONLY
// ============================================
router.post('/cover-letter', coverLetterLimiter, async (req: Request, res: Response) => {
    try {
        const validationResult = validate(coverLetterRequestSchema, req.body);
        if (!validationResult.success) {
            return res.status(400).json({ 
                success: false, 
                error: validationResult.error 
            });
        }

        const { userId, jobTitle, company, jobDescription, tone } = validationResult.data!;

        console.log(`[/api/cv/cover-letter] Generating for ${userId} - ${jobTitle} at ${company}`);

        const result = await coverLetterGenerator.generateCoverLetter({
            userId,
            jobTitle,
            companyName: company,
            jobDescription,
            tone
        });

        res.json({
            success: true,
            coverLetter: result.coverLetter,
            wordCount: result.wordCount,
            matchedSkills: result.matchedSkills,
            suggestions: result.suggestions
        });

    } catch (error: any) {
        console.error('[/api/cv/cover-letter] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET GENERATION HISTORY
// ============================================
router.get('/generated/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit as string) || 10;

        const history = masterMiniCVGenerator.getGenerationHistory(userId, limit);

        res.json({
            success: true,
            count: history.length,
            generations: history.map(g => ({
                id: g.id,
                jobTitle: g.job_title,
                company: g.company,
                matchScore: g.match_score,
                createdAt: g.created_at
            }))
        });

    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET SPECIFIC GENERATION
// ============================================
router.get('/generated/detail/:generationId', async (req: Request, res: Response) => {
    try {
        const { generationId } = req.params;

        const generation = masterMiniCVGenerator.getGeneration(generationId);

        if (!generation) {
            return res.status(404).json({ 
                success: false, 
                error: 'Generation not found' 
            });
        }

        res.json({
            success: true,
            generation: {
                id: generation.id,
                jobTitle: generation.job_title,
                company: generation.company,
                matchScore: generation.match_score,
                masterCV: generation.masterCV,
                miniCV: generation.miniCV,
                coverLetter: generation.cover_letter,
                analysis: generation.analysis,
                createdAt: generation.created_at
            }
        });

    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
