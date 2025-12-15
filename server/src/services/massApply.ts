/**
 * Mass Apply Service
 * Handles batch job applications with tailored CVs
 * Requirements: Mass application feature with CV tailoring
 */

import { db } from '../db';
import { jobQueueManager } from './jobQueueManager';
import { tailoredCVGeneratorService } from './tailoredCVGenerator';
import { SwarmOrchestrator } from '../swarm/orchestrator';

const swarm = new SwarmOrchestrator(5);

export interface JobListing {
    id: string;
    title: string;
    company: string;
    description: string;
    url?: string;
    source?: string;
    addedAt: string;
}

export interface ApplicationResult {
    jobId: string;
    company: string;
    title: string;
    status: 'success' | 'failed' | 'pending';
    tailoredCvId?: string;
    matchScore?: number;
    coverLetter?: string;
    error?: string;
}

export interface MassApplyResult {
    totalJobs: number;
    successful: number;
    failed: number;
    applications: ApplicationResult[];
}

class MassApplyService {
    /**
     * Add multiple jobs to the application queue
     */
    addJobsToQueue(userId: string, jobs: Omit<JobListing, 'id' | 'addedAt'>[]): JobListing[] {
        const addedJobs: JobListing[] = [];
        
        for (const job of jobs) {
            const queuedJob = jobQueueManager.addJob(userId, {
                jobTitle: job.title,
                company: job.company,
                jobDescription: job.description,
                jobUrl: job.url
            });
            
            addedJobs.push({
                id: queuedJob.id,
                title: job.title,
                company: job.company,
                description: job.description,
                url: job.url,
                source: job.source,
                addedAt: queuedJob.createdAt
            });
        }
        
        return addedJobs;
    }


    /**
     * Process all pending applications and generate tailored CVs
     */
    async processApplications(userId: string): Promise<MassApplyResult> {
        const queueResult = await jobQueueManager.processQueue(userId);
        
        const applications: ApplicationResult[] = queueResult.results.map(r => {
            const job = jobQueueManager.getJob(r.jobId);
            return {
                jobId: r.jobId,
                company: job?.company || 'Unknown',
                title: job?.jobTitle || 'Unknown',
                status: r.success ? 'success' : 'failed',
                tailoredCvId: r.tailoredCvId,
                matchScore: r.matchScore,
                error: r.error
            };
        });

        return {
            totalJobs: queueResult.processed,
            successful: queueResult.successful,
            failed: queueResult.failed,
            applications
        };
    }

    /**
     * Generate cover letter for a specific job
     */
    async generateCoverLetter(userId: string, jobId: string): Promise<string> {
        const job = jobQueueManager.getJob(jobId);
        if (!job) throw new Error('Job not found');

        const entries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
        const skills = entries.filter(e => e.section_type?.includes('skill')).map(e => e.content);
        const experience = entries.filter(e => 
            e.section_type?.includes('experience') || e.section_type?.includes('work')
        ).map(e => e.content);

        const prompt = `Write a professional cover letter for the following job application.

Job Title: ${job.jobTitle}
Company: ${job.company}
Job Description: ${job.jobDescription.slice(0, 1000)}

Candidate Skills: ${skills.slice(0, 10).join(', ')}
Candidate Experience: ${experience.slice(0, 3).join('; ')}

Requirements:
- Professional and concise (3-4 paragraphs)
- Highlight relevant skills and experience
- Show enthusiasm for the role
- Include a strong opening and closing
- Do not include placeholder text like [Your Name]`;

        const coverLetter = await swarm.runAtomicTask(prompt);
        return coverLetter;
    }

    /**
     * Get application statistics for a user
     */
    getApplicationStats(userId: string): {
        total: number;
        pending: number;
        completed: number;
        avgMatchScore: number;
        topCompanies: string[];
    } {
        const status = jobQueueManager.getQueueStatus(userId);
        
        const completedJobs = status.jobs.filter(j => j.status === 'completed');
        const avgScore = completedJobs.length > 0
            ? completedJobs.reduce((sum, j) => sum + (j.matchScore || 0), 0) / completedJobs.length
            : 0;

        const companyCounts: Record<string, number> = {};
        for (const job of status.jobs) {
            companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
        }
        const topCompanies = Object.entries(companyCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([company]) => company);

        return {
            total: status.total,
            pending: status.pending,
            completed: status.completed,
            avgMatchScore: Math.round(avgScore),
            topCompanies
        };
    }

    /**
     * Parse job listings from text (e.g., pasted from job board)
     */
    parseJobListings(text: string): Omit<JobListing, 'id' | 'addedAt'>[] {
        const jobs: Omit<JobListing, 'id' | 'addedAt'>[] = [];
        
        // Split by common separators
        const sections = text.split(/\n{2,}|---+/);
        
        for (const section of sections) {
            if (section.trim().length < 50) continue;
            
            const lines = section.trim().split('\n');
            const title = lines[0]?.trim() || 'Position';
            const company = this.extractCompanyFromText(section);
            
            jobs.push({
                title,
                company,
                description: section.trim(),
                source: 'manual'
            });
        }
        
        return jobs;
    }

    private extractCompanyFromText(text: string): string {
        const patterns = [
            /at\s+([A-Z][a-zA-Z\s&]+)/,
            /company[:\s]+([A-Z][a-zA-Z\s&]+)/i,
            /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+is\s+(?:hiring|looking|seeking)/
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1].trim();
        }
        
        return 'Company';
    }
}

export const massApplyService = new MassApplyService();
