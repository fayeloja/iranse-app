import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { pool } from './infra/database/client.js';
import { errorHandler } from './middleware/errorHandler.js';

import { initSentry } from './infra/observability/sentry.js';
import { getMetrics, metricsContentType, httpRequestCounter, httpRequestDuration } from './infra/observability/metrics.js';
import { setupBullBoard } from './infra/observability/bullBoard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Sentry error tracking
initSentry();

const app = express();

app.use(cors());
app.use(express.json());

// Prometheus HTTP Request Metrics Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.baseUrl || req.path;
    httpRequestCounter.inc({ method: req.method, route, status_code: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
  });
  next();
});

// 1. Health Check Endpoint (Deployment liveness/readiness probe check)
app.get('/health', async (req, res) => {
  try {
    // Perform simple query to check database pool health
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected', service: 'http-api' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', reason: error.message || 'Database connection failed' });
  }
});

// 2. Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metricsContentType);
    res.end(await getMetrics());
  } catch (error: any) {
    res.status(500).end(error.message);
  }
});

// 3. Bull Board Queue Monitoring Dashboard UI (/admin/queues)
app.use('/admin/queues', setupBullBoard());
console.log('📊 Bull Board queue UI mounted at /admin/queues');

// 2. Dynamic Route Auto-loader
// Scans modules/ directories and mounts `{module}.route.ts` or `{module}.route.js`
async function mountRoutes() {
  const modulesPath = path.join(__dirname, 'modules');
  if (!fs.existsSync(modulesPath)) {
    fs.mkdirSync(modulesPath, { recursive: true });
  }

  const items = fs.readdirSync(modulesPath);
  for (const item of items) {
    const itemPath = path.join(modulesPath, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const files = fs.readdirSync(itemPath);
      const routeFile = files.find(f => f.endsWith('.route.ts') || f.endsWith('.route.js'));
      if (routeFile) {
        try {
          const routeModule = await import(`./modules/${item}/${routeFile}`);
          if (routeModule.default) {
            app.use(`/api/v1/${item}`, routeModule.default);
            console.log(`📡 Registered route: /api/v1/${item}`);
          }
        } catch (error) {
          console.error(`❌ Failed to load route module for ${item}:`, error);
        }
      }
    }
  }
}

// Initialize routes
await mountRoutes();

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 API HTTP Server listening on port ${PORT} in ${env.NODE_ENV} mode`);
});

// 3. Graceful Shutdown Handlers (SIGTERM / SIGINT)
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('💤 Express HTTP server stopped accepting new requests.');
    try {
      // Release database pool resources
      await pool.end();
      console.log('🐘 PostgreSQL connection pool ended.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error shutting down PostgreSQL pool:', err);
      process.exit(1);
    }
  });

  // Force close after 10s timeout
  setTimeout(() => {
    console.warn('⚠️ Graceful shutdown timeout reached. Forcing exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
