/**
 * bulk-stock-keywords-9.mjs
 * 第9弾：第1〜8弾で全く使っていない新根キーワード群
 * ── 脂肪燃焼 / 断食 / 食べ方 / ドリンク / 運動特化 / ボディケア /
 *    新食材 / ダイエット法 / 体型・目標 ──
 * increaseKeyword: true で最大限に拡張
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

const SEEDS = [
  // ── 脂肪燃焼・代謝・体脂肪 ────────────────────────────────────────────
  { cat: '脂肪燃焼', seed: '脂肪燃焼 食事' },
  { cat: '脂肪燃焼', seed: '脂肪燃焼 運動' },
  { cat: '脂肪燃焼', seed: '脂肪燃焼 スープ' },
  { cat: '脂肪燃焼', seed: '脂肪燃焼 飲み物' },
  { cat: '脂肪燃焼', seed: '内臓脂肪 落とす' },
  { cat: '脂肪燃焼', seed: '内臓脂肪 食事' },
  { cat: '脂肪燃焼', seed: '皮下脂肪 落とす' },
  { cat: '脂肪燃焼', seed: '体脂肪 減らす' },
  { cat: '脂肪燃焼', seed: '体脂肪率 下げる' },
  { cat: '脂肪燃焼', seed: '代謝 上げる' },
  { cat: '脂肪燃焼', seed: '代謝 食事' },
  { cat: '脂肪燃焼', seed: '代謝 上げる 方法' },
  { cat: '脂肪燃焼', seed: '筋肉 つける 食事 女性' },

  // ── 断食・ファスティング ────────────────────────────────────────────────
  { cat: '断食', seed: '間欠断食 食事' },
  { cat: '断食', seed: '16時間断食 食事' },
  { cat: '断食', seed: '16時間断食 効果' },
  { cat: '断食', seed: 'ファスティング 食事' },
  { cat: '断食', seed: 'ファスティング 効果' },
  { cat: '断食', seed: 'ファスティング やり方' },
  { cat: '断食', seed: 'チートデイ 食事' },
  { cat: '断食', seed: 'チートデイ 効果' },

  // ── 食べ方・食べる順番 ────────────────────────────────────────────────
  { cat: '食べ方', seed: '食べる順番 ダイエット' },
  { cat: '食べ方', seed: '食べ痩せ 食事' },
  { cat: '食べ方', seed: '食べても太らない 食べ物' },
  { cat: '食べ方', seed: '夜食べない ダイエット' },
  { cat: '食べ方', seed: '小食 になる 方法' },
  { cat: '食べ方', seed: 'ゆっくり食べる 効果' },
  { cat: '食べ方', seed: '食事制限 ダイエット' },
  { cat: '食べ方', seed: 'カロリー制限 食事' },
  { cat: '食べ方', seed: '糖質制限 食事' },
  { cat: '食べ方', seed: '糖質制限 献立' },
  { cat: '食べ方', seed: 'ケトジェニック 食事' },
  { cat: '食べ方', seed: 'ケトジェニック レシピ' },

  // ── ダイエットドリンク ────────────────────────────────────────────────
  { cat: 'ドリンク', seed: 'コーヒー ダイエット' },
  { cat: 'ドリンク', seed: '緑茶 ダイエット' },
  { cat: 'ドリンク', seed: 'レモン水 ダイエット' },
  { cat: 'ドリンク', seed: 'スムージー ダイエット' },
  { cat: 'ドリンク', seed: 'スムージー レシピ' },
  { cat: 'ドリンク', seed: '青汁 ダイエット' },
  { cat: 'ドリンク', seed: 'MCTオイル ダイエット' },
  { cat: 'ドリンク', seed: 'ルイボスティー ダイエット' },
  { cat: 'ドリンク', seed: 'ハーブティー ダイエット' },
  { cat: 'ドリンク', seed: 'デトックスウォーター レシピ' },
  { cat: 'ドリンク', seed: '豆乳 スムージー' },

  // ── 運動特化（HIIT・ピラティス・水泳等） ──────────────────────────────
  { cat: '運動特化', seed: 'HIIT ダイエット' },
  { cat: '運動特化', seed: 'HIIT 女性' },
  { cat: '運動特化', seed: 'ピラティス 効果' },
  { cat: '運動特化', seed: 'ピラティス 女性' },
  { cat: '運動特化', seed: '水泳 ダイエット' },
  { cat: '運動特化', seed: '縄跳び ダイエット' },
  { cat: '運動特化', seed: '自転車 ダイエット' },
  { cat: '運動特化', seed: '階段 ダイエット' },
  { cat: '運動特化', seed: '体幹 トレーニング 女性' },
  { cat: '運動特化', seed: '有酸素運動 効果' },
  { cat: '運動特化', seed: '有酸素運動 時間' },
  { cat: '運動特化', seed: 'スクワット 効果 女性' },
  { cat: '運動特化', seed: '踏み台昇降 ダイエット' },

  // ── ボディケア（セルライト・リンパ・部位引き締め） ─────────────────────
  { cat: 'ボディ', seed: 'セルライト 解消' },
  { cat: 'ボディ', seed: 'セルライト マッサージ' },
  { cat: 'ボディ', seed: 'リンパ マッサージ 脚' },
  { cat: 'ボディ', seed: '太もも 引き締め' },
  { cat: 'ボディ', seed: '二の腕 引き締め' },
  { cat: 'ボディ', seed: 'お腹 引き締め 運動' },
  { cat: 'ボディ', seed: 'ウエスト 細くする' },
  { cat: 'ボディ', seed: 'くびれ 作り方' },
  { cat: 'ボディ', seed: '背中 痩せる 方法' },
  { cat: 'ボディ', seed: '脚 むくみ 解消' },

  // ── 新食材（MCTオイル・アボカド・ナッツ等） ──────────────────────────
  { cat: '新食材', seed: 'アボカド ダイエット' },
  { cat: '新食材', seed: 'ナッツ ダイエット' },
  { cat: '新食材', seed: 'サーモン ダイエット' },
  { cat: '新食材', seed: 'えごま油 ダイエット' },
  { cat: '新食材', seed: 'MCTオイル 効果' },
  { cat: '新食材', seed: 'クコの実 効果' },
  { cat: '新食材', seed: '発酵食品 ダイエット' },
  { cat: '新食材', seed: 'キヌア ダイエット' },
  { cat: '新食材', seed: 'アーモンドミルク ダイエット' },
  { cat: '新食材', seed: 'ブルーベリー ダイエット' },
  { cat: '新食材', seed: 'わかめ ダイエット' },

  // ── 体型・目標・数値系 ────────────────────────────────────────────────
  { cat: '目標', seed: 'BMI 標準体重 女性' },
  { cat: '目標', seed: '理想体重 計算 女性' },
  { cat: '目標', seed: '1ヶ月 5キロ 痩せる' },
  { cat: '目標', seed: '1ヶ月 3キロ 痩せる' },
  { cat: '目標', seed: '3ヶ月 ダイエット 結果' },
  { cat: '目標', seed: '半年 ダイエット 結果' },
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
  if (/レシピ|食事|朝ごはん|朝食|昼食|ランチ|ディナー|夜ご飯|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|料理|食材|食べ物|飲み物|ドリンク|スイーツ|お菓子|パン|低糖質|低カロリー|高たんぱく|ヘルシー|便秘|腸内|善玉菌|むくみ|作り置き|脂肪燃焼 食|代謝 食|ファスティング|チートデイ|食べ方|食べ順|食べ痩せ|食べても|食制限|糖質制限|ケトジェニック|スムージー|青汁|MCT|ルイボス|ハーブティ|デトックス/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|有酸素|ランニング|ジョギング|ボクシング|マッサージ|骨盤|体幹|フラフープ|HIIT|水泳|縄跳び|自転車|階段|踏み台|体操/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ|セルライト|リンパ|引き締め|細くする/.test(keyword)) return 'body-part';
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
console.log(' 🌸 バルクキーワードストック 第9弾 美スリム研究所');
console.log(' ★ 全く未使用の新根キーワード群 × increaseKeyword: true');
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
  process.stdout.write(`${progress} ${cat.padEnd(7)} | "${seed}" ... `);

  try {
    const payload = {
      keyword: seed,
      modes: ['google'],
      increaseKeyword: true,
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
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 9, increaseKeyword: true });

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
