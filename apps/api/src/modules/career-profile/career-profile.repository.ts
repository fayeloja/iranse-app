import { query, pool } from '../../infra/database/client.js';

export interface ExperienceRow {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string;
  start_date: Date;
  end_date: Date | null;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AchievementRow {
  id: string;
  user_id: string;
  experience_id: string;
  description: string;
  embedding?: string; // pgvector returns as string '[val1,val2,...]'
  created_at: Date;
  updated_at: Date;
}

export interface SkillRow {
  id: string;
  name: string;
  category: string;
  created_at: Date;
}

export interface ResumeVariantRow {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface VariantItemRow {
  id: string;
  variant_id: string;
  achievement_id: string;
  position: number;
}

export interface VoiceSnippetRow {
  id: string;
  user_id: string;
  role: string;
  theme: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

// ==========================================
// EXPERIENCES CRUD
// ==========================================

export async function createExperience(
  userId: string,
  title: string,
  company: string,
  location: string,
  startDate: string,
  endDate: string | null,
  description?: string
): Promise<ExperienceRow> {
  const sql = `
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const result = await query<ExperienceRow>(sql, [
    userId,
    title,
    company,
    location,
    startDate,
    endDate,
    description,
  ]);
  return result.rows[0];
}

export async function getExperiences(userId: string): Promise<ExperienceRow[]> {
  const sql = `
    SELECT * FROM experiences
    WHERE user_id = $1
    ORDER BY start_date DESC;
  `;
  const result = await query<ExperienceRow>(sql, [userId]);
  return result.rows;
}

export async function getExperience(userId: string, id: string): Promise<ExperienceRow | null> {
  const sql = `SELECT * FROM experiences WHERE user_id = $1 AND id = $2;`;
  const result = await query<ExperienceRow>(sql, [userId, id]);
  return result.rows[0] || null;
}

export async function updateExperience(
  userId: string,
  id: string,
  title: string,
  company: string,
  location: string,
  startDate: string,
  endDate: string | null,
  description?: string
): Promise<ExperienceRow | null> {
  const sql = `
    UPDATE experiences
    SET title = $3, company = $4, location = $5, start_date = $6, end_date = $7, description = $8, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1 AND id = $2
    RETURNING *;
  `;
  const result = await query<ExperienceRow>(sql, [
    userId,
    id,
    title,
    company,
    location,
    startDate,
    endDate,
    description,
  ]);
  return result.rows[0] || null;
}

export async function deleteExperience(userId: string, id: string): Promise<boolean> {
  const sql = `DELETE FROM experiences WHERE user_id = $1 AND id = $2;`;
  const result = await query(sql, [userId, id]);
  return result.rowCount ? result.rowCount > 0 : false;
}

// ==========================================
// ACHIEVEMENTS CRUD
// ==========================================

export async function createAchievement(
  userId: string,
  experienceId: string,
  description: string,
  embedding?: number[]
): Promise<AchievementRow> {
  const embeddingString = embedding ? `[${embedding.join(',')}]` : null;
  const sql = `
    INSERT INTO achievements (user_id, experience_id, description, embedding)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const result = await query<AchievementRow>(sql, [userId, experienceId, description, embeddingString]);
  return result.rows[0];
}

export async function getAchievements(userId: string): Promise<AchievementRow[]> {
  const sql = `
    SELECT * FROM achievements
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;
  const result = await query<AchievementRow>(sql, [userId]);
  return result.rows;
}

export async function getAchievement(userId: string, id: string): Promise<AchievementRow | null> {
  const sql = `SELECT * FROM achievements WHERE user_id = $1 AND id = $2;`;
  const result = await query<AchievementRow>(sql, [userId, id]);
  return result.rows[0] || null;
}

export async function updateAchievement(
  userId: string,
  id: string,
  description: string,
  embedding?: number[]
): Promise<AchievementRow | null> {
  const embeddingString = embedding ? `[${embedding.join(',')}]` : null;
  const sql = `
    UPDATE achievements
    SET description = $3, embedding = COALESCE($4, embedding), updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1 AND id = $2
    RETURNING *;
  `;
  const result = await query<AchievementRow>(sql, [userId, id, description, embeddingString]);
  return result.rows[0] || null;
}

export async function deleteAchievement(userId: string, id: string): Promise<boolean> {
  const sql = `DELETE FROM achievements WHERE user_id = $1 AND id = $2;`;
  const result = await query(sql, [userId, id]);
  return result.rowCount ? result.rowCount > 0 : false;
}

// ==========================================
// SKILLS NORMALIZATION
// ==========================================

export async function upsertSkill(name: string, category: string): Promise<SkillRow> {
  const sql = `
    INSERT INTO skills (name, category)
    VALUES ($1, $2)
    ON CONFLICT (name) DO UPDATE
    SET category = EXCLUDED.category
    RETURNING *;
  `;
  const result = await query<SkillRow>(sql, [name.toLowerCase().trim(), category]);
  return result.rows[0];
}

export async function linkAchievementSkill(achievementId: string, skillId: string): Promise<void> {
  const sql = `
    INSERT INTO achievement_skills (achievement_id, skill_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING;
  `;
  await query(sql, [achievementId, skillId]);
}

export async function unlinkAchievementSkills(achievementId: string): Promise<void> {
  const sql = `DELETE FROM achievement_skills WHERE achievement_id = $1;`;
  await query(sql, [achievementId]);
}

export async function getAchievementSkills(achievementId: string): Promise<SkillRow[]> {
  const sql = `
    SELECT s.* FROM skills s
    JOIN achievement_skills ash ON s.id = ash.skill_id
    WHERE ash.achievement_id = $1;
  `;
  const result = await query<SkillRow>(sql, [achievementId]);
  return result.rows;
}

export async function getUserSkills(userId: string): Promise<SkillRow[]> {
  const sql = `
    SELECT DISTINCT s.* FROM skills s
    JOIN achievement_skills ash ON s.id = ash.skill_id
    JOIN achievements a ON ash.achievement_id = a.id
    WHERE a.user_id = $1
    ORDER BY s.category ASC, s.name ASC;
  `;
  const result = await query<SkillRow>(sql, [userId]);
  return result.rows;
}

// ==========================================
// RESUME VARIANTS
// ==========================================

export async function createResumeVariant(userId: string, name: string): Promise<ResumeVariantRow> {
  const sql = `
    INSERT INTO resume_variants (user_id, name)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const result = await query<ResumeVariantRow>(sql, [userId, name]);
  return result.rows[0];
}

export async function getResumeVariants(userId: string): Promise<ResumeVariantRow[]> {
  const sql = `
    SELECT * FROM resume_variants
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;
  const result = await query<ResumeVariantRow>(sql, [userId]);
  return result.rows;
}

export async function getResumeVariant(userId: string, id: string): Promise<ResumeVariantRow | null> {
  const sql = `SELECT * FROM resume_variants WHERE user_id = $1 AND id = $2;`;
  const result = await query<ResumeVariantRow>(sql, [userId, id]);
  return result.rows[0] || null;
}

export async function deleteResumeVariant(userId: string, id: string): Promise<boolean> {
  const sql = `DELETE FROM resume_variants WHERE user_id = $1 AND id = $2;`;
  const result = await query(sql, [userId, id]);
  return result.rowCount ? result.rowCount > 0 : false;
}

export async function clearVariantItems(variantId: string): Promise<void> {
  const sql = `DELETE FROM variant_items WHERE variant_id = $1;`;
  await query(sql, [variantId]);
}

export async function addVariantItem(
  variantId: string,
  achievementId: string,
  position: number
): Promise<VariantItemRow> {
  const sql = `
    INSERT INTO variant_items (variant_id, achievement_id, position)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await query<VariantItemRow>(sql, [variantId, achievementId, position]);
  return result.rows[0];
}

export async function getVariantItems(variantId: string): Promise<VariantItemRow[]> {
  const sql = `
    SELECT * FROM variant_items
    WHERE variant_id = $1
    ORDER BY position ASC;
  `;
  const result = await query<VariantItemRow>(sql, [variantId]);
  return result.rows;
}

// ==========================================
// VOICE SNIPPETS CRUD
// ==========================================

export async function createVoiceSnippet(
  userId: string,
  role: string,
  theme: string,
  content: string
): Promise<VoiceSnippetRow> {
  const sql = `
    INSERT INTO voice_snippets (user_id, role, theme, content)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const result = await query<VoiceSnippetRow>(sql, [userId, role, theme, content]);
  return result.rows[0];
}

export async function getVoiceSnippets(userId: string): Promise<VoiceSnippetRow[]> {
  const sql = `
    SELECT * FROM voice_snippets
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;
  const result = await query<VoiceSnippetRow>(sql, [userId]);
  return result.rows;
}

export async function getVoiceSnippet(userId: string, id: string): Promise<VoiceSnippetRow | null> {
  const sql = `SELECT * FROM voice_snippets WHERE user_id = $1 AND id = $2;`;
  const result = await query<VoiceSnippetRow>(sql, [userId, id]);
  return result.rows[0] || null;
}

export async function updateVoiceSnippet(
  userId: string,
  id: string,
  role: string,
  theme: string,
  content: string
): Promise<VoiceSnippetRow | null> {
  const sql = `
    UPDATE voice_snippets
    SET role = $3, theme = $4, content = $5, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1 AND id = $2
    RETURNING *;
  `;
  const result = await query<VoiceSnippetRow>(sql, [userId, id, role, theme, content]);
  return result.rows[0] || null;
}

export async function deleteVoiceSnippet(userId: string, id: string): Promise<boolean> {
  const sql = `DELETE FROM voice_snippets WHERE user_id = $1 AND id = $2;`;
  const result = await query(sql, [userId, id]);
  return result.rowCount ? result.rowCount > 0 : false;
}
