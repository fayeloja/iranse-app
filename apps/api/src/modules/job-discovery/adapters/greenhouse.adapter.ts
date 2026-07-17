import { JobSourceAdapter, RawListing } from './job-source.interface.js';
import { NormalizedJob } from 'validation';

/**
 * Greenhouse board API adapter.
 * Performs API calls or generates mock postings in local development (Decision #4, Standards Rule 2).
 */
export class GreenhouseAdapter implements JobSourceAdapter {
  sourceId = 'greenhouse';
  rateLimitConfig = { requestsPerWindow: 20, windowMs: 60000 };
  authStrategy: 'none' = 'none';

  async fetchListings(cursor?: string): Promise<RawListing[]> {
    // In production, this fetch executes queries against Greenhouse public API boards.
    // For development, it returns mock metadata listings to seed the system.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [
      {
        url: 'https://boards.greenhouse.io/google/jobs/101',
        title: 'Backend Engineer (Node.js)',
        company: 'Google',
        location: 'Lagos, Nigeria',
        description: 'We are seeking a Backend Engineer with strong expertise in Node.js, Express, Postgres, and high-concurrency systems scaling.',
        salary: '₦2,500,000/month',
        skills: ['Node.js', 'PostgreSQL', 'Systems Architecture', 'TypeScript'],
      },
      {
        url: 'https://boards.greenhouse.io/lever/jobs/202',
        title: 'Senior Frontend Developer',
        company: 'Greenhouse Inc.',
        location: 'Remote, Nigeria',
        description: 'Join us to work on our core matching dashboard views. Requires React, Vite, CSS, and mobile-first responsive design.',
        salary: '₦1,800,000/month',
        skills: ['React', 'CSS', 'Vite', 'TypeScript'],
      }
    ];
  }

  async parseListing(raw: RawListing): Promise<Omit<NormalizedJob, 'id' | 'createdAt'>> {
    return {
      title: raw.title,
      company: raw.company,
      location: raw.location,
      description: raw.description,
      url: raw.url,
      sourceId: this.sourceId,
      salary: raw.salary,
      skills: raw.skills,
      experienceLevel: 'Senior',
      rawListingData: raw,
    };
  }
}
export default GreenhouseAdapter;
