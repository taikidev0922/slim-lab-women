/**
 * bulk-stock-keywords-5.mjs
 * 第5弾：ヘルシー・低糖質・高たんぱく・腸活・プロテイン根キーワード全展開
 * ← 「ダイエット」以外の根で全く別のキーワードセットを獲得
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

const SEEDS = [
  // ── ヘルシー根（プローブ回収 + 派生）────────────────────────────────────
  { cat: 'ヘルシー', seed: 'ヘルシー レシピ' },
  { cat: 'ヘルシー', seed: 'ヘルシー ランチ' },
  { cat: 'ヘルシー', seed: 'ヘルシー おやつ' },
  { cat: 'ヘルシー', seed: 'ヘルシー サラダ' },
  { cat: 'ヘルシー', seed: 'ヘルシー 麺' },
  { cat: 'ヘルシー', seed: 'ヘルシー スープ' },
  { cat: 'ヘルシー', seed: 'ヘルシー お弁当' },
  { cat: 'ヘルシー', seed: 'ヘルシー 鍋' },
  { cat: 'ヘルシー', seed: 'ヘルシー 朝食' },
  { cat: 'ヘルシー', seed: 'ヘルシー 夕食' },
  { cat: 'ヘルシー', seed: 'ヘルシー 食事 メニュー' },
  { cat: 'ヘルシー', seed: 'ヘルシー スイーツ 簡単' },
  { cat: 'ヘルシー', seed: 'ヘルシー おにぎり' },
  { cat: 'ヘルシー', seed: 'ヘルシー 丼' },
  { cat: 'ヘルシー', seed: 'ヘルシー パスタ' },

  // ── 低糖質根 ─────────────────────────────────────────────────────────────
  { cat: '低糖質', seed: '低糖質 レシピ' },
  { cat: '低糖質', seed: '低糖質 パン' },
  { cat: '低糖質', seed: '低糖質 スイーツ' },
  { cat: '低糖質', seed: '低糖質 おやつ' },
  { cat: '低糖質', seed: '低糖質 食事' },
  { cat: '低糖質', seed: '低糖質 朝食' },
  { cat: '低糖質', seed: '低糖質 ランチ' },
  { cat: '低糖質', seed: '低糖質 夕食' },
  { cat: '低糖質', seed: '低糖質 間食' },
  { cat: '低糖質', seed: '低糖質 お菓子' },
  { cat: '低糖質', seed: '低糖質 ケーキ' },
  { cat: '低糖質', seed: '低糖質 クッキー' },
  { cat: '低糖質', seed: '低糖質 麺' },
  { cat: '低糖質', seed: '低糖質 ご飯 代わり' },
  { cat: '低糖質', seed: '低糖質 チョコ' },
  { cat: '低糖質', seed: '低糖質 アイス' },
  { cat: '低糖質', seed: '低糖質 ドリンク' },
  { cat: '低糖質', seed: '糖質オフ レシピ' },
  { cat: '低糖質', seed: '糖質オフ パン' },
  { cat: '低糖質', seed: '糖質オフ お菓子' },
  { cat: '低糖質', seed: 'グルテンフリー パン' },
  { cat: '低糖質', seed: 'グルテンフリー スイーツ' },
  { cat: '低糖質', seed: 'グルテンフリー レシピ' },

  // ── 高たんぱく根 ──────────────────────────────────────────────────────────
  { cat: '高たんぱく', seed: '高たんぱく レシピ' },
  { cat: '高たんぱく', seed: '高たんぱく 低カロリー' },
  { cat: '高たんぱく', seed: '高たんぱく おやつ' },
  { cat: '高たんぱく', seed: '高たんぱく 朝食' },
  { cat: '高たんぱく', seed: '高たんぱく 食事 女性' },
  { cat: '高たんぱく', seed: '高たんぱく 夕食' },
  { cat: '高たんぱく', seed: '高たんぱく スナック' },
  { cat: '高たんぱく', seed: '高たんぱく 弁当' },
  { cat: '高たんぱく', seed: '高タンパク 低脂質 食べ物' },
  { cat: '高たんぱく', seed: 'たんぱく質 多い 食べ物 女性' },

  // ── 腸活根（プローブ回収 + 派生）────────────────────────────────────────
  { cat: '腸活', seed: '腸活 レシピ' },
  { cat: '腸活', seed: '腸活 食べ物' },
  { cat: '腸活', seed: '腸活 朝ごはん' },
  { cat: '腸活', seed: '腸活 飲み物' },
  { cat: '腸活', seed: '腸活 スムージー' },
  { cat: '腸活', seed: '腸活 スープ' },
  { cat: '腸活', seed: '腸活 サラダ' },
  { cat: '腸活', seed: '腸活 ヨーグルト' },
  { cat: '腸活', seed: '腸活 納豆' },
  { cat: '腸活', seed: '腸活 みそ汁' },
  { cat: '腸活', seed: '腸活 キムチ' },
  { cat: '腸活', seed: '腸内環境 整える 食事' },
  { cat: '腸活', seed: '善玉菌 増やす 食べ物' },

  // ── プロテイン根（プローブ回収 + 派生）─────────────────────────────────
  { cat: 'プロテイン', seed: 'プロテイン 女性 おすすめ' },
  { cat: 'プロテイン', seed: '女性 サプリ おすすめ' },
  { cat: 'プロテイン', seed: 'プロテイン 種類 女性' },
  { cat: 'プロテイン', seed: 'プロテイン レシピ 女性' },
  { cat: 'プロテイン', seed: 'プロテイン スムージー 女性' },
  { cat: 'プロテイン', seed: 'プロテイン 朝食 代わり' },
  { cat: 'プロテイン', seed: 'ホエイプロテイン 女性' },
  { cat: 'プロテイン', seed: 'ソイプロテイン 女性' },
  { cat: 'プロテイン', seed: 'プロテイン 食事 量' },

  // ── 美肌・美容食根 ────────────────────────────────────────────────────────
  { cat: '美肌', seed: '美肌 レシピ' },
  { cat: '美肌', seed: '美肌 食べ物' },
  { cat: '美肌', seed: '美肌 飲み物' },
  { cat: '美肌', seed: '美肌 スムージー' },
  { cat: '美肌', seed: '美肌 朝ごはん' },
  { cat: '美肌', seed: '美肌 サラダ' },
  { cat: '美肌', seed: '美容 食事 レシピ' },
  { cat: '美肌', seed: 'コラーゲン 食べ物 レシピ' },

  // ── 便秘・むくみ根 ────────────────────────────────────────────────────────
  { cat: '便秘', seed: '便秘 解消 食べ物' },
  { cat: '便秘', seed: '便秘 解消 飲み物' },
  { cat: '便秘', seed: '便秘 解消 食事' },
  { cat: '便秘', seed: '便秘 解消 ヨーグルト' },
  { cat: '便秘', seed: 'むくみ 解消 食事' },
  { cat: '便秘', seed: 'むくみ 解消 マッサージ' },
  { cat: '便秘', seed: 'むくみ 原因 食事' },
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
  if (/レシピ|食事|朝ごはん|朝食|昼食|ランチ|ディナー|夜ご飯|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|料理|食材|食べ物|飲み物|ドリンク|スイーツ|お菓子|パン|低糖質|低カロリー|高たんぱく|ヘルシー|便秘|腸内|善玉菌|むくみ/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|有酸素|ランニング|ジョギング|ボクシング|マッサージ/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ|骨盤/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス|記録|失敗|成功|ズボラ/.test(keyword)) return 'mindset';
  if (/40代|50代|30代|20代|60代|更年期|産後|授乳|生理|PMS|妊活|妊娠|ブライダル|学生/.test(keyword)) return 'life-stage';
  return 'informational';
}

// ─── 実行 ────────────────────────────────────────────────────────────────────
const config = await loadConfig();
const catCounts = SEEDS.reduce((acc, s) => {
  acc[s.cat] = (acc[s.cat] || 0) + 1;
  return acc;
}, {});

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 第5弾 美スリム研究所');
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

    if (!response.ok || !json.result) throw new Error(JSON.stringify(json.errors || json));

    const credit = Number(json.meta?.consumedCredit || 0);
    totalCredit += credit;
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 5 });

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
