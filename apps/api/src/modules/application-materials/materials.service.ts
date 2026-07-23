import { cosineSimilarity, getEmbedding } from '../../infra/embeddings/similarity.js';
import { getJobById } from '../job-discovery/job-discovery.repository.js';
import { getAchievements, getVoiceSnippets } from '../career-profile/career-profile.repository.js';

// Parse helper to parse DB pgvector string '[val1,val2,...]' to number[] array
function parseEmbeddingString(embStr?: string): number[] | null {
  if (!embStr) return null;
  const cleaned = embStr.replace('[', '').replace(']', '');
  return cleaned.split(',').map(Number);
}

/**
 * Maximal Marginal Relevance (MMR) Selector.
 * Selects achievements that are highly relevant to the job, but semantically diverse
 * to prevent repetitive resume bullet points (PRD 6.4).
 */
export function selectAchievementsMMR(
  achievements: Array<{ id: string; description: string; embedding: number[] }>,
  jobVector: number[],
  limit: number = 3,
  lambda: number = 0.5
) {
  if (achievements.length <= limit) return achievements;

  const selected: typeof achievements = [];
  const remaining = [...achievements];

  // Calculate similarity to job vector for all achievements
  const jobSimilarities = remaining.map((ach) => ({
    ach,
    sim: cosineSimilarity(ach.embedding, jobVector),
  }));

  // Sort by similarity descending
  jobSimilarities.sort((a, b) => b.sim - a.sim);

  // Add the most similar achievement first
  selected.push(jobSimilarities[0].ach);
  const firstIndex = remaining.indexOf(jobSimilarities[0].ach);
  remaining.splice(firstIndex, 1);

  while (selected.length < limit && remaining.length > 0) {
    let bestMMR = -Infinity;
    let bestAch: typeof achievements[0] | null = null;
    let bestIndex = -1;

    for (let i = 0; i < remaining.length; i++) {
      const ach = remaining[i];
      const jobSim = cosineSimilarity(ach.embedding, jobVector);

      // Find max similarity to already selected achievements
      let maxSelectedSim = -Infinity;
      for (const sel of selected) {
        const selSim = cosineSimilarity(ach.embedding, sel.embedding);
        if (selSim > maxSelectedSim) {
          maxSelectedSim = selSim;
        }
      }

      // MMR Formula: balance relevance (jobSim) with diversity (1 - maxSelectedSim)
      const mmr = lambda * jobSim - (1 - lambda) * maxSelectedSim;
      if (mmr > bestMMR) {
        bestMMR = mmr;
        bestAch = ach;
        bestIndex = i;
      }
    }

    if (bestAch && bestIndex !== -1) {
      selected.push(bestAch);
      remaining.splice(bestIndex, 1);
    } else {
      break;
    }
  }

  return selected;
}

/**
 * Select the best voice snippet for a given structural role (opening/body/closing)
 * by matching the snippet's theme to the job description context.
 *
 * Selection strategy:
 * 1. Prefer snippets whose theme keyword appears in the job description.
 * 2. If no theme match, use embedding similarity to rank body snippets.
 * 3. Final fallback: first available snippet for that role.
 *
 * This function NEVER generates text — it returns the user's own words verbatim.
 */
async function selectSnippetForRole(
  snippets: Array<{ id: string; role: string; theme: string; content: string }>,
  role: 'opening' | 'body' | 'closing',
  jobDescLower: string,
  jobVector?: number[]
): Promise<string | null> {
  const candidates = snippets.filter((s) => s.role === role);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].content;

  // 1. Theme keyword match against job description
  const themeMatched = candidates.find((s) => {
    const theme = s.theme.toLowerCase();
    return (
      jobDescLower.includes(theme) ||
      (theme === 'startup' && (jobDescLower.includes('agile') || jobDescLower.includes('fast-paced'))) ||
      (theme === 'enterprise' && (jobDescLower.includes('corporate') || jobDescLower.includes('large-scale'))) ||
      (theme === 'technical' && (jobDescLower.includes('engineering') || jobDescLower.includes('architecture')))
    );
  });
  if (themeMatched) return themeMatched.content;

  // 2. For body snippets, use embedding similarity if a job vector is available
  if (role === 'body' && jobVector) {
    try {
      const scoredCandidates = await Promise.all(
        candidates.map(async (s) => {
          const snippetVector = await getEmbedding(s.content);
          return { snippet: s, similarity: cosineSimilarity(snippetVector, jobVector) };
        })
      );
      scoredCandidates.sort((a, b) => b.similarity - a.similarity);
      return scoredCandidates[0].snippet.content;
    } catch {
      // If embedding fails, fall through to default
    }
  }

  // 3. Fallback: first candidate
  return candidates[0].content;
}

/**
 * Materials tailoring service.
 *
 * PRINCIPLE: "Select, don't rewrite" (PRD §4, DECISIONS.md #3).
 *
 * Resume assembly: MMR-selects the user's own achievement bullets — never rewrites them.
 * Cover letter assembly: Selects the user's own voice snippets by structural role
 * (opening/body/closing) and concatenates them verbatim. No LLM smoothing, no
 * generated transitions, no template prose. Visible seams between selected snippets
 * are the accepted tradeoff for authenticity.
 *
 * The ONLY use of embeddings here is for RANKING and RETRIEVAL, never content creation.
 */
export async function generateTailoredMaterials(userId: string, jobId: string) {
  const job = await getJobById(jobId);
  if (!job) {
    throw { status: 404, message: `Job [${jobId}] not found.` };
  }

  // ── Resume Assembly (MMR achievement selection) ──────────────────────

  // 1. Fetch user achievements and parse pgvector embeddings
  const dbAchievements = await getAchievements(userId);
  const achievements = dbAchievements
    .map((ach) => ({
      id: ach.id,
      description: ach.description,
      embedding: parseEmbeddingString(ach.embedding)!,
    }))
    .filter((a) => a.embedding !== null);

  // 2. Run MMR to pick the top relevant-yet-diverse achievement bullets
  let tailoredBulletPoints = dbAchievements.slice(0, 3).map((a) => a.description);
  let jobVector: number[] | undefined;

  if (achievements.length > 0) {
    jobVector = await getEmbedding(job.description);
    const mmrSelected = selectAchievementsMMR(achievements, jobVector, 3, 0.5);
    tailoredBulletPoints = mmrSelected.map((a) => a.description);
  }

  // ── Cover Letter Assembly (voice snippet selection) ──────────────────
  // Per PRD §4 and DECISIONS.md #3: selection ONLY, never generation.
  // Structure: opening → body (1-2 paragraphs) → achievement reference → closing.
  // Each section is the user's own pre-written text, concatenated verbatim.

  const allSnippets = await getVoiceSnippets(userId);
  const jobDescLower = job.description.toLowerCase();

  // Select best-matching snippet for each structural role
  const opening = await selectSnippetForRole(allSnippets, 'opening', jobDescLower, jobVector);
  const body = await selectSnippetForRole(allSnippets, 'body', jobDescLower, jobVector);
  const closing = await selectSnippetForRole(allSnippets, 'closing', jobDescLower, jobVector);

  // Assemble cover letter from selected snippets — user's own words only.
  // If the user hasn't written snippets for a role, that section is omitted.
  // The human-review step (DECISIONS.md #2) catches any awkward seams.
  const coverLetterParts: string[] = [];

  if (opening) {
    coverLetterParts.push(opening);
  }

  if (body) {
    coverLetterParts.push(body);
  }

  // Insert the user's own achievement bullets as a referenced list
  if (tailoredBulletPoints.length > 0) {
    coverLetterParts.push(
      tailoredBulletPoints.map((bp) => `• ${bp}`).join('\n')
    );
  }

  if (closing) {
    coverLetterParts.push(closing);
  }

  // Join sections with double newlines (paragraph breaks).
  // No generated transitions, no smoothing — visible seams are the documented tradeoff.
  const coverLetter = coverLetterParts.length > 0
    ? coverLetterParts.join('\n\n')
    : ''; // Empty if user has no voice snippets at all

  return {
    resumeUrl: `https://iranse-app.api/resumes/variants/${userId}-${jobId}`,
    coverLetter,
    tailoredBulletPoints,
  };
}
