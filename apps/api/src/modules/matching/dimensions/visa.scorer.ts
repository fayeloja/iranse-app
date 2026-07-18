import { DimensionScorer, ScoreResult } from './scorer.interface.js';
import { JobRow } from '../../job-discovery/job-discovery.repository.js';

/**
 * Visa / Work Authorization alignment scorer.
 * Analyzes work eligibility boundaries.
 */
export class VisaScorer implements DimensionScorer {
  name = 'visa';

  async calculateScore(
    userId: string,
    job: JobRow,
    profile: any
  ): Promise<ScoreResult> {
    const jobText = job.description.toLowerCase();
    
    // Check if the role mentions visa/relocation limitations
    const mentionsVisa = jobText.includes('sponsorship') || jobText.includes('visa') || jobText.includes('work authorization') || jobText.includes('eligible to work');

    if (!mentionsVisa) {
      return {
        score: 100,
        reason: 'This job listing does not indicate restricted visa or sponsorship requirements.',
      };
    }

    // Checks context local defaults (Iransé focuses on remote work or local candidates in Nigeria)
    const isLocalNigeriaJob = job.location.toLowerCase().includes('nigeria') || job.location.toLowerCase().includes('lagos');
    if (isLocalNigeriaJob) {
      return {
        score: 100,
        reason: 'This role is locally based in Nigeria, matching your regional work authorization profile.',
      };
    }

    const mentionsNoSponsorship = jobText.includes('no sponsorship') || jobText.includes('cannot sponsor');
    if (mentionsNoSponsorship) {
      return {
        score: 60,
        reason: 'This international role explicitly states no visa sponsorship is available.',
      };
    }

    return {
      score: 85,
      reason: 'This role mentions work permit requirements; verify eligibility with the recruiter.',
    };
  }
}
export default VisaScorer;
