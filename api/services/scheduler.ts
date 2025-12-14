import cron from 'node-cron';
import webpush from 'web-push';
import { supabase } from '../lib/supabase.js';
import { scrapeManga } from './scraper.js';
import type { ScrapedChapter } from './scraper.js';

export function startScheduler() {
  console.log('⏳ Starting update scheduler (runs every 6 hours)...');

  // Schedule task to run every 6 hours
  // Format: Minute Hour Day Month DayOfWeek
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ Running scheduled update check...');
    await checkAllMangas();
  });
}

export async function checkAllMangas() {
  console.log('Checking for manga updates...');
  
  try {
    const { data: mangas, error } = await supabase
      .from('mangas')
      .select('id, url, title');

    if (error) {
      console.error('Error fetching mangas for update:', error);
      return;
    }

    if (!mangas || mangas.length === 0) {
      console.log('No mangas to check.');
      return;
    }

    console.log(`Found ${mangas.length} mangas to check.`);

    for (const manga of mangas) {
      try {
        console.log(`Checking ${manga.title} (${manga.url})...`);
        const scrapedData = await scrapeManga(manga.url);

        if (scrapedData.chapters.length > 0) {
           // Get existing chapters to compare
          const { data: existingChapters } = await supabase
             .from('chapters')
             .select('number')
             .eq('manga_id', manga.id);

           const existingNumbers = new Set(existingChapters?.map((c) => c.number) || []);
           const newChapters = scrapedData.chapters.filter((c) => !existingNumbers.has(c.number));

           if (newChapters.length > 0) {
             console.log(`✨ Found ${newChapters.length} new chapters for ${manga.title}!`);
             
             // Insert new chapters
             const chaptersToInsert = newChapters.map((c) => ({
               manga_id: manga.id,
               number: c.number,
               title: c.title,
               url: c.url,
               release_date: c.release_date || new Date().toISOString()
             }));

             await supabase.from('chapters').upsert(chaptersToInsert, { onConflict: 'manga_id, number' });

             // Send notifications
             await sendNotifications(manga, newChapters);
           } else {
             console.log(`No new chapters for ${manga.title}.`);
           }
        }
        
        // Update "updated_at" timestamp of the manga to show it was checked
        await supabase.from('mangas').update({ updated_at: new Date().toISOString() }).eq('id', manga.id);

        // Be nice to the servers, wait a bit between requests
        await new Promise((resolve) => setTimeout(resolve, 5000));

      } catch (err) {
        console.error(`Failed to update ${manga.title}:`, err);
      }
    }
    console.log('✅ Update check complete.');

  } catch (err) {
    console.error('Fatal error in scheduler:', err);
  }
}

interface SchedulerManga {
  id: string;
  title: string;
  url: string;
}

interface UserWithToken {
  notification_token: string | null;
}

interface UserMangaSettingsWithUser {
  user_id: string;
  users: UserWithToken | null;
}

async function sendNotifications(manga: SchedulerManga, newChapters: ScrapedChapter[]) {
    try {
        // 1. Get users watching this manga with notifications enabled
        // We need to use !inner or similar if we wanted to filter by user properties, but here we filter by setting.
        // The relationship is: user_manga_settings.user_id -> users.id
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
            console.error('Error fetching subscribers:', error);
            return;
        }

        const settings = (data ?? []) as unknown as UserMangaSettingsWithUser[];

        if (settings.length === 0) return;

        console.log(`Sending notifications to ${settings.length} users...`);

        const latestChapter = newChapters[0]; 
        const notificationPayload = JSON.stringify({
            title: `New Chapter: ${manga.title}`,
            body: `Chapter ${latestChapter.number} is now available!`,
            icon: '/icon-192x192.png',
            url: `/manga/${manga.id}`
        });

        for (const item of settings) {
            const user = item.users;
            if (user && user.notification_token) {
                try {
                    const subscription = JSON.parse(user.notification_token);
                    await webpush.sendNotification(subscription, notificationPayload);
                    console.log(`🔔 Notification sent to user ${item.user_id}`);
                } catch (pushError) {
                    console.error(`Failed to send notification to user ${item.user_id}`, pushError);
                }
            }
        }

    } catch (err) {
        console.error('Error in sendNotifications:', err);
    }
}
