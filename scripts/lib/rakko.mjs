import { loadConfig } from './config.mjs';
import { logUsage, upsertKeywords } from './supabase.mjs';

const endpoint = 'https://api.rakkokeyword.com/v1/suggest-keywords';

function scoreKeyword(item, negativeKeywords) {
  const metrics = item.metrics || {};
  const volume = Number(metrics.searchVolume || 0);
  const difficulty = Number(metrics.seoDifficulty ?? 50);
  const competition = Number(metrics.competition ?? 50);
  const text = item.keyword || '';
  if (negativeKeywords.some((word) => text.includes(word))) return -999;
  if (difficulty >= 45) return -100;
  if (volume < 50) return -20;
  const longTailBonus = text.split(/\s+/).length >= 2 || text.length >= 9 ? 12 : 0;
  const trendBonus = ['last_7_days', 'last_30_days', 'last_90_days'].includes(metrics.firstSeenRange) ? 8 : 0;
  return Math.round(volume / 120 + (45 - difficulty) * 2 + (35 - competition) + longTailBonus + trendBonus);
}

export async function fetchRakkoKeywords(seed, { limit = 40 } = {}) {
  const apiKey = process.env.RAKKO_API_KEY;
  if (!apiKey) return [];
  const config = await loadConfig();
  const payload = {
    keyword: seed,
    modes: ['google'],
    increaseKeyword: false,
    filter: {
      seoDifficulty: { min: 0, max: 44 },
      searchVolume: { min: 50, max: 8000 },
      keyword: { notIncludes: config.negativeKeywords }
    },
    sortBy: 'searchVolume',
    orderBy: 'desc',
    limit
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify(payload)
  });
  const json = await response.json();
  if (!response.ok || !json.result) {
    throw new Error(`Rakko API error: ${JSON.stringify(json.errors || json)}`);
  }
  await logUsage('rakko', '/v1/suggest-keywords', json.meta?.consumedCredit || 0, { seed });
  return (json.data?.items || []).map((item) => {
    const metrics = item.metrics || {};
    return {
      keyword: item.keyword,
      source: `rakko:${seed}`,
      search_volume: metrics.searchVolume,
      seo_difficulty: metrics.seoDifficulty,
      cpc: metrics.cpc,
      competition: metrics.competition,
      first_seen_range: metrics.firstSeenRange,
      intent: inferIntent(item.keyword),
      score: scoreKeyword(item, config.negativeKeywords),
      status: scoreKeyword(item, config.negativeKeywords) > 0 ? 'unused' : 'rejected',
      fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });
}

export function inferIntent(keyword) {
  if (/レシピ|食事|朝ごはん|夜ご飯|献立|コンビニ/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|二の腕|お腹|背中/.test(keyword)) return 'body-part';
  if (/40代|50代|更年期|産後/.test(keyword)) return 'life-stage';
  return 'informational';
}

export async function refreshKeywordsFromRakko(seeds) {
  const inserted = [];
  for (const seed of seeds) {
    const items = await fetchRakkoKeywords(seed);
    const filtered = items.filter((item) => item.score > 0);
    await upsertKeywords(filtered);
    inserted.push(...filtered);
  }
  return inserted;
}
