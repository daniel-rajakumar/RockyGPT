
import { searchDocuments } from '../src/lib/ai/retrieval';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: '.env.local' });

async function verify() {
  console.log('Searching for "burger"...');
  const results = await searchDocuments('burger', 3);
  
  if (results.length > 0) {
    console.log('Found query results:');
    results.forEach((r, i) => {
      console.log(`[${i + 1}] Similarity: ${r.similarity}`);
      console.log(`Source: ${r.metadata.source}`);
      console.log(`Content Preview: ${r.content.substring(0, 100)}...`);
      console.log('---');
    });
  } else {
    console.log('No results found for "burger". Ingestion might have failed or data is missing.');
  }
}

verify().catch(console.error);
