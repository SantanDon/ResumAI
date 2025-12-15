/**
 * CV Version Manager Service
 * Manages CV versions and exports
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */

import { db } from '../db';

export interface CVVersion {
    id: string;
    userId: string;
    masterCvId: string;
    tailoredCvId?: string;
    name: string;
    company?: string;
    jobTitle?: string;
    matchScore?: number;
    createdAt: string;
    updatedAt: string;
}

class CVVersionManager {
    /**
     * Save a CV version
     */
    save(data: {
        userId: string;
        masterCvId: string;
        tailoredCvId?: string;
        name: string;
        company?: string;
        jobTitle?: string;
        matchScore?: number;
    }): CVVersion {
        const id = `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO tailored_cvs (id, user_id, job_description, tailored_content, match_score, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            data.userId,
            data.company || '',
            JSON.stringify({ name: data.name, jobTitle: data.jobTitle }),
            data.matchScore || 0,
            'draft',
            now
        );

        return {
            id,
            userId: data.userId,
            masterCvId: data.masterCvId,
            tailoredCvId: data.tailoredCvId,
            name: data.name,
            company: data.company,
            jobTitle: data.jobTitle,
            matchScore: data.matchScore,
            createdAt: now,
            updatedAt: now
        };
    }

    /**
     * Get a CV version by ID
     */
    get(cvId: string): CVVersion | null {
        const cv = db.prepare('SELECT * FROM tailored_cvs WHERE id = ?').get(cvId) as any;
        if (!cv) return null;

        let parsed: any = {};
        try {
            parsed = JSON.parse(cv.tailored_content || '{}');
        } catch {}

        return {
            id: cv.id,
            userId: cv.user_id,
            masterCvId: cv.user_id,
            name: parsed.name || cv.job_description,
            company: cv.job_description,
            jobTitle: parsed.jobTitle,
            matchScore: cv.match_score,
            createdAt: cv.created_at,
            updatedAt: cv.created_at
        };
    }

    /**
     * List all CV versions for a user
     */
    list(userId: string): CVVersion[] {
        const cvs = db.prepare(`
            SELECT * FROM tailored_cvs WHERE user_id = ? ORDER BY created_at DESC
        `).all(userId) as any[];

        return cvs.map(cv => {
            let parsed: any = {};
            try {
                parsed = JSON.parse(cv.tailored_content || '{}');
            } catch {}

            return {
                id: cv.id,
                userId: cv.user_id,
                masterCvId: cv.user_id,
                name: parsed.name || `CV for ${cv.job_description}`,
                company: cv.job_description,
                jobTitle: parsed.jobTitle,
                matchScore: cv.match_score,
                createdAt: cv.created_at,
                updatedAt: cv.created_at
            };
        });
    }

    /**
     * Delete a CV version
     */
    delete(cvId: string): boolean {
        const result = db.prepare('DELETE FROM tailored_cvs WHERE id = ?').run(cvId);
        return result.changes > 0;
    }

    /**
     * Generate PDF filename in standard format
     * Format: "{Name}_{Company}_{Date}.pdf"
     */
    generatePdfFilename(name: string, company: string, date?: Date): string {
        const d = date || new Date();
        const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
        
        // Sanitize name and company for filename
        const sanitize = (str: string) => str
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);

        const safeName = sanitize(name) || 'CV';
        const safeCompany = sanitize(company) || 'Company';

        return `${safeName}_${safeCompany}_${dateStr}.pdf`;
    }

    /**
     * Duplicate a CV version
     */
    duplicate(cvId: string, newName?: string): CVVersion | null {
        const original = this.get(cvId);
        if (!original) return null;

        return this.save({
            userId: original.userId,
            masterCvId: original.masterCvId,
            tailoredCvId: original.tailoredCvId,
            name: newName || `${original.name} (Copy)`,
            company: original.company,
            jobTitle: original.jobTitle,
            matchScore: original.matchScore
        });
    }
}

export const cvVersionManager = new CVVersionManager();
