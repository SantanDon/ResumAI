/**
 * Industry Manager Service
 * Manages predefined and custom industry profiles
 * Supports dynamic industry creation for any field
 * 
 * Features:
 * - Load predefined industries from industryProfiles.json
 * - Create, read, update, delete custom industries per user
 * - Validate industry profiles with required fields
 * - Cache custom industries for performance
 * 
 * Usage:
 * ```typescript
 * // Create custom industry
 * const industry = await industryManager.createCustomIndustry(userId, {
 *   name: 'Technology',
 *   prioritySkills: ['JavaScript', 'Python'],
 *   powerWords: ['innovative', 'scalable'],
 *   requiredSections: ['summary', 'experience', 'skills']
 * });
 * 
 * // Get industry
 * const retrieved = await industryManager.getIndustry(userId, industry.id);
 * 
 * // List all industries
 * const industries = await industryManager.listIndustries(userId);
 * 
 * // Update industry
 * await industryManager.updateCustomIndustry(userId, industry.id, {
 *   powerWords: ['innovative', 'scalable', 'efficient']
 * });
 * 
 * // Delete industry
 * await industryManager.deleteCustomIndustry(userId, industry.id);
 * ```
 */

import { db } from '../db';
import * as fs from 'fs';
import * as path from 'path';

export interface IndustryProfile {
    id: string;
    name: string;
    requiredSections: string[];
    optionalSections: string[];
    prioritySkills: string[];
    powerWords: string[];
    certifications?: string[];
    keywords?: string[];
    formatPreferences?: {
        summaryLength?: number;
        bulletPointsPerJob?: number;
        skillsFormat?: 'categories' | 'list';
    };
    outdatedPractices?: string[];
    isCustom?: boolean;
    userId?: string;
    createdAt?: string;
    updatedAt?: string;
}

class IndustryManagerService {
    private predefinedIndustries: Map<string, IndustryProfile> = new Map();
    private customIndustriesCache: Map<string, IndustryProfile[]> = new Map(); // Cache per user

    constructor() {
        this.loadPredefinedIndustries();
        this.initializeDatabase();
    }

    /**
     * Initialize database table for custom industries
     * Creates the custom_industries table if it doesn't exist
     * 
     * @private
     */
    private initializeDatabase(): void {
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS custom_industries (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    required_sections TEXT,
                    optional_sections TEXT,
                    priority_skills TEXT,
                    power_words TEXT,
                    certifications TEXT,
                    keywords TEXT,
                    format_preferences TEXT,
                    outdated_practices TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    UNIQUE(user_id, name)
                )
            `);
        } catch (error) {
            console.error('[IndustryManager] Database initialization error:', error);
        }
    }

    /**
     * Load predefined industries from JSON file
     * Reads industryProfiles.json and populates the predefined industries map
     * 
     * @private
     */
    private loadPredefinedIndustries(): void {
        try {
            const industriesPath = path.join(__dirname, '../data/industryProfiles.json');
            const data = fs.readFileSync(industriesPath, 'utf-8');
            const industries = JSON.parse(data).industries;

            for (const [key, profile] of Object.entries(industries)) {
                this.predefinedIndustries.set(key, profile as IndustryProfile);
            }

            console.log(`[IndustryManager] Loaded ${this.predefinedIndustries.size} predefined industries`);
        } catch (error) {
            console.error('[IndustryManager] Error loading predefined industries:', error);
        }
    }

    /**
     * Get industry by ID (predefined or custom)
     * First checks predefined industries, then custom industries for the user
     * 
     * @param userId - The user ID
     * @param industryId - The industry ID to retrieve
     * @returns The industry profile or null if not found
     * 
     * @example
     * const industry = await industryManager.getIndustry('user123', 'tech-industry');
     */
    async getIndustry(userId: string, industryId: string): Promise<IndustryProfile | null> {
        // Check predefined industries first
        if (this.predefinedIndustries.has(industryId)) {
            return this.predefinedIndustries.get(industryId) || null;
        }

        // Check custom industries
        try {
            const stmt = db.prepare('SELECT * FROM custom_industries WHERE id = ? AND user_id = ?');
            const result = stmt.get(industryId, userId) as any;

            if (result) {
                return this.parseCustomIndustry(result);
            }
        } catch (error) {
            console.error('[IndustryManager] Error fetching custom industry:', error);
        }

        return null;
    }

    /**
     * List all industries (predefined + custom)
     * Returns both predefined industries and user's custom industries
     * Results are cached for performance
     * 
     * @param userId - The user ID
     * @returns Array of all available industries for the user
     * 
     * @example
     * const industries = await industryManager.listIndustries('user123');
     */
    async listIndustries(userId: string): Promise<IndustryProfile[]> {
        // Check cache first
        if (this.customIndustriesCache.has(userId)) {
            const industries: IndustryProfile[] = [];
            
            // Add predefined industries
            for (const industry of this.predefinedIndustries.values()) {
                industries.push(industry);
            }
            
            // Add cached custom industries
            const cached = this.customIndustriesCache.get(userId);
            if (cached) {
                industries.push(...cached);
            }
            
            return industries;
        }

        const industries: IndustryProfile[] = [];

        // Add predefined industries
        for (const industry of this.predefinedIndustries.values()) {
            industries.push(industry);
        }

        // Add custom industries
        try {
            const stmt = db.prepare('SELECT * FROM custom_industries WHERE user_id = ? ORDER BY created_at DESC');
            const results = stmt.all(userId) as any[];

            const customIndustries: IndustryProfile[] = [];
            for (const result of results) {
                const industry = this.parseCustomIndustry(result);
                industries.push(industry);
                customIndustries.push(industry);
            }
            
            // Cache custom industries for this user
            this.customIndustriesCache.set(userId, customIndustries);
        } catch (error) {
            console.error('[IndustryManager] Error listing custom industries:', error);
        }

        return industries;
    }

    /**
     * Create custom industry
     * Validates the profile and stores it in the database
     * 
     * @param userId - The user ID
     * @param profile - The industry profile data
     * @returns The created industry profile with ID and timestamps
     * @throws Error if validation fails
     * 
     * @example
     * const industry = await industryManager.createCustomIndustry('user123', {
     *   name: 'Technology',
     *   prioritySkills: ['JavaScript', 'Python'],
     *   powerWords: ['innovative', 'scalable'],
     *   requiredSections: ['summary', 'experience', 'skills']
     * });
     */
    async createCustomIndustry(userId: string, profile: Partial<IndustryProfile>): Promise<IndustryProfile> {
        // Validate required fields
        const validation = this.validateIndustry(profile);
        if (!validation.valid) {
            throw new Error(`Invalid industry profile: ${validation.errors.join(', ')}`);
        }

        const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const customIndustry: IndustryProfile = {
            id,
            name: profile.name || 'Custom Industry',
            requiredSections: profile.requiredSections || ['summary', 'experience', 'skills', 'education'],
            optionalSections: profile.optionalSections || [],
            prioritySkills: profile.prioritySkills || [],
            powerWords: profile.powerWords || [],
            certifications: profile.certifications || [],
            keywords: profile.keywords || [],
            formatPreferences: profile.formatPreferences || {},
            outdatedPractices: profile.outdatedPractices || [],
            isCustom: true,
            userId,
            createdAt: now,
            updatedAt: now
        };

        try {
            const stmt = db.prepare(`
                INSERT INTO custom_industries (
                    id, user_id, name, required_sections, optional_sections,
                    priority_skills, power_words, certifications, keywords,
                    format_preferences, outdated_practices, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                id,
                userId,
                customIndustry.name,
                JSON.stringify(customIndustry.requiredSections),
                JSON.stringify(customIndustry.optionalSections),
                JSON.stringify(customIndustry.prioritySkills),
                JSON.stringify(customIndustry.powerWords),
                JSON.stringify(customIndustry.certifications),
                JSON.stringify(customIndustry.keywords),
                JSON.stringify(customIndustry.formatPreferences),
                JSON.stringify(customIndustry.outdatedPractices),
                now,
                now
            );

            // Invalidate cache for this user
            this.customIndustriesCache.delete(userId);

            console.log(`[IndustryManager] Created custom industry: ${customIndustry.name} for user ${userId}`);
            return customIndustry;
        } catch (error) {
            console.error('[IndustryManager] Error creating custom industry:', error);
            throw error;
        }
    }

    /**
     * Update custom industry
     * Validates the updates and persists them to the database
     * 
     * @param userId - The user ID
     * @param industryId - The industry ID to update
     * @param updates - Partial industry profile with fields to update
     * @returns The updated industry profile
     * @throws Error if industry not found or validation fails
     * 
     * @example
     * const updated = await industryManager.updateCustomIndustry('user123', 'industry-id', {
     *   powerWords: ['innovative', 'scalable', 'efficient']
     * });
     */
    async updateCustomIndustry(userId: string, industryId: string, updates: Partial<IndustryProfile>): Promise<IndustryProfile> {
        // Get existing industry
        const existing = await this.getIndustry(userId, industryId);
        if (!existing || !existing.isCustom) {
            throw new Error('Industry not found or is not custom');
        }

        // Merge updates
        const updated: IndustryProfile = {
            ...existing,
            ...updates,
            id: existing.id,
            userId: existing.userId,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
            isCustom: true
        };

        // Validate
        const validation = this.validateIndustry(updated);
        if (!validation.valid) {
            throw new Error(`Invalid industry profile: ${validation.errors.join(', ')}`);
        }

        try {
            const stmt = db.prepare(`
                UPDATE custom_industries SET
                    name = ?, required_sections = ?, optional_sections = ?,
                    priority_skills = ?, power_words = ?, certifications = ?,
                    keywords = ?, format_preferences = ?, outdated_practices = ?,
                    updated_at = ?
                WHERE id = ? AND user_id = ?
            `);

            stmt.run(
                updated.name,
                JSON.stringify(updated.requiredSections),
                JSON.stringify(updated.optionalSections),
                JSON.stringify(updated.prioritySkills),
                JSON.stringify(updated.powerWords),
                JSON.stringify(updated.certifications),
                JSON.stringify(updated.keywords),
                JSON.stringify(updated.formatPreferences),
                JSON.stringify(updated.outdatedPractices),
                updated.updatedAt,
                industryId,
                userId
            );

            console.log(`[IndustryManager] Updated custom industry: ${updated.name}`);
            return updated;
        } catch (error) {
            console.error('[IndustryManager] Error updating custom industry:', error);
            throw error;
        }
    }

    /**
     * Delete custom industry
     * Removes the industry from the database and invalidates cache
     * 
     * @param userId - The user ID
     * @param industryId - The industry ID to delete
     * @throws Error if deletion fails
     * 
     * @example
     * await industryManager.deleteCustomIndustry('user123', 'industry-id');
     */
    async deleteCustomIndustry(userId: string, industryId: string): Promise<void> {
        try {
            const stmt = db.prepare('DELETE FROM custom_industries WHERE id = ? AND user_id = ?');
            stmt.run(industryId, userId);
            
            // Invalidate cache for this user
            this.customIndustriesCache.delete(userId);
            
            console.log(`[IndustryManager] Deleted custom industry: ${industryId}`);
        } catch (error) {
            console.error('[IndustryManager] Error deleting custom industry:', error);
            throw error;
        }
    }

    /**
     * Validate industry profile
     * Checks that required fields are present and valid
     * 
     * @param profile - The industry profile to validate
     * @returns Validation result with valid flag and error messages
     * 
     * @example
     * const validation = industryManager.validateIndustry(profile);
     * if (!validation.valid) {
     *   console.error('Validation errors:', validation.errors);
     * }
     */
    validateIndustry(profile: Partial<IndustryProfile>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!profile.name || profile.name.trim().length === 0) {
            errors.push('Industry name is required');
        }

        if (!profile.prioritySkills || profile.prioritySkills.length === 0) {
            errors.push('At least one priority skill is required');
        }

        if (profile.name && profile.name.length > 100) {
            errors.push('Industry name must be less than 100 characters');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Parse custom industry from database row
     */
    private parseCustomIndustry(row: any): IndustryProfile {
        return {
            id: row.id,
            name: row.name,
            requiredSections: JSON.parse(row.required_sections || '[]'),
            optionalSections: JSON.parse(row.optional_sections || '[]'),
            prioritySkills: JSON.parse(row.priority_skills || '[]'),
            powerWords: JSON.parse(row.power_words || '[]'),
            certifications: JSON.parse(row.certifications || '[]'),
            keywords: JSON.parse(row.keywords || '[]'),
            formatPreferences: JSON.parse(row.format_preferences || '{}'),
            outdatedPractices: JSON.parse(row.outdated_practices || '[]'),
            isCustom: true,
            userId: row.user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    /**
     * Get predefined industries list
     */
    getPredefinedIndustries(): IndustryProfile[] {
        return Array.from(this.predefinedIndustries.values());
    }

    /**
     * Check if industry exists
     */
    async industryExists(userId: string, industryId: string): Promise<boolean> {
        if (this.predefinedIndustries.has(industryId)) {
            return true;
        }

        try {
            const stmt = db.prepare('SELECT id FROM custom_industries WHERE id = ? AND user_id = ?');
            const result = stmt.get(industryId, userId);
            return !!result;
        } catch (error) {
            return false;
        }
    }
}

export const industryManager = new IndustryManagerService();
