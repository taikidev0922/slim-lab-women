import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANALYTICS_TAG } from './lib/html.mjs';

// 既存の全HTMLページの </head> 直前に GA タグを挿入する（冪等：既に入っていればスキップ）。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GA_ID = 'G-04JT4WBLQB';

const targets = [
  path.join(root, 'index.html'),
  path.join(root, 'blog', 'index.html'),
  path.join(root, 'about', 'index.html'),
  path.join(root, 'contact', 'index.html'),
];

const blogDir = path.join(root, 'blog');
for (const e of await fs.readdir(blogDir, { withFileTypes: true })) {
  if (e.isDirectory()) targets.push(path.join(blogDir, e.name, 'index.html'));
}

let added = 0;
let skipped = 0;
let missing = 0;
for (const file of targets) {
  let html;
  try {
    html = await fs.readFile(file, 'utf8');
  } catch {
    missing++;
    console.warn('— ファイルなし:', path.relative(root, file));
    continue;
  }
  if (html.includes(GA_ID)) {
    skipped++;
    continue;
  }
  if (!html.includes('</head>')) {
    console.warn('— </head>が見つからない:', path.relative(root, file));
    continue;
  }
  html = html.replace('</head>', `${ANALYTICS_TAG}\n</head>`);
  await fs.writeFile(file, html);
  added++;
  console.log('✓', path.relative(root, file));
}

console.log(`\n追加 ${added} / スキップ(既存) ${skipped} / ファイルなし ${missing}`);
