import type { Request, Response } from 'express';
import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { scrapeManga } from '../services/scraper.js';

const router = Router();

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
  custom_title: string | null;
  custom_cover: string | null;
  mangas: MangaRow & { chapters: ChapterRow[] | null };
}

// Add manga
router.post('/add', async (req: Request, res: Response) => {
  const { url, user_id } = req.body;
  
  if (!url || !user_id) {
    res.status(400).json({ error: 'URL and user_id are required' });
    return;
  }

  try {
    // 1. Check if manga exists
    const { data: mangaData, error: fetchError } = await supabase.from('mangas').select('*').eq('url', url).single();
    let manga = mangaData as MangaRow | null;

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
       throw fetchError;
    }

    // Force re-scrape if manga exists but user is re-adding it (assuming they want to update)
    // Or if it's new.
    console.log('Scraping manga data...');
    const scrapedData = await scrapeManga(url);
    
    // 3. Insert or Update manga
    const { data: newManga, error: mangaError } = await supabase.from('mangas').upsert({
      ...(manga ? { id: manga.id } : {}), // If exists, preserve ID
      title: scrapedData.title,
      url: url,
      cover_image: scrapedData.cover_url,
      source: new URL(url).hostname,
      updated_at: new Date().toISOString()
    }, { onConflict: 'url' }).select().single();
    
    if (mangaError) throw mangaError;
    manga = newManga;

    // 4. Insert chapters
    if (scrapedData.chapters.length > 0) {
       const chaptersToInsert = scrapedData.chapters.map(c => ({
         manga_id: manga.id,
         number: c.number,
         title: c.title,
         url: c.url,
         release_date: c.release_date || new Date().toISOString()
       }));
       
       // Use upsert to avoid conflicts
       const { error: chapterError } = await supabase.from('chapters').upsert(chaptersToInsert, { onConflict: 'manga_id, number' });
       if (chapterError) console.error('Error inserting chapters:', chapterError);
    }

    // 5. Link to user
    const { error: linkError } = await supabase.from('user_manga_settings').upsert({
      user_id: user_id,
      manga_id: manga.id,
      notifications_enabled: true
    }, { onConflict: 'user_id, manga_id' });

    if (linkError) throw linkError;

    res.json({ success: true, manga });

  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// List mangas
router.get('/list', async (req: Request, res: Response) => {
  const { user_id } = req.query;
  if (!user_id) {
    res.status(400).json({ error: 'user_id is required' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('user_manga_settings')
      .select(`
        manga_id,
        notifications_enabled,
        last_read_chapter,
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
      // Prefer custom settings over global ones
      title: item.custom_title || item.mangas.title,
      cover_image: item.custom_cover || item.mangas.cover_image,
      chapters: item.mangas.chapters ? item.mangas.chapters.slice().sort((a, b) => b.number - a.number).slice(0, 4) : [],
      settings: {
        notifications_enabled: item.notifications_enabled,
        last_read_chapter: item.last_read_chapter
      }
    }));

    res.json({ mangas });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
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
        if (error instanceof Error) {
          res.status(500).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Unknown error' });
        }
    }
});

// Delete manga
router.delete('/delete', async (req: Request, res: Response) => {
  const { manga_id, user_id } = req.body;

  if (!manga_id || !user_id) {
    res.status(400).json({ error: 'manga_id and user_id are required' });
    return;
  }

  try {
    const { error } = await supabase
      .from('user_manga_settings')
      .delete()
      .eq('user_id', user_id)
      .eq('manga_id', manga_id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting manga:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// Update manga cover manually (Personalized)
router.post('/update-cover', async (req: Request, res: Response) => {
    const { manga_id, user_id, cover_url } = req.body;

    if (!manga_id || !user_id || !cover_url) {
        res.status(400).json({ error: 'manga_id, user_id, and cover_url are required' });
        return;
    }

    try {
        const { error } = await supabase
            .from('user_manga_settings')
            .update({ custom_cover: cover_url })
            .eq('user_id', user_id)
            .eq('manga_id', manga_id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: unknown) {
        console.error('Error updating cover:', error);
        if (error instanceof Error) {
          res.status(500).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Unknown error' });
        }
    }
});

// Update manga title manually (Personalized)
router.post('/update-title', async (req: Request, res: Response) => {
    const { manga_id, user_id, title } = req.body;

    if (!manga_id || !user_id || !title) {
        res.status(400).json({ error: 'manga_id, user_id, and title are required' });
        return;
    }

    try {
        const { error } = await supabase
            .from('user_manga_settings')
            .update({ custom_title: title })
            .eq('user_id', user_id)
            .eq('manga_id', manga_id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: unknown) {
        console.error('Error updating title:', error);
        if (error instanceof Error) {
          res.status(500).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Unknown error' });
        }
    }
});

export default router;
