import { Router } from 'express';
import { checkAllMangas } from '../services/scheduler.js';
import { logger } from '../lib/logger.js';

const router = Router();
const log = logger.child({ service: 'cron-routes' });

// Simple in-memory rate limiter for manual updates
let lastManualUpdate: number | null = null;
const MIN_UPDATE_INTERVAL_MS = 60_000; // 1 minute between manual updates

// Manual update endpoint (for Admin panel)
router.post('/manual-update', async (_req, res) => {
    // Basic rate limiting
    const now = Date.now();
    if (lastManualUpdate && now - lastManualUpdate < MIN_UPDATE_INTERVAL_MS) {
        const remainingSeconds = Math.ceil((MIN_UPDATE_INTERVAL_MS - (now - lastManualUpdate)) / 1000);
        res.status(429).json({
            error: 'Rate limited',
            message: `Por favor espera ${remainingSeconds} segundos antes de intentar nuevamente.`,
            retryAfter: remainingSeconds
        });
        return;
    }

    log.info('Manual update triggered from Admin panel');
    lastManualUpdate = now;

    try {
        const result = await checkAllMangas();

        // Build message based on results
        let message = '¡Actualización completada!';
        if (result.updatedMangas.length > 0) {
            const totalNewChapters = result.updatedMangas.reduce((sum, m) => sum + m.newChaptersCount, 0);
            message = `¡${totalNewChapters} capítulo${totalNewChapters > 1 ? 's' : ''} nuevo${totalNewChapters > 1 ? 's' : ''} en ${result.updatedMangas.length} manga${result.updatedMangas.length > 1 ? 's' : ''}!`;
        } else if (result.checked === 0 && result.skipped > 0) {
            message = 'Todo al día, nada que actualizar.';
        } else {
            message = 'Sin novedades por ahora.';
        }

        res.json({
            success: true,
            message,
            ...result,
            timestamp: new Date().toISOString()
        });
    } catch (error: unknown) {
        log.error('Manual update failed', error instanceof Error ? error : new Error(String(error)));
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Error desconocido' });
        }
    }
});

// This endpoint will be called by Vercel Cron
router.get('/run', async (req, res) => {
    // Basic security check to ensure only Vercel Cron calls this
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    console.log('🤖 Triggering manual update check via Cron...');

    // Run in background (don't wait for it to finish to respond to Vercel)
    // Note: On Vercel serverless, the function might freeze after response.
    // For critical tasks, we should await. For long tasks, we might need a different approach.
    // Since we optimized the check loop (Smart Check), it should be fast enough.
    try {
        await checkAllMangas();
        res.json({ success: true, message: 'Update check completed' });
    } catch (error: unknown) {
        console.error('Cron job failed:', error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
});

export default router;
