/**
 * Real-Time Suggestion Service
 * Provides fast bullet point analysis and suggestions
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { db } from '../db';
import { powerWordsService } from './powerWords';
import { cvIntelligenceService } from './cvIntelligence';

export interface Suggestion {
    id: string;
    type: 'power_word' | 'quantify' | 'clarity' | 'length' | 'action_verb';
    original: string;
    suggested: string;
    reason: string;
    confidence: number; // 0-100
}

export interface SuggestionResult {
    bullet: string;
    score: number;
    suggestions: Suggestion[];
    analysisTimeMs: number;
}

export interface UserPreference {
    userId: string;
    suggestionType: string;
    acceptedCount: number;
    rejectedCount: number;
    lastUpdated: string;
}

class RealTimeSuggestionService {
    private readonly MAX_ANALYSIS_TIME_MS = 2000; // 2 seconds max

    /**
     * Analyze a bullet point and generate suggestions in real-time
     * Must complete within 2 seconds
     */
    analyzeBullet(bullet: string, userId?: string): SuggestionResult {
        const startTime = Date.now();
        const suggestions: Suggestion[] = [];

        // Quick analysis - no AI calls for speed
        const analysis = cvIntelligenceService.analyzeBullet(bullet);
        const score = cvIntelligenceService.scoreBullet(bullet);

        // Generate suggestions based on analysis
        // 1. Check for weak verbs
        if (analysis.actionVerbStrength < 3) {
            const weakVerbs = ['helped', 'worked', 'did', 'made', 'got', 'was', 'had'];
            const words = bullet.toLowerCase().split(/\s+/);
            
            for (const word of words) {
                if (weakVerbs.includes(word)) {
                    const replacements = powerWordsService.suggestReplacement(word);
                    if (replacements.length > 0) {
                        const replacement = replacements[0];
                        suggestions.push({
                            id: `sug_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            type: 'action_verb',
                            original: word,
                            suggested: replacement.word,
                            reason: `"${word}" is a weak verb. "${replacement.word}" is more impactful.`,
                            confidence: 85
                        });
                    }
                }
            }
        }

        // 2. Check for quantification
        if (!analysis.hasQuantification) {
            suggestions.push({
                id: `sug_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                type: 'quantify',
                original: bullet,
                suggested: this.suggestQuantification(bullet),
                reason: 'Adding numbers and metrics makes achievements more concrete.',
                confidence: 70
            });
        }

        // 3. Check bullet length
        const wordCount = bullet.split(/\s+/).length;
        if (wordCount > 25) {
            suggestions.push({
                id: `sug_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                type: 'length',
                original: bullet,
                suggested: this.shortenBullet(bullet),
                reason: 'Bullet points should be concise (15-20 words ideal).',
                confidence: 60
            });
        } else if (wordCount < 8) {
            suggestions.push({
                id: `sug_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                type: 'length',
                original: bullet,
                suggested: bullet,
                reason: 'Consider adding more detail about the impact or scope.',
                confidence: 50
            });
        }

        // 4. Check for clichés
        const cliches = powerWordsService.containsCliche(bullet);
        for (const cliche of cliches.slice(0, 2)) { // Limit to 2 cliché suggestions
            suggestions.push({
                id: `sug_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                type: 'clarity',
                original: cliche,
                suggested: 'Use specific, measurable language instead',
                reason: `"${cliche}" is overused. Be more specific.`,
                confidence: 75
            });
        }

        // Apply user preferences to filter/rank suggestions
        if (userId) {
            this.applyUserPreferences(suggestions, userId);
        }

        const analysisTimeMs = Date.now() - startTime;

        return {
            bullet,
            score,
            suggestions: suggestions.slice(0, 5), // Max 5 suggestions
            analysisTimeMs
        };
    }

    /**
     * Suggest how to add quantification to a bullet
     */
    private suggestQuantification(bullet: string): string {
        // Simple heuristic-based suggestions
        const templates = [
            'Consider adding: "by X%" or "resulting in X% improvement"',
            'Consider adding: "for X users/customers" or "across X teams"',
            'Consider adding: "$X in savings/revenue" or "X projects"'
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Suggest a shorter version of a bullet
     */
    private shortenBullet(bullet: string): string {
        // Remove common filler words
        const fillers = ['that', 'which', 'very', 'really', 'basically', 'actually', 'in order to'];
        let shortened = bullet;
        for (const filler of fillers) {
            shortened = shortened.replace(new RegExp(`\\b${filler}\\b`, 'gi'), '');
        }
        return shortened.replace(/\s+/g, ' ').trim();
    }

    /**
     * Apply user preferences to rank/filter suggestions
     */
    private applyUserPreferences(suggestions: Suggestion[], userId: string): void {
        const prefs = this.getUserPreferences(userId);
        
        // Boost confidence for suggestion types user typically accepts
        for (const suggestion of suggestions) {
            const pref = prefs.find(p => p.suggestionType === suggestion.type);
            if (pref) {
                const acceptRate = pref.acceptedCount / (pref.acceptedCount + pref.rejectedCount + 1);
                suggestion.confidence = Math.round(suggestion.confidence * (0.5 + acceptRate * 0.5));
            }
        }

        // Sort by confidence
        suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Record user feedback on a suggestion
     */
    recordFeedback(userId: string, suggestionId: string, suggestionType: string, accepted: boolean): void {
        const now = new Date().toISOString();
        
        // Check if preference exists
        const existing = db.prepare(`
            SELECT * FROM user_preferences 
            WHERE user_id = ? AND preference_key = ?
        `).get(userId, `suggestion_${suggestionType}`) as any;

        if (existing) {
            const value = JSON.parse(existing.preference_value || '{}');
            if (accepted) {
                value.acceptedCount = (value.acceptedCount || 0) + 1;
            } else {
                value.rejectedCount = (value.rejectedCount || 0) + 1;
            }
            
            db.prepare(`
                UPDATE user_preferences 
                SET preference_value = ?, updated_at = ?
                WHERE user_id = ? AND preference_key = ?
            `).run(JSON.stringify(value), now, userId, `suggestion_${suggestionType}`);
        } else {
            const value = {
                acceptedCount: accepted ? 1 : 0,
                rejectedCount: accepted ? 0 : 1
            };
            
            db.prepare(`
                INSERT INTO user_preferences (user_id, preference_key, preference_value, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            `).run(userId, `suggestion_${suggestionType}`, JSON.stringify(value), now, now);
        }
    }

    /**
     * Get user preferences for suggestion types
     */
    getUserPreferences(userId: string): UserPreference[] {
        const prefs = db.prepare(`
            SELECT * FROM user_preferences 
            WHERE user_id = ? AND preference_key LIKE 'suggestion_%'
        `).all(userId) as any[];

        return prefs.map(p => {
            const value = JSON.parse(p.preference_value || '{}');
            return {
                userId: p.user_id,
                suggestionType: p.preference_key.replace('suggestion_', ''),
                acceptedCount: value.acceptedCount || 0,
                rejectedCount: value.rejectedCount || 0,
                lastUpdated: p.updated_at
            };
        });
    }

    /**
     * Batch analyze multiple bullets
     */
    analyzeBullets(bullets: string[], userId?: string): SuggestionResult[] {
        return bullets.map(bullet => this.analyzeBullet(bullet, userId));
    }
}

export const realTimeSuggestionService = new RealTimeSuggestionService();
