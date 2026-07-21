import { query } from '../database/client.js';

/**
 * Generates a vector embedding from text using either Google Gemini's Embedding API
 * or OpenAI's Embeddings API. Falls back to a deterministic mock vector if API keys 
 * are missing to allow offline local testing.
 * 
 * @param text - The input text to embed
 * @returns A Promise resolving to an array of numbers representing the vector
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const generateMock = () => {
    return new Array(1536).fill(0).map((_, i) => {
      const code = text.charCodeAt(i % text.length) || 0;
      return Math.sin(code + i) / 10;
    });
  };

  if (!geminiKey && !openaiKey) {
    return generateMock();
  }

  try {
    // 1. Google Gemini Embeddings API (Preferred)
    if (geminiKey) {
      const model = 'text-embedding-004';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text }] },
        }),
      });
      if (!response.ok) {
        throw new Error(`Gemini Embedding API failed: ${response.status} ${response.statusText}`);
      }
      const data = (await response.json()) as any;
      return data.embedding.values;
    }

    // 2. OpenAI Embeddings API (Fallback)
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI Embedding API failed: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as any;
    return data.data[0].embedding;
  } catch (err: any) {
    console.warn(`⚠️ Embedding API failed (${err.message}). Falling back to deterministic mock vector...`);
    return generateMock();
  }
}

/**
 * Computes cosine similarity between two in-memory vectors.
 * Useful for fast client-side or in-memory re-ranking calculations.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
