import { Router } from 'express';
import * as controller from './job-discovery.controller.js';
import { authenticate, requirePermissions } from '../../middleware/auth.js';

const router = Router();

// ==========================================
// JOB DISCOVERY ENDPOINTS
// ==========================================

// Manual trigger for ingestion (restricted to admin or support roles)
router.post(
  '/ingest',
  authenticate,
  requirePermissions(['jobs:write']),
  controller.triggerIngestion
);

// Retrieve normalized listings list
router.get(
  '/',
  authenticate,
  requirePermissions(['jobs:read']),
  controller.getJobs
);

export default router;
