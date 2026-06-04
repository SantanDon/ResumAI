/**
 * Job Assistant Routes
 * API endpoints for the Personal Job Application Assistant
 */

import express from 'express';
import { jobParserService } from '../services/jobParserService';
import { projectsService } from '../services/projectsService';
import { cvTailorService } from '../services/cvTailorService';
import { coverLetterGeneratorService } from '../services/coverLetterGeneratorService';
import { emailService } from '../services/emailService';
import { exportAssetsToDesktop } from '../services/desktopExporter';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ============================================
// JOB POSTING ENDPOINTS
// ============================================

/**
 * POST /api/jobs/parse
 * Parse job posting text and extract structured data
 */
router.post('/parse', express.json(), async (req, res) => {
  try {
    const { userId, jobText } = req.body;

    if (!userId || !jobText) {
      return res.status(400).json({
        success: false,
        error: 'userId and jobText are required'
      });
    }

    // Parse and save job posting
    const jobPostingId = await jobParserService.saveJobPosting(userId, jobText);
    const jobPosting = jobParserService.getJobPosting(jobPostingId);

    res.json({
      success: true,
      jobPostingId,
      jobPosting
    });
  } catch (error) {
    console.error('[POST /api/jobs/parse] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse job posting'
    });
  }
});

/**
 * GET /api/jobs/:jobPostingId
 * Get job posting details
 */
router.get('/:jobPostingId', (req, res) => {
  try {
    const { jobPostingId } = req.params;
    const jobPosting = jobParserService.getJobPosting(jobPostingId);

    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        error: 'Job posting not found'
      });
    }

    res.json({
      success: true,
      jobPosting
    });
  } catch (error) {
    console.error('[GET /api/jobs/:jobPostingId] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job posting'
    });
  }
});

/**
 * GET /api/jobs/user/:userId
 * Get all job postings for user
 */
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const jobPostings = jobParserService.getUserJobPostings(userId);

    res.json({
      success: true,
      jobPostings,
      count: jobPostings.length
    });
  } catch (error) {
    console.error('[GET /api/jobs/user/:userId] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job postings'
    });
  }
});

/**
 * DELETE /api/jobs/:jobPostingId
 * Delete job posting
 */
router.delete('/:jobPostingId', (req, res) => {
  try {
    const { jobPostingId } = req.params;
    const deleted = jobParserService.deleteJobPosting(jobPostingId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Job posting not found'
      });
    }

    res.json({
      success: true,
      message: 'Job posting deleted'
    });
  } catch (error) {
    console.error('[DELETE /api/jobs/:jobPostingId] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete job posting'
    });
  }
});

// ============================================
// PROJECTS ENDPOINTS
// ============================================

/**
 * POST /api/projects
 * Add a new project
 */
router.post('/projects', express.json(), (req, res) => {
  try {
    const { userId, name, description, technologies, url, highlights } = req.body;

    if (!userId || !name || !description || !technologies) {
      return res.status(400).json({
        success: false,
        error: 'userId, name, description, and technologies are required'
      });
    }

    const projectId = projectsService.addProject(userId, {
      name,
      description,
      technologies,
      url,
      highlights
    });

    res.json({
      success: true,
      projectId,
      project: projectsService.getProject(projectId)
    });
  } catch (error) {
    console.error('[POST /api/projects] Error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add project'
    });
  }
});

/**
 * GET /api/projects/user/:userId
 * Get all projects for user
 */
router.get('/projects/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const projects = projectsService.getUserProjects(userId);

    res.json({
      success: true,
      projects,
      count: projects.length
    });
  } catch (error) {
    console.error('[GET /api/projects/user/:userId] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get projects'
    });
  }
});

/**
 * GET /api/projects/:projectId
 * Get project details
 */
router.get('/projects/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const project = projectsService.getProject(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('[GET /api/projects/:projectId] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project'
    });
  }
});

/**
 * PUT /api/projects/:projectId
 * Update project
 */
router.put('/projects/:projectId', express.json(), (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, technologies, url, highlights } = req.body;

    const updated = projectsService.updateProject(projectId, {
      name,
      description,
      technologies,
      url,
      highlights
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      project: projectsService.getProject(projectId)
    });
  } catch (error) {
    console.error('[PUT /api/projects/:projectId] Error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project'
    });
  }
});

/**
 * DELETE /api/projects/:projectId
 * Delete project
 */
router.delete('/projects/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const deleted = projectsService.deleteProject(projectId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted'
    });
  } catch (error) {
    console.error('[DELETE /api/projects/:projectId] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project'
    });
  }
});

// ============================================
// CV TAILORING ENDPOINTS
// ============================================

/**
 * POST /api/cv/tailor-for-job
 * Tailor CV for a specific job posting
 */
router.post('/cv/tailor-for-job', express.json(), async (req, res) => {
  try {
    const { userId, jobPostingId } = req.body;

    if (!userId || !jobPostingId) {
      return res.status(400).json({
        success: false,
        error: 'userId and jobPostingId are required'
      });
    }

    const result = await cvTailorService.tailorCVForJob(userId, jobPostingId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[POST /api/cv/tailor-for-job] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to tailor CV'
    });
  }
});

/**
 * GET /api/cv/tailored/:tailoredCVId
 * Get tailored CV details
 */
router.get('/cv/tailored/:tailoredCVId', (req, res) => {
  try {
    const { tailoredCVId } = req.params;
    const tailoredCV = cvTailorService.getTailoredCV(tailoredCVId);

    if (!tailoredCV) {
      return res.status(404).json({
        success: false,
        error: 'Tailored CV not found'
      });
    }

    res.json({
      success: true,
      tailoredCV
    });
  } catch (error) {
    console.error('[GET /api/cv/tailored/:tailoredCVId] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tailored CV'
    });
  }
});

/**
 * GET /api/cv/tailored/user/:userId
 * Get all tailored CVs for user
 */
router.get('/cv/tailored/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const tailoredCVs = cvTailorService.getUserTailoredCVs(userId);

    res.json({
      success: true,
      tailoredCVs,
      count: tailoredCVs.length
    });
  } catch (error) {
    console.error('[GET /api/cv/tailored/user/:userId] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tailored CVs'
    });
  }
});

/**
 * DELETE /api/cv/tailored/:tailoredCVId
 * Delete tailored CV
 */
router.delete('/cv/tailored/:tailoredCVId', (req, res) => {
  try {
    const { tailoredCVId } = req.params;
    const deleted = cvTailorService.deleteTailoredCV(tailoredCVId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Tailored CV not found'
      });
    }

    res.json({
      success: true,
      message: 'Tailored CV deleted'
    });
  } catch (error) {
    console.error('[DELETE /api/cv/tailored/:tailoredCVId] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete tailored CV'
    });
  }
});

// ============================================
// COVER LETTER ENDPOINTS
// ============================================

/**
 * POST /api/cover-letter/generate
 * Generate cover letter for a job
 */
router.post('/cover-letter/generate', express.json(), async (req, res) => {
  try {
    const { userId, jobTitle, companyName, jobDescription, keyRequirements, tone } = req.body;

    if (!userId || !jobTitle || !companyName) {
      return res.status(400).json({
        success: false,
        error: 'userId, jobTitle, and companyName are required'
      });
    }

    const result = await coverLetterGeneratorService.generateCoverLetter({
      userId,
      jobTitle,
      companyName,
      jobDescription,
      keyRequirements,
      tone
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[POST /api/cover-letter/generate] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate cover letter'
    });
  }
});

/**
 * POST /api/cover-letter/quick
 * Quick cover letter generation
 */
router.post('/cover-letter/quick', express.json(), async (req, res) => {
  try {
    const { userId, jobTitle, companyName } = req.body;

    if (!userId || !jobTitle || !companyName) {
      return res.status(400).json({
        success: false,
        error: 'userId, jobTitle, and companyName are required'
      });
    }

    const coverLetter = await coverLetterGeneratorService.quickGenerate(userId, jobTitle, companyName);

    res.json({
      success: true,
      coverLetter
    });
  } catch (error) {
    console.error('[POST /api/cover-letter/quick] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate cover letter'
    });
  }
});

// ============================================
// APPLICATION ENDPOINTS
// ============================================

/**
 * POST /api/applications/send
 * Send application with CV and cover letter
 */
router.post('/applications/send', express.json(), async (req, res) => {
  try {
    const { userId, jobPostingId, tailoredCVId, coverLetterId, recruiterEmail } = req.body;

    if (!userId || !jobPostingId || !recruiterEmail) {
      return res.status(400).json({
        success: false,
        error: 'userId, jobPostingId, and recruiterEmail are required'
      });
    }

    // Get job posting
    const jobPosting = jobParserService.getJobPosting(jobPostingId);
    if (!jobPosting) {
      return res.status(404).json({
        success: false,
        error: 'Job posting not found'
      });
    }

    // Get cover letter if provided
    let coverLetterContent = '';
    if (coverLetterId) {
      const coverLetter = coverLetterGeneratorService.getCoverLetter(coverLetterId);
      if (coverLetter) {
        coverLetterContent = coverLetter.content;
      }
    }

    // Get user name from CV
    const cvEntries = db.prepare(
      'SELECT * FROM master_cv WHERE user_id = ? AND section_type = ?'
    ).all(userId, 'name') as any[];
    const candidateName = cvEntries.length > 0 ? cvEntries[0].content : 'Candidate';

    // Send email
    const emailResult = await emailService.sendApplicationEmail(
      userId,
      recruiterEmail,
      candidateName,
      jobPosting.title,
      jobPosting.company,
      coverLetterContent
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: emailResult.error
      });
    }

    // Export CV and Cover Letter to desktop folder if present
    let tailoredCVData = null;
    if (tailoredCVId) {
      const tailoredCV = cvTailorService.getTailoredCV(tailoredCVId);
      if (tailoredCV) {
        tailoredCVData = tailoredCV.cvData;
      }
    }

    await exportAssetsToDesktop(
      jobPosting.company,
      jobPosting.title,
      tailoredCVData,
      coverLetterContent
    );

    // Create application record
    const applicationId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO applications (
        id, user_id, job_posting_id, tailored_cv_id, cover_letter_id,
        email_sent, recruiter_email, status, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      applicationId,
      userId,
      jobPostingId,
      tailoredCVId || null,
      coverLetterId || null,
      1,
      recruiterEmail,
      'sent',
      new Date().toISOString()
    );

    res.json({
      success: true,
      applicationId,
      message: 'Application sent successfully'
    });
  } catch (error) {
    console.error('[POST /api/applications/send] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send application'
    });
  }
});

/**
 * GET /api/applications/user/:userId
 * Get all applications for user
 */
router.get('/applications/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const stmt = db.prepare(
      'SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC'
    );
    const applications = stmt.all(userId) as any[];

    res.json({
      success: true,
      applications,
      count: applications.length
    });
  } catch (error) {
    console.error('[GET /api/applications/user/:userId] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get applications'
    });
  }
});

/**
 * GET /api/applications/:applicationId
 * Get application details
 */
router.get('/applications/:applicationId', (req, res) => {
  try {
    const { applicationId } = req.params;
    const stmt = db.prepare('SELECT * FROM applications WHERE id = ?');
    const application = stmt.get(applicationId) as any;

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('[GET /api/applications/:applicationId] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get application'
    });
  }
});

/**
 * PUT /api/applications/:applicationId/status
 * Update application status
 */
router.put('/applications/:applicationId/status', express.json(), (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'status is required'
      });
    }

    const stmt = db.prepare('UPDATE applications SET status = ? WHERE id = ?');
    const result = stmt.run(status, applicationId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application status updated'
    });
  } catch (error) {
    console.error('[PUT /api/applications/:applicationId/status] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update application'
    });
  }
});

export default router;
