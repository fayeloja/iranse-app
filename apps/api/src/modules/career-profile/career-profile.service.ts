import { getEmbedding } from '../../infra/embeddings/similarity.js';
import * as repository from './career-profile.repository.js';
import { transaction } from '../../infra/database/client.js';
import { aiService } from '../../services/index.js';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

// ==========================================
// EXPERIENCES
// ==========================================

export async function createExperience(
  userId: string,
  title: string,
  company: string,
  location: string,
  startDate: string,
  endDate: string | null,
  description?: string
) {
  return repository.createExperience(userId, title, company, location, startDate, endDate, description);
}

export async function getExperiencesList(userId: string) {
  return repository.getExperiences(userId);
}

export async function getExperienceDetail(userId: string, id: string) {
  const exp = await repository.getExperience(userId, id);
  if (!exp) {
    throw { status: 404, message: 'Experience record not found' };
  }
  return exp;
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
) {
  const exp = await repository.updateExperience(userId, id, title, company, location, startDate, endDate, description);
  if (!exp) {
    throw { status: 404, message: 'Experience record not found' };
  }
  return exp;
}

export async function deleteExperience(userId: string, id: string) {
  const deleted = await repository.deleteExperience(userId, id);
  if (!deleted) {
    throw { status: 404, message: 'Experience record not found' };
  }
}

// ==========================================
// ACHIEVEMENTS
// ==========================================

export async function createAchievement(
  userId: string,
  experienceId: string,
  description: string,
  skillsList: string[]
) {
  // Enforce Zod matching constraints
  const exp = await repository.getExperience(userId, experienceId);
  if (!exp) {
    throw { status: 400, message: 'Referenced experience does not belong to the user' };
  }

  // Generate vector embeddings using pgvector client (Phase 1 infra helper)
  const embedding = await getEmbedding(description);

  return transaction(async (client) => {
    // 1. Create achievement row
    const achievement = await repository.createAchievement(userId, experienceId, description, embedding);

    // 2. Link skill tags (upserting skills category tags first)
    for (const skillName of skillsList) {
      const skill = await repository.upsertSkill(skillName, 'general');
      await repository.linkAchievementSkill(achievement.id, skill.id);
    }

    return {
      ...achievement,
      skills: skillsList,
    };
  });
}

export async function getAchievementsList(userId: string) {
  const achievements = await repository.getAchievements(userId);
  
  // Link skills to each achievement row
  const results = [];
  for (const ach of achievements) {
    const skills = await repository.getAchievementSkills(ach.id);
    results.push({
      ...ach,
      skills: skills.map(s => s.name),
    });
  }
  return results;
}

export async function updateAchievement(
  userId: string,
  id: string,
  description: string,
  skillsList: string[]
) {
  const ach = await repository.getAchievement(userId, id);
  if (!ach) {
    throw { status: 404, message: 'Achievement record not found' };
  }

  // Recalculate embeddings for updated text
  const embedding = await getEmbedding(description);

  return transaction(async (client) => {
    // 1. Update achievement text and vectors
    const updated = await repository.updateAchievement(userId, id, description, embedding);
    
    // 2. Clear old links and write new skill links
    await repository.unlinkAchievementSkills(id);
    for (const skillName of skillsList) {
      const skill = await repository.upsertSkill(skillName, 'general');
      await repository.linkAchievementSkill(id, skill.id);
    }

    return {
      ...updated,
      skills: skillsList,
    };
  });
}

export async function deleteAchievement(userId: string, id: string) {
  const deleted = await repository.deleteAchievement(userId, id);
  if (!deleted) {
    throw { status: 404, message: 'Achievement record not found' };
  }
}

export async function getSkillsList(userId: string) {
  return repository.getUserSkills(userId);
}

// ==========================================
// RESUME VARIANTS
// ==========================================

export async function createResumeVariant(userId: string, name: string, achievementIds: string[]) {
  // Verify that all achievement IDs belong to the user
  const userAchievements = await repository.getAchievements(userId);
  const userAchievementIds = new Set(userAchievements.map(a => a.id));

  const valid = achievementIds.every(id => userAchievementIds.has(id));
  if (!valid) {
    throw { status: 400, message: 'One or more selected achievements do not belong to the user' };
  }

  return transaction(async (client) => {
    const variant = await repository.createResumeVariant(userId, name);
    
    // Link achievements sequentially maintaining positions
    for (let i = 0; i < achievementIds.length; i++) {
      await repository.addVariantItem(variant.id, achievementIds[i], i);
    }

    return {
      ...variant,
      achievementIds,
    };
  });
}

export async function getResumeVariantsList(userId: string) {
  const variants = await repository.getResumeVariants(userId);
  const results = [];
  for (const v of variants) {
    const items = await repository.getVariantItems(v.id);
    results.push({
      ...v,
      achievementIds: items.map(item => item.achievement_id),
    });
  }
  return results;
}

export async function getResumeVariantDetail(userId: string, id: string) {
  const variant = await repository.getResumeVariant(userId, id);
  if (!variant) {
    throw { status: 404, message: 'Resume variant not found' };
  }
  const items = await repository.getVariantItems(variant.id);
  return {
    ...variant,
    achievementIds: items.map(item => item.achievement_id),
  };
}

export async function deleteResumeVariant(userId: string, id: string) {
  const deleted = await repository.deleteResumeVariant(userId, id);
  if (!deleted) {
    throw { status: 404, message: 'Resume variant not found' };
  }
}

// ==========================================
// VOICE SNIPPETS
// ==========================================

export async function createVoiceSnippet(userId: string, role: string, theme: string, content: string) {
  return repository.createVoiceSnippet(userId, role, theme, content);
}

export async function getVoiceSnippetsList(userId: string) {
  return repository.getVoiceSnippets(userId);
}

export async function updateVoiceSnippet(userId: string, id: string, role: string, theme: string, content: string) {
  const snippet = await repository.updateVoiceSnippet(userId, id, role, theme, content);
  if (!snippet) {
    throw { status: 404, message: 'Voice snippet not found' };
  }
  return snippet;
}

export async function deleteVoiceSnippet(userId: string, id: string) {
  const deleted = await repository.deleteVoiceSnippet(userId, id);
  if (!deleted) {
    throw { status: 404, message: 'Voice snippet not found' };
  }
}

// ==========================================
// CV PARSE & INGESTION (Seed Career profile)
// ==========================================

export interface ParsedCVProfile {
  experiences: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string | null;
    description: string;
    achievements: Array<{
      description: string;
      skills: string[];
    }>;
  }>;
  skills: Array<{ name: string; category: string }>;
  voiceSnippets: Array<{ role: 'opening' | 'body' | 'closing'; theme: string; content: string }>;
}

/**
 * Extracts text from PDF file buffers using pdf-parse v2 API.
 */
async function extractTextFromPDFBuffer(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    if (result && result.text && result.text.trim().length > 0) {
      return result.text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, ' ').trim();
    }
  } catch (err: any) {
    console.warn(`⚠️ PDFParse stream extraction failed (${err?.message || err}).`);
  }
  return '';
}

/**
 * Extracts plain text from Microsoft Word (.docx) file buffers using mammoth.
 */
async function extractTextFromDOCXBuffer(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (result && result.value && result.value.trim().length > 0) {
      return result.value.trim();
    }
  } catch (err: any) {
    console.warn(`⚠️ mammoth DOCX extraction failed (${err?.message || err}).`);
  }
  return '';
}

/**
 * Extracts CV text and calls Gemini Structured Output API to parse details.
 * Performs database insertion of experiences, achievements, vector embeddings,
 * skills taxonomies, and voice snippets in a transaction.
 */
export async function parseAndSeedProfile(userId: string, fileBuffer: Buffer, mimeType: string) {
  let cvText = '';

  // Detect document type by MIME type or magic bytes
  const isDocx =
    mimeType.includes('wordprocessingml') ||
    mimeType.includes('docx') ||
    mimeType.includes('msword') ||
    (fileBuffer.length > 4 && fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b);

  const isPdf =
    mimeType.includes('pdf') ||
    (fileBuffer.length > 4 && fileBuffer.toString('ascii', 0, 4) === '%PDF');

  if (isDocx) {
    cvText = await extractTextFromDOCXBuffer(fileBuffer);
  } else if (isPdf) {
    cvText = await extractTextFromPDFBuffer(fileBuffer);
  }

  // Fallback for plain text, Markdown, or unrecognized documents:
  if (!cvText || cvText.trim().length < 20) {
    const utf8Str = fileBuffer.toString('utf8');
    if (!utf8Str.includes('\0') && utf8Str.trim().length > 20) {
      cvText = utf8Str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  console.log(`📄 Extracted ${cvText.length} chars of CV text for parsing. Preview: "${cvText.slice(0, 150)}..."`);

  // Sanity check word count of extracted text to ensure actual resume content exists
  const words = cvText.trim().split(/\s+/).filter(w => w.length > 1);
  if (!cvText || words.length < 15) {
    throw {
      status: 400,
      message: 'Could not extract readable resume text from document. Please upload a PDF containing selectable text or a plain text file.',
    };
  }

  let parsedProfile: ParsedCVProfile;

  try {
    const prompt = `Analyze this candidate CV text and extract all work experiences, achievements, skills, and voice snippets.
    Return a JSON matching this structure:
    {
      "experiences": [
        {
          "title": "Job Title",
          "company": "Company Name",
          "location": "Location (e.g. Lagos, Nigeria or Remote)",
          "startDate": "YYYY-MM-DD or YYYY-MM or YYYY",
          "endDate": "YYYY-MM-DD or YYYY-MM or YYYY" or null,
          "description": "Responsibilities summary",
          "achievements": [
            {
              "description": "Specific quantified action and result bullet",
              "skills": ["Skill1", "Skill2"]
            }
          ]
        }
      ],
      "skills": [
        { "name": "SkillName", "category": "languages|databases|frameworks|tools|general" }
      ],
      "voiceSnippets": [
        { "role": "opening|body|closing", "theme": "technical", "content": "Professional bio snippet formulated in user's style" }
      ]
    }

    Notes:
    - Extract ALL work history entries found in the CV text.
    - Extract ALL technical skills, tools, and frameworks mentioned.
    - Formulate at least 1 opening voice snippet summarize candidate bio style.
    
    CV TEXT:
    ${cvText}`;

    parsedProfile = await aiService.generateStructuredOutput<ParsedCVProfile>(prompt);
  } catch (err: any) {
    console.warn(`⚠️ Central AI parsing failed (${err?.message || err}).`);
    throw {
      status: 500,
      message: `Failed to parse CV content via AI orchestrator: ${err?.message || 'Invalid structured output'}`,
    };
  }

  // Database insertion within a single SQL transaction
  return transaction(async (client) => {
    const experiencesSaved = [];

    // 1. Save Experiences and Achievements
    for (const exp of parsedProfile.experiences) {
      const dbExp = await repository.createExperience(
        userId,
        exp.title,
        exp.company,
        exp.location,
        exp.startDate,
        exp.endDate,
        exp.description
      );

      const achievementsSaved = [];
      for (const ach of exp.achievements) {
        // Generate vector embedding for each parsed achievement
        const embedding = await getEmbedding(ach.description);
        const dbAch = await repository.createAchievement(userId, dbExp.id, ach.description, embedding);

        // Link skills to achievement
        for (const skillName of ach.skills) {
          const dbSkill = await repository.upsertSkill(skillName, 'general');
          await repository.linkAchievementSkill(dbAch.id, dbSkill.id);
        }
        achievementsSaved.push({ ...dbAch, skills: ach.skills });
      }

      experiencesSaved.push({
        ...dbExp,
        achievements: achievementsSaved,
      });
    }

    // 2. Register separate standalone Skills tags
    for (const sk of parsedProfile.skills) {
      await repository.upsertSkill(sk.name, sk.category);
    }

    // 3. Register Voice Snippets
    const snippetsSaved = [];
    for (const vs of parsedProfile.voiceSnippets) {
      const dbVs = await repository.createVoiceSnippet(userId, vs.role, vs.theme, vs.content);
      snippetsSaved.push(dbVs);
    }

    return {
      experiences: experiencesSaved,
      skills: parsedProfile.skills,
      voiceSnippets: snippetsSaved,
    };
  });
}
