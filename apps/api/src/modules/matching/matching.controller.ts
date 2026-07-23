import { Request, Response, NextFunction } from 'express';
import * as service from './matching.service.js';

export async function getMatches(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const minScore = parseInt(req.query.minScore as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const matches = await service.getUserMatches(userId, minScore, limit, offset);
    res.status(200).json({ status: 'success', data: { matches } });
  } catch (error) {
    next(error);
  }
}

export async function calculateMatch(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, jobId } = req.body;
    const result = await service.calculateUserJobMatch(userId, jobId);
    res.status(200).json({ status: 'success', data: { match: result } });
  } catch (error) {
    next(error);
  }
}

export async function getDigest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const digest = await service.getUserDigest(userId);
    res.status(200).json({ status: 'success', data: { digest } });
  } catch (error) {
    next(error);
  }
}
