/**
 * Schema migrations for Matching Engine module.
 * Creates the job_matches scores and explanation tracking table.
 */

export async function up(pgm) {
  // Create Job Matches Table
  pgm.createTable('job_matches', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    job_id: { type: 'uuid', notNull: true, references: 'jobs', onDelete: 'CASCADE' },
    overall_score: { type: 'integer', notNull: true },
    skills_score: { type: 'integer', notNull: true },
    experience_score: { type: 'integer', notNull: true },
    location_score: { type: 'integer', notNull: true },
    salary_score: { type: 'integer', notNull: true },
    breakdown: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Enforce unique user per job matches
  pgm.addConstraint('job_matches', 'unique_user_job_match', {
    unique: ['user_id', 'job_id'],
  });
}

export async function down(pgm) {
  pgm.dropTable('job_matches');
}
