
import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { validateSource } from '../services/validator.js';

const router = Router();

// Validate a new source URL
router.post('/validate', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        res.status(400).json({ error: 'URL required' });
        return;
    }
    
    try {
        const result = await validateSource(url);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get health stats for all domains
router.get('/stats', async (req, res) => {
    try {
        const { data, error } = await supabase.from('site_health_stats').select('*');
        if (error) throw error;
        res.json({ stats: data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Report an issue
router.post('/report-issue', async (req, res) => {
    const { user_id, manga_id, description, issue_type } = req.body;
    
    if (!description || !issue_type) {
         res.status(400).json({ error: 'Description and issue_type are required' });
         return;
    }

    try {
        const { error } = await supabase.from('issue_reports').insert({
            user_id, 
            manga_id, 
            description,
            issue_type
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get issue reports
router.get('/reports', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('issue_reports')
            .select(`
                *,
                mangas ( title, url ),
                users ( email )
            `)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json({ reports: data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
