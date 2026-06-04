import { SwarmOrchestrator } from '../swarm/orchestrator';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface MarketTrend {
  skill: string;
  demandCount: number;
  avgSalary: string | null;
  trend: 'rising' | 'stable' | 'falling';
  source: string;
}

export interface CVImprovementSuggestion {
  type: 'add_skill' | 'enhance_bullet' | 'add_project' | 'reorder_sections' | 'add_keyword' | 'update_summary';
  section: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  expectedImpact: number;
}

class CVEvolutionEngine {
  private swarm: SwarmOrchestrator;

  constructor() {
    this.swarm = new SwarmOrchestrator(5);
  }

  async analyzeJobMarket(userId: string, recentJobs: any[]): Promise<MarketTrend[]> {
    const trends: Record<string, MarketTrend> = {};

    for (const job of recentJobs) {
      const skills = job.skills || [];
      for (const skill of skills) {
        if (!trends[skill]) {
          trends[skill] = {
            skill, demandCount: 0, avgSalary: null, trend: 'rising', source: 'aggregator',
          };
        }
        trends[skill].demandCount++;
      }
    }

    const trendList = Object.values(trends).sort((a, b) => b.demandCount - a.demandCount);

    for (const trend of trendList.slice(0, 20)) {
      try {
        const existing = db.prepare(
          'SELECT * FROM job_market_cache WHERE user_id = ? AND skill = ? AND source = ?'
        ).get(userId, trend.skill, 'aggregator') as any;

        if (existing) {
          db.prepare(
            'UPDATE job_market_cache SET demand_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).run(trend.demandCount, existing.id);
        } else {
          db.prepare(`
            INSERT INTO job_market_cache (user_id, skill, demand_count, market_trend, source, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(userId, trend.skill, trend.demandCount, 'rising', 'aggregator',
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
        }
      } catch { /* skip */ }
    }

    return trendList;
  }

  async suggestImprovements(userId: string): Promise<CVImprovementSuggestion[]> {
    const suggestions: CVImprovementSuggestion[] = [];

    try {
      const cvEntries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
      const marketSkills = db.prepare(
        'SELECT * FROM job_market_cache WHERE user_id = ? ORDER BY demand_count DESC LIMIT 15'
      ).all(userId) as any[];

      const cvSkills = cvEntries.filter(e => e.section_type === 'skill').map(e => e.content.toLowerCase());
      const cvContent = cvEntries.map(e => e.content.toLowerCase()).join(' ');

      for (const marketSkill of marketSkills) {
        const skill = marketSkill.skill.toLowerCase();
        if (!cvSkills.some(s => s.includes(skill) || skill.includes(s))) {
          suggestions.push({
            type: 'add_skill',
            section: 'skills',
            suggestion: `Add "${marketSkill.skill}" - mentioned in ${marketSkill.demand_count} recent job postings`,
            priority: marketSkill.demand_count > 10 ? 'high' : 'medium',
            reason: `High demand skill appearing in ${marketSkill.demand_count} job listings`,
            expectedImpact: Math.min(15, marketSkill.demand_count),
          });
        }
      }

      if (cvEntries.length > 0) {
        const prompt = `Analyze this CV for improvement opportunities based on current job market trends.

CV Content:
${cvEntries.map(e => `${e.section_type}: ${e.content}`).join('\n')}

Recent Job Market Demands:
${marketSkills.slice(0, 10).map(s => `${s.skill} (${s.demand_count} openings)`).join('\n')}

Return a JSON array of improvement suggestions:
[{
  "type": "enhance_bullet|add_keyword|update_summary|reorder_sections",
  "section": "experience|summary|skills|education",
  "suggestion": "specific actionable suggestion",
  "priority": "high|medium|low",
  "reason": "why this matters",
  "expectedImpact": <0-100>
}]
Return ONLY valid JSON array.`;

        try {
          const result = await this.swarm.runAtomicTask(prompt);
          const parsed = JSON.parse(result);
          if (Array.isArray(parsed)) {
            suggestions.push(...parsed);
          }
        } catch { /* AI suggestions failed, use rule-based */ }
      }

      return suggestions.sort((a, b) => b.expectedImpact - a.expectedImpact);
    } catch (err) {
      console.error('[CVEvolutionEngine] Error suggesting improvements:', err);
      return suggestions;
    }
  }

  recordEvolution(userId: string, cvVersion: string, changeType: string, section: string | null,
    oldContent: string | null, newContent: string | null,
    matchScoreBefore?: number, matchScoreAfter?: number): void {
    try {
      db.prepare(`
        INSERT INTO cv_evolution_data
        (user_id, cv_version, change_type, section, old_content, new_content,
         match_score_before, match_score_after)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, cvVersion, changeType, section, oldContent, newContent,
        matchScoreBefore || null, matchScoreAfter || null);
    } catch (err) {
      console.error('[CVEvolutionEngine] Error recording evolution:', err);
    }
  }

  getEvolutionHistory(userId: string, limit: number = 20): any[] {
    try {
      return db.prepare(
        'SELECT * FROM cv_evolution_data WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
      ).all(userId, limit) as any[];
    } catch {
      return [];
    }
  }

  getSkillGapAnalysis(userId: string): Promise<{ skill: string; demandCount: number; hasSkill: boolean; priority: 'high' | 'medium' | 'low' }[]> {
    return new Promise((resolve) => {
      try {
        const marketSkills = db.prepare(
          'SELECT * FROM job_market_cache WHERE user_id = ? ORDER BY demand_count DESC LIMIT 20'
        ).all(userId) as any[];
        const cvEntries = db.prepare('SELECT * FROM master_cv WHERE user_id = ?').all(userId) as any[];
        const cvContent = cvEntries.map(e => e.content.toLowerCase()).join(' ');
        const cvSkills = cvEntries.filter(e => e.section_type === 'skill').map(e => e.content.toLowerCase());

        const gaps = marketSkills.map(ms => {
          const skillLower = ms.skill.toLowerCase();
          const hasSkill = cvSkills.some(s => s.includes(skillLower) || skillLower.includes(s)) ||
            cvContent.includes(skillLower);
          return {
            skill: ms.skill,
            demandCount: ms.demand_count,
            hasSkill,
            priority: (ms.demand_count > 10 ? 'high' : ms.demand_count > 5 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          };
        });

        resolve(gaps);
      } catch {
        resolve([]);
      }
    });
  }
}

export const cvEvolutionEngine = new CVEvolutionEngine();
export default cvEvolutionEngine;
