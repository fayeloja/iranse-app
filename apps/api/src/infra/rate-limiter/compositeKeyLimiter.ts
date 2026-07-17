import Redis from 'ioredis';
import { env } from '../../config/env.js';

// Create a dedicated Redis client for rate limiting (separate from queues if needed)
export const redisRateClient = new Redis(env.REDIS_URL);

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Sliding window rate limiter using Redis sorted sets.
 * Uses a composite key: ratelimit:{userId}:{portal}:{action} (Decision #5, Standards Rule 3)
 * 
 * @param userId - The user ID being throttled
 * @param portal - The target job portal ID (e.g. 'greenhouse', 'jobberman')
 * @param action - The action type (e.g. 'submit', 'scrape')
 * @param limit - The maximum requests allowed in the window
 * @param windowMs - The time window duration in milliseconds
 */
export async function checkLimit(
  userId: string,
  portal: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${userId}:${portal}:${action}`;
  const now = Date.now();
  const clearBefore = now - windowMs;

  const multi = redisRateClient.multi();
  // Remove old timestamps outside the sliding window
  multi.zremrangebyscore(key, 0, clearBefore);
  // Add the current request timestamp
  multi.zadd(key, now, now.toString());
  // Get count of requests in the active window
  multi.zcard(key);
  // Get the oldest request timestamp in the active window
  multi.zrange(key, 0, 0);
  // Set expiry on the Redis key to clean up inactive keys
  multi.pexpire(key, windowMs);

  const results = await multi.exec();
  if (!results) {
    throw new Error('Redis rate limiter transaction failed');
  }

  // Multi exec returns array of [err, value] tuples
  const cardResult = results[2][1] as number;
  const oldestRange = results[3][1] as string[];
  const oldestTimestamp = oldestRange && oldestRange.length > 0 ? parseInt(oldestRange[0], 10) : now;

  const limited = cardResult > limit;
  const remaining = Math.max(0, limit - cardResult);
  const resetMs = oldestTimestamp + windowMs - now;

  // If limited, delete the timestamp we just added to prevent throttling future valid requests
  if (limited) {
    await redisRateClient.zrem(key, now.toString());
  }

  return {
    limited,
    remaining,
    resetMs: Math.max(0, resetMs),
  };
}
