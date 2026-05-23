import { loadEnv } from './lib/env.mjs';
import { loadConfig } from './lib/config.mjs';
import { refreshKeywordsFromRakko } from './lib/rakko.mjs';

await loadEnv();

const config = await loadConfig();
const seeds = process.argv.slice(2).length ? process.argv.slice(2) : config.keywordSeeds.slice(0, 3);
const items = await refreshKeywordsFromRakko(seeds);
console.log(`Stored ${items.length} keyword candidates from ${seeds.length} seed(s).`);
