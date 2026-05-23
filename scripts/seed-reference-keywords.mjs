import fs from 'node:fs/promises';
import { loadEnv } from './lib/env.mjs';
import { upsertKeywords } from './lib/supabase.mjs';

await loadEnv();

const raw = await fs.readFile(new URL('../data/fitstage-keyword-reference.json', import.meta.url), 'utf8');
const reference = JSON.parse(raw);

const items = reference.keywords
  .filter((item) => item.use)
  .map((item) => ({
    keyword: item.keyword,
    source: 'fitstage-reference',
    search_volume: item.current,
    seo_difficulty: null,
    cpc: null,
    competition: null,
    first_seen_range: 'last_30_days',
    intent: item.cluster,
    score: Number(item.current || 0) + clusterBonus(item.cluster),
    status: 'unused',
    fetched_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

await upsertKeywords(items);
console.log(`Seeded ${items.length} reference keyword(s).`);

function clusterBonus(cluster) {
  if (cluster === 'weekly-meal-plan') return 50;
  if (cluster === 'meal-prep') return 35;
  if (cluster === 'transformation') return 10;
  return 5;
}
