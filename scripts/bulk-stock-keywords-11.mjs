/**
 * bulk-stock-keywords-11.mjs
 * 第11弾：第10弾追加新根を false で再取得 ＋ さらに新しいカテゴリ
 * ── 時短レシピ / 体型目標 / 季節 / サプリ / 買い物 / 特定悩み ──
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

const SEEDS = [
  // ── 第10弾追加新根を increaseKeyword: false で再取得 ───────────────────
  { cat: '女性健康', seed: 'ホルモン バランス 食事' },
  { cat: '女性健康', seed: '更年期 食事 レシピ' },
  { cat: '女性健康', seed: '生理 食事 貧血' },
  { cat: '女性健康', seed: '貧血 食事 女性' },
  { cat: '女性健康', seed: '冷え性 食事 温める' },
  { cat: '女性健康', seed: '骨密度 上げる 食事' },
  { cat: '女性健康', seed: 'PMS 食事 改善' },
  { cat: '女性健康', seed: 'ストレス 食べ過ぎ 対策' },
  { cat: '美容インナー', seed: 'ビタミンC 食べ物' },
  { cat: '美容インナー', seed: '美肌 ビタミン 食事' },
  { cat: '美容インナー', seed: 'コラーゲン 増やす 食事' },
  { cat: '美容インナー', seed: '亜鉛 食べ物 女性' },
  { cat: '美容インナー', seed: 'アンチエイジング 食事' },
  { cat: '美容インナー', seed: '髪 食事 栄養' },
  { cat: '美容インナー', seed: '肌荒れ 食事 改善' },
  { cat: 'ライフスタイル', seed: '朝 運動 ダイエット' },
  { cat: 'ライフスタイル', seed: '寝る前 ストレッチ ダイエット' },
  { cat: 'ライフスタイル', seed: 'デスクワーク ダイエット' },
  { cat: 'ライフスタイル', seed: '忙しい ダイエット 食事' },
  { cat: 'ライフスタイル', seed: '週3 運動 ダイエット' },
  { cat: 'ライフスタイル', seed: 'ダイエット 記録 方法' },
  { cat: 'ステージ', seed: '30代 ダイエット 食事' },
  { cat: 'ステージ', seed: '30代 代謝 落ちた' },
  { cat: 'ステージ', seed: '30代 筋トレ 女性' },
  { cat: 'ステージ', seed: '産後 痩せない 原因' },
  { cat: 'ステージ', seed: '授乳中 ダイエット 食事' },
  { cat: 'ステージ', seed: 'ブライダル ダイエット 食事' },
  { cat: 'ダイエット法', seed: '置き換えダイエット シェイク' },
  { cat: 'ダイエット法', seed: '置き換えダイエット 食事' },
  { cat: 'ダイエット法', seed: 'プチ断食 やり方' },
  { cat: 'ダイエット法', seed: '和食 ダイエット' },
  { cat: 'ダイエット法', seed: '食物繊維 食べ物 多い' },
  { cat: 'ダイエット法', seed: 'GI値 低い 食べ物' },
  { cat: 'ダイエット法', seed: '腸内フローラ 食事' },
  { cat: 'ダイエット法', seed: '痩せ菌 増やす 食事' },

  // ── 全く新しいカテゴリ ────────────────────────────────────────────────
  // 時短・簡単レシピ
  { cat: '時短レシピ', seed: '時短 ダイエット レシピ' },
  { cat: '時短レシピ', seed: '電子レンジ ダイエット レシピ' },
  { cat: '時短レシピ', seed: '簡単 ヘルシー レシピ' },
  { cat: '時短レシピ', seed: 'お弁当 ダイエット レシピ' },
  { cat: '時短レシピ', seed: '一人暮らし ダイエット 食事' },
  { cat: '時短レシピ', seed: '節約 ダイエット 食事' },
  { cat: '時短レシピ', seed: '作り置き ヘルシー レシピ' },
  { cat: '時短レシピ', seed: '冷凍 ダイエット 食品' },

  // 体型・部位ゴール
  { cat: '体型ゴール', seed: 'ぽっこりお腹 解消 食事' },
  { cat: '体型ゴール', seed: 'ぽっこりお腹 運動 女性' },
  { cat: '体型ゴール', seed: 'ヒップアップ 運動 女性' },
  { cat: '体型ゴール', seed: '小顔 ダイエット 方法' },
  { cat: '体型ゴール', seed: '顔 むくみ 解消 食事' },
  { cat: '体型ゴール', seed: '産後 お腹 引き締め' },
  { cat: '体型ゴール', seed: 'くびれ 作る 筋トレ' },
  { cat: '体型ゴール', seed: '下腹ぽっこり 原因 女性' },
  { cat: '体型ゴール', seed: '太もも 細くする 方法' },

  // 季節・イベント
  { cat: '季節', seed: '夏バテ 食事 回復' },
  { cat: '季節', seed: '冬太り 解消 食事' },
  { cat: '季節', seed: '年末年始 太った 解消' },
  { cat: '季節', seed: '正月太り ダイエット 食事' },
  { cat: '季節', seed: '梅雨 ダイエット むくみ' },
  { cat: '季節', seed: '秋 ダイエット 食欲' },

  // サプリ・機能性食品
  { cat: 'サプリ', seed: 'コラーゲン ドリンク 効果' },
  { cat: 'サプリ', seed: '乳酸菌 サプリ 女性 おすすめ' },
  { cat: 'サプリ', seed: 'マグネシウム 食べ物 女性' },
  { cat: 'サプリ', seed: 'ビタミンD 食べ物' },
  { cat: 'サプリ', seed: 'オメガ3 食べ物 ダイエット' },
  { cat: 'サプリ', seed: '葉酸 食べ物 妊活' },

  // 買い物・食材選び
  { cat: '買い物', seed: 'コンビニ ダイエット 食事 おすすめ' },
  { cat: '買い物', seed: 'スーパー ダイエット 食材 選び方' },
  { cat: '買い物', seed: 'コンビニ 低カロリー 食事' },
  { cat: '買い物', seed: 'コンビニ 高たんぱく おすすめ' },
  { cat: '買い物', seed: 'カルディ ダイエット 食品' },

  // 特定悩み・リカバリー
  { cat: 'リカバリー', seed: '食べ過ぎた 次の日 リセット' },
  { cat: 'リカバリー', seed: 'ダイエット 失敗 原因' },
  { cat: 'リカバリー', seed: 'リバウンド 防ぐ 方法' },
  { cat: 'リカバリー', seed: '停滞期 抜ける 方法' },
  { cat: 'リカバリー', seed: '停滞期 食事 改善' },
  { cat: 'リカバリー', seed: 'ダイエット 向いてない 体質' },

  // 朝食・モーニングルーティン特化
  { cat: '朝食', seed: 'ダイエット 朝食 簡単' },
  { cat: '朝食', seed: '朝食 食べない ダイエット 効果' },
  { cat: '朝食', seed: '朝食 置き換え ダイエット' },
  { cat: '朝食', seed: 'プロテイン 朝食 置き換え' },
  { cat: '朝食', seed: 'バナナ 朝食 ダイエット' },
  { cat: '朝食', seed: 'オートミール 朝食 レシピ' },

  // ドリンク補完
  { cat: 'ドリンク補完', seed: 'ダイエット 水 飲み方' },
  { cat: 'ドリンク補完', seed: '白湯 効果 ダイエット' },
  { cat: 'ドリンク補完', seed: 'プロテイン 飲み方 女性' },
  { cat: 'ドリンク補完', seed: '豆乳 効果 ダイエット' },
  { cat: 'ドリンク補完', seed: 'りんご酢 飲み方 ダイエット' },
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
  if (/レシピ|食事|朝ごはん|朝食|昼食|ランチ|ディナー|夜ご飯|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|料理|食材|食べ物|飲み物|ドリンク|スイーツ|お菓子|パン|低糖質|低カロリー|高たんぱく|ヘルシー|便秘|腸内|善玉菌|むくみ 食|作り置き|脂肪燃焼|代謝 食|ファスティング|チートデイ|食べ方|食べ順|食べ痩せ|食べても|食制限|糖質制限|ケトジェニック|スムージー|青汁|MCT|ルイボス|ハーブティ|デトックス|GI値|食物繊維|腸内フローラ|痩せ菌|置き換え|和食|地中海食|時短|お弁当|一人暮らし 食|節約 食|冷凍 食|コンビニ 食|スーパー 食|白湯|買い物|食品選/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|有酸素|ランニング|ジョギング|ボクシング|マッサージ|骨盤|体幹|フラフープ|HIIT|水泳|縄跳び|自転車|階段|踏み台|体操|ヒップアップ/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ|セルライト|リンパ|引き締め|細くする|内臓脂肪|皮下脂肪|体脂肪|ぽっこり|小顔|顔 むくみ|体型/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス 食べ|記録|失敗|成功|ズボラ|向いてない/.test(keyword)) return 'mindset';
  if (/40代|50代|30代|20代|60代|更年期|産後|授乳|生理|PMS|妊活|妊娠|ブライダル|ホルモン/.test(keyword)) return 'life-stage';
  if (/ビタミン|コラーゲン|亜鉛|美肌|肌荒れ|アンチエイジング|髪|骨密度|貧血|冷え性|マグネシウム|オメガ|葉酸/.test(keyword)) return 'beauty-health';
  return 'informational';
}

// ─── 実行 ────────────────────────────────────────────────────────────────────
const config = await loadConfig();
const catCounts = SEEDS.reduce((acc, s) => {
  acc[s.cat] = (acc[s.cat] || 0) + 1;
  return acc;
}, {});

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 第11弾 美スリム研究所');
console.log(' ★ 第10弾追加根(false) + 時短/体型/季節/サプリ/買い物/朝食');
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
  // 第10弾再取得組は false / 新規追加は true
  const rerunCats = ['女性健康','美容インナー','ライフスタイル','ステージ','ダイエット法'];
  const increaseKeyword = rerunCats.includes(cat) ? false : true;
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
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 11, increaseKeyword });

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
