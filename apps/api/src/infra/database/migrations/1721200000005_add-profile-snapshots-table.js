/**
 * Schema migration for Profile Snapshots (Identity Layer 10).
 * Stores immutable JSON snapshot of candidate career profile at application time.
 */

export async function up(pgm) {
  pgm.createTable('profile_snapshots', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    application_id: { type: 'uuid', notNull: true, references: 'applications', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    snapshot_data: { type: 'jsonb', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  pgm.addConstraint('profile_snapshots', 'unique_application_snapshot', {
    unique: ['application_id'],
  });
}

export async function down(pgm) {
  pgm.dropTable('profile_snapshots');
}
