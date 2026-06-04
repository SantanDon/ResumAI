import { db } from '../db';
import { remoteJobScoutService } from './remoteJobScout';
import { jobMatcherService } from './jobMatcher';
import { coverLetterGeneratorService } from './coverLetterGeneratorService';
import { cvEvolutionEngine } from './cvEvolutionEngine';
import { SwarmOrchestrator } from '../swarm/orchestrator';
import { massApplyService } from './massApply';

export interface AgentReport {
  jobFound: boolean;
  jobDetails?: {
    id: string;
    title: string;
    company: string;
    location: string;
    url: string;
    description: string;
    source: string;
    fitScore: number;
    matchScore: number;
    automationScore: number;
  };
  agentReasoning: string;
  coverLetterDraft?: string;
  skillsAnalysis?: {
    matchingSkills: string[];
    missingSkills: string[];
    suggestedAdditions: { skill: string; suggestedBullet: string; relevance: string }[];
  };
  cvEnhancements?: {
    originalBullet: string;
    improvedBullet: string;
    expectedImpact: number;
  }[];
}

class ResumAIAgentService {
  private swarm: SwarmOrchestrator;
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.swarm = new SwarmOrchestrator(5);
  }

  /**
   * Periodically run background sourcing & application process for users who enabled autoApply
   */
  startAutonomousScheduler(intervalMs: number = 30 * 60 * 1000) {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
    console.log(`[ResumAIAgent] Starting background autonomous loop. Interval: ${intervalMs / 1000 / 60} minutes.`);
    
    // Initial run after 5 seconds to not block startup
    setTimeout(() => this.runSchedulerTick(), 5000);
    
    this.schedulerInterval = setInterval(() => this.runSchedulerTick(), intervalMs);
  }

  private async runSchedulerTick() {
    try {
      console.log(`[ResumAIAgent] Running autonomous background loop tick...`);
      // Find all settings where autoApply is active
      const activeSettings = db.prepare('SELECT user_id FROM scout_settings WHERE auto_apply = 1').all() as { user_id: string }[];
      
      for (const settings of activeSettings) {
        const userId = settings.user_id;
        console.log(`[ResumAIAgent] Triggering autonomous hunt workflow for user: ${userId}`);
        const report = await this.runAgentWorkflow(userId);
        
        if (report.jobFound && report.jobDetails) {
          const userScoutSettings = remoteJobScoutService.getScoutSettings(userId);
          
          if (report.jobDetails.fitScore >= userScoutSettings.minMatchScore) {
            console.log(`[ResumAIAgent] Auto-queueing high fit job (${report.jobDetails.fitScore}%): ${report.jobDetails.title} at ${report.jobDetails.company}`);
            
            const queueResult = await massApplyService.addJobToQueue(userId, {
              jobText: `${report.jobDetails.title}\n${report.jobDetails.company}\n${report.jobDetails.location}\n${report.jobDetails.description}`,
              jobUrl: report.jobDetails.url,
              title: report.jobDetails.title,
              company: report.jobDetails.company
            });
            
            // If human review is disabled, process the queue item immediately to close the loop autonomously
            if (!userScoutSettings.requireHumanReview && queueResult.jobQueueId && queueResult.status === 'queued') {
              console.log(`[ResumAIAgent] Autonomous processing triggered for queue ID: ${queueResult.jobQueueId}`);
              await massApplyService.processSingleApplication(userId, queueResult.jobQueueId);
            }
          } else {
            console.log(`[ResumAIAgent] Found job did not exceed fit threshold (${report.jobDetails.fitScore}% < ${userScoutSettings.minMatchScore}%). Skipping auto-queue.`);
          }
        }
      }
    } catch (error) {
      console.error('[ResumAIAgent] Error in autonomous scheduler tick:', error);
    }
  }

  /**
   * Proactively run agent search & optimization loop
   */
  async runAgentWorkflow(userId: string): Promise<AgentReport> {
    try {
      console.log(`[ResumAIAgent] Running autonomous workflow for ${userId}...`);
      
      const settings = remoteJobScoutService.getScoutSettings(userId);
      
      // Step 1: Scout and retrieve best matching job using targetRole preference as fallback keywords
      const scouted = await remoteJobScoutService.scoutJobs(userId, { 
        maxResults: 15,
        keywords: settings.preferredKeywords.length > 0
          ? settings.preferredKeywords
          : [settings.targetRole || 'Software Engineer', 'developer', 'React', 'Node.js']
      });
      const bestJobs = scouted.filter(j => j.job.remote && j.fitScore >= 50);

      if (bestJobs.length === 0) {
        return {
          jobFound: false,
          agentReasoning: `The agent scanned available channels but did not find remote jobs matching your target role "${settings.targetRole || 'Software Engineer'}" with sufficient fit.`,
        };
      }

      // Pick the top scoring job
      const topJob = bestJobs[0];
      const jobDesc = topJob.job.description || '';
      
      console.log(`[ResumAIAgent] Selected top job: ${topJob.job.title} at ${topJob.job.company} (${topJob.fitScore}% Fit)`);

      // Step 2: Extract requirements & skills from CV for analysis
      const cvEntries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
      const cvContent = cvEntries.map(e => e.content).join('\n');
      const cvSkills = cvEntries.filter(e => e.section_type === 'skill').map(e => e.content);

      // Step 3: Run Swarm gap and enhancement suggestions specifically for this job
      const matchResult = jobMatcherService.calculateMatch(cvEntries, 
        await jobMatcherService.extractRequirements(jobDesc)
      );

      // Step 4: Propose skill upgrades & drafts for missing skills customized for targetRole
      const missingSkills = matchResult.missingSkills.slice(0, 4);
      const suggestedAdditions: { skill: string; suggestedBullet: string; relevance: string }[] = [];

      for (const skill of missingSkills) {
        const prompt = `Based on the job description for a "${settings.targetRole || topJob.job.title}": "${jobDesc.slice(0, 500)}...", create a highly marketable resume bullet point demonstrating experience with "${skill}" that the candidate can add to their CV.
Original requirement details: ${skill}
Format as JSON: { "suggestedBullet": "Action-oriented bullet point with a placeholder for a metric", "relevance": "Why this skill is critical for this job" }`;

        try {
          const res = await this.swarm.runAtomicTask(prompt);
          const parsed = JSON.parse(res);
          suggestedAdditions.push({
            skill,
            suggestedBullet: parsed.suggestedBullet,
            relevance: parsed.relevance,
          });
        } catch {
          suggestedAdditions.push({
            skill,
            suggestedBullet: `Utilized ${skill} to deliver high-quality code and optimize system performance.`,
            relevance: `Required backend/frontend technology.`,
          });
        }
      }

      // Step 5: Draft the Cover Letter using preferred tone
      let coverLetter = '';
      try {
        const toneVal = (settings.preferredTone === 'friendly' || settings.preferredTone === 'formal' || settings.preferredTone === 'professional')
          ? settings.preferredTone
          : 'professional';
          
        const coverLetterRes = await coverLetterGeneratorService.generateCoverLetter({
          userId,
          jobTitle: topJob.job.title,
          companyName: topJob.job.company,
          jobDescription: jobDesc,
          tone: toneVal,
        });
        coverLetter = coverLetterRes.coverLetter;
      } catch (err) {
        coverLetter = `Dear Hiring Team,\n\nI am writing to express my strong interest in the ${topJob.job.title} position at ${topJob.job.company}. With my background as a ${settings.targetRole || 'Software Engineer'}, I am confident in my ability to add significant value to your team.`;
      }

      // Step 6: Identify 2 bullet points to enhance using targetRole and preferredTone
      const experienceEntries = cvEntries.filter(e => e.section_type === 'experience' || e.section_type === 'unknown').slice(0, 2);
      const cvEnhancements: { originalBullet: string; improvedBullet: string; expectedImpact: number }[] = [];

      for (const exp of experienceEntries) {
        try {
          const original = exp.content;
          const prompt = `Rewrite this CV experience description in a "${settings.preferredTone || 'professional'}" tone to highlight capabilities relevant to a "${settings.targetRole || topJob.job.title}" role.
Original: "${original}"
Format as JSON: { "improved": "Enhanced sentence", "impact": 15 }`;
          const res = await this.swarm.runAtomicTask(prompt);
          const parsed = JSON.parse(res);
          cvEnhancements.push({
            originalBullet: original,
            improvedBullet: parsed.improved,
            expectedImpact: parsed.impact || 10,
          });
        } catch {
          // ignore
        }
      }

      return {
        jobFound: true,
        jobDetails: {
          id: topJob.job.id,
          title: topJob.job.title,
          company: topJob.job.company,
          location: topJob.job.location,
          url: topJob.job.url,
          description: jobDesc,
          source: topJob.job.source,
          fitScore: topJob.fitScore,
          matchScore: topJob.matchScore,
          automationScore: topJob.automationScore,
        },
        agentReasoning: `ResumAI Agent scouted this opportunity. It matches your background in ${matchResult.matchedSkills.slice(0, 3).join(', ')}. The role is remote and can be easily applied to. To bridge the gap, the agent recommends highlighting ${missingSkills.join(', ')}.`,
        coverLetterDraft: coverLetter,
        skillsAnalysis: {
          matchingSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills,
          suggestedAdditions,
        },
        cvEnhancements,
      };
    } catch (error) {
      console.error("[ResumAIAgent] Error running agent loop:", error);
      throw error;
    }
  }

  async runCustomAgentWorkflow(
    userId: string,
    jobInput: {
      title?: string;
      company?: string;
      url?: string;
      description: string;
      recruiterEmail?: string;
    }
  ): Promise<AgentReport> {
    try {
      console.log(`[ResumAIAgent] Running custom workflow for ${userId}...`);
      
      const settings = remoteJobScoutService.getScoutSettings(userId);
      const jobDesc = jobInput.description;
      const title = jobInput.title || 'Custom Software Engineer';
      const company = jobInput.company || 'Custom Company';
      const url = jobInput.url || '';
      
      // Step 1: Extract requirements & skills from CV for analysis
      const cvEntries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
      
      // Step 2: Run Swarm gap and enhancement suggestions specifically for this job
      const requirements = await jobMatcherService.extractRequirements(jobDesc);
      const matchResult = jobMatcherService.calculateMatch(cvEntries, requirements);

      // Step 3: Propose skill upgrades & drafts for missing skills customized for targetRole
      const missingSkills = matchResult.missingSkills.slice(0, 4);
      const suggestedAdditions: { skill: string; suggestedBullet: string; relevance: string }[] = [];

      for (const skill of missingSkills) {
        const prompt = `Based on the job description for a "${title}": "${jobDesc.slice(0, 500)}...", create a highly marketable resume bullet point demonstrating experience with "${skill}" that the candidate can add to their CV.
Original requirement details: ${skill}
Format as JSON: { "suggestedBullet": "Action-oriented bullet point with a placeholder for a metric", "relevance": "Why this skill is critical for this job" }`;

        try {
          const res = await this.swarm.runAtomicTask(prompt);
          const parsed = JSON.parse(res);
          suggestedAdditions.push({
            skill,
            suggestedBullet: parsed.suggestedBullet,
            relevance: parsed.relevance,
          });
        } catch {
          suggestedAdditions.push({
            skill,
            suggestedBullet: `Utilized ${skill} to deliver high-quality code and optimize system performance.`,
            relevance: `Required backend/frontend technology.`,
          });
        }
      }

      // Step 4: Draft the Cover Letter using preferred tone
      let coverLetter = '';
      try {
        const toneVal = (settings.preferredTone === 'friendly' || settings.preferredTone === 'formal' || settings.preferredTone === 'professional')
          ? settings.preferredTone
          : 'professional';
          
        const coverLetterRes = await coverLetterGeneratorService.generateCoverLetter({
          userId,
          jobTitle: title,
          companyName: company,
          jobDescription: jobDesc,
          tone: toneVal,
        });
        coverLetter = coverLetterRes.coverLetter;
      } catch (err) {
        coverLetter = `Dear Hiring Team,\n\nI am writing to express my strong interest in the ${title} position at ${company}. With my background, I am confident in my ability to add significant value to your team.`;
      }

      // Step 5: Identify 2 bullet points to enhance using targetRole and preferredTone
      const experienceEntries = cvEntries.filter(e => e.section_type === 'experience' || e.section_type === 'unknown').slice(0, 2);
      const cvEnhancements: { originalBullet: string; improvedBullet: string; expectedImpact: number }[] = [];

      for (const exp of experienceEntries) {
        try {
          const original = exp.content;
          const prompt = `Rewrite this CV experience description in a "${settings.preferredTone || 'professional'}" tone to highlight capabilities relevant to a "${title}" role.
Original: "${original}"
Format as JSON: { "improved": "Enhanced sentence", "impact": 15 }`;
          const res = await this.swarm.runAtomicTask(prompt);
          const parsed = JSON.parse(res);
          cvEnhancements.push({
            originalBullet: original,
            improvedBullet: parsed.improved,
            expectedImpact: parsed.impact || 10,
          });
        } catch {
          // ignore
        }
      }

      return {
        jobFound: true,
        jobDetails: {
          id: 'custom-' + Date.now(),
          title,
          company,
          location: 'Remote',
          url,
          description: jobDesc,
          source: 'Custom',
          fitScore: matchResult.matchScore || 70,
          matchScore: matchResult.matchScore || 70,
          automationScore: 100,
        },
        agentReasoning: `ResumAI Agent analyzed this custom role. It matches your background in ${matchResult.matchedSkills.slice(0, 3).join(', ')}. The role is remote and can be easily applied to. To bridge the gap, the agent recommends highlighting ${missingSkills.join(', ')}.`,
        coverLetterDraft: coverLetter,
        skillsAnalysis: {
          matchingSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills,
          suggestedAdditions,
        },
        cvEnhancements,
      };
    } catch (error) {
      console.error("[ResumAIAgent] Error running custom agent loop:", error);
      throw error;
    }
  }
}

export const resumAIAgentService = new ResumAIAgentService();
export default resumAIAgentService;
