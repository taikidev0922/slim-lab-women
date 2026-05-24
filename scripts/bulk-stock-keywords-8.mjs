/**
 * bulk-stock-keywords-8.mjs
 * 第8弾：第6・7弾でカバーしていない全残シード × increaseKeyword: true
 */

import { loadEnv } from './lib/env.mjs';
import { upsertKeywords, countUnusedKeywords, logUsage } from './lib/supabase.mjs';
import { loadConfig } from './lib/config.mjs';

await loadEnv();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const DELAY_MS = 1000;

const SEEDS = [
  // ── 第1弾残り（inc=true 未使用）────────────────────────────────────────
  { cat: '食事1残', seed: 'ダイエット 昼ごはん' },
  { cat: '食事1残', seed: 'ダイエット 夕食' },
  { cat: '食事1残', seed: 'ダイエット お菓子' },
  { cat: '食事1残', seed: 'ダイエット 腸活' },
  { cat: '食事1残', seed: 'ダイエット お酒' },
  { cat: '食事1残', seed: 'ダイエット 甘いもの' },
  { cat: '食事1残', seed: 'ダイエット 夜食' },
  { cat: '部位1残', seed: 'ダイエット 脚' },
  { cat: '部位1残', seed: 'ダイエット 背中' },
  { cat: '部位1残', seed: 'ダイエット ウエスト' },
  { cat: '部位1残', seed: 'ダイエット ヒップ' },
  { cat: '部位1残', seed: '下腹 引き締め' },
  { cat: '運動1残', seed: 'ダイエット 筋トレ' },
  { cat: '運動1残', seed: 'ダイエット 宅トレ' },
  { cat: '運動1残', seed: '宅トレ 女性' },
  { cat: 'マインド1残', seed: 'ダイエット メンタル' },
  { cat: 'マインド1残', seed: 'ダイエット 挫折' },
  { cat: 'マインド1残', seed: 'ダイエット 自分に甘い' },
  { cat: 'ライフ1残', seed: 'ダイエット PMS' },
  { cat: 'ライフ1残', seed: '妊活 ダイエット' },
  { cat: '体重1残', seed: 'ダイエット 短期間' },
  { cat: '体重1残', seed: 'ダイエット 基礎代謝' },

  // ── 第2弾残り（inc=true 未使用）────────────────────────────────────────
  { cat: '痩せる2残', seed: '痩せる 運動' },
  { cat: '痩せる2残', seed: '痩せる 朝ごはん' },
  { cat: '痩せる2残', seed: '痩せる 間食' },
  { cat: '痩せる2残', seed: '痩せる 生活' },
  { cat: 'イベント2残', seed: '夏 ダイエット' },
  { cat: 'イベント2残', seed: '冬 ダイエット' },
  { cat: 'イベント2残', seed: '結婚式 ダイエット' },
  { cat: 'イベント2残', seed: '健康診断 ダイエット' },
  { cat: '体調2残', seed: 'ダイエット 便秘' },
  { cat: '体調2残', seed: 'ダイエット 疲れ' },
  { cat: '体調2残', seed: 'むくみ 食事' },
  { cat: '体調2残', seed: 'ダイエット 冷え' },
  { cat: '食材2残', seed: 'チアシード ダイエット' },
  { cat: '食材2残', seed: 'グレープフルーツ ダイエット' },
  { cat: '食材2残', seed: 'きゅうり ダイエット' },
  { cat: '食材2残', seed: '鶏ささみ ダイエット' },
  { cat: '食材2残', seed: 'ダイエット ドリンク' },

  // ── 第3弾残り（inc=true 未使用）────────────────────────────────────────
  { cat: '食材3残', seed: 'にんにく ダイエット' },
  { cat: '食材3残', seed: 'お酢 ダイエット' },
  { cat: '食材3残', seed: 'おから ダイエット' },
  { cat: '食材3残', seed: '厚揚げ ダイエット' },
  { cat: '食材3残', seed: 'もずく ダイエット' },
  { cat: '食材3残', seed: '昆布 ダイエット' },
  { cat: '食材3残', seed: '枝豆 ダイエット' },
  { cat: '食材3残', seed: 'いちご ダイエット' },
  { cat: '食材3残', seed: 'みかん ダイエット' },
  { cat: '食材3残', seed: 'うどん ダイエット' },
  { cat: '食材3残', seed: 'お粥 ダイエット' },
  { cat: '食材3残', seed: '雑炊 ダイエット' },
  { cat: '食材3残', seed: 'サバ缶 ダイエット' },
  { cat: '食材3残', seed: 'ゴマ ダイエット' },
  { cat: 'シーン3残', seed: '在宅 ダイエット' },
  { cat: 'シーン3残', seed: 'テレワーク ダイエット' },
  { cat: 'シーン3残', seed: '学生 ダイエット' },
  { cat: 'リセット3残', seed: '食べ過ぎた 翌日' },
  { cat: 'リセット3残', seed: 'ダイエット 食べ過ぎた' },
  { cat: 'リセット3残', seed: '正月太り 解消' },
  { cat: '栄養3残', seed: '血糖値 ダイエット' },
  { cat: '栄養3残', seed: 'ダイエット ビタミン' },
  { cat: '栄養3残', seed: 'ダイエット 脂質' },
  { cat: '栄養3残', seed: '代謝 上げる 食べ物' },
  { cat: '運動3残', seed: 'ダイエット バランスボール' },
  { cat: '運動3残', seed: 'ダイエット 体操' },
  { cat: '運動3残', seed: 'ラジオ体操 ダイエット' },
  { cat: '運動3残', seed: 'ダイエット サウナ' },
  { cat: '運動3残', seed: '入浴 ダイエット 方法' },
  { cat: '年代3残', seed: '20代 ダイエット' },
  { cat: '年代3残', seed: '60代 ダイエット' },

  // ── 第4弾残り（inc=true 未使用）────────────────────────────────────────
  { cat: '外食4残', seed: 'ダイエット 牛丼' },
  { cat: '外食4残', seed: 'ダイエット ファミレス' },
  { cat: '食材4残', seed: 'ダイエット まぐろ' },
  { cat: '食材4残', seed: 'ダイエット えび' },
  { cat: '食材4残', seed: 'ダイエット 海苔' },
  { cat: '産後4残', seed: '産後 骨盤 ダイエット' },
  { cat: '産後4残', seed: '産後 ダイエット いつから' },
  { cat: '産後4残', seed: '妊娠中 体重管理' },
  { cat: '睡眠4残', seed: '朝活 ダイエット' },

  // ── 第5弾残り（inc=true 未使用）────────────────────────────────────────
  { cat: 'ヘルシー5残', seed: 'ヘルシー 鍋' },
  { cat: 'ヘルシー5残', seed: 'ヘルシー 丼' },
  { cat: 'ヘルシー5残', seed: 'ヘルシー 麺' },
  { cat: 'ヘルシー5残', seed: 'ヘルシー 夕食' },
  { cat: '腸活5残', seed: '腸活 スープ' },
  { cat: '腸活5残', seed: '腸活 ヨーグルト' },
  { cat: '腸活5残', seed: '腸活 みそ汁' },
  { cat: '低糖質5残', seed: '低糖質 おやつ' },
  { cat: '低糖質5残', seed: '低糖質 ケーキ' },
  { cat: '低糖質5残', seed: '糖質オフ レシピ' },
  { cat: 'プロテイン5残', seed: 'ソイプロテイン 女性' },
  { cat: 'プロテイン5残', seed: 'ホエイプロテイン 女性' },
  { cat: '便秘5残', seed: '便秘 解消 食べ物' },
  { cat: '便秘5残', seed: '便秘 解消 ヨーグルト' },
  { cat: '便秘5残', seed: 'むくみ 解消 マッサージ' },
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
  if (/レシピ|食事|朝ごはん|朝食|昼食|ランチ|ディナー|夜ご飯|献立|コンビニ|外食|間食|断食|糖質|カロリー|たんぱく質|プロテイン|腸活|スープ|サラダ|鍋|おにぎり|パスタ|カレー|弁当|丼|料理|食材|食べ物|飲み物|ドリンク|スイーツ|お菓子|パン|低糖質|低カロリー|高たんぱく|ヘルシー|腸内|善玉菌|作り置き|白湯|お酢|甘酒|味噌汁/.test(keyword)) return 'meal';
  if (/筋トレ|宅トレ|運動|ストレッチ|ヨガ|ピラティス|ウォーキング|スクワット|有酸素|ランニング|ジョギング|ボクシング|骨盤|体幹|フラフープ|踏み台|縄跳び|水泳|階段|歩き方|姿勢|体操|サウナ|入浴|マッサージ|バランスボール/.test(keyword)) return 'exercise';
  if (/下腹|脚痩せ|太もも|二の腕|お腹|背中|ウエスト|ヒップ|くびれ|顔痩せ|脚/.test(keyword)) return 'body-part';
  if (/続かない|やる気|始められない|モチベ|習慣|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス|記録|失敗|成功|ズボラ|ながら/.test(keyword)) return 'mindset';
  if (/40代|50代|30代|20代|60代|更年期|産後|授乳|生理|PMS|妊活|妊娠|ブライダル|学生/.test(keyword)) return 'life-stage';
  return 'informational';
}

// ─── 実行 ────────────────────────────────────────────────────────────────────
const config = await loadConfig();
const catGroups = {};
SEEDS.forEach(s => { const g = s.cat.replace(/\d残$/, ''); catGroups[g] = (catGroups[g] || 0) + 1; });

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🌸 バルクキーワードストック 第8弾 美スリム研究所');
console.log(' ★ 第6・7弾カバー外の全残シード × increaseKeyword: true');
console.log('═══════════════════════════════════════════════════');
console.log(`シード数: ${SEEDS.length}件`);
Object.entries(catGroups).forEach(([g, n]) => console.log(`  ${g}: ${n}シード`));
if (dryRun) console.log('⚠ DRY RUN');
console.log('───────────────────────────────────────────────────\n');

const beforeCount = await countUnusedKeywords();
console.log(`DB未使用 (開始前): ${beforeCount}件\n`);

const apiKey = process.env.RAKKO_API_KEY;
const endpoint = 'https://api.rakkokeyword.com/v1/suggest-keywords';
let totalFetched = 0, totalStored = 0, totalCredit = 0, errors = 0;

for (let i = 0; i < SEEDS.length; i++) {
  const { cat, seed } = SEEDS[i];
  const progress = `[${String(i + 1).padStart(2, '0')}/${SEEDS.length}]`;
  process.stdout.write(`${progress} ${cat.padEnd(10)} | "${seed}" ... `);

  try {
    const payload = {
      keyword: seed, modes: ['google'], increaseKeyword: true,
      filter: { seoDifficulty: { min: 0, max: 44 }, searchVolume: { min: 50, max: 8000 }, keyword: { notIncludes: config.negativeKeywords } },
      sortBy: 'searchVolume', orderBy: 'desc', limit: 40
    };
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey }, body: JSON.stringify(payload) });
    const json = await response.json();
    if (!response.ok || !json.result) throw new Error(JSON.stringify(json.errors || json));

    const credit = Number(json.meta?.consumedCredit || 0);
    totalCredit += credit;
    await logUsage('rakko', '/v1/suggest-keywords', credit, { seed, bulk: 8, increaseKeyword: true });

    const items = (json.data?.items || []).map((item) => {
      const metrics = item.metrics || {};
      const sc = scoreKeyword(item, config.negativeKeywords);
      return {
        keyword: item.keyword, source: `rakko:${seed}:inc`,
        search_volume: metrics.searchVolume, seo_difficulty: metrics.seoDifficulty,
        cpc: metrics.cpc, competition: metrics.competition, first_seen_range: metrics.firstSeenRange,
        intent: inferIntent(item.keyword), score: sc, status: sc > 0 ? 'unused' : 'rejected',
        fetched_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
    });
    const positive = items.filter(it => it.score > 0);
    totalFetched += items.length; totalStored += positive.length;
    if (!dryRun && positive.length > 0) await upsertKeywords(positive);
    console.log(`取得 ${String(items.length).padStart(2)}件 → 保存 ${String(positive.length).padStart(2)}件 ✅`);
  } catch (err) { console.log(`❌ ${err.message}`); errors++; }
  if (i < SEEDS.length - 1) await sleep(DELAY_MS);
}

const afterCount = await countUnusedKeywords();
console.log('\n═══════════════════════════════════════════════════');
console.log(` 完了 | 取得: ${totalFetched}件 → 保存: ${totalStored}件 | credit: ${totalCredit.toFixed(1)}`);
console.log(` DB未使用: ${beforeCount} → ${afterCount} (+${afterCount - beforeCount}件)`);
console.log('═══════════════════════════════════════════════════\n');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
