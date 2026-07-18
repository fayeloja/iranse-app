import { DimensionScorer, ScoreResult } from './scorer.interface.js';
import { JobRow } from '../../job-discovery/job-discovery.repository.js';

/**
 * Salary matching dimension scorer.
 * Parses compensation details to calculate budget compatibility scores.
 */
export class SalaryScorer implements DimensionScorer {
  name = 'salary';

  async calculateScore(
    userId: string,
    job: JobRow,
    profile: any
  ): Promise<ScoreResult> {
    const salaryVal = job.salary;
    if (!salaryVal) {
      return {
        score: 80, // Default compatibility when budget is unstated
        reason: 'Compensation budget is undisclosed for this role. Defaulting to standard eligibility.',
      };
    }

    // Try to extract numbers from salary string (e.g. "₦2,500,000/month")
    const cleaned = salaryVal.replace(/[^\d]/g, '');
    const amount = cleaned ? parseInt(cleaned) : null;

    if (!amount) {
      return {
        score: 80,
        reason: `Undisclosed compensation structured as: "${salaryVal}".`,
      };
    }

    // Returns score based on estimated salary scale
    // Under local parameters, salaries above ₦1M/month represent high-tier brackets
    if (amount >= 1500000) {
      return {
        score: 100,
        reason: `This role offers high-tier compensation (${salaryVal}) that meets premium budget expectations.`,
      };
    }

    if (amount >= 500000) {
      return {
        score: 85,
        reason: `This role offers mid-tier compensation (${salaryVal}) that aligns with market standard rates.`,
      };
    }

    return {
      score: 60,
      reason: `This role offers entry-tier compensation (${salaryVal}) which may be below target scales.`,
    };
  }
}
export default SalaryScorer;
