import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type UserRole = 'guest' | 'user' | 'premium' | 'admin' | 'support' | 'superadmin' | 'ai_worker';

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  verificationStatus: 'anonymous' | 'registered' | 'email_verified' | 'phone_verified' | 'nin_verified' | 'career_verified';
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/**
 * Maps roles to granular permission keys (Identity Layer 4).
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  guest: [],
  user: [
    'profile:read', 'profile:write',
    'jobs:read',
    'applications:read', 'applications:create',
    'consent:read', 'consent:write',
    'sessions:read', 'sessions:write'
  ],
  premium: [
    'profile:read', 'profile:write',
    'jobs:read',
    'applications:read', 'applications:create', 'applications:submit_auto',
    'consent:read', 'consent:write',
    'sessions:read', 'sessions:write'
  ],
  support: [
    'profile:read',
    'jobs:read',
    'applications:read',
    'admin:read',
  ],
  admin: [
    'profile:read', 'profile:write',
    'jobs:read', 'jobs:write',
    'applications:read', 'applications:write',
    'admin:read', 'admin:write',
    'billing:read',
  ],
  superadmin: [
    '*' // Wildcard allows all operations
  ],
  ai_worker: [
    'jobs:read', 'jobs:write',
    'applications:read', 'applications:submit'
  ]
};

/**
 * Authentication Middleware:
 * Extracts access token from Authorization header and verifies it (Identity Layer 1).
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'Authentication required. Missing Bearer token.', status: 401 }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as UserPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      error: { message: 'Authentication failed. Invalid or expired token.', status: 401 }
    });
  }
}

/**
 * Authorization Middleware:
 * Enforces Role-Based Access Control (RBAC) permissions (Identity Layer 4).
 */
export function requirePermissions(requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: 'Authentication required.', status: 401 }
      });
    }

    const userRole = req.user.role;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    // Superadmin wildcard check
    if (permissions.includes('*')) {
      return next();
    }

    // Verify user permissions cover all required permissions
    const hasPermission = requiredPermissions.every(perm => permissions.includes(perm));
    if (!hasPermission) {
      return res.status(403).json({
        error: {
          message: `Forbidden. You do not possess the required permissions: [${requiredPermissions.join(', ')}]`,
          status: 403
        }
      });
    }

    next();
  };
}
