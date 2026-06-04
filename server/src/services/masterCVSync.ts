import { db } from '../db';
import { CVAnalyzer } from '../swarm/prompts';

export interface ParsedCVData {
    overview: string;
    skills: string[];
    experience: string[];
    education: string[];
    rawText: string;
}

class MasterCVSyncService {
    /**
     * Sync parsed CV data to master_cv table
     * Clears old sections and inserts new ones
     */
    async syncParsedCVToMaster(userId: string, cvData: ParsedCVData): Promise<number> {
        try {
            console.log(`[MasterCVSync] Syncing CV for user ${userId}...`);

            // Clear old sections for this user
            db.prepare('DELETE FROM master_cv WHERE user_id = ?').run(userId);

            let insertedCount = 0;

            // Insert summary/overview
            if (cvData.overview) {
                db.prepare(`
                    INSERT INTO master_cv (user_id, section_type, content)
                    VALUES (?, ?, ?)
                `).run(userId, 'summary', cvData.overview);
                insertedCount++;
            }

            // Insert skills
            if (cvData.skills.length > 0) {
                const skillsText = cvData.skills.join('\n');
                db.prepare(`
                    INSERT INTO master_cv (user_id, section_type, content)
                    VALUES (?, ?, ?)
                `).run(userId, 'skills', skillsText);
                insertedCount++;
            }

            // Insert experiences
            if (cvData.experience.length > 0) {
                for (const exp of cvData.experience) {
                    db.prepare(`
                        INSERT INTO master_cv (user_id, section_type, content)
                        VALUES (?, ?, ?)
                    `).run(userId, 'experience', exp);
                    insertedCount++;
                }
            }

            // Insert education
            if (cvData.education.length > 0) {
                for (const edu of cvData.education) {
                    db.prepare(`
                        INSERT INTO master_cv (user_id, section_type, content)
                        VALUES (?, ?, ?)
                    `).run(userId, 'education', edu);
                    insertedCount++;
                }
            }

            // Insert raw CV text for reference
            if (cvData.rawText) {
                db.prepare(`
                    INSERT INTO master_cv (user_id, section_type, content)
                    VALUES (?, ?, ?)
                `).run(userId, 'raw_text', cvData.rawText.slice(0, 50000)); // Limit to 50k chars
                insertedCount++;
            }

            console.log(`[MasterCVSync] Synced ${insertedCount} sections for user ${userId}`);
            return insertedCount;
        } catch (error) {
            console.error('[MasterCVSync] Error syncing CV:', error);
            throw error;
        }
    }

    /**
     * Get master CV sections for a user
     */
    getMasterCV(userId: string): { [key: string]: any } {
        try {
            const entries = db.prepare(`
                SELECT section_type, content FROM master_cv
                WHERE user_id = ?
                ORDER BY section_type, created_at
            `).all(userId) as Array<{ section_type: string; content: string }>;

            const result: { [key: string]: any } = {};

            for (const entry of entries) {
                if (entry.section_type === 'skills') {
                    result.skills = entry.content.split('\n').filter(s => s.trim());
                } else if (entry.section_type === 'summary') {
                    result.summary = entry.content;
                } else if (entry.section_type === 'experience') {
                    if (!result.experience) result.experience = [];
                    result.experience.push(entry.content);
                } else if (entry.section_type === 'education') {
                    if (!result.education) result.education = [];
                    result.education.push(entry.content);
                } else if (entry.section_type === 'raw_text') {
                    result.rawText = entry.content;
                }
            }

            return result;
        } catch (error) {
            console.error('[MasterCVSync] Error getting master CV:', error);
            return {};
        }
    }

    /**
     * Auto-analyze and sync CV from raw text
     * This is the main entry point that combines CVAnalyzer + sync
     */
    async analyzeAndSyncCV(userId: string, rawCVText: string): Promise<number> {
        try {
            console.log(`[MasterCVSync] Analyzing and syncing CV for ${userId} (${rawCVText.length} chars)...`);

            const analyzer = new CVAnalyzer(5);

            // Run all analyses in parallel
            const [overview, skills, experience, education] = await Promise.all([
                analyzer.extractOverview(rawCVText),
                analyzer.extractSkills(rawCVText),
                analyzer.extractExperience(rawCVText),
                analyzer.extractEducation(rawCVText),
            ]);

            // Sync to database
            const syncedCount = await this.syncParsedCVToMaster(userId, {
                overview,
                skills,
                experience,
                education,
                rawText: rawCVText,
            });

            console.log(`[MasterCVSync] Analysis complete: ${syncedCount} sections synced`);
            return syncedCount;
        } catch (error) {
            console.error('[MasterCVSync] Error analyzing and syncing:', error);
            throw error;
        }
    }

    /**
     * Update a specific section of master CV
     */
    updateMasterCVSection(userId: string, sectionType: string, content: string): boolean {
        try {
            // Try to update existing
            const result = db.prepare(`
                UPDATE master_cv SET content = ? 
                WHERE user_id = ? AND section_type = ?
                LIMIT 1
            `).run(content, userId, sectionType);

            // If no rows updated, insert new
            if (result.changes === 0) {
                db.prepare(`
                    INSERT INTO master_cv (user_id, section_type, content)
                    VALUES (?, ?, ?)
                `).run(userId, sectionType, content);
            }

            console.log(`[MasterCVSync] Updated section ${sectionType} for user ${userId}`);
            return true;
        } catch (error) {
            console.error('[MasterCVSync] Error updating section:', error);
            return false;
        }
    }

    /**
     * Delete master CV for a user
     */
    deleteMasterCV(userId: string): boolean {
        try {
            db.prepare('DELETE FROM master_cv WHERE user_id = ?').run(userId);
            console.log(`[MasterCVSync] Deleted master CV for user ${userId}`);
            return true;
        } catch (error) {
            console.error('[MasterCVSync] Error deleting master CV:', error);
            return false;
        }
    }
}

export const masterCVSyncService = new MasterCVSyncService();
