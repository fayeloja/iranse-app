/**
 * Schema migrations for Job Ingestion & Discovery module.
 * Creates the normalized jobs store table.
 */

export async function up(pgm) {
  // Create Jobs Table
  pgm.createTable('jobs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    title: { type: 'varchar(255)', notNull: true },
    company: { type: 'varchar(255)', notNull: true },
    location: { type: 'varchar(255)', notNull: true },
    description: { type: 'text', notNull: true },
    url: { type: 'text', notNull: true, unique: true },
    source_id: { type: 'varchar(100)', notNull: true },
    salary: { type: 'varchar(100)' },
    experience_level: { type: 'varchar(100)' },
    skills: { type: 'jsonb', notNull: true, default: '[]' },
    raw_listing_data: { type: 'jsonb' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
}

export async function down(pgm) {
  pgm.dropTable('jobs');
}
