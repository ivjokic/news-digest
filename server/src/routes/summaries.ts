import { Router, Request, Response } from 'express';
import { buildSummaries } from '../services/summaryOrchestrator.js';

const router = Router();

interface SummarizeBody {
  sites: string[];
  date?: string;
}

router.post('/', async (req: Request, res: Response) => {
  const { sites, date } = req.body as SummarizeBody;

  if (!Array.isArray(sites) || sites.length === 0) {
    res.status(400).json({ error: 'sites must be a non-empty array of URLs' });
    return;
  }

  const validSites = sites.filter((s) => {
    try { new URL(s); return true; } catch { return false; }
  });

  if (validSites.length === 0) {
    res.status(400).json({ error: 'No valid URLs provided' });
    return;
  }

  const targetDate =
    date ?? new Date(Date.now() - 86_400_000).toISOString().split('T')[0]!;

  try {
    const summaries = await buildSummaries(validSites, targetDate);
    res.json({ date: targetDate, summaries, fetchedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Summarize error:', message);
    res.status(500).json({ error: message });
  }
});

export default router;
