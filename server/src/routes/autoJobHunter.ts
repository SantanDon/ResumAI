import express from 'express';
import { jobAggregatorService } from '../services/jobAggregator';
import { massApplyService } from '../services/massApply';
import { remoteJobScoutService } from '../services/remoteJobScout';
import { cvEvolutionEngine } from '../services/cvEvolutionEngine';
import { humanVerificationDetector } from '../services/humanVerificationDetector';
import { resumAIAgentService } from '../services/agentService';
import { slackService } from '../services/slackService';
import { db } from '../db';

const router = express.Router();

router.post('/scout/slack', express.json(), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const result = await slackService.scoutSlack(userId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// JOB SCOUTING ENDPOINTS
// ============================================

router.post('/scout/search', express.json(), async (req, res) => {
  try {
    const { userId, keywords, remoteOnly, maxResults } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const results = await remoteJobScoutService.scoutJobs(userId, { keywords, remoteOnly, maxResults });
    res.json({ success: true, count: results.length, results });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/scout/jobs/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    const jobs = jobAggregatorService.getUserScrapedJobs(userId, status as string | undefined);
    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.put('/scout/jobs/:jobId/status', express.json(), (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, matchScore } = req.body;
    jobAggregatorService.updateJobStatus(jobId, status, matchScore);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Scout settings
router.get('/scout/settings/:userId', (req, res) => {
  try {
    const settings = remoteJobScoutService.getScoutSettings(req.params.userId);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.put('/scout/settings/:userId', express.json(), (req, res) => {
  try {
    remoteJobScoutService.updateScoutSettings(req.params.userId, req.body);
    const settings = remoteJobScoutService.getScoutSettings(req.params.userId);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AUTO APPLY ENDPOINTS
// ============================================

router.post('/apply/queue', express.json(), async (req, res) => {
  try {
    const { userId, jobs } = req.body;
    if (!userId || !jobs) return res.status(400).json({ success: false, error: 'userId and jobs required' });

    const results = await massApplyService.addJobsToQueue(userId, jobs);
    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/apply/process', express.json(), async (req, res) => {
  try {
    const { userId, maxConcurrent } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const results = await massApplyService.processApplications(userId, maxConcurrent);
    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/apply/single', express.json(), async (req, res) => {
  try {
    const { userId, queueId } = req.body;
    if (!userId || !queueId) return res.status(400).json({ success: false, error: 'userId and queueId required' });

    const result = await massApplyService.processSingleApplication(userId, queueId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/apply/stats/:userId', (req, res) => {
  try {
    const stats = massApplyService.getApplicationStats(req.params.userId);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/apply/parse-listings', express.json(), (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'text required' });
    const jobs = massApplyService.parseJobListings(text);
    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Assess automation potential
router.post('/apply/assess', express.json(), async (req, res) => {
  try {
    const { jobText, jobUrl } = req.body;
    if (!jobText) return res.status(400).json({ success: false, error: 'jobText required' });
    const assessment = await humanVerificationDetector.assessJobAutomation(jobText, jobUrl);
    res.json({ success: true, assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// CV EVOLUTION ENDPOINTS
// ============================================

router.post('/evolution/analyze-market', express.json(), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const jobs = jobAggregatorService.getUserScrapedJobs(userId);
    const trends = await cvEvolutionEngine.analyzeJobMarket(userId, jobs);
    res.json({ success: true, trends });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/evolution/suggest', express.json(), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const suggestions = await cvEvolutionEngine.suggestImprovements(userId);
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/evolution/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    const history = cvEvolutionEngine.getEvolutionHistory(userId, Number(limit) || 20);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/evolution/skill-gaps/:userId', async (req, res) => {
  try {
    const gaps = await cvEvolutionEngine.getSkillGapAnalysis(req.params.userId);
    res.json({ success: true, gaps });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/evolution/record', express.json(), (req, res) => {
  try {
    const { userId, cvVersion, changeType, section, oldContent, newContent, matchScoreBefore, matchScoreAfter } = req.body;
    if (!userId || !cvVersion || !changeType) return res.status(400).json({ success: false, error: 'Required fields missing' });
    cvEvolutionEngine.recordEvolution(userId, cvVersion, changeType, section || null, oldContent || null, newContent || null, matchScoreBefore, matchScoreAfter);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/agent/run', express.json(), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const report = await resumAIAgentService.runAgentWorkflow(userId);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/agent/run-custom', express.json(), async (req, res) => {
  try {
    const { userId, description, title, company, url, recruiterEmail } = req.body;
    if (!userId || !description) {
      return res.status(400).json({ success: false, error: 'userId and description required' });
    }

    const report = await resumAIAgentService.runCustomAgentWorkflow(userId, {
      description,
      title,
      company,
      url,
      recruiterEmail
    });
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Apply CV bullet enhancements directly to the master CV and evolution history
router.post('/evolution/apply-enhancement', express.json(), (req, res) => {
  try {
    const { userId, originalBullet, improvedBullet, expectedImpact } = req.body;
    if (!userId || !originalBullet || !improvedBullet) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Find the master_cv entry for the user matching the original bullet (with trimming and partial check)
    const entry = db.prepare('SELECT id, section_type FROM master_cv WHERE user_id = ? AND (TRIM(content) = TRIM(?) OR content LIKE ?)')
      .get(userId, originalBullet, `%${originalBullet.trim().slice(0, 40)}%`) as { id: number; section_type: string } | undefined;

    if (entry) {
      // Update Master CV bullet
      db.prepare('UPDATE master_cv SET content = ? WHERE id = ?').run(improvedBullet, entry.id);

      // Record in evolution log
      cvEvolutionEngine.recordEvolution(
        userId,
        'v_evolving',
        'enhance_bullet',
        entry.section_type || 'experience',
        originalBullet,
        improvedBullet,
        80, // Approximate base score before
        Math.min(100, 80 + (expectedImpact || 10)) // After score estimation
      );

      res.json({ success: true, message: 'CV experience bullet updated successfully.' });
    } else {
      res.status(404).json({ success: false, error: 'Original experience bullet not found in Master CV.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Diagnostic endpoint for developer agents to query the state and health of the job hunter
router.get('/agent/diagnose/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const settings = remoteJobScoutService.getScoutSettings(userId);
    
    // Get stats from database
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM scraped_jobs WHERE user_id = ?').get(userId) as any;
    const slackJobs = db.prepare("SELECT COUNT(*) as count FROM scraped_jobs WHERE user_id = ? AND source = 'slack'").get(userId) as any;
    const avgFitScore = db.prepare('SELECT AVG(match_score) as avg FROM scraped_jobs WHERE user_id = ? AND match_score IS NOT NULL').get(userId) as any;
    
    const appStats = massApplyService.getApplicationStats(userId);
    const evolutionLogs = cvEvolutionEngine.getEvolutionHistory(userId, 5);

    res.json({
      success: true,
      diagnostics: {
        timestamp: new Date().toISOString(),
        settings: {
          targetRole: settings.targetRole,
          preferredTone: settings.preferredTone,
          automationPriority: settings.automationPriority,
          autoApplyEnabled: settings.autoApply,
          requireHumanReview: settings.requireHumanReview
        },
        pipeline: {
          scrapedJobsCount: totalJobs?.count || 0,
          slackSourcedCount: slackJobs?.count || 0,
          averageFitScore: Math.round(avgFitScore?.avg || 0),
          applicationsQueue: appStats
        },
        latestEvolution: evolutionLogs,
        systemCapabilities: {
          consensusEngineSize: 5,
          activeLLMBackend: "Ollama (llama3.2:1b)",
          directApplyEnabled: true,
          puppeteerStealth: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
