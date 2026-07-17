import { query, pool } from '../../infra/database/client.js';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  phone: string;
  full_name: string;
  role: string;
  verification_status: string;
  created_at: Date;
  updated_at: Date;
}

export interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address: string;
  user_agent: string;
  browser?: string;
  os?: string;
  is_active: boolean;
  last_active_at: Date;
  created_at: Date;
}

export interface ConsentRow {
  id: string;
  user_id: string;
  consent_version: string;
  ip_address: string;
  user_agent: string;
  country_code?: string;
  agreed: boolean;
  created_at: Date;
}

export interface ConnectedAccountRow {
  id: string;
  user_id: string;
  portal_id: string;
  username: string;
  password_encrypted: string;
  cookies?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ActivityLogRow {
  id: string;
  user_id: string;
  action: string;
  details?: string;
  created_at: Date;
}

// ==========================================
// USERS CRUD
// ==========================================

export async function createUser(
  email: string,
  passwordHash: string,
  phone: string,
  fullName: string
): Promise<UserRow> {
  const sql = `
    INSERT INTO users (email, password_hash, phone, full_name)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const result = await query<UserRow>(sql, [email, passwordHash, phone, fullName]);
  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const sql = `SELECT * FROM users WHERE email = $1;`;
  const result = await query<UserRow>(sql, [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const sql = `SELECT * FROM users WHERE id = $1;`;
  const result = await query<UserRow>(sql, [id]);
  return result.rows[0] || null;
}

export async function updateUserVerificationStatus(
  userId: string,
  status: string
): Promise<UserRow | null> {
  const sql = `
    UPDATE users
    SET verification_status = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `;
  const result = await query<UserRow>(sql, [userId, status]);
  return result.rows[0] || null;
}

// ==========================================
// DEVICE SESSIONS (Layer 5)
// ==========================================

export async function createSession(
  userId: string,
  tokenHash: string,
  ipAddress: string,
  userAgent: string,
  browser?: string,
  os?: string
): Promise<SessionRow> {
  const sql = `
    INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, browser, os)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const result = await query<SessionRow>(sql, [userId, tokenHash, ipAddress, userAgent, browser, os]);
  return result.rows[0];
}

export async function getSessionByTokenHash(tokenHash: string): Promise<SessionRow | null> {
  const sql = `SELECT * FROM user_sessions WHERE token_hash = $1 AND is_active = true;`;
  const result = await query<SessionRow>(sql, [tokenHash]);
  return result.rows[0] || null;
}

export async function updateSessionActivity(tokenHash: string): Promise<void> {
  const sql = `
    UPDATE user_sessions
    SET last_active_at = CURRENT_TIMESTAMP
    WHERE token_hash = $1;
  `;
  await query(sql, [tokenHash]);
}

export async function deactivateSession(tokenHash: string): Promise<boolean> {
  const sql = `
    UPDATE user_sessions
    SET is_active = false
    WHERE token_hash = $1
    RETURNING is_active;
  `;
  const result = await query(sql, [tokenHash]);
  return result.rowCount ? result.rowCount > 0 : false;
}

export async function deactivateAllUserSessions(userId: string): Promise<void> {
  const sql = `
    UPDATE user_sessions
    SET is_active = false
    WHERE user_id = $1;
  `;
  await query(sql, [userId]);
}

export async function getActiveUserSessions(userId: string): Promise<SessionRow[]> {
  const sql = `
    SELECT id, user_id, ip_address, user_agent, browser, os, is_active, last_active_at, created_at
    FROM user_sessions
    WHERE user_id = $1 AND is_active = true
    ORDER BY last_active_at DESC;
  `;
  const result = await query<SessionRow>(sql, [userId]);
  return result.rows;
}

// ==========================================
// LEGAL CONSENTS (Layer 6)
// ==========================================

export async function logConsent(
  userId: string,
  consentVersion: string,
  ipAddress: string,
  userAgent: string,
  countryCode?: string
): Promise<ConsentRow> {
  const sql = `
    INSERT INTO user_consents (user_id, consent_version, ip_address, user_agent, country_code)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const result = await query<ConsentRow>(sql, [userId, consentVersion, ipAddress, userAgent, countryCode]);
  return result.rows[0];
}

export async function getUserConsents(userId: string): Promise<ConsentRow[]> {
  const sql = `
    SELECT * FROM user_consents
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;
  const result = await query<ConsentRow>(sql, [userId]);
  return result.rows;
}

// ==========================================
// CONNECTED ACCOUNTS CREDENTIALS (Layer 7)
// ==========================================

export async function upsertConnectedAccount(
  userId: string,
  portalId: string,
  username: string,
  passwordEncrypted: string,
  cookies?: string
): Promise<ConnectedAccountRow> {
  const sql = `
    INSERT INTO connected_accounts (user_id, portal_id, username, password_encrypted, cookies, updated_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, portal_id) DO UPDATE
    SET username = EXCLUDED.username,
        password_encrypted = EXCLUDED.password_encrypted,
        cookies = COALESCE(EXCLUDED.cookies, connected_accounts.cookies),
        updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const result = await query<ConnectedAccountRow>(sql, [
    userId,
    portalId,
    username,
    passwordEncrypted,
    cookies,
  ]);
  return result.rows[0];
}

export async function getConnectedAccounts(userId: string): Promise<ConnectedAccountRow[]> {
  const sql = `
    SELECT id, user_id, portal_id, username, created_at, updated_at
    FROM connected_accounts
    WHERE user_id = $1;
  `;
  const result = await query<ConnectedAccountRow>(sql, [userId]);
  return result.rows;
}

export async function getConnectedAccount(
  userId: string,
  portalId: string
): Promise<ConnectedAccountRow | null> {
  const sql = `SELECT * FROM connected_accounts WHERE user_id = $1 AND portal_id = $2;`;
  const result = await query<ConnectedAccountRow>(sql, [userId, portalId]);
  return result.rows[0] || null;
}

export async function deleteConnectedAccount(userId: string, portalId: string): Promise<boolean> {
  const sql = `
    DELETE FROM connected_accounts
    WHERE user_id = $1 AND portal_id = $2;
  `;
  const result = await query(sql, [userId, portalId]);
  return result.rowCount ? result.rowCount > 0 : false;
}

// ==========================================
// ACTIVITY AUDIT TRAIL (Layer 8)
// ==========================================

export async function logActivity(
  userId: string,
  action: string,
  details?: string
): Promise<ActivityLogRow> {
  const sql = `
    INSERT INTO agent_activity_logs (user_id, action, details)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await query<ActivityLogRow>(sql, [userId, action, details]);
  return result.rows[0];
}

export async function getActivityLogs(userId: string): Promise<ActivityLogRow[]> {
  const sql = `
    SELECT * FROM agent_activity_logs
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;
  const result = await query<ActivityLogRow>(sql, [userId]);
  return result.rows;
}
