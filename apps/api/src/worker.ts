import { Worker, Job } from 'bullmq';
import { env } from './config/env.js';
import { redisConnection } from './infra/queue/connection.js';
import { QUEUES } from './infra/queue/queues.js';
import { runIngestion } from './modules/job-discovery/job-discovery.service.js';
import { matchJobAgainstAllUsers } from './modules/matching/matching.service.js';
import { processApplicationSubmission } from './modules/applications/applications.service.js';

const activeWorkers: Worker[] = [];

// Determine which queues to listen to based on env variables (Decision #12)
const targetQueues = env.WORKER_QUEUES === 'all'
  ? Object.values(QUEUES)
  : env.WORKER_QUEUES.split(',').map((q) => q.trim());

console.log(`👷 Starting BullMQ workers for queues: [${targetQueues.join(', ')}]`);

// 1. Job Ingestion Queue Worker
if (targetQueues.includes(QUEUES.JOB_INGESTION)) {
  const ingestionWorker = new Worker(
    QUEUES.JOB_INGESTION,
    async (job: Job) => {
      console.log(`📥 Ingestion Worker: Processing job [${job.id}] (name: ${job.name})`);
      const result = await runIngestion(job.data?.sourceId);
      return { processed: true, newJobsCount: result.newJobsCount };
    },
    {
      connection: redisConnection,
      concurrency: 2, // Moderate concurrency for ingestion
    }
  );
  activeWorkers.push(ingestionWorker);
  console.log(`✅ Registered processor for queue: ${QUEUES.JOB_INGESTION}`);
}

// 2. Application Submission Queue Worker
if (targetQueues.includes(QUEUES.APPLICATIONS)) {
  const applicationsWorker = new Worker(
    QUEUES.APPLICATIONS,
    async (job: Job) => {
      console.log(`📤 Applications Worker: Submitting job [${job.id}] (name: ${job.name})`);
      const result = await processApplicationSubmission(job.data.applicationId);
      return { submitted: true, status: result.status };
    },
    {
      connection: redisConnection,
      concurrency: 1, // Single-worker concurrency to safely control rate limit spikes
    }
  );
  activeWorkers.push(applicationsWorker);
  console.log(`✅ Registered processor for queue: ${QUEUES.APPLICATIONS}`);
}

// 3. Matching Engine Queue Worker
if (targetQueues.includes(QUEUES.MATCHING)) {
  const matchingWorker = new Worker(
    QUEUES.MATCHING,
    async (job: Job) => {
      console.log(`📊 Matching Worker: Scoring job [${job.id}] (name: ${job.name})`);
      const result = await matchJobAgainstAllUsers(job.data.jobId);
      return { matched: true, matchedUsersCount: result.matchedUsersCount };
    },
    {
      connection: redisConnection,
      concurrency: 4, // Higher concurrency allowed for pure read-only calculation
    }
  );
  activeWorkers.push(matchingWorker);
  console.log(`✅ Registered processor for queue: ${QUEUES.MATCHING}`);
}

// 4. Graceful Shutdown Handlers (SIGTERM / SIGINT)
// Stops pulling new jobs from Redis and waits for active jobs to finish before exit
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}, shutting down workers gracefully...`);

  const closePromises = activeWorkers.map(async (worker) => {
    console.log(`💤 Closing worker for queue: ${worker.name}...`);
    await worker.close();
    console.log(`🏁 Worker for queue: ${worker.name} has stopped.`);
  });

  await Promise.all(closePromises);
  console.log('🔌 All queue workers shut down. Exiting process.');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
