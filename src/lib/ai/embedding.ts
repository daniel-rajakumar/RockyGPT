import 'dotenv/config';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY is not defined. RAG features will fail.');
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', // Prevent crash on build, but will fail at runtime if missing
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.replace(/\n/g, ' '),
  });

  return response.data[0].embedding;
}

export const openaiClient = openai;
