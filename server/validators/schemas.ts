import { z } from 'zod';

// ============================================================================
// Base Validators
// ============================================================================

const uuidSchema = z.string().uuid('Invalid UUID format');

const urlSchema = z.string().url('Invalid URL format').refine(
    (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    { message: 'URL must be a valid web address' }
);

const readingStatusSchema = z.enum([
    'reading',
    'completed',
    'plan_to_read',
    'dropped',
    'on_hold'
]);

const issueTypeSchema = z.enum([
    'wrong_chapters',
    'wrong_cover',
    'wrong_title',
    'site_blocked',
    'other'
]);

// ============================================================================
// Request Validators
// ============================================================================

export const addMangaSchema = z.object({
    url: urlSchema,
    user_id: uuidSchema
});

export const deleteMangaSchema = z.object({
    manga_id: uuidSchema,
    user_id: uuidSchema
});

export const updateCoverSchema = z.object({
    manga_id: uuidSchema,
    user_id: uuidSchema,
    cover_url: urlSchema
});

export const updateTitleSchema = z.object({
    manga_id: uuidSchema,
    user_id: uuidSchema,
    title: z.string().min(1, 'Title cannot be empty').max(255, 'Title too long')
});

export const updateStatusSchema = z.object({
    manga_id: uuidSchema,
    user_id: uuidSchema,
    status: readingStatusSchema
});

export const searchSchema = z.object({
    query: z.string().min(2, 'Query must be at least 2 characters').max(200, 'Query too long')
});

export const reportIssueSchema = z.object({
    manga_id: uuidSchema,
    user_id: uuidSchema,
    issue_type: issueTypeSchema,
    description: z.string().max(1000, 'Description too long').optional()
});

export const pushSubscriptionSchema = z.object({
    user_id: uuidSchema,
    subscription: z.object({
        endpoint: z.string().url(),
        keys: z.object({
            p256dh: z.string().min(1),
            auth: z.string().min(1)
        })
    })
});

// ============================================================================
// Query Validators
// ============================================================================

export const listMangasQuerySchema = z.object({
    user_id: uuidSchema
});

export const mangaIdParamSchema = z.object({
    id: uuidSchema
});

// ============================================================================
// Inferred Types (for use in handlers)
// ============================================================================

export type AddMangaInput = z.infer<typeof addMangaSchema>;
export type DeleteMangaInput = z.infer<typeof deleteMangaSchema>;
export type UpdateCoverInput = z.infer<typeof updateCoverSchema>;
export type UpdateTitleInput = z.infer<typeof updateTitleSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ReportIssueInput = z.infer<typeof reportIssueSchema>;
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

// ============================================================================
// Validation Helper
// ============================================================================

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: string[];
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.issues.map((err) => {
        const path = String(err.path.join('.'));
        return path ? `${path}: ${err.message}` : err.message;
    });

    return { success: false, errors };
}

/**
 * Express middleware factory for request validation
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
    return (req: { body: unknown }, res: { status: (code: number) => { json: (data: unknown) => void } }, next: () => void) => {
        const result = validate(schema, req.body);

        if (!result.success) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: result.errors
            });
            return;
        }

        req.body = result.data;
        next();
    };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
    return (req: { query: unknown }, res: { status: (code: number) => { json: (data: unknown) => void } }, next: () => void) => {
        const result = validate(schema, req.query);

        if (!result.success) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: result.errors
            });
            return;
        }

        req.query = result.data as typeof req.query;
        next();
    };
}
