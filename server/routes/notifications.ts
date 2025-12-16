import type { Request, Response } from 'express';
import { Router } from 'express';
import webpush from 'web-push';
import { supabase } from '../lib/supabase.js';

const router = Router();

// Configure web-push with VAPID keys
if (process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
        process.env.VITE_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('VAPID keys are missing! Push notifications will not work.');
}

// Subscribe to push notifications
router.post('/subscribe', async (req: Request, res: Response) => {
    const { user_id, subscription } = req.body;

    if (!user_id || !subscription) {
        res.status(400).json({ error: 'user_id and subscription are required' });
        return;
    }

    try {
        // Store the subscription object as a JSON string in the user's record
        const { error } = await supabase
            .from('users')
            .update({ notification_token: JSON.stringify(subscription) })
            .eq('id', user_id);

        if (error) throw error;

        console.log(`User ${user_id} subscribed to push notifications.`);
        res.json({ success: true });
    } catch (error: unknown) {
        console.error('Error saving subscription:', error);
        if (error instanceof Error) {
          res.status(500).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Unknown error' });
        }
    }
});

// Send a test notification (for debugging)
router.post('/test-send', async (req: Request, res: Response) => {
    const { user_id } = req.body;
    
    try {
         const { data: user, error } = await supabase
            .from('users')
            .select('notification_token')
            .eq('id', user_id)
            .single();

        if (error || !user?.notification_token) {
            throw new Error('User not found or no subscription');
        }

        const subscription = JSON.parse(user.notification_token);
        
        await webpush.sendNotification(subscription, JSON.stringify({
            title: 'Test Notification',
            body: 'This is a test notification from Manga Tracker!',
            url: '/'
        }));

        res.json({ success: true });

    } catch (error: unknown) {
        console.error('Error sending test notification:', error);
        if (error instanceof Error) {
          res.status(500).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Unknown error' });
        }
    }
});

export default router;
