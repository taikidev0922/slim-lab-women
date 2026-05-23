import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = ['index.html', 'blog/index.html', 'sitemap.xml', 'robots.txt', 'style.css', '.github/workflows/daily-blog.yml'];
const missing = [];

for (const file of required) {
  try {
    await fs.access(path.join(root, file));
  } catch {
    missing.push(file);
  }
}

const htmlFiles = await walk(root, (file) => file.endsWith('.html'));
const htmlErrors = [];
for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  for (const token of ['<title>', 'name="description"', 'rel="canonical"', 'name="viewport"']) {
    if (!html.includes(token)) htmlErrors.push(`${path.relative(root, file)} missing ${token}`);
  }
}

if (missing.length || htmlErrors.length) {
  console.error([...missing.map((f) => `Missing ${f}`), ...htmlErrors].join('\n'));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML file(s).`);

async function walk(dir, predicate) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full, predicate));
    else if (predicate(full)) files.push(full);
  }
  return files;
}
