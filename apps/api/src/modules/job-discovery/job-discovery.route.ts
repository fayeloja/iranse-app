import { Router } from 'express';
import * as controller from './job-discovery.controller.js';
import { authenticate, requirePermissions } from '../../middleware/auth.js';

const router = Router();

// ==========================================
// JOB DISCOVERY ENDPOINTS
// ==========================================

// Ingestion sweep trigger (allows candidates & system to execute immediate job crawling)
router.post(
  '/ingest',
  authenticate,
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
