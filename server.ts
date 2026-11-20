import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  addUserFavorite,
  createUserStudioBuild,
  deleteUserStudioBuild,
  getAllCatalogCars,
  getOrCreateUser,
  getUserFavoriteCarIds,
  getUserStudioBuilds,
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

  // Saved 3D studio configurations
  app.get('/api/studio-builds', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email ?? '';
      const displayName =
        typeof req.user!.name === 'string' ? req.user!.name : null;
      const builds = await getUserStudioBuilds(uid, email, displayName);
      res.json({ builds });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load builds.';
      res.status(500).json({ error: message });
    }
  });

  app.post(
    '/api/studio-builds',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const body = req.body ?? {};
        const carId = typeof body.carId === 'string' ? body.carId.trim() : '';
        const buildName =
          typeof body.buildName === 'string' && body.buildName.trim()
            ? body.buildName.trim().slice(0, 80)
            : 'Custom Studio Spec';
        const paintColor =
          typeof body.paintColor === 'string' &&
          /^#[0-9a-fA-F]{6}$/.test(body.paintColor)
            ? body.paintColor
            : '#c60022';
        const finish = body.finish === 'matte' ? 'matte' : 'metallic';
        const wheelStyle =
          body.wheelStyle === 'normal' ||
          body.wheelStyle === 'sport' ||
          body.wheelStyle === 'luxury'
            ? body.wheelStyle
            : 'sport';
        const rideHeight =
          typeof body.rideHeight === 'number' &&
          Number.isFinite(body.rideHeight)
            ? Math.max(0, Math.min(100, Math.round(body.rideHeight)))
            : 50;

        if (!carId) {
          return res.status(400).json({ error: 'Vehicle ID is required.' });
        }

        const uid = req.user!.uid;
        const email = req.user!.email ?? '';
        const displayName =
          typeof req.user!.name === 'string' ? req.user!.name : null;
        const build = await createUserStudioBuild(uid, email, displayName, {
          carId,
          buildName,
          paintColor,
          finish,
          wheelStyle,
          rideHeight,
        });
        res.status(201).json({ build });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to save build.';
        res.status(500).json({ error: message });
      }
    },
  );

  app.delete(
    '/api/studio-builds/:id',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const buildId = Number(req.params.id);
        if (!Number.isInteger(buildId) || buildId <= 0) {
          return res.status(400).json({ error: 'Invalid build ID.' });
        }
        const uid = req.user!.uid;
        const email = req.user!.email ?? '';
        const displayName =
          typeof req.user!.name === 'string' ? req.user!.name : null;
        await deleteUserStudioBuild(uid, email, displayName, buildId);
        res.json({ deletedId: buildId });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to delete build.';
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
