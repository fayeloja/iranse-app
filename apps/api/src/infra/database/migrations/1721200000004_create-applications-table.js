/**
 * Schema migrations for Applications queue tracking module.
 * Creates the applications lifecycle tracking table.
 */

export async function up(pgm) {
  // Create Applications Table
  pgm.createTable('applications', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    job_id: { type: 'uuid', notNull: true, references: 'jobs', onDelete: 'CASCADE' },
    resume_url: { type: 'text' },
    cover_letter: { type: 'text' },
    status: { type: 'queue_status', notNull: true, default: 'PendingApproval' },
    attempts: { type: 'integer', notNull: true, default: 0 },
    max_attempts: { type: 'integer', notNull: true, default: 5 },
    error_log: { type: 'text' },
    submitted_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // Enforce unique user per job application constraint
  pgm.addConstraint('applications', 'unique_user_job_application', {
    unique: ['user_id', 'job_id'],
  });
}

export async function down(pgm) {
  pgm.dropTable('applications');
}
