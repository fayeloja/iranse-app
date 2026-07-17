import { Redis } from 'ioredis';
import { env } from '../../config/env.js';

/**
 * Shared Redis connection instance for BullMQ queues and workers.
 * BullMQ requires maxRetriesPerRequest to be null to handle long-polling safely.
 */
export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
export default redisConnection;
