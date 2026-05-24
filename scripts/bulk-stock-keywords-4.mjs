/**
 * bulk-stock-keywords-4.mjs
 * 第4弾：プローブヒット回収 + 外食チェーン・飲食店・食事シーン・ランニング系・睡眠系
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

const SEEDS = [
  // ── プローブで発見・未保存のヒット ──────────────────────────────────────
  { cat: '回収', seed: 'ランニング ダイエット' },
  { cat: '回収', seed: 'ジョギング ダイエット' },
  { cat: '回収', seed: 'ボクシング ダイエット' },
  { cat: '回収', seed: 'ダイエット ランチ' },
  { cat: '回収', seed: 'ダイエット 夜ご飯' },
  { cat: '回収', seed: 'ダイエット ディナー' },
  { cat: '回収', seed: 'ダイエット おつまみ' },
  { cat: '回収', seed: 'ブライダル ダイエット' },
  { cat: '回収', seed: 'フォームローラー ダイエット' },
  { cat: '回収', seed: '授乳中 ダイエット' },
  { cat: '回収', seed: '産後 お腹 引き締め' },
  { cat: '回収', seed: '焼酎 ダイエット' },
  { cat: '回収', seed: '寝る前 ダイエット' },
  { cat: '回収', seed: '食べ方 ダイエット' },
  { cat: '回収', seed: 'よく噛む ダイエット' },
  { cat: '回収', seed: '食べ過ぎ 対処法' },

  // ── 外食チェーン・飲食店系 ────────────────────────────────────────────
  { cat: '外食', seed: 'ダイエット 和食' },
  { cat: '外食', seed: 'ダイエット 洋食' },
  { cat: '外食', seed: 'ダイエット 中華' },
  { cat: '外食', seed: 'ダイエット 居酒屋' },
  { cat: '外食', seed: 'ダイエット 焼肉' },
  { cat: '外食', seed: 'ダイエット ラーメン' },
  { cat: '外食', seed: 'ダイエット 定食' },
  { cat: '外食', seed: 'ダイエット ファストフード' },
  { cat: '外食', seed: 'ダイエット ファミレス' },
  { cat: '外食', seed: 'ダイエット 牛丼' },
  { cat: '外食', seed: 'ダイエット 寿司' },
  { cat: '外食', seed: 'ダイエット うどん 外食' },
  { cat: '外食', seed: 'マクドナルド ダイエット' },
  { cat: '外食', seed: 'コンビニ 夜食 ダイエット' },
  { cat: '外食', seed: 'コンビニ サラダ ダイエット' },

  // ── 食材追加・タンパク質系 ────────────────────────────────────────────
  { cat: '食材2', seed: 'ダイエット 卵 食べ方' },
  { cat: '食材2', seed: 'ダイエット 豚肉 料理' },
  { cat: '食材2', seed: 'ダイエット 牛肉 部位' },
  { cat: '食材2', seed: 'ダイエット 魚 おすすめ' },
  { cat: '食材2', seed: 'ダイエット 海苔' },
  { cat: '食材2', seed: 'ダイエット 牛乳' },
  { cat: '食材2', seed: 'ダイエット チーズ' },
  { cat: '食材2', seed: 'ダイエット 鮭' },
  { cat: '食材2', seed: 'ダイエット まぐろ' },
  { cat: '食材2', seed: 'ダイエット えび' },
  { cat: '食材2', seed: 'ダイエット わかめ スープ' },
  { cat: '食材2', seed: 'プロテインバー ダイエット' },
  { cat: '食材2', seed: 'ミールプレップ ダイエット' },

  // ── 睡眠・時間帯・リズム系 ────────────────────────────────────────────
  { cat: '睡眠', seed: '睡眠 ダイエット 効果' },
  { cat: '睡眠', seed: '睡眠不足 ダイエット 影響' },
  { cat: '睡眠', seed: '朝活 ダイエット' },
  { cat: '睡眠', seed: '夜型 ダイエット' },
  { cat: '睡眠', seed: 'ダイエット 朝 習慣' },

  // ── 産後・授乳・ライフステージ追加 ────────────────────────────────────
  { cat: '産後', seed: '産後 ダイエット いつから' },
  { cat: '産後', seed: '産後 体型 戻す 方法' },
  { cat: '産後 ', seed: '産後 骨盤 ダイエット' },
  { cat: '産後', seed: '授乳 カロリー 消費' },
  { cat: '産後', seed: '妊娠中 体重管理' },

  // ── 体型・ビジュアル系 ────────────────────────────────────────────────
  { cat: '体型', seed: '体型 変える 方法 女性' },
  { cat: '体型', seed: '細見え コーデ 方法' },
  { cat: '体型', seed: 'ウエスト 測り方 ダイエット' },
  { cat: '体型', seed: 'バスト サイズ ダイエット' },

  // ── チャレンジ・モチベ系 ──────────────────────────────────────────────
  { cat: 'チャレンジ', seed: 'ダイエット チャレンジ 方法' },
  { cat: 'チャレンジ', seed: 'ダイエット 1週間 プログラム' },
  { cat: 'チャレンジ', seed: 'ダイエット 1ヶ月 計画' },
  { cat: 'チャレンジ', seed: 'ダイエット 2週間 方法' },
  { cat: 'チャレンジ', seed: 'ダイエット 目標 立て方' },
  { cat: 'チャレンジ', seed: 'ダイエット 仲間 見つける' },
  { cat: 'チャレンジ', seed: 'ダイエット インスタ 記録' },
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
  if (/レシピ|食事|朝ごはん|朝食|昼食|ランチ|ディナー|夜ご飯|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|炒め|蒸し|料理|食材|食べ物|飲み物|ドリンク|レストラン|居酒屋|和食|洋食|中華/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|フラフープ|踏み台|有酸素|歩き方|姿勢|体操|HIIT|縄跳び|水泳|サイクリング|ダンス|呼吸|入浴|サウナ|ランニング|ジョギング|ボクシング/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ|骨盤|内もも/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス|記録|失敗|成功|ズボラ|ながら|チャレンジ/.test(keyword)) return 'mindset';
  if (/40代|50代|30代|20代|60代|更年期|産後|授乳|生理|PMS|妊活|妊娠|ブライダル|学生/.test(keyword)) return 'life-stage';
  return 'informational';
}

// ─── 実行 ────────────────────────────────────────────────────────────────────
const config = await loadConfig();
const catCounts = SEEDS.reduce((acc, s) => {
  acc[s.cat.trim()] = (acc[s.cat.trim()] || 0) + 1;
  return acc;
}, {});

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 第4弾 美スリム研究所');
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
  process.stdout.write(`${progress} ${cat.trim().padEnd(8)} | "${seed}" ... `);

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
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 4 });

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
