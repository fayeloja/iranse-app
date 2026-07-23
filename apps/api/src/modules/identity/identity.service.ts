import crypto from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import * as repository from './identity.repository.js';
import { verifyNIN as kycVerifyNIN, KYCVerifyNINInput } from '../../infra/kyc-client/client.js';
import { UserRole, UserPayload } from '../../middleware/auth.js';

// ==========================================
// CRYPTOGRAPHIC TOKEN HELPERS
// ==========================================

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateAccessToken(user: { id: string; email: string; role: string; verification_status: string }): string {
  const payload: UserPayload = {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    verificationStatus: user.verification_status as any,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString('hex');
}

// ==========================================
// AUTHENTICATION SERVICES
// ==========================================

export async function register(email: string, passwordPlaintext: string, phone: string, fullName: string) {
  const existingUser = await repository.getUserByEmail(email);
  if (existingUser) {
    throw { status: 400, message: 'Email is already registered' };
  }

  const passwordHash = await argon2.hash(passwordPlaintext);
  const user = await repository.createUser(email, passwordHash, phone, fullName);

  await repository.logActivity(user.id, 'auth:register', `User registered: ${user.email}`);

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    verificationStatus: user.verification_status,
  };
}

export async function login(email: string, passwordPlaintext: string, ipAddress: string, userAgent: string) {
  const user = await repository.getUserByEmail(email);
  if (!user) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const isPasswordValid = await argon2.verify(user.password_hash, passwordPlaintext);
  if (!isPasswordValid) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshTokenString();
  const tokenHash = hashToken(refreshToken);

  // Parse simple browser/OS info from userAgent (Layer 5 Session tracking)
  const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Safari') ? 'Safari' : 'Firefox';
  const os = userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Macintosh') ? 'MacOS' : 'Linux';

  // Identity Layer 9: Risk Engine location anomaly detection
  const activeSessions = await repository.getActiveUserSessions(user.id);
  if (activeSessions.length > 0) {
    const priorIp = activeSessions[0].ip_address;
    if (priorIp !== ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1') {
      console.warn(`⚠️ Risk Engine Alert: User [${user.id}] logged in from new IP: ${ipAddress} (Prior IP: ${priorIp})`);
      await repository.logActivity(
        user.id,
        'auth:anomalous_location',
        `Anomalous login location detected: IP ${ipAddress} differs from active session IP ${priorIp}`
      );
    }
  }

  await repository.createSession(user.id, tokenHash, ipAddress, userAgent, browser, os);
  await repository.logActivity(user.id, 'auth:login', `Successful login from IP: ${ipAddress}`);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      verificationStatus: user.verification_status,
    },
  };
}

export async function refresh(refreshTokenString: string, ipAddress: string, userAgent: string) {
  const tokenHash = hashToken(refreshTokenString);
  const session = await repository.getSessionByTokenHash(tokenHash);

  if (!session || !session.is_active) {
    throw { status: 401, message: 'Session expired or invalid refresh token' };
  }

  const user = await repository.getUserById(session.user_id);
  if (!user) {
    throw { status: 401, message: 'User not found' };
  }

  // Refresh Token Rotation (Layer 1 security)
  await repository.deactivateSession(tokenHash);

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshTokenString();
  const newTokenHash = hashToken(newRefreshToken);

  const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Safari') ? 'Safari' : 'Firefox';
  const os = userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Macintosh') ? 'MacOS' : 'Linux';

  await repository.createSession(user.id, newTokenHash, ipAddress, userAgent, browser, os);
  await repository.updateSessionActivity(newTokenHash);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(refreshTokenString: string) {
  const tokenHash = hashToken(refreshTokenString);
  const session = await repository.getSessionByTokenHash(tokenHash);
  
  if (session) {
    await repository.deactivateSession(tokenHash);
    await repository.logActivity(session.user_id, 'auth:logout', 'User logged out');
  }
}

// ==========================================
// OTP & PASSWORD RECOVERY SERVICES
// ==========================================

export async function sendOTP(phone: string, purpose: string) {
  // Generate 6-digit OTP code
  const code = process.env.NODE_ENV === 'test' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  await repository.saveOTP(phone, code, purpose);
  
  console.log(`[OTP Service] Sent OTP ${code} to ${phone} for purpose ${purpose}`);
  return { message: 'OTP sent successfully', phone, purpose, devCode: process.env.NODE_ENV !== 'production' ? code : undefined };
}

export async function verifyOTP(phone: string, code: string, purpose: string, userId?: string) {
  const record = await repository.getOTP(phone, purpose);
  if (!record || record.code !== code) {
    throw { status: 400, message: 'Invalid or expired OTP code' };
  }

  await repository.deleteOTP(phone, purpose);

  if (userId) {
    await repository.updateUserVerificationStatus(userId, 'phone_verified');
    await repository.logActivity(userId, 'kyc:phone_verified', `Phone ${phone} verified via OTP`);
  }

  return { verified: true, message: 'Phone number verified successfully' };
}

export async function requestPasswordReset(email: string) {
  const user = await repository.getUserByEmail(email);
  if (!user) {
    // Return generic message to prevent email enumeration
    return { message: 'If the email exists, a password reset token has been issued.' };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  await repository.savePasswordResetToken(user.id, tokenHash);
  await repository.logActivity(user.id, 'auth:password_reset_requested', `Password reset token generated for ${email}`);

  console.log(`[Password Reset] Generated reset token for ${email}: ${rawToken}`);
  return {
    message: 'If the email exists, a password reset token has been issued.',
    resetToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
  };
}

export async function resetPassword(token: string, newPasswordPlaintext: string) {
  const tokenHash = hashToken(token);
  const resetRecord = await repository.getPasswordResetToken(tokenHash);

  if (!resetRecord) {
    throw { status: 400, message: 'Invalid or expired password reset token' };
  }

  const passwordHash = await argon2.hash(newPasswordPlaintext);
  await repository.updateUserPassword(resetRecord.userId, passwordHash);
  await repository.deactivateAllUserSessions(resetRecord.userId);
  await repository.deletePasswordResetToken(tokenHash);
  await repository.logActivity(resetRecord.userId, 'auth:password_reset_completed', 'Password successfully reset');

  return { message: 'Password has been reset successfully. Please sign in with your new password.' };
}

// ==========================================
// IDENTITY VERIFICATION SERVICES (Layer 2 & 3)
// ==========================================

export async function verifyIdentityNIN(
  userId: string,
  nin: string,
  firstName: string,
  lastName: string,
  dateOfBirth: string
) {
  const input: KYCVerifyNINInput = { nin, firstName, lastName, dateOfBirth };
  const kycResult = await kycVerifyNIN(input);

  if (!kycResult.verified) {
    await repository.logActivity(userId, 'kyc:nin_failed', `NIN check failed: ${kycResult.reason}`);
    throw { status: 400, message: kycResult.reason || 'NIN verification failed' };
  }

  // Check name match
  const details = kycResult.details;
  if (!details || !details.firstNameMatch || !details.lastNameMatch || !details.dobMatch) {
    await repository.logActivity(userId, 'kyc:nin_failed', 'NIN check failed due to name or DOB mismatch');
    throw { status: 400, message: 'NIN record details do not match profile details.' };
  }

  const updatedUser = await repository.updateUserVerificationStatus(userId, 'nin_verified');
  await repository.logActivity(userId, 'kyc:nin_verified', `NIN verified successfully. Match Score: ${kycResult.matchScore}`);

  return {
    verificationStatus: updatedUser?.verification_status || 'nin_verified',
  };
}

// ==========================================
// AUTO-APPLY LEGAL CONSENTS (Layer 6)
// ==========================================

export async function logWaiverConsent(
  userId: string,
  consentVersion: string,
  ipAddress: string,
  userAgent: string,
  countryCode?: string
) {
  const consent = await repository.logConsent(userId, consentVersion, ipAddress, userAgent, countryCode);
  await repository.logActivity(userId, 'consent:signed', `Signed auto-apply consent waiver version ${consentVersion}`);
  return consent;
}

export async function getConsentsHistory(userId: string) {
  return repository.getUserConsents(userId);
}



// ==========================================
// SESSIONS (Layer 5)
// ==========================================

export async function getSessionsList(userId: string) {
  return repository.getActiveUserSessions(userId);
}

export async function revokeSession(userId: string, sessionId: string) {
  // Retrieve session first to make sure it belongs to the requesting user
  const sessions = await repository.getActiveUserSessions(userId);
  const targetSession = sessions.find(s => s.id === sessionId);

  if (!targetSession) {
    throw { status: 404, message: 'Active session not found' };
  }

  await repository.deactivateSession(targetSession.token_hash);
  await repository.logActivity(userId, 'session:revoked', `Revoked device session from IP: ${targetSession.ip_address}`);
}

// ==========================================
// AUDIT LOGS (Layer 8)
// ==========================================

export async function getUserAuditTrail(userId: string) {
  return repository.getActivityLogs(userId);
}
