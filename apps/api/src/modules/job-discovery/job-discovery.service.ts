import { GreenhouseAdapter } from './adapters/greenhouse.adapter.js';
import { JobbermanAdapter } from './adapters/jobberman.adapter.js';
import { JobSourceAdapter } from './adapters/job-source.interface.js';
import * as repository from './job-discovery.repository.js';
import { matchingQueue } from '../../infra/queue/queues.js';

// Register pluggable adapters (Decision #4)
const ADAPTERS: Record<string, JobSourceAdapter> = {
  greenhouse: new GreenhouseAdapter(),
  jobberman: new JobbermanAdapter(),
};

/**
 * Executes listings fetch, normalizes schemas, performs SQL deduplication,
 * and schedules BullMQ matching evaluations for newly discovered job board postings (PRD 6.2).
 */
export async function runIngestion(sourceId?: string) {
  const targetAdapters = sourceId
    ? [ADAPTERS[sourceId]].filter(Boolean)
    : Object.values(ADAPTERS);

  let totalNewJobsCount = 0;
  const adapterSummaries: Array<{ sourceId: string; newJobs: number; status: 'ok' | 'error' }> = [];

  for (const adapter of targetAdapters) {
    console.log(`⏱️ Executing job discovery ingestion for source: ${adapter.sourceId}`);
    let adapterJobsCount = 0;
    try {
      const listings = await adapter.fetchListings();
      for (const raw of listings) {
        // Parse raw listing into canonical schema
        const normalized = await adapter.parseListing(raw);
        
        // Save to DB - deduplicates at SQL level on conflict URL (Decision #13)
        const savedJob = await repository.saveJob(normalized);
        if (savedJob) {
          adapterJobsCount++;
          totalNewJobsCount++;
          console.log(`✨ Discovered new job posting: "${savedJob.title}" at "${savedJob.company}"`);
          
          // Trigger explanation scoring calculations in matching queue (PRD 6.2)
          await matchingQueue.add('score-job', { jobId: savedJob.id });
        }
      }
      adapterSummaries.push({ sourceId: adapter.sourceId, newJobs: adapterJobsCount, status: 'ok' });
    } catch (err) {
      console.error(`❌ Job Ingestion failed for source "${adapter.sourceId}":`, err);
      adapterSummaries.push({ sourceId: adapter.sourceId, newJobs: 0, status: 'error' });
    }
  }

  return { newJobsCount: totalNewJobsCount, adapters: adapterSummaries, timestamp: new Date().toISOString() };
}

export async function getJobsList(limit: number = 20, offset: number = 0) {
  const jobs = await repository.getJobs(limit, offset);
  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    url: job.url,
    sourceId: job.source_id,
    salary: job.salary,
    experienceLevel: job.experience_level,
    skills: typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills,
    createdAt: job.created_at,
  }));
}
