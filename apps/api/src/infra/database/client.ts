import pg from 'pg';
import { env } from '../../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

/**
 * Executes a parameterized SQL query against the database pool.
 * Parameterization is enforced to prevent SQL injection (Standards Rule 8).
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

/**
 * Helper to run query logic within a secure Postgres transaction block.
 * Handles client checkout, BEGIN, COMMIT, and releases connection in finally.
 * Automatically triggers ROLLBACK on query failure.
 */
export async function transaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
