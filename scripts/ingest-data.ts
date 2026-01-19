import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
const pdf = require('pdf-parse');
import { db } from '../src/lib/db';
import { generateEmbedding } from '../src/lib/ai/embedding';
import * as cheerio from 'cheerio';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATA_DIR = path.join(process.cwd(), 'clean_data');

async function processFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  console.log(`Processing ${filePath}...`);

  let text = '';

  try {
     if (ext === '.md') {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      text = fileContent;
    } else {
      console.log(`Skipping unsupported file type: ${ext}`);
      return;
    }

    if (!text.trim()) {
      console.log('File is empty.');
      return;
    }

    // Clean text: replaces multiple newlines/spaces with a single space
    // text = text.replace(/\s+/g, ' ').trim(); // Avoid over-cleaning markdown

    // Chunk text
    const chunks = chunkText(text, 1000, 200); // 1000 chars, 200 overlap
    console.log(`Generated ${chunks.length} chunks.`);

    // Embed and Store
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);

      await db.query(
        'INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)',
        [chunk, { source: path.basename(filePath) }, JSON.stringify(embedding)]
      );
    }

    console.log(`Successfully ingested ${filePath}`);

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

async function run() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      console.log('Creating data directory...');
      fs.mkdirSync(DATA_DIR);
    }
    
    // Clear existing data
    console.log('Clearing existing data...');
    await db.query('TRUNCATE TABLE documents');

    const files = fs.readdirSync(DATA_DIR);
    if (files.length === 0) {
      console.log('No files found in clean_data/ directory.');
      return;
    }

    console.log(`Found ${files.length} files.`);
    
    // Process sequentially to avoid rate limits
    for (const file of files) {
      if (path.extname(file) === '.md') {
          await processFile(path.join(DATA_DIR, file));
      }
    }
    
    console.log('Ingestion complete!');

  } catch (error) {
    console.error('Ingestion failed:', error);
  } finally {
    await db.end();
  }
}

run();
