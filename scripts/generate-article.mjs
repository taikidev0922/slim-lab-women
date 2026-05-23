import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './lib/env.mjs';
import { loadConfig, todayJst } from './lib/config.mjs';
import { articlePage, escapeHtml, slugify } from './lib/html.mjs';
import { countUnusedKeywords, getCandidateKeyword, hasSupabaseConnection, insertArticle, markKeywordUsed, reserveKeyword } from './lib/supabase.mjs';
import { refreshKeywordsFromRakko } from './lib/rakko.mjs';
import { generateArticleImage } from './lib/generate-assets.mjs';

await loadEnv();

const dryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = await loadConfig();
const date = todayJst();

async function ensureKeywordPool() {
  const count = await countUnusedKeywords();
  if (count >= 10 || !process.env.RAKKO_API_KEY) return;
  const seedCount = count === 0 ? 3 : 1;
  await refreshKeywordsFromRakko(selectRefreshSeeds(seedCount));
}

function selectRefreshSeeds(count) {
  const seeds = shouldUseMindKeyword()
    ? [...(config.mindKeywords || []), ...(config.keywordSeeds || [])]
    : config.keywordSeeds || [];
  if (!seeds.length) return [];
  const start = dayOfYear(date) % seeds.length;
  return Array.from({ length: count }, (_, index) => seeds[(start + index) % seeds.length]);
}

async function chooseKeyword() {
  if (shouldUseMindKeyword()) return chooseMindKeyword();
  if (!dryRun) await ensureKeywordPool();
  const dbCandidate = await getCandidateKeyword();
  if (dbCandidate) {
    await reserveKeyword(dbCandidate.id);
    return dbCandidate.keyword;
  }
  return config.keywordSeeds[Math.floor(Math.random() * config.keywordSeeds.length)];
}

function shouldUseMindKeyword() {
  const interval = Number(config.mindPostIntervalDays || 0);
  return interval > 0 && Array.isArray(config.mindKeywords) && config.mindKeywords.length > 0 && dayOfYear(date) % interval === 0;
}

function chooseMindKeyword() {
  const keywords = config.mindKeywords;
  return keywords[dayOfYear(date) % keywords.length];
}

function dayOfYear(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const current = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 0);
  return Math.floor((current - start) / 86400000);
}

async function generateWithClaude(keyword, { useFallback = false } = {}) {
  if (useFallback || !process.env.ANTHROPIC_API_KEY) return fallbackArticle(keyword);
  const articleCategory = inferCategory(keyword);
  const focusInstruction = articleCategory === 'ダイエットマインド'
    ? '\n- 「続かない」「始められない」「やる気が出ない」心理に寄り添い、習慣化・環境づくり・小さな開始行動を中心にする\n- 根性論や自己否定を避け、食事制限や運動メニューだけの記事にしない'
    : '';
  const prompt = `あなたは日本語SEO編集者です。女性向けダイエット情報サイト「${config.siteName}」の記事を作成してください。

主キーワード: ${keyword}
条件:
- 医療的な断定、過度な減量訴求、不安を煽る表現は禁止
- categoryは「${articleCategory}」にする
- 検索意図にすぐ答える
- スマホで読みやすい短めの段落
- h2/h3を含む本文HTML
- 記事途中に <img class="article-img" src="image-02.webp" alt="..."> を1回入れる
- FAQを2問以上
- 内部リンクとして /blog/ を自然に1回入れる
- JSONのみ返す${focusInstruction}

JSON schema:
{"title":"32文字前後のSEOタイトル","description":"110文字前後のメタディスクリプション","slug":"英数字ハイフンのURL slug","category":"カテゴリ","imageAlt1":"サムネイル画像alt","imageAlt2":"本文画像alt","imagePrompt1":"gpt-image用の日本語プロンプト","imagePrompt2":"gpt-image用の日本語プロンプト","bodyHtml":"本文HTML"}`;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
      max_tokens: 5000,
      temperature: 0.55,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`Claude API error: ${JSON.stringify(json)}`);
  const text = json.content?.map((part) => part.text || '').join('\n') || '';
  return JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
}

function fallbackArticle(keyword) {
  const title = `${keyword}の始め方｜女性が無理なく続ける基本`;
  return {
    title,
    description: `${keyword}について、女性が無理なく続けるための考え方、食事や運動の整え方、失敗しやすいポイントをわかりやすく解説します。`,
    slug: slugify(keyword),
    category: inferCategory(keyword),
    imageAlt1: `${keyword}を女性向けに解説する図解`,
    imageAlt2: `${keyword}の実践ポイントをまとめた表`,
    imagePrompt1: `女性向けダイエット情報サイトの記事サムネイル。テーマは「${keyword}」。ピンク基調、清潔、スマホで見やすい、文字なし、健康的な食事と軽い運動の雰囲気。`,
    imagePrompt2: `「${keyword}」の実践ポイントを示すシンプルな図解。ピンク、ミント、白、文字なし、表やチェックリスト風、健康的で上品。`,
    bodyHtml: `<p>${escapeHtml(keyword)}で大切なのは、短期間で無理をすることではなく、毎日の生活に入れやすい形へ整えることです。</p>
<h2>${escapeHtml(keyword)}で最初に意識したいこと</h2>
<p>まずは食事量を極端に減らすより、たんぱく質、食物繊維、水分、睡眠を整えます。女性は体調の波もあるため、続けられる強度にすることが重要です。</p>
<img class="article-img" src="image-02.webp" alt="${escapeHtml(keyword)}の実践ポイントをまとめた表" width="1200" height="675" loading="lazy">
<h2>失敗しやすいポイント</h2>
<ul><li>最初から運動量を増やしすぎる</li><li>主食を完全に抜いて間食が増える</li><li>体重だけで判断して継続をやめる</li></ul>
<h2>よくある質問</h2>
<div class="faq-box"><h3>毎日やる必要はありますか？</h3><p>毎日完璧に行う必要はありません。週に数回でも、食事と活動量を整える日を増やすことが大切です。</p></div>
<div class="faq-box"><h3>停滞したらどうすればいいですか？</h3><p>睡眠、便通、間食、外食頻度を見直します。関連記事は<a href="/blog/">記事一覧</a>から探せます。</p></div>
<h2>まとめ</h2><p>${escapeHtml(keyword)}は、無理のない設計にすると続けやすくなります。小さく始めて、生活に合う形へ調整しましょう。</p>`
  };
}

function normalizeArticle(article, keyword) {
  article.slug = slugify(article.slug || keyword);
  article.category ||= inferCategory(keyword);
  article.imageAlt1 ||= `${article.title}のサムネイル`;
  article.imageAlt2 ||= `${article.title}の図解`;
  article.imagePrompt1 ||= `${article.title}。女性向けダイエットサイト用、ピンク基調、健康的、文字なし。`;
  article.imagePrompt2 ||= `${article.title}の内容を説明する図解、ピンク基調、文字なし。`;
  return article;
}

function inferCategory(keyword) {
  if (/続かない|やる気|始められない|モチベ|習慣化|挫折|三日坊主|メンタル|自分に甘い|食べてしまう|ストレス/.test(keyword)) {
    return 'ダイエットマインド';
  }
  return config.defaultCategory;
}

const keyword = await chooseKeyword();
const article = normalizeArticle(await generateWithClaude(keyword, { useFallback: dryRun }), keyword);
const dir = path.join(root, 'blog', article.slug);
const html = articlePage({ config, article, bodyHtml: article.bodyHtml, date });

if (dryRun) {
  console.log(JSON.stringify({ keyword, article: { title: article.title, slug: article.slug, description: article.description } }, null, 2));
  process.exit(0);
}

await fs.mkdir(dir, { recursive: true });
await fs.writeFile(path.join(dir, 'index.html'), html);
await generateArticleImage({ prompt: article.imagePrompt1, outFile: path.join(dir, 'image-01.webp'), fallbackTitle: article.title });
await generateArticleImage({ prompt: article.imagePrompt2, outFile: path.join(dir, 'image-02.webp'), fallbackTitle: article.title });
await updateIndexes();
if (hasSupabaseConnection()) {
  await markKeywordUsed(keyword, article.slug);
  await insertArticle({
    slug: article.slug,
    title: article.title,
    description: article.description,
    keyword,
    category: article.category,
    published_at: new Date().toISOString(),
    path: `/blog/${article.slug}/`
  });
}
console.log(`Generated /blog/${article.slug}/ for keyword: ${keyword}`);

async function updateIndexes() {
  const blogDir = path.join(root, 'blog');
  const slugs = (await fs.readdir(blogDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  const articles = [];
  for (const slug of slugs) {
    const file = path.join(blogDir, slug, 'index.html');
    try {
      const content = await fs.readFile(file, 'utf8');
      const title = content.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1]?.replace(/<[^>]+>/g, '') || slug;
      const description = content.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';
      const category = content.match(/<div class="article-meta"><span>(.*?)<\/span>/s)?.[1]?.replace(/<[^>]+>/g, '') || config.defaultCategory;
      const dateText = content.match(/<time datetime="([^"]+)"/)?.[1] || date;
      const hasWebp = await exists(path.join(blogDir, slug, 'image-01.webp'));
      const hasSvg = await exists(path.join(blogDir, slug, 'image-01.svg'));
      articles.push({ slug, title, description, category, date: dateText, image: hasWebp ? 'image-01.webp' : hasSvg ? 'image-01.svg' : 'image-01.webp' });
    } catch {}
  }
  articles.sort((a, b) => b.date.localeCompare(a.date));
  await fs.writeFile(path.join(blogDir, 'index.html'), renderBlogIndex(articles));
  await fs.writeFile(path.join(root, 'sitemap.xml'), renderSitemap(articles));
  await fs.writeFile(path.join(root, 'feed.xml'), renderFeed(articles));
}

function renderBlogIndex(articles) {
  const cards = articles.map((a) => `<article class="article-card"><a href="/blog/${a.slug}/"><img src="/blog/${a.slug}/${a.image}" alt="${escapeHtml(a.title)}" width="800" height="450" loading="lazy"><span>${escapeHtml(a.category)}</span><h2>${escapeHtml(a.title)}</h2><p>${escapeHtml(a.description)}</p></a></article>`).join('\n');
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${config.siteUrl}/blog/"><title>記事一覧 | ${config.siteName}</title><meta name="description" content="女性向けダイエット記事一覧。食事管理、宅トレ、部位別ダイエット、続けるためのマインドをわかりやすく解説します。"><meta property="og:title" content="記事一覧 | ${config.siteName}"><meta property="og:description" content="女性向けダイエット記事一覧。"><meta property="og:type" content="website"><meta property="og:url" content="${config.siteUrl}/blog/"><meta property="og:image" content="${config.siteUrl}/assets/og-default.svg"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"><link rel="stylesheet" href="/style.css"></head><body><header class="site-header" id="header"><a class="brand" href="/"><span class="brand__mark">美</span><span class="brand__text">${config.siteName}</span></a><button class="menu-button" id="menuButton" aria-label="メニュー" aria-controls="siteNav" aria-expanded="false"><span></span><span></span><span></span></button><nav class="site-nav" id="siteNav"><a href="/">ホーム</a><a href="/blog/" aria-current="page">記事一覧</a><a href="/about/">運営方針</a><a href="/contact/">お問い合わせ</a></nav></header><main><section class="page-hero"><div class="page-hero__inner"><p class="eyebrow">Blog</p><h1>記事一覧</h1><p>女性のダイエットに役立つテーマを、検索意図ごとに深く、読みやすく整理しています。</p></div></section><section class="section"><div class="article-list blog-grid">${cards}</div></section></main><footer class="site-footer"><p class="brand brand--footer"><span class="brand__mark">美</span><span class="brand__text">${config.siteName}</span></p><nav><a href="/about/">運営方針</a><a href="/blog/">記事一覧</a><a href="/contact/">お問い合わせ</a><a href="/sitemap.xml">サイトマップ</a></nav><small>&copy; 2026 ${config.siteName}</small></footer><script src="/script.js" defer></script></body></html>`;
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function renderSitemap(articles) {
  const staticUrls = ['/', '/blog/', '/about/', '/contact/'].map((url) => `  <url><loc>${config.siteUrl}${url}</loc><lastmod>${date}</lastmod><changefreq>${url === '/about/' ? 'monthly' : 'daily'}</changefreq><priority>${url === '/' ? '1.0' : '0.8'}</priority></url>`);
  const articleUrls = articles.map((a) => `  <url><loc>${config.siteUrl}/blog/${a.slug}/</loc><lastmod>${a.date}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticUrls, ...articleUrls].join('\n')}\n</urlset>\n`;
}

function renderFeed(articles) {
  const items = articles.slice(0, 30).map((a) => `<item><title>${escapeHtml(a.title)}</title><link>${config.siteUrl}/blog/${a.slug}/</link><guid>${config.siteUrl}/blog/${a.slug}/</guid><pubDate>${new Date(`${a.date}T00:00:00+09:00`).toUTCString()}</pubDate><description>${escapeHtml(a.description)}</description></item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${config.siteName}</title><link>${config.siteUrl}/</link><description>${config.description}</description><language>ja</language>${items}</channel></rss>`;
}
