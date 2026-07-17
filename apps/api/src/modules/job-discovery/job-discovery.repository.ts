import { query } from '../../infra/database/client.js';
import { NormalizedJob } from 'validation';

export interface JobRow {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source_id: string;
  salary: string | null;
  experience_level: string | null;
  skills: string; // returned as JSON string from DB
  raw_listing_data: string | null; // returned as JSON string from DB
  created_at: Date;
}

/**
 * Saves a normalized job listing to the database.
 * Deduplicates at the database level by discarding insertions with conflicting URLs.
 */
export async function saveJob(
  job: Omit<NormalizedJob, 'id' | 'createdAt'>
): Promise<JobRow | null> {
  const sql = `
    INSERT INTO jobs (title, company, location, description, url, source_id, salary, experience_level, skills, raw_listing_data)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (url) DO NOTHING
    RETURNING *;
  `;
  
  const result = await query<JobRow>(sql, [
    job.title,
    job.company,
    job.location,
    job.description,
    job.url,
    job.sourceId,
    job.salary || null,
    job.experienceLevel || null,
    JSON.stringify(job.skills || []),
    JSON.stringify(job.rawListingData || {}),
  ]);

  return result.rows[0] || null;
}

export async function getJobById(id: string): Promise<JobRow | null> {
  const sql = `SELECT * FROM jobs WHERE id = $1;`;
  const result = await query<JobRow>(sql, [id]);
  return result.rows[0] || null;
}

export async function getJobByUrl(url: string): Promise<JobRow | null> {
  const sql = `SELECT * FROM jobs WHERE url = $1;`;
  const result = await query<JobRow>(sql, [url]);
  return result.rows[0] || null;
}

export async function getJobs(limit: number = 20, offset: number = 0): Promise<JobRow[]> {
  const sql = `
    SELECT * FROM jobs
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;
  `;
  const result = await query<JobRow>(sql, [limit, offset]);
  return result.rows;
}
