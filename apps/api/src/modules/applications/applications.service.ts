import * as repository from './applications.repository.js';
import { generateTailoredMaterials } from '../application-materials/materials.service.js';
import { getDecryptedPortalCredentials } from '../identity/identity.service.js';
import { getJobById } from '../job-discovery/job-discovery.repository.js';
import { checkLimit } from '../../infra/rate-limiter/compositeKeyLimiter.js';
import { applicationsQueue } from '../../infra/queue/queues.js';
import { env } from '../../config/env.js';

/**
 * Initiates the application drafting flow: generates tailored resume variant
 * and Cover Letter, storing in database as PendingApproval (PRD 6.4).
 */
export async function initiateApplication(userId: string, jobId: string) {
  const materials = await generateTailoredMaterials(userId, jobId);
  
  const app = await repository.createApplication(
    userId,
    jobId,
    materials.resumeUrl,
    materials.coverLetter,
    'PendingApproval'
  );

  return {
    applicationId: app.id,
    status: app.status,
    materials,
  };
}

/**
 * Candidate approval workflow. Shifts status from PendingApproval to Queued
 * and enqueues BullMQ worker execution (PRD 6.4).
 */
export async function approveAndQueueApplication(userId: string, jobId: string) {
  const app = await repository.getApplicationByUserAndJob(userId, jobId);
  if (!app) {
    throw { status: 404, message: 'Draft application not found.' };
  }

  if (app.status !== 'PendingApproval') {
    throw { status: 400, message: `Cannot queue application in state: ${app.status}` };
  }

  // Check cap
  // TODO: When billing is implemented, this check should look up the user's subscription tier
  const status = await getUserMonthlyApplicationStatus(userId);
  if (status.used >= status.limit) {
    throw { status: 403, message: `Free-tier monthly application cap reached (${status.limit}/month). Upgrade to Premium for more applications.` };
  }

  // Update status to Queued
  const updatedApp = await repository.updateApplicationStatus(app.id, 'Queued');
  
  // Enqueue job in BullMQ Applications Queue
  await applicationsQueue.add('submit-application', { applicationId: app.id });

  return {
    applicationId: app.id,
    status: updatedApp?.status || 'Queued',
  };
}

/**
 * Worker Core Submission Executor:
 * Validates session credentials, rate-limiting windows, and runs the mock browser submitters.
 */
export async function processApplicationSubmission(applicationId: string) {
  const app = await repository.getApplication(applicationId);
  if (!app) {
    throw new Error(`Application [${applicationId}] not found in database.`);
  }

  // Double-check terminal status state (avoid double submission)
  if (app.status === 'Submitted' || app.status === 'Failed') {
    return { status: app.status, skipped: true };
  }

  const job = await getJobById(app.job_id);
  if (!job) {
    throw new Error(`Job listing [${app.job_id}] not found.`);
  }

  // 1. Shift state to Submitting
  await repository.updateApplicationStatus(applicationId, 'Submitting');

  const sourceId = job.source_id;

  try {
    // 2. Sliding window Rate Limiter check (composite key userId:portal:action - Decision #3)
    const rateLimitConfig = { requestsPerWindow: 1, windowMs: 10000 }; // 1 submission per 10 seconds limit
    
    const limitCheck = await checkLimit(
      app.user_id,
      sourceId,
      'submit',
      rateLimitConfig.requestsPerWindow,
      rateLimitConfig.windowMs
    );

    if (limitCheck.limited) {
      // Delay and re-queue in BullMQ
      console.warn(`⚠️ Rate limit hit for User [${app.user_id}] on Portal [${sourceId}]. Rescheduling...`);
      await repository.updateApplicationStatus(applicationId, 'RateLimited', 'Rate limit hit, delayed');
      throw new Error(`Rate limit exceeded for portal submission on: ${sourceId}`);
    }

    // 3. Retrieve decrypted external connected portal credentials (Identity Layer 7)
    const credentials = await getDecryptedPortalCredentials(app.user_id, sourceId);
    console.log(`📡 Worker: Authenticating user against portal [${sourceId}] with username: ${credentials.username}`);

    // 4. Execute submission (For MVP, run mock simulation delays)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // 5. Success - update status
    await repository.updateApplicationStatus(applicationId, 'Submitted');
    console.log(`✅ Application [${applicationId}] successfully submitted to ${sourceId}!`);

    return { status: 'Submitted' };
  } catch (err: any) {
    console.error(`❌ Submission failed for Application [${applicationId}]:`, err.message || err);
    
    const incrementAttempts = true;
    const nextAttempts = app.attempts + 1;
    const hasFailedPermanently = nextAttempts >= app.max_attempts;
    
    const nextStatus = hasFailedPermanently ? 'Failed' : 'Queued';
    const errorLog = err.message || 'Submission error occurred';

    await repository.updateApplicationStatus(applicationId, nextStatus, errorLog, incrementAttempts);

    if (nextStatus === 'Queued') {
      // Re-queue in BullMQ to attempt retry up to max retry attempts limit
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await applicationsQueue.add('submit-application', { applicationId });
    }

    return { status: nextStatus, error: errorLog };
  }
}

export async function getUserApplicationsList(userId: string, limit: number = 20, offset: number = 0) {
  return repository.getUserApplications(userId, limit, offset);
}

export async function getUserMonthlyApplicationStatus(userId: string) {
  const used = await repository.getMonthlyApplicationCount(userId);
  const limit = env.FREE_TIER_MONTHLY_CAP;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used)
  };
}
