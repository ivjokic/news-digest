import React, { useEffect, useState } from 'react';
import { SummaryResult } from '../shared/types';
import { getSummaryState } from '../shared/storage';

const Popup: React.FC = () => {
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [isRead, setIsRead] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    const state = await getSummaryState();
    setSummary(state.lastSummary);
    setIsRead(state.isRead);
    if (!state.isRead) markRead();
  };

  const markRead = () => {
    setIsRead(true);
    chrome.runtime.sendMessage({ type: 'MARK_READ' });
  };

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise<void>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'FETCH_SUMMARY' },
          (response: { success: boolean; error?: string }) => {
            if (response?.success) resolve();
            else reject(new Error(response?.error ?? 'Failed to fetch summary'));
          }
        );
      });
      await loadState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  };

  const openSettings = () => chrome.runtime.openOptionsPage();

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDomain = (url: string) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
  };

  return (
    <div className="popup">
      <header className="header">
        <div className="header-left">
          {/* Newspaper icon */}
          <svg className="logo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM8 17H6v-2h2v2Zm0-4H6v-2h2v2Zm0-4H6V7h2v2Zm9 8h-7v-2h7v2Zm0-4h-7v-2h7v2Zm0-4h-7V7h7v2Z"/>
          </svg>
          <h1 className="title">News Digest</h1>
          {!isRead && <span className="unread-dot" title="New unread summary" />}
        </div>
        <button className="icon-btn" onClick={openSettings} title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </button>
      </header>

      {summary && (
        <div className="date-bar">
          News from {formatDate(summary.date)}
        </div>
      )}

      <div className="content">
        {error && <div className="error-banner">{error}</div>}

        {!summary && !loading && !error && (
          <div className="empty-state">
            <p>No summary yet.</p>
            <p>Click <strong>Fetch News</strong> to get yesterday's digest, or open <strong>Settings</strong> to configure your news sites first.</p>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Scraping and summarizing news…</p>
            <p className="loading-hint">This may take a moment</p>
          </div>
        )}

        {summary && !loading && (
          <div className="summaries">
            {summary.summaries.map((item) => (
              <div
                key={item.url}
                className={`card ${item.error ? 'card--error' : ''}`}
              >
                <div className="card-header">
                  <a
                    className="card-username"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {getDomain(item.url)}
                  </a>
                  {item.articleCount > 0 && (
                    <span className="card-count">
                      {item.articleCount} {item.articleCount === 1 ? 'article' : 'articles'}
                    </span>
                  )}
                </div>
                <ul className="card-summary">
                  {item.summary.split('\n').filter(l => l.trim()).map((line, i) => (
                    <li key={i}>{line.replace(/^•\s*/, '')}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="footer">
        {summary && !loading && (
          <span className="last-updated">
            Updated {new Date(summary.fetchedAt).toLocaleTimeString()}
          </span>
        )}
        <button className="fetch-btn" onClick={handleFetch} disabled={loading}>
          {loading ? 'Fetching…' : 'Fetch News'}
        </button>
      </footer>
    </div>
  );
};

export default Popup;
