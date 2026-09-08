import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Enable JSON body parsing
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure persistent storage directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'brokerage_store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Craken Pro Brokerage Server', timestamp: new Date().toISOString() });
});

// GET centralized store data
app.get('/api/store', (req, res) => {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      return res.json(JSON.parse(data));
    }
    return res.json(null);
  } catch (error) {
    console.error('Failed to read central store file:', error);
    return res.status(500).json({ error: 'Failed to read database state' });
  }
});

// POST centralized store data (updates across Chrome, Safari, TikTok, WhatsApp, etc.)
app.post('/api/store', (req, res) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Missing store payload' });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Failed to write central store file:', error);
    return res.status(500).json({ error: 'Failed to save database state' });
  }
});

// Mount Vite middleware for dev or serve static files for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Craken Pro Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
