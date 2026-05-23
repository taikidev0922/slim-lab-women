# Codex Prompt: Keyword Selection Pipeline using the Rakko Keyword API

> Hand this file to Codex as a build spec.
> Goal: build a keyword-selection pipeline that calls the Rakko Keyword API
> (`https://api.rakkokeyword.com`, auth via the `X-API-Key` header) for a
> **women's diet/weight-loss information site (new domain, pre-launch)**.
> Revenue comes from both Amazon Associates and A8.net affiliates — balanced.
>
> NOTE ON LANGUAGE: This site, its content, its target keywords, and the
> applicable laws are all Japanese. The explanatory text is in English for
> precision, but **all literal keywords, API field values, and law-specific
> terms are kept in Japanese inside code blocks and must NOT be translated.**
> LLMs handle Japanese tokens embedded in English prose without issue.

---

## 0. What you (Codex) will build

A pipeline that: collects a keyword universe → scores it → classifies it into 3 tiers, producing:
1. An API client (retry, 429 rate-limit handling, credit-consumption logging).
2. The collect → score → classify pipeline.
3. Outputs: `keywords_master.csv` (all keywords + metrics + tier label + article type) and `site_structure.json` (category → article parent/child structure).

Language/runtime is your choice (Python + requests or Node + fetch). Read the API key from the `RAKKO_API_KEY` environment variable. **Never hardcode the API key.**

---

## 1. Domain knowledge (the reasoning behind the rules)

- This is a health/body **YMYL** site. Google evaluates it strictly; mass low-quality output will not rank. Strategy: pick winnable keywords, write each article deeply. In the keyword stage, prioritize **win-rate over volume**.
- Use **CPC (USD) and competition (0–100)** as proxies for revenue potential. Keywords advertisers pay for tend to be keywords that generate affiliate revenue.
- A new domain has zero backlinks/authority, so early on only **low SEO-difficulty (seoDifficulty 1–100)** keywords are winnable. Set a strict difficulty ceiling at launch.
- Keep keywords whose `searchVolume` is `null` in a separate bucket — "the tool couldn't pick it up" often means competitors haven't noticed it either.
- CPC is in USD. Normalize before combining with other metrics in scoring (see below).

---

## 2. Seed keywords

Hardcode these as the initial seeds (use a constant array so they're easy to swap). They mix core women's-diet themes with revenue-friendly themes. **Keep these in Japanese exactly as written** — they are the literal search terms.

```
# Problem / core-theme seeds (traffic universe)
ダイエット, 痩せたい, 痩せる方法, ぽっこりお腹, 下半身痩せ, 二の腕 痩せ,
産後ダイエット, 更年期 ダイエット, 生理前 体重, 停滞期, リバウンド,
食事制限, 糖質制限, 断食 16時間, 基礎代謝, むくみ 解消

# Product / purchase-intent seeds (revenue universe; Amazon + A8)
プロテイン 女性, ソイプロテイン, 置き換えダイエット, 酵素ドリンク,
スムージー, サラダチキン, 宅食 ダイエット, 冷凍弁当, EMS, 体組成計,
ダイエットサプリ, 食物繊維 サプリ, パーソナルジム, オンラインフィットネス
```

Store as the constant `SEED_KEYWORDS` and loop over all of them in the collection phase.

---

## 3. Pipeline (endpoints and intent per phase)

### Phase 1: Collect the keyword universe

Two channels per seed.

**(a) `/v1/related-keywords`**
- `matchType: "partialMatch"`, `limit: 1000` per seed, `sortBy: "searchVolume"`, `orderBy: "desc"`.
- Intent: comprehensively gather demanded keywords for the theme.

**(b) `/v1/suggest-keywords`**
- `modes: ["google", "amazon", "rakuten"]` ← **critical.** Amazon/Rakuten suggests surface purchase-intent terms — the source of revenue keywords.
- `increaseKeyword: true`.
- From each item, record which engine it came from (`suggestEngines.active`) and set an **amazon/rakuten-origin flag** for revenue-tier judgment later.

Merge all seeds, dedupe by `keyword`. Keep `metrics` (seoDifficulty, searchVolume, cpc, competition) on each.

> Credits: related and suggest consume credits (suggest = 1 credit per engine; 3 modes = 3 credits). Log the estimated credit cost (seeds × engines) before running.

### Phase 2: Bulk volume/trend enrichment (optional, recommended)

Submit all Phase-1 keywords to `/v1/search-volume` (bulk, up to 50,000).
- `seoDifficulty: true`.
- Poll `/v1/search-volume/{requestId}/status` until `isCompleted: true` (exponential backoff, cap max wait).
- Fetch `/v1/search-volume/{requestId}/results`. A large positive `trends.changeRate.12m` marks a **rising trend** keyword — store as `is_trending` (to catch emerging diet methods before competitors).

### Phase 3: Scoring and 3-tier classification

Make all thresholds tunable constants.

**Normalize (0–1):**
- `vol_score = min(searchVolume / 5000, 1)` (null → 0, but don't discard)
- `cpc_score = min(cpc / 3.0, 1)` (USD; ~3 dollars as the cap target)
- `ease_score = (100 - seoDifficulty) / 100` (lower difficulty → higher score)

**Composite:**
- `revenue_score = 0.6 * cpc_score + 0.4 * (competition / 100)`
- `winnability_score = ease_score`
- `total = 0.4 * revenue_score + 0.4 * winnability_score + 0.2 * vol_score`

**Tier assignment (evaluate top-down, first match wins):**

| Tier | Condition | Role | Article type |
|---|---|---|---|
| ① Revenue (CV-direct) | `cpc >= 0.5` OR amazon/rakuten-origin flag true, AND `seoDifficulty <= 50` | Purchase/sign-up intent. Place Amazon/A8 links | Comparison / ranking / recommendation |
| ③ Long-tail (early wins) | `seoDifficulty <= 33` AND `searchVolume >= 100` (or null) | First wins for a new domain | Single-product review / testimonial |
| ② Traffic (research intent) | Otherwise, `searchVolume >= 300` | Build trust → internal-link to ① | Problem-solving / how-to |
| Exclude | Everything else | — | — |

> Balanced revenue: within ①, add a sub-tag `monetize_type: "amazon" | "a8" | "both"` (amazon-origin → product; high-CPC non-product → A8 services like gyms/meal-kits) so article templates can branch later.

### Phase 4: Competitor gap mining (post-launch; stub only for now)

Prepare a stub. `/v1/competitive` → extract competitor domains → `/v1/influx-keywords` → keywords competitors rank for; a large `targetUniqueKeywordCount` = keywords competitors miss. Leave the function skeleton with `# TODO: enable post-launch`.

### Phase 5: Article-design support data (top revenue ① + long-tail ③ only)

For the top N composite-scored keywords (e.g. top 50), spend extra credits:
- `/v1/headline`: average word count + heading structure of top pages → compute the comprehensiveness bar.
- `/v1/other-keywords` (LSI/PAA) and `/v1/question-search`: related terms for the body and FAQs. Store `question` items for FAQ structured data.

Output `article_briefs.json` (per keyword: target word count, required heading candidates, FAQ list).

---

## 4. Output spec

**`keywords_master.csv`** columns:
```
keyword, tier, monetize_type, total_score, revenue_score,
winnability_score, searchVolume, seoDifficulty, cpc, competition,
is_trending, from_amazon_suggest, article_type, source_seed
```
Sort by `total_score` desc. The `keyword` column holds the literal Japanese term.

**`site_structure.json`:**
- One parent category per seed theme (e.g. プロテイン / 置き換え / 宅食 / 産後ダイエット …).
- Under each: one ① revenue article (pillar = comparison/recommendation), surrounded by ③ long-tail (individual reviews) and ② traffic (problem-solving) articles → **topic cluster** structure.
- Internal linking: ② ③ link toward ①; express direction in an `internal_link_to` field.

**`article_briefs.json`:** Phase 5 output.

---

## 5. Robustness requirements

- **Auth:** `X-API-Key: <env>` header on every request.
- **Errors:** HTTP 402 (insufficient credits) → stop immediately and warn with remaining credits. 429 (rate limit) → exponential backoff retry (max 5). 403/400 → log the request and stop.
- **Credit accounting:** sum `meta.consumedCredit` from each response; print the total per phase. Print an estimated cost before running and gate behind user confirmation (stdin or `--yes`). The heavy `/v1/search-volume` and Phase 5 especially require confirmation.
- **Idempotency/cache:** save API responses to `cache/` as JSON; prefer cache on re-run (`--no-cache` to disable).
- **Externalize config:** thresholds (CPC bar, difficulty ceiling, weights) go in a top-level `CONFIG` dict with comments explaining each value.
- **Dry run:** `--dry-run` prints seed count and credit estimate without calling the API.

---

## 6. Build order

1. API client (auth, retry, credit accounting, cache)
2. Phase 1 (related + suggest) → raw data for `keywords_master.csv`
3. Phase 3 (scoring, 3-tier) → finished CSV
4. `site_structure.json` generation
5. Phase 2 (bulk search-volume + trends)
6. Phase 5 (article briefs)
7. Phase 4 as stub only

Separate functions; `main()` runs phases selectively via flags.

---

## 7. Tie-breakers (when uncertain)

- When in doubt, prioritize "can a new domain win this" (low difficulty).
- On the credit-vs-coverage trade-off, fall to the safe (lower-consumption) side.
- Thresholds may be provisional. Always collect them in `CONFIG` for later tuning.
- This is YMYL: in article briefs, attach a note prompting "operator info, first-hand experience, sources" for the selected keywords.
