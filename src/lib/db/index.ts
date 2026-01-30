import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

// Load .env.local explicitly
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in .env.local');
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
