export interface SiteSummary {
  url: string;
  summary: string;
  articleCount: number;
  articlesDate: string;
  error?: string;
}

export interface SummaryResult {
  date: string;
  summaries: SiteSummary[];
  fetchedAt: string;
}

export interface StorageData {
  sites: string[];
  serverUrl: string;
  lastSummary: SummaryResult | null;
  isRead: boolean;
}

export const DEFAULT_SERVER_URL = 'https://news-digest-production.up.railway.app';
