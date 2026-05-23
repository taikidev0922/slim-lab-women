import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './lib/env.mjs';

await loadEnv();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CONFIG = {
  model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
  endpoint: 'https://api.anthropic.com/v1/messages',
  anthropicVersion: '2023-06-01',
  promptPath: path.join(root, 'prompts/article_writer.md'),
  defaultBriefPath: path.join(root, 'output/keyword-research/article_briefs.json'),
  outDir: path.join(root, 'content/articles'),
  cacheDir: path.join(root, 'cache/claude-articles'),
  statePath: path.join(root, 'cache/article-writer-state.json'),
  maxRetries: 5,
  requestIntervalMs: 1200,
  targetToTokenSafety: 1.3,
  minCharRatio: 0.72,
  allowMedicalSupervision: false,
  ngPatterns: [
    /必ず\s*痩せる/g,
    /飲むだけで\s*痩せる/g,
    /誰でも\s*\d+\s*kg\s*減/g,
    /確実に\s*痩せる/g,
    /100%\s*痩せる/g,
    /即効/g,
    /激やせ/g,
    /これさえあれば/g,
    /脂肪を燃焼させる/g,
    /便秘が治る/g,
    /代謝を上げる/g,
    /医師監修/g,
    /専門家監修/g,
    /\{\{AFFILIATE_LINK\}\}/g,
    /\{\{INTERNAL_LINK\}\}/g
  ]
};

const args = parseArgs(process.argv.slice(2));

async function main() {
  const template = parsePromptTemplate(await fs.readFile(CONFIG.promptPath, 'utf8'));
  const briefs = await loadBriefs(args.briefFile || CONFIG.defaultBriefPath, Boolean(args.dryRun));
  const selected = await selectBriefs(briefs, args);

  if (args.dryRun) {
    const sample = normalizeBrief(selected[0] || sampleBrief());
    const prompt = buildPrompt(template.userTemplate, sample);
    console.log('---SYSTEM PROMPT---');
    console.log(template.system.slice(0, 4000));
    console.log('---USER PROMPT---');
    console.log(prompt);
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required.');
  }

  await fs.mkdir(CONFIG.outDir, { recursive: true });
  await fs.mkdir(CONFIG.cacheDir, { recursive: true });

  const state = await loadState();
  for (const rawBrief of selected) {
    const brief = normalizeBrief(rawBrief);
    const briefId = getBriefId(brief);
    const result = await generateArticle({ brief, template, regenerate: Boolean(args.regenerate) });
    const checked = validateArticle(result.article, brief);
    const targetDir = path.join(CONFIG.outDir, checked.needsReview ? 'needs_review' : 'published');
    await fs.mkdir(targetDir, { recursive: true });
    const slug = slugify(brief.keyword);
    const file = path.join(targetDir, `${slug}.md`);
    await fs.writeFile(file, serializeArticle(result.article, brief));
    await appendJsonl(path.join(CONFIG.outDir, 'article-writer-log.jsonl'), {
      keyword: brief.keyword,
      briefId,
      slug,
      destination: checked.needsReview ? 'needs_review' : 'published',
      needsReview: checked.needsReview,
      issues: checked.issues,
      charCount: checked.charCount,
      minCharCount: checked.minCharCount,
      usage: result.usage,
      model: CONFIG.model,
      contentPhase: 'information_only',
      generatedAt: new Date().toISOString()
    });
    state.processed[briefId] = {
      keyword: brief.keyword,
      destination: checked.needsReview ? 'needs_review' : 'published',
      file: path.relative(root, file),
      generatedAt: new Date().toISOString()
    };
    await saveState(state);
    console.log(`[article] ${brief.keyword} -> ${path.relative(root, file)} review=${checked.needsReview}`);
    await sleep(Number(args.intervalMs || CONFIG.requestIntervalMs));
  }
}

async function selectBriefs(briefs, options) {
  const normalized = briefs.map(normalizeBrief);
  if (options.dryRun) return normalized.length ? [normalized[0]] : [sampleBrief()];

  const state = await loadState();
  const batchSize = Number(options.batch || options.limit || 1);
  const candidates = options.regenerate
    ? normalized
    : normalized.filter((brief) => !state.processed[getBriefId(brief)]);

  if (options.keyword) {
    return candidates.filter((brief) => brief.keyword === options.keyword).slice(0, batchSize);
  }

  return candidates.slice(0, batchSize);
}

async function generateArticle({ brief, template, regenerate }) {
  const user = buildPrompt(template.userTemplate, brief);
  const cacheKey = hash(JSON.stringify({ model: CONFIG.model, phase: 'information_only', system: template.system, user }));
  const cacheFile = path.join(CONFIG.cacheDir, `${cacheKey}.json`);
  if (!regenerate) {
    const cached = await tryReadJson(cacheFile);
    if (cached) return cached;
  }

  const maxTokens = estimateMaxTokens(brief.target_char_count);
  const json = await callClaude({ system: template.system, user, maxTokens });
  const text = json.content?.map((part) => part.text || '').join('\n') || '';
  const article = parseClaudeArticle(text);
  const result = { article, usage: json.usage || {}, rawText: text };
  await fs.writeFile(cacheFile, JSON.stringify(result, null, 2));
  return result;
}

async function callClaude({ system, user, maxTokens }) {
  let attempt = 0;
  let delayMs = 1500;
  while (true) {
    const response = await fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': CONFIG.anthropicVersion,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: CONFIG.model,
        max_tokens: maxTokens,
        temperature: 0.45,
        system,
        messages: [{ role: 'user', content: user }]
      })
    });
    const json = await response.json().catch(() => ({}));
    if ((response.status === 429 || response.status === 529) && attempt < CONFIG.maxRetries) {
      await sleep(delayMs);
      delayMs *= 2;
      attempt += 1;
      continue;
    }
    if (!response.ok) throw new Error(`Claude API ${response.status}: ${JSON.stringify(json)}`);
    return json;
  }
}

function parsePromptTemplate(raw) {
  const system = section(raw, '---SYSTEM---', '---USER_TEMPLATE---');
  const userTemplate = raw.split('---USER_TEMPLATE---')[1]?.trim();
  if (!system || !userTemplate) throw new Error('Prompt template must include ---SYSTEM--- and ---USER_TEMPLATE---.');
  return { system: system.trim(), userTemplate };
}

function section(raw, start, end) {
  const startIndex = raw.indexOf(start);
  const endIndex = raw.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return '';
  return raw.slice(startIndex + start.length, endIndex);
}

function buildPrompt(template, brief) {
  const generationBrief = {
    keyword: brief.keyword,
    article_type: brief.article_type,
    target_char_count: brief.target_char_count,
    required_headings: brief.required_headings,
    faq: brief.faq,
    lsi_keywords: brief.lsi_keywords,
    co_occurrence_terms: brief.co_occurrence_terms,
    ymyl_note: brief.ymyl_note
  };
  const relatedTerms = Array.isArray(brief.co_occurrence_terms) && brief.co_occurrence_terms.length
    ? brief.co_occurrence_terms
    : brief.lsi_keywords || [];
  const replacements = {
    BRIEF_JSON: JSON.stringify(generationBrief, null, 2),
    CO_OCCURRENCE_TERMS: relatedTerms.map((item) => typeof item === 'string' ? item : item.keyword || item.question || '').filter(Boolean).join(', '),
    TARGET_CHAR_COUNT: String(brief.target_char_count),
    MIN_CHAR_COUNT: String(Math.floor(brief.target_char_count * CONFIG.minCharRatio))
  };
  return Object.entries(replacements).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, value), template);
}

function parseClaudeArticle(text) {
  const frontmatter = extractBetween(text, '---FRONTMATTER---', '---BODY---').trim();
  const body = extractBetween(text, '---BODY---', '---FAQ_JSON---').trim();
  const faqRaw = text.split('---FAQ_JSON---')[1]?.trim() || '[]';
  let faq = [];
  try {
    faq = JSON.parse(faqRaw);
  } catch {
    faq = [];
  }
  return { frontmatter, body, faq };
}

function validateArticle(article, brief) {
  const fullText = `${article.frontmatter}\n${article.body}\n${JSON.stringify(article.faq)}`;
  const issues = [];

  for (const pattern of CONFIG.ngPatterns) {
    if ((pattern.source === '医師監修' || pattern.source === '専門家監修') && CONFIG.allowMedicalSupervision) continue;
    const matches = fullText.match(pattern);
    if (matches?.length) issues.push({ type: 'ng_word', pattern: pattern.source, matches: [...new Set(matches)] });
  }

  if (/https?:\/\/[^\s)>"']*(amazon|a8\.net|rakuten|afb|valuecommerce|moshimo)[^\s)>"']*/i.test(fullText)) {
    issues.push({ type: 'affiliate_or_commerce_url_found' });
  }

  const urls = extractUrls(fullText);
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('.')) issues.push({ type: 'suspicious_url', url });
    } catch {
      issues.push({ type: 'invalid_url', url });
    }
  }

  const charCount = countJapaneseChars(article.body);
  const minCharCount = Math.floor(brief.target_char_count * CONFIG.minCharRatio);
  if (charCount < minCharCount) issues.push({ type: 'too_short', charCount, minCharCount });

  if (!article.frontmatter || !article.body || !Array.isArray(article.faq)) {
    issues.push({ type: 'invalid_output_format' });
  }

  return { needsReview: issues.length > 0, issues, charCount, minCharCount };
}

function serializeArticle(article, brief) {
  const faqJson = JSON.stringify(article.faq || [], null, 2);
  const meta = {
    keyword: brief.keyword,
    tier: brief.tier,
    article_type: brief.article_type,
    monetize_type: brief.monetize_type,
    internal_link_to: brief.internal_link_to,
    content_phase: 'information_only'
  };
  return `---\n${article.frontmatter}\nsource_meta: |-\n${indent(JSON.stringify(meta, null, 2), 2)}\nfaq_json: |-\n${indent(faqJson, 2)}\n---\n\n${article.body}\n`;
}

function normalizeBrief(raw) {
  const target = Number(raw.target_char_count || raw.target_word_count || 3500);
  return {
    keyword: raw.keyword,
    tier: raw.tier || '②',
    article_type: raw.article_type || '悩み解決・ノウハウ解説記事',
    monetize_type: raw.monetize_type || 'both',
    target_char_count: target,
    required_headings: raw.required_headings || [],
    faq: raw.faq || [],
    lsi_keywords: raw.lsi_keywords || [],
    co_occurrence_terms: raw.co_occurrence_terms || [],
    internal_link_to: raw.internal_link_to || null,
    ymyl_note: raw.ymyl_note || '医療的断定を避け、必要に応じて専門家への相談を促す。'
  };
}

async function loadBriefs(file, dryRun) {
  try {
    const parsed = JSON.parse(await fs.readFile(path.resolve(root, file), 'utf8'));
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.briefs)) return parsed.briefs;
    throw new Error('Brief file must be an array or { "briefs": [] }.');
  } catch (error) {
    if (dryRun) return [sampleBrief()];
    throw error;
  }
}

function sampleBrief() {
  return {
    keyword: 'ダイエットレシピ 1週間分 朝昼晩 簡単',
    tier: '①',
    article_type: 'レシピ・献立の情報記事',
    monetize_type: 'both',
    target_char_count: 4200,
    required_headings: [
      { text: '1週間ダイエットレシピの考え方', count: 3 },
      { text: '朝昼晩の簡単メニュー例', count: 2 }
    ],
    faq: ['作り置きしても大丈夫ですか？', 'コンビニ食でも代用できますか？'],
    lsi_keywords: [{ keyword: '作り置き' }, { keyword: '高たんぱく' }, { keyword: '買い物リスト' }],
    internal_link_to: '/blog/diet-recipe-one-week/'
  };
}

async function loadState() {
  const state = await tryReadJson(CONFIG.statePath);
  return state && state.processed ? state : { processed: {} };
}

async function saveState(state) {
  await fs.mkdir(path.dirname(CONFIG.statePath), { recursive: true });
  await fs.writeFile(CONFIG.statePath, JSON.stringify(state, null, 2));
}

function getBriefId(brief) {
  return hash(JSON.stringify({ keyword: brief.keyword, article_type: brief.article_type, target: brief.target_char_count }));
}

function estimateMaxTokens(targetChars) {
  const target = Number(targetChars || 3500);
  return Math.min(8192, Math.max(2500, Math.ceil(target * CONFIG.targetToTokenSafety)));
}

function slugify(input) {
  return String(input)
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .slice(0, 80) || `article-${Date.now()}`;
}

function extractBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return '';
  return text.slice(startIndex + start.length, endIndex);
}

function extractUrls(text) {
  return text.match(/https?:\/\/[^\s)>"']+/g) || [];
}

function countJapaneseChars(text) {
  return String(text).replace(/```[\s\S]*?```/g, '').replace(/[#*\-\s`>[\](){}|:：。、，,.!?！？]/g, '').length;
}

function indent(text, spaces) {
  const pad = ' '.repeat(spaces);
  return text.split('\n').map((line) => `${pad}${line}`).join('\n');
}

async function tryReadJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

async function appendJsonl(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, `${JSON.stringify(value)}\n`);
}

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--regenerate') out.regenerate = true;
    else if (arg.includes('=')) {
      const [key, value] = arg.replace(/^--/, '').split(/=(.*)/s);
      out[toCamel(key)] = value;
    }
  }
  return out;
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
