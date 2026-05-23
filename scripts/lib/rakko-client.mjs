import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export class RakkoApiClient {
  constructor({
    apiKey = process.env.RAKKO_API_KEY,
    baseUrl = 'https://api.rakkokeyword.com',
    cacheDir = 'cache/rakko',
    noCache = false,
    maxRetries = 5,
    logger = console
  } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.cacheDir = cacheDir;
    this.noCache = noCache;
    this.maxRetries = maxRetries;
    this.logger = logger;
    this.consumedCredit = 0;
    this.calls = [];
  }

  async request(method, endpoint, body = undefined, { cache = true } = {}) {
    if (!this.apiKey) throw new Error('RAKKO_API_KEY is required.');
    const cacheFile = path.join(this.cacheDir, `${this.cacheKey(method, endpoint, body)}.json`);
    if (cache && !this.noCache) {
      const cached = await this.readCache(cacheFile);
      if (cached) {
        this.calls.push({ endpoint, method, consumedCredit: 0, cache: true });
        return cached;
      }
    }

    let attempt = 0;
    let delayMs = 1500;
    while (true) {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const json = await safeJson(response);
      const credit = Number(json?.meta?.consumedCredit || 0);
      this.consumedCredit += credit;
      this.calls.push({ endpoint, method, consumedCredit: credit, cache: false });

      if (response.status === 429 && attempt < this.maxRetries) {
        await sleep(delayMs);
        delayMs *= 2;
        attempt += 1;
        continue;
      }
      if (response.status === 402) {
        throw new Error(`Rakko credits are insufficient: ${JSON.stringify(json?.errors || json)}`);
      }
      if (response.status === 400 || response.status === 403) {
        throw new Error(`Rakko API ${response.status} at ${endpoint}: request=${JSON.stringify(body)} response=${JSON.stringify(json)}`);
      }
      if (!response.ok || json?.result === false) {
        throw new Error(`Rakko API error ${response.status} at ${endpoint}: ${JSON.stringify(json)}`);
      }

      if (cache && !this.noCache) {
        await fs.mkdir(this.cacheDir, { recursive: true });
        await fs.writeFile(cacheFile, JSON.stringify(json, null, 2));
      }
      return json;
    }
  }

  get(endpoint, options) {
    return this.request('GET', endpoint, undefined, options);
  }

  post(endpoint, body, options) {
    return this.request('POST', endpoint, body, options);
  }

  phaseLog(label) {
    this.logger.log(`[credits] ${label}: consumed=${this.consumedCredit}`);
  }

  cacheKey(method, endpoint, body) {
    return crypto.createHash('sha256').update(JSON.stringify({ method, endpoint, body })).digest('hex');
  }

  async readCache(file) {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      return null;
    }
  }
}

export async function confirmOrExit({ yes, dryRun, message }) {
  if (yes || dryRun) return;
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(`${message}\nContinue? [y/N] `);
  rl.close();
  if (!/^y(es)?$/i.test(answer.trim())) {
    console.log('Aborted.');
    process.exit(0);
  }
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { result: false, errors: [text] };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
