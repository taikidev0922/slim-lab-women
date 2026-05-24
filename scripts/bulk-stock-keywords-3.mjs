/**
 * bulk-stock-keywords-3.mjs
 * 第3弾：食材追加・生活シーン・栄養医学・グッズ・年代・運動種目・食べ過ぎリセット系
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

const SEEDS = [
  // ── 食材追加（まだ未探索の野菜・果物・発酵食品・調味料）──────────────────
  { cat: '食材追加', seed: 'しょうが ダイエット' },
  { cat: '食材追加', seed: 'にんにく ダイエット' },
  { cat: '食材追加', seed: 'お酢 ダイエット' },
  { cat: '食材追加', seed: '梅干し ダイエット' },
  { cat: '食材追加', seed: 'レモン ダイエット' },
  { cat: '食材追加', seed: '甘酒 ダイエット' },
  { cat: '食材追加', seed: 'キムチ ダイエット' },
  { cat: '食材追加', seed: '白湯 ダイエット' },
  { cat: '食材追加', seed: 'おから ダイエット' },
  { cat: '食材追加', seed: '厚揚げ ダイエット' },
  { cat: '食材追加', seed: 'もずく ダイエット' },
  { cat: '食材追加', seed: '昆布 ダイエット' },
  { cat: '食材追加', seed: '枝豆 ダイエット' },
  { cat: '食材追加', seed: 'パイナップル ダイエット' },
  { cat: '食材追加', seed: 'いちご ダイエット' },
  { cat: '食材追加', seed: 'みかん ダイエット' },
  { cat: '食材追加', seed: 'ぶどう ダイエット' },
  { cat: '食材追加', seed: 'キウイ ダイエット' },
  { cat: '食材追加', seed: 'そば ダイエット' },
  { cat: '食材追加', seed: 'うどん ダイエット' },
  { cat: '食材追加', seed: 'お粥 ダイエット' },
  { cat: '食材追加', seed: '雑炊 ダイエット' },
  { cat: '食材追加', seed: 'サバ缶 ダイエット' },
  { cat: '食材追加', seed: 'ツナ缶 ダイエット' },
  { cat: '食材追加', seed: 'ちりめんじゃこ ダイエット' },
  { cat: '食材追加', seed: 'わかめ 酢 ダイエット' },
  { cat: '食材追加', seed: 'りんご酢 効果' },
  { cat: '食材追加', seed: '黒酢 ダイエット' },
  { cat: '食材追加', seed: 'ゴマ ダイエット' },
  { cat: '食材追加', seed: '亜麻仁油 ダイエット' },
  { cat: '食材追加', seed: 'ダイエット 食べ物 おすすめ' },
  { cat: '食材追加', seed: 'ダイエット 夜 食べていいもの' },
  { cat: '食材追加', seed: 'ダイエット おやつ 手作り' },

  // ── 生活シーン・ライフスタイル ─────────────────────────────────────────
  { cat: 'シーン', seed: 'ズボラ ダイエット' },
  { cat: 'シーン', seed: 'ながら ダイエット' },
  { cat: 'シーン', seed: '在宅 ダイエット' },
  { cat: 'シーン', seed: 'テレワーク ダイエット' },
  { cat: 'シーン', seed: 'デスクワーク ダイエット' },
  { cat: 'シーン', seed: '一人暮らし ダイエット' },
  { cat: 'シーン', seed: '学生 ダイエット' },
  { cat: 'シーン', seed: '夜勤 ダイエット' },
  { cat: 'シーン', seed: '忙しい ダイエット' },
  { cat: 'シーン', seed: 'お金をかけない ダイエット' },
  { cat: 'シーン', seed: 'ダイエット 外食 チェーン' },
  { cat: 'シーン', seed: 'ダイエット 職場 昼食' },

  // ── 食べ過ぎ・リセット系（検索需要が高い）──────────────────────────────
  { cat: 'リセット', seed: '食べ過ぎ 対処法' },
  { cat: 'リセット', seed: '食べ過ぎた 翌日' },
  { cat: 'リセット', seed: 'ドカ食い 後 対処法' },
  { cat: 'リセット', seed: 'リセット ダイエット' },
  { cat: 'リセット', seed: 'ダイエット 食べ過ぎた' },
  { cat: 'リセット', seed: '正月太り 解消' },
  { cat: 'リセット', seed: '年末太り 解消' },
  { cat: 'リセット', seed: 'ダイエット 週末 食べすぎ' },
  { cat: 'リセット', seed: 'ダイエット 飲み会 後' },

  // ── 栄養学・医学隣接 ───────────────────────────────────────────────────
  { cat: '栄養', seed: '血糖値 ダイエット' },
  { cat: '栄養', seed: '腸内環境 ダイエット' },
  { cat: '栄養', seed: 'インスリン ダイエット' },
  { cat: '栄養', seed: '代謝 上げる 食べ物' },
  { cat: '栄養', seed: 'ダイエット 鉄分' },
  { cat: '栄養', seed: 'ダイエット カルシウム' },
  { cat: '栄養', seed: 'ダイエット ビタミン' },
  { cat: '栄養', seed: 'ダイエット 脂質' },
  { cat: '栄養', seed: 'ダイエット ミネラル' },
  { cat: '栄養', seed: 'グルテンフリー ダイエット' },
  { cat: '栄養', seed: 'ヴィーガン ダイエット' },
  { cat: '栄養', seed: 'マクロビ ダイエット' },
  { cat: '栄養', seed: 'GI値 食品' },
  { cat: '栄養', seed: '低GI ダイエット' },

  // ── 運動種目・グッズ追加 ──────────────────────────────────────────────
  { cat: '運動追加', seed: 'ダイエット 縄跳び' },
  { cat: '運動追加', seed: 'ダイエット 体幹トレーニング' },
  { cat: '運動追加', seed: 'ダイエット バランスボール' },
  { cat: '運動追加', seed: 'ダイエット 水泳' },
  { cat: '運動追加', seed: 'ダイエット サイクリング' },
  { cat: '運動追加', seed: 'ダイエット 階段' },
  { cat: '運動追加', seed: 'ダイエット HIIT' },
  { cat: '運動追加', seed: 'ダイエット 体操' },
  { cat: '運動追加', seed: 'ラジオ体操 ダイエット' },
  { cat: '運動追加', seed: 'ダンス ダイエット 女性' },
  { cat: '運動追加', seed: '骨盤 矯正 ダイエット' },
  { cat: '運動追加', seed: 'ダイエット 呼吸法' },
  { cat: '運動追加', seed: '入浴 ダイエット 方法' },
  { cat: '運動追加', seed: 'サウナ ダイエット 効果' },
  { cat: '運動追加', seed: 'ダイエット 歩数' },

  // ── 年代追加（未探索） ────────────────────────────────────────────────
  { cat: '年代', seed: '20代 ダイエット' },
  { cat: '年代', seed: '60代 ダイエット' },
  { cat: '年代', seed: '学生 ダイエット 女性' },

  // ── 体型・ボディイメージ系 ────────────────────────────────────────────
  { cat: '体型', seed: 'ダイエット 体型 変わる 期間' },
  { cat: '体型', seed: 'ダイエット 見た目 変わる' },
  { cat: '体型', seed: 'ダイエット 目標体重 設定' },
  { cat: '体型', seed: '理想の体型 女性 作り方' },
  { cat: '体型', seed: 'ダイエット 体重より見た目' },

  // ── ダイエット全般・記事になりやすいロングテール ────────────────────
  { cat: '全般', seed: 'ダイエット 嘘 本当' },
  { cat: '全般', seed: 'ダイエット 効果的 方法 女性' },
  { cat: '全般', seed: 'ダイエット 失敗 原因' },
  { cat: '全般', seed: 'ダイエット 成功 コツ' },
  { cat: '全般', seed: 'ダイエット 何キロ 減る 1ヶ月' },
  { cat: '全般', seed: 'ダイエット 正しい やり方' },
  { cat: '全般', seed: 'ダイエット 速い 方法' },
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
  if (/レシピ|食事|朝ごはん|朝食|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|炒め|蒸し|料理|食材|食べ物|飲み物|ドリンク/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|フラフープ|踏み台|有酸素|歩き方|姿勢|体操|HIIT|縄跳び|水泳|サイクリング|ダンス|呼吸|入浴|サウナ/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ|骨盤/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス|記録|失敗|成功|ズボラ|ながら/.test(keyword)) return 'mindset';
  if (/40代|50代|30代|20代|60代|更年期|産後|生理|PMS|妊活|学生/.test(keyword)) return 'life-stage';
  return 'informational';
}

// ─── 実行 ────────────────────────────────────────────────────────────────────
const config = await loadConfig();
const catCounts = SEEDS.reduce((acc, s) => {
  acc[s.cat] = (acc[s.cat] || 0) + 1;
  return acc;
}, {});

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 第3弾 美スリム研究所');
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
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 3 });

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
