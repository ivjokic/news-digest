# News Digest

Chrome extension that scrapes and summarizes daily news from your selected websites using Firecrawl and Groq AI.

**Live server:** https://news-digest-production.up.railway.app/health

## How it works

1. You configure up to 5 news websites in the extension settings
2. Every morning at 8 AM (or manually) the extension fetches yesterday's articles
3. A local Node.js server scrapes each site via Firecrawl and sends the content to Groq AI
4. The extension displays 3–5 bullet point summaries per site

## Project structure

```
news-digest/
├── extension/   # Chrome extension (React + TypeScript)
└── server/      # Node.js backend (Express + Firecrawl + Groq)
```

## Setup

### Requirements

- Node.js 18+
- [Firecrawl API key](https://firecrawl.dev) (free tier available)
- [Groq API key](https://console.groq.com) (free tier available)

### Server

```bash
cd server
npm install
cp .env.example .env   # fill in your API keys
npm run dev
```

### Extension

```bash
cd extension
npm install
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `extension/dist` folder

### Extension settings

1. Click the News Digest icon → Settings (gear icon)
2. Enter URLs of news sites you want to track
3. Click **Test** to verify the server is running
4. Save

## API keys

| Key | Where to get it |
|-----|----------------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| `FIRECRAWL_API_KEY` | [firecrawl.dev](https://firecrawl.dev) |
