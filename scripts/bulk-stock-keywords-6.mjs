/**
 * bulk-stock-keywords-6.mjs
 * 第6弾：increaseKeyword: true で全く別のキーワードセットを獲得
 * ← 第1〜5弾は全て increaseKeyword: false だった
 * 同じシードでも拡張モードにより異なるロングテールが大量に返ってくる
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

// 第1〜5弾で最高収量だったシード × increaseKeyword: true
const SEEDS = [
  // ── 食事管理系トップシード ────────────────────────────────────────────
  { cat: '食事', seed: 'ダイエット 食事' },
  { cat: '食事', seed: 'ダイエット 朝ごはん' },
  { cat: '食事', seed: 'ダイエット コンビニ' },
  { cat: '食事', seed: 'ダイエット レシピ' },
  { cat: '食事', seed: 'ダイエット カロリー' },
  { cat: '食事', seed: 'ダイエット 水' },
  { cat: '食事', seed: 'ダイエット 間食' },
  { cat: '食事', seed: 'ダイエット 外食' },
  { cat: '食事', seed: 'ダイエット お腹' },
  { cat: '食事', seed: 'ダイエット スープ' },
  { cat: '食事', seed: 'ダイエット サラダ' },
  { cat: '食事', seed: 'ダイエット カレー' },
  { cat: '食事', seed: 'ダイエット 夜ご飯' },
  { cat: '食事', seed: 'ダイエット ランチ' },
  { cat: '食事', seed: 'ダイエット プロテイン' },
  { cat: '食事', seed: 'ダイエット 糖質' },
  { cat: '食事', seed: 'ダイエット 断食' },
  { cat: '食事', seed: 'ダイエット たんぱく質' },

  // ── 食材トップシード ──────────────────────────────────────────────────
  { cat: '食材', seed: 'バナナ ダイエット' },
  { cat: '食材', seed: 'りんご ダイエット' },
  { cat: '食材', seed: 'ヨーグルト ダイエット' },
  { cat: '食材', seed: '納豆 ダイエット' },
  { cat: '食材', seed: '豆腐 ダイエット' },
  { cat: '食材', seed: '玄米 ダイエット' },
  { cat: '食材', seed: 'しらたき ダイエット' },
  { cat: '食材', seed: 'はちみつ ダイエット' },
  { cat: '食材', seed: 'りんご酢 効果' },
  { cat: '食材', seed: 'そば ダイエット' },
  { cat: '食材', seed: 'キムチ ダイエット' },
  { cat: '食材', seed: 'さつまいも ダイエット' },
  { cat: '食材', seed: '鶏むね肉 ダイエット' },
  { cat: '食材', seed: '豆乳 ダイエット' },
  { cat: '食材', seed: '味噌汁 ダイエット' },
  { cat: '食材', seed: 'こんにゃく ダイエット' },
  { cat: '食材', seed: 'トマト ダイエット' },
  { cat: '食材', seed: 'オートミール ダイエット' },
  { cat: '食材', seed: '置き換えダイエット' },

  // ── 運動トップシード ──────────────────────────────────────────────────
  { cat: '運動', seed: 'ダイエット 運動' },
  { cat: '運動', seed: 'ダイエット 方法' },
  { cat: '運動', seed: 'ダイエット 体重' },
  { cat: '運動', seed: '筋トレ 女性' },
  { cat: '運動', seed: '痩せる ストレッチ' },
  { cat: '運動', seed: 'ランニング ダイエット' },
  { cat: '運動', seed: 'ダイエット フラフープ' },
  { cat: '運動', seed: '痩せる 運動' },
  { cat: '運動', seed: 'ダイエット ウォーキング' },
  { cat: '運動', seed: 'ダイエット ストレッチ' },
  { cat: '運動', seed: 'ダイエット ヨガ' },
  { cat: '運動', seed: '作り置き ダイエット' },   // ← 新発見33件

  // ── ライフステージトップシード ────────────────────────────────────────
  { cat: 'ライフ', seed: '40代 ダイエット' },
  { cat: 'ライフ', seed: '50代 ダイエット' },
  { cat: 'ライフ', seed: '産後 ダイエット' },
  { cat: 'ライフ', seed: 'ダイエット 生理' },
  { cat: 'ライフ', seed: 'ダイエット 更年期' },

  // ── ヘルシー・腸活トップシード ────────────────────────────────────────
  { cat: 'ヘルシー', seed: 'ヘルシー レシピ' },
  { cat: 'ヘルシー', seed: 'ヘルシー ランチ' },
  { cat: 'ヘルシー', seed: '腸活 レシピ' },
  { cat: 'ヘルシー', seed: '低糖質 パン' },
  { cat: 'ヘルシー', seed: '高たんぱく レシピ' },
  { cat: 'ヘルシー', seed: 'グルテンフリー パン' },
  { cat: 'ヘルシー', seed: 'グルテンフリー レシピ' },
  { cat: 'ヘルシー', seed: 'プロテイン 女性 おすすめ' },

  // ── マインド ──────────────────────────────────────────────────────────
  { cat: 'マインド', seed: 'ダイエット 続かない' },
  { cat: 'マインド', seed: 'ダイエット モチベ' },
  { cat: 'マインド', seed: 'ダイエット 停滞期' },
  { cat: 'マインド', seed: 'ダイエット リバウンド' },

  // ── 新発見 ────────────────────────────────────────────────────────────
  { cat: '新規', seed: '骨盤底筋 鍛える' },     // ← 新発見25件
  { cat: '新規', seed: 'オートファジー ダイエット' },
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
  if (/レシピ|食事|朝ごはん|朝食|昼食|ランチ|ディナー|夜ご飯|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|料理|食材|食べ物|飲み物|ドリンク|スイーツ|お菓子|パン|低糖質|低カロリー|高たんぱく|ヘルシー|便秘|腸内|善玉菌|むくみ|作り置き/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|有酸素|ランニング|ジョギング|ボクシング|マッサージ|骨盤|体幹|フラフープ/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス|記録|失敗|成功|ズボラ/.test(keyword)) return 'mindset';
  if (/40代|50代|30代|20代|60代|更年期|産後|授乳|生理|PMS|妊活|妊娠|ブライダル/.test(keyword)) return 'life-stage';
  return 'informational';
}

// ─── 実行 ────────────────────────────────────────────────────────────────────
const config = await loadConfig();
const catCounts = SEEDS.reduce((acc, s) => {
  acc[s.cat] = (acc[s.cat] || 0) + 1;
  return acc;
}, {});

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 第6弾 美スリム研究所');
console.log(' ★ increaseKeyword: true — 全く新しい拡張キーワードセット');
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
      increaseKeyword: true,   // ← ここが違う
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
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 6, increaseKeyword: true });

    const items = (json.data?.items || []).map((item) => {
      const metrics = item.metrics || {};
      const sc = scoreKeyword(item, config.negativeKeywords);
      return {
        keyword: item.keyword,
        source: `rakko:${seed}:inc`,
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
