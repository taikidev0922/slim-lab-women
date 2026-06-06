import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// 記事HTMLは <img width="1200"> 表示。元画像(1536px)を表示幅に合わせて縮小し再圧縮する。
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = path.join(root, 'blog');

const MAX_WIDTH = 1200;
const QUALITY = 80;
const SIZE_THRESHOLD = 400 * 1024; // 400KB超のみ対象（既に最適なものは触らない）

async function walkWebp(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walkWebp(full)));
    else if (/\.webp$/i.test(e.name)) files.push(full);
  }
  return files;
}

const mb = (bytes) => (bytes / 1048576).toFixed(2) + 'MB';

const files = await walkWebp(blogDir);
let totalBefore = 0;
let totalAfter = 0;
let changed = 0;

for (const file of files) {
  // ファイル全体を先読みしてから処理する（Windowsでの同一パス書き込み競合を回避）
  const input = await fs.readFile(file);
  const before = input.length;
  totalBefore += before;

  const meta = await sharp(input).metadata();
  const needsResize = (meta.width || 0) > MAX_WIDTH;
  const needsCompress = before > SIZE_THRESHOLD;

  if (!needsResize && !needsCompress) {
    totalAfter += before;
    continue;
  }

  let pipeline = sharp(input);
  if (needsResize) pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const out = await pipeline.webp({ quality: QUALITY }).toBuffer();

  if (out.length < before) {
    await fs.writeFile(file, out);
    totalAfter += out.length;
    changed++;
    console.log(`✓ ${path.relative(root, file)}  ${mb(before)} → ${mb(out.length)}`);
  } else {
    totalAfter += before; // 再圧縮で増えるなら元を維持
    console.log(`- ${path.relative(root, file)}  skip`);
  }
}

console.log(`\n合計: ${mb(totalBefore)} → ${mb(totalAfter)}  (${changed}/${files.length} 枚を圧縮)`);
