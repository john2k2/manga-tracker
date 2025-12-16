import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

dotenv.config();

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Create child logger for scraper context
const log = logger.child({ service: 'scraper' });

export interface ScrapedChapter {
  number: number;
  title: string;
  url: string;
  release_date?: string;
}

export interface ScrapedManga {
  title: string;
  cover_url: string;
  chapters: ScrapedChapter[];
}

export interface SearchResult {
  title: string;
  url: string;
  description?: string;
}

type FirecrawlAction =
  | { type: 'click'; selector: string }
  | { type: 'wait'; milliseconds: number };

export async function searchManga(query: string): Promise<SearchResult[]> {
  if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY is missing');

  try {
    log.info('Search started', { query });
    const response = await axios.post(
      'https://api.firecrawl.dev/v1/search',
      {
        query: `${query} manga online capitulos`,
        limit: 5,
        lang: 'es',
        scrapeOptions: { formats: ['markdown'] }
      },
      {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.success) {
      log.warn('Firecrawl search failed', { response: response.data });
      return [];
    }

    const results = response.data.data.map((item: { title: string; url: string; description?: string }) => ({
      title: item.title || 'Sin título',
      url: item.url,
      description: item.description
    }));

    log.info('Search completed', { query, resultCount: results.length });
    return results;

  } catch (error) {
    log.error('Search failed', error, { query });
    return [];
  }
}

function getScrapeOptions(url: string) {
  const domain = new URL(url).hostname;
  const actions: FirecrawlAction[] = [];
  let onlyMainContent = true;

  if (domain.includes('manhwaweb.com')) {
    actions.push(
      { type: "click", selector: "button.bg-blue-700" },
      { type: "wait", milliseconds: 3000 }
    );
    onlyMainContent = false;
  }

  return { actions, onlyMainContent };
}

async function getDomainStrategy(domain: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('domain_configs')
      .select('strategy')
      .eq('domain', domain)
      .single();

    if (error) return null;
    return data?.strategy || null;
  } catch (error) {
    log.warn('Failed to fetch domain strategy', { domain, error: String(error) });
    return null;
  }
}

async function saveDomainStrategy(domain: string, strategy: 'DIRECT_FETCH' | 'FIRECRAWL') {
  try {
    await supabase.from('domain_configs').upsert({
      domain,
      strategy,
      last_success_at: new Date().toISOString()
    });
    log.debug('Domain strategy saved', { domain, strategy });
  } catch (error) {
    log.warn('Failed to save domain strategy', { domain, error: String(error) });
  }
}

export async function scrapeManga(url: string): Promise<ScrapedManga> {
  if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY is missing');
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing');

  const domain = new URL(url).hostname;
  const knownStrategy = await getDomainStrategy(domain);
  const startTime = Date.now();

  logger.scrape.start(url, knownStrategy || 'UNKNOWN');

  // LEVEL 2 OPTIMIZATION: Try Direct Fetch First (Free & Fast)
  if (knownStrategy !== 'FIRECRAWL') {
    try {
      log.debug('Trying direct fetch', { url });
      const directHtml = await tryDirectFetch(url);

      if (directHtml) {
        log.debug('Direct fetch success, parsing with Gemini', {
          url,
          contentLength: directHtml.length
        });
        const result = await parseWithGemini(directHtml, url, 'html');

        if (result.chapters.length === 0) {
          throw new Error('Direct fetch returned 0 chapters (Likely SPA/JS-rendered content).');
        }

        await saveDomainStrategy(domain, 'DIRECT_FETCH');
        logger.scrape.success(url, 'DIRECT_FETCH', result.chapters.length);
        return result;
      }
    } catch (e) {
      const error = e as Error;
      logger.scrape.fallback(url, 'DIRECT_FETCH', 'FIRECRAWL');
      log.debug('Direct fetch failed, falling back', {
        url,
        reason: error.message
      });
    }
  } else {
    log.debug('Skipping direct fetch - domain requires Firecrawl', { domain });
  }

  // LEVEL 3 FALLBACK: Firecrawl (Robust but Slower)
  try {
    log.debug('Using Firecrawl', { url });

    const { actions, onlyMainContent } = getScrapeOptions(url);

    const firecrawlResponse = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      {
        url: url,
        formats: ['markdown'],
        onlyMainContent: onlyMainContent,
        actions: actions.length > 0 ? actions : undefined,
      },
      {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!firecrawlResponse.data.success) {
      throw new Error(`Firecrawl failed: ${JSON.stringify(firecrawlResponse.data)}`);
    }

    const markdown = firecrawlResponse.data.data.markdown;
    log.debug('Firecrawl response received', {
      url,
      rawLength: markdown.length
    });

    // Optimize Content
    const cleanMarkdown = markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/!\[.*?\]\(data:image\/.*?\)/g, '[IMAGE_REMOVED]')
      .replace(/(!\[.*?\]\(.*?\)\s*){3,}/g, '\n[MULTIPLE_IMAGES_REMOVED]\n');

    log.debug('Markdown optimized', {
      url,
      originalLength: markdown.length,
      optimizedLength: cleanMarkdown.length
    });

    const result = await parseWithGemini(cleanMarkdown, url, 'markdown');

    if (result.chapters.length > 0) {
      await saveDomainStrategy(domain, 'FIRECRAWL');
    }

    const duration = Date.now() - startTime;
    logger.scrape.success(url, 'FIRECRAWL', result.chapters.length);
    log.info('Scrape completed', {
      url,
      strategy: 'FIRECRAWL',
      chapters: result.chapters.length,
      durationMs: duration
    });

    return result;

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));

    logger.scrape.fail(url, knownStrategy || 'FIRECRAWL', err);
    log.error('Scrape failed', err, { url, durationMs: duration });

    throw new Error(`Scraping failed: ${err.message}`);
  }
}

// Helper to fetch HTML directly mimicking a real browser
async function tryDirectFetch(url: string): Promise<string | null> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    },
    timeout: 5000
  });

  if (response.status === 200 && response.data && typeof response.data === 'string') {
    if (response.data.includes('Just a moment...') || response.data.includes('Enable JavaScript')) {
      throw new Error('Cloudflare Challenge detected');
    }
    return response.data;
  }

  return null;
}

async function parseWithGemini(content: string, url: string, type: 'html' | 'markdown'): Promise<ScrapedManga> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const limit = type === 'html' ? 200000 : 150000;
  const truncatedContent = content.substring(0, limit);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const prompt = `
      You are a manga scraper parser. Extract information from the provided ${type} content.
      
      Return EXACTLY this JSON structure:
      {
        "title": "String",
        "cover_url": "String",
        "chapters": [
          {
            "number": Number,
            "title": "String",
            "url": "String",
            "release_date": "YYYY-MM-DD"
          }
        ]
      }
      
      Rules:
      - "number" MUST be a number (e.g. 10.5). If unknown, use -1.
      - "url" MUST be absolute. Base URL: ${url}
      - Sort by number descending.
      - Limit to latest 20 chapters.
      - "release_date" MUST be in YYYY-MM-DD format. Today is ${today}.
        - If you see "hace X días" or "X days ago", calculate the actual date.
        - If you see "ayer" or "yesterday", use yesterday's date.
        - If you see "hoy" or "today", use today's date.
        - If you see a date like "Dec 15" or "15 Dec", use the current year.
        - If you see "hace X horas" or "X hours ago", use today's date.
        - If no date is visible, leave release_date as null (not "YYYY-MM-DD").
      
      Content (${type}):
      ${truncatedContent}
    `;

  const startTime = Date.now();
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const geminiDuration = Date.now() - startTime;

  const parsedData = JSON.parse(text) as ScrapedManga;

  if (!parsedData.chapters || !Array.isArray(parsedData.chapters)) {
    log.warn('Gemini returned invalid structure', {
      url,
      type,
      hasChapters: !!parsedData.chapters
    });
    parsedData.chapters = [];
  }

  // Validate and fix dates
  parsedData.chapters = parsedData.chapters.map((chapter) => {
    const date = chapter.release_date;

    if (date === 'YYYY-MM-DD' || !date || isNaN(Date.parse(date))) {
      return { ...chapter, release_date: undefined };
    }
    return chapter;
  });

  log.debug('Gemini parsing completed', {
    url,
    type,
    title: parsedData.title,
    chapterCount: parsedData.chapters.length,
    geminiDurationMs: geminiDuration
  });

  return parsedData;
}
