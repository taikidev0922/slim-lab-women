/**
 * SVGフォールバックになっている記事の画像をOpenAIで再生成する
 * Usage: node scripts/fix-missing-images.mjs [--slug diet-before-after-women]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './lib/env.mjs';
import { generateArticleImage } from './lib/generate-assets.mjs';

await loadEnv();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = path.join(root, 'blog');

// --slug オプションで特定記事のみ対象にできる
const slugArg = process.argv.indexOf('--slug');
const targetSlug = slugArg !== -1 ? process.argv[slugArg + 1] : null;

const slugs = targetSlug
  ? [targetSlug]
  : (await fs.readdir(blogDir, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

let fixed = 0;

for (const slug of slugs) {
  const dir = path.join(blogDir, slug);
  const htmlPath = path.join(dir, 'index.html');

  let html;
  try {
    html = await fs.readFile(htmlPath, 'utf8');
  } catch {
    console.warn(`Skipping ${slug}: index.html not found`);
    continue;
  }

  // サムネイル (image-01) の処理
  const hasSvg1 = await exists(path.join(dir, 'image-01.svg'));
  const hasWebp1 = await exists(path.join(dir, 'image-01.webp'));
  if (hasSvg1 && !hasWebp1) {
    const alt = html.match(/src="image-01\.[^"]*"\s+alt="([^"]+)"/)?.[1]
      || html.match(/alt="([^"]+)"\s+[^>]*src="image-01/)?.[1]
      || '女性向けダイエット記事のサムネイル';
    const prompt = `女性向けダイエット情報サイト用の記事サムネイル。テーマ:「${alt}」。ピンク基調、清潔感、スマホで見やすい、文字なし、健康的な食事と軽い運動の雰囲気。`;
    console.log(`[${slug}] image-01 を生成中...`);
    const outFile = await generateArticleImage({ prompt, outFile: path.join(dir, 'image-01.webp'), fallbackTitle: alt });
    if (!outFile.endsWith('.svg')) {
      html = html.replace(/src="image-01\.svg"/g, 'src="image-01.webp"');
      html = html.replace(/src="image-01\.png"/g, 'src="image-01.webp"');
      // OGP・JSON-LDのURLも修正
      html = html.replace(/(image-01\.)svg/g, '$1webp');
      html = html.replace(/(image-01\.)png/g, '$1webp');
      console.log(`[${slug}] image-01.webp 生成完了`);
      fixed++;
    } else {
      console.warn(`[${slug}] image-01: OpenAI失敗、SVGのまま`);
    }
  }

  // 本文画像 (image-02) の処理
  const hasSvg2 = await exists(path.join(dir, 'image-02.svg'));
  const hasWebp2 = await exists(path.join(dir, 'image-02.webp'));
  if (hasSvg2 && !hasWebp2) {
    const alt = html.match(/src="image-02\.[^"]*"\s+alt="([^"]+)"/)?.[1]
      || '女性向けダイエット記事の図解';
    const prompt = `女性向けダイエット情報サイト用の記事内インフォグラフィック。テーマ:「${alt}」。記事の核心ポイントをアイコン・矢印・色分けブロックで視覚化。文字なし、ピンク・ミント・白ベース、余白たっぷりのシンプルなレイアウト、スマホで一目で意味が伝わるデザイン。`;
    console.log(`[${slug}] image-02 を生成中...`);
    const outFile = await generateArticleImage({ prompt, outFile: path.join(dir, 'image-02.webp'), fallbackTitle: alt });
    if (!outFile.endsWith('.svg')) {
      html = html.replace(/src="image-02\.svg"/g, 'src="image-02.webp"');
      html = html.replace(/src="image-02\.png"/g, 'src="image-02.webp"');
      console.log(`[${slug}] image-02.webp 生成完了`);
      fixed++;
    } else {
      console.warn(`[${slug}] image-02: OpenAI失敗、SVGのまま`);
    }
  }

  await fs.writeFile(htmlPath, html);
}

console.log(`\n完了: ${fixed} 枚の画像を生成しました`);

if (fixed > 0) {
  // blog/index.html と index.html の画像参照をSVG→WebPに更新
  for (const htmlFile of [
    path.join(root, 'blog', 'index.html'),
    path.join(root, 'index.html')
  ]) {
    try {
      let content = await fs.readFile(htmlFile, 'utf8');
      const updated = content.replace(/image-01\.svg/g, 'image-01.webp');
      if (updated !== content) {
        await fs.writeFile(htmlFile, updated);
        console.log(`インデックス更新: ${path.relative(root, htmlFile)}`);
      }
    } catch {}
  }
}

async function exists(filePath) {
  try { await fs.access(filePath); return true; } catch { return false; }
}
