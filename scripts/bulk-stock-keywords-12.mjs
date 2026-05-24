/**
 * bulk-stock-keywords-12.mjs
 * 第12弾：野菜・食材細分 ＋ 調理法 ＋ 夜ご飯特化 ＋ チャレンジ系
 * 第11弾追加根の false 再取得も含む
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

const SEEDS = [
  // ── 第11弾追加根を false で再取得 ────────────────────────────────────
  { cat: '時短レシピ', seed: '時短 ダイエット レシピ' },
  { cat: '時短レシピ', seed: '電子レンジ ダイエット レシピ' },
  { cat: '時短レシピ', seed: '簡単 ヘルシー レシピ' },
  { cat: '時短レシピ', seed: 'お弁当 ダイエット レシピ' },
  { cat: '時短レシピ', seed: '一人暮らし ダイエット 食事' },
  { cat: '時短レシピ', seed: '節約 ダイエット 食事' },
  { cat: '時短レシピ', seed: '作り置き ヘルシー レシピ' },
  { cat: '体型ゴール', seed: 'ぽっこりお腹 解消 食事' },
  { cat: '体型ゴール', seed: 'ぽっこりお腹 運動 女性' },
  { cat: '体型ゴール', seed: 'ヒップアップ 運動 女性' },
  { cat: '体型ゴール', seed: '産後 お腹 引き締め' },
  { cat: '体型ゴール', seed: 'くびれ 作る 筋トレ' },
  { cat: '体型ゴール', seed: '太もも 細くする 方法' },
  { cat: '季節', seed: '夏バテ 食事 回復' },
  { cat: '季節', seed: '冬太り 解消 食事' },
  { cat: '季節', seed: '正月太り ダイエット 食事' },
  { cat: 'サプリ', seed: 'コラーゲン ドリンク 効果' },
  { cat: 'サプリ', seed: '乳酸菌 サプリ 女性 おすすめ' },
  { cat: 'サプリ', seed: 'オメガ3 食べ物 ダイエット' },
  { cat: '買い物', seed: 'コンビニ ダイエット 食事 おすすめ' },
  { cat: '買い物', seed: 'コンビニ 低カロリー 食事' },
  { cat: '買い物', seed: 'コンビニ 高たんぱく おすすめ' },
  { cat: 'リカバリー', seed: '食べ過ぎた 次の日 リセット' },
  { cat: 'リカバリー', seed: 'ダイエット 失敗 原因' },
  { cat: 'リカバリー', seed: 'リバウンド 防ぐ 方法' },
  { cat: 'リカバリー', seed: '停滞期 抜ける 方法' },
  { cat: '朝食', seed: 'ダイエット 朝食 簡単' },
  { cat: '朝食', seed: '朝食 食べない ダイエット 効果' },
  { cat: '朝食', seed: 'オートミール 朝食 レシピ' },
  { cat: 'ドリンク補完', seed: '白湯 効果 ダイエット' },
  { cat: 'ドリンク補完', seed: 'りんご酢 飲み方 ダイエット' },

  // ── 野菜・食材細分（新規） ─────────────────────────────────────────────
  { cat: '野菜', seed: 'キャベツ ダイエット' },
  { cat: '野菜', seed: 'もやし ダイエット' },
  { cat: '野菜', seed: 'ブロッコリー ダイエット' },
  { cat: '野菜', seed: 'ほうれん草 ダイエット' },
  { cat: '野菜', seed: 'きのこ ダイエット' },
  { cat: '野菜', seed: 'かぼちゃ ダイエット' },
  { cat: '野菜', seed: 'セロリ ダイエット' },
  { cat: '野菜', seed: 'レタス ダイエット' },
  { cat: '野菜', seed: '春菊 ダイエット' },
  { cat: '野菜', seed: '小松菜 ダイエット' },
  { cat: '野菜', seed: '大根 ダイエット' },
  { cat: '野菜', seed: 'ごぼう ダイエット' },
  { cat: '野菜', seed: 'にんじん ダイエット' },
  { cat: '野菜', seed: 'パプリカ ダイエット' },
  { cat: '野菜', seed: 'アスパラ ダイエット' },
  { cat: '野菜', seed: '春雨 ダイエット' },
  { cat: '野菜', seed: '豆苗 ダイエット' },

  // ── タンパク質食材細分 ────────────────────────────────────────────────
  { cat: 'たんぱく食材', seed: 'サーモン レシピ ダイエット' },
  { cat: 'たんぱく食材', seed: 'ツナ ダイエット レシピ' },
  { cat: 'たんぱく食材', seed: 'さば ダイエット レシピ' },
  { cat: 'たんぱく食材', seed: 'いわし ダイエット レシピ' },
  { cat: 'たんぱく食材', seed: '鶏胸肉 レシピ 簡単 ダイエット' },
  { cat: 'たんぱく食材', seed: 'ゆで卵 ダイエット' },
  { cat: 'たんぱく食材', seed: 'ギリシャヨーグルト ダイエット' },
  { cat: 'たんぱく食材', seed: 'プロテインバー ダイエット' },
  { cat: 'たんぱく食材', seed: 'カッテージチーズ ダイエット' },

  // ── 夜ご飯・夕食特化 ──────────────────────────────────────────────────
  { cat: '夜ご飯', seed: '夜ご飯 ダイエット レシピ' },
  { cat: '夜ご飯', seed: '夕食 ダイエット メニュー' },
  { cat: '夜ご飯', seed: '夜ご飯 低カロリー レシピ' },
  { cat: '夜ご飯', seed: '夜ご飯 ヘルシー 献立' },
  { cat: '夜ご飯', seed: '糖質オフ 夕食 レシピ' },
  { cat: '夜ご飯', seed: '夜食 低カロリー おすすめ' },
  { cat: '夜ご飯', seed: '遅い夕食 ダイエット 食事' },

  // ── チャレンジ・目標達成系 ────────────────────────────────────────────
  { cat: 'チャレンジ', seed: '1週間 ダイエット チャレンジ' },
  { cat: 'チャレンジ', seed: '2週間 ダイエット 食事 メニュー' },
  { cat: 'チャレンジ', seed: '夏 までに 痩せる 方法' },
  { cat: 'チャレンジ', seed: '10キロ 痩せる 方法' },
  { cat: 'チャレンジ', seed: '5キロ 痩せる 食事' },
  { cat: 'チャレンジ', seed: '2キロ 痩せる 方法' },
  { cat: 'チャレンジ', seed: 'ダイエット 目標 設定 方法' },

  // ── 発酵・腸活補完 ────────────────────────────────────────────────────
  { cat: '発酵', seed: '甘酒 ダイエット 効果' },
  { cat: '発酵', seed: 'ケフィア ダイエット' },
  { cat: '発酵', seed: '塩麹 ダイエット レシピ' },
  { cat: '発酵', seed: 'ぬか漬け ダイエット' },
  { cat: '発酵', seed: '酒粕 ダイエット レシピ' },

  // ── スポーツ・アクティビティ ──────────────────────────────────────────
  { cat: 'アクティビティ', seed: 'ダンス ダイエット 効果' },
  { cat: 'アクティビティ', seed: 'ズンバ ダイエット 効果' },
  { cat: 'アクティビティ', seed: 'エアロビクス ダイエット' },
  { cat: 'アクティビティ', seed: 'ポールウォーキング ダイエット' },
  { cat: 'アクティビティ', seed: 'アクアビクス ダイエット' },
  { cat: 'アクティビティ', seed: 'ホットヨガ ダイエット 効果' },

  // ── ランチ・外食補完 ──────────────────────────────────────────────────
  { cat: 'ランチ外食', seed: 'ランチ ダイエット 外食 おすすめ' },
  { cat: 'ランチ外食', seed: 'サラダチキン アレンジ レシピ' },
  { cat: 'ランチ外食', seed: 'コンビニ サラダ ダイエット' },
  { cat: 'ランチ外食', seed: '定食 ダイエット おすすめ' },
  { cat: 'ランチ外食', seed: 'ランチ 低カロリー 外食' },
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
  if (/レシピ|食事|朝ごはん|朝食|昼食|ランチ|ディナー|夜ご飯|夕食|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|料理|食材|食べ物|飲み物|ドリンク|スイーツ|お菓子|パン|低糖質|低カロリー|高たんぱく|ヘルシー|便秘|腸内|善玉菌|むくみ 食|作り置き|脂肪燃焼|代謝 食|ファスティング|チートデイ|食べ方|食べ順|食べ痩せ|食べても|食制限|糖質制限|ケトジェニック|スムージー|青汁|MCT|ルイボス|ハーブティ|デトックス|GI値|食物繊維|腸内フローラ|痩せ菌|置き換え|和食|地中海食|時短|お弁当|一人暮らし 食|節約 食|冷凍 食|コンビニ 食|スーパー 食|白湯|野菜|ブロッコリー|キャベツ|もやし|きのこ|かぼちゃ|春雨|豆苗|発酵|甘酒|ケフィア|塩麹|ぬか漬け|酒粕|サーモン|ツナ|さば|いわし|ゆで卵|ギリシャ|カッテージ|プロテインバー/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|有酸素|ランニング|ジョギング|ボクシング|マッサージ|骨盤|体幹|フラフープ|HIIT|水泳|縄跳び|自転車|階段|踏み台|体操|ヒップアップ|ダンス|ズンバ|エアロビ|ホットヨガ|アクア/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ|セルライト|リンパ|引き締め|細くする|内臓脂肪|皮下脂肪|体脂肪|ぽっこり|小顔|顔 むくみ|体型/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス 食べ|記録|失敗|成功|ズボラ|向いてない|リバウンド|停滞期/.test(keyword)) return 'mindset';
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

// 第11弾追加根の再取得は false、その他の新規は true
const rerunCats = ['時短レシピ','体型ゴール','季節','サプリ','買い物','リカバリー','朝食','ドリンク補完'];

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 第12弾 美スリム研究所');
console.log(' ★ 野菜/食材細分/夜ご飯/チャレンジ/発酵/アクティビティ');
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
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 12, increaseKeyword });

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
