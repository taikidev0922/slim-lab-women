import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './lib/env.mjs';
import { RakkoApiClient, confirmOrExit } from './lib/rakko-client.mjs';

await loadEnv();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const SEED_KEYWORDS = [
  'ダイエット', '痩せたい', '痩せる方法', 'ぽっこりお腹', '下半身痩せ', '二の腕 痩せ',
  '産後ダイエット', '更年期 ダイエット', '生理前 体重', '停滞期', 'リバウンド',
  '食事制限', '糖質制限', '断食 16時間', '基礎代謝', 'むくみ 解消',
  'プロテイン 女性', 'ソイプロテイン', '置き換えダイエット', '酵素ドリンク',
  'スムージー', 'サラダチキン', '宅食 ダイエット', '冷凍弁当', 'EMS', '体組成計',
  'ダイエットサプリ', '食物繊維 サプリ', 'パーソナルジム', 'オンラインフィットネス'
];

export const CONFIG = {
  // New domains should initially avoid strong SERPs.
  maxRevenueDifficulty: 50,
  maxLongTailDifficulty: 33,
  minLongTailVolume: 100,
  minInfoVolume: 300,
  cpcRevenueThreshold: 0.5,
  cpcNormalizeMax: 3.0,
  volumeNormalizeMax: 5000,
  trendingChangeRate12m: 0.2,
  weights: {
    revenue: 0.4,
    winnability: 0.4,
    volume: 0.2,
    cpcInRevenue: 0.6,
    competitionInRevenue: 0.4
  },
  suggestModes: ['google', 'amazon', 'rakuten'],
  relatedLimit: 1000,
  phase5TopN: 50,
  searchVolumeMaxWaitMs: 10 * 60 * 1000
};

const args = parseArgs(process.argv.slice(2));
const phase = args.phase || 'all';
const outDir = path.resolve(root, args.out || 'output/keyword-research');
const dryRun = Boolean(args.dryRun);
const client = new RakkoApiClient({
  cacheDir: path.resolve(root, 'cache/rakko'),
  noCache: Boolean(args.noCache)
});

async function main() {
  const seeds = args.seeds ? args.seeds.split(',').map((v) => v.trim()).filter(Boolean) : SEED_KEYWORDS;
  const limitedSeeds = args.limitSeeds ? seeds.slice(0, Number(args.limitSeeds)) : seeds;
  const estimate = estimateCredits(limitedSeeds, {
    withSearchVolume: includesPhase('volume'),
    withBriefs: includesPhase('briefs'),
    topN: Number(args.topBriefs || CONFIG.phase5TopN)
  });

  console.log(`[plan] seeds=${limitedSeeds.length}, phase=${phase}, estimatedCredits=${estimate.total}`);
  console.log(`[plan] phase1=${estimate.phase1}, searchVolume≈${estimate.searchVolume}, briefs≈${estimate.briefs}`);
  if (dryRun) return;

  await confirmOrExit({
    yes: Boolean(args.yes),
    dryRun,
    message: `This may consume approximately ${estimate.total} Rakko credits.`
  });

  await fs.mkdir(outDir, { recursive: true });

  let keywords = [];
  if (includesPhase('phase1')) {
    keywords = await collectPhase1(limitedSeeds);
    await writeJson(path.join(outDir, 'phase1_raw_keywords.json'), keywords);
    client.phaseLog('phase1');
  } else {
    keywords = await readJson(path.join(outDir, 'phase1_raw_keywords.json'));
  }

  if (includesPhase('volume')) {
    await confirmOrExit({
      yes: Boolean(args.yes),
      dryRun,
      message: `Search-volume enrichment can consume credits for ${keywords.length} keywords.`
    });
    keywords = await enrichSearchVolume(keywords);
    await writeJson(path.join(outDir, 'phase2_enriched_keywords.json'), keywords);
    client.phaseLog('search-volume');
  } else {
    const enriched = await tryReadJson(path.join(outDir, 'phase2_enriched_keywords.json'));
    if (enriched?.length) keywords = enriched;
  }

  const scored = scoreAndClassify(keywords)
    .filter((item) => item.tier !== '除外')
    .sort((a, b) => b.total_score - a.total_score);

  await fs.writeFile(path.join(outDir, 'keywords_master.csv'), toCsv(scored, [
    'keyword', 'tier', 'monetize_type', 'total_score', 'revenue_score',
    'winnability_score', 'searchVolume', 'seoDifficulty', 'cpc', 'competition',
    'is_trending', 'from_amazon_suggest', 'article_type', 'source_seed'
  ]));

  await writeJson(path.join(outDir, 'site_structure.json'), buildSiteStructure(scored));
  console.log(`[output] ${path.relative(root, path.join(outDir, 'keywords_master.csv'))}`);
  console.log(`[output] ${path.relative(root, path.join(outDir, 'site_structure.json'))}`);

  if (includesPhase('briefs')) {
    const topN = Number(args.topBriefs || CONFIG.phase5TopN);
    await confirmOrExit({
      yes: Boolean(args.yes),
      dryRun,
      message: `Article briefs call headline/other/question endpoints for top ${topN} keywords.`
    });
    const briefs = await buildArticleBriefs(scored.slice(0, topN));
    await writeJson(path.join(outDir, 'article_briefs.json'), briefs);
    console.log(`[output] ${path.relative(root, path.join(outDir, 'article_briefs.json'))}`);
    client.phaseLog('briefs');
  }

  client.phaseLog('total');
}

async function collectPhase1(seeds) {
  const map = new Map();
  for (const seed of seeds) {
    console.log(`[phase1] seed=${seed}`);
    const related = await client.post('/v1/related-keywords', {
      keyword: seed,
      matchType: 'partialMatch',
      limit: CONFIG.relatedLimit,
      sortBy: 'searchVolume',
      orderBy: 'desc'
    });
    for (const item of related.data?.items || []) {
      mergeKeyword(map, normalizeKeywordItem(item, { seed, source: 'related', engines: [] }));
    }

    const suggest = await client.post('/v1/suggest-keywords', {
      keyword: seed,
      modes: CONFIG.suggestModes,
      increaseKeyword: true,
      sortBy: 'searchVolume',
      orderBy: 'desc'
    });
    for (const item of suggest.data?.items || []) {
      mergeKeyword(map, normalizeKeywordItem(item, {
        seed,
        source: 'suggest',
        engines: item.suggestEngines?.active || []
      }));
    }
  }
  return [...map.values()];
}

function normalizeKeywordItem(item, { seed, source, engines }) {
  const metrics = item.metrics || {};
  const activeEngines = Array.isArray(engines) ? engines : [];
  return {
    keyword: item.keyword,
    source_seed: seed,
    sources: [source],
    suggest_engines: activeEngines,
    from_amazon_suggest: activeEngines.includes('amazon'),
    from_rakuten_suggest: activeEngines.includes('rakuten'),
    searchVolume: nullableNumber(metrics.searchVolume),
    seoDifficulty: nullableNumber(metrics.seoDifficulty),
    cpc: nullableNumber(metrics.cpc),
    competition: nullableNumber(metrics.competition),
    trend_12m: null,
    is_trending: false
  };
}

function mergeKeyword(map, next) {
  if (!next.keyword) return;
  const current = map.get(next.keyword);
  if (!current) {
    map.set(next.keyword, next);
    return;
  }
  current.sources = [...new Set([...current.sources, ...next.sources])];
  current.suggest_engines = [...new Set([...current.suggest_engines, ...next.suggest_engines])];
  current.from_amazon_suggest ||= next.from_amazon_suggest;
  current.from_rakuten_suggest ||= next.from_rakuten_suggest;
  current.searchVolume = bestNumber(current.searchVolume, next.searchVolume, 'max');
  current.seoDifficulty = bestNumber(current.seoDifficulty, next.seoDifficulty, 'min');
  current.cpc = bestNumber(current.cpc, next.cpc, 'max');
  current.competition = bestNumber(current.competition, next.competition, 'max');
}

async function enrichSearchVolume(keywords) {
  const json = await client.post('/v1/search-volume', {
    keywords: keywords.map((item) => item.keyword),
    seoDifficulty: true,
    dataCompletion: true,
    location: 'Japan',
    language: 'Japanese',
    deduplicate: true,
    aggregationPeriodMonths: 12
  }, { cache: false });
  const requestId = json.data?.requestId;
  if (!requestId) throw new Error(`search-volume did not return requestId: ${JSON.stringify(json)}`);
  await pollSearchVolume(requestId);
  const results = await client.post(`/v1/search-volume/${requestId}/results`, {
    noiseReduction: true,
    sortBy: 'searchVolume',
    orderBy: 'desc',
    limit: 50000
  }, { cache: false });
  const byKeyword = new Map(keywords.map((item) => [item.keyword, item]));
  for (const item of results.data?.items || []) {
    const current = byKeyword.get(item.keyword);
    if (!current) continue;
    const metrics = item.metrics || {};
    current.searchVolume = nullableNumber(metrics.searchVolume);
    current.seoDifficulty = nullableNumber(metrics.seoDifficulty);
    current.cpc = nullableNumber(metrics.cpc);
    current.competition = nullableNumber(metrics.competition);
    current.trend_12m = nullableNumber(item.trends?.changeRate?.['12m']);
    current.is_trending = Number(current.trend_12m || 0) >= CONFIG.trendingChangeRate12m;
  }
  return [...byKeyword.values()];
}

async function pollSearchVolume(requestId) {
  const started = Date.now();
  let delay = 5000;
  while (Date.now() - started < CONFIG.searchVolumeMaxWaitMs) {
    const status = await client.get(`/v1/search-volume/${requestId}/status`, { cache: false });
    if (status.data?.isCompleted) return;
    await sleep(delay);
    delay = Math.min(delay * 1.5, 30000);
  }
  throw new Error(`search-volume request ${requestId} timed out.`);
}

function scoreAndClassify(items) {
  return items.map((item) => {
    const searchVolume = nullableNumber(item.searchVolume);
    const seoDifficulty = nullableNumber(item.seoDifficulty);
    const cpc = nullableNumber(item.cpc) || 0;
    const competition = nullableNumber(item.competition) || 0;
    const volScore = Math.min((searchVolume || 0) / CONFIG.volumeNormalizeMax, 1);
    const cpcScore = Math.min(cpc / CONFIG.cpcNormalizeMax, 1);
    const easeScore = seoDifficulty == null ? 0.5 : Math.max(0, (100 - seoDifficulty) / 100);
    const revenueScore = CONFIG.weights.cpcInRevenue * cpcScore + CONFIG.weights.competitionInRevenue * (competition / 100);
    const winnabilityScore = easeScore;
    const totalScore = CONFIG.weights.revenue * revenueScore + CONFIG.weights.winnability * winnabilityScore + CONFIG.weights.volume * volScore;
    const classified = classifyKeyword({ ...item, searchVolume, seoDifficulty, cpc, competition });
    return {
      ...item,
      searchVolume,
      seoDifficulty,
      cpc,
      competition,
      revenue_score: round(revenueScore),
      winnability_score: round(winnabilityScore),
      total_score: round(totalScore),
      ...classified
    };
  });
}

function classifyKeyword(item) {
  const difficulty = item.seoDifficulty;
  const volume = item.searchVolume;
  const isPurchasingSuggest = item.from_amazon_suggest || item.from_rakuten_suggest;
  const difficultyForRule = difficulty == null ? 50 : difficulty;
  const hasLongTailVolume = volume == null || volume >= CONFIG.minLongTailVolume;

  if ((item.cpc >= CONFIG.cpcRevenueThreshold || isPurchasingSuggest) && difficultyForRule <= CONFIG.maxRevenueDifficulty) {
    const monetizeType = decideMonetizeType(item);
    return {
      tier: '①',
      monetize_type: monetizeType,
      article_type: monetizeType === 'a8' ? '比較・ランキング・申込導線記事' : '比較・ランキング・おすすめ記事'
    };
  }
  if (difficultyForRule <= CONFIG.maxLongTailDifficulty && hasLongTailVolume) {
    return { tier: '③', monetize_type: decideMonetizeType(item), article_type: '単一商品レビュー・口コミ・体験談' };
  }
  if (volume != null && volume >= CONFIG.minInfoVolume) {
    return { tier: '②', monetize_type: 'both', article_type: '悩み解決・ノウハウ解説記事' };
  }
  return { tier: '除外', monetize_type: 'none', article_type: '' };
}

function decideMonetizeType(item) {
  if (item.from_amazon_suggest || item.from_rakuten_suggest) return item.cpc >= CONFIG.cpcRevenueThreshold ? 'both' : 'amazon';
  if (/ジム|宅食|冷凍弁当|オンラインフィットネス|置き換え|酵素|サプリ|EMS/.test(item.keyword)) return 'a8';
  return item.cpc >= CONFIG.cpcRevenueThreshold ? 'a8' : 'both';
}

function buildSiteStructure(scored) {
  const categories = {};
  for (const item of scored) {
    const category = inferCategory(item.keyword, item.source_seed);
    categories[category] ||= { category, pillar_articles: [], support_articles: [] };
    const node = {
      keyword: item.keyword,
      tier: item.tier,
      article_type: item.article_type,
      monetize_type: item.monetize_type,
      total_score: item.total_score
    };
    if (item.tier === '①') {
      categories[category].pillar_articles.push({ ...node, internal_link_to: null });
    } else {
      const pillar = categories[category].pillar_articles[0]?.keyword || findGlobalPillar(scored, category)?.keyword || null;
      categories[category].support_articles.push({ ...node, internal_link_to: pillar });
    }
  }
  for (const category of Object.values(categories)) {
    category.pillar_articles = category.pillar_articles.slice(0, 3);
    category.support_articles = category.support_articles.slice(0, 20);
  }
  return {
    generated_at: new Date().toISOString(),
    strategy_note: '②③の記事から①の比較・おすすめ記事へ内部リンクを送るトピッククラスター構造。',
    categories: Object.values(categories)
  };
}

function findGlobalPillar(scored, category) {
  return scored.find((item) => item.tier === '①' && inferCategory(item.keyword, item.source_seed) === category);
}

async function buildArticleBriefs(items) {
  const briefs = [];
  for (const item of items.filter((v) => v.tier === '①' || v.tier === '③')) {
    console.log(`[brief] ${item.keyword}`);
    const [headline, other, questions] = await Promise.all([
      client.post('/v1/headline', {
        keyword: item.keyword,
        lessHeadlines: true,
        lessCharacters: true,
        h1: true,
        h2: true,
        h3: true,
        h4: false,
        h5: false,
        h6: false,
        limit: 10
      }),
      client.post('/v1/other-keywords', { keyword: item.keyword, sortBy: 'importance', orderBy: 'desc' }),
      client.post('/v1/question-search', { keyword: item.keyword, limit: 30 })
    ]);
    briefs.push({
      keyword: item.keyword,
      tier: item.tier,
      article_type: item.article_type,
      target_word_count: Math.ceil((headline.data?.summary?.averageWordCount || 3500) * 1.08),
      headline_summary: headline.data?.summary || {},
      required_headings: extractCommonHeadings(headline.data?.items || []),
      lsi_keywords: (other.data?.items || []).filter((v) => v.type === 'lsi').slice(0, 30),
      faq: [
        ...(other.data?.items || []).filter((v) => v.type === 'paa').map((v) => v.question).filter(Boolean),
        ...(questions.data?.items || []).map((v) => v.question).filter(Boolean)
      ].slice(0, 12),
      ymyl_note: '運営者情報、実体験、参考出典、過度な減量を避ける注意書きを記事内に入れる。医療的断定は避ける。'
    });
  }
  return briefs;
}

function extractCommonHeadings(items) {
  const counts = new Map();
  for (const page of items) {
    for (const heading of page.headlines || []) {
      const text = String(heading.text || '').trim();
      if (!text || text.length > 80) continue;
      counts.set(text, (counts.get(text) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([text, count]) => ({ text, count }));
}

export async function discoverCompetitorGaps() {
  // TODO: 公開後に有効化。
  // /v1/competitive で競合ドメインを抽出し、/v1/influx-keywords で競合流入語を取得する。
  // targetUniqueKeywordCount が大きい語を新規クラスター候補として評価する。
  return [];
}

function inferCategory(keyword, seed) {
  const text = `${keyword} ${seed}`;
  if (/プロテイン|ソイ/.test(text)) return 'プロテイン';
  if (/置き換え|酵素|スムージー/.test(text)) return '置き換えダイエット';
  if (/宅食|冷凍弁当|サラダチキン/.test(text)) return '宅食・食事管理';
  if (/サプリ|食物繊維/.test(text)) return 'サプリメント';
  if (/ジム|オンラインフィットネス|EMS|体組成計/.test(text)) return '運動・フィットネス';
  if (/産後|更年期|生理前/.test(text)) return '女性のライフステージ';
  if (/お腹|下半身|二の腕|むくみ/.test(text)) return '部位別ダイエット';
  return 'ダイエット基礎';
}

function estimateCredits(seeds, { withSearchVolume, withBriefs, topN }) {
  const phase1 = seeds.length * (1 + CONFIG.suggestModes.length);
  const searchVolume = withSearchVolume ? 10 : 0;
  const briefs = withBriefs ? topN * 6 : 0;
  return { phase1, searchVolume, briefs, total: phase1 + searchVolume + briefs };
}

function includesPhase(name) {
  if (phase === 'all') {
    if (name === 'briefs') return Boolean(args.withBriefs);
    return ['phase1', 'score', 'volume'].includes(name);
  }
  if (phase === 'phase1') return name === 'phase1';
  if (phase === 'score') return name === 'score';
  if (phase === 'volume') return ['phase1', 'volume'].includes(name);
  if (phase === 'briefs') return name === 'briefs';
  return false;
}

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (arg === '--yes') out.yes = true;
    else if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--no-cache') out.noCache = true;
    else if (arg === '--with-briefs') out.withBriefs = true;
    else if (arg.includes('=')) {
      const [key, value] = arg.replace(/^--/, '').split(/=(.*)/s);
      out[toCamel(key)] = value;
    }
  }
  return out;
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function toCsv(rows, columns) {
  return `${columns.join(',')}\n${rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')).join('\n')}\n`;
}

function csvCell(value) {
  if (value == null) return '';
  const text = Array.isArray(value) ? value.join('|') : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2));
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function tryReadJson(file) {
  try {
    return await readJson(file);
  } catch {
    return null;
  }
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function bestNumber(a, b, mode) {
  if (a == null) return b;
  if (b == null) return a;
  return mode === 'min' ? Math.min(a, b) : Math.max(a, b);
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
