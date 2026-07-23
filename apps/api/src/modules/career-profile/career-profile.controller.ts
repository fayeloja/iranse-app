import { Request, Response, NextFunction } from 'express';
import * as service from './career-profile.service.js';

// ==========================================
// EXPERIENCES
// ==========================================

export async function createExperience(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { title, company, location, startDate, endDate, description } = req.body;
    
    const exp = await service.createExperience(userId, title, company, location, startDate, endDate, description);
    res.status(201).json({ status: 'success', data: { experience: exp } });
  } catch (error) {
    next(error);
  }
}

export async function getExperiences(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const experiences = await service.getExperiencesList(userId);
    res.status(200).json({ status: 'success', data: { experiences } });
  } catch (error) {
    next(error);
  }
}

export async function getExperienceDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const experience = await service.getExperienceDetail(userId, id);
    res.status(200).json({ status: 'success', data: { experience } });
  } catch (error) {
    next(error);
  }
}

export async function updateExperience(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, company, location, startDate, endDate, description } = req.body;

    const exp = await service.updateExperience(userId, id, title, company, location, startDate, endDate, description);
    res.status(200).json({ status: 'success', data: { experience: exp } });
  } catch (error) {
    next(error);
  }
}

export async function deleteExperience(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await service.deleteExperience(userId, id);
    res.status(200).json({ status: 'success', message: 'Experience deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// ACHIEVEMENTS
// ==========================================

export async function createAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { experienceId, description, skills } = req.body;

    const ach = await service.createAchievement(userId, experienceId, description, skills);
    res.status(201).json({ status: 'success', data: { achievement: ach } });
  } catch (error) {
    next(error);
  }
}

export async function getAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const achievements = await service.getAchievementsList(userId);
    res.status(200).json({ status: 'success', data: { achievements } });
  } catch (error) {
    next(error);
  }
}

export async function updateAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { description, skills } = req.body;

    const ach = await service.updateAchievement(userId, id, description, skills);
    res.status(200).json({ status: 'success', data: { achievement: ach } });
  } catch (error) {
    next(error);
  }
}

export async function deleteAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await service.deleteAchievement(userId, id);
    res.status(200).json({ status: 'success', message: 'Achievement deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getSkills(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const skills = await service.getSkillsList(userId);
    res.status(200).json({ status: 'success', data: { skills } });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// RESUME VARIANTS
// ==========================================

export async function createResumeVariant(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { name, achievementIds } = req.body;

    const variant = await service.createResumeVariant(userId, name, achievementIds);
    res.status(201).json({ status: 'success', data: { variant } });
  } catch (error) {
    next(error);
  }
}

export async function getResumeVariants(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const variants = await service.getResumeVariantsList(userId);
    res.status(200).json({ status: 'success', data: { variants } });
  } catch (error) {
    next(error);
  }
}

export async function getResumeVariantDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const variant = await service.getResumeVariantDetail(userId, id);
    res.status(200).json({ status: 'success', data: { variant } });
  } catch (error) {
    next(error);
  }
}

export async function deleteResumeVariant(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await service.deleteResumeVariant(userId, id);
    res.status(200).json({ status: 'success', message: 'Resume variant deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// VOICE SNIPPETS
// ==========================================

export async function createVoiceSnippet(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { role, theme, content } = req.body;

    const snippet = await service.createVoiceSnippet(userId, role, theme, content);
    res.status(201).json({ status: 'success', data: { snippet } });
  } catch (error) {
    next(error);
  }
}

export async function getVoiceSnippets(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const snippets = await service.getVoiceSnippetsList(userId);
    res.status(200).json({ status: 'success', data: { snippets } });
  } catch (error) {
    next(error);
  }
}

export async function updateVoiceSnippet(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { role, theme, content } = req.body;

    const snippet = await service.updateVoiceSnippet(userId, id, role, theme, content);
    res.status(200).json({ status: 'success', data: { snippet } });
  } catch (error) {
    next(error);
  }
}

export async function deleteVoiceSnippet(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await service.deleteVoiceSnippet(userId, id);
    res.status(200).json({ status: 'success', message: 'Voice snippet deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// CV STREAM UPLOAD
// ==========================================

export async function uploadCV(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const mimeType = req.headers['content-type'] || 'application/octet-stream';

    // Stream parse the request body chunks directly without needing multer (conforming to memory lightweight limits)
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        if (buffer.length === 0) {
          return res.status(400).json({
            error: { message: 'Upload payload cannot be empty', status: 400 },
          });
        }

        const profile = await service.parseAndSeedProfile(userId, buffer, mimeType);
        res.status(201).json({ status: 'success', data: { profile } });
      } catch (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
}
