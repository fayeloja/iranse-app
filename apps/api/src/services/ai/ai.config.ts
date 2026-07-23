import { env } from '../../config/env.js';

export interface AIProviderConfig {
  apiKey?: string;
  model: string;
  embeddingModel: string;
  baseUrl: string;
}

export interface AIServiceConfig {
  defaultProvider: 'gemini' | 'openai';
  gemini: AIProviderConfig;
  openai: AIProviderConfig;
  timeoutMs: number;
}

/**
 * Centralized Single Junction for AI Model Configuration.
 * Controls model choices, API versions, and fallbacks.
 */
export const aiConfig: AIServiceConfig = {
  defaultProvider: 'gemini',
  gemini: {
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
    embeddingModel: env.GEMINI_EMBEDDING_MODEL,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  openai: {
    apiKey: env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    embeddingModel: env.OPENAI_EMBEDDING_MODEL,
    baseUrl: 'https://api.openai.com/v1',
  },
  timeoutMs: 30000,
};
