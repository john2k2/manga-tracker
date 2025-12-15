/**
 * Database Types - Generated from Supabase schema
 * Use `npx supabase gen types typescript --project-id YOUR_PROJECT_ID` to regenerate
 */

// ============================================================================
// Core Entities
// ============================================================================

export interface User {
    id: string;
    email: string | null;
    created_at: string;
    last_login: string | null;
    notification_token: string | null;
}

export interface Manga {
    id: string;
    title: string;
    url: string;
    cover_image: string | null;
    source: string | null;
    created_at: string;
    updated_at: string;
}

export interface Chapter {
    id: string;
    manga_id: string;
    number: number;
    title: string | null;
    url: string;
    release_date: string | null;
    created_at: string;
}

export interface UserMangaSettings {
    id: string;
    user_id: string;
    manga_id: string;
    notifications_enabled: boolean;
    last_read_chapter: number | null;
    reading_status: ReadingStatus;
    custom_title: string | null;
    custom_cover: string | null;
    created_at: string;
}

export interface DomainConfig {
    domain: string;
    strategy: 'DIRECT_FETCH' | 'FIRECRAWL';
    last_success_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    manga_id: string;
    chapter_id: string;
    sent: boolean;
    sent_at: string | null;
    created_at: string;
}

export interface ScrapeIssue {
    id: string;
    manga_id: string;
    user_id: string;
    issue_type: IssueType;
    description: string | null;
    status: IssueStatus;
    created_at: string;
    resolved_at: string | null;
}

// ============================================================================
// Enums
// ============================================================================

export type ReadingStatus =
    | 'reading'
    | 'completed'
    | 'plan_to_read'
    | 'dropped'
    | 'on_hold';

export type IssueType =
    | 'wrong_chapters'
    | 'wrong_cover'
    | 'wrong_title'
    | 'site_blocked'
    | 'other';

export type IssueStatus =
    | 'pending'
    | 'investigating'
    | 'resolved'
    | 'wont_fix';

export type ScrapingStrategy = 'DIRECT_FETCH' | 'FIRECRAWL';

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Manga API
export interface AddMangaRequest {
    url: string;
    user_id: string;
}

export interface AddMangaResponse {
    success: boolean;
    manga: Manga;
}

export interface ListMangasResponse {
    mangas: MangaWithSettings[];
}

export interface MangaWithSettings extends Manga {
    chapters: Chapter[];
    settings: {
        notifications_enabled: boolean;
        last_read_chapter: number | null;
        reading_status: ReadingStatus;
    };
}

export interface UpdateCoverRequest {
    manga_id: string;
    user_id: string;
    cover_url: string;
}

export interface UpdateTitleRequest {
    manga_id: string;
    user_id: string;
    title: string;
}

export interface UpdateStatusRequest {
    manga_id: string;
    user_id: string;
    status: ReadingStatus;
}

export interface DeleteMangaRequest {
    manga_id: string;
    user_id: string;
}

// Search API
export interface SearchRequest {
    query: string;
}

export interface SearchResult {
    title: string;
    url: string;
    description?: string;
}

export interface SearchResponse {
    results: SearchResult[];
}

// Scrape API
export interface ScrapedChapter {
    number: number;
    title: string;
    url: string;
    release_date?: string;
}

export interface ScrapedManga {
    title: string;
    cover_url: string;
    chapters: ScrapedChapter[];
}

// Report Issue API
export interface ReportIssueRequest {
    user_id: string;
    manga_id: string;
    issue_type: IssueType;
    description?: string;
}

// Push Notification API
export interface PushSubscriptionRequest {
    user_id: string;
    subscription: PushSubscriptionJSON;
}

export interface PushSubscriptionJSON {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Frontend-specific Types  
// ============================================================================

export interface MangaCardProps {
    manga: MangaWithSettings;
    onDelete: (id: string) => void;
    onReport: (id: string) => void;
    onUpdateCover: (id: string, newUrl: string) => Promise<void>;
    onUpdateTitle: (id: string, newTitle: string) => Promise<void>;
    onUpdateStatus: (id: string, status: ReadingStatus) => Promise<void>;
}

export interface StatusConfig {
    label: string;
    icon: LucideIcon;
    bg: string;
    text: string;
    hover: string;
}

export type StatusConfigMap = Record<ReadingStatus, StatusConfig>;

// ============================================================================
// Utility Types
// ============================================================================

/** Make all properties of T optional and nullable */
export type Nullable<T> = {
    [P in keyof T]: T[P] | null;
};

/** Extract the data type from an ApiResponse */
export type ExtractData<T> = T extends ApiResponse<infer U> ? U : never;

/** Omit id and timestamps from entity for creation */
export type CreateInput<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

/** Partial update input */
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'created_at'>>;
