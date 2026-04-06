import { Scraper, Tweet } from 'agent-twitter-client';
import { ScrapedProfile } from '../types/index.js';
import { config } from '../config/env.js';

let scraper: Scraper | null = null;

async function getScraper(): Promise<Scraper> {
  if (scraper) {
    const loggedIn = await scraper.isLoggedIn();
    if (loggedIn) return scraper;
    console.log('Twitter session expired, re-authenticating...');
    scraper = null;
  }

  console.log('Authenticating with Twitter...');
  const s = new Scraper();
  await s.login(config.twitterUsername, config.twitterPassword, config.twitterEmail || undefined);

  const loggedIn = await s.isLoggedIn();
  if (!loggedIn) {
    throw new Error('Twitter login failed — check TWITTER_USERNAME / TWITTER_PASSWORD in .env');
  }

  console.log('Twitter authenticated successfully.');
  scraper = s;
  return s;
}

function formatTweet(tweet: Tweet): string {
  const time = tweet.timeParsed
    ? tweet.timeParsed.toISOString()
    : 'unknown time';
  const likes = tweet.likes ?? 0;
  const retweets = tweet.retweets ?? 0;
  const text = tweet.text ?? '';
  return `[${time}] ${text}  (❤ ${likes}  🔁 ${retweets})`;
}

export async function scrapeProfile(username: string, date: string): Promise<ScrapedProfile> {
  try {
    console.log(`Fetching tweets for @${username}...`);
    const s = await getScraper();

    const collected: Tweet[] = [];
    for await (const tweet of s.getTweets(username, 100)) {
      collected.push(tweet);
    }

    console.log(`@${username}: fetched ${collected.length} total tweets`);

    // Filter for tweets posted on the target date
    const targetTweets = collected.filter((t) => {
      if (!t.timeParsed) return false;
      return t.timeParsed.toISOString().split('T')[0] === date;
    });

    let content: string;

    if (targetTweets.length > 0) {
      console.log(`@${username}: ${targetTweets.length} tweets found for ${date}`);
      content = targetTweets.map(formatTweet).join('\n\n');
    } else {
      // Fall back to the 15 most recent tweets if none found for the target date
      console.log(`@${username}: no tweets for ${date}, using 15 most recent`);
      const recent = collected.slice(0, 15);
      content =
        recent.length > 0
          ? recent.map(formatTweet).join('\n\n')
          : 'No recent tweets found.';
    }

    return { username, content };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Failed to fetch @${username}:`, message);

    // Force re-auth next time on auth-related errors
    if (/auth|401|403|login/i.test(message)) {
      scraper = null;
    }

    return { username, content: '', error: message };
  }
}

export async function scrapeProfiles(usernames: string[], date: string): Promise<ScrapedProfile[]> {
  const results: ScrapedProfile[] = [];

  for (const username of usernames) {
    const result = await scrapeProfile(username, date);
    results.push(result);
    // Small delay between requests to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1500));
  }

  return results;
}
