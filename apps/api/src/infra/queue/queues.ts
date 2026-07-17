import { Queue } from 'bullmq';
import { redisConnection } from './connection.js';

export const QUEUES = {
  JOB_INGESTION: 'job-ingestion',
  APPLICATIONS: 'applications',
  MATCHING: 'matching',
} as const;

/**
 * Job Ingestion Queue:
 * Handles fetching, parsing, and deduplicating job listings.
 */
export const ingestionQueue = new Queue(QUEUES.JOB_INGESTION, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});

/**
 * Applications Queue:
 * Handles submitting user application materials to external portals.
 * Critical rate limits apply at processing stage (Phase 7).
 */
export const applicationsQueue = new Queue(QUEUES.APPLICATIONS, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: { age: 86400 * 7 }, // Keep application logs for 7 days
    removeOnFail: { age: 86400 * 30 },   // Keep failures for 30 days
  },
});

/**
 * Matching Queue:
 * Processes multi-dimensional scoring for ingested jobs against candidate profiles.
 */
export const matchingQueue = new Queue(QUEUES.MATCHING, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
  },
});
