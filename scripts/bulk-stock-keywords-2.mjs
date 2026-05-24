/**
 * bulk-stock-keywords-2.mjs
 * 第2弾：食材・飲み物・料理・「痩せる」系・イベント系
 * ← 第1弾(bulk-stock-keywords.mjs)の取りこぼし角度を網羅
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

const SEEDS = [
  // ── 食材系（単体食材 + ダイエット）─────────────────────────────────────
  { cat: '食材', seed: 'バナナ ダイエット' },
  { cat: '食材', seed: 'りんご ダイエット' },
  { cat: '食材', seed: 'ヨーグルト ダイエット' },
  { cat: '食材', seed: '納豆 ダイエット' },
  { cat: '食材', seed: 'キャベツ ダイエット' },
  { cat: '食材', seed: '鶏むね肉 ダイエット' },
  { cat: '食材', seed: 'さつまいも ダイエット' },
  { cat: '食材', seed: '豆乳 ダイエット' },
  { cat: '食材', seed: 'こんにゃく ダイエット' },
  { cat: '食材', seed: 'きのこ ダイエット' },
  { cat: '食材', seed: 'もち麦 ダイエット' },
  { cat: '食材', seed: 'ナッツ ダイエット' },
  { cat: '食材', seed: 'えのき ダイエット' },
  { cat: '食材', seed: 'ゆで卵 ダイエット' },
  { cat: '食材', seed: 'アボカド ダイエット' },
  { cat: '食材', seed: 'オートミール ダイエット' },
  { cat: '食材', seed: 'スムージー ダイエット' },
  { cat: '食材', seed: '置き換えダイエット' },
  { cat: '食材', seed: 'チアシード ダイエット' },
  { cat: '食材', seed: 'アーモンド ダイエット' },
  { cat: '食材', seed: 'ブロッコリー ダイエット' },
  { cat: '食材', seed: 'トマト ダイエット' },
  { cat: '食材', seed: 'わかめ ダイエット' },
  { cat: '食材', seed: 'グレープフルーツ ダイエット' },
  { cat: '食材', seed: 'きゅうり ダイエット' },
  { cat: '食材', seed: '鶏ささみ ダイエット' },
  { cat: '食材', seed: '春雨 ダイエット' },
  { cat: '食材', seed: 'しらたき ダイエット' },
  { cat: '食材', seed: '豆腐 ダイエット' },
  { cat: '食材', seed: '味噌汁 ダイエット' },
  { cat: '食材', seed: '玄米 ダイエット' },
  { cat: '食材', seed: 'もやし ダイエット' },
  { cat: '食材', seed: 'にんじん ダイエット' },
  { cat: '食材', seed: 'りんご酢 ダイエット' },
  { cat: '食材', seed: 'はちみつ ダイエット' },

  // ── 飲み物系 ──────────────────────────────────────────────────────────
  { cat: '飲み物', seed: 'ダイエット コーヒー' },
  { cat: '飲み物', seed: 'ダイエット お茶' },
  { cat: '飲み物', seed: 'ダイエット 緑茶' },
  { cat: '飲み物', seed: 'ダイエット 豆乳' },
  { cat: '飲み物', seed: 'ダイエット 炭酸水' },
  { cat: '飲み物', seed: 'ダイエット ドリンク' },
  { cat: '飲み物', seed: 'ダイエット プロテイン 女性' },

  // ── 料理・献立系 ──────────────────────────────────────────────────────
  { cat: '料理', seed: 'ダイエット スープ' },
  { cat: '料理', seed: 'ダイエット サラダ' },
  { cat: '料理', seed: 'ダイエット 鍋' },
  { cat: '料理', seed: 'ダイエット おにぎり' },
  { cat: '料理', seed: 'ダイエット パスタ' },
  { cat: '料理', seed: 'ダイエット カレー' },
  { cat: '料理', seed: 'ダイエット お好み焼き' },
  { cat: '料理', seed: 'ダイエット 炒め物' },
  { cat: '料理', seed: 'ダイエット 丼' },
  { cat: '料理', seed: 'ダイエット サンドイッチ' },
  { cat: '料理', seed: 'ダイエット お弁当' },
  { cat: '料理', seed: 'ダイエット 朝食' },
  { cat: '料理', seed: 'ダイエット 鶏肉 料理' },
  { cat: '料理', seed: 'ダイエット 蒸し料理' },

  // ── 痩せる系 ──────────────────────────────────────────────────────────
  { cat: '痩せる', seed: '痩せる 食事' },
  { cat: '痩せる', seed: '痩せる 運動' },
  { cat: '痩せる', seed: '痩せる ストレッチ' },
  { cat: '痩せる', seed: '痩せる 筋トレ' },
  { cat: '痩せる', seed: '痩せる ヨガ' },
  { cat: '痩せる', seed: '痩せる ウォーキング' },
  { cat: '痩せる', seed: '痩せる 朝ごはん' },
  { cat: '痩せる', seed: '痩せる 間食' },
  { cat: '痩せる', seed: '痩せる 歩き方' },
  { cat: '痩せる', seed: '痩せる 姿勢' },
  { cat: '痩せる', seed: '早く 痩せる' },
  { cat: '痩せる', seed: '痩せる 水' },
  { cat: '痩せる', seed: '痩せる 習慣 女性' },
  { cat: '痩せる', seed: '痩せる 生活' },

  // ── 季節・イベント系 ──────────────────────────────────────────────────
  { cat: 'イベント', seed: '夏 ダイエット' },
  { cat: 'イベント', seed: '冬 ダイエット' },
  { cat: 'イベント', seed: '春 ダイエット' },
  { cat: 'イベント', seed: '結婚式 ダイエット' },
  { cat: 'イベント', seed: '健康診断 ダイエット' },
  { cat: 'イベント', seed: '成人式 ダイエット' },
  { cat: 'イベント', seed: '旅行 ダイエット' },
  { cat: 'イベント', seed: '夏祭り ダイエット' },
  { cat: 'イベント', seed: '同窓会 ダイエット' },

  // ── 体調・美容隣接 ────────────────────────────────────────────────────
  { cat: '体調', seed: 'ダイエット 便秘' },
  { cat: '体調', seed: 'ダイエット 肌荒れ' },
  { cat: '体調', seed: 'ダイエット 疲れ' },
  { cat: '体調', seed: 'むくみ 食事' },
  { cat: '体調', seed: 'ダイエット 頭痛' },
  { cat: '体調', seed: 'ダイエット 冷え' },
  { cat: '体調', seed: 'ダイエット 睡眠 質' },
];

// ─── スコアリング ─────────────────────────────────────────────────────────
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

function inferIntent(keyword) {
  if (/レシピ|食事|朝ごはん|夜ご飯|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|炒め|蒸し|料理|食材|食べ物|ダイエット食/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|フラフープ|踏み台|有酸素|歩き方|姿勢/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス|記録/.test(keyword)) return 'mindset';
  if (/40代|50代|30代|更年期|産後|生理|PMS|妊活/.test(keyword)) return 'life-stage';
  return 'informational';
}

// ─── 実行 ────────────────────────────────────────────────────────────────────
const config = await loadConfig();
const catCounts = SEEDS.reduce((acc, s) => {
  acc[s.cat] = (acc[s.cat] || 0) + 1;
  return acc;
}, {});

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 第2弾 美スリム研究所');
console.log('═══════════════════════════════════════════════════');
console.log(`シード数: ${SEEDS.length}件`);
Object.entries(catCounts).forEach(([cat, n]) => console.log(`  ${cat}: ${n}シード`));
console.log(`最大取得数: 約 ${SEEDS.length * 40} キーワード`);
if (dryRun) console.log('⚠ DRY RUN モード: DBに保存しません');
console.log('───────────────────────────────────────────────────\n');

const beforeCount = await countUnusedKeywords();
console.log(`DB未使用キーワード (開始前): ${beforeCount}件\n`);

const apiKey = process.env.RAKKO_API_KEY;
const endpoint = 'https://api.rakkokeyword.com/v1/suggest-keywords';
let totalFetched = 0;
let totalStored = 0;
let totalCredit = 0;
let errors = 0;

for (let i = 0; i < SEEDS.length; i++) {
  const { cat, seed } = SEEDS[i];
  const progress = `[${String(i + 1).padStart(2, '0')}/${SEEDS.length}]`;
  process.stdout.write(`${progress} ${cat.padEnd(6)} | "${seed}" ... `);

  try {
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
      limit: 40
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify(payload)
    });
    const json = await response.json();

    if (!response.ok || !json.result) throw new Error(JSON.stringify(json.errors || json));

    const credit = Number(json.meta?.consumedCredit || 0);
    totalCredit += credit;
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 2 });

    const items = (json.data?.items || []).map((item) => {
      const metrics = item.metrics || {};
      const sc = scoreKeyword(item, config.negativeKeywords);
      return {
        keyword: item.keyword,
        source: `rakko:${seed}`,
        search_volume: metrics.searchVolume,
        seo_difficulty: metrics.seoDifficulty,
        cpc: metrics.cpc,
        competition: metrics.competition,
        first_seen_range: metrics.firstSeenRange,
        intent: inferIntent(item.keyword),
        score: sc,
        status: sc > 0 ? 'unused' : 'rejected',
        fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    const positive = items.filter((it) => it.score > 0);
    totalFetched += items.length;
    totalStored += positive.length;

    if (!dryRun && positive.length > 0) await upsertKeywords(positive);

    console.log(`取得 ${String(items.length).padStart(2)}件 → 保存 ${String(positive.length).padStart(2)}件 (credit: ${credit}) ✅`);
  } catch (err) {
    console.log(`❌ エラー: ${err.message}`);
    errors++;
  }

  if (i < SEEDS.length - 1) await sleep(DELAY_MS);
}

const afterCount = await countUnusedKeywords();
console.log('\n═══════════════════════════════════════════════════');
console.log(' 完了サマリー');
console.log('═══════════════════════════════════════════════════');
console.log(`総取得キーワード  : ${totalFetched} 件`);
console.log(`DBに保存対象     : ${totalStored} 件 (score > 0)`);
console.log(`消費クレジット   : ${totalCredit.toFixed(1)}`);
console.log(`エラー           : ${errors} 件`);
console.log(`DB未使用 (開始前): ${beforeCount} 件`);
console.log(`DB未使用 (完了後): ${afterCount} 件`);
console.log(`純増             : +${afterCount - beforeCount} 件`);
console.log('═══════════════════════════════════════════════════\n');

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
