import { Router } from 'express';
import { checkAllMangas } from '../services/scheduler.js';

const router = Router();

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
