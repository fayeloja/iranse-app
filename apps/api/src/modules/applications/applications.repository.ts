import { query } from '../../infra/database/client.js';

export interface ApplicationRow {
  id: string;
  user_id: string;
  job_id: string;
  resume_url: string | null;
  cover_letter: string | null;
  status: 'PendingApproval' | 'Queued' | 'RateLimited' | 'Submitting' | 'Submitted' | 'Failed';
  attempts: number;
  max_attempts: number;
  error_log: string | null;
  submitted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApplicationDetailsRow extends ApplicationRow {
  title: string;
  company: string;
  location: string;
  url: string;
}

export async function createApplication(
  userId: string,
  jobId: string,
  resumeUrl?: string,
  coverLetter?: string,
  status: string = 'PendingApproval'
): Promise<ApplicationRow> {
  const sql = `
    INSERT INTO applications (user_id, job_id, resume_url, cover_letter, status)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, job_id) DO UPDATE
    SET resume_url = COALESCE(EXCLUDED.resume_url, applications.resume_url),
        cover_letter = COALESCE(EXCLUDED.cover_letter, applications.cover_letter),
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const result = await query<ApplicationRow>(sql, [userId, jobId, resumeUrl, coverLetter, status]);
  return result.rows[0];
}

export async function getApplication(id: string): Promise<ApplicationRow | null> {
  const sql = `SELECT * FROM applications WHERE id = $1;`;
  const result = await query<ApplicationRow>(sql, [id]);
  return result.rows[0] || null;
}

export async function getApplicationByUserAndJob(userId: string, jobId: string): Promise<ApplicationRow | null> {
  const sql = `SELECT * FROM applications WHERE user_id = $1 AND job_id = $2;`;
  const result = await query<ApplicationRow>(sql, [userId, jobId]);
  return result.rows[0] || null;
}

export async function updateApplicationStatus(
  id: string,
  status: string,
  errorLog: string | null = null,
  incrementAttempts: boolean = false
): Promise<ApplicationRow | null> {
  const sql = `
    UPDATE applications
    SET status = $2::queue_status,
        error_log = COALESCE($3, error_log),
        attempts = case when $4 = true then attempts + 1 else attempts end,
        submitted_at = case when $2::text = 'Submitted' then CURRENT_TIMESTAMP else submitted_at end,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `;
  const result = await query<ApplicationRow>(sql, [id, status, errorLog, incrementAttempts]);
  return result.rows[0] || null;
}

export async function getUserApplications(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ApplicationDetailsRow[]> {
  const sql = `
    SELECT a.*, j.title, j.company, j.location, j.url
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.user_id = $1
    ORDER BY a.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const result = await query<ApplicationDetailsRow>(sql, [userId, limit, offset]);
  return result.rows;
}

export async function getMonthlyApplicationCount(userId: string): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count 
    FROM applications 
    WHERE user_id = $1 
      AND status != 'PendingApproval'
      AND created_at >= date_trunc('month', CURRENT_DATE);
  `;
  const result = await query<{ count: string }>(sql, [userId]);
  return parseInt(result.rows[0].count, 10) || 0;
}

export async function createProfileSnapshot(
  applicationId: string,
  userId: string,
  snapshotData: any
): Promise<void> {
  const sql = `
    INSERT INTO profile_snapshots (application_id, user_id, snapshot_data)
    VALUES ($1, $2, $3)
    ON CONFLICT (application_id) DO UPDATE
    SET snapshot_data = EXCLUDED.snapshot_data;
  `;
  await query(sql, [applicationId, userId, JSON.stringify(snapshotData)]);
}
