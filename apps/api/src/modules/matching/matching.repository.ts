import { query } from '../../infra/database/client.js';

export interface JobMatchRow {
  id: string;
  user_id: string;
  job_id: string;
  overall_score: number;
  skills_score: number;
  experience_score: number;
  location_score: number;
  salary_score: number;
  breakdown: string; // returned as JSON string
  created_at: Date;
  updated_at: Date;
}

export interface UserMatchDetailsRow extends JobMatchRow {
  title: string;
  company: string;
  location: string;
  salary: string | null;
  experience_level: string | null;
  url: string;
}

/**
 * Saves or updates a user-to-job match result.
 */
export async function upsertJobMatch(
  userId: string,
  jobId: string,
  overallScore: number,
  skillsScore: number,
  experienceScore: number,
  locationScore: number,
  salaryScore: number,
  breakdown: any
): Promise<JobMatchRow> {
  const sql = `
    INSERT INTO job_matches (
      user_id, job_id, overall_score, skills_score, experience_score, location_score, salary_score, breakdown, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, job_id) DO UPDATE
    SET overall_score = EXCLUDED.overall_score,
        skills_score = EXCLUDED.skills_score,
        experience_score = EXCLUDED.experience_score,
        location_score = EXCLUDED.location_score,
        salary_score = EXCLUDED.salary_score,
        breakdown = EXCLUDED.breakdown,
        updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const result = await query<JobMatchRow>(sql, [
    userId,
    jobId,
    overallScore,
    skillsScore,
    experienceScore,
    locationScore,
    salaryScore,
    JSON.stringify(breakdown),
  ]);

  return result.rows[0];
}

export async function getJobMatch(userId: string, jobId: string): Promise<JobMatchRow | null> {
  const sql = `SELECT * FROM job_matches WHERE user_id = $1 AND job_id = $2;`;
  const result = await query<JobMatchRow>(sql, [userId, jobId]);
  return result.rows[0] || null;
}

/**
 * Retrieves the matching list for a candidate, joined against original jobs listings details (PRD 6.3).
 */
export async function getUserMatches(
  userId: string,
  minScore: number = 0,
  limit: number = 20,
  offset: number = 0
): Promise<UserMatchDetailsRow[]> {
  const sql = `
    SELECT jm.*, j.title, j.company, j.location, j.salary, j.experience_level, j.url
    FROM job_matches jm
    JOIN jobs j ON jm.job_id = j.id
    WHERE jm.user_id = $1 AND jm.overall_score >= $2
    ORDER BY jm.overall_score DESC, jm.updated_at DESC
    LIMIT $3 OFFSET $4;
  `;
  const result = await query<UserMatchDetailsRow>(sql, [userId, minScore, limit, offset]);
  return result.rows;
}

/**
 * Returns all active user IDs in the system to run job matches against.
 */
export async function getAllActiveUsers(): Promise<Array<{ id: string }>> {
    const sql = `SELECT id FROM users;`;
    const result = await query<{ id: string }>(sql);
    return result.rows;
  }
  
  /**
   * Retrieves the new matching list since a specific date for a candidate, joined against original jobs listings details.
   */
  export async function getNewMatchesSince(
    userId: string,
    sinceDate: Date,
    limit: number = 5
  ): Promise<UserMatchDetailsRow[]> {
    const sql = `
      SELECT jm.*, j.title, j.company, j.location, j.salary, j.experience_level, j.url
      FROM job_matches jm
      JOIN jobs j ON jm.job_id = j.id
      WHERE jm.user_id = $1 AND jm.updated_at >= $2
      ORDER BY jm.overall_score DESC, jm.updated_at DESC
      LIMIT $3;
    `;
    const result = await query<UserMatchDetailsRow>(sql, [userId, sinceDate, limit]);
    return result.rows;
  }
  
  /**
   * Returns a count of new matches since a given date.
   */
  export async function getMatchesSummary(userId: string, sinceDate: Date): Promise<{ count: number }> {
    const sql = `SELECT COUNT(*) as count FROM job_matches WHERE user_id = $1 AND updated_at >= $2;`;
    const result = await query<{ count: string }>(sql, [userId, sinceDate]);
    return { count: parseInt(result.rows[0].count, 10) };
  }
