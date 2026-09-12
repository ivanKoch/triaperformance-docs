# Open Loops — the single list of what is in flight

**Last updated:** September 11, 2026 (cleanup pass — every item cut to four lines or fewer; the pre-cleanup file is `open-loops-archive.md` §Snapshot — September 11, 2026).
**Branch (WIP limit 1): acquisition and retention — opened September 12, 2026, Iván's call.** Scope, in his words: retention diagnosis at athlete level (transcript pass done September 12, `tenure-analysis.md` §7 and `data/athlete_engagement.csv`; the tenure file still lacks rate, sport and channel — he builds the joined dataset next); plan buyers get a touch (NEXT #5); ex-athletes get something (newsletter, site-launch announcement or an offer — undecided); paid ads start the week of September 14 (NEXT item; prerequisite is the named GA4 conversion events). The referral program keeps its entry below but not the slot — it waits on the calendar.
**Focus this month (Iván, Sept 1):** Private, referrals, All-Access worth sharing; acquisition and retention over new build.
**Closed items and every past session's narrative:** `open-loops-archive.md`.

## Rules

- Every item is a `- [ ]` checkbox, at most four lines: what it is, who or what it waits on, and where the detail lives. History goes in the archive, not here.
- WIP limit: one big branch. A new one opens only when one closes.
- An item is closed when it is moved to `open-loops-archive.md` with its closing note. Ticking it here is not closing it; doing the work in the world without moving it is not closing it either.
- NEXT items keep their `#N` numbers because other docs cite them. Never renumber; gaps are fine.
- Items about the repo itself (inventories, doc drift, "last updated" lines) are done in the session that finds them or not written down. They do not get an item.

---

## NOW

### Carried forward from the storefront branch (closed September 11, 2026)

- [ ] **`/planes/duatlon/` and `/planes/fuerza/` have no hub page.** Twelve plans point at the full catalogue instead. Two pages on the existing hub template. Owner: `storefront-rebuild-brief.md` (retired) → `triaperformance-growth-roadmap.md` §Storefront.
- [ ] **Record the activation loop video in EN and PT.** Two-line swap once the files exist; the still is honest meanwhile. Not urgent.
- [ ] **Third-party prices live on the All-Access pages and all 328 plan pages** (Zwift $19.99, TP Premium $19.95, owner `triaperformance-pricing-and-positioning.md` §Zwift). Nothing will notice if either moves. Re-check at each monthly close.
- [ ] **Credential badges are upscaled on every page that carries the band** (`tp-level2-accredited.png` 85 px rendered at 151; ESCI, Stryd, IRONMAN U similar). Licensed marks, so the fix is higher-resolution originals from the four issuers — one email each, Iván's.
- [ ] **Members-tool stills render at 0.87× on retina** (`members-zonas-*`, `members-activacion-*`, 1200 px into a 692 px slot). Regenerate at 1400 with the script that made them; never hand-edit.
- [ ] **One home for the carbon site chrome.** `.site-nav-sticky` and `.nav-utility` are written twice (`members-activacion.css`, `members-dark.css`). Fix is one body-level class in `site.css` plus a hook in `base.njk`. Until then, edit both files or neither.
- [ ] **The CoachMatch lead number for the About page.** `site.coachMatchLeads` is null and the sentence renders without it; a draft claimed 1,500 with no source. Count `lead_source = COACHMATCH` in Twenty or read the TrainingPeaks dashboard, then set the field.
- [ ] **`data/testimonials.csv` — 17 rows seeded, 4 publishable, 13 waiting on a number.** Iván fills the figures he has from WhatsApp/Instagram and marks consent `given`. Loader into the site not yet wired. Spec: `storefront-rebuild-brief.md` §Testimonials (retired doc, section still valid).
- [ ] **Design refresh — four tranches shipped, L2 is the next.** Home doc: `design-refresh-brief.md` §3 (tier list; nothing queued). Still needs Iván: look at the homepage on a real screen — every fix since `6de4ed2` was checked headless.

### Referral program (branch open August 26, 2026 — waiting on the calendar)

Home doc: `referral-program-brief.md`. Definition of done: one referral attributed end-to-end in Twenty and one real payout. Realistic yield 2–4 signups over two months (§9).

- [ ] **One referral attributed end-to-end** — `referredBy` set, second payment confirmed, gift card sent, `referralRewardSentDate` filled. Closes the branch. Not possible before October 6.
- [ ] **Read the result at the September and October closes.** Four signups is a good outcome; do not plan for ten.

### Members library and site content

- [ ] **Get the transparent TrainingPeaks wordmark from TrainingPeaks.** The file on hand has an opaque navy background; keying it out alters a trademark. When it arrives, split the `tp` row in `site/_data/credentials.json` into two tiles.
- [ ] **Ask ESCI for a larger logo, ideally SVG.** 252×36 renders soft on retina; the 3× upscale was tried and rejected. Cosmetic.
- [ ] **Remove the IRONMAN U entry in 2027.** Delete `ironmanu` from the three `items` arrays in `site/_data/credentials.json`; everything reads from that file. Printed with its year so it stays true until then.
- [ ] **Check the live n8n email bodies for links to the four retired members pages** (`/members/zonas/`, `/tests/`, `/carrera/`, `/kettlebell/`, `/nutricion/`). Repo is clean; n8n bodies live only in the instance. Iván, in the n8n UI. `carrera` and `kettlebell` have no redirect and would dead-end.
- [ ] **Re-check the PT All-Access subscriber's `access_count` on or after September 14, 2026.** Outreach sent September 4; still 0 at four days. Record in `monthly-close/2026-09.md`, then retire `all-access-pt-subscriber-outreach-2026-09.md`.
- [ ] **PT CoachMatch sequence selling All-Access — deployed September 5; multi-item execution still unverified.** Iván's call: wait for real leads rather than replay a mock. A daily single lead proves the language fork, not the two-leads-in-one-poll path. Baseline: 34 PT leads all-time, zero converted. Home doc: `coachmatch-portuguese-sequence.md`.
- [ ] **The library has no pacing tool.** `/members/carrera/` was retired August 13. Fuelling half closed September 11 (`/members/combustible/`), and the race-plan-by-distance half closed September 12 (`/members/ejecucion/`, `race-execution-guide-brief.md`) — its §3 carries the pacing structure for 10k, 21k, 42k and long-course. What is still missing is a *tool*: something that takes the athlete's numbers and returns a plan, rather than a guide they apply by hand. Do not restore the old page as-was.
- [ ] **The members area has sixteen cards and no first step.** Three labelled groups since September 4 are orientation, not a sequence. Honest sequence: test → zones → read your load → prehab if something hurts → activation before quality → breathing after. Scope together with the reactive FAQ item below.
- [ ] **Nothing in the library remembers anything.** Every tool is stateless; a 12-week Achilles protocol needs to know it is week 3. Needs per-subscriber storage on the existing auth identity (`ai-infrastructure-documentation.md` §21). Biggest single upgrade available; not v1.
- [ ] **Running has no threshold-improvement plans to offer after the zones capture.** Cycling and swimming resolve by rule; running is faceted by distance and renders an empty state. Needs hand-picked plan IDs from Iván.
- [ ] **All-Access "all my plans inside TrainingPeaks" is true and unintelligible to someone who does not know TP's plan-assignment model.** Interim card copy shipped. Real fix is a demonstration — a short screen recording (subscribe → browse → drag a plan onto the calendar → swap), and/or a public page with screenshots. Belongs in front of the paywall.

### Sending, pipelines and measurement

- [ ] **Wire `sent_at` into the send workflow** — `UPDATE unsubscribe_tokens SET sent_at = now() WHERE token = $1` after SMTP accepts. `/admin/secuencias/` divides by `sent` and reads 0 until this exists. Backfill the September 6 PT send (30 rows) by hand from the execution log. Same pass as the retrofit below.
- [ ] **Retrofit the suppression check into every sender — six workflows send mail and none check it.** List and node pattern: `unsubscribe-runbook.md` §Retrofit. One decision inside it: whether welcome/password-resend mail gets an account-mail exception — decide explicitly and write it down. Send node must read the recipient from the node that produced it, never bare `$json`.
- [ ] **Read the CoachMatch PT backlog send (30 emails, September 6) at the September close.** Subscriptions from the 30, `utm_campaign=pt-backlog-2026-09` sessions, unsubscribes (`email_suppression.source`). The planned follow-up email was dropped on September 12 — the first email promised not to write again, and the promise wins. Do not set these leads back to `MESSAGE_SENT`.
- [ ] **Lead-magnet emails carry no click attribution.** Use the existing `/c/<code>` redirector (`automation/Caddyfile`, logs to `campaign_link_clicks`), not UTMs — it also works on the PDF link, which GA4 never sees. Two codes cover the magnet emails.
- [ ] **`member_tool_usage` groups by `path`, so every tool is split across up to three language rows, and merged by tool the ranking changes** (recovery is first, reported third). Resolve `path` → `library.json` key in the view, as `/w/` already does. Trigger: before the September close reads a per-tool distribution.
- [ ] **Read the members-area announcement at the September close.** 48-hour snapshot recorded September 8: 13 of 38 athletes in within two days (lifetime baseline 2), driven by per-athlete `/w/` links. Two rows to carry: Nadine (EN, `access_count` 0) and the PT subscriber (0). Baseline: `data/monthly_close/2026-08-metrics.csv`. Detail: archive §Snapshot.
- [ ] **Paste the `/w/` links into the TrainingPeaks library workouts.** 34 codes at `/admin/enlaces/`; everything is live and verified. Scope: library workouts and future plans, not the 328 published plans. Iván started September 8. Record: `ai-infrastructure-documentation.md` §43.
  - [ ] **The library pass itself** — one edit per workout; every future application carries the links for free.
  - [ ] **Read `workout_link_clicks` at the September close.** `anonymous_clicks` is the column that matters — clicks with no athlete is a login problem, not a dead link.
- [ ] **`plan-tracker-bigquery` Cloud Function: confirm the live runtime and harden the endpoint.** Repo copy claims Python 3.12, this list said 3.9 — diff deployed source against `automation/pixel-tracker/main.py` before editing anything. Then: if `plan_id` is not well-formed, serve the GIF and write nothing (four flood incidents, 1,008 junk rows the day before close #1). Read-side fix already live in `schema_plan_views.sql`.

### Catalogue strategy (not build work)

- [ ] **Duathlon is the most under-built category.** Earnings per published plan: Duathlon $121 (15 plans), Strength $70, Triathlon $66, Swimming $41, Running $37, Cycling $29 (60). Next plans built should be Duathlon. Source: `training-plans-analysis.md` §5. Worth one session to pick the gaps.
- [ ] **Run a pricing test.** Units flat, average sale doubled — price is the only lever that has worked and it has never been tested. Free version first: conversion by price band within a sport/family from `data/plan_sales.csv` + `plan_views_clean` (control for the HYROX mix shift). Then sequential ±20% on one family for 8–12 weeks, outside January and June. Companion to the NEXT #2 read in late October.

### Content

- [ ] **Athlete stories — a content series from the coaching record** (Iván, Sept 12). One athlete, one arc, numbers and their own words; consent first, and the ask doubles as a warm touch for those who left well. First: Ronald G. (from first athlete to sub-3 marathon, sub-5 70.3, the 70.3 Worlds, and a sub-10 Ironman as the next chapter). Nominations and the rule for choosing: `coaching-process-review.md` §Athlete stories.
- [ ] **Decoupling has a home doc (`/blog/desacople-aerobico-interpretar-pa-hr/`); eight other places still explain it inline.** Pointer per file, not a rewrite — two use it as a retest trigger, one as a pacing rule, and those are different claims. Read each passage before touching it.
- [ ] **Rewrite the members FAQ in ES, EN and PT** (Iván, Sept 12 — parked; the current EN/PT copy stays as is until then). Then build the athlete-facing help articles reactively: nothing goes on the page until a real athlete has asked it; the Monday check-in is the collection point. Pre-sale objections stay in `sales-playbook.md`.
- [ ] **Improve the Portuguese offering.** ~73 impressions/month of exact purchase intent (`plano de treino maratona` and variants) with the marathon hub on page six; `planos de maratona` at 18.4 is within reach. The Ironman hub ranks for distance queries, not plan queries — leave it. PT has 53 plans vs ES 164. No trigger, no owner; written down to come back to. Query: `automation/analytics/queries/pt-hub-queries.sql`.
- [ ] **Do not touch until the October close: decide whether the content engine keeps its cadence.** At September 2: 98 articles, 79 impressions, zero clicks, 61 of 98 under two weeks old. Re-read early November when the August/September cohorts are past four weeks. Distribution, not volume, is the constraint. Query: `automation/analytics/queries/blog-indexation.sql`.
- [ ] **Build, translate and publish the carb-loading calculator** (Iván, Sept 2). Numbers must come from `methodology.md` §8 via the fuelling guide markdown, never a third copy; link `/members/combustible/` §7 for the reasoning.
- [ ] **Fuelling guide v2 — the 100% liquid race option** (150–200 g concentrated bottle), cut from v1 as the most dangerous passage of the predecessor. Needs a rehearsal gate and a g/100 ml ceiling before it ships. Home doc: `fueling-guide-brief.md`. Not queued.
- [ ] **`all-access.css` styles bare `h2` and `.section-intro`, which leak into every shared partial the page includes** (root cause of the credentials-band bug, fixed narrowly). Pass over the page-scoped stylesheets for bare element selectors and scope them. Retires a recurring class of bug.

### Catalogue data

- [ ] **Win-back for the 26 who said they would be back.** Audience, reason and the date each one gave: `~/Downloads/chats/churn_reading_full.csv` (names, outside the repo); codes in `data/churn_reading.csv`. One personal message each, not a sequence; two of them (Luis M., Celestino) need a repair first (`tenure-analysis.md` §7). Iván's.
- [ ] **Eight service rules from the full transcript review** (`coaching-process-review.md`). Iván decides which ship first; the silence rule and the race protocol are the two with the most churn behind them. The rules that are words go in `sales-playbook.md`; the rules that are triggers go in the Monday check-in script.
- [ ] **Three retention motions from the transcript read** (`tenure-analysis.md` §7 §What this settles): the *pausa* script with the TrainingPeaks pause offered first; the race-week debrief + next goal; the three-unanswered-Mondays-and-no-goal trigger that offers All-Access. Words go in `sales-playbook.md`; the trigger is a query on `athlete_engagement.csv` until the Monday check-in script carries it.
- [ ] **Four high-risk actives this week** (`data/athlete_risk.csv`, names in `~/Downloads/chats/actives_risk_full.csv`): Aki, Said, Rafael G., Luis L. Personal message each; the ask is a goal race or a pause/All-Access, not another Monday template.
- [ ] **Two rows in `athlete_tenure.csv` are probably not churns.** Julián (TP → PayPal in December, trained to his March race: needs a `Private` second period) and Maria Guadalupe (36 messages after the churn date, two failed-payment notices). Iván confirms; then the §3 tables move by one or two.

### Infrastructure follow-ups (Gemini migration and Hermes)

Models are settled (Sept 4): Hermes and research on `gemini-3.8-flash`; writer, translator and intake briefing on `gemini-3.1-pro-preview`. Do not re-raise on the next Flash release. Record: `ai-infrastructure-documentation.md` §33.

- [ ] **Watch the first deploy after the Hermes config sync push.** The 6am run should print `hermes config.yaml unchanged`, not `updated and containers restarted`. If it restarts daily, compare parsed content rather than bytes — do not remove the sync.
- [ ] **Cron pin drift check — verify it prints, then leave it alone.** `deploy-website.sh` reports each Hermes cron job's model pin every morning; a report, not a sync, by design.
- [ ] **Check `model_usage` for a thinking-token regression on 3.8 after two or three Mondays.** Compare `thinking_tokens / output_tokens` across 3.7 and 3.8 rows where `caller = 'research'`.
- [ ] **MCP tool integrations — Google Workspace, and Twenty via the community MCP server.** Planned, not started. Twenty's native MCP is Cloud-only.
- [ ] **Hermes is not threaded into the live website workflow** (drafting, page updates, weekly SEO checks). Keep command approval on "ask" for anything touching the live site.

---

## NEXT (queued, each with its trigger; numbers are stable identifiers)

- [ ] **Paid acquisition stops being $0 — small Instagram test budget** (Iván, Sept 1). The CRM guardrail is satisfied. One real prerequisite: deploy the named GA4 conversion events (`select_plan` fired zero times in August; the zones calculator produced two leads and no event) — otherwise an ad's conversion is unmeasurable. Separate, higher-return job: tag the links Iván pastes by hand (Direct is 46.6% of sessions).
- [ ] **VPS backups — live since September 11, 2026; close after the first scheduled run.** First manual run 22:15 UTC: 9.6 MB, off-site copy verified in Google Drive, restore test passed (Twenty person table, four analytics DBs, 18 n8n workflows). Cron 03:15 daily. Check `rclone ls gdrive:triaperformance-backups` on September 12, then move to the archive. Runbook: `deploy-runbook.md` §5.
- [ ] **`audit-runtime-paths.sh` cannot see database objects.** `plan_views_clean` lived only on the box for two months with five defects. Dump `pg_get_viewdef` for every view in `analytics-postgres`, `content` and `members` and diff against the repo's `schema_*.sql`. Scope first: `schema_analytics.sql` declares 4 tables and 5 views and nobody has checked the box matches.
- [ ] **AI-assistant channel: evidence attaches here, no second item.** A Bogotá lead (Sept 3) found Triaperformance via ChatGPT, which cited the GBP card and the TrainingPeaks coach profile — not the site. GPTBot has swept 200–300 TP listings monthly since June 2025. The citation sends AI-sourced leads to the 20% channel.
- [ ] **Decide whether the AI channel changes race-page ordering.** Cheap first move: `areaServed` in `site/_includes/partials/person-schema.njk` — the schema says what he knows and never where he coaches.
- [ ] **Retention: decide whether the next quarter goes to retention or acquisition.** Diagnosis is done (`tenure-analysis.md` §3: the January 2026 COO role cut deliverability; −30% heads but −21% MRR; break-even 3.4 signups/month at $149 vs a 2–3 run rate). What stays open is measurement — `monthly_rate`, one row per billing period, a churn reason — folded into the close. Trigger: two closes, end of September.
- [ ] **#2 · TP listing rewrites experiment — live since July 29–30, waiting on data.** Real read ~October 27 (90 days), queries and decision rule in `es-pt-listing-rewrites-2026-07.md` §Measurement. Note the measurement view was corrected September 5, so the October read is against different numbers than the August peek.
- [ ] **#3 · Legacy contact import (2,250 contacts) + re-engagement blast.** Suppression state rescued September 8 (131 addresses seeded into `email_suppression`); mailable 2,099 before de-duplicating against Twenty, which is the next step and not done. Business question still open: import, yes or no, and what the message says. PII stays out of the repo. Gated by #4.
- [ ] **#4 · Workspace DKIM — prove it signs, then decide DMARC.** Key is in the zone and resolves; *Start authentication* accepted. Definition of done: one mail through the real n8n + Gmail SMTP path showing `dkim=pass header.d=triaperformance.com` in Show original. `_dmarc` stays `p=none` until then. Detail: `deploy-runbook.md` §1.
- [ ] **#5 · Plan-completion nurture.** 6.4% of buyers ever buy again, median 72 days later; 74 finished in the last year and were never asked. Trigger on `purchase_date + weeks − 1`. Parked alternative: write a Person on every plan sale via `planPurchasedId` — measure what share of sales carry an email first. Sizing: `training-plans-analysis.md` §10. Trigger: after #3 supplies the audience.
- [ ] **#6 · Weekly GBP-review → IG testimonial drip — running manually at ~1/week.** Supply is fine (owner `social-proof-and-reviews.md`). The item is automating it. First recurring content job; any time.
- [ ] **#7 · EN/PT review generation** — every EN/PT athlete asked until EN ≥10, PT ≥5. Playbook: `social-proof-and-reviews.md`. Ongoing.
- [ ] **#8 · "+$50 testing-and-zones consultation" on the top 20 sellers.** Protocol work off `methodology.md`, so also the natural first paid task for a junior coach and a trial run for the coach-hire item. Design: `triaperformance-growth-roadmap.md` §Storefront, standing decision 3. Nothing gates it.
- [ ] **#9 · Affiliate program applications** (Amazon first). Trigger: first gear article scheduled — the 180-day/3-sale clock starts at approval.
- [ ] **#11 · The TSS / CTL / ATL / TSB explainer — one long-form video plus written definitions.** The Loom already sent to a lead is the outline; do not re-record from nothing. Written definitions carry ES/EN/PT; video Spanish-only to start. Home: a `/recursos/` page. Any time — writing and recording, not build.
- [ ] **#15 · Canonical exercise library (`site/_data/exercises.json`) — every decision made, nothing built.** Parked by Iván (D5). Names and all cues are already harmonised in three languages (September 8); this branch inherits them. Must include a movement-level lookup step in `artifact-publish-runbook.md` so the next artifact consults the library. Home doc: `exercise-library-decisions.md`. Trigger: WIP slot free.
- [ ] **#18 · The athlete card and the Monday brief — the tool that remembers.** Per-athlete record in Postgres (goal race and date, constraints, zones history, preferred channel, medical flags, open promises with due dates, pause return date), fed by Telegram commands and forwarded audio, read by Hermes into a Monday brief per athlete (pending promises, silence streak, race inside 14 days, last week's flags, one suggested personal line). Race-protocol and silence triggers come from the same table. Design: `coaching-process-review.md` §The tool. Trigger: Iván picks it over the other NEXT items; it is the build that makes the eight rules run without his memory.
- [ ] **#17 · Mirror the rewritten CoachMatch ES sequence into `automation/`.** Emails rewritten September 9 (price out of email 1, every email asks a question). Trigger: Iván imports the new copy into n8n. With the price out of the emails, "no response" and "price" stop overlapping — the first honest read on $149 arrives six weeks later.

---

## LATER (parked deliberately)

- [ ] **Race landing pages, 21 km — parked September 11 (Iván: "I need to work on acquisition and retention").** Ten dossiers exist in `Claude outputs/race-dossiers-21k-batch1-2026-09.md`; Iván to approve or cut the proposed extra halves; no hero photos yet. Product decision first: the ES half-marathon ladder has a 14-week tier the code does not declare, and all three known 21 km bugs are that mismatch. Trigger: the retention question answered and the WIP slot free.
- [ ] **`?race=` on the contact form** so a race page can say which race produced a lead — 26 pages are live generating unattributable traffic. Contact form + n8n + Twenty. Belongs to the acquisition push, not to the 21 km park.
- [ ] **Content engine — a wider topic vocabulary.** Corpus awareness shipped September 2 (`research_agent.py`: `screen_ideas()` drops clones ≥0.45, flags ≥0.28). `writer_agent.py` still enforces a closed nine-slug list and the `our_assets` rule filters out gear, racing, news and swimming. Not urgent while the blog has never been clicked; distribution first.
- [ ] **A $229 tier: $149 coaching + 1:1 nutrition from a certified nutritionist** (Iván, Sept 3). Shape (1) — a coach-nutritionist takes the whole athlete for a referral margin — is the only idea in this repo that adds margin while subtracting his hours. Open: which shape, what split. Prices are set in `triaperformance-pricing-and-positioning.md`, not here.
- [ ] **WhatsApp Business API — an AI first touch and follow-up, not a broadcast tool** (Iván, Sept 3). 129 of 182 lost CoachMatch leads were lost to no response. Scope: get a reply and book the human; never the mirror-then-price conversation. Meta approval and templates are the real work.
- [ ] **AI Coach product** — `methodology.md` done; open: pricing, liability scope, cannibalisation. Those three questions are the gate.
- [ ] **Weight-loss nutrition guide, bundled free with the weight-loss plans, written under his sister's credentials** (nutritionist, UBA). Iván's alone: is she willing to be named, and cut or byline. Free and bundled, not sold; ES first; also a fourth lead magnet. Do not assume it feeds 1:1 coaching.
- [ ] **AI plan picker** — plain-language ask → facets → ranked 2–3 plans, doubling as email capture. Needs goal description and target weekly hours on the ~100 proven plans first. Detail: `triaperformance-growth-roadmap.md` §Storefront, Phase 2.
- [ ] **Full direct checkout** — trigger: site-attributed TP sales > ~$1k/mo sustained.
- [ ] **URL filter parameters on the catalogue** (`/planes/?distance=Full`) so hubs, blog posts and GBP posts can deep-link a filtered view. Small; any time.
- [ ] **Scope the mobile chip JS per catalogue container** — a page can carry only one grid today. Trigger: the first page that needs two.
- [ ] **`planCard` shortcode uses the raw plan name, emoji included** — may render a tofu box on blog cards. Confirm on a real machine first.
- [ ] **Consolidate the four legacy category stylesheets into `planes-hub.css`** (~95% duplicate). Trigger: next time one needs a real change.
- [ ] **Terra API personal integration** — self-test with own training data. Slack-time.
- [ ] **WhatsApp context tool** (chat export → athlete profile). Trigger: athlete context system work begins.
- [ ] **Coach hire** — gated on athlete-context quality; NEXT #8 is the cheaper way to see someone's athlete-facing quality first.
- [ ] **Content engine feedback agent.** Query-level GSC demand is available now; article-level performance is not until the August cohort is old enough (~November 2026). A backfill does not age the articles. Read `ai-infrastructure-documentation.md` §9 (`word_count` note) before writing the agent.
- [ ] **Content engine V2 — cheaper review gates.** First, diff `original_body` vs `body` in `content_pieces` — nobody has looked at the edit rate. Translation approval can be automated honestly (same entities, same numbers, same structure); article approval should get a pre-flight report, not removal. Shrink the EN/PT idea queue where the translator already covers the topic.
- [ ] **Distribution for the content engine — the unbuilt half.** Nothing announces a published article: no Instagram, GBP or LinkedIn. GBP API family access is approved; the local-post endpoint is not confirmed.
- [ ] **Reviews → social proof:** auto-generate an Instagram image per new review; rotate recent reviews on the site at build time from `gbp_reviews`. Trigger: after the GBP publishing build. A review-reply alert was considered and dropped.
- [ ] **White-label AI Coach / deploy blueprint / course** — parking lot.
- [ ] **`methodology.md` §13 open gaps (Iván):** strength prescription logic, minimum effective week and overtraining thresholds, taper lengths for sprint/Olympic, exit policy. They become product gaps the day the AI Coach ships.
- [ ] **Test Persons still in Twenty from debugging** (Curl Test, Formulario Prueba…). Cosmetic; `contact-form-pipeline-runbook.md`.
- [ ] **Two channel decisions from `content-engine-brief.md` §9:** Instagram account type (Business?) and LinkedIn track identity.
- [ ] **WhatsApp Business profile website link is un-UTM'd** — verified accounts cannot edit it. Revisit if Meta allows it.
- [ ] **An explainer of how the coaching actually works — a video, recorded by Iván** (Sept 4). The content exists (`methodology.md` weekly loop, `sales-playbook.md` service block); this item owns saying it on camera. The process is the product.
- [ ] **The two admin navs diverged** (`nav.njk` on `/admin/enlaces/` and `/secuencias/` vs `app.py` on `/admin/ideas/`). Parked by Iván September 9: the admin works, and nobody has stated how `app.py` reaches `:8092`, so a change cannot be confirmed deployed. Build the same top bar on all three, Flask views on a second row.
