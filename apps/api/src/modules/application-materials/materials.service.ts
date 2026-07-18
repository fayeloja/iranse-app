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
 * Materials tailoring service:
 * Matches jobs details to user achievements (via MMR) and voice snippets to draft
 * tailored resume structures and custom cover letters (PRD 6.4).
 */
export async function generateTailoredMaterials(userId: string, jobId: string) {
  const job = await getJobById(jobId);
  if (!job) {
    throw { status: 404, message: `Job [${jobId}] not found.` };
  }

  // 1. Fetch user achievements and map pgvector string outputs
  const dbAchievements = await getAchievements(userId);
  const achievements = dbAchievements
    .map((ach) => ({
      id: ach.id,
      description: ach.description,
      embedding: parseEmbeddingString(ach.embedding)!,
    }))
    .filter((a) => a.embedding !== null);

  // 2. Run MMR to pick the top 3 relevant yet diverse accomplishments
  let tailoredBulletPoints = dbAchievements.slice(0, 3).map((a) => a.description);
  
  if (achievements.length > 0) {
    const jobVector = await getEmbedding(job.description);
    const mmrSelected = selectAchievementsMMR(achievements, jobVector, 3, 0.5);
    tailoredBulletPoints = mmrSelected.map((a) => a.description);
  }

  // 3. Fetch candidate's voice snippet style guides (Enterprise, Startup, Technical)
  const snippets = await getVoiceSnippets(userId);
  
  // Pick voice snippet theme matching job environment keywords
  const jobDescLower = job.description.toLowerCase();
  const matchedSnippet = snippets.find((s) => {
    const theme = s.theme.toLowerCase();
    return jobDescLower.includes(theme) || (theme === 'startup' && jobDescLower.includes('agile'));
  }) || snippets[0]; // fallback to first snippet

  const voiceStyleContent = matchedSnippet
    ? matchedSnippet.content
    : 'I am a details-oriented software engineer focused on building robust products.';

  // 4. Draft tailored cover letter (calls Gemini Structured API if key configured, otherwise dynamic templates)
  const geminiKey = process.env.GEMINI_API_KEY;
  let coverLetter = '';

  if (!geminiKey) {
    // Dynamic mock template if offline/no key
    coverLetter = `Dear Hiring Team at ${job.company},

I am writing to express my strong interest in the ${job.title} position in ${job.location}.

${voiceStyleContent}

During my career, I have delivered key accomplishments that align with your goals:
${tailoredBulletPoints.map((bp) => `- ${bp}`).join('\n')}

I am excited to bring these experiences to ${job.company} and contribute to your team.

Sincerely,
[Candidate Name]`;
  } else {
    // Call Gemini API to write a tailored cover letter matching candidate style and selected bullets
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const prompt = `Write a professional cover letter for a candidate applying to this job.
    Job Title: ${job.title}
    Company: ${job.company}
    Location: ${job.location}
    Job Description: ${job.description}
    
    Candidate Style Guide (Write in this tone and voice):
    "${voiceStyleContent}"
    
    Candidate Key Accomplishments to reference:
    ${tailoredBulletPoints.map((bp) => `- ${bp}`).join('\n')}
    
    Keep the cover letter concise, clean, and engaging. Do not output anything other than the cover letter text.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (response.ok) {
      const resBody = (await response.json()) as any;
      coverLetter = resBody.candidates[0].content.parts[0].text;
    } else {
      console.warn('Gemini API call failed for materials tailoring. Falling back to template.');
      coverLetter = `Dear Hiring Team at ${job.company}, ...`; // fallback
    }
  }

  // Return generated resume metadata variant link and cover letter
  return {
    resumeUrl: `https://iranse-app.api/resumes/variants/${userId}-${jobId}`,
    coverLetter,
    tailoredBulletPoints,
  };
}
