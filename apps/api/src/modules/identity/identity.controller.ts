import { Request, Response, NextFunction } from 'express';
import * as service from './identity.service.js';

// Helper to extract cookies manually without needing cookie-parser middleware
function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const match = cookies.find(c => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

// Helper to format refresh token cookie string
function getRefreshTokenCookieHeader(token: string, maxAgeSeconds: number = 604800): string {
  // HttpOnly, Secure, SameSite=Strict, Path restricted to refresh (Identity Layer 1)
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
  return `refreshToken=${encodeURIComponent(token)}; HttpOnly; ${secureFlag} SameSite=Strict; Path=/api/v1/identity/refresh; Max-Age=${maxAgeSeconds}`;
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, phone, fullName } = req.body;
    const user = await service.register(email, password, phone, fullName);
    res.status(201).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const { accessToken, refreshToken, user } = await service.login(email, password, ip, userAgent);

    // Set HTTP-Only Secure cookie for Refresh Token
    res.setHeader('Set-Cookie', getRefreshTokenCookieHeader(refreshToken));
    res.status(200).json({ status: 'success', data: { accessToken, user } });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = getCookie(req, 'refreshToken');
    if (!refreshToken) {
      return res.status(401).json({
        error: { message: 'Refresh token required', status: 401 }
      });
    }

    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const { accessToken, refreshToken: newRefreshToken } = await service.refresh(refreshToken, ip, userAgent);

    res.setHeader('Set-Cookie', getRefreshTokenCookieHeader(newRefreshToken));
    res.status(200).json({ status: 'success', data: { accessToken } });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = getCookie(req, 'refreshToken');
    if (refreshToken) {
      await service.logout(refreshToken);
    }

    // Clear refresh cookie
    res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; SameSite=Strict; Path=/api/v1/identity/refresh; Max-Age=0');
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function verifyNIN(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { nin, firstName, lastName, dateOfBirth } = req.body;

    const data = await service.verifyIdentityNIN(userId, nin, firstName, lastName, dateOfBirth);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

export async function signConsent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { consentVersion } = req.body;
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const consent = await service.logWaiverConsent(userId, consentVersion, ip, userAgent);
    res.status(201).json({ status: 'success', data: { consent } });
  } catch (error) {
    next(error);
  }
}

export async function getConsents(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const consents = await service.getConsentsHistory(userId);
    res.status(200).json({ status: 'success', data: { consents } });
  } catch (error) {
    next(error);
  }
}

export async function connectAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { portalId, username, password } = req.body;

    const account = await service.connectPortalAccount(userId, portalId, username, password);
    res.status(200).json({ status: 'success', data: { account } });
  } catch (error) {
    next(error);
  }
}

export async function getConnectedPortals(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const portals = await service.getConnectedPortals(userId);
    res.status(200).json({ status: 'success', data: { portals } });
  } catch (error) {
    next(error);
  }
}

export async function disconnectPortal(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { portalId } = req.params;

    const unlinked = await service.disconnectPortal(userId, portalId);
    if (!unlinked) {
      return res.status(404).json({
        error: { message: `Linked account for ${portalId} not found`, status: 404 }
      });
    }

    res.status(200).json({ status: 'success', message: `Unlinked ${portalId} successfully` });
  } catch (error) {
    next(error);
  }
}

export async function getSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const sessions = await service.getSessionsList(userId);
    res.status(200).json({ status: 'success', data: { sessions } });
  } catch (error) {
    next(error);
  }
}

export async function revokeSession(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    await service.revokeSession(userId, sessionId);
    res.status(200).json({ status: 'success', message: 'Session revoked successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getAuditTrail(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const logs = await service.getUserAuditTrail(userId);
    res.status(200).json({ status: 'success', data: { logs } });
  } catch (error) {
    next(error);
  }
}

export async function sendOTP(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, purpose } = req.body;
    const result = await service.sendOTP(phone, purpose);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function verifyOTP(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, code, purpose } = req.body;
    const userId = req.user?.id;
    const result = await service.verifyOTP(phone, code, purpose, userId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const result = await service.requestPasswordReset(email);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, newPassword } = req.body;
    const result = await service.resetPassword(token, newPassword);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}
