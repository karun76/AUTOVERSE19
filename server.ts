import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  addUserFavorite,
  getAllCatalogCars,
  getOrCreateUser,
  getUserFavoriteCarIds,
  removeUserFavorite,
} from './src/db/repository.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Public catalog route backed by PostgreSQL
  app.get('/api/cars', async (_req, res) => {
    try {
      const catalog = await getAllCatalogCars();
      res.json({ cars: catalog });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load catalog.';
      res.status(500).json({ error: message });
    }
  });

  // Authenticated profile sync
  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email ?? '';
      const displayName =
        typeof req.user!.name === 'string' ? req.user!.name : null;
      const user = await getOrCreateUser(uid, email, displayName);
      res.json({ user });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to sync account.';
      res.status(500).json({ error: message });
    }
  });

  // Saved garage favorites
  app.get('/api/garage', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email ?? '';
      const displayName =
        typeof req.user!.name === 'string' ? req.user!.name : null;
      const carIds = await getUserFavoriteCarIds(uid, email, displayName);
      res.json({ carIds });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load saved garage.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/garage', requireAuth, async (req: AuthRequest, res) => {
    try {
      const carId = typeof req.body?.carId === 'string' ? req.body.carId : '';
      if (!carId) {
        return res.status(400).json({ error: 'Vehicle ID is required.' });
      }
      const uid = req.user!.uid;
      const email = req.user!.email ?? '';
      const displayName =
        typeof req.user!.name === 'string' ? req.user!.name : null;
      const carIds = await addUserFavorite(uid, email, displayName, carId);
      res.status(201).json({ carIds });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save vehicle.';
      res.status(500).json({ error: message });
    }
  });

  app.delete(
    '/api/garage/:carId',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const carId = String(req.params.carId ?? '');
        if (!carId) {
          return res.status(400).json({ error: 'Vehicle ID is required.' });
        }
        const uid = req.user!.uid;
        const email = req.user!.email ?? '';
        const displayName =
          typeof req.user!.name === 'string' ? req.user!.name : null;
        const carIds = await removeUserFavorite(uid, email, displayName, carId);
        res.json({ carIds });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to remove vehicle.';
        res.status(500).json({ error: message });
      }
    },
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*path}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AUTOVERSE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
