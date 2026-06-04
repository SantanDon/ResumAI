import { SwarmOrchestrator } from '../swarm/orchestrator';
import { db } from '../db';

export interface AutomationAssessment {
  score: number;
  level: 'fully_automatable' | 'mostly_automatable' | 'partial' | 'manual_required';
  reasoning: string[];
  detectedBarriers: string[];
  recommendedApproach: 'direct_email' | 'ats_form' | 'portal_upload' | 'manual';
  emailFound: boolean;
  formFields?: number;
}

class HumanVerificationDetector {
  private swarm: SwarmOrchestrator;

  constructor() {
    this.swarm = new SwarmOrchestrator(3);
  }

  async assessJobAutomation(jobDescription: string, jobUrl?: string): Promise<AutomationAssessment> {
    const prompt = `Analyze this job posting and determine how easily the application process can be automated.

Job Description:
${jobDescription.slice(0, 2500)}

${jobUrl ? `Job URL: ${jobUrl}` : ''}

Analyze these factors and return JSON:
{
  "score": <0-100, higher = more automatable>,
  "level": <"fully_automatable"|"mostly_automatable"|"partial"|"manual_required">,
  "reasoning": ["key reason 1", "key reason 2"],
  "detectedBarriers": ["barrier 1", "barrier 2"],
  "recommendedApproach": <"direct_email"|"ats_form"|"portal_upload"|"manual">,
  "emailFound": <true/false>,
  "formFields": <estimated number of form fields if known, else null>,
  "humanVerificationSignals": ["captcha", "phone_required", "portfolio_required", "manual_form", "multi_step", "video_required", "assessment_required", "referral_only"]
}

Scoring Rules:
- 90-100: Has direct email => fully automatable
- 70-89: ATS with email or simple form => mostly automatable
- 40-69: Complex ATS/portal with many fields => partial
- 0-39: Requires assessment/video/phone/multi-step => manual

Return ONLY valid JSON.`;

    try {
      const result = await this.swarm.runAtomicTask(prompt);
      const parsed = JSON.parse(result);
      return {
        score: parsed.score || 50,
        level: parsed.level || 'partial',
        reasoning: parsed.reasoning || [],
        detectedBarriers: parsed.detectedBarriers || [],
        recommendedApproach: parsed.recommendedApproach || 'manual',
        emailFound: parsed.emailFound || false,
        formFields: parsed.formFields || null,
      };
    } catch {
      return this.ruleBasedAssessment(jobDescription, jobUrl);
    }
  }

  private ruleBasedAssessment(jobDescription: string, jobUrl?: string): AutomationAssessment {
    const text = jobDescription.toLowerCase();
    const barriers: string[] = [];
    let score = 60;

    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const emailFound = !!emailMatch;

    if (emailFound) score += 30;

    if (/captcha|verify you are human/i.test(text)) { score -= 30; barriers.push('CAPTCHA verification'); }
    if (/phone|call|schedule.*call/i.test(text)) { score -= 15; barriers.push('Phone/scheduling required'); }
    if (/portfolio|github.*link/i.test(text)) { score -= 10; barriers.push('Portfolio/GitHub required'); }
    if (/upload.*(video|recording)/i.test(text)) { score -= 25; barriers.push('Video submission required'); }
    if (/assessment|test|exam|challenge/i.test(text)) { score -= 20; barriers.push('Technical assessment required'); }
    if (/cover letter required|upload.*resume|fill.*form/i.test(text)) {
      score -= 10;
      barriers.push('Multi-step application form');
    }
    if (/referral|internal|transfer/i.test(text)) { score -= 20; barriers.push('Referral only'); }

    const level = score >= 80 ? 'fully_automatable'
      : score >= 60 ? 'mostly_automatable'
      : score >= 35 ? 'partial'
      : 'manual_required';

    const approach = emailFound ? 'direct_email'
      : score >= 50 ? 'ats_form'
      : score >= 30 ? 'portal_upload'
      : 'manual';

    return {
      score: Math.max(0, Math.min(100, score)),
      level,
      reasoning: [
        emailFound ? 'Recruiter email found - direct email possible' : 'No recruiter email found',
        barriers.length > 0 ? `Detected ${barriers.length} automation barriers` : 'No significant barriers detected',
      ],
      detectedBarriers: barriers,
      recommendedApproach: approach,
      emailFound,
    };
  }

  learnFromOutcome(userId: string, jobDescription: string, success: boolean, assessment: AutomationAssessment): void {
    try {
      const stmt = db.prepare(`
        INSERT INTO automation_rules (user_id, rule_type, pattern, action, confidence)
        VALUES (?, ?, ?, ?, ?)
      `);
      const pattern = assessment.detectedBarriers.join('|') || 'no_barriers';
      const action = success ? assessment.recommendedApproach : 'manual';
      stmt.run(userId, 'outcome_learned', pattern, action, success ? 0.8 : 0.3);
    } catch (err) {
      console.error('[HumanVerificationDetector] Error learning from outcome:', err);
    }
  }
}

export const humanVerificationDetector = new HumanVerificationDetector();
