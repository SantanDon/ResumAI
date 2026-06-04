import { db } from '../db';
import { jobParserService } from './jobParserService';
import { humanVerificationDetector } from './humanVerificationDetector';
import { jobMatcherService } from './jobMatcher';
import { remoteJobScoutService } from './remoteJobScout';

export interface SlackMessage {
  type: string;
  user?: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
}

export interface ScoutSlackResult {
  importedCount: number;
  processedCount: number;
  errors: string[];
}

class SlackService {
  /**
   * Scout recent messages from specified developer Slack channels, filter for job postings,
   * parse using LLM Swarm, calculate fit scores, and save to scraped_jobs cache.
   */
  async scoutSlack(userId: string): Promise<ScoutSlackResult> {
    const settings = remoteJobScoutService.getScoutSettings(userId);
    const token = settings.slackToken || process.env.SLACK_API_TOKEN;
    const cookie = settings.slackCookie || process.env.SLACK_API_COOKIE;
    const channels: string[] = settings.slackChannels || [];
    
    const result: ScoutSlackResult = {
      importedCount: 0,
      processedCount: 0,
      errors: [],
    };

    if (!token) {
      result.errors.push('Slack Token is not configured. Please set it in Settings.');
      return result;
    }

    if (channels.length === 0) {
      result.errors.push('No Slack channels configured for scouting. Please specify channel IDs in Settings.');
      return result;
    }

    const cvEntries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];

    for (const channelId of channels) {
      const trimmedChannel = channelId.trim();
      if (!trimmedChannel) continue;

      try {
        console.log(`[SlackService] Fetching history for channel ${trimmedChannel}...`);
        const messages = await this.fetchChannelHistory(token, trimmedChannel, cookie);
        
        console.log(`[SlackService] Found ${messages.length} messages in channel ${trimmedChannel}. Filtering for jobs...`);
        for (const msg of messages) {
          result.processedCount++;
          const text = msg.text || '';
          
          if (!this.isPotentialJobPosting(text)) {
            continue;
          }

          const jobId = `slack-${trimmedChannel}-${msg.ts}`;
          
          // Check if already processed to avoid re-parsing and wasting tokens
          const alreadyScraped = db.prepare('SELECT id FROM scraped_jobs WHERE id = ?').get(jobId);
          if (alreadyScraped) {
            continue;
          }

          console.log(`[SlackService] Parsing potential job posting: ${text.slice(0, 80)}...`);
          try {
            // Generate deep link
            const cleanTs = msg.ts.replace('.', '');
            const deepLink = `https://slack.com/archives/${trimmedChannel}/p${cleanTs}`;

            // Parse job posting details using LLM Swarm
            const parsed = await jobParserService.parseJobPosting(text);
            
            // Assess automation barrier score
            const assessment = await humanVerificationDetector.assessJobAutomation(text, deepLink);
            
            // Match score against candidate's master CV
            let matchScore = 50;
            if (cvEntries.length > 0) {
              try {
                const requirements = await jobMatcherService.extractRequirements(text);
                const match = jobMatcherService.calculateMatch(cvEntries, requirements);
                matchScore = match.matchScore;
              } catch (err) {
                console.error(`[SlackService] Matcher failed, fallback score 50`, err);
              }
            }

            // Save to scraped_jobs DB table
            const stmt = db.prepare(`
              INSERT OR REPLACE INTO scraped_jobs
              (id, user_id, title, company, location, description, url, source, salary, skills, remote, match_score, automation_score, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run(
              jobId,
              userId,
              parsed.title || 'Slack Job Posting',
              parsed.company || 'Slack Recruiter',
              parsed.location || 'Remote',
              text.slice(0, 5000),
              deepLink,
              'slack',
              parsed.salary || null,
              JSON.stringify(parsed.skills || []),
              (parsed.location || '').toLowerCase().includes('remote') || parsed.location === 'Remote' || text.toLowerCase().includes('remote') ? 1 : 0,
              matchScore,
              assessment.score,
              'new'
            );

            result.importedCount++;
          } catch (err: any) {
            console.error(`[SlackService] Error parsing job at message ${msg.ts}:`, err);
            result.errors.push(`Failed to parse job at msg ${msg.ts} in channel ${trimmedChannel}: ${err.message}`);
          }
        }
      } catch (err: any) {
        console.error(`[SlackService] Error scraping channel ${trimmedChannel}:`, err);
        result.errors.push(`Error scraping channel ${trimmedChannel}: ${err.message}`);
      }
    }

    return result;
  }

  /**
   * Helper to fetch conversations history from Slack Web API
   */
  private async fetchChannelHistory(token: string, channelId: string, cookie?: string): Promise<SlackMessage[]> {
    try {
      let response: Response;
      const isXoxc = token.startsWith('xoxc-');

      if (isXoxc && cookie) {
        const url = 'https://slack.com/api/conversations.history';
        const bodyParams = new URLSearchParams();
        bodyParams.append('token', token);
        bodyParams.append('channel', channelId);
        bodyParams.append('limit', '50');

        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookie,
          },
          body: bodyParams.toString(),
        });
      } else {
        const url = `https://slack.com/api/conversations.history?channel=${encodeURIComponent(channelId)}&limit=50`;
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      }

      if (!response.ok) {
        throw new Error(`Slack HTTP error: status ${response.status}`);
      }

      const body = await response.json() as any;
      if (!body.ok) {
        throw new Error(`Slack API error: ${body.error || 'unknown error'}`);
      }

      return (body.messages || []) as SlackMessage[];
    } catch (err: any) {
      throw new Error(`Failed to fetch Slack history: ${err.message}`);
    }
  }

  /**
   * Simple heuristic to filter out casual chatter and detect potential job postings
   */
  private isPotentialJobPosting(text: string): boolean {
    if (!text || text.length < 50) return false;
    
    const lower = text.toLowerCase();
    const jobKeywords = [
      'hiring',
      'job opportunity',
      'job opening',
      'we are looking for',
      'recruiting',
      'role',
      'position',
      'careers',
      'open position',
      'freelance',
      'contractor',
      'seeking',
      'remote job',
      'developer',
      'engineer',
      'designer',
      'product manager',
      'looking to hire'
    ];

    // Require at least two match points or strong signals to filter out casual messages
    let points = 0;
    for (const kw of jobKeywords) {
      if (lower.includes(kw)) {
        points += 1;
        // Strong indicators count extra
        if (kw === 'hiring' || kw === 'job opportunity' || kw === 'we are looking for' || kw === 'open position') {
          points += 1;
        }
      }
    }

    return points >= 2;
  }
}

export const slackService = new SlackService();
export default slackService;
