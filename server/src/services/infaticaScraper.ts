import axios from 'axios';
import { ScrapedSite } from '../types/index.js';
import { config } from '../config/env.js';

const FIRECRAWL_ENDPOINT = 'https://api.firecrawl.dev/v1/scrape';
const REQUEST_TIMEOUT_MS = 60_000;

export async function scrapeSite(url: string): Promise<ScrapedSite> {
  const label = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  console.log(`Scraping ${label} via FireCrawl...`);

  try {
    const response = await axios.post(
      FIRECRAWL_ENDPOINT,
      { url, formats: ['markdown'] },
      {
        headers: {
          'Authorization': `Bearer ${config.firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    const data = response.data as { success?: boolean; data?: { markdown?: string }; markdown?: string };
    const markdown = data.data?.markdown ?? data.markdown ?? '';

    console.log(`${label}: ${markdown.length} chars of markdown`);

    if (!markdown || markdown.trim().length < 200) {
      return { url, content: '', error: 'Too little content returned' };
    }

    return { url, content: markdown };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const detail = JSON.stringify(err.response?.data ?? err.message);
      console.error(`Failed to scrape ${label}: HTTP ${status}: ${detail}`);
      return { url, content: '', error: `HTTP ${status}: ${detail}` };
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Failed to scrape ${label}:`, message);
    return { url, content: '', error: message };
  }
}

export async function scrapeSites(urls: string[]): Promise<ScrapedSite[]> {
  const results: ScrapedSite[] = [];
  for (const url of urls) {
    results.push(await scrapeSite(url));
    await new Promise((r) => setTimeout(r, 1000));
  }
  return results;
}
