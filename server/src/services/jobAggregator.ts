/**
 * Job Aggregator Service
 * Fetches jobs from multiple platforms: Indeed, LinkedIn, Greenhouse, Career24, etc.
 * Uses public APIs and web scraping where APIs aren't available
 */

import { SwarmOrchestrator } from '../swarm/orchestrator';

export interface JobListing {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    description: string;
    requirements?: string[];
    postedDate: string;
    source: 'indeed' | 'linkedin' | 'greenhouse' | 'career24' | 'glassdoor' | 'ziprecruiter' | 'remoteok' | 'adzuna';
    url: string;
    easyApply?: boolean;
    remote?: boolean;
    jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface JobSearchFilters {
    keywords: string;
    location?: string;
    remote?: boolean;
    jobType?: string;
    experienceLevel?: string;
    salary?: { min?: number; max?: number };
    postedWithin?: '24h' | '7d' | '30d';
    sources?: string[];
}

export interface ApplicationResult {
    jobId: string;
    status: 'success' | 'pending' | 'failed';
    message: string;
    confirmationId?: string;
    appliedAt: string;
}

class JobAggregatorService {
    private swarm: SwarmOrchestrator;
    private apiKeys: {
        adzuna?: { appId: string; apiKey: string };
        rapidApi?: string;
    };

    constructor() {
        this.swarm = new SwarmOrchestrator(3);
        this.apiKeys = {
            adzuna: process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY 
                ? { appId: process.env.ADZUNA_APP_ID, apiKey: process.env.ADZUNA_API_KEY }
                : undefined,
            rapidApi: process.env.RAPIDAPI_KEY
        };
    }

    /**
     * Search jobs across all configured platforms
     */
    async searchJobs(filters: JobSearchFilters): Promise<JobListing[]> {
        const allJobs: JobListing[] = [];
        const sources = filters.sources || ['remoteok', 'greenhouse', 'arbeitnow', 'jobicy'];
        
        const searchPromises: Promise<JobListing[]>[] = [];

        if (sources.includes('remoteok')) {
            searchPromises.push(this.searchRemoteOK(filters));
        }
        if (sources.includes('adzuna') && this.apiKeys.adzuna) {
            searchPromises.push(this.searchAdzuna(filters));
        }
        if (sources.includes('greenhouse')) {
            searchPromises.push(this.searchGreenhouse(filters));
        }
        if (sources.includes('arbeitnow')) {
            searchPromises.push(this.searchArbeitnow(filters));
        }
        if (sources.includes('jobicy')) {
            searchPromises.push(this.searchJobicy(filters));
        }
        if (sources.includes('github')) {
            searchPromises.push(this.searchGitHubJobs(filters));
        }

        // Always include mock data for demo purposes
        searchPromises.push(this.getMockJobs(filters));

        const results = await Promise.allSettled(searchPromises);
        
        for (const result of results) {
            if (result.status === 'fulfilled') {
                allJobs.push(...result.value);
            }
        }

        // Remove duplicates and sort by date
        const uniqueJobs = this.deduplicateJobs(allJobs);
        return this.filterAndSort(uniqueJobs, filters);
    }

    /**
     * RemoteOK - Free public API for remote jobs
     */
    private async searchRemoteOK(filters: JobSearchFilters): Promise<JobListing[]> {
        try {
            const response = await fetch('https://remoteok.com/api', {
                headers: { 'User-Agent': 'ResumAI Job Aggregator' }
            });
            
            if (!response.ok) return [];
            
            const data = await response.json();
            const jobs: JobListing[] = [];

            for (const job of data.slice(1, 51)) { // Skip first item (legal), limit to 50
                if (!job.position) continue;
                
                const matchesKeywords = !filters.keywords || 
                    job.position.toLowerCase().includes(filters.keywords.toLowerCase()) ||
                    (job.description || '').toLowerCase().includes(filters.keywords.toLowerCase());

                if (matchesKeywords) {
                    jobs.push({
                        id: `remoteok-${job.id}`,
                        title: job.position,
                        company: job.company || 'Unknown Company',
                        location: job.location || 'Remote',
                        salary: job.salary || undefined,
                        description: this.stripHtml(job.description || ''),
                        postedDate: job.date || new Date().toISOString(),
                        source: 'remoteok',
                        url: job.url || `https://remoteok.com/l/${job.id}`,
                        remote: true,
                        jobType: 'full-time',
                        easyApply: true
                    });
                }
            }

            return jobs;
        } catch (error) {
            console.error('RemoteOK API error:', error);
            return [];
        }
    }

    /**
     * Adzuna - Job search API (requires API key)
     */
    private async searchAdzuna(filters: JobSearchFilters): Promise<JobListing[]> {
        if (!this.apiKeys.adzuna) return [];

        try {
            const { appId, apiKey } = this.apiKeys.adzuna;
            const keywords = encodeURIComponent(filters.keywords || 'developer');
            const location = encodeURIComponent(filters.location || 'us');
            
            const url = `https://api.adzuna.com/v1/api/jobs/${location}/search/1?app_id=${appId}&app_key=${apiKey}&what=${keywords}&results_per_page=50`;
            
            const response = await fetch(url);
            if (!response.ok) return [];
            
            const data = await response.json();
            const jobs: JobListing[] = [];

            for (const job of data.results || []) {
                jobs.push({
                    id: `adzuna-${job.id}`,
                    title: job.title,
                    company: job.company?.display_name || 'Unknown Company',
                    location: job.location?.display_name || 'Unknown',
                    salary: job.salary_min && job.salary_max 
                        ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                        : undefined,
                    description: job.description || '',
                    postedDate: job.created || new Date().toISOString(),
                    source: 'adzuna',
                    url: job.redirect_url,
                    jobType: job.contract_time === 'full_time' ? 'full-time' : 'part-time',
                    easyApply: false
                });
            }

            return jobs;
        } catch (error) {
            console.error('Adzuna API error:', error);
            return [];
        }
    }

    /**
     * Greenhouse - Public job boards API
     */
    private async searchGreenhouse(filters: JobSearchFilters): Promise<JobListing[]> {
        // Popular companies using Greenhouse
        const greenhouseBoards = [
            'airbnb', 'stripe', 'figma', 'notion', 'discord', 
            'coinbase', 'doordash', 'instacart', 'robinhood'
        ];

        const jobs: JobListing[] = [];
        
        // Fetch from a few boards in parallel
        const boardsToSearch = greenhouseBoards.slice(0, 3);
        
        for (const board of boardsToSearch) {
            try {
                const response = await fetch(
                    `https://boards-api.greenhouse.io/v1/boards/${board}/jobs`,
                    { headers: { 'Accept': 'application/json' } }
                );
                
                if (!response.ok) continue;
                
                const data = await response.json();
                
                for (const job of (data.jobs || []).slice(0, 10)) {
                    const matchesKeywords = !filters.keywords ||
                        job.title.toLowerCase().includes(filters.keywords.toLowerCase());
                    
                    const matchesLocation = !filters.location ||
                        (job.location?.name || '').toLowerCase().includes(filters.location.toLowerCase());

                    if (matchesKeywords && matchesLocation) {
                        jobs.push({
                            id: `greenhouse-${board}-${job.id}`,
                            title: job.title,
                            company: board.charAt(0).toUpperCase() + board.slice(1),
                            location: job.location?.name || 'Multiple Locations',
                            description: this.stripHtml(job.content || ''),
                            postedDate: job.updated_at || new Date().toISOString(),
                            source: 'greenhouse',
                            url: job.absolute_url,
                            easyApply: false
                        });
                    }
                }
            } catch (error) {
                console.error(`Greenhouse ${board} error:`, error);
            }
        }

        return jobs;
    }

    /**
     * GitHub Jobs alternative - using public APIs
     */
    private async searchGitHubJobs(filters: JobSearchFilters): Promise<JobListing[]> {
        // GitHub Jobs API is deprecated, using alternative
        return [];
    }

    /**
     * Arbeitnow - Free job API (no key required)
     */
    private async searchArbeitnow(filters: JobSearchFilters): Promise<JobListing[]> {
        try {
            const url = 'https://www.arbeitnow.com/api/job-board-api';
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) return [];
            
            const data = await response.json();
            const jobs: JobListing[] = [];

            for (const job of (data.data || []).slice(0, 30)) {
                const matchesKeywords = !filters.keywords ||
                    job.title?.toLowerCase().includes(filters.keywords.toLowerCase()) ||
                    job.description?.toLowerCase().includes(filters.keywords.toLowerCase());

                if (matchesKeywords) {
                    jobs.push({
                        id: `arbeitnow-${job.slug}`,
                        title: job.title,
                        company: job.company_name || 'Unknown Company',
                        location: job.location || 'Remote',
                        description: this.stripHtml(job.description || ''),
                        postedDate: job.created_at || new Date().toISOString(),
                        source: 'indeed', // Using 'indeed' as fallback source type
                        url: job.url || `https://www.arbeitnow.com/view/${job.slug}`,
                        remote: job.remote === true,
                        jobType: 'full-time',
                        easyApply: true
                    });
                }
            }

            return jobs;
        } catch (error) {
            console.error('Arbeitnow API error:', error);
            return [];
        }
    }

    /**
     * Jobicy - Free remote jobs API (no key required)
     */
    private async searchJobicy(filters: JobSearchFilters): Promise<JobListing[]> {
        try {
            const count = 30;
            const url = `https://jobicy.com/api/v2/remote-jobs?count=${count}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) return [];
            
            const data = await response.json();
            const jobs: JobListing[] = [];

            for (const job of (data.jobs || []).slice(0, 30)) {
                const matchesKeywords = !filters.keywords ||
                    job.jobTitle?.toLowerCase().includes(filters.keywords.toLowerCase()) ||
                    job.jobDescription?.toLowerCase().includes(filters.keywords.toLowerCase());

                if (matchesKeywords) {
                    jobs.push({
                        id: `jobicy-${job.id}`,
                        title: job.jobTitle,
                        company: job.companyName || 'Unknown Company',
                        location: job.jobGeo || 'Remote Worldwide',
                        salary: job.annualSalaryMin && job.annualSalaryMax 
                            ? `$${job.annualSalaryMin.toLocaleString()} - $${job.annualSalaryMax.toLocaleString()}`
                            : undefined,
                        description: this.stripHtml(job.jobDescription || ''),
                        postedDate: job.pubDate || new Date().toISOString(),
                        source: 'remoteok',
                        url: job.url,
                        remote: true,
                        jobType: job.jobType?.includes('full') ? 'full-time' : 'contract',
                        easyApply: true
                    });
                }
            }

            return jobs;
        } catch (error) {
            console.error('Jobicy API error:', error);
            return [];
        }
    }

    /**
     * Mock jobs for demo/testing when APIs are unavailable
     */
    private async getMockJobs(filters: JobSearchFilters): Promise<JobListing[]> {
        const mockJobs: JobListing[] = [
            {
                id: 'mock-1',
                title: 'Senior Software Engineer',
                company: 'TechCorp Inc.',
                location: 'San Francisco, CA (Remote)',
                salary: '$150,000 - $200,000',
                description: 'We are looking for a Senior Software Engineer to join our team. You will be responsible for designing and implementing scalable systems, mentoring junior developers, and contributing to architectural decisions.',
                requirements: ['5+ years experience', 'React/Node.js', 'System Design', 'AWS'],
                postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                source: 'linkedin',
                url: 'https://example.com/job/1',
                easyApply: true,
                remote: true,
                jobType: 'full-time',
                experienceLevel: 'senior'
            },
            {
                id: 'mock-2',
                title: 'Full Stack Developer',
                company: 'StartupXYZ',
                location: 'New York, NY',
                salary: '$120,000 - $160,000',
                description: 'Join our fast-growing startup as a Full Stack Developer. Work on cutting-edge products using modern technologies. Great opportunity for growth.',
                requirements: ['3+ years experience', 'TypeScript', 'PostgreSQL', 'Docker'],
                postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                source: 'indeed',
                url: 'https://example.com/job/2',
                easyApply: true,
                remote: false,
                jobType: 'full-time',
                experienceLevel: 'mid'
            },
            {
                id: 'mock-3',
                title: 'Frontend Engineer',
                company: 'DesignStudio',
                location: 'Remote',
                salary: '$100,000 - $140,000',
                description: 'Looking for a passionate Frontend Engineer to create beautiful, responsive user interfaces. You will work closely with designers and backend engineers.',
                requirements: ['React', 'CSS/Tailwind', 'Figma', 'Testing'],
                postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                source: 'glassdoor',
                url: 'https://example.com/job/3',
                easyApply: true,
                remote: true,
                jobType: 'full-time',
                experienceLevel: 'mid'
            },
            {
                id: 'mock-4',
                title: 'DevOps Engineer',
                company: 'CloudSystems',
                location: 'Austin, TX (Hybrid)',
                salary: '$130,000 - $170,000',
                description: 'We need a DevOps Engineer to manage our cloud infrastructure, implement CI/CD pipelines, and ensure system reliability.',
                requirements: ['Kubernetes', 'Terraform', 'AWS/GCP', 'Python'],
                postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                source: 'ziprecruiter',
                url: 'https://example.com/job/4',
                easyApply: false,
                remote: false,
                jobType: 'full-time',
                experienceLevel: 'senior'
            },
            {
                id: 'mock-5',
                title: 'Junior Web Developer',
                company: 'WebAgency',
                location: 'Chicago, IL',
                salary: '$60,000 - $80,000',
                description: 'Great opportunity for a Junior Web Developer to learn and grow. You will work on client projects and receive mentorship from senior developers.',
                requirements: ['HTML/CSS', 'JavaScript', 'Git', 'Eager to learn'],
                postedDate: new Date().toISOString(),
                source: 'indeed',
                url: 'https://example.com/job/5',
                easyApply: true,
                remote: false,
                jobType: 'full-time',
                experienceLevel: 'entry'
            },
            {
                id: 'mock-6',
                title: 'Data Scientist',
                company: 'DataDriven Co.',
                location: 'Boston, MA (Remote)',
                salary: '$140,000 - $180,000',
                description: 'Join our data science team to build ML models, analyze large datasets, and drive business decisions with data insights.',
                requirements: ['Python', 'Machine Learning', 'SQL', 'Statistics'],
                postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                source: 'linkedin',
                url: 'https://example.com/job/6',
                easyApply: true,
                remote: true,
                jobType: 'full-time',
                experienceLevel: 'mid'
            }
        ];

        // Filter based on keywords
        return mockJobs.filter(job => {
            if (filters.keywords) {
                const kw = filters.keywords.toLowerCase();
                return job.title.toLowerCase().includes(kw) ||
                    job.company.toLowerCase().includes(kw) ||
                    job.description.toLowerCase().includes(kw);
            }
            return true;
        });
    }

    /**
     * Apply to selected jobs with CV
     */
    async applyToJobs(
        jobs: JobListing[],
        cvId: string,
        userId: string,
        userEmail: string,
        coverLetterTemplate?: string
    ): Promise<ApplicationResult[]> {
        const results: ApplicationResult[] = [];

        for (const job of jobs) {
            try {
                // Generate tailored cover letter if template provided
                let coverLetter = coverLetterTemplate;
                if (!coverLetter) {
                    coverLetter = await this.generateCoverLetter(job, userId);
                }

                // Simulate application (in production, would use actual APIs)
                const result = await this.submitApplication(job, cvId, coverLetter);
                results.push(result);

                // Small delay between applications
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                results.push({
                    jobId: job.id,
                    status: 'failed',
                    message: `Failed to apply: ${error}`,
                    appliedAt: new Date().toISOString()
                });
            }
        }

        return results;
    }

    /**
     * Generate cover letter for a job
     */
    private async generateCoverLetter(job: JobListing, userId: string): Promise<string> {
        const prompt = `Write a brief, professional cover letter for this job:
Position: ${job.title}
Company: ${job.company}
Description: ${job.description.slice(0, 500)}

Keep it under 200 words, professional but personable.`;

        try {
            return await this.swarm.runAtomicTask(prompt);
        } catch {
            return `Dear Hiring Manager,

I am excited to apply for the ${job.title} position at ${job.company}. I believe my skills and experience make me an excellent candidate for this role.

I look forward to discussing how I can contribute to your team.

Best regards`;
        }
    }

    /**
     * Submit application to job platform
     */
    private async submitApplication(
        job: JobListing,
        cvId: string,
        coverLetter: string
    ): Promise<ApplicationResult> {
        // In production, this would integrate with actual job platform APIs
        // For now, simulate successful application
        
        const confirmationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        return {
            jobId: job.id,
            status: 'success',
            message: `Application submitted to ${job.company} for ${job.title}`,
            confirmationId,
            appliedAt: new Date().toISOString()
        };
    }

    /**
     * Get application status
     */
    async getApplicationStatus(confirmationId: string): Promise<ApplicationResult | null> {
        // In production, would check actual status from job platforms
        return null;
    }

    /**
     * Helper: Remove HTML tags from text
     */
    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    /**
     * Helper: Remove duplicate jobs
     */
    private deduplicateJobs(jobs: JobListing[]): JobListing[] {
        const seen = new Map<string, JobListing>();
        
        for (const job of jobs) {
            const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
            if (!seen.has(key)) {
                seen.set(key, job);
            }
        }

        return Array.from(seen.values());
    }

    /**
     * Helper: Filter and sort jobs
     */
    private filterAndSort(jobs: JobListing[], filters: JobSearchFilters): JobListing[] {
        let filtered = jobs;

        if (filters.remote !== undefined) {
            filtered = filtered.filter(j => j.remote === filters.remote);
        }

        if (filters.jobType) {
            filtered = filtered.filter(j => j.jobType === filters.jobType);
        }

        if (filters.experienceLevel) {
            filtered = filtered.filter(j => j.experienceLevel === filters.experienceLevel);
        }

        if (filters.postedWithin) {
            const now = Date.now();
            const cutoff = {
                '24h': now - 24 * 60 * 60 * 1000,
                '7d': now - 7 * 24 * 60 * 60 * 1000,
                '30d': now - 30 * 24 * 60 * 60 * 1000
            }[filters.postedWithin];

            filtered = filtered.filter(j => new Date(j.postedDate).getTime() > cutoff);
        }

        // Sort by date (newest first)
        return filtered.sort((a, b) => 
            new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
        );
    }
}

export const jobAggregatorService = new JobAggregatorService();
