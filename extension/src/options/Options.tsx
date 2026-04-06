import React, { useEffect, useState } from 'react';
import { DEFAULT_SERVER_URL } from '../shared/types';
import { getSettings, saveSettings } from '../shared/storage';

type ServerStatus = 'idle' | 'checking' | 'online' | 'offline';

const Options: React.FC = () => {
  const [sites, setSites] = useState<string[]>(['', '', '', '', '']);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [saved, setSaved] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('idle');

  useEffect(() => {
    getSettings().then(({ sites: savedSites, serverUrl: savedUrl }) => {
      if (savedSites.length > 0) {
        const padded = [...savedSites];
        while (padded.length < 5) padded.push('');
        setSites(padded);
      }
      setServerUrl(savedUrl);
    });
  }, []);

  const checkServer = async (url: string) => {
    setServerStatus('checking');
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(4000) });
      setServerStatus(res.ok ? 'online' : 'offline');
    } catch {
      setServerStatus('offline');
    }
  };

  const handleSiteChange = (index: number, value: string) => {
    const updated = [...sites];
    updated[index] = value;
    setSites(updated);
  };

  const addSite = () => setSites((prev) => [...prev, '']);

  const removeSite = (index: number) => {
    if (sites.length <= 5) return;
    setSites((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await saveSettings(sites, serverUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const statusLabel: Record<ServerStatus, string> = {
    idle: 'Not checked',
    checking: 'Checking…',
    online: 'Online',
    offline: 'Offline',
  };

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          {/* Newspaper icon */}
          <svg className="page-logo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM8 17H6v-2h2v2Zm0-4H6v-2h2v2Zm0-4H6V7h2v2Zm9 8h-7v-2h7v2Zm0-4h-7v-2h7v2Zm0-4h-7V7h7v2Z"/>
          </svg>
          <div>
            <h1>Daily News Digest</h1>
            <p>Configure news websites and server connection</p>
          </div>
        </header>

        {/* Server section */}
        <section className="section">
          <h2 className="section-title">Backend Server</h2>
          <p className="section-desc">
            The local Node.js server handles scraping and AI summarization.
            Run <code>npm run dev</code> inside the <code>server/</code> folder.
          </p>
          <div className="server-row">
            <input
              type="url"
              className="input"
              value={serverUrl}
              onChange={(e) => {
                setServerUrl(e.target.value);
                setServerStatus('idle');
              }}
              placeholder="http://localhost:3000"
            />
            <button
              className="check-btn"
              onClick={() => checkServer(serverUrl)}
              disabled={serverStatus === 'checking'}
            >
              Test
            </button>
            <span className={`status-badge status-${serverStatus}`}>
              {serverStatus !== 'idle' && <span className="status-dot" />}
              {statusLabel[serverStatus]}
            </span>
          </div>
        </section>

        {/* Sites section */}
        <section className="section">
          <h2 className="section-title">News Websites</h2>
          <p className="section-desc">
            Enter the URLs of news sites to track. Yesterday's articles will be
            fetched and summarized automatically every morning at 8 AM.
          </p>

          <div className="profiles-list">
            {sites.map((url, index) => (
              <div key={index} className="profile-row">
                <input
                  type="url"
                  className="input profile-input"
                  value={url}
                  onChange={(e) => handleSiteChange(index, e.target.value)}
                  placeholder={`https://example.com`}
                  spellCheck={false}
                />
                {sites.length > 5 && (
                  <button
                    className="remove-btn"
                    onClick={() => removeSite(index)}
                    title="Remove site"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className="add-btn" onClick={addSite}>
            <span>+</span> Add Website
          </button>
        </section>

        <div className="actions">
          <button
            className={`save-btn ${saved ? 'save-btn--saved' : ''}`}
            onClick={handleSave}
          >
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Options;
