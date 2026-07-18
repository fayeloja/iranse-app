import { Request, Response, NextFunction } from 'express';
import * as service from './applications.service.js';

export async function initiate(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { jobId } = req.body;

    const result = await service.initiateApplication(userId, jobId);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { jobId } = req.body;

    const result = await service.approveAndQueueApplication(userId, jobId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function getApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const applications = await service.getUserApplicationsList(userId, limit, offset);
    res.status(200).json({ status: 'success', data: { applications } });
  } catch (error) {
    next(error);
  }
}
