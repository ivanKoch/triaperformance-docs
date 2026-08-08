# 1:1 Athlete Onboarding — the flow, as tasks

**Created: August 8, 2026.** Home doc for the "New 1:1 athlete onboarding flow" initiative, previously a single line in `open-loops.md` (July 29, 2026) and a one-sentence gap note in `triaperformance-growth-roadmap.md`. Both now point here.

**Scope:** from "the athlete has paid" to "the first training block is published". Pre-sale is out of scope (it lives in `methodology.md` §3 and is deliberately manual). Coaching content — what to prescribe — is owned by `methodology.md` and is not restated here.

**Status: specification. Nothing below is built.** The task table is the deliverable; every row is either reuse-of-something-live or a genuinely new build, and it says which.

---

## 1. What already exists, and what doesn't

Before this doc, the flow existed as: one line in `open-loops.md`, three sentences of human process in `methodology.md` §3, and a lot of machinery built for *other* flows that happens to be exactly the right shape.

**Reusable and proven in production:**

| Capability | Where it's proven | Reuse for |
|---|---|---|
| IMAP trigger + exact-match subject filter on TrainingPeaks mail | `subscription-lifecycle-automation.json`, `ai-infrastructure-documentation.md` §12 | Stage 1 |
| Dedupe-by-email upsert into Twenty (check → if → create/update) | `contact-form-workflow.json`, `subscription-lifecycle-automation.json` | Stage 2 |
| Members token generate → insert into Postgres → include in welcome email | `subscription-lifecycle-automation.json`, `automation/members-area/OPERATIONS.md` | Stage 3 |
| Language-branched templated email over Gmail SMTP | `subscription-lifecycle-automation.json` | Stage 4 |
| Public webhook via Caddy → n8n (`/api/...` + the `rewrite` gotcha) | `contact-form-pipeline-runbook.md`, `ai-infrastructure-documentation.md` §11 | Stage 5 |
| Postgres table on `analytics-postgres`, decoupled from Twenty | `subscriber_tokens`, `ai-infrastructure-documentation.md` §13 | Stage 6 |
| Telegram notification to Iván | contact-form + CoachMatch workflows | Stage 7 |
| Free-text status updates over Telegram → Twenty | Hermes, `ai-infrastructure-documentation.md` §8 | Stage 8 (optional) |

**Genuinely missing — nothing exists:**

- Any trigger that recognises a **1:1 coaching** signup (the live workflow recognises All-Access only).
- The intake form's field list — the Google Form is used in practice but is **not documented anywhere in this repo**.
- Any mechanism that reads the form's responses.
- Any store for athlete training context. `triaperformance-business-overview.md` states this plainly: *"currently informal… No structured system yet."*
- A 1:1 welcome email. The existing welcome email is the All-Access one and says the wrong things.
- Any handling of 1:1 **cancellation** (`churnDate`) — the live workflow churns All-Access subscribers only.

---

## 2. Decision: where athlete data lives

**Decided August 8, 2026: a new Postgres table on the existing `analytics-postgres` container, keyed by `twenty_person_id`. Twenty holds the commercial record; Postgres holds the training context; TrainingPeaks holds a generated human-readable mirror.**

The three candidates and why the others lose:

- **Twenty custom fields — rejected.** Twenty's Person object is the commercial record: who they are, what they bought, when they signed up, when they churned. Onboarding context is a different kind of data and breaks Twenty in three specific ways. (a) It changes over time — the perfect week gets renegotiated, the training history grows, thresholds get re-tested — and a CRM field is single-valued with no history, so every update destroys the previous answer. (b) A meaningful chunk of it is long free text, which a CRM list view renders unusable. (c) It would double the Person schema with fields that mean nothing for the other two customer types, and `customerType` already has three values.
- **TrainingPeaks notes — rejected as the system of record, kept as an output.** It's where the perfect week goes today and where it should still be visible, because that's where Iván works. But `triaperformance-business-overview.md` is explicit that there is **no programmatic access to TrainingPeaks data**. Anything stored only there is invisible to the AI Coach, to a future hired coach's handoff, and to every automation in this doc. It fails the standing test — storing there costs his time forever, because only re-reading by hand can retrieve it.
- **Postgres on `analytics-postgres` — chosen.** It's already running, already reachable from n8n's Postgres nodes with a debugged credential, and the decoupling precedent is already an explicit architectural decision in this repo: `subscriber_tokens` deliberately does not live in Twenty (§13). Same reasoning, same shape. It supports append-only history rather than destructive updates, and it is the substrate both the AI Coach and the coach-hire handoff need — which are two LATER items that currently have no data layer to stand on.

**The rule that falls out of this:** Twenty answers *"is this person a paying 1:1 athlete, since when, and are they still one"*. Postgres answers *"who is this athlete and how do they train"*. Nothing is written to both. The join is `twenty_person_id`.

### Proposed schema (`athletes` schema on the `members` database)

Two tables, because the two halves have different lifecycles — the intake is a snapshot taken once, the profile is a living record.

```
athlete_intake              -- append-only; one row per form submission, never updated
  id                serial pk
  twenty_person_id  uuid          -- nullable at insert; matched by email, backfilled
  email             text not null
  submitted_at      timestamptz not null default now()
  source            text not null -- 'google_form' | 'site_form'
  raw               jsonb not null -- the full submission, exactly as received
  <typed columns for the fields that drive automation — TBD, see §5>

athlete_profile             -- one row per athlete; the current truth, updated over time
  twenty_person_id  uuid pk
  email             text not null
  preferred_language text        -- SPANISH | ENGLISH | PORTUGUESE, mirrors Twenty
  sport             text         -- mirrors Twenty's enum
  perfect_week      jsonb        -- days per sport, pool access, rest day, doubles, time caps
  constraints       text         -- injuries, travel, equipment gaps
  thresholds        jsonb        -- current LTHR / FTP / threshold pace / CSS + test date
  onboarding_state  text         -- see §4
  updated_at        timestamptz
```

`raw jsonb` is deliberate: the form will change, and a schema that only stores parsed columns silently discards whatever it wasn't built to expect. Store everything, parse what's needed.

**Open before build:** whether this is a new database or a schema inside `members`. Leaning schema-inside-`members` — one fewer connection string, one backup, and the two tables genuinely relate (`subscriber_tokens.twenty_person_id` is the same key).

---

## 3. Two acquisition channels, two triggers — not one

This is the structural correction to the original sketch. "I get an email with the confirmation" is **two different emails**, and one of them may already be being silently mishandled.

- **Private channel** — the athlete pays through TP Payments. TrainingPeaks sends its standard *"New subscription confirmation"* email. This is **the same subject line the live All-Access workflow triggers on**; the two are distinguished only by the product-name string inside the body, exactly as the ES/EN/PT All-Access products are distinguished from each other today (§12).
  → **Confirmed bug, found August 8, 2026 by reading `subscription-lifecycle-automation.json` directly — not a suspicion.** The live workflow's `Filter - Is New Subscription` node tests **only** `subject equals "New subscription confirmation"`. There is no product filter anywhere in the branch. `Create Person (New Subscriber)` then hardcodes `customerType: 'ALL_ACCESS'`, and the branch runs straight through to `Generate Member Token` → `Insert Token in Postgres` → `Send Welcome Email`.
  **Therefore: every 1:1 coaching subscription sold through TP Payments is currently being tagged `ALL_ACCESS` in Twenty, issued a members-area token, and sent the All-Access welcome email.** The one apparent safety net doesn't catch it — `detectLanguage()` sets `language_unrecognized: true` when the product name matches none of the three All-Access products, but **nothing branches on that flag**; `Map Language + Build Twenty Fields` connects unconditionally to `Check Existing Person (New Sub)`. And a Spanish coaching product is likely to contain both "suscripci" and "triaperformance", so it would match `SPANISH` and pass with no flag raised at all.
  **Consequences to check, not assume:** the athlete count and the All-Access subscriber count are both derived from `customerType`, so both may be wrong; a coaching athlete may hold a members token nobody meant to grant; and `planPurchased` on those records holds a coaching product name. Fix the filter before building anything new — and audit existing `ALL_ACCESS` records first, because every further sale adds one.
- **CoachMatch channel** — TrainingPeaks bills the athlete directly and pays commission monthly (`triaperformance-business-overview.md`). The signal is a different notification entirely, and `coachmatch-lead-automation.json` handles CoachMatch **leads** but has no concept of a lead *converting*. A CoachMatch athlete today ends their journey as a lead record that nobody advances.

Both channels converge from Stage 2 onward. Only Stage 1 branches.

---

## 4. The flow, as tasks

`M` = manual and staying manual (coaching judgment). `A` = automatable. `A*` = automatable but blocked on an open decision below.

### Stage 0 — Pre-sale · M · exists
Athlete shares goal, experience, available hours over WhatsApp → Instagram race photos + Google Business Profile reviews as social proof → subscription link with price, inclusions, cancel-anytime stated plainly. Owned by `methodology.md` §3. Also here: the **red-flag screen** (triathlete who can't swim, runner with no GPS watch, cyclist with no power meter or HR strap) — a "no" or a re-scope happens *before* payment, not after.

### Stage 1 — Detect the signup · A
1. Capture a real Private-channel confirmation email and extract the exact product-name string(s). *(Blocked on Iván — same evidence the All-Access strings needed.)*
2. Capture a real CoachMatch conversion notification, subject line and body. *(Blocked on Iván.)*
3. **Fix the unfiltered All-Access branch — see §3. Do this first, it is a live bug.** Two parts: (a) add a product-name condition so the All-Access branch only fires on the three real All-Access products, with an explicit Telegram alert on any unmatched product rather than a silent pass-through; (b) run a one-time audit of existing `ALL_ACCESS` records in Twenty against `planPurchased` to find coaching athletes mislabelled by it, and check `subscriber_tokens` for tokens issued to them.
4. Build the trigger: reuse the IMAP node, add a 1:1 branch on product-name match.

### Stage 2 — Twenty record · A
5. Dedupe by email. **The update path is the common case, not the exception** — most 1:1 athletes arrive as an existing CoachMatch or website-form lead. Create is the fallback.
6. Set: `customerType: OPT1_1_COACHING`, `leadStatus: WON_CUSTOMER`, `signUpDate` (**not** `purchaseDate` — the two are separate and easily conflated, §12), `preferredLanguage`, `addressCountry`.
7. Set on **create only**, never on update: `sport`, `leadSource`, `athleteLevel` — overwriting these on an existing lead destroys real qualification data. This convention is already established in `backfill_existing_customers.py`.
8. Add a Twenty field or convention for **onboarding state** so the CRM shows where an athlete is without holding the payload: `PAID` → `INTAKE_SENT` → `INTAKE_RECEIVED` → `WEEK_MAPPED` → `TESTING` → `ACTIVE`. *(New field — needs creating in Twenty's UI by Iván; Twenty's introspection is disabled so the enum must be confirmed by hand, §8.)*

### Stage 3 — Provision access · A*
9. **Open decision: do 1:1 athletes get members-area access included?** Nothing in the KB states this either way, and it's the difference between a step and no step. If yes: reuse `Generate Member Token` → `Insert Token in Postgres` verbatim. If no: skip, and the welcome email loses a paragraph.

### Stage 4 — Welcome email + intake form · A
10. Write the 1:1 welcome email — new copy, not the All-Access one. Contents: what happens in the next 7 days, the intake form link, the test that's coming and why, WhatsApp expectations and response-time norms, members login if Stage 3 is yes. Voice per `brand-guidelines.md` §8. Three language versions.
11. Send, set `onboarding_state = INTAKE_SENT`.
12. **Chaser:** if no form response after N days, one reminder. Currently this never happens — a silent athlete just stalls. (`methodology.md` §2 names unresponsive athletes as the main way the service fails to deliver value; this is the first place that shows up.)

### Stage 5 — Capture the form response · A*
13. **Open decision: how to listen.** Three options —
    - **(a) Google Sheets trigger in n8n.** Polls the responses sheet. Needs Google Workspace credentials in n8n, which is an unstarted open item in `open-loops.md`. Adds latency and a dependency.
    - **(b) Apps Script on the Form → POST to `/api/athlete-intake` → Caddy → n8n.** *(Recommended.)* Fires on submit, no Google credentials in n8n at all, and it reuses the exact Caddy-route pattern already debugged for the contact form — including the `rewrite * /webhook/athlete-intake` line that the raw path 404s without. ~15 lines of Apps Script, written once.
    - **(c) Replace the Google Form with a form on the site.** Cleanest long-term, full control of fields and language, but the most work and the form is working today. Park it as the eventual destination.
14. Document the form's actual questions in this doc. *(Blocked on Iván — the form exists and is in use but its fields are nowhere in this repo, so nothing downstream can be specified.)*

### Stage 6 — Process and store · A
15. Insert the full submission into `athlete_intake` (`raw` jsonb, always).
16. Match to a `twenty_person_id` by email; on no match, insert with a null id and alert — don't drop it.
17. Upsert the parsed fields into `athlete_profile`.
18. Set `onboarding_state = INTAKE_RECEIVED` in Twenty.

### Stage 7 — Notify Iván · A
19. Telegram message: a **readable digest** — name, sport, goal race and date, available hours, red flags, link to the Twenty record — not a raw form dump. Optionally Hermes-summarised, since judgment-shaped summarising is exactly the n8n/Hermes split already established (§8).

### Stage 8 — Perfect-week interview · M, with A capture
20. The WhatsApp interview stays manual — it's the highest-value unstructured input in the whole flow and it's a conversation, not a form.
21. **What changes:** the answer is captured as structured `perfect_week` jsonb rather than typed straight into TrainingPeaks. `methodology.md` §3 already flags this: *"Pasted into TrainingPeaks as a permanent note [pattern worth systematizing]"*.
22. Generate the TrainingPeaks note text *from* the stored record, so TP stays the readable mirror and Postgres stays the source. Set `onboarding_state = WEEK_MAPPED`.

### Stage 9 — First block · M
23. Activation vs. straight-to-testing call (detrained → 1–2 weeks aerobic + strides; active → test immediately). Coaching judgment, `methodology.md` §3.
24. Assign test protocols by sport and available equipment — the protocol table in `methodology.md` §3 is deterministic given sport + power meter yes/no, so the *selection* is automatable even though the *decision to test now* isn't.
25. Send the test-hygiene message. This is already a standard message sent to every athlete — templatable today, three languages, near-zero effort. **Lowest-hanging automation in the whole flow.**
26. Publish the block. `onboarding_state = TESTING` → `ACTIVE`.

### Stage 10 — Definition of done
Onboarded means: Twenty record correct and `ACTIVE`; `athlete_intake` row stored; `athlete_profile.perfect_week` populated; thresholds recorded from a completed test; first block published in TrainingPeaks. Anything short of that is a stalled onboarding and should be visible as such.

### Stage 11 — The exit, for symmetry
27. **1:1 cancellation is unhandled.** The live workflow churns All-Access only. A 1:1 athlete who cancels leaves `leadStatus: WON_CUSTOMER` and no `churnDate` forever, which quietly corrupts the athlete count and makes the win-back audience (an `open-loops.md` NEXT item) wrong. Same parse-and-branch work as Stage 1, on the cancellation email.
28. Per `methodology.md` §2, exit is clean at the billing boundary: accounts unlink, access ends. Revoke the members token if Stage 3 applies.

---

## 5. What's blocked on Iván

Nothing in Stages 1–7 can be built without these. In rough order of how much they unblock:

1. **The Google Form's actual questions** — paste them, or share the form. Blocks the typed columns in `athlete_intake`, the Stage 7 digest, and the `athlete_profile` parse.
2. **A real Private-channel confirmation email** for a 1:1 signup — the exact product-name string. Blocks the trigger entirely.
3. **A real CoachMatch conversion notification.** Same.
4. **Do 1:1 athletes get members-area access?** Yes/no. Blocks Stage 3 and one paragraph of the welcome email.
5. **The Stage 5 listening decision** — recommendation is (b), Apps Script → Caddy → n8n.
6. **Create the onboarding-state field in Twenty's UI** and read back the exact enum values, since introspection is disabled.

## 6. Sequencing note

Task 3 in Stage 1 goes first and is not really part of this project — it's a live bug that this project happened to uncover (§3). There are likely wrong records in Twenty right now, and every 1:1 sale adds another.

After that, the cheapest real win is task 25 (the templated test-hygiene message): it's already a message he sends every time, it needs no form, no schema and no trigger, and it converts a recurring manual send into a template today.
