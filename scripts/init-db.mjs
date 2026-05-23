import fs from 'node:fs/promises';
import { loadEnv } from './lib/env.mjs';

await loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to initialize the database.');
}

const { Client } = await import('pg');
const sql = await fs.readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
await client.query(sql);
await client.end();

console.log('Supabase tables are ready.');
