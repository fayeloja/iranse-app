import { DimensionScorer, ScoreResult } from './scorer.interface.js';
import { JobRow } from '../../job-discovery/job-discovery.repository.js';

/**
 * Location matching dimension scorer.
 * Evaluates remote flexibility and geographical alignment (PRD 6.3).
 */
export class LocationScorer implements DimensionScorer {
  name = 'location';

  async calculateScore(
    userId: string,
    job: JobRow,
    profile: any
  ): Promise<ScoreResult> {
    const jobLoc = job.location.toLowerCase();
    const isJobRemote = jobLoc.includes('remote') || job.description.toLowerCase().includes('remote working allowed');

    if (isJobRemote) {
      return {
        score: 100,
        reason: 'This is a remote position, making it compatible with any geographical location.',
      };
    }

    // Default location comparison (Lagos / Nigeria local filters)
    // We check if the user's past experience locations match the job's location
    const experiences = profile.experiences || [];
    const userLocations: string[] = experiences.map((exp: any) => exp.location.toLowerCase());

    const isLocalMatch = userLocations.some((loc: string) => loc.includes(jobLoc) || jobLoc.includes(loc));
    if (isLocalMatch) {
      return {
        score: 95,
        reason: `Your profile indicates historical experience working in or around the job location: "${job.location}".`,
      };
    }

    // Baseline local region check (e.g. both in Nigeria)
    const isSameCountry = jobLoc.includes('nigeria') || userLocations.some((loc: string) => loc.includes('nigeria'));
    if (isSameCountry) {
      return {
        score: 75,
        reason: `This on-site role is located in "${job.location}" within Nigeria, which may require relocation or local commuting.`,
      };
    }

    return {
      score: 40,
      reason: `This role is onsite in "${job.location}" and does not seem to align with your geographical history.`,
    };
  }
}
export default LocationScorer;
