# Content Engine — Agent Orchestration Brief

## Build status (updated July 27, 2026)

> ***Corrected August 14, 2026 — this section header and the two status lines below described an engine that has been running on cron since August 4.*** *The header said "updated July 27, 2026" and had not been touched since; the line at the end of this section read* **"Still not built: the `content` Postgres database and the five agents"**; *and the status line under it read* **"Status: design (with Phase 0 partly built — see above)."* ***All three were wrong for ten days.*** *The engine is LIVE, and Iván describes the working chain as* **research → his approval → the writer → his approval → the translator** *(Aug 14, 2026) — five stages, two of them human gates, which is the pipeline §2 designed. `automation/content-engine/` holds `schema.sql`, `research_agent.py`, `writer_agent.py`, `notify.py`, `run-agent.sh` and `admin_service/`; both agents plus translation have been on cron since Aug 4; the approval surface runs at `/admin/ideas` and `/admin/drafts`, and Iván's own-idea form was deployed and confirmed Aug 13. Deployed state is owned by `automation/content-engine/SETUP.md`, which was corrected Aug 13 — this file was not, so the correction landed in the file nobody opens and missed the one the project index calls "the status-driven content pipeline design."* ***Same failure mode as the Aug 13 `SETUP.md` incident, one file over.*** *What it was blocking: anyone deciding whether to build distribution on top of the engine (`open-loops.md`: "Distribution for the content engine — the unbuilt half") read "still not built" here and had no reason to continue.*

**Phase 0 is underway.** The Eleventy build step shipped and is live (see `ai-infrastructure-documentation.md` §15), which was the hard prerequisite for a blog existing at all. On top of it:

- **Blog structure is live**: `/blog/` (ES), with `/en/blog/` and `/pt/blog/` reserved. Article URLs are slug-only, no dates. Articles are ordinary pages, so they inherit nav, footer, analytics and the `transKey` hreflang machinery automatically.
- **`site/_data/plans.js`** loads the ~~381-row~~ **328-row** plan inventory at build time *(corrected Aug 14, 2026 — 381 was the row count on July 27. The catalogue is 328 published plans, ES 164 / EN 111 / PT 53, and since Aug 12 every inventory row is published, so rows and published plans are the same number. Owner: `data/training_plans_inventory.csv`.)* and exposes the linkable plans, excluding duplicate rows and expired links. *(Corrected Aug 2, 2026 — this line previously said it also excluded "the 6 known-404 IDs." Those never existed: the July 27 full link check returned 323 OK / 0 dead. See the link-status bullet below.)*
- **The `planCard` shortcode implements the brief's core monetization rule mechanically**: an article names a plan by `plan_id` and never contains a URL. Name, price, duration, metric and link are all joined in from the inventory. **Referencing an unlinkable plan fails the build** — verified by deliberately referencing the dead `434680` and confirming a non-zero exit.
- **First article published in all three languages, live July 27, 2026**:
  - ES `/blog/como-elegir-tu-plan-de-maraton/` — 4 questions, 9 plans
  - EN `/en/blog/how-to-choose-a-marathon-plan/` — 4 questions, 9 plans
  - PT `/pt/blog/como-escolher-seu-plano-de-maratona/` — **3 questions, 9 plans**
- **These are not translations, and that's the model to follow.** The PT article is a different, shorter piece because the PT catalog is different: only 1 of 15 marathon plans is pace-based, so "which metric do you train by?" isn't a real question there. Prices differ too (US$24–39.99 vs US$49.99–59.99), so the All-Access maths is rewritten. The writer agent's contract must be *"same intent, adapted to this language's actual inventory"*, not *"translate this."*
- **hreflang verified working three ways** on real translated content — every article and every listing emits all four tags and the language switcher moves between equivalent pages. This is the mechanism the whole Eleventy build step was justified by, now proven.
- **Link status is measured, not maintained in prose** — `automation/check-plan-links.py` runs it and the site build consumes the result. The last full check (July 27, 2026) returned every published plan OK, 0 dead. *(Rewritten Aug 8, 2026: this bullet used to spend three sentences debunking a dead-links claim that had already been disproven. Restating a retired claim in order to deny it keeps it alive — the denial is what the next reader quotes. Deleted rather than corrected.)*

**What the research pass found (Agent 1's job, done by hand):**
- Marathon is the deepest inventory — 68 published plans, 35 ES / 18 EN / 15 PT. Only distance with genuine depth in all three languages.
- **Portuguese is far thinner than this brief assumed**: 65 plans total, effectively only marathon (15), 5k (5), and 10k/21k/FTP (3 each). Zero PT plans for Weight Loss, Olympic, HYROX, Duathlon or Strength. PT content must stay inside those five distances or it points at inventory that doesn't exist.
- **Weight Loss is the English-skewed category** — 42 plans, 28 EN vs 14 ES, 0 PT. Best fit for the EN "rank → sell → affiliate" track.
- Median weekly training hours from 23 crawled marathon plans: Base ≈ 6, Build ≈ 8, Peak ≈ 9 h/wk.

**Real problem surfaced by doing this:** the 18-week Beginner heart-rate marathon plan (`434680`) is marked published but 404s, so that branch of the decision tree has nothing buyable behind it. Exactly the failure the `content_links` design in §2 exists to catch — it just showed up before the automation did.

~~**Still not built:** the `content` Postgres database and the five agents. Everything above is the substrate they'll operate on.~~ ***Struck August 14, 2026 — false since August 4.*** *The `content` database exists (`automation/content-engine/schema.sql`, plus the `ideas_awaiting_draft` and `approved_unpublished` views added Aug 12) and the research and writer agents run on cron, with the publish step firing over the n8n webhook. Of the five agent contracts in §2, those are live; the rest are the genuinely unbuilt ones. Do not read the struck sentence as current.*

---

~~**Status:** design (with Phase 0 partly built — see above). Written July 26, 2026.~~ **Status: the engine described here has been LIVE on cron since August 4, 2026.** *(Corrected Aug 14, 2026 — the struck line was written July 26 and never revised. This document is the **design**; **deployed state** is owned by `automation/content-engine/SETUP.md` and open items by `open-loops.md`. A status line here is a third copy of that state, which is exactly why it drifted.)*
**Belongs in:** `triaperformance-docs` repo.
**Related:** `growth-roadmap.md` (pillar 2, "Social/content agent"), `ai-infrastructure-documentation.md` §8–13, `brand-guidelines.md` §8 (voice), `growth-roadmap.md` §Training Plan Storefront.

---

## 1. The reframe: orchestration is a database, not a conversation

The intuitive mental model — five agents that hand work to each other like a relay team — is the wrong one, and it's the model that makes these systems fail. Agents talking to agents is an expensive game of telephone: context degrades at every handoff, there's no way to inspect where something went wrong, and a failure in step 3 means re-running steps 1 and 2.

What actually works is the pattern **you already built for leads**. Twenty holds a Person row with a `leadStatus` field. n8n workflows read rows in a given status, do one narrow thing, and write the row forward to the next status. Hermes handles the one step that needs judgment. Nothing "orchestrates" anything — the status field is the orchestrator.

The content engine is the same shape:

```
content_pieces.status:

IDEA_PROPOSED ──▶ IDEA_APPROVED ──▶ DRAFTED ──▶ LINKED ──▶ DRAFT_APPROVED
     │                                                            │
     ▼                                                            ▼
IDEA_REJECTED                                    SCHEDULED ──▶ PUBLISHED ──▶ MEASURED
                                                                                 │
                        ┌────────────────────────────────────────────────────────┘
                        ▼
              feeds back into the research agent's next run
```

Each of your five "agents" is a job that owns exactly one transition. It reads rows in status X, does its one thing, writes status Y. That means:

- Every step is independently testable with a fixed input row.
- A failure parks the row in its current status instead of killing the pipeline.
- You can look at the table at any moment and know exactly what's in flight and where.
- Any step can be swapped from LLM to script (or vice versa) without touching the others.

This is also the direct answer to your infra doc's **Problem #7** — the July 17 session where Hermes narrated success while producing broken code. The standing lesson there was: narrow the agent's job to *calling* tested logic, not authoring it. A status-driven pipeline enforces that structurally rather than by instruction.

---

## 2. Data model

A new `content` database on the existing `analytics-postgres` container — same "own lane, same container" pattern as `analytics`, `storefront`, and `members`.

| Table | Purpose |
|---|---|
| `content_ideas` | One row per proposed topic. Language, target query, search evidence, intent, rationale, proposed plan/affiliate mapping, status, decided_at. |
| `content_pieces` | One row per actual piece. FK to idea, language, format, title, slug, body, model used, word count, status. |
| `content_links` | **One row per outbound link inside a piece.** link_type (plan / affiliate / lead_magnet / internal), target_id, resolved URL, UTM, anchor text. |
| `content_distribution` | One row per piece × channel actually published. external_id, permalink, published_at. |
| `content_performance` | Time series. distribution_id, metric_date, source (GA4 / GSC / IG / GBP / pixel), impressions, clicks, position, sessions, plan_clicks. |

**Why `content_links` is a separate table and not just prose.** You already have 8 rows with `link = "Expired"` in the inventory, and TP can unpublish a plan at any time without telling you. *(Corrected Aug 2, 2026, and the citations deleted outright Aug 8, 2026: this paragraph used to lean on two findings that had already been closed in July. Naming them again — even to explain that they're closed — is what kept them circulating. The argument for a links table stands on its own without them.)* If plan URLs live only inside article text, a TP-side unpublish silently rots links across the whole blog and you find out from a reader, or never. With a links table, a nightly checker HEADs every live link, flags the dead ones, and — because it knows the `plan_id` — can propose the replacement plan from `plans_raw`. That's a self-maintaining affiliate/plan surface, which is the whole premise of the "agent-generated affiliate pages" priority in the roadmap parking lot.

---

## 3. The five roles, as contracts

For each: what goes in, what comes out, what runs it. "Runtime" follows your execution-ownership principle — n8n for deterministic, an LLM for judgment, and nothing recurring on a Claude scheduled task.

### Agent 1 — Research / ideation

**Runs:** weekly, n8n schedule trigger → LLM call with a deterministically assembled prompt.
**In:** GSC query data (impressions high / position 8–25 = the ranking-adjacent opportunities), `plan_views_clean` (which plans get views but not sales — a content gap, not a product gap), `plans_raw` catalog, `methodology.md`, `social-proof-and-reviews.md` quote bank, last 90 days of `content_performance`, plus a web search pass on seasonal/race-calendar timing.
**Out:** N rows in `content_ideas`, each with a target query, a stated reason it should rank, which plan_ids it maps to, which affiliate category it maps to, and the language.
**Status transition:** — → `IDEA_PROPOSED`

This is the highest-leverage agent and the one worth over-investing in. Most content agents guess at topics from general knowledge. Yours can be grounded in **proprietary data nobody else has**: 12 months of real plan-view volume across 386 plans, real sales history, a documented methodology, and real athlete cases. An idea backed by "plan 439201 gets 340 views/month and converts at half the catalog average, and no article on the site targets its query" is categorically better than an idea backed by "marathon nutrition is a popular topic."

### Agent 2 — Writer

**Runs:** on demand when ideas get approved. n8n assembles the prompt, HTTP node calls the model API directly.
**In:** one approved idea row + `brand-guidelines.md` §8 (voice) + relevant `methodology.md` sections + real testimonials for that language + a **candidate list of plan_ids with their real URLs** pulled from `plans_raw`.
**Out:** draft body, title, slug, meta description, suggested image brief.
**Status transition:** `IDEA_APPROVED` → `DRAFTED`

Two design rules that matter more than the prompt:

1. **Never let the model generate a URL.** It selects from the candidate list by `plan_id`; n8n joins the real URL in afterward. Hallucinated plan links are the single most damaging failure mode here — they're invisible in review and they cost sales.
2. **Write natively per language, don't translate.** Brand guidelines already require this, and it's also the SEO-correct answer: EN and PT articles should target queries real English and Portuguese speakers type, which are not translations of the Spanish ones. Same agent, three separate runs, three separate keyword inputs.

**Model choice — a real recommendation, not a default.** Do not run this on Hermes/Gemini 3.5 Flash. Your own infra doc documents flash-tier's weakness on sustained reasoning, and long-form brand-voice writing is exactly that class of task. Call a stronger model directly from n8n for the writer, and keep Hermes for the short-form, high-frequency, low-stakes steps. At ~4 articles/week the cost difference is roughly $10–30/month — irrelevant next to the quality difference.

### Agent 3 — Monetization pass

**Runs:** immediately after the writer, same n8n workflow.
**Status transition:** `DRAFTED` → `LINKED`

You guessed this is probably the same as the writer. Half right — it should be the same *workflow* but split into two passes, because it's two different kinds of problem:

- **Deterministic half (n8n, no LLM):** which plan_id → which URL → which UTM → which affiliate tag. This is a database join. An LLM adds only the ability to get it wrong.
- **Judgment half (LLM):** where in the article does an offer actually belong, and how is it phrased so it reads as a recommendation and not an ad. That's genuinely a writing decision.

Also enforced deterministically at this step: a link budget (e.g. max 1 plan CTA + 1 lead-magnet CTA + 2 affiliate mentions per article), affiliate disclosure inserted automatically per language, and every link written to `content_links` so it's auditable later.

**Prerequisite, not yet in place:** there's no affiliate program in the docs yet. Amazon Associates is the obvious base layer and requires 3 qualifying sales within 180 days of approval — so apply *before* the engine is built, not after, or the clock runs out during the build. Brand-direct programs (shoes, nutrition, wearables) generally pay better and are worth a second pass once traffic exists.

### Agent 4 — Publisher / distributor

**Runs:** scheduled, per channel.
**Status transition:** `DRAFT_APPROVED` → `SCHEDULED` → `PUBLISHED`

This is the one people assume is one agent and is actually four adapters with very different difficulty. Ranked by how quickly each can realistically ship:

| Channel | Mechanism | Friction |
|---|---|---|
| **Blog** | Write file into `website/`, commit, push. Existing 6am cron pull + rsync deploys it. | **None.** You own the whole path. Build this first. |
| **Email** | Existing n8n + Gmail SMTP, same credential as the nurture sequence. | **Near none.** Owned channel, list already exists. |
| **GBP** | Google Business Profile API | **Medium.** API access requires an approved application; allow weeks, not days. |
| **Instagram** | Meta Graph API, two-step (create media container → publish) | **Medium.** Requires a Business account linked to a Facebook Page, and images must be at a public URL — which your own site can serve. |
| **LinkedIn** | `w_member_social` scope | **High.** Needs app review, frequently denied for solo use. Recommend: agent drafts, you paste. Manual posting of a pre-written post is ~30 seconds. |

The blog is the hub and everything else is a derivative of it. That ordering isn't just convenience — it's the only channel where the asset compounds and where you own the audience relationship.

### Agent 5 — Feedback loop

**Runs:** nightly (pull metrics) + monthly (synthesis).
**In:** GA4 via the existing BigQuery export, GSC (needs the Search Console API — the current GSC↔GA4 link is reporting-level only, no data flows), IG insights, the plan-view pixel, Clarity (manual only — no export exists).
**Out:** rows in `content_performance`, plus a monthly written synthesis.
**Status transition:** `PUBLISHED` → `MEASURED`

**The critical bit that most builds skip:** this agent must write its conclusions somewhere Agent 1 reads on its next run. Otherwise you've built a dashboard, not a loop. Concretely — the research agent's prompt includes "here are the 10 best-performing and 10 worst-performing pieces of the last 90 days, with their target queries and formats." That single input is what turns five scripts into a system that gets better.

Also worth running here: the dead-link checker over `content_links`, and a nightly re-check of `plans_raw` publish status.

---

## 4. Language × channel matrix

Your answer implies two structurally different products, and they should not share a pipeline:

**Track A — Triathlon/running content (the business)**

| | Blog | Instagram | GBP | Email |
|---|---|---|---|---|
| **ES** | ✅ primary | ✅ | ✅ | ✅ |
| **EN** | ✅ SEO → plans + affiliate | ✗ | ✗ | ✅ |
| **PT** | ✅ SEO → plans + affiliate | ✗ | ✗ | ✅ |

EN/PT are pure acquisition surfaces: rank → send to a plan → earn affiliate revenue. No community management, no engagement expectation, no social overhead. That's the right call — it keeps the ongoing time cost of two extra languages near zero.

**Track B — LinkedIn, "running a one-person business on AI" (English, personal)**

This looks like a side interest but it's actually top-of-funnel for two revenue lines already in the roadmap parking lot: white-labelling the AI Coach to other coaches ($50–100/mo each), and selling the deploy blueprint as a $1–3k productized setup. Those products need an audience of solo coaches and operators, and LinkedIn is where that audience is.

Critically: **the content already exists.** `ai-infrastructure-documentation.md` is a 13-section build log with real incidents — the Docker loopback bug, the Google Cloud false-positive closure, the n8n `$json.length` bug, the credential leak and what changed after. That's specific, non-generic, hard-to-fake material and it's already written. This track needs no research agent at all in phase 1; it needs an agent that reads the build log and cuts posts out of it.

**Two channels worth adding that you didn't list:**

- **Email newsletter** — you already have the list, the SMTP credential, and n8n. It's the only channel where reach isn't rented. Basically free to add.
- **Pinterest** — genuinely strong for evergreen fitness content in ES/PT, fully API-publishable, and repurposes article images at near-zero marginal cost. Flagging as a maybe, not a recommendation — worth a test once the blog is producing.

Not recommended: YouTube/Shorts (video time cost breaks the calendar-decoupling premise), Reddit (manual, reputational risk), Strava (perfect audience fit, no posting API).

---

## 5. Batch approval

Your instinct to batch is right. The design detail that makes it work is **what the approval unit is.**

If the unit is "a post," 10 articles across 3 languages plus IG, GBP and email derivatives is 40+ approvals per batch and you'll stop doing it by week three. So:

**The approval unit is a content package** — one article plus every derivative generated from it. Approve the article, and its IG carousel, GBP post and email blurb ride along. Reject the article and the whole package dies before anything is written.

**Two gates, not one:**

- **Gate A — ideas.** 20 one-line ideas, approve/reject. Takes about 60 seconds and it's the cheapest possible place to kill work. Nothing gets written until you've passed this.
- **Gate B — drafts.** Full packages, with an edit box. This is where the real time goes.

**Where it happens:** not Telegram. Telegram is right for one-tap lead statuses; it's wrong for reviewing 10 long-form articles. Build a small approval page under the existing `/members/`-style auth pattern — a Flask service bound to `127.0.0.1`, gated by Caddy, exactly like the auth service you already shipped. Table of drafts, expand to read, approve / reject / edit, and a "approve all remaining" button. Writes straight to Postgres, which flips the status and releases the publisher.

**A quiet benefit of batching:** your edits at Gate B are training data. Diffing approved-final against agent-draft, month over month, tells you exactly where the writer agent's prompt is wrong. Store both versions.

---

## 6. Cadence — an honest reality check

You asked whether 10 posts per 14 days is too aggressive. Two separate answers:

**On volume: it's not the binding constraint.** Generation is free, and package-level approval keeps your time flat. You could physically do 10.

**On quality: yes, start lower.** 10 articles per fortnight is ~260/year. At that rate, three languages deep, an LLM writer drifts toward competent generic SEO content — which is precisely the category Google's helpful-content systems are built to suppress. You'd be spending real money to build a large, undifferentiated asset.

The moat here isn't volume, it's that you can write things nobody else can: what 386 plans and 12 months of view data actually reveal about how athletes choose a plan, real athlete cases from `methodology.md`, actual testing protocols. That content takes the same agent time and ranks far better.

**Recommended starting cadence — 5 packages / 2 weeks:**

| Language / track | Packages per fortnight |
|---|---|
| ES blog (+ IG + GBP + email derivatives) | 2 |
| EN blog (SEO → plans/affiliate) | 1 |
| PT blog (SEO → plans/affiliate) | 1 |
| LinkedIn (AI/solo-business track) | 1 |

Then **let the feedback agent authorize the increase**. If after 90 days the ES articles are actually earning impressions and driving plan clicks, double it. If they're not, volume would only have multiplied the problem. That's the same data-first posture you applied to the storefront analysis.

**And before any of it: publish what already exists.** Per the roadmap's own "distribution over creation" principle, there's months of zero-creation content sitting idle — 9 unused GBP reviews (≈9 weeks of weekly testimonial posts, plus a recyclable back catalog of 36 already posted; *counts corrected Aug 2, 2026 — this line previously said 10 never-posted ≈ 2.5 months*), 6 built calculators/routines, 3 lead-magnet PDFs, 386 plans with weekly-breakdown data, and the whole infra build log for LinkedIn. The first agent to build is arguably not a writer at all. It's a scheduler that drips out assets you already own.

---

## 7. Build phases

Each phase ships a durable asset — per the standing rule from `memory.md` that infrastructure learning for its own sake is an anti-pattern.

**Phase 0 — Do it manually once.** No agents. Create the `content` database and tables. Then take one Spanish article from idea to published to measured entirely by hand, writing every row yourself. This is not busywork: it's how the input/output contract of every agent gets defined by reality rather than by guess. Everything you have to invent to complete it manually is a field you'd otherwise have discovered missing in month three.
*Asset: the schema, and one published article.*

**Phase 1 — Distribution of existing assets.** n8n workflow that drips the unused GBP reviews (9 as of Aug 2, 2026, replenished by the ongoing ask cadence) and the existing tools/lead magnets to IG and email on a schedule — **not** to GBP, where quoting a review back is redundant to the same visitor and burns a monthly post slot (decided Aug 2, 2026, see `social-proof-and-reviews.md`). No LLM in the path beyond caption formatting.
*Asset: an active publishing cadence with zero creation cost, and a working IG/GBP API integration proven before it matters.*

**Phase 2 — Research agent + Gate A.** Weekly idea generation grounded in GSC + plan-view data. Approval page, ideas only. You still write the articles (with Claude's help, as now).
*Asset: a topic pipeline you'd want even if you never automated the writing.*

**Phase 3 — Writer + monetization pass + Gate B.** The full drafting path. ES only at first; add EN/PT once ES output is consistently passing review without heavy edits.
*Asset: draft-to-approval throughput.*

**Phase 4 — Blog publisher.** Git-based, fully owned path. Then email. Then GBP/IG for ES packages.
*Asset: end-to-end automation for the channel that compounds.*

**Phase 5 — Feedback agent and the loop closure.** Nightly metric pulls, dead-link checker, monthly synthesis wired back into Phase 2's prompt.
*Asset: the thing that makes it a system instead of a content farm.*

**Parallel, whenever:** LinkedIn track. It's independent of all of the above, needs no research agent, and its raw material is already written.

---

## 8. What breaks

| Risk | Mitigation |
|---|---|
| Hallucinated plan/affiliate URLs | Model selects `plan_id` from a supplied list; n8n joins the URL. Never generated. |
| Plans get unpublished on TP, links rot silently | `content_links` + nightly HEAD checker + `plans_raw` status recheck. Link status is measured by `automation/check-plan-links.py`, not maintained in prose — the last full check (July 27, 2026) returned 323 OK / 0 dead. |
| Voice drift into generic SEO copy | `brand-guidelines.md` §8 in every prompt; diff approved-vs-draft monthly; hard ban list (no "unlock", "crush", no exclamation marks). |
| Batch approval fatigue → rubber-stamping | Gate A kills bad work before it's written; keep the batch at 5 packages until edits are consistently light. |
| Flash-tier model producing plausible-sounding wrong training advice | Use a stronger model for the writer. `methodology.md` as grounding. The AI Coach red lines apply to public content too — no injury/medical claims. |
| Volume without differentiation | Cadence gated on measured performance, not ambition. |
| Meta/Google API access denied or revoked | Blog + email are owned and unrevokable. Treat IG/GBP/LinkedIn as rented reach, never as the primary asset. |
| A silent n8n bug ships nothing while reporting success | You've hit this exact failure twice already (the `$json.length` bug, the empty IMAP filter). Every workflow gets a real end-to-end test with mock content before going Active. |

**Running cost estimate:** roughly $15–40/month at the recommended cadence (writer model calls dominating; research and repurposing are cheap). No new infrastructure — it rides on the VPS, Postgres, n8n and Caddy you already run.

---

## 9. Open decisions before building

1. **Affiliate programs** — nothing exists yet. Which programs, and apply now (the Amazon 180-day clock argues for starting the application before the build).
2. **Instagram account type** — is it currently a Business account linked to a Facebook Page? Graph API publishing requires it.
3. **LinkedIn track identity** — personal profile, or a separate brand? Affects whether it's genuinely separable from Triaperformance later.
4. ~~**Blog architecture** — the site is currently hand-written static HTML. 100+ articles across 3 languages needs at least a build step (markdown → HTML with hreflang). Worth deciding before article #1, not article #40.~~
5. ~~**Where the blog lives in the site IA** — `/blog/`, `/es/blog/`, subdomain? Affects hreflang and the storefront SEO plan.~~
6. ~~**Does content sit inside or outside the paywall** — presumably outside (it's acquisition), but the tools library is inside. The boundary should be explicit.~~

*Items 4, 5 and 6 closed August 12, 2026 — all three were **settled by the Eleventy build**, not by a decision taken in this list, which is why they sat here reading as open long after they had answers. Flagged as struck in `open-loops.md` on Aug 8; struck properly here today.*

- **4 — decided: Eleventy.** The premise ("the site is currently hand-written static HTML") stopped being true at the cutover. Markdown → HTML with a real build step exists; hreflang is emitted automatically from the `transKey` front-matter field rather than hand-maintained per article. Detail: `website-build-cutover-runbook.md`.
- **5 — decided: `/blog/` for Spanish, `/en/blog/` and `/pt/blog/` for the other two** — matching the public site's language-prefix convention, with Spanish unprefixed at the root. Not a subdomain. *(Note the deliberate contrast with the members area, which uses language as a path **segment** — `/members/en/` — so that one Caddy auth tree covers all three. Public site prefixes, gated area segments; both are correct for their own reason. See `open-loops.md` NOW.)*
- **6 — decided: content sits outside the paywall, tools inside.** The boundary is exactly the one already enforced in Caddy: `/blog/*` is public and indexable, `/members/*` is gated and `noindex, nofollow`. Articles are acquisition and are supposed to be crawled; the tools library is the thing All-Access is actually selling.

**Items 1, 2 and 3 above remain genuinely open** — affiliate programs is tracked as NEXT #9 in `open-loops.md`, Instagram account type and LinkedIn identity are parked in LATER. Do not strike those.
