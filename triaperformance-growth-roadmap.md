# Triaperformance — Growth Roadmap & Systems

## The five pillars
Revenue streams, growth infrastructure, the athlete context system, coach-hire leverage, and guardrails. Each is also a natural frame for a dedicated conversation in this project.

### 1. Revenue streams
See `business-overview.md` for numbers and `pricing-and-positioning.md` for how pricing actually works. The near-term opportunity is distribution, not creation — Plans, All-Access, and the lead magnets are built and under-promoted.

### 2. Growth infrastructure

**Website** — being rebuilt from scratch off HubSpot. Requirements: self-manageable with AI (Iván builds, edits, and hosts it himself, with Claude and Hermes doing the heavy lifting), multi-language from the start (Spanish/English/Portuguese — prioritized because it drives traffic to the existing 300 plans), supports a paywall, and hosts the tools library plus a gear/affiliate page. Likely architecture: a code-based site — not a no-code builder like Webflow or Framer, since those live behind a proprietary editor that isn't directly AI-editable — in a git repo, hosted either on the same Hostinger VPS that already runs Hermes, or on Vercel/Netlify via git push. And a per-page, per-language testimonials section sourced from `social-proof-and-reviews.md` (English/Portuguese pages currently blocked on review inventory: 3 EN / 0 PT).

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

Positioning: likely $25–40/month, sitting below 1:1 coaching. A genuine new top-of-funnel — athletes who'd never pay $75–149 might pay this, with some fraction upgrading to real coaching later. Open questions: exact pricing, liability/disclaimer scope, and how much this risks pulling from paid coaching versus adding a genuinely new segment. The prerequisite work — actually documenting Iván's coaching methodology and frameworks — doesn't exist as a written document yet. See below.

## Parking lot: solo monetization ideas beyond the current build (July 16, 2026)
A thought-experiment brainstorm — what else is viable as a solo operation (post-second-coach-hire), directly or indirectly monetizing this same AI infrastructure. Not sequenced into the roadmap yet; revisit once the current build (website, CRM, AI Coach) lands. Two items below are prioritized to start ASAP per Iván.

**Productized one-time outputs (no ongoing relationship, no marginal time per sale):**
- Automated race-report product — athlete connects TrainingPeaks/Garmin/Polar/Wahoo data via Terra, gets an AI-generated pacing/HR-drift/nutrition breakdown vs. goal splits. One-time $15–30.
- Cheap "readiness score" micro-subscription ($5–10/mo) — simplified branded CTL/ATL/TSB equivalent, priced under Runna ($19.99/mo) and TrainAsONE ($9.99/mo) comps.

**★ PRIORITY — start ASAP: Terra API integration, personal use first.** Iván is already using this Claude subscription as his own personal AI coach with good results, but isn't syncing his own training data via Terra yet. Plan: build it for himself first (self-test, prove the data pipeline and AI Coach quality with real synced data), then productize into the race-report / readiness-score ideas above once proven.

**License the infrastructure itself, not just the coaching:**
- White-label the AI Coach chatbot (once the methodology doc exists) to other solo coaches, each running their own branded version. Comps checked: white-label coaching-app tooling runs $150–599/mo for less differentiated products (MyPTHub, FitFocus) — even $50–100/mo per coach is a real SaaS line and directly monetizes the Hermes/Claude build work already underway.
- Sell the deploy blueprint (git → Caddy → Stripe → auto-updating multi-language site) as a one-time $1–3k productized setup for other coaches stuck on expensive no-code builders.

**Content/authority plays — real money, but genuinely time-costly, not calendar-free:**
- Course built from the same methodology doc (double-dips the AI Coach writing work). One-time $99–299 via the new site + Stripe.
- ★ PRIORITY — start ASAP: Affiliate/gear recommendation pages, agent-generated. Once the website, the content agent, and the page-generation pipeline exist (pillars already planned — see Sequencing), auto-generating and maintaining affiliate recommendation pages becomes close to fully automatable. Iván flagged this as genuinely achievable passive income with AI doing the page creation and upkeep, not just a nice-to-have.

**Lower fit / worth a deliberate gut check, not a default yes:**
- A multi-coach roster/agency model beyond the single second-coach hire — quietly turns Iván into a manager rather than a solo operator; different business than the one being built here.
- Merch / physical fulfillment — skip, doesn't leverage anything already built.

## Sequencing (draft, not fixed — revisit as priorities shift)
1. Website + paywall + multi-language. No hard deadline, but every month on the old site is foregone Private-channel and lead-magnet traffic.
2. WhatsApp context tool — small, parallel, a quick win.
3. Hermes itself is live and ready (see pillar 2) — thread it into the website build from the start rather than bolting on after.
4. Athlete context system (Terra API evaluation + the TrainingPeaks side) — once the website exists to plug into.
5. Coach-hire depends on the athlete context system; AI Coach depends on the methodology write-up.

## What's still needed from Iván
- **Coaching philosophy and methodology** — the actual frameworks (periodization approach, how fueling strategy is structured, what makes the coaching distinct) aren't written down anywhere yet. This is the single biggest gap in this knowledge base — it feeds athlete-facing copy, the website's voice, and the AI Coach product directly.
- **Complete current asset inventory** — confirm the full list of tools/artifacts already built beyond the yin yoga and kettlebell routines, and confirm how All-Access is currently signed up for.
- **Brand voice and visual direction** for the website — or a decision to have Claude propose a first draft to react to instead.
- **Domain and hosting decision** — existing domain or a new one, same-VPS-as-Hermes or a separate host.

