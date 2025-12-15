/**
 * Job Queue Manager Service
 * Manages batch job applications and CV generation queue
 * Requirements: 6.1, 6.2, 6.3, 6.5, 6.7
 */

import { db } from '../db';
import { tailoredCVGeneratorService } from './tailoredCVGenerator';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ApplicationStatus = 'draft' | 'ready' | 'sent' | 'rejected' | 'interview';

export interface QueuedJob {
    id: string;
    userId: string;
    jobTitle: string;
    company: string;
    jobDescription: string;
    jobUrl?: string;
    status: JobStatus;
    applicationStatus: ApplicationStatus;
    tailoredCvId?: string;
    matchScore?: number;
    createdAt: string;
    updatedAt: string;
    processedAt?: string;
    error?: string;
}

export interface QueueStatus {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    jobs: QueuedJob[];
}

export interface BatchProcessResult {
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
        jobId: string;
        success: boolean;
        tailoredCvId?: string;
        matchScore?: number;
        error?: string;
    }>;
}

class JobQueueManager {
    /**
     * Add a job to the queue
     */
    addJob(userId: string, jobData: {
        jobTitle: string;
        company: string;
        jobDescription: string;
        jobUrl?: string;
    }): QueuedJob {
        const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const stmt = db.prepare(`
            INSERT INTO job_queue (id, user_id, job_title, company, job_description, job_url, status, application_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            userId,
            jobData.jobTitle,
            jobData.company,
            jobData.jobDescription,
            jobData.jobUrl || null,
            'pending',
            'draft',
            now,
            now
        );

        return {
            id,
            userId,
            jobTitle: jobData.jobTitle,
            company: jobData.company,
            jobDescription: jobData.jobDescription,
            jobUrl: jobData.jobUrl,
            status: 'pending',
            applicationStatus: 'draft',
            createdAt: now,
            updatedAt: now
        };
    }

    /**
     * Remove a job from the queue
     */
    removeJob(jobId: string): boolean {
        const result = db.prepare('DELETE FROM job_queue WHERE id = ?').run(jobId);
        return result.changes > 0;
    }

    /**
     * Get queue status for a user
     */
    getQueueStatus(userId: string): QueueStatus {
        const jobs = db.prepare(`
            SELECT * FROM job_queue WHERE user_id = ? ORDER BY created_at DESC
        `).all(userId) as any[];

        const mappedJobs: QueuedJob[] = jobs.map(j => ({
            id: j.id,
            userId: j.user_id,
            jobTitle: j.job_title,
            company: j.company,
            jobDescription: j.job_description,
            jobUrl: j.job_url,
            status: j.status,
            applicationStatus: j.application_status,
            tailoredCvId: j.tailored_cv_id,
            matchScore: j.match_score,
            createdAt: j.created_at,
            updatedAt: j.updated_at,
            processedAt: j.processed_at,
            error: j.error
        }));

        return {
            total: mappedJobs.length,
            pending: mappedJobs.filter(j => j.status === 'pending').length,
            processing: mappedJobs.filter(j => j.status === 'processing').length,
            completed: mappedJobs.filter(j => j.status === 'completed').length,
            failed: mappedJobs.filter(j => j.status === 'failed').length,
            jobs: mappedJobs
        };
    }

    /**
     * Get a single job by ID
     */
    getJob(jobId: string): QueuedJob | null {
        const job = db.prepare('SELECT * FROM job_queue WHERE id = ?').get(jobId) as any;
        if (!job) return null;

        return {
            id: job.id,
            userId: job.user_id,
            jobTitle: job.job_title,
            company: job.company,
            jobDescription: job.job_description,
            jobUrl: job.job_url,
            status: job.status,
            applicationStatus: job.application_status,
            tailoredCvId: job.tailored_cv_id,
            matchScore: job.match_score,
            createdAt: job.created_at,
            updatedAt: job.updated_at,
            processedAt: job.processed_at,
            error: job.error
        };
    }

    /**
     * Process all pending jobs in the queue
     */
    async processQueue(userId: string): Promise<BatchProcessResult> {
        const pendingJobs = db.prepare(`
            SELECT * FROM job_queue WHERE user_id = ? AND status = 'pending'
        `).all(userId) as any[];

        const results: BatchProcessResult['results'] = [];
        let successful = 0;
        let failed = 0;

        // Get user's master CV entries
        const cvEntries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];

        for (const job of pendingJobs) {
            // Update status to processing
            this.updateJobStatus(job.id, 'processing');

            try {
                // Generate tailored CV
                const result = await tailoredCVGeneratorService.generate(
                    userId,
                    cvEntries,
                    job.job_description
                );

                // Update job with results
                const now = new Date().toISOString();
                db.prepare(`
                    UPDATE job_queue 
                    SET status = 'completed', 
                        tailored_cv_id = ?, 
                        match_score = ?,
                        processed_at = ?,
                        updated_at = ?
                    WHERE id = ?
                `).run(result.tailoredCV.id, result.matchResult.matchScore, now, now, job.id);

                results.push({
                    jobId: job.id,
                    success: true,
                    tailoredCvId: result.tailoredCV.id,
                    matchScore: result.matchResult.matchScore
                });
                successful++;
            } catch (error: any) {
                // Update job with error
                const now = new Date().toISOString();
                db.prepare(`
                    UPDATE job_queue 
                    SET status = 'failed', 
                        error = ?,
                        updated_at = ?
                    WHERE id = ?
                `).run(error.message || String(error), now, job.id);

                results.push({
                    jobId: job.id,
                    success: false,
                    error: error.message || String(error)
                });
                failed++;
            }
        }

        return {
            processed: pendingJobs.length,
            successful,
            failed,
            results
        };
    }

    /**
     * Update job status
     */
    updateJobStatus(jobId: string, status: JobStatus): void {
        const now = new Date().toISOString();
        db.prepare(`
            UPDATE job_queue SET status = ?, updated_at = ? WHERE id = ?
        `).run(status, now, jobId);
    }

    /**
     * Update application status
     */
    updateApplicationStatus(jobId: string, status: ApplicationStatus): void {
        const now = new Date().toISOString();
        db.prepare(`
            UPDATE job_queue SET application_status = ?, updated_at = ? WHERE id = ?
        `).run(status, now, jobId);
    }

    /**
     * Save batch of tailored CVs
     */
    saveBatch(userId: string, jobIds: string[]): { saved: number; errors: string[] } {
        const errors: string[] = [];
        let saved = 0;

        for (const jobId of jobIds) {
            const job = this.getJob(jobId);
            if (!job) {
                errors.push(`Job ${jobId} not found`);
                continue;
            }
            if (job.status !== 'completed') {
                errors.push(`Job ${jobId} is not completed`);
                continue;
            }
            if (!job.tailoredCvId) {
                errors.push(`Job ${jobId} has no tailored CV`);
                continue;
            }

            // Update application status to ready
            this.updateApplicationStatus(jobId, 'ready');
            saved++;
        }

        return { saved, errors };
    }

    /**
     * Get jobs by application status
     */
    getJobsByApplicationStatus(userId: string, status: ApplicationStatus): QueuedJob[] {
        const jobs = db.prepare(`
            SELECT * FROM job_queue WHERE user_id = ? AND application_status = ?
        `).all(userId, status) as any[];

        return jobs.map(j => ({
            id: j.id,
            userId: j.user_id,
            jobTitle: j.job_title,
            company: j.company,
            jobDescription: j.job_description,
            jobUrl: j.job_url,
            status: j.status,
            applicationStatus: j.application_status,
            tailoredCvId: j.tailored_cv_id,
            matchScore: j.match_score,
            createdAt: j.created_at,
            updatedAt: j.updated_at,
            processedAt: j.processed_at,
            error: j.error
        }));
    }

    /**
     * Clear completed jobs older than specified days
     */
    clearOldJobs(userId: string, daysOld: number = 30): number {
        const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
        const result = db.prepare(`
            DELETE FROM job_queue 
            WHERE user_id = ? AND status = 'completed' AND created_at < ?
        `).run(userId, cutoffDate);
        return result.changes;
    }
}

export const jobQueueManager = new JobQueueManager();
