/**
 * bulk-stock-keywords-14.mjs
 * 第14弾：低カロリー根 ＋ 痩せる習慣 ＋ 水・飲み物補完 ＋ 特定料理カロリー
 * ── 単語根を変えることで新しいキーワード群を獲得 ──
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

const SEEDS = [
  // ── 低カロリー根（新根） ──────────────────────────────────────────────
  { cat: '低カロリー', seed: '低カロリー 朝食', inc: true },
  { cat: '低カロリー', seed: '低カロリー ランチ', inc: true },
  { cat: '低カロリー', seed: '低カロリー 夕食', inc: true },
  { cat: '低カロリー', seed: '低カロリー 間食', inc: true },
  { cat: '低カロリー', seed: '低カロリー おやつ', inc: true },
  { cat: '低カロリー', seed: '低カロリー 丼', inc: true },
  { cat: '低カロリー', seed: '低カロリー パスタ', inc: true },
  { cat: '低カロリー', seed: '低カロリー ランチ 外食', inc: false },
  { cat: '低カロリー', seed: '低カロリー 麺', inc: true },
  { cat: '低カロリー', seed: '低カロリー お菓子', inc: true },
  { cat: '低カロリー', seed: '低カロリー チョコ', inc: true },
  { cat: '低カロリー', seed: '低カロリー ケーキ', inc: true },
  { cat: '低カロリー', seed: '低カロリー アイス', inc: true },
  { cat: '低カロリー', seed: '低カロリー 鍋', inc: true },
  { cat: '低カロリー', seed: '低カロリー スープ', inc: true },

  // ── 痩せる習慣・コツ ─────────────────────────────────────────────────
  { cat: '痩せ習慣', seed: '痩せる 習慣', inc: true },
  { cat: '痩せ習慣', seed: '痩せる コツ 女性', inc: true },
  { cat: '痩せ習慣', seed: '痩せる 食べ方', inc: true },
  { cat: '痩せ習慣', seed: '痩せる タイミング', inc: true },
  { cat: '痩せ習慣', seed: '自然 痩せる 方法', inc: true },
  { cat: '痩せ習慣', seed: '勝手に 痩せる 方法', inc: true },
  { cat: '痩せ習慣', seed: '痩せ体質 食事 習慣', inc: true },
  { cat: '痩せ習慣', seed: 'ダイエット いつから 効果', inc: true },
  { cat: '痩せ習慣', seed: 'ダイエット 何から 始める', inc: true },

  // ── 水・飲み物補完 ────────────────────────────────────────────────────
  { cat: '水分', seed: '水 1日 量 ダイエット', inc: true },
  { cat: '水分', seed: '水 飲む ダイエット 量', inc: true },
  { cat: '水分', seed: '炭酸水 ダイエット', inc: true },
  { cat: '水分', seed: '炭酸水 効果 ダイエット', inc: false },
  { cat: '水分', seed: 'ノンカフェイン 飲み物 ダイエット', inc: true },
  { cat: '水分', seed: '水分 補給 ダイエット', inc: true },
  { cat: '水分', seed: 'プロテイン ドリンク 女性', inc: false },
  { cat: '水分', seed: 'ダイエット 飲み物 効果', inc: false },

  // ── 特定料理・外食カロリー ────────────────────────────────────────────
  { cat: 'カロリー', seed: 'ラーメン カロリー ダイエット', inc: true },
  { cat: 'カロリー', seed: '寿司 カロリー ダイエット', inc: true },
  { cat: 'カロリー', seed: '焼肉 ダイエット カロリー', inc: true },
  { cat: 'カロリー', seed: '揚げ物 ダイエット 食べ方', inc: true },
  { cat: 'カロリー', seed: '丼 カロリー 低い', inc: true },
  { cat: 'カロリー', seed: 'パン カロリー ダイエット', inc: false },
  { cat: 'カロリー', seed: 'お米 カロリー 量', inc: false },
  { cat: 'カロリー', seed: 'アルコール カロリー ダイエット', inc: true },
  { cat: 'カロリー', seed: 'ビール カロリー ダイエット', inc: false },
  { cat: 'カロリー', seed: 'チョコ カロリー ダイエット', inc: false },

  // ── 腸・便通・デトックス補完 ──────────────────────────────────────────
  { cat: 'デトックス', seed: 'デトックス 食事', inc: true },
  { cat: 'デトックス', seed: 'デトックス スープ レシピ', inc: true },
  { cat: 'デトックス', seed: '腸 掃除 食事', inc: true },
  { cat: 'デトックス', seed: 'クレンズ 食事', inc: true },
  { cat: 'デトックス', seed: 'むくみ デトックス', inc: true },

  // ── 女性 特有 ────────────────────────────────────────────────────────
  { cat: '女性特有', seed: '女性 ダイエット 方法 科学的', inc: true },
  { cat: '女性特有', seed: '女性 脂肪 つきやすい 場所', inc: true },
  { cat: '女性特有', seed: '女性 筋肉量 増やす', inc: true },
  { cat: '女性特有', seed: '女性 体脂肪 理想', inc: true },
  { cat: '女性特有', seed: '女性 痩せすぎ 危険', inc: true },
  { cat: '女性特有', seed: '健康的 ダイエット 女性', inc: true },
  { cat: '女性特有', seed: 'ダイエット 肌 荒れない', inc: true },

  // ── ウェルネス・マインドフルネス ─────────────────────────────────────
  { cat: 'ウェルネス', seed: 'マインドフルネス 食事', inc: true },
  { cat: 'ウェルネス', seed: '直感的 食事 ダイエット', inc: true },
  { cat: 'ウェルネス', seed: 'ボディポジティブ ダイエット', inc: true },
  { cat: 'ウェルネス', seed: '自分を好きになる ダイエット', inc: true },
  { cat: 'ウェルネス', seed: '楽しい ダイエット 方法', inc: true },
  { cat: 'ウェルネス', seed: 'ストレスなし ダイエット', inc: true },

  // ── 産後・育児期補完 ────────────────────────────────────────────────
  { cat: '産後補完', seed: '産後 運動 おすすめ', inc: true },
  { cat: '産後補完', seed: '育児 ながら 運動', inc: true },
  { cat: '産後補完', seed: '産後 体型 戻す 方法', inc: true },
  { cat: '産後補完', seed: '産後 食事 管理', inc: true },

  // ── レシピ系・料理法補完 ──────────────────────────────────────────────
  { cat: 'レシピ補完', seed: 'ダイエット 鍋 レシピ', inc: false },
  { cat: 'レシピ補完', seed: 'ダイエット 炒め物 レシピ', inc: true },
  { cat: 'レシピ補完', seed: '蒸し料理 ダイエット', inc: true },
  { cat: 'レシピ補完', seed: 'ダイエット サラダ アレンジ', inc: true },
  { cat: 'レシピ補完', seed: 'ダイエット スムージー 朝', inc: false },
  { cat: 'レシピ補完', seed: 'プロテインパンケーキ レシピ', inc: true },
  { cat: 'レシピ補完', seed: 'ダイエット チキン レシピ', inc: true },
  { cat: 'レシピ補完', seed: 'ダイエット 豚肉 レシピ', inc: true },
  { cat: 'レシピ補完', seed: 'ダイエット 豆腐 レシピ', inc: true },
  { cat: 'レシピ補完', seed: 'ダイエット お菓子 手作り', inc: true },
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
  if (/レシピ|食事|朝ごはん|朝食|昼食|ランチ|ディナー|夜ご飯|夕食|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|料理|食材|食べ物|飲み物|ドリンク|スイーツ|お菓子|パン|低糖質|低カロリー|高たんぱく|ヘルシー|便秘|腸内|善玉菌|むくみ 食|作り置き|脂肪燃焼|代謝 食|ファスティング|チートデイ|食べ方|食べ痩せ|食べても|食制限|糖質制限|ケトジェニック|スムージー|青汁|MCT|デトックス|GI値|食物繊維|腸内フローラ|置き換え|和食|海藻|発酵|酢|アルコール|ビール|チョコ|ラーメン|寿司|焼肉|揚げ物|お米|水 1日|炭酸水|クレンズ|腸 掃除|炒め物|蒸し料理|プロテインパンケーキ|チキン レシピ|豚肉 レシピ|豆腐 レシピ|お菓子 手作り|マインドフルネス 食|産後 食事/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|有酸素|ランニング|ジョギング|ボクシング|マッサージ|骨盤|体幹|フラフープ|HIIT|水泳|縄跳び|自転車|階段|踏み台|体操|ヒップアップ|ダンス|ズンバ|エアロビ|ホットヨガ|アクア|産後 運動|育児 ながら 運動/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ|セルライト|リンパ|引き締め|細くする|内臓脂肪|皮下脂肪|体脂肪|ぽっこり|小顔|体型|下半身太り|上半身太り|女性 脂肪 つきやすい/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス|記録|失敗|成功|ズボラ|向いてない|リバウンド|停滞期|食欲 コントロール|楽しい ダイエット|ストレスなし|ボディポジティブ|自分を好きに/.test(keyword)) return 'mindset';
  if (/40代|50代|30代|20代|60代|更年期|産後|授乳|生理|PMS|妊活|妊娠|ブライダル|ホルモン/.test(keyword)) return 'life-stage';
  if (/ビタミン|コラーゲン|亜鉛|美肌|肌荒れ|アンチエイジング|髪|骨密度|貧血|冷え性|マグネシウム|オメガ|葉酸|鉄分|カルシウム/.test(keyword)) return 'beauty-health';
  return 'informational';
}

// ─── 実行 ────────────────────────────────────────────────────────────────────
const config = await loadConfig();
const catCounts = SEEDS.reduce((acc, s) => {
  acc[s.cat] = (acc[s.cat] || 0) + 1;
  return acc;
}, {});

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 第14弾 美スリム研究所');
console.log(' ★ 低カロリー根/痩せ習慣/水分/カロリー/デトックス/レシピ補完');
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
  const { cat, seed, inc } = SEEDS[i];
  const increaseKeyword = inc;
  const progress = `[${String(i + 1).padStart(2, '0')}/${SEEDS.length}]`;
  process.stdout.write(`${progress} ${cat.padEnd(9)} | "${seed}" (${increaseKeyword ? 'inc' : 'dir'}) ... `);

  try {
    const payload = {
      keyword: seed,
      modes: ['google'],
      increaseKeyword,
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
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 14, increaseKeyword });

    const items = (json.data?.items || []).map((item) => {
      const metrics = item.metrics || {};
      const sc = scoreKeyword(item, config.negativeKeywords);
      return {
        keyword: item.keyword,
        source: `rakko:${seed}:${increaseKeyword ? 'inc' : 'dir'}`,
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
