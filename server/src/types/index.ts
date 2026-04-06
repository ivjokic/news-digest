export interface SiteSummary {
  url: string;
  summary: string;
  articleCount: number;
  articlesDate: string;
  error?: string;
}

export interface SummarizeRequest {
  sites: string[];
  date?: string;
}

export interface SummarizeResponse {
  date: string;
  summaries: SiteSummary[];
  fetchedAt: string;
}

export interface ScrapedSite {
  url: string;
  content: string;
  error?: string;
}
