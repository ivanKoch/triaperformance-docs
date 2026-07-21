# Triaperformance — Growth Roadmap & Systems

## The five pillars
Revenue streams, growth infrastructure, the athlete context system, coach-hire leverage, and guardrails. Each is also a natural frame for a dedicated conversation in this project.

### 1. Revenue streams
See `business-overview.md` for numbers and `pricing-and-positioning.md` for how pricing actually works. The near-term opportunity is distribution, not creation — Plans, All-Access, and the lead magnets are built and under-promoted.

### 2. Growth infrastructure

**Website** — being rebuilt from scratch off HubSpot. Requirements: self-manageable with AI (Iván builds, edits, and hosts it himself, with Claude and Hermes doing the heavy lifting), multi-language from the start (Spanish/English/Portuguese — prioritized because it drives traffic to the existing 300 plans), supports a paywall, and hosts the tools library plus a gear/affiliate page. Likely architecture: a code-based site — not a no-code builder like Webflow or Framer, since those live behind a proprietary editor that isn't directly AI-editable — in a git repo, hosted either on the same Hostinger VPS that already runs Hermes, or on Vercel/Netlify via git push. And a per-page, per-language testimonials section sourced from `social-proof-and-reviews.md` (English/Portuguese pages currently blocked on review inventory: 3 EN / 0 PT).

*Instrumentation — live July 21, 2026:* GA4 and Google Search Console are on the site and linked to each other; GA4's BigQuery export feeds the same GCP project as the TrainingPeaks plan-view pixel. That pixel had a 20-day outage (Jun 30–Jul 21) traced to a Google Cloud billing/account-closure issue, now fixed and now also synced nightly into a dedicated Postgres instance on the VPS — see `ai-infrastructure-documentation.md` §9 and `plan-storefront-project-brief.md` for the full incident. This VPS Postgres instance (`~/.analytics`) is the first concrete piece of the "VPS Postgres as analytics warehouse" idea — pixel hits today, GSC pulls / sales CSVs / email signups planned next, same instance or same pattern. Also added same day: Microsoft Clarity (heatmaps/session recordings, linked to GA4), Bing Webmaster Tools and Ahrefs Webmaster Tools (both via one-click GSC import). Parked deliberately: Rich Results Test (no setup needed, use once plan pages ship Product schema) and Umami (only worth it if GA4's UI becomes a friction point).

**CRM / lead pipeline** — migrating off HubSpot, starting July 16, 2026. Current flow: TrainingPeaks emails a CoachMatch lead → a Claude scheduled task (`trainingpeaks-leads-to-hubspot`, runs daily 8:01am) parses the email, creates a HubSpot contact, and outputs a 1-click pre-filled WhatsApp link Iván uses most days → a HubSpot workflow separately sends a 3-email nurture sequence → manual WhatsApp follow-up.

*Why migrating now, not later:* HubSpot access is a free enterprise-tier employee account through Iván's girlfriend's employer. She's job-hunting and will leave eventually, at which point access disappears with no notice window. Decision: migrate now rather than wait for a deadline, since the website migration is already done and the CRM is the next natural step while he's focused on this build full-time.

*Decision: self-hosted Twenty CRM*, Docker-deployed on the same VPS as Hermes and the website — free, owns the data, and ships a native MCP server so Claude/Hermes can query and update leads directly as a tool rather than through a workaround API. Chosen over EspoCRM (more turnkey, less AI-native), Airtable (zero-deploy but 100 automations/month + 1,000 API calls/month on the free tier, tight against n8n's write volume), and paid CRM SaaS (same vendor-dependency category as HubSpot, just smaller).

*HubSpot audit findings (via live HubSpot MCP connection, July 16, 2026):*
- **2,073 total contacts**, far more than active CoachMatch flow alone — includes historical leads from what looks like a past Meta/Facebook Lead Ads campaign (properties `para_qu_deporte_ests_buscando_asesoramiento`, `te_interesa_contratar_coaching_11_o_comprar_un_plan_prediseado` are FB Lead Ads fields, not CoachMatch). Scope decision needed: migrate all 2,073, or just active/recent leads — open question for Iván.
- **92 deals**, pipeline "default", dealtype "Marketplace", amounts $14.99–$44.99 — this is TrainingPeaks Marketplace plan-sale tracking, a separate stream from the CoachMatch coaching pipeline, already using HubSpot's Deals object.
- Custom contact properties already in active use worth preserving in the new schema: `athlete_level`, `sport__primary_`, `sport__all_`, `lead_notes` (CoachMatch-specific), `customer_tier` (plan buyer vs. All-Access subscriber vs. 1:1 coaching athlete — directly answers the "track conversion by price point" gap), `etapa_de_nurturing` / `nurture_status` (two separate nurture-stage fields), `campaign_attribution`, `exclude_from_sequence`.
- Diagnostic: nearly all sampled recent contacts sit at `hs_lead_status = NEW` — leads are being created but not actively progressed through status stages after the initial WhatsApp outreach. Not a data-loss risk, but confirms the "track conversion" gap is real, not just a reporting gap.
- **Not migratable via API**: the 3-email nurture workflow's actual logic/content isn't accessible through the HubSpot MCP connection (workflows aren't exposed as a queryable CRM object, and the campaign-tools guidance came back empty). Needs Iván to describe or screen-share the sequence content/timing so it can be rebuilt in n8n.

*Migration plan:* deploy Twenty CRM → design schema from the audit above → rebuild `trainingpeaks-leads-to-hubspot` scheduled task against Twenty's API (same Gmail-parsing and WhatsApp-link logic, new CRM target) → recreate the 3-email sequence as an n8n workflow (pending sequence content from Iván) → migrate contacts (scope pending Iván's decision on historical vs. active-only) → website contact form wired through n8n into Twenty → cut over, decommission HubSpot.

*Status as of July 17, 2026:* n8n deployed on the VPS (Tailscale-only, no reverse proxy). The CoachMatch pipeline is live end-to-end against Twenty — IMAP Gmail trigger → dedupe check → creates the Person in Twenty → Telegram notification (same logic as before, new CRM target). The 3-email nurture sequence is fully rebuilt in n8n: email 1 fires immediately on lead creation, emails 2 and 3 run off a daily-scheduled workflow at +24h/+48h, gated on `leadStatus` staying at `MESSAGE_SENT` so a reply on any channel stops the rest of the sequence. Lead magnet PDFs (nutrition, mental prep, training zones) moved off HubSpot onto `triaperformance.com/guias/` as part of this. A Hermes-driven daily Telegram nudge is being set up next to close the WhatsApp side of that same reply-detection loop (Hermes checks Twenty for leads stuck at `MESSAGE_SENT`, pings Iván, updates status from his reply). Still running side-by-side with the old HubSpot flow — not cut over yet, since historical contact migration (2,073 contacts, scope decision still open) and full HubSpot decommission haven't happened.

*Execution-ownership principle, decided July 16, 2026:* recurring/repetitive operational work does not run as a Claude scheduled task going forward — it runs on the VPS (n8n for deterministic/mechanical work like parsing a fixed-template email and writing a CRM record; Hermes for anything that genuinely needs judgment, like drafting a nudge message). Claude's role stays design, one-off builds, and strategy. Concretely: the CoachMatch → CRM → WhatsApp-link pipeline moves to an n8n workflow with its own scoped, read-only Gmail access — not broad Workspace access, and not routed through an LLM for what is structured, deterministic parsing. The existing Claude scheduled task keeps running unchanged until the n8n replacement is built and verified, then gets retired. This same principle should apply when pillars 16/17/21 (Telegram publishing, content agent, artifact pipeline) get built.

Whatever replaces it tracks lead volume and conversion by month and price point from day one — that data didn't really exist in HubSpot despite the fields existing for it (see `customer_tier` diagnostic above).

**Tools library** — calculators and routines (carb-loading calculator, pace converter, threshold calculator, hip activation routine, yin yoga and kettlebell routines already built), built as Claude artifacts, migrated onto the new website. Claude-hosted artifact links are free and public by default with no gating mechanism — paywalling requires moving the code onto the owned site behind real auth. Natural to bundle behind All-Access rather than sell individually, which also gives All-Access a reason to grow past its current 2 subscribers.

**Plans catalog & plan-matching (added July 2026)** — Iván maintains a spreadsheet of all ~300 marketplace plans with per-plan parameters: duration in weeks, language, sport, difficulty, race distance, URL, etc. Exported as a CSV and dropped into the repo, this becomes the data source for a real Plans page — replacing the current placeholder in `brand-guidelines.md`'s page inventory ("links out to the 300 TrainingPeaks plans") with an actual dynamic, filterable catalog rendered from the CSV. Two matching layers, not mutually exclusive, sequenced by effort:
1. **Filter/dropdown controls** over the CSV's own variables (sport, race distance, duration, difficulty, language) — low effort, ships first, no AI dependency.
2. **AI plan-matching assistant** — a plain-language ask ("I want to run a marathon in 4 hours, I have 6 hours a week available") returns a recommended plan from the catalog. Same "Claude in artifacts calling the Anthropic API" pattern already scoped for the AI Coach product below, but scoped down to one-shot catalog matching rather than an ongoing coaching relationship — no adjustment logic, no red-line/medical scope to manage, much smaller build than the AI Coach.

Each plan page redirects to its TrainingPeaks purchase URL for now, same as today; managing pricing/checkout directly on the owned site is a later step, dependent on the paywall work below.

**Paywall** — build against the existing Stripe account (already used for TP Payments, under KOCH Ventures LLC, with a Mercury bank account behind it). Stripe Checkout plus a simple entitlement check is enough; no need for a third-party membership platform.

**Social/content agent** — research topics, draft posts, publish after approval. Feeds the lead magnets and Plans-focused SEO content specifically.
First recurring job: the 10 never-posted GBP reviews (see `social-proof-and-reviews.md`) — one testimonial post/week ≈ 2.5 months of zero-creation content.

**Hermes (VPS agent) — live, status: operational (set up July 2026).** Nous Research's open-source, self-hosted agent, self-hosted via Docker on a dedicated Hostinger KVM2 VPS (a plain, self-managed box — an earlier attempt on Hostinger's "Managed Hermes" packaged product was abandoned because it blocked external connections and general-purpose use). Running on Gemini 3.5 Flash (own funded Google AI Studio key, prepaid billing, no auto-reload by design). Reachable three ways, all sharing one instance, memory, and session history: Telegram (allowlisted to Iván only), a web dashboard, and the Hermes Desktop App on the MacBook — the latter two secured over a private Tailscale VPN rather than exposed to the public internet. Has file/terminal access, browser automation, cron scheduling, and persistent memory. Already synced to this same GitHub knowledge base (auto-pulled daily) and verified to correctly answer business questions grounded in these documents.

Not yet done: threading it into the live website once built (drafting content, updating pages, weekly SEO checks — keep command-approval mode on "ask," not "off," for anything touching the live site), and the Google Workspace / HubSpot MCP connections from pillar 3 below. The infrastructure itself is the finished part; what it *does* day to day is still mostly ahead. Full technical write-up: `ai-infrastructure-documentation.md`.

### 3. Athlete context system
The "coach who remembers everything" problem — the onboarding survey, WhatsApp nuance, and training history, kept current and actually used when planning the next block. Needed for Iván's own use today and as the handoff mechanism for a future hired coach, which means it should end up as a real system of record rather than documents living only inside this Claude project — even though Iván is its only user for now.

**Training data**: TrainingPeaks' direct API is gated to approved commercial/device developers, explicitly excludes personal use, and isn't currently accepting new partner applications. A third-party aggregator that already integrates TrainingPeaks — Terra API is the clearest fit, and has a free tier — is the more realistic path, and it solves the Garmin/Polar/Wahoo neutrality requirement automatically, since it reads through TrainingPeaks rather than any single device platform. Needs evaluation (data completeness, pricing at scale) before committing.

**WhatsApp**: the actual pain point is re-reading exported chats to reconstruct context — a data-processing problem, not a messaging problem. The WhatsApp Business API (built for outbound campaigns at volume) is a mismatch and real overkill for this. The near-term fix is a small tool that ingests a chat export and extracts/files the relevant facts into that athlete's profile automatically, removing the repeated manual re-prompting. Buildable now, no new accounts needed.

### 4. Leverage: hiring a coach
Applies to the Private channel only — CoachMatch cannot be delegated. Because the service is uniform rather than tier-differentiated (see `pricing-and-positioning.md`), onboarding a new coach doesn't require inventing a restricted scope — they'd deliver the same standard service Iván already does. Open questions before this is real:
- **Payout mechanics** — does TP Payments support a split payout to a second person, or does Iván collect the full amount and pay the coach separately?
- **Fit and framing** — be upfront with Private leads about who they'd actually be working with, rather than a bait-and-switch after signup.
- **Context handoff quality** — entirely dependent on pillar 3 above being genuinely good.
- **Pricing** — decided July 2026: $149 for all new sign-ups in both channels (see pricing-and-positioning.md). The ~$72/$72 split works from day one. Gate cleared.

### 5. Guardrails
Not "don't grow" — "don't let growth quietly become a second full-time job."
- No group or cohort programs — explicitly ruled out, too much work for the return.
- No training camps or races as a revenue line — high time-cost, the classic coach-scaling trap.
- Don't push CoachMatch acquisition harder before the CRM/lead pipeline exists to catch leads reliably.
- Keep the "don't chase weak leads" instinct — a lead that needs excessive convincing isn't worth the hours.

## New product idea: AI Coach
A real gap in the current ladder, between static Plans and human coaching: an AI-guided self-coaching product built on Iván's actual methodology — training frameworks, fueling strategy, coaching judgment — encoded as a system prompt and knowledge base an athlete chats against, not a generic AI wrapper. Realistic build path: the "Claude in artifacts" capability (an artifact that calls the Anthropic API directly, using Iván's own encoded methodology as the system prompt) makes this a buildable real product, not just a concept.

Positioning: likely $25–40/month, sitting below 1:1 coaching. A genuine new top-of-funnel — athletes who'd never pay $75–149 might pay this, with some fraction upgrading to real coaching later. Open questions: exact pricing, liability/disclaimer scope, and how much this risks pulling from paid coaching versus adding a genuinely new segment. The prerequisite work — actually documenting Iván's coaching methodology and frameworks — is now done, see `methodology.md`.

## Parking lot: solo monetization ideas beyond the current build (July 16, 2026)
A thought-experiment brainstorm — what else is viable as a solo operation (post-second-coach-hire), directly or indirectly monetizing this same AI infrastructure. Not sequenced into the roadmap yet; revisit once the current build (website, CRM, AI Coach) lands. Two items below are prioritized to start ASAP per Iván.

**Productized one-time outputs (no ongoing relationship, no marginal time per sale):**
- Automated race-report product — athlete connects TrainingPeaks/Garmin/Polar/Wahoo data via Terra, gets an AI-generated pacing/HR-drift/nutrition breakdown vs. goal splits. One-time $15–30.
- Cheap "readiness score" micro-subscription ($5–10/mo) — simplified branded CTL/ATL/TSB equivalent, priced under Runna ($19.99/mo) and TrainAsONE ($9.99/mo) comps.

**★ PRIORITY — start ASAP: Terra API integration, personal use first.** Iván is already using this Claude subscription as his own personal AI coach with good results, but isn't syncing his own training data via Terra yet. Plan: build it for himself first (self-test, prove the data pipeline and AI Coach quality with real synced data), then productize into the race-report / readiness-score ideas above once proven.

**License the infrastructure itself, not just the coaching:**
- White-label the AI Coach chatbot (methodology doc now done, see `methodology.md`) to other solo coaches, each running their own branded version. Comps checked: white-label coaching-app tooling runs $150–599/mo for less differentiated products (MyPTHub, FitFocus) — even $50–100/mo per coach is a real SaaS line and directly monetizes the Hermes/Claude build work already underway.
- Sell the deploy blueprint (git → Caddy → Stripe → auto-updating multi-language site) as a one-time $1–3k productized setup for other coaches stuck on expensive no-code builders.

**Content/authority plays — real money, but genuinely time-costly, not calendar-free:**
- Course built from the same methodology doc (double-dips the AI Coach writing work). One-time $99–299 via the new site + Stripe.
- ★ PRIORITY — start ASAP: Affiliate/gear recommendation pages, agent-generated. Once the website, the content agent, and the page-generation pipeline exist (pillars already planned — see Sequencing), auto-generating and maintaining affiliate recommendation pages becomes close to fully automatable. Iván flagged this as genuinely achievable passive income with AI doing the page creation and upkeep, not just a nice-to-have.

**Lower fit / worth a deliberate gut check, not a default yes:**
- A multi-coach roster/agency model beyond the single second-coach hire — quietly turns Iván into a manager rather than a solo operator; different business than the one being built here.
- Merch / physical fulfillment — skip, doesn't leverage anything already built.

## Sequencing (draft, not fixed — revisit as priorities shift)
1. Website content build-out + Plans catalog (CSV-driven) + paywall + multi-language. Website hosting itself is done (live on the VPS); this is now about real pages, not migration.
2. WhatsApp context tool — small, parallel, a quick win.
3. Hermes itself is live and ready (see pillar 2) — thread it into the website build from the start rather than bolting on after.
4. CRM cutover — historical-contact scope decision, then full HubSpot decommission.
5. Athlete context system (Terra API evaluation + the TrainingPeaks side) — once the website exists to plug into.
6. Coach-hire depends on the athlete context system; AI Coach depends on the methodology write-up (now done, see `methodology.md`) plus product/pricing decisions.

## What's still needed from Iván
- **Complete current asset inventory** — confirm the full list of tools/artifacts already built beyond the yin yoga and kettlebell routines, and confirm how All-Access is currently signed up for.
- **Plans CSV** — export the plans spreadsheet and drop it into the repo (or upload here) to unblock the Plans catalog build.
- **Domain and hosting decision** — resolved: `triaperformance.com` on the Hermes VPS.


# Growth Roadmap Addition — Training Plan Storefront ("Vidriera")

*Merge this section into `growth-roadmap.md` (triaperformance-docs repo). Written Jul 18, 2026, from the full analysis of all-time TP sales, the 407-plan inventory, and 12 months of pixel view data. Full numbers in `plan-storefront-project-brief.md`.*

---

# Growth Roadmap Addition — Training Plan Storefront ("Vidriera")

*Merge this section into `growth-roadmap.md` (triaperformance-docs repo). Written Jul 18, 2026, from the full analysis of all-time TP sales, the 407-plan inventory, and 12 months of pixel view data. Full numbers in `plan-storefront-project-brief.md`.*

---

## New initiative: Training Plan Storefront (vidriera + AI plan picker)

### Why this, why now (evidence)

- Training plans are the purest expression of the core philosophy: $300–800/month with **zero hours spent since Jan 13, 2026**. T12M: $8,814 gross / $6,018 earnings, growing +11% YoY on price, not volume.
- The constraint is discovery, not product: median plan gets **27 views/year** on TP; view→purchase conversion is 1.19%; only 1 published plan got zero views. TP lists everything, pushes nothing.
- TP marketplace crowding measured from sequential plan IDs: **~80,000 new plans/year (~220/day)**. Our 394 plans are 0.16% of new supply. Discovery inside TP is unwinnable (EN especially: 80/20 Endurance, MyProPlan with ~900 EN plans and 100k+ sold — authority + reviews + early entry).
- Therefore: win discovery on owned ground (Google → our site → pre-sold click to TP), win conversion with better plan pages. ES/PT long-tail SEO is today what EN TP was years ago — a blue ocean. 57% of our revenue is already Spanish.

### Decisions taken (Jul 2026)

1. **Option A first (redirect to TP)**: site showcases plans, redirects to TP checkout. Stays 100% passive. TP's 29.4% take on current volume (~$2.6k/yr) is not worth destroying passivity + becoming merchant of record (VAT/tax, refunds, support).
2. **B-lite approved as premium layer**: "Plan + 20-min onboarding call" (apply plan to calendar, answer doubts, set thresholds) sold direct on top sellers only. Pricing: **flat +$50 USD** preferred over 2x (plan prices range $24–80; 2x underprices the call on cheap plans). Doubles as coaching-funnel touchpoint.
3. **Full direct checkout deferred behind a trigger**: revisit when site-attributed TP sales exceed ~$1k/month sustained. Pilot on top-20 sellers with freelancer doing the apply step, or via merchant-of-record (Paddle/Lemon Squeezy) to keep tax outsourced.
4. **Email capture is non-negotiable and ships in Phase 1** ("Option C"). Zero marketing opt-ins across 499 all-time sales. The list is the compounding asset; the 30% margin is not.
5. **Never hand-edit TP listings in bulk again.** Site DB = source of truth; TP = dumb mirror. Enrichment effort goes only into the ~100 plans with proven views/sales; the long tail gets auto-generated pages.

6. **All-Access is the storefront's flagship upsell.** The $39.99/mo subscription (all plans, unlimited swaps, TP Premium included, guides/PDFs; ES + EN products exist) is the only recurring passive product in the portfolio and has had zero distribution — 2 subscribers today means untested, not failed. Any subscriber staying 2+ months beats a median plan sale ($48, 8% repeat rate); realistic tenure of a race-prep cycle (3–4 months) triples revenue per customer. Laddered offer on every plan page and AI-picker result: plan ($X one-time) / plan + 20-min call (+$50) / All-Access ($39.99/mo). Segment the push: subscription pitch for marathon/tri/HYROX/multi-goal athletes; clean one-time sale for first-timer 5k/8-week buyers. Every future artifact (race-ready calculator, carb loader, guides) launches inside All-Access first — the subscription is the monetization wrapper for assets already planned, and the accumulating bundle is the moat plan-only competitors (MyProPlan, 80/20) don't have. "Training journeys" (weight-loss → 5k → 10k → 21k plan progressions) are pure curation and attack between-race churn. **Verify with TP account manager: rev share on All-Access vs the 30% plan take, and whether subscriber count/churn is reportable monthly.**

### Build phases

**Phase 1 — Storefront core (Ideas 1+2)**
- ~~Upload plan_performance.csv → table on Hostinger VPS~~ **Done Jul 21, 2026** — `storefront` database on the existing `analytics-postgres` container, `plans_raw` (386 rows, cleaned) + new `plan_weekly_breakdown` table (TP's per-plan workout stats, never in the CSV before — 190/330 plans crawled so far). Full detail: `ai-infrastructure-documentation.md` §10, `plan-storefront-project-brief.md`. One dynamic plan-view template renders all 394 plans — still ahead.
- Facet filters: sport, distance, difficulty, weeks, language, features (strength/power/HR/pace, weight-loss).
- Email capture (lead magnet / "email me this plan") BEFORE the TP redirect; all redirects carry UTM + plan_id.
- All-Access promo module on every plan page ("why buy 1 plan…" with the $15/mo-plan + $21/mo-Premium vs $39.99 math) + dedicated landing page per language.
- SEO: hub pages by intent per language (ES first), hreflang, Product schema with prices + review stars from the social-proof quote bank.
- ~~Fix the Cloud Run tracking pixel~~ — **done July 21, 2026.** Root cause was a Google Cloud billing/account-closure issue on the personal account hosting the project (not ignored emails — none were sent); fixed by linking a new billing account. 20 days of data lost (Jun 30–Jul 21), full history since June 2025 intact. Now synced nightly into a dedicated VPS Postgres instance as a standing backup, independent of that account's risk. Still the only funnel instrument, but no longer a single point of failure.

**Phase 2 — Discovery & conversion (Idea 3 + listing fixes)**
- AI plan picker: cheap model parses intent → facets → ranked plans ("run a fast 10k in 8 weeks"). At 394 plans, no vector DB needed; cost is negligible. Doubles as email-capture mechanism.
- Fix EN Cycling + EN Triathlon TP listings: together 24% of all views converting at 0.5% vs 1.2% catalog average ≈ **~$1,500/yr recoverable with zero new plans**. Copy the ES tri positioning that converts at 1.8%.
- Race+year SEO landing pages (Boston/Berlin/Valencia 2027…) backed by evergreen plans — kills the annual 99-plan rebuild treadmill; the website page carries the year, the plan doesn't.

**Phase 3 — Monetization upgrades (trigger-based)**
- B-lite premium bundle (+$50 call) on top-10 sellers.
- Direct checkout pilot if trigger hit (see decision 3).

### Sequencing notes (fits existing roadmap dependencies)

- This initiative **is the start of the website rebuild** that gates the tools-library migration — same VPS, same stack; the plan storefront is the first vertical slice.
- Catalog data model needs two new fields per plan before the AI picker is good: 2–3 sentence goal description + target weekly hours. Only needed for the ~100 proven plans.
- Catalog priorities from the data: finish HYROX EN backlog first (EN = 60% of HYROX revenue, accelerating), then weight-loss ES (best-selling concept, only 20% of its units are ES). Stop building Portuguese until distribution exists. Stop building race-year-stamped marathon plans.

### KPIs

- Site sessions by language; email opt-ins/week; UTM-attributed TP plan views and sales; view→sale conversion site-referred vs TP-native (target ≥2% site-referred); B-lite attach rate; freelancer minutes/sale if piloted.