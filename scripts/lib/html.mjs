export const ANALYTICS_TAG = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-04JT4WBLQB"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-04JT4WBLQB');</script>`;

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function slugify(input) {
  const normalizedInput = keywordToSlugBase(String(input));
  const slug = normalizedInput
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 72)
    .replace(/^-|-$/g, '');
  if (slug && !/^\d+$/.test(slug) && slug.length >= 6) return slug;
  return `diet-${Buffer.from(String(input)).toString('hex').slice(0, 18)}`;
}

function keywordToSlugBase(input) {
  const dictionary = [
    ['ダイエットレシピ', 'diet recipe'],
    ['ダイエット献立', 'diet meal plan'],
    ['ダイエットメニュー', 'diet menu'],
    ['ダイエット 食事メニュー', 'diet meal menu'],
    ['ダイエット', 'diet'],
    ['朝ごはん', 'breakfast'],
    ['1週間分', 'one week'],
    ['1週間', 'one week'],
    ['朝昼晩', 'breakfast lunch dinner'],
    ['作り置き', 'meal prep'],
    ['簡単', 'easy'],
    ['女性', 'women'],
    ['下腹', 'lower belly'],
    ['脚痩せ', 'slim legs'],
    ['二の腕', 'upper arms'],
    ['宅トレ', 'home workout'],
    ['初心者', 'beginner'],
    ['続かない', 'keep going'],
    ['やる気', 'motivation'],
    ['始められない', 'getting started'],
    ['習慣化', 'habit building'],
    ['挫折', 'setback'],
    ['産後', 'postpartum'],
    ['更年期', 'menopause'],
    ['食事', 'meal'],
    ['レシピ', 'recipe'],
    ['献立', 'meal plan'],
    ['きのこ', 'mushroom'],
    ['ビフォーアフター', 'before after'],
    ['ストレッチポール', 'stretch pole'],
    ['姿勢改善', 'posture improvement'],
    ['寝るだけ', 'lying down'],
    ['フラフープ', 'hula hoop'],
    ['効果', 'benefits']
  ];
  return dictionary.reduce((value, [ja, en]) => value.replaceAll(ja, en), input);
}

export function plainText(html) {
  return String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractFaq(html) {
  const items = [];

  // 形式1: <div class="faq-box"><h3>Q</h3><p>A</p></div>
  const boxRegex = /<div[^>]*class="faq-box"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = boxRegex.exec(html)) !== null) {
    const block = match[1];
    const q = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]?.replace(/<[^>]*>/g, '').trim();
    const a = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]*>/g, '').trim();
    if (q && a) items.push({ q, a });
  }

  // 形式2: <h3>Q. 質問</h3><p>A. 回答</p>
  if (items.length === 0) {
    const qRegex = /<h3[^>]*>Q[.．]\s*([\s\S]*?)<\/h3>\s*<p[^>]*>A[.．]\s*([\s\S]*?)<\/p>/gi;
    while ((match = qRegex.exec(html)) !== null) {
      const q = match[1].replace(/<[^>]*>/g, '').trim();
      const a = match[2].replace(/<[^>]*>/g, '').trim();
      if (q && a) items.push({ q, a });
    }
  }

  return items;
}

export function articlePage({ config, article, bodyHtml, date }) {
  const url = `${config.siteUrl}/blog/${article.slug}/`;
  const image = `${url}image-01.webp`;
  const title = escapeHtml(`${article.title} | ${config.siteName}`);
  const description = escapeHtml(article.description);
  const jsonArticle = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image,
    datePublished: date,
    dateModified: date,
    author: { '@type': 'Organization', name: config.authorName },
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      logo: { '@type': 'ImageObject', url: `${config.siteUrl}/favicon.svg` }
    },
    mainEntityOfPage: url
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${config.siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: '記事一覧', item: `${config.siteUrl}/blog/` },
      { '@type': 'ListItem', position: 3, name: article.title, item: url }
    ]
  };

  const faqItems = extractFaq(bodyHtml);
  const faqSchema = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  } : null;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="${config.themeColor}">
  <link rel="canonical" href="${url}">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${escapeHtml(article.title)}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:site_name" content="${escapeHtml(config.siteName)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
  <script type="application/ld+json">${JSON.stringify(jsonArticle)}</script>
  ${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ''}
  ${ANALYTICS_TAG}
</head>
<body class="article-page">
  <header class="site-header" id="header">
    <a class="brand" href="/"><img src="/favicon.svg" alt="" class="brand__mark"><span class="brand__text">${escapeHtml(config.siteName)}</span></a>
    <button class="menu-button" id="menuButton" aria-label="メニュー" aria-controls="siteNav" aria-expanded="false"><span></span><span></span><span></span></button>
    <nav class="site-nav" id="siteNav"><a href="/">ホーム</a><a href="/blog/" aria-current="page">記事一覧</a><a href="/about/">運営方針</a><a href="/contact/">お問い合わせ</a></nav>
  </header>
  <main>
    <section class="article-hero">
      <div class="article-hero__inner">
        <div class="article-meta"><span>${escapeHtml(article.category)}</span><time datetime="${date}">${date.slice(0, 10).replaceAll('-', '.')}</time></div>
        <h1>${escapeHtml(article.title)}</h1>
      </div>
    </section>
    <article class="article-body">
      <img class="article-img" src="image-01.webp" alt="${escapeHtml(article.imageAlt1)}" width="1200" height="675" fetchpriority="high">
      ${bodyHtml}
      <nav class="article-nav"><a class="button" href="/blog/">記事一覧へ戻る</a></nav>
    </article>
  </main>
  <footer class="site-footer"><p class="brand brand--footer"><img src="/favicon.svg" alt="" class="brand__mark"><span class="brand__text">${escapeHtml(config.siteName)}</span></p><nav><a href="/about/">運営方針</a><a href="/blog/">記事一覧</a><a href="/contact/">お問い合わせ</a><a href="/sitemap.xml">サイトマップ</a></nav><small>&copy; 2026 ${escapeHtml(config.siteName)}</small></footer>
  <script src="/script.js" defer></script>
</body>
</html>`;
}
