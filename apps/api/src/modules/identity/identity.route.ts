import { Router } from 'express';
import * as controller from './identity.controller.js';
import { authenticate, requirePermissions } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/requestValidation.js';
import {
  registerSchema,
  loginSchema,
  otpSendSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyNINSchema,
  userConsentSchema,
  connectedAccountSchema,
} from 'validation';

const router = Router();

// ==========================================
// 1. PUBLIC AUTHENTICATION & RECOVERY ROUTES (Layer 1 & 2)
// ==========================================
router.post('/register', validateRequest({ body: registerSchema }), controller.register);
router.post('/login', validateRequest({ body: loginSchema }), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/otp/send', validateRequest({ body: otpSendSchema }), controller.sendOTP);
router.post('/otp/verify', validateRequest({ body: otpVerifySchema }), controller.verifyOTP);
router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), controller.forgotPassword);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), controller.resetPassword);

// ==========================================
// 2. IDENTITY VERIFICATION ROUTES (Layer 2 & 3)
// ==========================================
router.post(
  '/verify-nin',
  authenticate,
  requirePermissions(['profile:write']),
  validateRequest({ body: verifyNINSchema }),
  controller.verifyNIN
);

// ==========================================
// 3. AUTO-APPLY LEGAL CONSENTS (Layer 6)
// ==========================================
router.post(
  '/consent',
  authenticate,
  requirePermissions(['consent:write']),
  validateRequest({ body: userConsentSchema }),
  controller.signConsent
);
router.get(
  '/consents',
  authenticate,
  requirePermissions(['consent:read']),
  controller.getConsents
);

// ==========================================
// 4. CONNECTED ACCOUNTS (Layer 7)
// ==========================================
router.post(
  '/connected-accounts',
  authenticate,
  requirePermissions(['profile:write']),
  validateRequest({ body: connectedAccountSchema }),
  controller.connectAccount
);
router.get(
  '/connected-accounts',
  authenticate,
  requirePermissions(['profile:read']),
  controller.getConnectedPortals
);
router.delete(
  '/connected-accounts/:portalId',
  authenticate,
  requirePermissions(['profile:write']),
  controller.disconnectPortal
);

// ==========================================
// 5. DEVICE SESSIONS (Layer 5)
// ==========================================
router.get(
  '/sessions',
  authenticate,
  requirePermissions(['sessions:read']),
  controller.getSessions
);
router.delete(
  '/sessions/:sessionId',
  authenticate,
  requirePermissions(['sessions:write']),
  controller.revokeSession
);

// ==========================================
// 6. ACTIVITY AUDIT TRAIL (Layer 8)
// ==========================================
router.get(
  '/audit-trail',
  authenticate,
  requirePermissions(['profile:read']),
  controller.getAuditTrail
);

export default router;
