import type { Request, Response } from 'express';
import { Router } from 'express';
import { scrapeManga } from '../services/scraper.js';

const router = Router();

router.post('/analyze', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  try {
    const data = await scrapeManga(url);
    res.json(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

export default router;
