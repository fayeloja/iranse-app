import { aiConfig } from '../ai.config.js';

export class GeminiProvider {
  /**
   * Sends prompt to Gemini API with JSON response enforcement.
   */
  async generateStructuredContent<T>(prompt: string): Promise<T> {
    const { apiKey, model, baseUrl } = aiConfig.gemini;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini generateContent failed [${response.status}]: ${response.statusText}`);
    }

    const resBody = (await response.json()) as any;
    const textResult = resBody.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error('Gemini API returned an empty output');
    }

    return JSON.parse(textResult) as T;
  }

  /**
   * Generates vector embeddings for input text via Gemini embedContent.
   */
  async embedContent(text: string): Promise<number[]> {
    const { apiKey, embeddingModel, baseUrl } = aiConfig.gemini;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const cleanModel = (embeddingModel || 'text-embedding-004').replace(/^models\//, '');
    const url = `${baseUrl}/models/${cleanModel}:embedContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${cleanModel}`,
        content: { parts: [{ text }] },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini embedContent failed [${response.status}]: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return data.embedding.values;
  }
}
