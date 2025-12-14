
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

async function debugScrape(url: string) {
  console.log(`Debug Scraping URL: ${url}`);

  try {
    // 1. Scrape with Firecrawl
    console.log('Calling Firecrawl...');
    const firecrawlResponse = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      {
        url: url,
        formats: ['markdown'],
        onlyMainContent: false,
        actions: [
            { type: "click", selector: "button.bg-blue-700" },
            { type: "wait", milliseconds: 3000 }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!firecrawlResponse.data.success) {
      console.error('Firecrawl failed:', firecrawlResponse.data);
      return;
    }

    const markdown = firecrawlResponse.data.data.markdown;
    console.log(`Firecrawl success. Markdown length: ${markdown.length}`);
    
    // Save markdown to file for inspection
    fs.writeFileSync('debug_markdown_action.md', markdown);
    console.log('Saved markdown to debug_markdown_action.md');

    // 2. Parse with Gemini (using the same prompt as app)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

debugScrape('https://manhwaweb.com/manga/kaifuku_jutsushi-no-yarinaoshi_2743069068');
