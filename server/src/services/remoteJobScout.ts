import { db } from '../db';
import { jobAggregatorService, ScrapedJob } from './jobAggregator';
import { jobMatcherService } from './jobMatcher';
import { humanVerificationDetector } from './humanVerificationDetector';

export interface ScoutResult {
  job: ScrapedJob;
  matchScore: number;
  automationScore: number;
  fitScore: number;
  reasoning: string;
  recommended: boolean;
}

interface ScoutConfig {
  keywords: string[];
  remoteOnly: boolean;
  minMatchScore: number;
  maxResults: number;
  autoApplyThreshold: number;
}

class RemoteJobScoutService {
  async scoutJobs(userId: string, config?: Partial<ScoutConfig>): Promise<ScoutResult[]> {
    const settings = this.getScoutSettings(userId);

    const cfg: ScoutConfig = {
      keywords: config?.keywords || settings.preferredKeywords.length > 0 ? settings.preferredKeywords : ['software engineer', 'full stack', 'developer', 'react', 'node.js'],
      remoteOnly: config?.remoteOnly ?? settings.remoteOnly,
      minMatchScore: config?.minMatchScore ?? settings.minMatchScore,
      maxResults: config?.maxResults ?? 30,
      autoApplyThreshold: config?.autoApplyThreshold ?? 80,
    };

    const cvEntries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
    if (cvEntries.length === 0) return [];

    const rawJobs = await jobAggregatorService.searchJobs({
      userId,
      keywords: cfg.keywords,
      remoteOnly: cfg.remoteOnly,
      maxResults: cfg.maxResults,
    });

    const masterCVContent = cvEntries.map((e: any) => e.content).join('\n');
    const results: ScoutResult[] = [];

    for (const job of rawJobs) {
      try {
        const requirements = await jobMatcherService.extractRequirements(job.description || `${job.title} at ${job.company}\nSkills: ${job.skills.join(', ')}`);
        const matchResult = jobMatcherService.calculateMatch(cvEntries, requirements);

        const autoScore = job.automationScore ?? 70;
        const fitScore = Math.round(matchResult.matchScore * 0.6 + autoScore * 0.4);
        const recommended = fitScore >= cfg.minMatchScore;

        results.push({
          job,
          matchScore: matchResult.matchScore,
          automationScore: autoScore,
          fitScore,
          reasoning: this.generateReasoning(matchResult.matchedSkills, matchResult.missingSkills, autoScore),
          recommended,
        });

        if (recommended) {
          jobAggregatorService.updateJobStatus(job.id, 'recommended', matchResult.matchScore);
        }
      } catch {
        const fitScore = Math.round(job.automationScore ?? 70);
        results.push({
          job,
          matchScore: 50,
          automationScore: job.automationScore ?? 70,
          fitScore,
          reasoning: 'Basic match - could not deep-analyze',
          recommended: fitScore >= cfg.minMatchScore,
        });
      }
    }

    return results.sort((a, b) => b.fitScore - a.fitScore);
  }

  private generateReasoning(matched: string[], missing: string[], autoScore: number): string {
    const parts: string[] = [];
    if (matched.length > 0) parts.push(`Matches: ${matched.slice(0, 4).join(', ')}`);
    if (missing.length > 0) parts.push(`Missing: ${missing.slice(0, 3).join(', ')}`);
    if (autoScore >= 80) parts.push('Highly automatable');
    else if (autoScore >= 50) parts.push('Partially automatable');
    else parts.push('May need manual review');
    return parts.join(' | ');
  }

  getScoutSettings(userId: string): any {
    try {
      let settings = db.prepare('SELECT * FROM scout_settings WHERE user_id = ?').get(userId) as any;
      if (!settings) {
        db.prepare(`
          INSERT INTO scout_settings (user_id) VALUES (?)
        `).run(userId);
        settings = db.prepare('SELECT * FROM scout_settings WHERE user_id = ?').get(userId) as any;
      }
      return {
        remoteOnly: !!settings.remote_only,
        preferredLocations: JSON.parse(settings.preferred_locations || '[]'),
        excludedCompanies: JSON.parse(settings.excluded_companies || '[]'),
        minMatchScore: settings.min_match_score || 40,
        maxApplicationsPerDay: settings.max_applications_per_day || 10,
        autoApply: !!settings.auto_apply,
        requireHumanReview: !!settings.require_human_review,
        jobTypes: JSON.parse(settings.job_types || '["full-time","contract"]'),
        salaryMin: settings.salary_min,
        preferredKeywords: JSON.parse(settings.preferred_keywords || '[]'),
        excludedKeywords: JSON.parse(settings.excluded_keywords || '["senior","lead","principal","manager"]'),
        slackToken: settings.slack_token || '',
        slackCookie: settings.slack_cookie || '',
        slackChannels: (() => {
          try {
            return JSON.parse(settings.slack_channels || '[]');
          } catch {
            return typeof settings.slack_channels === 'string' ? settings.slack_channels.split(',').map((s: string) => s.trim()) : [];
          }
        })(),
        targetRole: settings.target_role || 'Full Stack Engineer',
        preferredTone: settings.preferred_tone || 'professional',
        automationPriority: settings.automation_priority || 'balanced',
      };
    } catch {
      return {
        remoteOnly: true, preferredLocations: [], excludedCompanies: [], minMatchScore: 40,
        maxApplicationsPerDay: 10, autoApply: false, requireHumanReview: true,
        jobTypes: ['full-time', 'contract'], salaryMin: null, preferredKeywords: [], excludedKeywords: ['senior', 'lead', 'principal', 'manager'],
        slackToken: '', slackCookie: '', slackChannels: [],
        targetRole: 'Full Stack Engineer', preferredTone: 'professional', automationPriority: 'balanced',
      };
    }
  }

  updateScoutSettings(userId: string, updates: Partial<any>): void {
    try {
      const current = this.getScoutSettings(userId);
      const merged = { ...current, ...updates };

      const stmt = db.prepare(`
        UPDATE scout_settings SET
          remote_only = ?, preferred_locations = ?, excluded_companies = ?,
          min_match_score = ?, max_applications_per_day = ?, auto_apply = ?,
          require_human_review = ?, job_types = ?, salary_min = ?,
          preferred_keywords = ?, excluded_keywords = ?,
          slack_token = ?, slack_cookie = ?, slack_channels = ?,
          target_role = ?, preferred_tone = ?, automation_priority = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `);

      stmt.run(
        merged.remoteOnly ? 1 : 0,
        JSON.stringify(merged.preferredLocations),
        JSON.stringify(merged.excludedCompanies),
        merged.minMatchScore, merged.maxApplicationsPerDay,
        merged.autoApply ? 1 : 0, merged.requireHumanReview ? 1 : 0,
        JSON.stringify(merged.jobTypes), merged.salaryMin || null,
        JSON.stringify(merged.preferredKeywords),
        JSON.stringify(merged.excludedKeywords),
        merged.slackToken || '',
        merged.slackCookie || '',
        JSON.stringify(merged.slackChannels || []),
        merged.targetRole || 'Full Stack Engineer',
        merged.preferredTone || 'professional',
        merged.automationPriority || 'balanced',
        userId
      );
    } catch (err) {
      console.error('[RemoteJobScout] Error updating scout settings:', err);
    }
  }
}

export const remoteJobScoutService = new RemoteJobScoutService();
export default remoteJobScoutService;
