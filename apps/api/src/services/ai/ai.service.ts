import { aiConfig } from './ai.config.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';

export class AIService {
  private geminiProvider = new GeminiProvider();
  private openaiProvider = new OpenAIProvider();

  /**
   * High-level method for structured LLM JSON extraction.
   */
  async generateStructuredOutput<T>(prompt: string): Promise<T> {
    if (aiConfig.gemini.apiKey) {
      return this.geminiProvider.generateStructuredContent<T>(prompt);
    }
    throw new Error('No valid AI provider configured for structured content generation.');
  }

  /**
   * Generates vector embeddings for matching, similarity scoring, or pgvector storage.
   * Tries Gemini API first, falls back to OpenAI API, then falls back to a deterministic mock vector.
   */
  async getEmbedding(text: string): Promise<number[]> {
    // 1. Try Gemini Embeddings API (Preferred)
    if (aiConfig.gemini.apiKey) {
      try {
        return await this.geminiProvider.embedContent(text);
      } catch (err: any) {
        console.warn(`⚠️ Gemini embedding failed (${err.message}). Trying fallback provider...`);
      }
    }

    // 2. Try OpenAI Embeddings API (Fallback)
    if (aiConfig.openai.apiKey) {
      try {
        return await this.openaiProvider.embedText(text);
      } catch (err: any) {
        console.warn(`⚠️ OpenAI embedding failed (${err.message}). Falling back to mock vector...`);
      }
    }

    // 3. Fallback: Deterministic Mock Vector (Offline local dev)
    return this.generateMockVector(text);
  }

  /**
   * Generates a 1536-dimensional mock vector for local testing without active API keys.
   */
  private generateMockVector(text: string): number[] {
    return new Array(1536).fill(0).map((_, i) => {
      const code = text.charCodeAt(i % text.length) || 0;
      return Math.sin(code + i) / 10;
    });
  }
}

export const aiService = new AIService();
