import { aiConfig } from '../ai.config.js';

export class OpenAIProvider {
  /**
   * Generates vector embeddings for input text via OpenAI Embeddings API.
   */
  async embedText(text: string): Promise<number[]> {
    const { apiKey, embeddingModel, baseUrl } = aiConfig.openai;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: embeddingModel,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Embedding API failed [${response.status}]: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return data.data[0].embedding;
  }
}
