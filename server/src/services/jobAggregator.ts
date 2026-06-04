import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { humanVerificationDetector } from './humanVerificationDetector';
import { jobMatcherService } from './jobMatcher';

export interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  salary?: string;
  skills: string[];
  remote: boolean;
  matchScore?: number;
  automationScore?: number;
}

class JobAggregatorService {
  async searchJobs(params: {
    userId: string;
    keywords?: string[];
    remoteOnly?: boolean;
    maxResults?: number;
  }): Promise<ScrapedJob[]> {
    const { userId, keywords = ['software engineer', 'full stack', 'developer'], remoteOnly = true, maxResults = 50 } = params;
    const allJobs: ScrapedJob[] = [];

    const [remoteOkJobs, remotiveJobs] = await Promise.all([
      this.fetchRemoteOK(keywords, remoteOnly),
      this.fetchRemotive(keywords),
    ]);

    allJobs.push(...remoteOkJobs, ...remotiveJobs);
    const limited = allJobs.slice(0, maxResults);

    for (const job of limited) {
      try {
        const assessment = await humanVerificationDetector.assessJobAutomation(job.description, job.url);
        job.automationScore = assessment.score;

        // Personalize: calculate match score against user's actual CV
        const cvEntries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
        if (cvEntries.length > 0) {
          try {
            const requirements = await jobMatcherService.extractRequirements(job.description || `${job.title} ${job.company}`);
            const match = jobMatcherService.calculateMatch(cvEntries, requirements);
            job.matchScore = match.matchScore;
          } catch {
            job.matchScore = 50;
          }
        }

        const stmt = db.prepare(`
          INSERT OR REPLACE INTO scraped_jobs
          (id, user_id, title, company, location, description, url, source, salary, skills, remote, match_score, automation_score, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          job.id, userId, job.title, job.company, job.location,
          job.description.slice(0, 5000), job.url, job.source,
          job.salary || null, JSON.stringify(job.skills),
          job.remote ? 1 : 0, job.matchScore || null,
          job.automationScore || 70, 'new'
        );
      } catch (err) {
        console.error(`[JobAggregator] Error processing job ${job.id}:`, err);
      }
    }

    return limited;
  }

  private async fetchRemoteOK(keywords: string[], remoteOnly: boolean): Promise<ScrapedJob[]> {
    const tags = keywords.flatMap(k => k.split(' ')).filter(Boolean).slice(0, 3).join(',');
    const url = `https://remoteok.com/api?tags=${encodeURIComponent(tags)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: { 'User-Agent': 'ResumAI/1.0', 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[JobAggregator] RemoteOK returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, 25).map((job: any) => ({
      id: uuidv4(),
      title: job.position || 'Unknown',
      company: job.company || 'Unknown',
      location: job.location || 'Remote',
      description: job.description || '',
      url: job.url ? `https://remoteok.com${job.url}` : '',
      source: 'remoteok',
      salary: job.salary || undefined,
      skills: (job.tags || []).map((t: string) => t.trim()).filter(Boolean),
      remote: true,
    }));
  }

  private async fetchRemotive(keywords: string[]): Promise<ScrapedJob[]> {
    const what = keywords.slice(0, 2).join(' ');
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(what)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[JobAggregator] Remotive returned ${response.status}`);
        return [];
      }

      const data = await response.json();
      const results = data.jobs || [];

      return results.slice(0, 25).map((job: any) => ({
        id: uuidv4(),
        title: job.title || 'Unknown',
        company: job.company_name || 'Unknown',
        location: job.candidate_required_location || 'Remote',
        description: job.description || '',
        url: job.url || '',
        source: 'remotive',
        salary: job.salary || undefined,
        skills: this.extractSkillsFromText(job.description || ''),
        remote: true,
      }));
    } catch (error) {
      console.warn(`[JobAggregator] Remotive fetch failed`, error);
      return [];
    }
  }

  scrapeJobBoard: (url: string) => Promise<ScrapedJob[]> = async (url: string) => {
    console.warn('[JobAggregator] Web scraping not implemented');
    return [];
  }

  private extractSkillsFromText(text: string): string[] {
    const commonSkills = [
      'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'TypeScript',
      'JavaScript', 'Go', 'Rust', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
      'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'GraphQL', 'REST', 'Git',
      'CI/CD', 'Terraform', 'Tailwind CSS', 'Next.js', 'Express', 'Django',
    ];
    return commonSkills.filter(s => text.toLowerCase().includes(s.toLowerCase()));
  }

  getUserScrapedJobs(userId: string, status?: string): ScrapedJob[] {
    try {
      const query = status
        ? 'SELECT * FROM scraped_jobs WHERE user_id = ? AND status = ? ORDER BY created_at DESC'
        : 'SELECT * FROM scraped_jobs WHERE user_id = ? ORDER BY created_at DESC';
      const params = status ? [userId, status] : [userId];
      const results = db.prepare(query).all(...params) as any[];
      return results.map(r => ({
        id: r.id, title: r.title, company: r.company, location: r.location,
        description: r.description, url: r.url, source: r.source,
        salary: r.salary, skills: JSON.parse(r.skills || '[]'),
        remote: !!r.remote, matchScore: r.match_score, automationScore: r.automation_score,
      }));
    } catch (err) {
      console.error('[JobAggregator] Error getting scraped jobs:', err);
      return [];
    }
  }

  updateJobStatus(jobId: string, status: string, matchScore?: number): void {
    try {
      const stmt = matchScore
        ? db.prepare('UPDATE scraped_jobs SET status = ?, match_score = ? WHERE id = ?')
        : db.prepare('UPDATE scraped_jobs SET status = ? WHERE id = ?');
      if (matchScore) stmt.run(status, matchScore, jobId);
      else stmt.run(status, jobId);
    } catch (err) {
      console.error('[JobAggregator] Error updating job status:', err);
    }
  }
}

export const jobAggregatorService = new JobAggregatorService();
export default jobAggregatorService;
