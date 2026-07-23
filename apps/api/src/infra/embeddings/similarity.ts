import { query } from '../database/client.js';
import { aiService } from '../../services/index.js';

/**
 * Generates a vector embedding from text using the central AI service provider.
 * Delegates provider selection and fallback strategy to central aiService.
 * 
 * @param text - The input text to embed
 * @returns A Promise resolving to an array of numbers representing the vector
 */
export async function getEmbedding(text: string): Promise<number[]> {
  return aiService.getEmbedding(text);
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
