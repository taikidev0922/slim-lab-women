/**
 * bulk-stock-keywords-7.mjs
 * 第7弾：第2〜5弾シードの残り全て × increaseKeyword: true
 * 第6弾でカバーしていないシードを increaseKeyword: true で再掘削
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

const SEEDS = [
  // ── 食材（第2弾残り） ─────────────────────────────────────────────────
  { cat: '食材', seed: 'キャベツ ダイエット' },
  { cat: '食材', seed: 'きのこ ダイエット' },
  { cat: '食材', seed: 'もち麦 ダイエット' },
  { cat: '食材', seed: 'ナッツ ダイエット' },
  { cat: '食材', seed: 'アボカド ダイエット' },
  { cat: '食材', seed: 'スムージー ダイエット' },
  { cat: '食材', seed: '春雨 ダイエット' },
  { cat: '食材', seed: 'ゆで卵 ダイエット' },
  { cat: '食材', seed: 'えのき ダイエット' },
  { cat: '食材', seed: 'ブロッコリー ダイエット' },
  { cat: '食材', seed: 'わかめ ダイエット' },
  { cat: '食材', seed: 'アーモンド ダイエット' },
  { cat: '食材', seed: 'もやし ダイエット' },

  // ── 飲み物（第2弾残り） ──────────────────────────────────────────────
  { cat: '飲み物', seed: 'ダイエット コーヒー' },
  { cat: '飲み物', seed: 'ダイエット お茶' },
  { cat: '飲み物', seed: 'ダイエット 炭酸水' },
  { cat: '飲み物', seed: 'ダイエット 豆乳' },
  { cat: '飲み物', seed: 'ダイエット 緑茶' },

  // ── 料理（第2弾残り） ────────────────────────────────────────────────
  { cat: '料理', seed: 'ダイエット 鍋' },
  { cat: '料理', seed: 'ダイエット おにぎり' },
  { cat: '料理', seed: 'ダイエット パスタ' },
  { cat: '料理', seed: 'ダイエット お好み焼き' },
  { cat: '料理', seed: 'ダイエット 丼' },
  { cat: '料理', seed: 'ダイエット お弁当' },
  { cat: '料理', seed: 'ダイエット 朝食' },

  // ── 食材追加（第3弾残り） ────────────────────────────────────────────
  { cat: '食材2', seed: 'しょうが ダイエット' },
  { cat: '食材2', seed: '白湯 ダイエット' },
  { cat: '食材2', seed: '梅干し ダイエット' },
  { cat: '食材2', seed: 'レモン ダイエット' },
  { cat: '食材2', seed: '甘酒 ダイエット' },
  { cat: '食材2', seed: 'りんご酢 ダイエット' },
  { cat: '食材2', seed: '黒酢 ダイエット' },
  { cat: '食材2', seed: 'ダイエット チーズ' },
  { cat: '食材2', seed: 'ダイエット 牛乳' },
  { cat: '食材2', seed: 'ダイエット 鮭' },
  { cat: '食材2', seed: 'ダイエット おやつ 手作り' },

  // ── 生活シーン（第3弾残り） ──────────────────────────────────────────
  { cat: 'シーン', seed: 'ズボラ ダイエット' },
  { cat: 'シーン', seed: 'ながら ダイエット' },
  { cat: 'シーン', seed: '一人暮らし ダイエット' },
  { cat: 'シーン', seed: 'デスクワーク ダイエット' },
  { cat: 'シーン', seed: '夜勤 ダイエット' },

  // ── 外食（第4弾残り） ────────────────────────────────────────────────
  { cat: '外食', seed: 'ダイエット 焼肉' },
  { cat: '外食', seed: 'ダイエット ラーメン' },
  { cat: '外食', seed: 'ダイエット 寿司' },
  { cat: '外食', seed: 'ダイエット 中華' },
  { cat: '外食', seed: 'ダイエット 和食' },
  { cat: '外食', seed: 'マクドナルド ダイエット' },

  // ── 体重・体型（第1弾残り） ──────────────────────────────────────────
  { cat: '体重', seed: 'ダイエット アプリ' },
  { cat: '体重', seed: 'ダイエット 睡眠' },
  { cat: '体重', seed: 'ダイエット 代謝' },
  { cat: '体重', seed: 'ダイエット 始め方' },

  // ── 痩せる系（第2弾残り） ────────────────────────────────────────────
  { cat: '痩せる', seed: '痩せる 食事' },
  { cat: '痩せる', seed: '痩せる 筋トレ' },
  { cat: '痩せる', seed: '痩せる ウォーキング' },
  { cat: '痩せる', seed: '痩せる 水' },
  { cat: '痩せる', seed: '痩せる ヨガ' },
  { cat: '痩せる', seed: '痩せる 歩き方' },
  { cat: '痩せる', seed: '痩せる 姿勢' },
  { cat: '痩せる', seed: '早く 痩せる' },

  // ── ライフステージ（第1弾残り） ──────────────────────────────────────
  { cat: 'ライフ', seed: '30代 ダイエット' },
  { cat: 'ライフ', seed: '生理前 ダイエット' },
  { cat: 'ライフ', seed: '産後 ダイエット いつから' },
  { cat: 'ライフ', seed: '授乳中 ダイエット' },

  // ── 部位別（第1弾残り） ──────────────────────────────────────────────
  { cat: '部位', seed: 'ダイエット 下腹' },
  { cat: '部位', seed: 'ダイエット 顔' },
  { cat: '部位', seed: 'ダイエット 太もも' },
  { cat: '部位', seed: 'ダイエット 二の腕' },
  { cat: '部位', seed: 'くびれ 作り方' },

  // ── 運動（第1弾残り） ────────────────────────────────────────────────
  { cat: '運動', seed: 'ダイエット ピラティス' },
  { cat: '運動', seed: 'ダイエット 踏み台' },
  { cat: '運動', seed: 'ダイエット 縄跳び' },
  { cat: '運動', seed: 'ダイエット スクワット' },
  { cat: '運動', seed: 'ダイエット 有酸素' },
  { cat: '運動', seed: 'ダイエット 水泳' },
  { cat: '運動', seed: 'ダイエット 階段' },
  { cat: '運動', seed: 'ジョギング ダイエット' },
  { cat: '運動', seed: 'ボクシング ダイエット' },
  { cat: '運動', seed: '骨盤 矯正 ダイエット' },

  // ── ヘルシー系（第5弾残り） ──────────────────────────────────────────
  { cat: 'ヘルシー', seed: '低糖質 レシピ' },
  { cat: 'ヘルシー', seed: '低糖質 スイーツ' },
  { cat: 'ヘルシー', seed: '低糖質 お菓子' },
  { cat: 'ヘルシー', seed: '糖質オフ お菓子' },
  { cat: 'ヘルシー', seed: '高たんぱく 低カロリー' },
  { cat: 'ヘルシー', seed: '腸活 食べ物' },
  { cat: 'ヘルシー', seed: '腸活 朝ごはん' },
  { cat: 'ヘルシー', seed: '美肌 食べ物' },
  { cat: 'ヘルシー', seed: '美肌 レシピ' },
  { cat: 'ヘルシー', seed: 'ヘルシー おやつ' },
  { cat: 'ヘルシー', seed: 'ヘルシー サラダ' },

  // ── マインド（第1弾残り） ────────────────────────────────────────────
  { cat: 'マインド', seed: 'ダイエット やる気' },
  { cat: 'マインド', seed: 'ダイエット 習慣' },
  { cat: 'マインド', seed: 'ダイエット ストレス' },
  { cat: 'マインド', seed: 'ダイエット 記録' },
  { cat: 'マインド', seed: '食べ過ぎ 対処法' },
  { cat: 'マインド', seed: '寝る前 ダイエット' },
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
  if (/レシピ|食事|朝ごはん|朝食|昼食|ランチ|ディナー|夜ご飯|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|料理|食材|食べ物|飲み物|ドリンク|スイーツ|お菓子|パン|低糖質|低カロリー|高たんぱく|ヘルシー|腸内|善玉菌|作り置き|白湯/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|有酸素|ランニング|ジョギング|ボクシング|骨盤|体幹|フラフープ|踏み台|縄跳び|水泳|階段|歩き方|姿勢/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス|記録|失敗|成功|ズボラ|ながら/.test(keyword)) return 'mindset';
  if (/40代|50代|30代|20代|更年期|産後|授乳|生理|PMS|妊活/.test(keyword)) return 'life-stage';
  return 'informational';
}

// ─── 実行 ────────────────────────────────────────────────────────────────────
const config = await loadConfig();
const catCounts = SEEDS.reduce((acc, s) => {
  acc[s.cat] = (acc[s.cat] || 0) + 1;
  return acc;
}, {});

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 第7弾 美スリム研究所');
console.log(' ★ increaseKeyword: true — 第2〜5弾残りシード全掘削');
console.log('═══════════════════════════════════════════════════');
console.log(`シード数: ${SEEDS.length}件`);
Object.entries(catCounts).forEach(([cat, n]) => console.log(`  ${cat}: ${n}シード`));
console.log(`最大取得数: 約 ${SEEDS.length * 40} キーワード`);
if (dryRun) console.log('⚠ DRY RUN モード');
console.log('───────────────────────────────────────────────────\n');

const beforeCount = await countUnusedKeywords();
console.log(`DB未使用キーワード (開始前): ${beforeCount}件\n`);

const apiKey = process.env.RAKKO_API_KEY;
const endpoint = 'https://api.rakkokeyword.com/v1/suggest-keywords';
let totalFetched = 0, totalStored = 0, totalCredit = 0, errors = 0;

for (let i = 0; i < SEEDS.length; i++) {
  const { cat, seed } = SEEDS[i];
  const progress = `[${String(i + 1).padStart(2, '0')}/${SEEDS.length}]`;
  process.stdout.write(`${progress} ${cat.padEnd(6)} | "${seed}" ... `);

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
      sortBy: 'searchVolume', orderBy: 'desc', limit: 40
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
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 7, increaseKeyword: true });

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
    console.log(`❌ ${err.message}`);
    errors++;
  }
  if (i < SEEDS.length - 1) await sleep(DELAY_MS);
}

const afterCount = await countUnusedKeywords();
console.log('\n═══════════════════════════════════════════════════');
console.log(` 完了 | 取得: ${totalFetched}件 → 保存: ${totalStored}件 | credit: ${totalCredit.toFixed(1)}`);
console.log(` DB未使用: ${beforeCount} → ${afterCount} (+${afterCount - beforeCount}件)`);
console.log('═══════════════════════════════════════════════════\n');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
