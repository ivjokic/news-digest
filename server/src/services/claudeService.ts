import Groq from 'groq-sdk';
import { config } from '../config/env.js';

const groq = new Groq({ apiKey: config.groqApiKey });

interface SummarizeResult {
  summary: string;
  articleCount: number;
}

export async function summarizeSite(
  url: string,
  content: string,
  date: string
): Promise<SummarizeResult> {
  const message = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are analyzing scraped content from the news website: ${url}

Target date: ${date} (yesterday)

Scraped content:
${content.slice(0, 15_000)}

Tasks:
1. Identify news articles or stories published on ${date}. If exact dates are not visible, use the most prominently featured current stories.
2. Count the number of distinct articles or stories you identified.
3. Write 3–5 bullet points covering the key stories. Each bullet must be a single clear sentence. Separate bullets with a newline and start each with "• ".

Respond with ONLY valid JSON — no markdown fences, no extra text:
{"articleCount": <number>, "summary": "• First story\n• Second story\n• Third story"}`,
      },
    ],
  });

  const text = message.choices[0]?.message?.content?.trim() ?? '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { articleCount?: number; summary?: string };
      return {
        summary: parsed.summary ?? 'No summary available.',
        articleCount: typeof parsed.articleCount === 'number' ? parsed.articleCount : 0,
      };
    }
  } catch {
    // fall through
  }

  return { summary: text || 'Could not parse summary.', articleCount: 0 };
}
