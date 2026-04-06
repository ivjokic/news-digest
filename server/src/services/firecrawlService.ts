import FirecrawlApp from '@mendable/firecrawl-js';
import { ScrapedProfile } from '../types/index.js';
import { config } from '../config/env.js';

const firecrawl = new FirecrawlApp({ apiKey: config.firecrawlApiKey });

export async function scrapeProfile(username: string): Promise<ScrapedProfile> {
  try {
    console.log(`Scraping @${username}...`);

    const result = await firecrawl.scrapeUrl(`https://x.com/${username}`, {
      formats: ['markdown'],
    });

    console.log(`@${username} scrape result — success:${result.success} markdownLen:${result.markdown?.length ?? 0}`);

    if (!result.success) {
      const reason = (result as { error?: string }).error ?? 'FireCrawl reported failure';
      console.error(`@${username} error from FireCrawl:`, reason);
      return { username, content: '', error: reason };
    }

    if (!result.markdown || result.markdown.trim().length === 0) {
      return { username, content: '', error: 'FireCrawl returned empty markdown — X.com may be blocking the scrape or requires authentication' };
    }

    return { username, content: result.markdown };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown scrape error';
    console.error(`Failed to scrape @${username}:`, message);
    return { username, content: '', error: message };
  }
}

export async function scrapeProfiles(
  usernames: string[],
  concurrency = 3
): Promise<ScrapedProfile[]> {
  const results: ScrapedProfile[] = [];

  for (let i = 0; i < usernames.length; i += concurrency) {
    const batch = usernames.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(scrapeProfile));
    results.push(...batchResults);
  }

  return results;
}
