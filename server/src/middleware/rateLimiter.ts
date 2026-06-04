/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and controls LLM API costs
 */

import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

// ============================================
// RATE LIMITER CONFIGURATION
// ============================================

// Standard error response format
const createErrorMessage = (message: string) => ({
    success: false,
    error: message,
    retryAfter: 'See Retry-After header'
});

// ============================================
// GENERAL API LIMITER
// ============================================
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: createErrorMessage('Too many requests. Please try again in a few minutes.'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        // Use user ID if available, otherwise fall back to IP
        return req.headers['x-user-id'] as string || req.ip || 'anonymous';
    },
});

// ============================================
// CV GENERATION LIMITER (Expensive LLM calls)
// ============================================
export const cvGenerationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // 15 CV generations per hour (protects HF API costs)
    message: createErrorMessage('CV generation limit reached. You can generate 15 CVs per hour. Please try again later.'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        return req.headers['x-user-id'] as string || req.ip || 'anonymous';
    },
    skip: (req: Request) => {
        // Skip rate limiting for GET requests (reading existing CVs)
        return req.method === 'GET';
    },
});

// ============================================
// CV OPERATIONS LIMITER (General CV endpoints)
// ============================================
export const cvLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 CV operations per hour
    message: createErrorMessage('Too many CV operations. Please try again later.'),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
        // Allow unlimited reads
        return req.method === 'GET' || req.path.includes('/master');
    },
});

// ============================================
// CHAT LIMITER
// ============================================
export const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 messages per minute
    message: createErrorMessage('Slow down! You can send 20 messages per minute.'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        return req.headers['x-user-id'] as string || req.ip || 'anonymous';
    },
});

// ============================================
// COVER LETTER LIMITER
// ============================================
export const coverLetterLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 cover letters per hour
    message: createErrorMessage('Cover letter generation limit reached. Please try again later.'),
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================
// AUTH LIMITER (Strict for security)
// ============================================
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per 15 minutes
    message: createErrorMessage('Too many login attempts. Please wait 15 minutes.'),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

// ============================================
// FILE UPLOAD LIMITER
// ============================================
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: createErrorMessage('Upload limit reached. You can upload 10 files per hour.'),
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================
// EXPORT LIMITER (PDF generation is resource-intensive)
// ============================================
export const exportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // 30 exports per hour
    message: createErrorMessage('Export limit reached. Please try again later.'),
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================
// HELPER: Check if request is rate limited
// ============================================
export const isRateLimited = (req: Request): boolean => {
    return (req as any).rateLimit?.remaining === 0;
};

// ============================================
// REMOVED: Mail and Job limiters (features removed)
// ============================================
// mailLimiter - REMOVED (email feature removed)
// jobLimiter - REMOVED (mass apply feature removed)
