import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { createInitialDatabaseState } from './src/data/seedData.ts';
import { getDatabaseState, saveEntireState, seedDatabase } from './src/db/operations.ts';
import type { EcomartDatabaseState } from './src/types.ts';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // In-memory fallback cache to ensure fast responses and resilient fallback
  let memoryCache: EcomartDatabaseState | null = null;

  // GET full synchronized database state from Cloud SQL
  app.get('/api/state', async (_req, res) => {
    try {
      const state = await getDatabaseState();
      memoryCache = state;
      res.json(state);
    } catch (err) {
      console.error('Failed to read from Cloud SQL, using memory cache:', err);
      if (memoryCache) {
        res.json(memoryCache);
      } else {
        const fallback = createInitialDatabaseState();
        memoryCache = fallback;
        res.json(fallback);
      }
    }
  });

  // PUT synchronized state update to Cloud SQL
  app.put('/api/state', async (req, res) => {
    const nextState = req.body as EcomartDatabaseState;
    if (!nextState || !Array.isArray(nextState.products)) {
      res.status(400).json({ error: 'Invalid database payload' });
      return;
    }
    memoryCache = nextState;
    try {
      await saveEntireState(nextState);
      res.json(nextState);
    } catch (err) {
      console.error('Failed to save to Cloud SQL, kept in memory cache:', err);
      res.json(nextState);
    }
  });

  // POST reset to demo seed in Cloud SQL
  app.post('/api/reset-demo', async (_req, res) => {
    const initial = createInitialDatabaseState();
    memoryCache = initial;
    try {
      await seedDatabase(initial);
      res.json(initial);
    } catch (err) {
      console.error('Failed to seed Cloud SQL, reset memory cache:', err);
      res.json(initial);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ecomart-Billing Cloud SQL server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
