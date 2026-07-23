import { Router } from 'express';
import * as controller from './matching.controller.js';
import { authenticate, requirePermissions } from '../../middleware/auth.js';

const router = Router();

// ==========================================
// MATCHING ENDPOINTS
// ==========================================

// Retrieve user's daily digest
router.get(
  '/digest',
  authenticate,
  requirePermissions(['profile:read']),
  controller.getDigest
);

// Retrieve job matches for the authenticated user
router.get(
  '/',
  authenticate,
  requirePermissions(['profile:read']),
  controller.getMatches
);

// Manual match scoring trigger (restricted to admin roles)
router.post(
  '/calculate',
  authenticate,
  requirePermissions(['admin:write']),
  controller.calculateMatch
);

export default router;
