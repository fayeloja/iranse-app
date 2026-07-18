import { DimensionScorer, ScoreResult } from './scorer.interface.js';
import { JobRow } from '../../job-discovery/job-discovery.repository.js';
import { ExperienceRow } from '../../career-profile/career-profile.repository.js';

// Standard industry sectors mapping keywords
const INDUSTRIES = ['fintech', 'healthtech', 'e-commerce', 'agritech', 'edtech', 'logistics', 'blockchain', 'saas', 'enterprise', 'manufacturing', 'retail', 'telecommunications', 'transportation', 'healthcare', 'education', 'finance', 'entertainment', 'gaming', 'energy', 'construction'];

/**
 * Industry matching dimension scorer.
 * Evaluates sector alignment by matching experience descriptions against industry terms (PRD 6.3).
 */
export class IndustryScorer implements DimensionScorer {
  name = 'industry';

  async calculateScore(
    userId: string,
    job: JobRow,
    profile: { experiences: ExperienceRow[] }
  ): Promise<ScoreResult> {
    const experiences = profile.experiences || [];
    if (experiences.length === 0) {
      return { score: 50, reason: 'No professional work history found to analyze industry fit.' };
    }

    const jobText = `${job.title} ${job.description}`.toLowerCase();
    
    // Find job industry indicators
    const matchedIndustries = INDUSTRIES.filter(ind => jobText.includes(ind));
    if (matchedIndustries.length === 0) {
      return {
        score: 80, // Default compatibility if job doesn't target specific industry
        reason: 'This job does not specify a niche industry sector. Eligibility is broad.',
      };
    }

    // Search user experiences for matched industry terms
    const expText = experiences.map(exp => `${exp.title} ${exp.description || ''}`).join(' ').toLowerCase();
    const hasNicheMatch = matchedIndustries.some(ind => expText.includes(ind));

    if (hasNicheMatch) {
      return {
        score: 100,
        reason: `Your career history aligns with the job's industry sector: [${matchedIndustries.join(', ')}].`,
      };
    }

    return {
      score: 70,
      reason: `This role is in the [${matchedIndustries.join(', ')}] sector, whereas your history is in other industries.`,
    };
  }
}
export default IndustryScorer;
