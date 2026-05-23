# SEO Strategy Report (2026): Women's Diet Information Site × AI Mass-Production × Affiliate

> Purpose: reference document for Codex to consult repeatedly (place in the project repo).
> Synthesizes multiple SEO sources (late 2025 – May 2026), filtered to this project's conditions:
> new domain, YMYL health niche, AI article mass-production, Amazon/A8 affiliate monetization.
> Each item includes "Implication for this project" (= how it maps to implementation/operations).
> Caveat: SEO mixes confirmed facts with industry speculation; this report may age as algorithms change.
>
> LANGUAGE NOTE: English for precision (the audience is Codex, an LLM). Literal Japanese search
> keywords and Japan-specific law terms are kept in Japanese inside code blocks — do not translate them.

---

## 0. Top-line summary (do not miss these)

Points where multiple sources agree as of 2026:

1. **Using AI itself is not penalized.** Google penalizes "scaled content abuse" — mass-producing thin pages primarily to manipulate rankings. It judges the content, not the production method.
2. **The 2026 core updates (Feb, Mar) hit unedited mass-AI sites with 40–90% traffic drops.** Meanwhile, human-edited quality AI content was unaffected or grew. The difference is mass-vs-quality.
3. **YMYL (health/body) is evaluated most strictly.** E-E-A-T thresholds apply one notch higher; supplements, medications, and mental-health topics get the highest scrutiny.
4. **The decisive 2026 differentiator is "Experience" (first-hand).** Articles that show the author actually used/did the thing rise; spec-summary articles sink. Especially pronounced in affiliate/review content.
5. **A new domain needs 3–6 months (YMYL: 9–12 months) of trust-building.** Win early with long-tail × low-competition, then move to harder terms.

This project is exactly the combination 2026 algorithms most distrust: new domain × YMYL × AI mass-production × affiliate. So designing to mass-produce *without* tripping penalty conditions is what decides survival.

---

## 1. Handling AI / mass-produced content (most critical — directly affects this project)

**Confirmed facts:**
- Google's official stance is consistent: it judges quality, not how content was made. Using AI as a tool to make helpful content is fine; using it to manipulate rankings is a violation.
- "Scaled content abuse" = generating pages in bulk *primarily* to manipulate search rankings. The key word is *primarily*. Publishing 50 articles in a week is not itself abuse.
- The March 2026 core update explicitly targeted scaled content abuse; sites publishing unedited AI pages at scale lost 50–80% of traffic.
- Typical penalized patterns: 50–500 AI articles/day across keyword clusters; no human editorial review; thin facts; no first-hand experience; hundreds of pages with near-identical structure/info.
- "AI-generated product-comparison affiliate sites" specifically: 40–70% drops. Reason: no first-hand product use, content identical to manufacturer specs, no hands-on testing signals.
- SpamBrain and the Helpful Content System detect *patterns* low-quality AI tends to produce (generic phrasing, broad claims without measurable support, no evidence the author did the thing) — not "AI detection" per se.

**Implication for this project:**
- One article/day is fine in itself (not the 50–500/day scale). The dividing line is whether you can add "human editorial review" and "first-hand signals."
- Strengthen the Claude writing prompt to avoid generic phrasing and include concrete/specific info (numbers, steps, real usage).
- Avoid near-duplicate mass output: don't over-reuse one template; vary structure by article type.
- Build an "editorial review step" into operations (full auto-publish matches the most dangerous pattern). At minimum: NG check + spot human review.

---

## 2. YMYL (health) and E-E-A-T

**Confirmed facts:**
- YMYL is a *classification*, not an algorithm name. Once classified YMYL, the E-E-A-T threshold applies far higher than normal content.
- The Sept 2025 quality-rater-guideline update expanded YMYL to include government info, elections, and civic trust (misinformation concern). Health remains top-scrutiny.
- The three highest-scrutiny health categories: medical advice; specific medications/supplements; mental health. This project's supplements/meal-replacement products are close to this.
- E-E-A-T is not a single ranking factor, but Google measures these concepts via 80+ algorithmic signals (anchor-text n-grams, information gain, etc.).
- Trust is the most critical of the four. Without a foundation of security (HTTPS), transparency, and accuracy, expertise/authority mean nothing.
- Concrete trust signals: clear contact info, operator info, transparent editorial process, regular fact-checking, error correction, real author names/credentials.
- Conditions for AI content to satisfy E-E-A-T: expert review, addition of original insight and real data, attribution to an accountable named author, alignment with user intent (not search volume alone).
- Generative search (AI Overviews, etc.) cites authoritative sources (CDC, Mayo Clinic) for health queries. Brands without authority can be excluded from generative answers entirely.

**Implication for this project:**
- The existing Codex prompts (pharma-law guard + E-E-A-T + no fabricated sources/credentials) are pointed the right way; this report corroborates that.
- At launch, create the operator-info, editorial-policy, and contact pages — at top priority, before or alongside mass-producing articles.
- HTTPS is mandatory. Core Web Vitals (below) carry heavy weight for YMYL.
- Decide the authorship approach early. Fake 「医師監修」 is fabrication and prohibited, but a stated operator position — and ideally a real expert-review process — pays off.
- How to substantiate "experience" (Section 5) is do-or-die for supplement/food reviews.

---

## 3. New-domain launch strategy (sandbox)

**Confirmed facts:**
- Google denies an official "sandbox" filter. Still, new domains consistently struggle to rank competitive terms for 3–6 months — observed industry-wide. The cause is lack of trust signals, not age.
- YMYL niches can take 9–12 months. Meaningful domain-authority movement also takes 6–12 months for new sites.
- Correct early moves: don't chase competitive big keywords on day one. Start with long-tail, informational, low-competition terms. Early wins build authority, making harder terms reachable sooner.
- Articles published in months 1–3 accumulate authority and start ranking afterward; new articles then rank faster once the domain has baseline trust (compounding).
- Passive waiting is the worst. Continuous publishing/internal-linking/engagement exits the "sandbox" faster; neglect stretches it to 12–18 months.
- Aggressive/low-quality link acquisition on a new domain is a major red flag. Build quality links slowly.
- Brand building (direct traffic, branded search, social) signals "real humans care about this site" and speeds the exit.

**Implication for this project:**
- The current plan ("first 3 months = information articles for the foundation, monetize later") fully aligns with this research. It's the proper approach.
- Prioritize the keyword pipeline's "③ long-tail (low difficulty × demand)" for early targeting — the royal road out of the sandbox.
- Do not buy low-quality backlinks (especially counterproductive on a new domain).
- Don't stop publishing (daily one article is good for continuity). In parallel, track rank/traffic via Google Search Console / GA4.
- Off-search traffic (branded search, social) also builds trust — grow it if possible.

---

## 4. Topic clusters & internal links (site structure)

**Confirmed facts:**
- 2026 evaluates "topical authority" (how comprehensively/consistently you cover a theme), not individual keywords.
- Structure: a "pillar page (hub)" covering the broad theme + "cluster pages (spokes)" deep on subtopics. All clusters link to the pillar; the pillar links to all clusters.
- Pillar target ~2,500–5,000 words, comprehensive. A thin pillar undermines the whole cluster's authority signal.
- "20 interconnected articles" consistently outranks "one 5,000-word guide" (power of coverage × internal linking).
- Internal linking is the "most underused ranking lever." Most teams chase backlinks and neglect in-domain link equity.
- Anchor-text mix guideline: exact-match 15–25%, partial 30–40%, semantic variants 25–35%. Avoid generic anchors ("click here" / "read more") — no topical signal.
- ~2–5 contextual internal links per 1,000 words of body is a practical baseline. Keep total page links (incl. nav/footer) under 150 to avoid PageRank dilution.
- Hub-and-spoke internal linking also raises AI-engine citation rates (test example: 12% → 41%).

**Implication for this project:**
- The keyword pipeline's topic-cluster structure (category → pillar → cluster) and "② ③ → ① internal-link" policy fully align with this.
- Even at early launch (no revenue articles), build cluster internal links among information articles — the foundation for inserting revenue pillars later.
- Don't build thin pillars (comparison/recommendation revenue articles). Computing target word count from headline-API top averages is sound.
- Avoid generic anchors; use terms describing the destination's theme. Add this to the writing prompt.
- Ideally monitor per-article internal-link count and site-wide link density in the post-processing script.

---

## 5. Affiliate/review article SEO (for the monetization phase — preparation only now)

**Confirmed facts:**
- 2026 affiliate SEO fully shifted from keyword stuffing to genuine expertise and specific problem-solving.
- The decisive factor is Experience (first-hand). The core evaluation question is "did the author actually use the product?" Clear first-hand use → +15–25% visibility; spec-summary-only articles sink even if well-structured/keyworded.
- Penalized affiliate patterns: thin product reviews, keyword-stuffed comparison pages, content for search traffic rather than helping readers.
- Survivors/recoverers share: first-hand product experience, clear authorship/expertise, original research or data, content serving the reader's full decision process.
- A standalone single-product review has weak contextual authority and struggles to rank. Embedding it in a category-comprehensive cluster strengthens each page's signals (the cluster model solves this).
- Weaving PAA (People Also Ask) questions into the article / adding a closing FAQ captures extra rankings and rich results.
- Schema markup (structured data) is the "translation layer" letting AI engines understand product specs, Q&A, and author credentials. Beyond-basic implementation is recommended in 2026.
- New affiliate sites: initial traffic 3–6 months, real growth 6–12 months, substantial revenue typically 12–24 months.
- Titles like "Best [product] for [use] – 2026 Reviews" (benefit + year + keyword) help CTR.
- Seasonality (demand-spike timing) content/messaging is effective.

**Implication for this project (apply in the monetization phase):**
- "Mass-producing AI product reviews without first-hand experience" is the single most dangerous affiliate pattern in 2026. Before monetizing, decide how to substantiate first-hand experience for supplements/foods (actually try them / collect real user voices / use real data — fabricating experiences is prohibited).
- Don't place single-product reviews (③ long-tail) standalone; embed them in clusters under the category pillar (① revenue). Matches the structure design.
- FAQ (from question-search) + structured data are especially effective on revenue articles. Repurposing the writing prompt's FAQ output as schema is sound.
- Prepare a revenue-article title template with year/benefit/use for the monetization-phase prompt.
- Keep revenue-timeline expectations realistic (substantial revenue is a 1–2 year horizon). Monetizing at 3 months means "start adding paths to articles whose foundation is set," not full monetization.

---

## 6. Technical SEO & page experience

**Confirmed facts:**
- Core Web Vitals carry heavy weight for YMYL. Targets: LCP < 2.5s, INP < 200ms (INP replaced FID).
- HTTPS site-wide, no mixed-content warnings. An unencrypted health site signals "not handled with care."
- Mobile-first. Most health searches are mobile.
- Logical site structure (organized by theme/condition/category) for crawlability.
- Implement structured data (schema) comprehensively.
- 2026 priority order: first technical blockers (indexing, CWV, duplicates) → then intent match + E-E-A-T content → then authority (links, brand). This mirrors Google's filter order.
- Check Search Console weekly to catch early warnings (impression drops, CTR changes, coverage issues).

**Implication for this project:**
- At build time, ensure HTTPS, mobile support, speed, and clean URL structure from the start. A prerequisite, like content quality.
- Beyond FAQ structured data (already output by the writing prompt), have Codex consider Article/Person schema.
- Monitor via Google Search Console (per the earlier conclusion: better than Rakko's rank checker early on, since it gives real first-party data for the whole site). Review impressions/CTR/coverage weekly.
- Invest in tech → content → authority order. Being a new domain, links/brand come later — correct.

---

## 7. Content quality & engagement

**Confirmed facts:**
- Content quality remains the most important ranking factor: informative, relevant, valuable to the user.
- Google understands the *meaning* behind queries, not exact-match phrases. Keyword stuffing backfires.
- Engagement signals (CTR, dwell time, scroll depth, repeat visits) inform "is this actually helpful."
- Whether the user is fully satisfied after reading (vs. needing to keep searching) feeds evaluation.
- 2026 weighs the *quality of the experience* over how much you publish.
- Conclusion-first (PREP), unpacked phrasing, mobile-first readability reduce bounce (aligns with the project's writing rules).

**Implication for this project:**
- Building articles that "fully satisfy search intent" one at a time (quality over quantity) is correct. Keep the writing prompt's conclusion-first / unpacked / mobile-first rules.
- Enforce no keyword stuffing (already in the writing prompt). Weave co-occurrence terms naturally.
- After publishing, use Search Console to find articles with impressions but no clicks (title/description improvement room) per query.

---

## 8. Implementation/operations checklist for Codex

Additions/strengthening to the existing Codex prompts (keyword selection / article mass-production):

- [ ] Mass-production prompt: strengthen the instruction to avoid generic phrasing and include concrete/specific info (numbers, steps, usage) — scaled-content-abuse defense.
- [ ] Mass-production prompt: vary structure per article type; avoid near-duplicate mass output.
- [ ] Operations: do NOT full-auto-publish; require an NG-check + spot-human-review step (the existence of editorial review helps avoid penalties).
- [ ] Site build: create operator-info / editorial-policy / contact pages before articles. Make HTTPS, mobile, speed, clean URLs a prerequisite.
- [ ] Site build: have Codex design structured data (Article / Person / FAQ schema).
- [ ] Early keywords: prioritize ③ long-tail (low difficulty × demand) — sandbox exit.
- [ ] Internal links: build cluster internal links among information articles from the start. Anchors describe the theme, not generic. 2–5 per 1,000 words, total under 150.
- [ ] Monetization phase (later): embed single-product reviews in clusters under category pillars. Decide first-hand-experience substantiation in advance (no fabrication). Revenue titles use year/benefit/use.
- [ ] Monitoring: review Google Search Console weekly (impressions / CTR / coverage / rank). Register the property + submit a sitemap at launch.
- [ ] Expectations: new-domain YMYL trust-building can take 9–12 months. The 3-month mark is "foundation complete → start adding paths," not full monetization.

---

## 9. Sources (pages reviewed)

Ranking factors (2026): backlinko.com/google-ranking-factors, causalfunnel.com, optinmonster.com, clickrank.ai, seo.co, vazoola.com, quadcubes.com, servicensure.com
YMYL/E-E-A-T: imarkinfotech.com, koanthic.com, nihalps.in, outpaceseo.com, rankved.com
New domain/sandbox: breaklineagency.com, link-assistant.com, searchlogistics.com, seomator.com, inqnest.com, restorationmarketing.com, dash-seo.com, wellows.com, strategicwebsites.com
AI/mass-produced content: medium.com (makarenko.roman), icoda.io, digitalapplied.com, edgeblog.ai, pravinkumar.co, jsonhouse.com, thehumanizeai.pro
Topic clusters/internal links: library.linkbot.com, brafton.com, embedpress.com, fuelonline.com, digitalapplied.com, ideamagix.com, digitalpilots.in
Affiliate SEO: bluehost.com, digistore24.com, affiversemedia.com, hostinger.com, affiliateshelp.automattic.com, mangools.com, topicalmap.ai

> Note: the above are mostly secondary SEO sites. Cross-check Google's primary sources (Search Central / Quality Rater Guidelines). SEO mixes speculation and confirmed fact; let your own first-party data (Search Console) be the final arbiter.
