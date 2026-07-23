/**
 * Schema migrations for Identity, Trust & Consent Platform (Decision #14).
 * Creates roles/verification enums, users, user_sessions, consents, connected job board accounts, and activity logs.
 */

export async function up(pgm) {
  // Enable pgcrypto extension for gen_random_uuid() helper if not enabled
  pgm.sql('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  // 1. Create custom enums
  pgm.createType('user_role', ['guest', 'user', 'premium', 'admin', 'support', 'superadmin', 'ai_worker']);
  pgm.createType('verification_status', ['anonymous', 'registered', 'email_verified', 'phone_verified', 'nin_verified', 'career_verified']);
  pgm.createType('queue_status', ['PendingApproval', 'Queued', 'RateLimited', 'Submitting', 'Submitted', 'Failed']);

  // 2. Create Users Table
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    phone: { type: 'varchar(50)', notNull: true },
    full_name: { type: 'varchar(255)', notNull: true },
    role: { type: 'user_role', notNull: true, default: 'user' },
    verification_status: { type: 'verification_status', notNull: true, default: 'registered' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // 3. Create User Sessions Table (Device Sessions tracker - Identity Layer 5)
  pgm.createTable('user_sessions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    token_hash: { type: 'varchar(255)', notNull: true, unique: true },
    ip_address: { type: 'varchar(45)', notNull: true },
    user_agent: { type: 'text', notNull: true },
    browser: { type: 'varchar(100)' },
    os: { type: 'varchar(100)' },
    is_active: { type: 'boolean', notNull: true, default: true },
    last_active_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // 4. Create User Consents Table (Auto-Apply legal waiver signatures - Identity Layer 6)
  pgm.createTable('user_consents', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    consent_version: { type: 'varchar(50)', notNull: true },
    ip_address: { type: 'varchar(45)', notNull: true },
    user_agent: { type: 'text', notNull: true },
    country_code: { type: 'varchar(10)' },
    agreed: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });

  // 5. Create Agent Activity Logs Table (Audit trail - Identity Layer 8)
  pgm.createTable('agent_activity_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    action: { type: 'varchar(255)', notNull: true },
    details: { type: 'text' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  });
}

export async function down(pgm) {
  pgm.dropTable('agent_activity_logs');
  pgm.dropTable('user_consents');
  pgm.dropTable('user_sessions');
  pgm.dropTable('users');
  pgm.dropType('queue_status');
  pgm.dropType('verification_status');
  pgm.dropType('user_role');
}
