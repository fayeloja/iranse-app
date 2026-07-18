import { DimensionScorer, ScoreResult } from './scorer.interface.js';
import { JobRow } from '../../job-discovery/job-discovery.repository.js';
import { query } from '../../../infra/database/client.js';
import { getEmbedding } from '../../../infra/embeddings/similarity.js';

/**
 * Skills matching dimension scorer.
 * Generates an embedding for the job description and uses pgvector cosine similarity (<=>)
 * to measure semantic distance against candidate achievements at rest in the DB (PRD 6.3).
 */
export class SkillsScorer implements DimensionScorer {
  name = 'skills';

  async calculateScore(
    userId: string,
    job: JobRow,
    profile: any
  ): Promise<ScoreResult> {
    try {
      // 1. Generate vector embedding for the target job description (Decision #9)
      const jobVector = await getEmbedding(job.description);
      const vectorString = `[${jobVector.join(',')}]`;

      // 2. Query database for candidate achievements sorted by nearest cosine distance
      const sql = `
        SELECT description, (embedding <=> $2) as distance
        FROM achievements
        WHERE user_id = $1 AND embedding IS NOT NULL
        ORDER BY embedding <=> $2
        LIMIT 3;
      `;
      const result = await query<{ description: string; distance: number }>(sql, [userId, vectorString]);

      if (result.rows.length === 0) {
        return {
          score: 10, // Default minimum score for empty profiles
          reason: 'No career achievements or skills found in your profile to compare.',
        };
      }

      // Cosine distance range is [0, 2]. Similarity is 1 - distance.
      const bestMatch = result.rows[0];
      const similarity = 1 - bestMatch.distance;
      const score = Math.max(0, Math.min(100, Math.round(similarity * 100)));

      return {
        score,
        reason: `Your profile achievement ("${bestMatch.description.substring(0, 60)}...") matches this job description at ${score}% semantic relevance.`,
      };
    } catch (err) {
      console.error('❌ SkillsScorer execution failed:', err);
      return {
        score: 0,
        reason: 'Failed to analyze semantic skill similarity.',
      };
    }
  }
}
export default SkillsScorer;
