import { config } from './config/env.js';
import app from './app.js';

app.listen(config.port, () => {
  console.log(`NewsDigest server running on http://localhost:${config.port}`);
  console.log('Ready to receive summarize requests from the Chrome extension.');
});
