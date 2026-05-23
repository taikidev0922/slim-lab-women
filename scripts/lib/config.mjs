import fs from 'node:fs/promises';

export async function loadConfig() {
  const raw = await fs.readFile(new URL('../../site.config.json', import.meta.url), 'utf8');
  const config = JSON.parse(raw);
  config.siteUrl = (process.env.SITE_URL || config.siteUrl).replace(/\/$/, '');
  return config;
}

export function todayJst() {
  const date = new Date();
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  return parts;
}

export function formatDisplayDate(isoDate) {
  return isoDate.replaceAll('-', '.');
}
