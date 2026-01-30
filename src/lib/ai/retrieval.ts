import { db } from '../db/index';
import { generateEmbedding } from './embedding';

export interface SearchResult {
  content: string;
  metadata: any;
  similarity: number;
}

export async function searchDocuments(query: string, limit: number = 5): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);
  const embeddingString = JSON.stringify(queryEmbedding);

  // Perform similarity search using pgvector's <=> operator (Euclidean distance)
  // We want the closest distance, so we order by embedding <=> $1
  // Note: For cosine similarity, use <=> on normalized vectors (OpenAI vectors are normalized)
  const result = await db.query(
    `SELECT content, metadata, 1 - (embedding <=> $1) as similarity
     FROM documents
     ORDER BY embedding <=> $1
     LIMIT $2`,
    [embeddingString, limit]
  );

  return result.rows;
}
