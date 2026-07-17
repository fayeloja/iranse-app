import { Request, Response, NextFunction } from 'express';
import * as service from './job-discovery.service.js';

export async function triggerIngestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { sourceId } = req.body;
    const result = await service.runIngestion(sourceId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
}

export async function getJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const jobs = await service.getJobsList(limit, offset);
    res.status(200).json({ status: 'success', data: { jobs } });
  } catch (error) {
    next(error);
  }
}
