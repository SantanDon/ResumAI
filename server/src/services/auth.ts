import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'resumai-secret-key-change-in-production';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface User {
    id: string;
    email: string;
    name: string;
    picture: string;
}

export interface AuthResult {
    success: boolean;
    user?: User;
    token?: string;
    error?: string;
}

class AuthService {
    /**
     * Verify Google OAuth token and create/update user
     */
    async verifyGoogleToken(credential: string): Promise<AuthResult> {
        try {
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            if (!payload) {
                return { success: false, error: 'Invalid token payload' };
            }

            const { sub: googleId, email, name, picture } = payload;

            if (!email) {
                return { success: false, error: 'Email not provided' };
            }

            // Create or update user in database
            const user = this.upsertUser({
                id: googleId!,
                email,
                name: name || email.split('@')[0],
                picture: picture || ''
            });

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            return { success: true, user, token };
        } catch (error) {
            console.error('Google auth error:', error);
            return { success: false, error: 'Authentication failed' };
        }
    }

    /**
     * Verify JWT token from request
     */
    verifyToken(token: string): { userId: string; email: string } | null {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
            return decoded;
        } catch {
            return null;
        }
    }

    /**
     * Create or update user in database
     */
    private upsertUser(user: User): User {
        const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as User | undefined;

        if (existing) {
            db.prepare(`
                UPDATE users SET name = ?, picture = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?
            `).run(user.name, user.picture, user.id);
        } else {
            db.prepare(`
                INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)
            `).run(user.id, user.email, user.name, user.picture);
        }

        return user;
    }

    /**
     * Get user by ID
     */
    getUser(userId: string): User | null {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
        return user || null;
    }

    /**
     * Get user's CVs
     */
    getUserCVs(userId: string): any[] {
        return db.prepare(`
            SELECT id, name, template, is_master, created_at, updated_at 
            FROM user_cvs WHERE user_id = ? ORDER BY updated_at DESC
        `).all(userId) as any[];
    }

    /**
     * Get specific CV
     */
    getCV(cvId: string, userId: string): any | null {
        return db.prepare(`
            SELECT * FROM user_cvs WHERE id = ? AND user_id = ?
        `).get(cvId, userId) as any | undefined || null;
    }

    /**
     * Save CV for user
     */
    saveCV(userId: string, cvData: any, name: string = 'My CV', template: string = 'harvard', cvId?: string): string {
        const id = cvId || `cv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const dataJson = JSON.stringify(cvData);

        if (cvId) {
            // Update existing
            db.prepare(`
                UPDATE user_cvs SET cv_data = ?, name = ?, template = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            `).run(dataJson, name, template, cvId, userId);
        } else {
            // Insert new
            db.prepare(`
                INSERT INTO user_cvs (id, user_id, name, cv_data, template) VALUES (?, ?, ?, ?, ?)
            `).run(id, userId, name, dataJson, template);
        }

        return id;
    }

    /**
     * Delete CV
     */
    deleteCV(cvId: string, userId: string): boolean {
        const result = db.prepare('DELETE FROM user_cvs WHERE id = ? AND user_id = ?').run(cvId, userId);
        return result.changes > 0;
    }

    /**
     * Set CV as master
     */
    setMasterCV(cvId: string, userId: string): void {
        // Unset all master CVs for user
        db.prepare('UPDATE user_cvs SET is_master = 0 WHERE user_id = ?').run(userId);
        // Set this one as master
        db.prepare('UPDATE user_cvs SET is_master = 1 WHERE id = ? AND user_id = ?').run(cvId, userId);
    }
}

export const authService = new AuthService();
