# Triaperformance — Growth Roadmap & Systems

## The five pillars
Revenue streams, growth infrastructure, the athlete context system, coach-hire leverage, and guardrails. Each is also a natural frame for a dedicated conversation in this project.

### 1. Revenue streams
See `business-overview.md` for numbers and `pricing-and-positioning.md` for how pricing actually works. The near-term opportunity is distribution, not creation — Plans, All-Access, and the lead magnets are built and under-promoted.

### 2. Growth infrastructure

**Website** — being rebuilt from scratch off HubSpot. Requirements: self-manageable with AI (Iván builds, edits, and hosts it himself, with Claude and Hermes doing the heavy lifting), multi-language from the start (Spanish/English/Portuguese — prioritized because it drives traffic to the existing 300 plans), supports a paywall, and hosts the tools library plus a gear/affiliate page. Likely architecture: a code-based site — not a no-code builder like Webflow or Framer, since those live behind a proprietary editor that isn't directly AI-editable — in a git repo, hosted either on the same Hostinger VPS that already runs Hermes, or on Vercel/Netlify via git push.

**CRM / lead pipeline** — currently: TrainingPeaks emails a CoachMatch lead → a Claude scheduled task creates a HubSpot contact → a HubSpot workflow sends a 3-email sequence → manual WhatsApp follow-up. Needs a new home before HubSpot access ends. Whatever replaces it should also track lead volume and conversion by month and price point — that data doesn't exist today and is needed to actually evaluate pricing decisions rather than guessing.

**Tools library** — calculators and routines (carb-loading calculator, pace converter, threshold calculator, hip activation routine, yin yoga and kettlebell routines already built), built as Claude artifacts, migrated onto the new website. Claude-hosted artifact links are free and public by default with no gating mechanism — paywalling requires moving the code onto the owned site behind real auth. Natural to bundle behind All-Access rather than sell individually, which also gives All-Access a reason to grow past its current 2 subscribers.

**Paywall** — build against the existing Stripe account (already used for TP Payments, under KOCH Ventures LLC, with a Mercury bank account behind it). Stripe Checkout plus a simple entitlement check is enough; no need for a third-party membership platform.

**Social/content agent** — research topics, draft posts, publish after approval. Feeds the lead magnets and Plans-focused SEO content specifically.

**Hermes (VPS agent)** — Nous Research's open-source, self-hosted agent, already running on a Hostinger VPS and connected to Telegram. Has file and terminal access, browser automation, cron scheduling, and persistent memory. The plan is to use it as the operational layer for the website once it exists: drafting content, updating pages, running scheduled checks (e.g. a weekly SEO review), all reachable and approvable from Telegram. Keep its command-approval mode on "ask" (not "off") for anything touching the live site. Build this in alongside the website rather than after it — it's meant to run the system, not bolt onto a finished one.

### 3. Athlete context system
The "coach who remembers everything" problem — the onboarding survey, WhatsApp nuance, and training history, kept current and actually used when planning the next block. Needed for Iván's own use today and as the handoff mechanism for a future hired coach, which means it should end up as a real system of record rather than documents living only inside this Claude project — even though Iván is its only user for now.

**Training data**: TrainingPeaks' direct API is gated to approved commercial/device developers, explicitly excludes personal use, and isn't currently accepting new partner applications. A third-party aggregator that already integrates TrainingPeaks — Terra API is the clearest fit, and has a free tier — is the more realistic path, and it solves the Garmin/Polar/Wahoo neutrality requirement automatically, since it reads through TrainingPeaks rather than any single device platform. Needs evaluation (data completeness, pricing at scale) before committing.

**WhatsApp**: the actual pain point is re-reading exported chats to reconstruct context — a data-processing problem, not a messaging problem. The WhatsApp Business API (built for outbound campaigns at volume) is a mismatch and real overkill for this. The near-term fix is a small tool that ingests a chat export and extracts/files the relevant facts into that athlete's profile automatically, removing the repeated manual re-prompting. Buildable now, no new accounts needed.

### 4. Leverage: hiring a coach
Applies to the Private channel only — CoachMatch cannot be delegated. Because the service is uniform rather than tier-differentiated (see `pricing-and-positioning.md`), onboarding a new coach doesn't require inventing a restricted scope — they'd deliver the same standard service Iván already does. Open questions before this is real:
- **Payout mechanics** — does TP Payments support a split payout to a second person, or does Iván collect the full amount and pay the coach separately?
- **Fit and framing** — be upfront with Private leads about who they'd actually be working with, rather than a bait-and-switch after signup.
- **Context handoff quality** — entirely dependent on pillar 3 above being genuinely good.
- **Pricing** — the ~$72/$72 split only works at the $149 price point; Private pricing likely needs to move there from its current $89–109 range.

### 5. Guardrails
Not "don't grow" — "don't let growth quietly become a second full-time job."
- No group or cohort programs — explicitly ruled out, too much work for the return.
- No training camps or races as a revenue line — high time-cost, the classic coach-scaling trap.
- Don't push CoachMatch acquisition harder before the CRM/lead pipeline exists to catch leads reliably.
- Keep the "don't chase weak leads" instinct — a lead that needs excessive convincing isn't worth the hours.

## New product idea: AI Coach
A real gap in the current ladder, between static Plans and human coaching: an AI-guided self-coaching product built on Iván's actual methodology — training frameworks, fueling strategy, coaching judgment — encoded as a system prompt and knowledge base an athlete chats against, not a generic AI wrapper. Realistic build path: the "Claude in artifacts" capability (an artifact that calls the Anthropic API directly, using Iván's own encoded methodology as the system prompt) makes this a buildable real product, not just a concept.

Positioning: likely $25–40/month, sitting below 1:1 coaching. A genuine new top-of-funnel — athletes who'd never pay $75–149 might pay this, with some fraction upgrading to real coaching later. Open questions: exact pricing, liability/disclaimer scope, and how much this risks pulling from paid coaching versus adding a genuinely new segment. The prerequisite work — actually documenting Iván's coaching methodology and frameworks — doesn't exist as a written document yet. See below.

## Sequencing (draft, not fixed — revisit as priorities shift)
1. Website + paywall + multi-language. No hard deadline, but every month on the old site is foregone Private-channel and lead-magnet traffic.
2. WhatsApp context tool — small, parallel, a quick win.
3. Hermes threaded into the website build from the start, not bolted on after.
4. Athlete context system (Terra API evaluation + the TrainingPeaks side) — once the website exists to plug into.
5. Coach-hire and AI Coach — both depend on the work above (context system, methodology write-up, respectively).

## What's still needed from Iván
- **Coaching philosophy and methodology** — the actual frameworks (periodization approach, how fueling strategy is structured, what makes the coaching distinct) aren't written down anywhere yet. This is the single biggest gap in this knowledge base — it feeds athlete-facing copy, the website's voice, and the AI Coach product directly.
- **Complete current asset inventory** — confirm the full list of tools/artifacts already built beyond the yin yoga and kettlebell routines, and confirm how All-Access is currently signed up for.
- **Brand voice and visual direction** for the website — or a decision to have Claude propose a first draft to react to instead.
- **Domain and hosting decision** — existing domain or a new one, same-VPS-as-Hermes or a separate host.
- **Private-channel pricing decision** — hold at $89–109, or move to the $149 anchor to make the coach-hire economics work.
