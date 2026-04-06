import { StorageData, SummaryResult, DEFAULT_SERVER_URL } from './types';

export async function getSettings(): Promise<Pick<StorageData, 'sites' | 'serverUrl'>> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['sites', 'serverUrl'], (result) => {
      resolve({
        sites: (result.sites as string[]) ?? [],
        serverUrl: (result.serverUrl as string) ?? DEFAULT_SERVER_URL,
      });
    });
  });
}

export async function saveSettings(
  sites: string[],
  serverUrl: string
): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ sites, serverUrl }, resolve);
  });
}

export async function getSummaryState(): Promise<Pick<StorageData, 'lastSummary' | 'isRead'>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['lastSummary', 'isRead'], (result) => {
      resolve({
        lastSummary: (result.lastSummary as SummaryResult) ?? null,
        isRead: (result.isRead as boolean) ?? true,
      });
    });
  });
}

export async function saveSummary(summary: SummaryResult): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ lastSummary: summary, isRead: false }, resolve);
  });
}

export async function markAsRead(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ isRead: true }, resolve);
  });
}
