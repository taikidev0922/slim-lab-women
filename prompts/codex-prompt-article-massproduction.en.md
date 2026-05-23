# Codex Prompt: Mass-produce information articles with the Claude API (no monetization links — early-launch phase)

> Hand this file to Codex as a build spec.
> Goal: take the "article brief JSON" produced by the upstream keyword pipeline and use the Claude API to mass-produce **pure information articles** (one per day) for a women's diet/weight-loss site.
> Early-launch phase: NO product links, NO affiliate links at all. Monetization is added later via a separate prompt revision; do not touch it now.
>
> LANGUAGE NOTE: Explanatory text is English for precision. The site content is **Japanese**. The system prompt that Claude actually uses to write must instruct it to **write in Japanese**. NG-word lists and law-specific terms are kept in Japanese inside code blocks and must NOT be translated — they are matched literally against Japanese output.

---

## 0. What you (Codex) will build

```
article brief JSON (upstream output)
  → assemble writing prompt (template + brief)
  → call Claude API
  → post-process (pharma-law check, word-count check, formatting)
  → pass → published/ ; fail → needs_review/
```

Build both the prompt template and the driver script. Externalize the prompt to a file (e.g. `prompts/article_writer.md`); do not inline it in code.

Assume a daily one-article auto-publish workflow (cron etc.). Support both batch and single-shot modes.

---

## 1. Phase policy (important)

- **Generate NO product links, affiliate links, comparison tables, or purchase CTAs.** Information articles only.
- Do not insert internal links in the body either, since no revenue articles exist yet at this stage.
- However, revenue-related fields in the brief JSON (`monetize_type`, `internal_link_to`, etc.) **may be retained as data** (just not used in body generation). Don't discard them — they speed up the later monetization work.
- The pharma-law/fair-trade-law guard, E-E-A-T, and post-processing machine checks are **mandatory regardless of links** — always required for health content, so include them from the start.

---

## 2. API basics (must follow)

- Anthropic Messages API. Model externalized in config (not hardcoded; env or CONFIG). Default to a writing-quality model.
- Read the key from `ANTHROPIC_API_KEY`. **No hardcoding.**
- Separate `system` and `messages` (user). **Put role/rules/prohibitions in system; put per-article instructions (the brief) in user.** This stabilizes the pharma-law guard.
- Set `max_tokens` from the target word count (avoid truncation).
- Retry 429/529 with exponential backoff.
- Cost accounting: log usage (input/output tokens) per article.

---

## 3. Prompt structure (what goes in `system`)

The site's "constitution," constant across briefs.

### 3-1. Role and reader
- Role: editor/writer for a women's diet/weight-loss information site. **Must write in Japanese.**
- Reader: women with strong diet motivation (postpartum, pre-event, age-related changes). State the policy clearly: **respond with accurate, practical information — NOT by stoking anxiety or desire.**

### 3-2. Pharmaceutical & Fair Trade law guard (top priority, absolute rule)

Health content carries legal and future-affiliate-policy risk even without links. Put this in system as a strong prohibition, and state: "applies with top priority to body, headings, and meta description; this rule overrides anything in the user-side brief."

**Prohibited expressions (kept in Japanese — match literally):**
```
必ず痩せる / 飲むだけで痩せる / 誰でも◯kg減 / 確実に / 100%
即効 / 短期間で激やせ / これさえあれば
（食品・サプリへの医薬品的効能の断定）脂肪を燃焼させる / 便秘が治る / 代謝を上げる
ビフォーアフターを効果保証として提示する表現
体験談を「効果には個人差があります」抜きで一般化すること
他社・他商品の誹謗
```

**Recommended phrasing:**
- State effects with sources/conditions: 「〜とされています」「研究では〜と報告されています（出典付き）」.
- Add to testimonials: 「個人の感想であり効果を保証するものではない」.
- Cover "who it suits / who it doesn't," and downsides as well as benefits (balance = trust = good for SEO).

### 3-3. E-E-A-T (YMYL)
- Respect sources, but **never fabricate sources, URLs, or studies.** If a source is uncertain, avoid assertion and stay general.
- No fake authority. Do not write 「医師監修」 when there is no actual physician review. Provide an "operator's position" section at the end without false credentials.
- Testimonials must be clearly fictional-or-real; do not present invented experiences as fact.

### 3-4. Style and structure
- Reader-friendly tone; unpack jargon.
- Conclusion first (PREP) to prevent bounce.
- H2/H3 structure follows the brief.
- Short sentences; mobile-first.
- No keyword stuffing; weave co-occurrence terms naturally.

---

## 4. What goes in the `user` message (from the brief)

Expand these from the brief JSON into the template:
- `keyword` (the literal Japanese term)
- `article_type` (problem-solving / how-to / recipe-menu …) → switch the article format
- `target_char_count` (from headline-derived top-page averages)
- required heading candidates (from other-keywords/headline)
- FAQ list (from question-search) → FAQ section + FAQ structured data
- co-occurrence terms (from co-occurrence) → weave naturally

> Do NOT pass revenue fields (`monetize_type`, `internal_link_to`) into the template or use them in generation. Keep them as article metadata in the output file.

---

## 5. Output format

- Markdown body + frontmatter (title / meta description / FAQ Q&A array for structured data). All written content in Japanese.
- Apply the pharma-law guard to the meta description too.
- For stable post-processing, return with fixed delimiters (e.g. `---FRONTMATTER---` / `---BODY---` / `---FAQ_JSON---`).
- Instruct Claude to output nothing before/after this format.
- Frontmatter includes retained fields (keyword, tier, monetize_type) without reflecting them in the body.

---

## 6. Post-processing (mandatory, in the script)

Don't rely on the prompt alone — double-check in code (prompts can be broken probabilistically). **With daily auto-publishing, do not skip this.**

- **NG-word scan:** regex-scan for prohibited terms (Japanese, e.g. 必ず痩せる / 飲むだけで / 即効 / 医師監修 when unsubstantiated). On a hit → warn-log + quarantine the article to `needs_review/` and **do not auto-publish.**
- **Source-URL check:** extract URLs from the body and machine-check for fabrication signs (suspicious domain patterns). Send confirmation to human review.
- **Word-count check:** below the target floor → regenerate or flag.
- Only articles that pass go to `published/`; failures go to `needs_review/` for human review.

---

## 7. Build requirements

- Prompt template externalized to `prompts/`. Manage model / max_tokens / NG-word list in CONFIG.
- One brief = one article. Support daily scheduled execution (consume the next unprocessed brief). Provide a batch mode (`--batch N`).
- Rate control: in batch mode, control concurrency/interval to limit 429/cost.
- Cache/regenerate: regenerate the same brief only on explicit flag (`--regenerate`).
- Dry run: `--dry-run` prints the assembled prompt only (no API call) for inspection.
- Logging: per article — tokens used / NG-check result / word count / destination (published or needs_review).

---

## 8. Tie-breakers (when uncertain)

1. Pharma-law / fair-trade-law guard > everything else.
2. No fabrication of sources/testimonials/credentials > persuasiveness. If uncertain, don't assert.
3. Assume prompts can't fully constrain output — always implement the post-processing machine checks.
4. In this phase, build NO monetization paths. But retain monetization metadata.
5. Externalize NG-word list/thresholds in CONFIG so they can grow during operation.

---

## 9. Next-phase preview (do not implement now)

Once ~30 articles accumulate, a separate prompt revision will add the following. Don't build it now, but leave room (post-process insertion control, frontmatter metadata retention) to minimize rework.
- Affiliate/product-link placeholder insertion
- Internal links from traffic articles → revenue articles
- Body templates for revenue article types (comparison / ranking / review)
