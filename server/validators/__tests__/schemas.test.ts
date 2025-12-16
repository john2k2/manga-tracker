import { describe, it, expect } from 'vitest';
import {
    validate,
    addMangaSchema,
    updateTitleSchema,
    searchSchema,
    updateStatusSchema
} from '../schemas';

describe('API Validators', () => {
    describe('addMangaSchema', () => {
        it('validates correct input', () => {
            const input = {
                url: 'https://mangasite.com/manga/one-piece',
                user_id: '550e8400-e29b-41d4-a716-446655440000'
            };

            const result = validate(addMangaSchema, input);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(input);
        });

        it('rejects invalid URL', () => {
            const input = {
                url: 'not-a-valid-url',
                user_id: '550e8400-e29b-41d4-a716-446655440000'
            };

            const result = validate(addMangaSchema, input);

            expect(result.success).toBe(false);
            expect(result.errors).toContain('url: Invalid URL format');
        });

        it('rejects invalid UUID', () => {
            const input = {
                url: 'https://mangasite.com/manga/one-piece',
                user_id: 'not-a-uuid'
            };

            const result = validate(addMangaSchema, input);

            expect(result.success).toBe(false);
            expect(result.errors?.[0]).toContain('Invalid UUID');
        });

        it('rejects missing fields', () => {
            const input = { url: 'https://mangasite.com' };

            const result = validate(addMangaSchema, input);

            expect(result.success).toBe(false);
        });
    });

    describe('updateTitleSchema', () => {
        it('validates correct input', () => {
            const input = {
                manga_id: '550e8400-e29b-41d4-a716-446655440000',
                user_id: '550e8400-e29b-41d4-a716-446655440001',
                title: 'My Favorite Manga'
            };

            const result = validate(updateTitleSchema, input);

            expect(result.success).toBe(true);
        });

        it('rejects empty title', () => {
            const input = {
                manga_id: '550e8400-e29b-41d4-a716-446655440000',
                user_id: '550e8400-e29b-41d4-a716-446655440001',
                title: ''
            };

            const result = validate(updateTitleSchema, input);

            expect(result.success).toBe(false);
            expect(result.errors?.[0]).toContain('Title cannot be empty');
        });

        it('rejects too long title', () => {
            const input = {
                manga_id: '550e8400-e29b-41d4-a716-446655440000',
                user_id: '550e8400-e29b-41d4-a716-446655440001',
                title: 'A'.repeat(256)
            };

            const result = validate(updateTitleSchema, input);

            expect(result.success).toBe(false);
            expect(result.errors?.[0]).toContain('Title too long');
        });
    });

    describe('searchSchema', () => {
        it('validates correct query', () => {
            const input = { query: 'One Piece' };

            const result = validate(searchSchema, input);

            expect(result.success).toBe(true);
        });

        it('rejects too short query', () => {
            const input = { query: 'A' };

            const result = validate(searchSchema, input);

            expect(result.success).toBe(false);
            expect(result.errors?.[0]).toContain('at least 2 characters');
        });
    });

    describe('updateStatusSchema', () => {
        it('validates correct status', () => {
            const input = {
                manga_id: '550e8400-e29b-41d4-a716-446655440000',
                user_id: '550e8400-e29b-41d4-a716-446655440001',
                status: 'reading'
            };

            const result = validate(updateStatusSchema, input);

            expect(result.success).toBe(true);
        });

        it('rejects invalid status', () => {
            const input = {
                manga_id: '550e8400-e29b-41d4-a716-446655440000',
                user_id: '550e8400-e29b-41d4-a716-446655440001',
                status: 'invalid_status'
            };

            const result = validate(updateStatusSchema, input);

            expect(result.success).toBe(false);
        });

        it('accepts all valid statuses', () => {
            const validStatuses = ['reading', 'completed', 'plan_to_read', 'dropped', 'on_hold'];

            validStatuses.forEach(status => {
                const input = {
                    manga_id: '550e8400-e29b-41d4-a716-446655440000',
                    user_id: '550e8400-e29b-41d4-a716-446655440001',
                    status
                };

                const result = validate(updateStatusSchema, input);
                expect(result.success).toBe(true);
            });
        });
    });
});
