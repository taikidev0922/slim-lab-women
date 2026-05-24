/**
 * bulk-stock-keywords-13.mjs
 * 第13弾：完全新規の2語シード中心
 * ── 睡眠/食欲管理/太りやすい食べ物/日本固有食材/タイミング/
 *    食べ方詳細/体重管理/海藻・発酵細分 ──
 * increaseKeyword: true / false を需要に合わせて使い分け
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

const SEEDS = [
  // ── 睡眠 × ダイエット ────────────────────────────────────────────────
  { cat: '睡眠', seed: '睡眠 ダイエット', inc: true },
  { cat: '睡眠', seed: '睡眠 太る', inc: true },
  { cat: '睡眠', seed: '睡眠不足 食欲', inc: true },
  { cat: '睡眠', seed: '睡眠 代謝', inc: true },
  { cat: '睡眠', seed: '寝る前 食事 ダイエット', inc: true },
  { cat: '睡眠', seed: '睡眠 質 上げる', inc: true },

  // ── 食欲コントロール ──────────────────────────────────────────────────
  { cat: '食欲', seed: '食欲 抑える 方法', inc: true },
  { cat: '食欲', seed: '食欲 抑える 食べ物', inc: true },
  { cat: '食欲', seed: '食欲 コントロール', inc: true },
  { cat: '食欲', seed: '食欲 秋', inc: true },
  { cat: '食欲', seed: '過食 防ぐ', inc: true },
  { cat: '食欲', seed: 'ドカ食い 対策', inc: true },
  { cat: '食欲', seed: '夜 食欲 原因', inc: true },
  { cat: '食欲', seed: '甘いもの 食べたい 原因', inc: true },

  // ── 太る・痩せる食べ物 ────────────────────────────────────────────────
  { cat: '太る痩せる', seed: '太る 食べ物 一覧', inc: true },
  { cat: '太る痩せる', seed: '痩せる 食べ物 ランキング', inc: true },
  { cat: '太らない 食べ物', seed: '太らない 食べ物', inc: false },
  { cat: '太る痩せる', seed: 'カロリー 低い 食べ物', inc: true },
  { cat: '太る痩せる', seed: '満腹感 食べ物', inc: true },
  { cat: '太る痩せる', seed: '腹持ち いい 食べ物', inc: true },
  { cat: '太る痩せる', seed: '脂肪 燃やす 食べ物', inc: true },

  // ── 食べるタイミング・食後 ────────────────────────────────────────────
  { cat: 'タイミング', seed: '食後 運動 ダイエット', inc: true },
  { cat: 'タイミング', seed: '食前 食後 ダイエット', inc: true },
  { cat: 'タイミング', seed: '運動 前 食事 タイミング', inc: true },
  { cat: 'タイミング', seed: '筋トレ 後 食事', inc: true },
  { cat: 'タイミング', seed: '夕食 時間 ダイエット', inc: true },
  { cat: 'タイミング', seed: '朝 食欲 ない ダイエット', inc: true },

  // ── 体重・体型管理 ────────────────────────────────────────────────────
  { cat: '体重', seed: '体重 減らない 原因', inc: true },
  { cat: '体重', seed: '体重 なかなか 減らない', inc: true },
  { cat: '体重', seed: '体重 増える 原因 女性', inc: true },
  { cat: '体重', seed: '体重 管理 女性', inc: true },
  { cat: '体重', seed: '体重 計 おすすめ', inc: false },
  { cat: '体重', seed: '体重 朝 測る', inc: true },
  { cat: '体重', seed: '体組成 計 おすすめ', inc: false },

  // ── 日本固有・和食食材 ────────────────────────────────────────────────
  { cat: '和食材', seed: '梅干し ダイエット', inc: true },
  { cat: '和食材', seed: 'ひじき ダイエット', inc: true },
  { cat: '和食材', seed: '切り干し大根 ダイエット', inc: true },
  { cat: '和食材', seed: 'ところてん ダイエット', inc: true },
  { cat: '和食材', seed: '海藻 ダイエット', inc: true },
  { cat: '和食材', seed: 'あおさ ダイエット', inc: true },
  { cat: '和食材', seed: '昆布水 ダイエット', inc: true },
  { cat: '和食材', seed: 'もずく 食べ方 ダイエット', inc: true },
  { cat: '和食材', seed: '豆腐 レシピ ダイエット', inc: true },
  { cat: '和食材', seed: 'おから パウダー ダイエット', inc: true },

  // ── 酢・発酵ドリンク ─────────────────────────────────────────────────
  { cat: '酢ドリンク', seed: '酢 ダイエット 効果', inc: true },
  { cat: '酢ドリンク', seed: '黒酢 ダイエット', inc: true },
  { cat: '酢ドリンク', seed: '酢 飲み方 ダイエット', inc: true },
  { cat: '酢ドリンク', seed: '酵素ドリンク 効果', inc: true },
  { cat: '酢ドリンク', seed: '乳酸菌飲料 ダイエット', inc: true },
  { cat: '酢ドリンク', seed: 'L-92 乳酸菌 効果', inc: true },

  // ── 体質・冷え・むくみ ────────────────────────────────────────────────
  { cat: '体質', seed: '冷え性 ダイエット', inc: true },
  { cat: '体質', seed: 'むくみ ダイエット', inc: true },
  { cat: '体質', seed: '痩せ体質 作る', inc: true },
  { cat: '体質', seed: '体質 改善 食事', inc: true },
  { cat: '体質', seed: '水太り 解消', inc: true },
  { cat: '体質', seed: '下半身太り 原因 女性', inc: true },
  { cat: '体質', seed: '上半身太り 原因', inc: true },
  { cat: '体質', seed: '洋ナシ体型 ダイエット', inc: true },
  { cat: '体質', seed: 'リンゴ体型 ダイエット', inc: true },

  // ── 正しい栄養・バランス ─────────────────────────────────────────────
  { cat: '栄養バランス', seed: '栄養バランス 食事 女性', inc: true },
  { cat: '栄養バランス', seed: 'PFC バランス 女性', inc: true },
  { cat: '栄養バランス', seed: '鉄分 食べ物 女性', inc: true },
  { cat: '栄養バランス', seed: 'カルシウム 食べ物 女性', inc: true },
  { cat: '栄養バランス', seed: '食事 バランス ダイエット', inc: true },
  { cat: '栄養バランス', seed: '1日 摂取カロリー 女性', inc: true },

  // ── 特殊ダイエット手法 ────────────────────────────────────────────────
  { cat: '手法', seed: 'マクロビ ダイエット', inc: true },
  { cat: '手法', seed: 'ビーガン ダイエット', inc: true },
  { cat: '手法', seed: 'ローカーボ ダイエット', inc: true },
  { cat: '手法', seed: 'ナイトダイエット 食事', inc: true },
  { cat: '手法', seed: 'ミールプレップ 作り方', inc: true },
  { cat: '手法', seed: '食事日記 ダイエット', inc: true },
  { cat: '手法', seed: '食事記録 ダイエット', inc: true },
  { cat: '手法', seed: 'カロリー計算 ダイエット', inc: true },

  // ── 運動なし・ながらダイエット ────────────────────────────────────────
  { cat: 'ながら', seed: '運動なし ダイエット', inc: true },
  { cat: 'ながら', seed: 'ながら ダイエット 方法', inc: false },
  { cat: 'ながら', seed: '家事 ダイエット', inc: true },
  { cat: 'ながら', seed: '立って 仕事 ダイエット', inc: true },
  { cat: 'ながら', seed: '通勤 ダイエット', inc: true },
  { cat: 'ながら', seed: '歩き方 ダイエット', inc: true },
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
  if (/レシピ|食事|朝ごはん|朝食|昼食|ランチ|ディナー|夜ご飯|夕食|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|料理|食材|食べ物|飲み物|ドリンク|スイーツ|お菓子|パン|低糖質|低カロリー|高たんぱく|ヘルシー|便秘|腸内|善玉菌|むくみ 食|作り置き|脂肪燃焼|代謝 食|ファスティング|チートデイ|食べ方|食べ順|食べ痩せ|食べても|食制限|糖質制限|ケトジェニック|スムージー|青汁|MCT|ルイボス|ハーブティ|デトックス|GI値|食物繊維|腸内フローラ|痩せ菌|置き換え|和食|地中海食|時短|お弁当|一人暮らし 食|節約 食|冷凍 食|コンビニ 食|スーパー 食|白湯|野菜|ブロッコリー|キャベツ|もやし|きのこ|かぼちゃ|春雨|豆苗|発酵|甘酒|ケフィア|塩麹|ぬか漬け|酒粕|海藻|ひじき|昆布|ところてん|梅干し|切り干し|豆腐 レシピ|おから|食欲 食|過食|ドカ食い|太る 食べ|痩せる 食べ|太らない 食べ|満腹|腹持ち|脂肪 燃|酢|黒酢|酵素ドリンク|乳酸菌|PFC|摂取カロリー|マクロビ|ビーガン|ローカーボ|ナイトダイエット|ミールプレップ|食事日記|食事記録|カロリー計算/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|有酸素|ランニング|ジョギング|ボクシング|マッサージ|骨盤|体幹|フラフープ|HIIT|水泳|縄跳び|自転車|階段|踏み台|体操|ヒップアップ|ダンス|ズンバ|エアロビ|ホットヨガ|アクア|家事 ダイエット|歩き方|通勤|食後 運動|運動 前 食事|筋トレ 後/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ|セルライト|リンパ|引き締め|細くする|内臓脂肪|皮下脂肪|体脂肪|ぽっこり|小顔|顔 むくみ|体型|下半身太り|上半身太り|洋ナシ|リンゴ体型|水太り/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス 食べ|記録|失敗|成功|ズボラ|向いてない|リバウンド|停滞期|食欲 コントロール/.test(keyword)) return 'mindset';
  if (/40代|50代|30代|20代|60代|更年期|産後|授乳|生理|PMS|妊活|妊娠|ブライダル|ホルモン/.test(keyword)) return 'life-stage';
  if (/ビタミン|コラーゲン|亜鉛|美肌|肌荒れ|アンチエイジング|髪|骨密度|貧血|冷え性|マグネシウム|オメガ|葉酸|鉄分|カルシウム/.test(keyword)) return 'beauty-health';
  if (/睡眠|寝る前 食事|睡眠 代謝/.test(keyword)) return 'lifestyle';
  return 'informational';
}

// ─── 実行 ────────────────────────────────────────────────────────────────────
const config = await loadConfig();
const catCounts = SEEDS.reduce((acc, s) => {
  acc[s.cat] = (acc[s.cat] || 0) + 1;
  return acc;
}, {});

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 第13弾 美スリム研究所');
console.log(' ★ 2語シード中心：睡眠/食欲/食材/タイミング/体質/栄養/手法');
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
  process.stdout.write(`${progress} ${cat.padEnd(8)} | "${seed}" (${increaseKeyword ? 'inc' : 'dir'}) ... `);

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
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 13, increaseKeyword });

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
