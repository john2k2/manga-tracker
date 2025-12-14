import { Router } from 'express';
import { scrapeManga } from '../services/scraper.js';

const router = Router();

router.post('/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  try {
    const data = await scrapeManga(url);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
