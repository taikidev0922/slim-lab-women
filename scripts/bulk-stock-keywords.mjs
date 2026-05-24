/**
 * bulk-stock-keywords.mjs
 * ラッコキーワードAPIから「ダイエット」周辺のキーワードをまんべんなく取得してDBに蓄積する。
 * サブスク切れ前の一括ストック用スクリプト。
 *
 * Usage:
 *   node scripts/bulk-stock-keywords.mjs            # 全カテゴリ実行
 *   node scripts/bulk-stock-keywords.mjs --dry-run  # 取得のみ・DBに保存しない
 *   node scripts/bulk-stock-keywords.mjs --cat 食事  # 指定カテゴリのみ (部分一致)
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const catFilter = args.find((a, i) => args[i - 1] === '--cat') || null;
const DELAY_MS = 1000; // rate-limit対策

// ─── シードリスト（2ワード最適化版）─────────────────────────────────────────
// ラッコキーワードは「ダイエット + X」の2ワードシードが最も多くサジェストを返す
const SEEDS = [
  // ── 食事管理 ───────────────────────────────────────────────────────────────
  { cat: '食事管理', seed: 'ダイエット 食事' },
  { cat: '食事管理', seed: 'ダイエット 朝ごはん' },
  { cat: '食事管理', seed: 'ダイエット 昼ごはん' },
  { cat: '食事管理', seed: 'ダイエット 夕食' },
  { cat: '食事管理', seed: 'ダイエット 間食' },
  { cat: '食事管理', seed: 'ダイエット コンビニ' },
  { cat: '食事管理', seed: 'ダイエット 外食' },
  { cat: '食事管理', seed: 'ダイエット レシピ' },
  { cat: '食事管理', seed: 'ダイエット 糖質' },
  { cat: '食事管理', seed: 'ダイエット 断食' },
  { cat: '食事管理', seed: 'ダイエット カロリー' },
  { cat: '食事管理', seed: 'ダイエット たんぱく質' },
  { cat: '食事管理', seed: 'ダイエット プロテイン' },
  { cat: '食事管理', seed: 'ダイエット お菓子' },
  { cat: '食事管理', seed: 'ダイエット 腸活' },
  { cat: '食事管理', seed: 'ダイエット お酒' },
  { cat: '食事管理', seed: 'ダイエット 甘いもの' },
  { cat: '食事管理', seed: 'ダイエット 夜食' },
  { cat: '食事管理', seed: 'ダイエット 水' },

  // ── 部位別 ─────────────────────────────────────────────────────────────────
  { cat: '部位別', seed: 'ダイエット 下腹' },
  { cat: '部位別', seed: 'ダイエット 二の腕' },
  { cat: '部位別', seed: 'ダイエット 脚' },
  { cat: '部位別', seed: 'ダイエット お腹' },
  { cat: '部位別', seed: 'ダイエット 背中' },
  { cat: '部位別', seed: 'ダイエット ウエスト' },
  { cat: '部位別', seed: 'ダイエット 顔' },
  { cat: '部位別', seed: 'ダイエット 太もも' },
  { cat: '部位別', seed: 'ダイエット ヒップ' },
  { cat: '部位別', seed: '下腹 引き締め' },
  { cat: '部位別', seed: 'くびれ 作り方' },

  // ── 宅トレ ─────────────────────────────────────────────────────────────────
  { cat: '宅トレ', seed: 'ダイエット 運動' },
  { cat: '宅トレ', seed: 'ダイエット 筋トレ' },
  { cat: '宅トレ', seed: 'ダイエット ストレッチ' },
  { cat: '宅トレ', seed: 'ダイエット ヨガ' },
  { cat: '宅トレ', seed: 'ダイエット ピラティス' },
  { cat: '宅トレ', seed: 'ダイエット ウォーキング' },
  { cat: '宅トレ', seed: 'ダイエット 宅トレ' },
  { cat: '宅トレ', seed: 'ダイエット スクワット' },
  { cat: '宅トレ', seed: 'ダイエット 有酸素' },
  { cat: '宅トレ', seed: 'ダイエット フラフープ' },
  { cat: '宅トレ', seed: 'ダイエット 踏み台' },
  { cat: '宅トレ', seed: '宅トレ 女性' },
  { cat: '宅トレ', seed: '筋トレ 女性' },

  // ── マインド ────────────────────────────────────────────────────────────────
  { cat: 'マインド', seed: 'ダイエット 続かない' },
  { cat: 'マインド', seed: 'ダイエット やる気' },
  { cat: 'マインド', seed: 'ダイエット メンタル' },
  { cat: 'マインド', seed: 'ダイエット ストレス' },
  { cat: 'マインド', seed: 'ダイエット 習慣' },
  { cat: 'マインド', seed: 'ダイエット モチベ' },
  { cat: 'マインド', seed: 'ダイエット 挫折' },
  { cat: 'マインド', seed: 'ダイエット 停滞期' },
  { cat: 'マインド', seed: 'ダイエット 記録' },
  { cat: 'マインド', seed: 'ダイエット 自分に甘い' },

  // ── ライフステージ ──────────────────────────────────────────────────────────
  { cat: 'ライフステージ', seed: '30代 ダイエット' },
  { cat: 'ライフステージ', seed: '40代 ダイエット' },
  { cat: 'ライフステージ', seed: '50代 ダイエット' },
  { cat: 'ライフステージ', seed: '産後 ダイエット' },
  { cat: 'ライフステージ', seed: 'ダイエット 更年期' },
  { cat: 'ライフステージ', seed: 'ダイエット 生理' },
  { cat: 'ライフステージ', seed: '生理前 ダイエット' },
  { cat: 'ライフステージ', seed: 'ダイエット PMS' },
  { cat: 'ライフステージ', seed: '妊活 ダイエット' },

  // ── 体重・体型管理 ─────────────────────────────────────────────────────────
  { cat: '体重管理', seed: 'ダイエット 方法' },
  { cat: '体重管理', seed: 'ダイエット 始め方' },
  { cat: '体重管理', seed: 'ダイエット リバウンド' },
  { cat: '体重管理', seed: 'ダイエット 代謝' },
  { cat: '体重管理', seed: 'ダイエット 睡眠' },
  { cat: '体重管理', seed: 'ダイエット 体重' },
  { cat: '体重管理', seed: 'ダイエット アプリ' },
  { cat: '体重管理', seed: 'ダイエット 短期間' },
  { cat: '体重管理', seed: 'ダイエット 基礎代謝' },
];

// ─── スコアリング（rakko.mjsと同じロジック） ──────────────────────────────────
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
  if (/レシピ|食事|朝ごはん|夜ご飯|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|フラフープ|踏み台|有酸素/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス|記録/.test(keyword)) return 'mindset';
  if (/40代|50代|30代|更年期|産後|生理|PMS|妊活/.test(keyword)) return 'life-stage';
  return 'informational';
}

// ─── 実行 ────────────────────────────────────────────────────────────────────
const config = await loadConfig();
const targets = catFilter
  ? SEEDS.filter((s) => s.cat.includes(catFilter) || s.seed.includes(catFilter))
  : SEEDS;

const catCounts = targets.reduce((acc, s) => {
  acc[s.cat] = (acc[s.cat] || 0) + 1;
  return acc;
}, {});

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 美スリム研究所');
console.log('═══════════════════════════════════════════════════');
console.log(`シード数: ${targets.length}件`);
Object.entries(catCounts).forEach(([cat, n]) => console.log(`  ${cat}: ${n}シード`));
console.log(`最大取得数: 約 ${targets.length * 40} キーワード`);
console.log(`推定時間: 約 ${Math.ceil(targets.length * (DELAY_MS + 800) / 60000)} 分`);
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

for (let i = 0; i < targets.length; i++) {
  const { cat, seed } = targets[i];
  const progress = `[${String(i + 1).padStart(2, '0')}/${targets.length}]`;
  process.stdout.write(`${progress} ${cat.padEnd(8)} | "${seed}" ... `);

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

    if (!response.ok || !json.result) {
      throw new Error(JSON.stringify(json.errors || json));
    }

    const credit = Number(json.meta?.consumedCredit || 0);
    totalCredit += credit;
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: true });

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

    if (!dryRun && positive.length > 0) {
      await upsertKeywords(positive);
    }

    console.log(`取得 ${String(items.length).padStart(2)}件 → 保存 ${String(positive.length).padStart(2)}件 (credit: ${credit}) ✅`);
  } catch (err) {
    console.log(`❌ エラー: ${err.message}`);
    errors++;
  }

  if (i < targets.length - 1) {
    await sleep(DELAY_MS);
  }
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
