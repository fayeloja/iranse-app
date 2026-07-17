import { JobSourceAdapter, RawListing } from './job-source.interface.js';
import { NormalizedJob } from 'validation';

/**
 * Jobberman Web Scraper Adapter.
 * Uses Puppeteer loaded dynamically at execution time to save HTTP API memory (Standards Mitigation).
 */
export class JobbermanAdapter implements JobSourceAdapter {
  sourceId = 'jobberman';
  rateLimitConfig = { requestsPerWindow: 5, windowMs: 60000 }; // Capped scraper rate limit
  authStrategy: 'none' = 'none';

  async fetchListings(cursor?: string): Promise<RawListing[]> {
    try {
      // Dynamic import ensures the HTTP API process (server.ts) never loads Puppeteer or Chromium into memory (Standards Rule 11)
      const { default: puppeteer } = await import('puppeteer');
      console.log(`[Jobberman Adapter] Launching Puppeteer browser to scrape ${this.sourceId}...`);
      
      // In production, we'd launch a browser and parse HTML:
      // const browser = await puppeteer.launch({ headless: true });
      // const page = await browser.newPage();
      // ...
      
      return [];
    } catch (err) {
      console.warn(`[Jobberman Adapter] Puppeteer import failed or not installed. Running scraper simulation fallback.`);
      
      // Simulated delay
      await new Promise((resolve) => setTimeout(resolve, 600));
      return [
        {
          url: 'https://www.jobberman.com/jobs/devops-architect-lagos',
          title: 'DevOps Architect',
          company: 'Yanda Labs',
          location: 'Lagos Island, Lagos',
          description: 'Looking for a DevOps Architect to design CI/CD pipelines, configure Kubernetes clusters, and scale Redis and Postgres.',
          salary: '₦3,500,000/month',
          skills: ['Docker', 'Kubernetes', 'Redis', 'CI/CD'],
        }
      ];
    }
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
      experienceLevel: 'Architect',
      rawListingData: raw,
    };
  }
}
export default JobbermanAdapter;
