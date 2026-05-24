const menuButton = document.getElementById('menuButton');
const siteNav = document.getElementById('siteNav');

if (menuButton && siteNav) {
  menuButton.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
}

// ── カテゴリ絞り込み (/blog/?cat=XXX) ──────────────────────────────
(function () {
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat');
  if (!cat) return;

  // カードを絞り込む
  const cards = document.querySelectorAll('.article-card');
  let count = 0;
  cards.forEach((card) => {
    const label = card.querySelector('span')?.textContent?.trim();
    if (label === cat) {
      count++;
    } else {
      card.style.display = 'none';
    }
  });

  // ページ見出しをカテゴリ名に差し替え
  const h1 = document.querySelector('.page-hero h1');
  if (h1) h1.textContent = cat;

  const desc = document.querySelector('.page-hero p');
  if (desc) {
    desc.textContent = count > 0
      ? `「${cat}」の記事が ${count} 件あります。`
      : `「${cat}」の記事はまだ準備中です。しばらくお待ちください。`;
  }

  // アクティブカテゴリをパンくず的に eyebrow に表示
  const eyebrow = document.querySelector('.page-hero .eyebrow');
  if (eyebrow) eyebrow.textContent = cat;
})();
