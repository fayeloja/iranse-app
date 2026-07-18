import { Router } from 'express';
import * as controller from './applications.controller.js';
import { authenticate, requirePermissions } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/requestValidation.js';
import { queueApplicationInputSchema } from 'validation';

const router = Router();

// ==========================================
// APPLICATIONS ENDPOINTS
// ==========================================

// Initiate a tailored draft resume and cover letter
router.post(
  '/initiate',
  authenticate,
  requirePermissions(['applications:create']),
  validateRequest({ body: queueApplicationInputSchema }),
  controller.initiate
);

// Approve tailored draft and queue for automated submission
router.post(
  '/approve',
  authenticate,
  requirePermissions(['applications:create']),
  validateRequest({ body: queueApplicationInputSchema }),
  controller.approve
);

// Retrieve candidate's active and historical applications list
router.get(
  '/',
  authenticate,
  requirePermissions(['applications:read']),
  controller.getApplications
);

export default router;
