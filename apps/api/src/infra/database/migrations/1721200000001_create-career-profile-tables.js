/**
 * Schema migrations for Career Profile module.
 * Creates experiences, pgvector-enabled achievements, skills, resume variants, and voice snippets tables.
 */

export async function up(pgm) {
  // 1. Enable pgvector extension
  pgm.sql('CREATE EXTENSION IF NOT EXISTS vector');

  // 2. Create Experiences Table
  pgm.createTable('experiences', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    title: { type: 'varchar(255)', notNull: true },
    company: { type: 'varchar(255)', notNull: true },
    location: { type: 'varchar(255)', notNull: true },
    start_date: { type: 'date', notNull: true },
    end_date: { type: 'date' }, // Null represents current role
    description: { type: 'text' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // 3. Create Achievements Table with pgvector vector column (1536 size is standard for OpenAI / Gemini models)
  pgm.createTable('achievements', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    experience_id: { type: 'uuid', notNull: true, references: 'experiences', onDelete: 'CASCADE' },
    description: { type: 'text', notNull: true },
    embedding: { type: 'vector(1536)' }, // pgvector type
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // 4. Create Normalized Skills Table
  pgm.createTable('skills', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(100)', notNull: true, unique: true },
    category: { type: 'varchar(100)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // 5. Create Achievement Skills Join Table
  pgm.createTable('achievement_skills', {
    achievement_id: { type: 'uuid', notNull: true, references: 'achievements', onDelete: 'CASCADE' },
    skill_id: { type: 'uuid', notNull: true, references: 'skills', onDelete: 'CASCADE' },
  });
  pgm.addConstraint('achievement_skills', 'pk_achievement_skills', {
    primaryKey: ['achievement_id', 'skill_id'],
  });

  // 6. Create Resume Variants Table
  pgm.createTable('resume_variants', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // 7. Create Variant Items Join Table
  pgm.createTable('variant_items', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    variant_id: { type: 'uuid', notNull: true, references: 'resume_variants', onDelete: 'CASCADE' },
    achievement_id: { type: 'uuid', notNull: true, references: 'achievements', onDelete: 'CASCADE' },
    position: { type: 'integer', notNull: true },
  });
  pgm.addConstraint('variant_items', 'unique_variant_item_position', {
    unique: ['variant_id', 'position'],
  });

  // 8. Create Voice Snippets Table
  pgm.createTable('voice_snippets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    role: { type: 'varchar(50)', notNull: true }, // e.g. opening, body, closing
    theme: { type: 'varchar(100)', notNull: true }, // e.g. startup, enterprise, technical
    content: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
}

export async function down(pgm) {
  pgm.dropTable('voice_snippets');
  pgm.dropTable('variant_items');
  pgm.dropTable('resume_variants');
  pgm.dropTable('achievement_skills');
  pgm.dropTable('skills');
  pgm.dropTable('achievements');
  pgm.dropTable('experiences');
  pgm.sql('DROP EXTENSION IF EXISTS vector');
}
