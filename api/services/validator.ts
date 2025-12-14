
import { scrapeManga } from './scraper.js';
import axios from 'axios';

export async function validateSource(url: string) {
    const report: string[] = [];
    let isValid = true;
    let data = null;

    try {
        const startTime = Date.now();
        data = await scrapeManga(url);
        const duration = Date.now() - startTime;
        report.push(`Scrape successful in ${duration}ms`);

        if (!data.title) {
            report.push('ERROR: Title is missing');
            isValid = false;
        } else {
            report.push(`SUCCESS: Title found: "${data.title}"`);
        }

        if (!data.cover_url) {
            report.push('ERROR: Cover URL is missing');
            isValid = false;
        } else {
            // Validate image availability
            try {
                await axios.head(data.cover_url);
                report.push(`SUCCESS: Cover URL is accessible: ${data.cover_url}`);
            } catch {
                report.push(`ERROR: Cover URL is not accessible (404/403): ${data.cover_url}`);
                isValid = false;
            }
        }

        if (!data.chapters || data.chapters.length === 0) {
            report.push('ERROR: No chapters found');
            isValid = false;
        } else {
            report.push(`SUCCESS: Found ${data.chapters.length} chapters`);
            
            // Check for valid URLs in chapters
            const invalidChapters = data.chapters.filter(c => !c.url || !c.url.startsWith('http'));
            if (invalidChapters.length > 0) {
                report.push(`ERROR: ${invalidChapters.length} chapters have invalid URLs`);
                isValid = false;
            }
            
            const invalidNumbers = data.chapters.filter(c => c.number === -1 || typeof c.number !== 'number');
            if (invalidNumbers.length > 0) {
                 report.push(`WARNING: ${invalidNumbers.length} chapters have unknown numbers (-1)`);
            }
        }

    } catch (error: unknown) {
        if (error instanceof Error) {
            report.push(`CRITICAL ERROR: Scrape failed - ${error.message}`);
        } else {
            report.push('CRITICAL ERROR: Scrape failed - Unknown error');
        }
        isValid = false;
    }

    return { isValid, report, data };
}
