import { DimensionScorer, ScoreResult } from './scorer.interface.js';
import { JobRow } from '../../job-discovery/job-discovery.repository.js';
import { ExperienceRow } from '../../career-profile/career-profile.repository.js';

/**
 * Experience matching dimension scorer.
 * Calculates duration in years of user experience and compares it to job description cues.
 */
export class ExperienceScorer implements DimensionScorer {
  name = 'experience';

  async calculateScore(
    userId: string,
    job: JobRow,
    profile: { experiences: ExperienceRow[] }
  ): Promise<ScoreResult> {
    const experiences = profile.experiences || [];
    if (experiences.length === 0) {
      return { score: 10, reason: 'No professional experience found in your profile.' };
    }

    // 1. Calculate total experience in years
    let totalDays = 0;
    for (const exp of experiences) {
      const start = new Date(exp.start_date);
      const end = exp.end_date ? new Date(exp.end_date) : new Date();
      totalDays += Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    const totalYears = Math.round((totalDays / 365.25) * 10) / 10; // round to 1 decimal

    // 2. Parse job experience requirement cues (e.g. "5 years", "3+ years")
    let requiredYears = 2; // Default baseline requirement
    const yearsMatches = job.description.match(/(\d+)\+?\s*years?/i);
    if (yearsMatches) {
      requiredYears = parseInt(yearsMatches[1]);
    } else if (job.experience_level?.toLowerCase() === 'senior') {
      requiredYears = 5;
    } else if (job.experience_level?.toLowerCase() === 'lead' || job.experience_level?.toLowerCase() === 'architect') {
      requiredYears = 8;
    }

    // 3. Compute score based on comparison
    let score = 100;
    if (totalYears < requiredYears) {
      const ratio = totalYears / requiredYears;
      score = Math.round(ratio * 90); // cap at 90 if less experience
    } else {
      // Bonus for exceeding requirements, capped at 100
      score = Math.min(100, 90 + Math.round((totalYears - requiredYears) * 2));
    }

    return {
      score,
      reason: `You have ${totalYears} years of cumulative professional experience compared to the estimated ${requiredYears} years required.`,
    };
  }
}
export default ExperienceScorer;
