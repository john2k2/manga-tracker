import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { supabase } from '../lib/supabase.js';

dotenv.config();

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

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

type FirecrawlAction =
  | { type: 'click'; selector: string }
  | { type: 'wait'; milliseconds: number };

function getScrapeOptions(url: string) {
  const domain = new URL(url).hostname;
  const actions: FirecrawlAction[] = [];
  let onlyMainContent = true;

  if (domain.includes('manhwaweb.com')) {
    // ManhwaWeb specific: Click "Invetir orden" button to show latest chapters
    actions.push(
      { type: "click", selector: "button.bg-blue-700" },
      { type: "wait", milliseconds: 3000 }
    );
    // Sometimes main content extraction strips the list if it's dynamic
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
    console.warn('Failed to fetch domain strategy:', error);
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
  } catch (error) {
    console.warn('Failed to save domain strategy:', error);
  }
}

export async function scrapeManga(url: string): Promise<ScrapedManga> {
  if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY is missing');
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing');

  const domain = new URL(url).hostname;
  const knownStrategy = await getDomainStrategy(domain);
  
  console.log(`🔍 Strategy for ${domain}: ${knownStrategy || 'UNKNOWN'}`);

  // LEVEL 2 OPTIMIZATION: Try Direct Fetch First (Free & Fast)
  // Skip if we KNOW this domain requires Firecrawl
  if (knownStrategy !== 'FIRECRAWL') {
    try {
      console.log(`🚀 Trying Level 2: Direct Fetch for ${url}`);
      const directHtml = await tryDirectFetch(url);
      
      if (directHtml) {
        console.log('✅ Direct fetch success! Parsing with Gemini...');
        const result = await parseWithGemini(directHtml, url, 'html');
        
        // Validation: If direct fetch returned no chapters, it's likely an SPA/JavaScript site.
        if (result.chapters.length === 0) {
          throw new Error('Direct fetch returned 0 chapters (Likely SPA/JS-rendered content).');
        }
        
        // Success! Save strategy
        await saveDomainStrategy(domain, 'DIRECT_FETCH');
        return result;
      }
    } catch (e) {
      console.log('⚠️ Direct fetch failed or blocked. Falling back to Firecrawl.', (e as Error).message);
    }
  } else {
    console.log('⏭️ Skipping Level 2 because domain is known to require Firecrawl.');
  }

  // LEVEL 3 FALLBACK: Firecrawl (Robust but Slower)
  try {
    console.log(`🐢 Level 3: Firecrawl fallback for ${url}`);
    
    const { actions, onlyMainContent } = getScrapeOptions(url);

    // 1. Scrape with Firecrawl
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
    console.log(`Firecrawl success. Raw Markdown length: ${markdown.length}`);

    // 3. Optimize Content
    const cleanMarkdown = markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/!\[.*?\]\(data:image\/.*?\)/g, '[IMAGE_REMOVED]')
      .replace(/(!\[.*?\]\(.*?\)\s*){3,}/g, '\n[MULTIPLE_IMAGES_REMOVED]\n');

    console.log(`Optimized Markdown length: ${cleanMarkdown.length}`);

    const result = await parseWithGemini(cleanMarkdown, url, 'markdown');
    
    // If we got here, Firecrawl worked. Save strategy.
    if (result.chapters.length > 0) {
        await saveDomainStrategy(domain, 'FIRECRAWL');
    }
    
    return result;

  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null) {
      const maybeError = error as { message?: string; response?: { data?: unknown } };
      console.error('Scraping error:', maybeError.response?.data || maybeError.message);
      throw new Error(`Scraping failed: ${maybeError.message || 'Unknown error'}`);
    }

    console.error('Scraping error:', error);
    throw new Error('Scraping failed: Unknown error');
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

    // Truncate content differently based on type
    // HTML is more verbose, so we might need more chars, but Gemini handles it well.
    const limit = type === 'html' ? 200000 : 150000;
    const truncatedContent = content.substring(0, limit);

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
      
      Content (${type}):
      ${truncatedContent}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const parsedData = JSON.parse(text) as ScrapedManga;
    
    if (!parsedData.chapters || !Array.isArray(parsedData.chapters)) {
        console.warn('Gemini returned invalid structure, fixing...', parsedData);
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
    
    console.log(`Gemini parsed (${type}): ${parsedData.title}, ${parsedData.chapters.length} chapters`);
    return parsedData;
}
