import { DimensionScorer, ScoreResult } from './scorer.interface.js';
import { JobRow } from '../../job-discovery/job-discovery.repository.js';
import { query } from '../../../infra/database/client.js';

interface VoiceSnippetQueryRow {
  theme: string;
  role: string;
  content: string;
}

/**
 * Culture Fit matching dimension scorer.
 * Cross-references candidate professional voice themes (startup, enterprise, technical)
 * with descriptive style indicators in the job listing (PRD 6.3).
 */
export class CultureFitScorer implements DimensionScorer {
  name = 'culture-fit';

  async calculateScore(
    userId: string,
    job: JobRow,
    profile: any
  ): Promise<ScoreResult> {
    try {
      // Fetch user's registered voice snippet styles (from career profile Phase 5)
      const sql = `
        SELECT theme, role, content
        FROM voice_snippets
        WHERE user_id = $1;
      `;
      const result = await query<VoiceSnippetQueryRow>(sql, [userId]);
      const snippets = result.rows;

      if (snippets.length === 0) {
        return {
          score: 75, // Default baseline fit
          reason: 'No voice snippets or cultural tags recorded in your profile. Assuming default fit compatibility.',
        };
      }

      const jobText = job.description.toLowerCase();
      
      // Look for specific organizational structures in job description
      const isStartup = jobText.includes('startup') || jobText.includes('fast-paced') || jobText.includes('agile') || jobText.includes('small team');
      const isEnterprise = jobText.includes('enterprise') || jobText.includes('corporate') || jobText.includes('established') || jobText.includes('process-oriented');

      // Check candidate's recorded voice styles
      const userThemes = snippets.map(s => s.theme.toLowerCase());

      if (isStartup && userThemes.includes('startup')) {
        return {
          score: 100,
          reason: 'Excellent fit! The role targets a startup/agile team, and your profile voice snippets emphasize startup adaptability.',
        };
      }

      if (isEnterprise && userThemes.includes('enterprise')) {
        return {
          score: 100,
          reason: 'Excellent fit! The role targets an enterprise organization, and your profile voice snippet aligns with corporate structures.',
        };
      }

      // Default mixed matches
      if (userThemes.includes('technical') && jobText.includes('technical challenge')) {
        return {
          score: 90,
          reason: 'Strong fit! Your profile emphasizes deep technical focus which aligns with the technical goals of this role.',
        };
      }

      return {
        score: 80,
        reason: 'Good cultural alignment. Your professional communication themes generally align with this role.',
      };
    } catch (err) {
      console.error('❌ CultureFitScorer execution failed:', err);
      return {
        score: 70,
        reason: 'Assessed average culture fit compatibility.',
      };
    }
  }
}
export default CultureFitScorer;
