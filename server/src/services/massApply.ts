import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { jobParserService } from './jobParserService';
import { cvTailorService } from './cvTailorService';
import { coverLetterGeneratorService } from './coverLetterGeneratorService';
import { emailService } from './emailService';
import { humanVerificationDetector, AutomationAssessment } from './humanVerificationDetector';
import { exportAssetsToDesktop } from './desktopExporter';

interface ApplyJobInput {
  jobText: string;
  jobUrl?: string;
  title?: string;
  company?: string;
  recruiterEmail?: string;
}

interface ApplyResult {
  jobQueueId: string;
  status: 'queued' | 'processing' | 'completed' | 'needs_review' | 'error';
  automationAssessment?: AutomationAssessment;
  error?: string;
}

interface BatchApplyResult {
  total: number;
  queued: number;
  skipped: number;
  needsReview: number;
  errors: number;
  results: ApplyResult[];
}

class MassApplyService {
  async addJobToQueue(userId: string, jobInput: ApplyJobInput): Promise<ApplyResult> {
    try {
      const assessment = await humanVerificationDetector.assessJobAutomation(jobInput.jobText, jobInput.jobUrl);

      const id = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO job_queue (id, user_id, job_description, job_url, company, title, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id, userId, jobInput.jobText.slice(0, 5000),
        jobInput.jobUrl || null,
        jobInput.company || null,
        jobInput.title || null,
        assessment.recommendedApproach === 'manual' ? 'pending' : 'pending'
      );

      return {
        jobQueueId: id,
        status: assessment.recommendedApproach === 'manual' ? 'needs_review' : 'queued',
        automationAssessment: assessment,
      };
    } catch (err) {
      return {
        jobQueueId: '',
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async addJobsToQueue(userId: string, jobs: ApplyJobInput[]): Promise<BatchApplyResult> {
    const results: ApplyResult[] = [];
    let queued = 0, skipped = 0, needsReview = 0, errors = 0;

    for (const job of jobs) {
      const result = await this.addJobToQueue(userId, job);
      results.push(result);
      switch (result.status) {
        case 'queued': queued++; break;
        case 'needs_review': needsReview++; break;
        case 'error': errors++; break;
        default: skipped++;
      }
    }

    return { total: jobs.length, queued, skipped, needsReview, errors, results };
  }

  async processSingleApplication(userId: string, queueId: string): Promise<ApplyResult> {
    try {
      const queueItem = db.prepare('SELECT * FROM job_queue WHERE id = ? AND user_id = ?').get(queueId, userId) as any;
      if (!queueItem) return { jobQueueId: queueId, status: 'error', error: 'Queue item not found' };

      db.prepare('UPDATE job_queue SET status = ? WHERE id = ?').run('processing', queueId);

      const assessment = await humanVerificationDetector.assessJobAutomation(queueItem.job_description, queueItem.job_url);

      if (assessment.recommendedApproach === 'manual') {
        db.prepare('UPDATE job_queue SET status = ?, error_message = ? WHERE id = ?')
          .run('pending', 'Manual review required - cannot fully automate', queueId);
        return { jobQueueId: queueId, status: 'needs_review', automationAssessment: assessment };
      }

      const parsedJob = await jobParserService.saveJobPosting(userId, queueItem.job_description);

      const tailorResult = await cvTailorService.tailorCVForJob(userId, parsedJob);

      const jobPosting = jobParserService.getJobPosting(parsedJob);

      const coverResult = await coverLetterGeneratorService.generateCoverLetter({
        userId,
        jobTitle: jobPosting.title,
        companyName: jobPosting.company,
        jobDescription: queueItem.job_description,
      });

      // Save cover letter to database and get the valid ID
      const savedCoverLetterId = coverLetterGeneratorService.saveCoverLetter(
        userId,
        parsedJob,
        coverResult.coverLetter,
        'professional',
        85
      );

      // Export tailored CV and Cover Letter to desktop folder
      await exportAssetsToDesktop(
        jobPosting.company,
        jobPosting.title,
        tailorResult.tailoredCV,
        coverResult.coverLetter
      );

      const email = jobPosting.recruiterEmail || queueItem.job_description.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)?.[0];

      if (email) {
        const cvEntries = db.prepare('SELECT * FROM master_cv WHERE user_id = ? AND section_type = ?').all(userId, 'name') as any[];
        const candidateName = cvEntries.length > 0 ? cvEntries[0].content : 'Candidate';

        const emailResult = await emailService.sendApplicationEmail(
          userId, email, candidateName, jobPosting.title,
          jobPosting.company, coverResult.coverLetter
        );

        if (emailResult.success) {
          const applicationId = uuidv4();
          db.prepare(`
            INSERT INTO applications (id, user_id, job_posting_id, tailored_cv_id, cover_letter_id, email_sent, recruiter_email, status, sent_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(applicationId, userId, parsedJob, tailorResult.tailoredCVId, savedCoverLetterId, 1, email, 'sent', new Date().toISOString());
        }
      }

      db.prepare('UPDATE job_queue SET status = ?, processed_at = ? WHERE id = ?')
        .run('completed', new Date().toISOString(), queueId);

      return { jobQueueId: queueId, status: 'completed', automationAssessment: assessment };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      db.prepare('UPDATE job_queue SET status = ?, error_message = ? WHERE id = ?').run('error', errorMsg, queueId);
      return { jobQueueId: queueId, status: 'error', error: errorMsg };
    }
  }

  async processApplications(userId: string, maxConcurrent: number = 3): Promise<{ processed: number; results: ApplyResult[] }> {
    const pending = db.prepare(
      'SELECT * FROM job_queue WHERE user_id = ? AND status = ? ORDER BY created_at ASC LIMIT ?'
    ).all(userId, 'pending', maxConcurrent) as any[];

    if (pending.length === 0) return { processed: 0, results: [] };

    const results: ApplyResult[] = [];
    for (const item of pending) {
      const result = await this.processSingleApplication(userId, item.id);
      results.push(result);
    }

    return { processed: results.length, results };
  }

  getApplicationStats(userId: string): { total: number; pending: number; processing: number; completed: number; needsReview: number; error: number } {
    try {
      const stats = db.prepare(`
        SELECT status, COUNT(*) as count FROM job_queue WHERE user_id = ? GROUP BY status
      `).all(userId) as any[];
      const map: Record<string, number> = { total: 0, pending: 0, processing: 0, completed: 0, needsReview: 0, error: 0 };
      stats.forEach((s: any) => { map[s.status] = s.count; map.total += s.count; });
      return map as any;
    } catch { return { total: 0, pending: 0, processing: 0, completed: 0, needsReview: 0, error: 0 }; }
  }

  parseJobListings(text: string): ApplyJobInput[] {
    const jobs: ApplyJobInput[] = [];
    const blocks = text.split(/(?=\n#|\n---|\d+\.\s)/).filter(b => b.trim().length > 50);

    for (const block of blocks) {
      const titleMatch = block.match(/(?:title|position|role):\s*([^\n]+)/i);
      const companyMatch = block.match(/(?:company|employer|org):\s*([^\n]+)/i);
      const emailMatch = block.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
      const urlMatch = block.match(/https?:\/\/[^\s\n]+/);

      jobs.push({
        jobText: block.trim().slice(0, 5000),
        title: titleMatch?.[1]?.trim(),
        company: companyMatch?.[1]?.trim(),
        recruiterEmail: emailMatch?.[1],
        jobUrl: urlMatch?.[0],
      });
    }

    return jobs;
  }
}

export const massApplyService = new MassApplyService();
export default massApplyService;
