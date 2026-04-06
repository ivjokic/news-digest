import { scrapeSites } from './infaticaScraper.js';
import { summarizeSite } from './claudeService.js';
import { SiteSummary } from '../types/index.js';

export async function buildSummaries(
  urls: string[],
  date: string
): Promise<SiteSummary[]> {
  const scraped = await scrapeSites(urls);

  return Promise.all(
    scraped.map(async (site): Promise<SiteSummary> => {
      if (site.error || !site.content) {
        const reason = site.error ?? 'No content returned';
        return {
          url: site.url,
          summary: `Could not retrieve content: ${reason}`,
          articleCount: 0,
          articlesDate: date,
          error: reason,
        };
      }

      try {
        const result = await summarizeSite(site.url, site.content, date);
        return {
          url: site.url,
          summary: result.summary,
          articleCount: result.articleCount,
          articlesDate: date,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Summarization failed';
        return {
          url: site.url,
          summary: `Error summarizing ${site.url}: ${message}`,
          articleCount: 0,
          articlesDate: date,
          error: message,
        };
      }
    })
  );
}
