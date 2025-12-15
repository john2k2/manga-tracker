import type { Request, Response } from 'express';
import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { scrapeManga, searchManga } from '../services/scraper.js';
import {
  validateBody,
  validateQuery,
  addMangaSchema,
  deleteMangaSchema,
  updateCoverSchema,
  updateTitleSchema,
  updateStatusSchema,
  searchSchema,
  listMangasQuerySchema,
  type AddMangaInput,
  type DeleteMangaInput,
  type UpdateCoverInput,
  type UpdateTitleInput,
  type UpdateStatusInput,
  type SearchInput
} from '../validators/schemas.js';

const router = Router();
const log = logger.child({ service: 'manga-routes' });

// ============================================================================
// Types
// ============================================================================

interface MangaRow {
  id: string;
  url: string;
  title: string;
  cover_image: string | null;
}

interface ChapterRow {
  number: number;
  url: string;
  release_date: string | null;
}

interface UserMangaSettingsRow {
  manga_id: string;
  notifications_enabled: boolean;
  last_read_chapter: number | null;
  reading_status: 'reading' | 'completed' | 'plan_to_read' | 'dropped' | 'on_hold';
  custom_title: string | null;
  custom_cover: string | null;
  mangas: MangaRow & { chapters: ChapterRow[] | null };
}

// ============================================================================
// Routes
// ============================================================================

// Search manga
router.post('/search', validateBody(searchSchema), async (req: Request, res: Response) => {
  const { query } = req.body as SearchInput;

  try {
    log.info('Search request', { query });
    const results = await searchManga(query);
    res.json({ results });
  } catch (error: unknown) {
    log.error('Search error', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ error: 'Search failed' });
  }
});

// Add manga
router.post('/add', validateBody(addMangaSchema), async (req: Request, res: Response) => {
  const { url, user_id } = req.body as AddMangaInput;

  try {
    log.info('Add manga request', { url, userId: user_id });

    // 1. Check if manga exists
    const { data: mangaData, error: fetchError } = await supabase
      .from('mangas')
      .select('*')
      .eq('url', url)
      .single();

    let manga = mangaData as MangaRow | null;

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Force re-scrape to get latest data
    log.debug('Scraping manga', { url });
    const scrapedData = await scrapeManga(url);

    // 3. Insert or Update manga
    const { data: newManga, error: mangaError } = await supabase.from('mangas').upsert({
      ...(manga ? { id: manga.id } : {}),
      title: scrapedData.title,
      url: url,
      cover_image: scrapedData.cover_url,
      source: new URL(url).hostname,
      updated_at: new Date().toISOString()
    }, { onConflict: 'url' }).select().single();

    if (mangaError) throw mangaError;
    if (!newManga) throw new Error('Failed to create/update manga');
    manga = newManga;

    // 4. Insert chapters
    if (scrapedData.chapters.length > 0) {
      const chaptersToInsert = scrapedData.chapters.map(c => ({
        manga_id: manga!.id,
        number: c.number,
        title: c.title,
        url: c.url,
        release_date: c.release_date || new Date().toISOString()
      }));

      const { error: chapterError } = await supabase
        .from('chapters')
        .upsert(chaptersToInsert, { onConflict: 'manga_id, number' });

      if (chapterError) {
        log.warn('Error inserting chapters', { mangaId: manga!.id, error: chapterError });
      }
    }

    // 5. Link to user
    const { error: linkError } = await supabase.from('user_manga_settings').upsert({
      user_id: user_id,
      manga_id: manga!.id,
      notifications_enabled: true
    }, { onConflict: 'user_id, manga_id' });

    if (linkError) throw linkError;

    log.info('Manga added successfully', {
      mangaId: manga!.id,
      title: scrapedData.title,
      chapters: scrapedData.chapters.length
    });

    res.json({ success: true, manga });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Add manga failed', err, { url });
    res.status(500).json({ error: err.message });
  }
});

// List mangas
router.get('/list', validateQuery(listMangasQuerySchema), async (req: Request, res: Response) => {
  const { user_id } = req.query as { user_id: string };

  try {
    const { data, error } = await supabase
      .from('user_manga_settings')
      .select(`
        manga_id,
        notifications_enabled,
        last_read_chapter,
        reading_status,
        custom_title,
        custom_cover,
        mangas (
          id,
          title,
          cover_image,
          url,
          updated_at,
          chapters (
            number,
            url,
            release_date
          )
        )
      `)
      .eq('user_id', user_id);

    if (error) throw error;

    const rows = (data ?? []) as unknown as UserMangaSettingsRow[];

    const mangas = rows.map((item) => ({
      ...item.mangas,
      title: item.custom_title || item.mangas.title,
      cover_image: item.custom_cover || item.mangas.cover_image,
      chapters: item.mangas.chapters
        ? item.mangas.chapters.slice().sort((a, b) => b.number - a.number).slice(0, 4)
        : [],
      settings: {
        notifications_enabled: item.notifications_enabled,
        last_read_chapter: item.last_read_chapter,
        reading_status: item.reading_status
      }
    }));

    res.json({ mangas });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('List mangas failed', err, { userId: user_id });
    res.status(500).json({ error: err.message });
  }
});

// Get Manga Details
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data: manga, error: mangaError } = await supabase
      .from('mangas')
      .select('*')
      .eq('id', id)
      .single();

    if (mangaError) throw mangaError;

    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('*')
      .eq('manga_id', id)
      .order('number', { ascending: false });

    if (chaptersError) throw chaptersError;

    res.json({ ...manga, chapters });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Get manga details failed', err, { mangaId: id });
    res.status(500).json({ error: err.message });
  }
});

// Delete manga
router.delete('/delete', validateBody(deleteMangaSchema), async (req: Request, res: Response) => {
  const { manga_id, user_id } = req.body as DeleteMangaInput;

  try {
    const { error } = await supabase
      .from('user_manga_settings')
      .delete()
      .eq('user_id', user_id)
      .eq('manga_id', manga_id);

    if (error) throw error;

    log.info('Manga deleted', { mangaId: manga_id, userId: user_id });
    res.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Delete manga failed', err, { mangaId: manga_id });
    res.status(500).json({ error: err.message });
  }
});

// Update manga cover manually (Personalized)
router.post('/update-cover', validateBody(updateCoverSchema), async (req: Request, res: Response) => {
  const { manga_id, user_id, cover_url } = req.body as UpdateCoverInput;

  try {
    const { error } = await supabase
      .from('user_manga_settings')
      .update({ custom_cover: cover_url })
      .eq('user_id', user_id)
      .eq('manga_id', manga_id);

    if (error) throw error;

    log.info('Cover updated', { mangaId: manga_id, userId: user_id });
    res.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Update cover failed', err, { mangaId: manga_id });
    res.status(500).json({ error: err.message });
  }
});

// Update manga title manually (Personalized)
router.post('/update-title', validateBody(updateTitleSchema), async (req: Request, res: Response) => {
  const { manga_id, user_id, title } = req.body as UpdateTitleInput;

  try {
    const { error } = await supabase
      .from('user_manga_settings')
      .update({ custom_title: title })
      .eq('user_id', user_id)
      .eq('manga_id', manga_id);

    if (error) throw error;

    log.info('Title updated', { mangaId: manga_id, userId: user_id });
    res.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Update title failed', err, { mangaId: manga_id });
    res.status(500).json({ error: err.message });
  }
});

// Update reading status
router.post('/update-status', validateBody(updateStatusSchema), async (req: Request, res: Response) => {
  const { manga_id, user_id, status } = req.body as UpdateStatusInput;

  try {
    const { error } = await supabase
      .from('user_manga_settings')
      .update({ reading_status: status })
      .eq('user_id', user_id)
      .eq('manga_id', manga_id);

    if (error) throw error;

    log.info('Status updated', { mangaId: manga_id, userId: user_id, status });
    res.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error('Update status failed', err, { mangaId: manga_id });
    res.status(500).json({ error: err.message });
  }
});

export default router;
