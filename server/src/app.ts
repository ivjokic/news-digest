import express from 'express';
import cors from 'cors';
import summariesRouter from './routes/summaries.js';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.startsWith('chrome-extension://') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/summarize', summariesRouter);

export default app;
