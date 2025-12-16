import cron from 'node-cron';
import webpush from 'web-push';
import { supabase } from '../lib/supabase.js';
import { scrapeManga } from './scraper.js';
import { logger } from '../lib/logger.js';
import type { ScrapedChapter } from './scraper.js';

// Create child logger for scheduler context
const log = logger.child({ service: 'scheduler' });

export function startScheduler() {
  log.info('Scheduler starting', { interval: 'every 6 hours' });

  // Schedule task to run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    log.info('Scheduled update check triggered');
    await checkAllMangas();
  });
}

interface MangaSettings {
  reading_status: string;
}

interface MangaChapter {
  release_date: string;
}

interface SchedulerManga {
  id: string;
  title: string;
  url: string;
  chapters: MangaChapter[];
  user_manga_settings: MangaSettings[];
}

// Result type for update operations
export interface UpdateResult {
  total: number;
  checked: number;
  updated: number;
  skipped: number;
  failed: number;
  updatedMangas: { id: string; title: string; newChaptersCount: number }[];
  durationMs: number;
}

export async function checkAllMangas(): Promise<UpdateResult> {
  const startTime = Date.now();
  logger.scheduler.start('checkAllMangas');

  const result: UpdateResult = {
    total: 0,
    checked: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    updatedMangas: [],
    durationMs: 0
  };

  try {
    const { data: mangas, error } = await supabase
      .from('mangas')
      .select(`
        id, 
        url, 
        title, 
        chapters(release_date),
        user_manga_settings(reading_status)
      `);

    if (error) {
      log.error('Error fetching mangas for update', error);
      return result;
    }

    if (!mangas || mangas.length === 0) {
      log.info('No mangas to check');
      return result;
    }

    result.total = mangas.length;
    log.info('Starting manga checks', { totalMangas: mangas.length });

    for (const rawManga of mangas) {
      const manga = rawManga as unknown as SchedulerManga;

      try {
        // Optimization 1: Skip if NO ONE is actively reading
        const settings = manga.user_manga_settings || [];
        const activeReaders = settings.filter(s => ['reading', 'plan_to_read'].includes(s.reading_status));

        if (activeReaders.length === 0 && settings.length > 0) {
          logger.scheduler.skip(manga.title, 'no active readers');
          result.skipped++;
          continue;
        }

        // Optimization 2: 7-day rule
        const chapters = manga.chapters || [];
        if (chapters.length > 0) {
          const sortedChapters = [...chapters].sort(
            (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
          );
          const latestDateStr = sortedChapters[0]?.release_date;

          if (latestDateStr) {
            const latestDate = new Date(latestDateStr);
            const nextCheckDate = new Date(latestDate);
            nextCheckDate.setDate(latestDate.getDate() + 7);
            nextCheckDate.setHours(nextCheckDate.getHours() - 6); // 6 hour buffer

            if (new Date() < nextCheckDate) {
              logger.scheduler.skip(
                manga.title,
                `next expected ${nextCheckDate.toDateString()}`
              );
              result.skipped++;
              continue;
            }
          }
        }

        log.debug('Checking manga', { title: manga.title, url: manga.url });
        const scrapedData = await scrapeManga(manga.url);

        if (scrapedData.chapters.length > 0) {
          const { data: existingChapters } = await supabase
            .from('chapters')
            .select('number')
            .eq('manga_id', manga.id);

          const existingNumbers = new Set(existingChapters?.map((c) => c.number) || []);
          const newChapters = scrapedData.chapters.filter((c) => !existingNumbers.has(c.number));

          if (newChapters.length > 0) {
            logger.scheduler.newChapters(manga.title, newChapters.length);

            const chaptersToInsert = newChapters.map((c) => ({
              manga_id: manga.id,
              number: c.number,
              title: c.title,
              url: c.url,
              release_date: c.release_date || new Date().toISOString()
            }));

            await supabase.from('chapters').upsert(chaptersToInsert, {
              onConflict: 'manga_id, number'
            });

            await sendNotifications(manga, newChapters);
            result.updated++;
            result.updatedMangas.push({
              id: manga.id,
              title: manga.title,
              newChaptersCount: newChapters.length
            });
          } else {
            log.debug('No new chapters', { title: manga.title });
          }
        }

        // Update timestamp
        await supabase
          .from('mangas')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', manga.id);

        result.checked++;

        // Rate limiting - 5 seconds between requests
        await new Promise((resolve) => setTimeout(resolve, 5000));

      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        log.error('Failed to update manga', error, { title: manga.title });
        result.failed++;
      }
    }

    result.durationMs = Date.now() - startTime;
    logger.scheduler.complete('checkAllMangas', result.updated, result.durationMs);

    log.info('Update check complete', {
      total: result.total,
      checked: result.checked,
      updated: result.updated,
      skipped: result.skipped,
      failed: result.failed,
      durationMs: result.durationMs
    });

    return result;

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    log.error('Fatal error in scheduler', error);
    result.durationMs = Date.now() - startTime;
    return result;
  }
}

interface UserWithToken {
  notification_token: string | null;
}

interface UserMangaSettingsWithUser {
  user_id: string;
  users: UserWithToken | null;
}

interface NotifiableManga {
  id: string;
  title: string;
}

async function sendNotifications(manga: NotifiableManga, newChapters: ScrapedChapter[]) {
  try {
    const { data, error } = await supabase
      .from('user_manga_settings')
      .select(`
        user_id,
        users (
          notification_token
        )
      `)
      .eq('manga_id', manga.id)
      .eq('notifications_enabled', true);

    if (error) {
      log.error('Error fetching subscribers', error, { mangaId: manga.id });
      return;
    }

    const settings = (data ?? []) as unknown as UserMangaSettingsWithUser[];

    if (settings.length === 0) {
      log.debug('No subscribers for manga', { mangaId: manga.id });
      return;
    }

    log.info('Sending notifications', {
      manga: manga.title,
      subscribers: settings.length,
      chapters: newChapters.length
    });

    const latestChapter = newChapters[0];
    const notificationPayload = JSON.stringify({
      title: `New Chapter: ${manga.title}`,
      body: `Chapter ${latestChapter.number} is now available!`,
      icon: '/icon-192x192.png',
      url: `/manga/${manga.id}`
    });

    let sent = 0;
    let failed = 0;

    for (const item of settings) {
      const user = item.users;
      if (user?.notification_token) {
        try {
          const subscription = JSON.parse(user.notification_token);
          await webpush.sendNotification(subscription, notificationPayload);
          sent++;
          log.debug('Notification sent', { userId: item.user_id });
        } catch (pushError) {
          const error = pushError instanceof Error ? pushError : new Error(String(pushError));
          log.warn('Failed to send notification', {
            userId: item.user_id,
            error: error.message
          });
          failed++;
        }
      }
    }

    log.info('Notifications complete', {
      manga: manga.title,
      sent,
      failed
    });

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    log.error('Error in sendNotifications', error);
  }
}
