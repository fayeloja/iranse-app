import { ExperienceRow, AchievementRow } from '../../career-profile/career-profile.repository.js';
import { JobRow } from '../../job-discovery/job-discovery.repository.js';

export interface ScoreResult {
  score: number; // Integer score from 0 to 100
  reason: string;
}

/**
 * Standard interface that all multi-dimensional matching scorers must implement (PRD 6.3, ARCHITECTURE.md).
 */
export interface DimensionScorer {
  name: string;
  
  /**
   * Calculates the match score (0-100) and provides a user-facing explanation reason string.
   */
  calculateScore(
    userId: string,
    job: JobRow,
    profile: { experiences: ExperienceRow[]; achievements: AchievementRow[] }
  ): Promise<ScoreResult>;
}
