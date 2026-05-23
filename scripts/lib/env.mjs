import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export async function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    await loadFile(path.join(root, file));
  }
}

async function loadFile(file) {
  let raw;
  try {
    raw = await fs.readFile(file, 'utf8');
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim().replace(/^\uFEFF/, '');
    const value = unquote(trimmed.slice(index + 1).trim());
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}
