import { SummaryResult } from '../shared/types';
import { getSettings, saveSummary } from '../shared/storage';

const ALARM_NAME = 'daily-summary';

// ── Lifecycle ────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(onInstalled);
chrome.runtime.onStartup.addListener(ensureAlarm);
chrome.alarms.onAlarm.addListener(onAlarm);
chrome.runtime.onMessage.addListener(onMessage);

function onInstalled() {
  ensureAlarm();
  chrome.storage.sync.get(['sites'], (result) => {
    if (!result.sites) {
      chrome.storage.sync.set({ sites: ['', '', '', '', ''] });
    }
  });
}

function ensureAlarm() {
  chrome.alarms.get(ALARM_NAME, (existing) => {
    if (!existing) {
      const next8AM = new Date();
      next8AM.setHours(8, 0, 0, 0);
      if (next8AM <= new Date()) next8AM.setDate(next8AM.getDate() + 1);
      chrome.alarms.create(ALARM_NAME, { when: next8AM.getTime(), periodInMinutes: 24 * 60 });
    }
  });
}

function onAlarm(alarm: chrome.alarms.Alarm) {
  if (alarm.name === ALARM_NAME) fetchAndStoreSummary().catch(console.error);
}

function onMessage(
  message: { type: string },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (r: { success: boolean; error?: string }) => void
): boolean {
  if (message.type === 'FETCH_SUMMARY') {
    fetchAndStoreSummary()
      .then(() => sendResponse({ success: true }))
      .catch((err: unknown) =>
        sendResponse({ success: false, error: err instanceof Error ? err.message : 'Unknown error' })
      );
    return true;
  }
  if (message.type === 'MARK_READ') {
    chrome.action.setBadgeText({ text: '' });
    chrome.storage.local.set({ isRead: true });
    sendResponse({ success: true });
  }
  return false;
}

// ── Main fetch flow ──────────────────────────────────────────────────────────

async function fetchAndStoreSummary(): Promise<void> {
  const { sites, serverUrl } = await getSettings();
  const validSites = sites.filter((s) => s.trim().length > 0);

  if (validSites.length === 0) {
    throw new Error('No websites configured. Open Settings to add news sites.');
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = yesterday.toISOString().split('T')[0]!;

  const response = await fetch(`${serverUrl}/api/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sites: validSites, date }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Server error ${response.status}: ${body}`);
  }

  const summary = (await response.json()) as SummaryResult;
  await saveSummary(summary);

  chrome.action.setBadgeText({ text: '●' });
  chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
}
