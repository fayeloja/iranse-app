import { NormalizedJob } from 'validation';

export interface RawListing {
  url: string;
  [key: string]: any;
}

/**
 * Interface that every job portal board scraper or API integration must implement (Decision #4, Standards Rule 2).
 */
export interface JobSourceAdapter {
  sourceId: string;
  rateLimitConfig: { requestsPerWindow: number; windowMs: number };
  authStrategy: 'none' | 'session_cookie' | 'official_api';
  
  /**
   * Fetches the raw postings list from the job board source.
   */
  fetchListings(cursor?: string): Promise<RawListing[]>;
  
  /**
   * Translates the raw metadata/DOM listings into the canonical job format.
   */
  parseListing(raw: RawListing): Promise<Omit<NormalizedJob, 'id' | 'createdAt'>>;
}
