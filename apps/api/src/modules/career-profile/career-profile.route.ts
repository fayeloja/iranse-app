import { Router } from 'express';
import * as controller from './career-profile.controller.js';
import { authenticate, requirePermissions } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/requestValidation.js';
import {
  experienceSchema,
  achievementSchema,
  resumeVariantSchema,
  voiceSnippetSchema,
} from 'validation';

const router = Router();

// ==========================================
// 1. EXPERIENCES ENDPOINTS
// ==========================================
router.post(
  '/experience',
  authenticate,
  requirePermissions(['profile:write']),
  validateRequest({ body: experienceSchema }),
  controller.createExperience
);
router.get(
  '/experience',
  authenticate,
  requirePermissions(['profile:read']),
  controller.getExperiences
);
router.get(
  '/experience/:id',
  authenticate,
  requirePermissions(['profile:read']),
  controller.getExperienceDetail
);
router.put(
  '/experience/:id',
  authenticate,
  requirePermissions(['profile:write']),
  validateRequest({ body: experienceSchema }),
  controller.updateExperience
);
router.delete(
  '/experience/:id',
  authenticate,
  requirePermissions(['profile:write']),
  controller.deleteExperience
);

// ==========================================
// 2. ACHIEVEMENTS ENDPOINTS
// ==========================================
router.post(
  '/achievement',
  authenticate,
  requirePermissions(['profile:write']),
  validateRequest({ body: achievementSchema }),
  controller.createAchievement
);
router.get(
  '/achievement',
  authenticate,
  requirePermissions(['profile:read']),
  controller.getAchievements
);
router.put(
  '/achievement/:id',
  authenticate,
  requirePermissions(['profile:write']),
  validateRequest({ body: achievementSchema }),
  controller.updateAchievement
);
router.delete(
  '/achievement/:id',
  authenticate,
  requirePermissions(['profile:write']),
  controller.deleteAchievement
);
router.get(
  '/skill',
  authenticate,
  requirePermissions(['profile:read']),
  controller.getSkills
);

// ==========================================
// 3. RESUME VARIANTS ENDPOINTS
// ==========================================
router.post(
  '/resume-variant',
  authenticate,
  requirePermissions(['profile:write']),
  validateRequest({ body: resumeVariantSchema }),
  controller.createResumeVariant
);
router.get(
  '/resume-variant',
  authenticate,
  requirePermissions(['profile:read']),
  controller.getResumeVariants
);
router.get(
  '/resume-variant/:id',
  authenticate,
  requirePermissions(['profile:read']),
  controller.getResumeVariantDetail
);
router.delete(
  '/resume-variant/:id',
  authenticate,
  requirePermissions(['profile:write']),
  controller.deleteResumeVariant
);

// ==========================================
// 4. VOICE SNIPPETS ENDPOINTS
// ==========================================
router.post(
  '/voice-snippet',
  authenticate,
  requirePermissions(['profile:write']),
  validateRequest({ body: voiceSnippetSchema }),
  controller.createVoiceSnippet
);
router.get(
  '/voice-snippet',
  authenticate,
  requirePermissions(['profile:read']),
  controller.getVoiceSnippets
);
router.put(
  '/voice-snippet/:id',
  authenticate,
  requirePermissions(['profile:write']),
  validateRequest({ body: voiceSnippetSchema }),
  controller.updateVoiceSnippet
);
router.delete(
  '/voice-snippet/:id',
  authenticate,
  requirePermissions(['profile:write']),
  controller.deleteVoiceSnippet
);

// ==========================================
// 5. CV UPLOAD ENDPOINT
// ==========================================
router.post(
  '/upload-cv',
  authenticate,
  requirePermissions(['profile:write']),
  controller.uploadCV
);

export default router;
