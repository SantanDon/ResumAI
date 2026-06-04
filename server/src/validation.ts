/**
 * Input Validation Schemas
 * Uses Zod for type-safe validation with sanitization
 */

import { z } from 'zod';

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Basic HTML/script sanitization
 * Removes potential XSS vectors
 */
export const sanitizeInput = (input: string): string => {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
};

/**
 * Transform that sanitizes string inputs
 */
const sanitizedString = (min: number, max: number, message: string) => 
    z.string()
        .min(min, message)
        .max(max, `Input too long (max ${max} characters)`)
        .transform(sanitizeInput);

// ============================================
// CV SCHEMAS
// ============================================

export const cvAnalyzeSchema = z.object({
    text: z.string()
        .min(100, 'CV text must be at least 100 characters')
        .max(50000, 'CV text too long (max 50,000 characters)')
        .transform(sanitizeInput),
});

export const cvTailorSchema = z.object({
    cvContent: z.string()
        .min(100, 'CV content required')
        .max(50000, 'CV content too long')
        .transform(sanitizeInput),
    jobDescription: z.string()
        .min(50, 'Job description must be at least 50 characters')
        .max(15000, 'Job description too long')
        .transform(sanitizeInput),
    jobTitle: z.string()
        .min(2, 'Job title required')
        .max(150, 'Job title too long')
        .transform(sanitizeInput),
    company: z.string()
        .min(1, 'Company name required')
        .max(150, 'Company name too long')
        .transform(sanitizeInput),
});

// ============================================
// JOB DESCRIPTION SCHEMA
// ============================================

export const jobDescriptionSchema = z.object({
    jobTitle: sanitizedString(2, 150, 'Job title required'),
    company: sanitizedString(1, 150, 'Company name required'),
    description: sanitizedString(100, 15000, 'Job description must be at least 100 characters'),
});

// ============================================
// CV GENERATION SCHEMAS
// ============================================

export const cvGenerationRequestSchema = z.object({
    userId: z.string()
        .min(1, 'User ID required')
        .max(100, 'User ID too long'),
    jobDescription: jobDescriptionSchema,
    includesCoverLetter: z.boolean().default(true),
    cvType: z.enum(['master', 'mini', 'both']).default('both'),
});

// ============================================
// COVER LETTER SCHEMA
// ============================================

export const coverLetterRequestSchema = z.object({
    userId: z.string()
        .min(1, 'User ID required')
        .max(100, 'User ID too long'),
    jobTitle: sanitizedString(2, 150, 'Job title required'),
    company: sanitizedString(1, 150, 'Company name required'),
    jobDescription: sanitizedString(50, 15000, 'Job description required'),
    tone: z.enum(['professional', 'casual', 'confident']).default('professional'),
});

// ============================================
// CHAT SCHEMAS
// ============================================

export const chatMessageSchema = z.object({
    userId: z.string()
        .min(1, 'User ID required')
        .max(100, 'User ID too long'),
    message: sanitizedString(1, 2000, 'Message required'),
    conversationId: z.string().optional(),
});

export const cvChatSchema = z.object({
    userId: z.string()
        .min(1, 'User ID required')
        .max(100, 'User ID too long'),
    message: sanitizedString(1, 2000, 'Message required'),
    context: z.string().optional(),
});

// ============================================
// CV ENHANCEMENT SCHEMA
// ============================================

export const cvEnhancementSchema = z.object({
    userId: z.string()
        .min(1, 'User ID required')
        .max(100, 'User ID too long'),
    targetIndustry: z.string().optional(),
    focusAreas: z.array(z.string()).optional(),
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const emailSchema = z.string()
    .email('Invalid email format')
    .max(254, 'Email too long');

export const googleAuthSchema = z.object({
    credential: z.string().min(1, 'Credential required'),
});

// ============================================
// FILE UPLOAD VALIDATION
// ============================================

export const fileUploadSchema = z.object({
    mimetype: z.string().refine(val => 
        ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(val),
        { message: 'Invalid file type. Allowed: PDF, DOC, DOCX, TXT' }
    ),
    size: z.number()
        .max(10 * 1024 * 1024, 'File too large. Maximum size is 10MB'),
});

// ============================================
// VALIDATION HELPER
// ============================================

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    errors?: Record<string, string>;
}

/**
 * Validate data against a schema
 */
export const validate = <T extends z.ZodTypeAny>(
    schema: T, 
    data: unknown
): ValidationResult<z.infer<T>> => {
    try {
        const result = schema.parse(data);
        return { success: true, data: result };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors: Record<string, string> = {};
            const messages: string[] = [];
            
            for (const issue of error.issues) {
                const path = issue.path.join('.') || 'input';
                errors[path] = issue.message;
                messages.push(`${path}: ${issue.message}`);
            }
            
            return { 
                success: false, 
                error: messages.join('; '),
                errors
            };
        }
        return { success: false, error: 'Validation failed' };
    }
};

/**
 * Validate and throw if invalid (for middleware use)
 */
export const validateOrThrow = <T extends z.ZodTypeAny>(
    schema: T, 
    data: unknown
): z.infer<T> => {
    const result = validate(schema, data);
    if (!result.success) {
        throw new Error(result.error);
    }
    if (!result.data) {
        throw new Error('Validation returned no data');
    }
    return result.data as z.infer<T>;
};

// ============================================
// REMOVED SCHEMAS (Features Removed)
// ============================================
// cooldownCheckSchema - REMOVED (email feature removed)
// emailGenerationSchema - REMOVED (email feature removed)
// emailSendingSchema - REMOVED (email feature removed)
