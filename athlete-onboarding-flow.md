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
  **Therefore: every 1:1 coaching subscription sold through TP Payments is currently being tagged `ALL_ACCESS` in Twenty, issued a members-area token, and sent the All-Access welcome email.** The one apparent safety net doesn't catch it — `detectLanguage()` sets `language_unrecognized: true` when the product name matches none of the three All-Access products, but **nothing branches on that flag**; `Map Language + Build Twenty Fields` connects unconditionally to `Check Existing Person (New Sub)`.
  *Corrected August 8, 2026, against a real Private confirmation email.* This paragraph originally continued: *"And a Spanish coaching product is likely to contain both 'suscripci' and 'triaperformance', so it would match `SPANISH` and pass with no flag raised at all."* **That was speculation and it was wrong.** The real product name is `Coaching personalizado - Un deporte (running, ciclismo, natación)`, which contains neither string, so `detectLanguage()` correctly returns `null` and the Telegram notification does fire with *"Idioma detectado: NO RECONOCIDO -- revisar"*. **The bug is noisy, not silent** — which lowers the severity and gives a way to find every affected case: any "NO RECONOCIDO" Telegram since July 24, 2026 is one.
  **Consequences to check, not assume:** the athlete count and the All-Access subscriber count are both derived from `customerType`, so both may be wrong; a coaching athlete may hold a members token nobody meant to grant; and `planPurchased` on those records holds a coaching product name — which is what makes the audit easy. **Blast radius is bounded:** this workflow went live July 24, 2026, so only Private signups since then are affected. Fix the classifier before building anything new.
- **CoachMatch channel** — TrainingPeaks bills the athlete directly and pays commission monthly (`triaperformance-business-overview.md`). The signal is a different notification entirely, and `coachmatch-lead-automation.json` handles CoachMatch **leads** but has no concept of a lead *converting*. A CoachMatch athlete today ends their journey as a lead record that nobody advances.

Both channels converge from Stage 2 onward. Only Stage 1 branches.

---

## 3.1 Stage 1 specified — the two emails, parsed

*Written August 8, 2026 from two real emails supplied by Iván: a CoachMatch hire (Aug 4, 2026) and a Private subscription (Apr 4, 2026).*

### What arrives, and where

Both emails come from `receipt@trainingpeaks.com`, and Iván's Gmail filter labels **everything** from that address `TP-Subscriptions`. The live IMAP trigger reads `mailbox: "TP-Subscriptions"`. So all four message types land in one place and must be told apart inside n8n:

| Message | Subject (exact) | Reply-To | Currently |
|---|---|---|---|
| All-Access signup | `New subscription confirmation` | support@ | handled |
| **Private 1:1 signup** | `New subscription confirmation` | support@ | **mis-handled as All-Access** |
| **CoachMatch hire** | `Congratulations, You Have Been Hired by a New Athlete` | **coachmatch@** | **silently dropped** |
| Cancellation | `Subscription cancellation` | support@ | handled, see below |

**The CoachMatch email is dropped, not mis-handled** — its subject matches neither filter, so it falls off the end of the trigger with no action and no alert. This is the likely reason the July 29 signup was described as "fully manual": nothing fired, because nothing was listening. Wrong outcome, but no bad data — the opposite failure mode to the Private branch.

**Subject alone cannot separate All-Access from Private.** Both are `New subscription confirmation`, because both are built in the same TP Payments product builder — Iván's read, confirmed by the identical email layout. The only discriminator is the **product name** on the `Subscription:` line. `Reply-To` separates CoachMatch cleanly (`coachmatch@` vs `support@`) and is a more robust discriminator than the subject line, which is marketing copy and can be reworded.

### CoachMatch — parse spec

Body (whitespace-flattened) reads:
`Congratulations, you have been hired by Rafael A Giraldo R (yorag1981@yahoo.com) at the Coach Match Bronze level coaching package starting on 08/05/2026.`

```js
/hired by\s+(.+?)\s*\(([^)]+)\)\s+at the\s+(.+?)\s+package starting on\s+(\d{2})\/(\d{2})\/(\d{4})/i
// 1 full name · 2 email · 3 package · 4 MM · 5 DD · 6 YYYY
```

| Field | Value in the sample | Notes |
|---|---|---|
| `full_name` | `Rafael A Giraldo R` | see naming caveat below |
| `email` | `yorag1981@yahoo.com` | the join key for everything downstream |
| `package` | `Coach Match Bronze level coaching` | `/Coach Match (\w+) level/` → tier `Bronze` |
| `coaching_start_date` | `2026-08-05` | **MM/DD/YYYY** |
| `signUpDate` | email date, `2026-08-04` | the hire date, not the start date |

**The date format is MM/DD/YYYY and this is evidenced, not assumed:** the email was sent Aug 4, 2026 and the start reads `08/05/2026`. Under DD/MM it would be May 8 — four months in the past. TrainingPeaks is a US company and this is the US convention. Worth stating explicitly because `08/05` is exactly the kind of ambiguity that parses fine, never errors, and is silently wrong for the eight months of the year where both readings are valid dates.

**Not in this email at all: price, currency, invoice number, payout.** Iván sells the Bronze package at $149/month, and a discount does not appear anywhere in the message. So **CoachMatch revenue cannot be derived from the signup email** — the tier is the only price signal, and it's unreliable when discounted. Don't compute revenue here; the monthly TP payout statement is the source for that.

**The future-start case.** TrainingPeaks suggests coaches tell athletes to pick the last day of the month — the card is charged that day and the athlete gets the rest of the month free. Iván deliberately doesn't do this. But athletes can still choose a future start, so `coaching_start_date` may be days or weeks after the hire date. **This does not delay onboarding:** the welcome email, the intake form and the perfect-week interview all fire immediately on the hire email. The start date drives one thing only — when the first training block begins (Stage 9). Two separate dates, two separate purposes, and collapsing them would either delay the intake or start the block early.

### Private (TP Payments) — parse spec

Body reads:

```
Customer Name: Maria Emilia (lopezmarino.mariae@gmail.com)
Subscription: Coaching personalizado - Un deporte (running, ciclismo, natación) - $99.00/monthly
Startup Fee: $40.00
Duration: monthly
Amount Charged: $99.00 (including taxes)
Invoice Number: SUFWHMPW-0001
You will receive $0.00 for this purchase (this amount includes all standard processing fees).
```

The **existing parser already handles the first four fields correctly** — verified by hand against this text, including the non-greedy `Subscription:\s*([\s\S]+?)\s-\s\$` which correctly stops at ` - $99.00` rather than the earlier ` - Un deporte`, yielding `Coaching personalizado - Un deporte (running, ciclismo, natación)`. No parser rewrite is needed; what's missing is everything *after* the parse.

Fields to add to the parse (record-only, see below):

| Field | Regex | Sample |
|---|---|---|
| `startup_fee` | `/Startup Fee:\s*\$([\d.,]+)/i` | `40.00` |
| `duration` | `/Duration:\s*(\w+)/i` | `monthly` |
| `coach_payout` | `/You will receive\s*\$([\d.,]+)/i` | `0.00` — **suspect, do not use** |

**`You will receive $0.00` is wrong on its face** and should not be treated as revenue data anywhere. TP Payments takes 3.5%, so a $99 charge should pay out roughly $95.50. Flagged as a question for TrainingPeaks, not modelled here.

**On the startup fee.** Iván's instruction is that the $40–50 startup fee is not part of the onboarding process, and that's right — it triggers nothing and gates nothing. But *recording* it costs one regex, and the alternative is that per-athlete coaching revenue exists in no system at all: `training-plans-analysis.md` owns plan sales, and nothing owns coaching sales. Capturing `amount_charged`, `startup_fee` and `invoice_number` into the intake row at signup builds a coaching revenue ledger as a free side effect. **Record it, act on nothing.**

**Money timing** — payout lands 2 days after the charge, 3.5% commission, versus CoachMatch's 20% paid monthly on the 1st–31st cycle. Relevant to cashflow, irrelevant to onboarding: no step in this flow waits on money arriving. Noted here so it isn't re-derived later, and not modelled as a state.

**No athlete-selectable start date on this channel.** Payment *is* the start, so `coaching_start_date = signUpDate = ` the email date. The field still exists on both branches; it's just always equal on this one.

### The naming problem — solved by not solving it

The existing parser splits a full name by popping the last token as the surname. Against both real samples it gets both wrong:

- `Rafael A Giraldo R` → first `Rafael A Giraldo`, last `R`. Should almost certainly be first `Rafael A`, last `Giraldo R` — two given names, two surnames, the standard Latin American shape.
- `Maria Emilia` → first `Maria`, last `Emilia`. `Maria Emilia` is a compound given name; there is no surname in the string at all.

There is no heuristic that gets this reliably right, and building one is a rabbit hole. **The fix is structural: match by email, and never write `name` on the update path.** For CoachMatch the athlete is usually already in Twenty from the lead pipeline, with a name Iván typed or verified — so the correct behaviour is to leave it alone. That's also consistent with the convention already in `backfill_existing_customers.py`, where `sport`/`leadSource` are create-only for the same reason.

For the create path (a referred Private athlete who was never a lead — Iván's example), split naively, store the raw string alongside, and **put the full name verbatim in the Telegram notification** so a wrong split is a five-second fix rather than a silent corruption. Automate the mechanical part; leave the judgment where judgment already lives.

### Cancellation — partially handled already

*Correction to §1, written the same day:* this doc listed 1:1 cancellation as entirely unhandled. Reading `Parse Churn Email` / `Mark Churned in Twenty` shows that's **too strong**. The churn branch sets `churnDate` and `leadStatus: CHURNED_CUSTOMER` and revokes the members token, and it **never touches `customerType`** — so if a Private cancellation email carries the same `Subscription cancellation` subject and the same body shape, it already does the right thing for a coaching athlete. Two things still need confirming against a real Private cancellation email: that the subject matches exactly, and that `Parse Churn Email`'s regex (`that X's (email) subscription to Y has been cancelled`) matches the coaching wording. Until then this is "probably fine", not "handled".

### Recommended shape: one workflow, one trigger, three branches

Add to the **existing** subscription-lifecycle workflow rather than building a second one:

1. Keep the single IMAP trigger. **Two workflows polling the same `TP-Subscriptions` mailbox would race** over which one marks a message seen — a class of bug worth avoiding outright rather than debugging later.
2. Add a third top-level filter for CoachMatch, alongside the two that exist. Match on `Reply-To contains coachmatch@trainingpeaks.com`, not the subject line — same reasoning as above.
3. On the `New subscription confirmation` branch, insert a **Switch after `Parse New Subscription Email`** that classifies on the product name into `ALL_ACCESS` → the existing chain, `PRIVATE_COACHING` → the new chain, and `UNKNOWN` → **Telegram alert and stop, writing nothing**.

**Point 3 is the whole fix, and the principle behind it is the actual lesson:** the current branch has no `UNKNOWN` case, so an unrecognised product doesn't stop — it proceeds with `customerType: 'ALL_ACCESS'` hardcoded as an implicit default. Any classifier that can only say *"this"* or *"assume this"* will eventually mislabel something. Both allowlists must be explicit, and the fall-through must write nothing and shout.

*Alternative if this workflow gets unwieldy at ~35 nodes: split CoachMatch off at the Gmail-label level into its own label and its own trigger. That avoids the race and keeps workflows small, at the cost of a second place to look. Not recommended yet.*

---

## 3.2 Stage 1 — build instructions

*Written August 8, 2026. Iván executes every step; Claude has no live access to n8n, Twenty or the VPS.*

**The product catalogue, confirmed by Iván August 8, 2026:** exactly **one** active Private product — **`Triaperformance 1-1 Coaching`, $149/month, $50 startup fee, promocode `NOSTARTUP` waives the startup fee.** Exactly **one** CoachMatch tier ever sold — **Bronze**, $149/month.

*Note on the April 2026 sample email:* it shows `Coaching personalizado - Un deporte (running, ciclismo, natación)` at $99 + $40 startup — a **different, now-retired product**. The allowlist below deliberately does not include it: new signups can only be on the current product, and if a retired product ever does reappear it lands in `UNKNOWN`, which alerts and writes nothing. That is the failure mode we want.

*Note on the startup fee:* with `NOSTARTUP` applied the `Startup Fee:` line may be absent or read `$0.00`. Any regex for it must tolerate a missing line rather than fail the parse.

### Scope of this step — classify only, write nothing new

This step makes classification **correct and observable**, and stops the damage. It deliberately does **not** yet write Private or CoachMatch athletes into Twenty. After it, all three cases produce a Telegram notification, so real signups can be checked against real classifications for a couple of weeks before any write is automated. Attaching the writes is the next task.

---

### Phase A — Audit first, change nothing

**A1. Find the affected records.** Search your Telegram history for `NO RECONOCIDO` since **July 24, 2026** (the date this workflow went live — nothing before it can be affected). Each hit is one mis-routed Private signup.

**A2. Cross-check in Twenty.** People → filter `customerType = All Access` → look at the `planPurchased` column. Any row whose product is a **coaching** product rather than one of the three All-Access products is a mis-tagged athlete.

**A3. Cross-check the token table** — run from your own terminal:

```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT email, preferred_language, active, created_at FROM subscriber_tokens WHERE created_at >= '2026-07-24' ORDER BY created_at;"
```

**The diagnostic signature is a blank or null `preferred_language` on a row created after July 24** — All-Access signups always resolve to `SPANISH`/`ENGLISH`/`PORTUGUESE`, so a blank one can only have come through the unclassified path.

**A4. Report back what A1–A3 turn up** before fixing anything, so the repair is based on the real list rather than an assumed one. If the answer is "nothing", that's a real and useful result — it means no Private athlete has signed since July 24.

> **Result, August 8, 2026 (Iván): no new subscriptions since the workflow went live, so no "NO RECONOCIDO" alerts and zero damaged records.** The bug is real and the fix still ships, but **blast radius is zero** — no repair, no backfill, no data to clean. Recording this explicitly so a future session doesn't re-open "did we ever audit the mislabelled records?" The answer is yes, on Aug 8, and there were none.

---

### Phase B — Twenty: create one field, confirm two enums

**B1. Create the field.** Settings → Data Model → Person → New Field:

- Name: `Coaching Start Date`
- Type: **Date** (not Date Time)
- Confirm the resulting API name reads exactly **`coachingStartDate`** and report it back — Twenty derives the API name from the label and the derivation is not always what you'd guess.

> **Done, August 8, 2026 (Iván): field created, API name confirmed `coachingStartDate`, Date type, same format as the other date fields (`YYYY-MM-DD`).**

**B2. Report the full `leadSource` enum.** Settings → Data Model → Person → `leadSource` → list every value verbatim.

> **Closed August 8, 2026 — six values, read off the Data Model screen by Iván:** `COACHMATCH`, `WEBSITE_FORM`, `REFERRAL`, `OTHER`, `PLAN_CATALOG`, `INSTAGRAM`. Mirrored into `ai-infrastructure-documentation.md` §11, which owns this list. Only `INSTAGRAM` was new to the KB.
>
> *An intermediate answer here was "for lead source you need to apply the same WON_CUSTOMER", which conflated two fields worth keeping straight: **`leadStatus`** is the pipeline stage and `WON_CUSTOMER` is one of its values (already written on conversion, unchanged); **`leadSource`** is the acquisition channel. `WON_CUSTOMER` is not valid on `leadSource` and would 400. Recorded because the two field names are similar enough that the same slip is likely again.*
>
> **`COACHMATCH` already exists, so nothing needs creating.** The mapping for the write step:
> - **CoachMatch branch → `leadSource: COACHMATCH`**, but **create-only**. A CoachMatch athlete is normally already in Twenty from the lead pipeline with the source already set; overwriting it on conversion would destroy real attribution. Same create-only convention as `sport` in `backfill_existing_customers.py`.
> - **Private branch → write nothing at all.** The TP Payments confirmation email carries no signal about where the athlete came from — Iván's own example is a referral from an existing athlete, but it could equally be `INSTAGRAM` or `WEBSITE_FORM`. **Leaving it null is honest; writing `OTHER` is a guess that looks like data**, and it's indistinguishable later from a genuine "other". The Telegram notification should prompt for it instead — one tap in Twenty, and the answer is something only Iván knows.
>
> *Related, not urgent:* the existing All-Access create path writes `leadSource: 'OTHER'` for exactly this reason, and §11 documents that as "the most honest fit of the four real options". With six values now available and the null-vs-`OTHER` argument above, that choice is worth revisiting — but it's a separate change to a working path, not part of this one.

**B3. Confirm `customerType` still reads exactly** `PLAN_BUYER`, `ALL_ACCESS`, `OPT1_1_COACHING`.

*Optional while you're in this screen — belongs to the next task, not this one:* create `Onboarding State` as a Select field with values `PAID`, `INTAKE_SENT`, `INTAKE_RECEIVED`, `WEEK_MAPPED`, `TESTING`, `ACTIVE`. Only do it if you'd rather not come back.

---

### Phase C — n8n: four new nodes in the existing workflow

Open **`subscription-lifecycle-automation`**. Do not create a second workflow — a second IMAP trigger on the same `TP-Subscriptions` mailbox would race with this one over marking messages seen.

> ### C0. Import instead of hand-building — recommended
>
> All seven nodes plus a sticky note are pre-built in **`automation/stage1-classifier-paste.json`**. n8n's canvas accepts node JSON straight from the clipboard.
>
> 1. Open the workflow in n8n.
> 2. Open `automation/stage1-classifier-paste.json`, select all, copy.
> 3. Click on empty canvas space, **Ctrl+V / Cmd+V**. The nodes appear with their internal wiring already connected and the Telegram credential (`Hermes Bot`) already referenced.
> 4. **Then wire by hand: one deletion, three new connections.** Paste cannot create these, because the nodes at the other end aren't in the snippet — which is why the pasted nodes arrive as **two disconnected clusters**. That's expected, not a failed import.
>
>    *n8n mechanics: to **delete** a connection, hover the mouse over the line — a small toolbar appears at its midpoint with a trash icon (or click the line and press `Delete`). To **create** one, drag from the small circle on the **right** edge of the source node onto the **left** edge of the target and release when the target highlights. One output can feed several nodes; just drag from the same circle again.*
>
>    | # | Action | From | To |
>    |---|---|---|---|
>    | 1 | **Delete** | `Map Language + Build Twenty Fields` | `Check Existing Person (New Sub)` |
>    | 2 | Create | `Map Language + Build Twenty Fields` | `Classify Product` |
>    | 3 | Create | `Route by Product` — output **`All-Access`** (top of three) | `Check Existing Person (New Sub)` |
>    | 4 | Create | `Email Trigger (IMAP)` (same output dot the other two filters use) | `Filter - Is CoachMatch Hire` |
>
>    **Step 1 is the fix.** Everything else is scaffolding; that one deleted line is what stops an unclassified product reaching the All-Access chain. Do it *before* testing — if both step 1 and step 2 are live at once, `Map Language` fans out to both paths and every subscription gets processed twice.
>
>    **Verify by counting connections** when done: `Map Language + Build Twenty Fields` has exactly **one** outgoing (to `Classify Product`); `Check Existing Person (New Sub)` has exactly **one** incoming (from `Route by Product`); `Route by Product` has **all three** outputs occupied; `Email Trigger (IMAP)` has **three** outgoing. No node should be left with an empty input except the two triggers.
> 5. Drag the pasted nodes wherever they read best — positions in the file avoid overlapping the existing layout but aren't sacred.
> 6. **Verify the `Route by Product` node opens cleanly and shows three outputs** (`All-Access`, `Private Coaching`, `Unknown`). The Switch node's parameter shape varies across n8n versions; the snippet targets typeVersion 3.2 to match the `filter` 2.2 / `if` 2.3 nodes already in this workflow. If it renders wrong or empty, say so and build that one node by hand from C2 — everything else in the paste is version-stable.
>
> No credential values are in the file — only the `{id, name}` reference n8n itself stores, same as every other node in the repo's workflow copies.
>
> *This file is a one-time paste helper. Once the change is live and mirrored into `subscription-lifecycle-automation.json`, delete it — it would otherwise become a second, drifting copy of nodes that live in the real workflow.*
>
> **The sections below describe the same nodes for hand-building.** Read them either way: they're the explanation of what you just pasted.

#### C1. Add a Code node: `Classify Product`

Insert it **between** `Map Language + Build Twenty Fields` and `Check Existing Person (New Sub)`.

> **Set Mode to `Run Once for All Items`** — explicitly, not left on default. The code below maps over `$input.all()`, and a real IMAP poll can deliver two emails at once. This is the exact bug class confirmed live on July 31, 2026, where a 2-lead poll caused follow-up nodes to update only the first lead with no error thrown. A single-item manual test cannot catch it.

```js
// Classifies a "New subscription confirmation" into a product family.
// BOTH allowlists are explicit, and anything matching neither is UNKNOWN.
// UNKNOWN must never fall through to a default customerType -- that was the
// August 2026 bug: the branch had no UNKNOWN case, so an unrecognised product
// proceeded with customerType 'ALL_ACCESS' hardcoded as an implicit default.

const ALL_ACCESS_MATCHERS = [
  s => s.includes('suscripci') && s.includes('triaperformance'),
  s => s.includes('full access'),
  s => s.includes('acesso total'),
];

const PRIVATE_COACHING_MATCHERS = [
  s => s.includes('1-1 coaching'),
];

return $input.all().map(item => {
  const j = item.json;
  const s = (j.subscription_name || '').toLowerCase();

  let productType = 'UNKNOWN';
  if (ALL_ACCESS_MATCHERS.some(fn => fn(s))) {
    productType = 'ALL_ACCESS';
  } else if (PRIVATE_COACHING_MATCHERS.some(fn => fn(s))) {
    productType = 'PRIVATE_COACHING';
  }

  return { json: { ...j, productType } };
});
```

The All-Access matchers are a deliberate copy of the logic already inside `Map Language + Build Twenty Fields` rather than a reuse of its `preferredLanguage` output. Inferring "language detected ⇒ All-Access" would work today and break silently the day a coaching product gets Spanish detection — the same implicit-default reasoning that caused the original bug.

#### C2. Add a Switch node: `Route by Product`

Connect `Classify Product` → `Route by Product`.

- Mode: **Rules**
- Rule 1 — left `{{ $json.productType }}`, operator **String → is equal to**, right `ALL_ACCESS`, rename output **`All-Access`**
- Rule 2 — same left/operator, right `PRIVATE_COACHING`, rename output **`Private Coaching`**
- Options → add **Fallback Output** → set to **Extra Output** (this becomes the `UNKNOWN` branch)

Connect the outputs:

- `All-Access` → **`Check Existing Person (New Sub)`** (the existing chain, unchanged)
- `Private Coaching` → new Telegram node in C3
- Fallback → new Telegram node in C4

#### C3. Add a Telegram node: `Telegram - Private Coaching Signup`

Chat ID `5952194741`, text:

```
🟢 Nuevo atleta PRIVATE (1-1 Coaching)
Nombre en el email: {{ $json.firstname }} {{ $json.lastname }}
Email: {{ $json.email }}
Producto: {{ $json.subscription_name }}
Cobrado: ${{ $json.amount_charged }}
Factura: {{ $json.invoice_number }}

Todavia NO se escribio nada en Twenty -- cargar a mano por ahora.
Revisar que el nombre este bien separado.
```

The "revisar que el nombre esté bien separado" line is not filler — `Maria Emilia` parses to surname `Emilia` and `Rafael A Giraldo R` to surname `R`. Until the write path exists, you are the name check.

#### C4. Add a Telegram node: `Telegram - Unknown Product`

Chat ID `5952194741`, text:

```
⚠️ PRODUCTO NO RECONOCIDO -- no se escribio nada en Twenty
Nombre: {{ $json.firstname }} {{ $json.lastname }}
Email: {{ $json.email }}
Producto: {{ $json.subscription_name }}
Factura: {{ $json.invoice_number }}

Procesar a mano y agregar el producto a Classify Product.
```

#### C5. Add the CoachMatch branch

Add a third Filter node hanging off **`Email Trigger (IMAP)`**, alongside the two that already exist.

**`Filter - Is CoachMatch Hire`** — condition: `{{ $json.subject }}` **is equal to** `Congratulations, You Have Been Hired by a New Athlete`

*I said earlier that `Reply-To: coachmatch@trainingpeaks.com` is a more robust discriminator than the subject line. Walking that back for a practical reason: the IMAP node here runs with empty `options`, so it returns the simple output shape and may not expose `Reply-To` at all. Matching on subject keeps this consistent with the two filters already in the workflow. If you want it hardened without touching the node's config, add a second AND condition — `{{ $json.textPlain }}` **contains** `New Coach Match Purchase` — which lives in the body and needs no header access.*

Then a Code node **`Parse CoachMatch Hire`** (**Mode: `Run Once for All Items`**):

```js
// Parses the "Congratulations, You Have Been Hired by a New Athlete" email.
// Date is MM/DD/YYYY -- evidenced, not assumed: the sample was sent Aug 4 2026
// and reads 08/05/2026. Under DD/MM that would be four months in the past.

return $input.all().map(item => {
  const flat = (item.json.textPlain || '').replace(/\s+/g, ' ').trim();

  const m = flat.match(
    /hired by\s+(.+?)\s*\(([^)]+)\)\s+at the\s+(.+?)\s+package starting on\s+(\d{2})\/(\d{2})\/(\d{4})/i
  );

  const fullName = m ? m[1].trim() : '';
  const nameParts = fullName.split(/\s+/);
  const lastname = nameParts.length > 1 ? nameParts.pop() : '';
  const firstname = nameParts.join(' ');

  const packageName = m ? m[3].trim() : '';
  const tierMatch = packageName.match(/Coach Match\s+(\w+)\s+level/i);

  return {
    json: {
      parse_ok: Boolean(m),
      full_name: fullName,
      firstname,
      lastname,
      email: m ? m[2].trim() : '',
      package_name: packageName,
      tier: tierMatch ? tierMatch[1] : '',
      // MM/DD/YYYY -> YYYY-MM-DD
      coaching_start_date: m ? `${m[6]}-${m[4]}-${m[5]}` : '',
      sign_up_date: (item.json.date || '').slice(0, 10),
      source_subject: item.json.subject,
    }
  };
});
```

`parse_ok` is returned deliberately: if TrainingPeaks rewords this email, the regex returns `null` and every field goes blank. Without an explicit flag that failure looks identical to a real athlete with no name — it writes a blank record rather than raising anything.

Then a Telegram node **`Telegram - CoachMatch Signup`**, chat ID `5952194741`:

```
🔵 Nuevo atleta COACHMATCH
Nombre en el email: {{ $json.full_name }}
Email: {{ $json.email }}
Paquete: {{ $json.package_name }} (tier: {{ $json.tier }})
Contratado: {{ $json.sign_up_date }}
EMPIEZA: {{ $json.coaching_start_date }}
Parse OK: {{ $json.parse_ok }}

Todavia NO se escribio nada en Twenty -- cargar a mano por ahora.
```

---

### Phase D — Test before activating

Test by **pinning data on the trigger node** rather than sending real email: open `Email Trigger (IMAP)` → in the **Output** panel click **Edit Output** (pencil) → paste the JSON → **Save**. The node now shows a pin icon and every run uses that data instead of polling IMAP. **Unpin all four tests when finished** — a pinned trigger left in place will keep replaying a fake athlete on the next manual run.

> **Two different ways to run, and the difference matters.**
> - **D1 runs partially, on purpose.** Click the ▶ play icon **on the `Route by Product` node itself**. n8n executes only that node and its upstream dependencies, so the All-Access chain below it never fires — no Twenty record, no Postgres row, no welcome email to a fake address. You still get the one thing D1 exists to prove: which output the Switch chose.
> - **D2, D3 and D4 use the normal "Test workflow" button.** Their branches end in a Telegram node and write nothing, so a full run is safe and the Telegram *is* the result.
>
> This is why D1 is worth doing at all: it's the one path that already worked, so it's the one this change could silently break.

> **Run one multi-item test.** A single-item test in the n8n UI provably cannot catch the "Run Once for Each Item" class of bug — pin **D2 and D3 together as a two-element array** and confirm you get *two* Telegram messages, one of each type. This is the specific check a single-item test misses.

**D1 — All-Access regression.** This must still behave exactly as before; it is the one path that already works and the one this change could break.

```json
[{"subject":"New subscription confirmation","date":"2026-08-08T12:00:00.000Z","textPlain":"Iván Koch - Triaperformance, way to close the deal! This email confirms the recent purchase of a subscription: Customer Name: Test AllAccess (test-aa@example.com) Subscription: Suscripción Triaperformance All-Access - $39.99/monthly Duration: monthly Amount Charged: $39.99 (including taxes) Invoice Number: TEST-AA-0001"}]
```

Run this one with the ▶ icon **on `Route by Product`**, not the Test workflow button. Expect `Classify Product` to output `productType: "ALL_ACCESS"` and the Switch to send the item to the **`All-Access`** output. Nothing downstream executes, so there is no test Person to clean up afterwards — deliberately, since `open-loops.md` already carries a cosmetic item for the test people left in Twenty from earlier debugging. Don't add to that pile to prove a routing decision.

**D2 — Private coaching.**

```json
[{"subject":"New subscription confirmation","date":"2026-08-08T12:00:00.000Z","textPlain":"Iván Koch - Triaperformance, way to close the deal! This email confirms the recent purchase of a subscription: Customer Name: Test Privado (test-priv@example.com) Subscription: Triaperformance 1-1 Coaching - $149.00/monthly Startup Fee: $50.00 Duration: monthly Amount Charged: $199.00 (including taxes) Invoice Number: TEST-PRIV-0001"}]
```

Expect: `productType = PRIVATE_COACHING`, the 🟢 Telegram, **nothing written anywhere**.

**D3 — Unknown product.** Uses the retired April product, which is exactly the real-world case this branch exists for.

```json
[{"subject":"New subscription confirmation","date":"2026-08-08T12:00:00.000Z","textPlain":"Iván Koch - Triaperformance, way to close the deal! This email confirms the recent purchase of a subscription: Customer Name: Test Viejo (test-old@example.com) Subscription: Coaching personalizado - Un deporte (running, ciclismo, natación) - $99.00/monthly Startup Fee: $40.00 Duration: monthly Amount Charged: $139.00 (including taxes) Invoice Number: TEST-OLD-0001"}]
```

Expect: the ⚠️ Telegram, **nothing written anywhere**. Before this change, this input created an `ALL_ACCESS` Person and issued a members token — so this test is the direct proof the bug is fixed.

**D4 — CoachMatch.**

```json
[{"subject":"Congratulations, You Have Been Hired by a New Athlete","date":"2026-08-08T12:00:00.000Z","textPlain":"New Coach Match Purchase Iván Koch - Triaperformance, Congratulations, you have been hired by Test A Prueba R (test-cm@example.com) at the Coach Match Bronze level coaching package starting on 08/12/2026. You will also receive an email with all of the necessary information to get started with your new athlete."}]
```

*Replaced Aug 8, 2026. The original payload copied a real athlete's name and address verbatim from Iván's sample email, which was fine while this branch only sent a Telegram and became a live write the moment Stage 2 landed.* The replacement keeps the two things the test actually exercises: a **four-token Latin American name** (`Test A Prueba R`), so the naming caveat in §3.1 stays visible, and **`08/12/2026`** as the start date — deliberately chosen because it reads as Aug 12 under MM/DD and Dec 8 under DD/MM, and **both are plausible future dates**. A wrong parse therefore can't hide behind an obviously-absurd result; only a correct one gives `2026-08-12`.

Expect the 🔵 Telegram with `EMPIEZA: 2026-08-05`, `tier: Bronze`, `Parse OK: true`. **Check the date reads August 5, not May 8** — that single field is the whole MM/DD assumption, and it is wrong-but-plausible for eight months of the year.

---

### Phase E — After it works

> **Done August 8, 2026. All four tests passed.** D1 routed to `All-Access`, D2 produced the 🟢 Private Telegram, D3 the ⚠️ Unknown Telegram, D4 the 🔵 CoachMatch Telegram. All 8 nodes mirrored into `automation/subscription-lifecycle-automation.json` (now 36 nodes); the dated addendum is in `ai-infrastructure-documentation.md` §12. The one-time paste helper `automation/stage1-classifier-paste.json` has been deleted, as planned — the live workflow and its repo mirror are the only copies now.
>
> **Outstanding: D1 was run as a full workflow execution rather than stopping at `Route by Product`**, so it wrote for real. Clean up:
>
> ```bash
> docker exec -it analytics-postgres psql -U analytics -d members -c \
>   "SELECT email, token, active, created_at FROM subscriber_tokens WHERE email = 'test-aa@example.com';"
>
> docker exec -it analytics-postgres psql -U analytics -d members -c \
>   "DELETE FROM subscriber_tokens WHERE email = 'test-aa@example.com';"
> ```
>
> Then delete the `test-aa@example.com` Person in Twenty's UI (People → search → delete). The welcome email went to a non-existent address on a reserved domain, so it will bounce harmlessly — and the bounce won't re-enter this workflow, because the `TP-Subscriptions` Gmail filter keys on `receipt@trainingpeaks.com` and a mailer-daemon bounce doesn't match it.

---

## 3.3 Stages 2 + 3 — Twenty write + members access

*Specified August 8, 2026, immediately after Stage 1 went live.*

### Decisions taken (Iván, Aug 8, 2026)

1. **A Private athlete not already in Twenty is auto-created, then flagged.** n8n writes the record and the Telegram asks for the two things it can't know — whether the name split correctly, and where the athlete came from. Rejected "alert only, I create it" because a manual step that only fires on a rare path is the kind that gets missed on a busy day, and rejected "auto-create silently" because wrong name splits would then accumulate unseen.
2. **1:1 athletes get members-area access, included, with the password in the welcome email — same as All-Access.** No cannibalisation risk: coaching is $149/mo against All-Access at $39.99, so the cheaper product is never the better deal. It also makes the tools library do double duty, which matters given All-Access has 2 subscribers and the library is the substance behind it.

### Shape: both channels converge into one chain

`Route by Product` → `Private Coaching`, and `Parse CoachMatch Hire`, both feed **one** `Normalize Coaching Athlete` node.

**Why one normalizer and not two branch-specific ones:** every node after it needs to reference the upstream data by node name, and **referencing a node that didn't run in the current execution throws in n8n.** Two build nodes would mean every downstream expression needs a fallback between them. One node, detecting shape by field presence (`package_name` ⇒ CoachMatch, `subscription_name` ⇒ Private), gives a single stable name to reference and halves the node count.

Normalized fields: `channel`, `email`, `full_name`, `firstname`, `lastname`, `product`, `signUpDate`, `coachingStartDate`, `leadSourceOnCreate`, `invoice_number`, `amount_charged`.

### The write rules

| Field | Create | Update | Why |
|---|---|---|---|
| `customerType` | `OPT1_1_COACHING` | `OPT1_1_COACHING` | the field that actually distinguishes customer types |
| `leadStatus` | `WON_CUSTOMER` | `WON_CUSTOMER` | |
| `signUpDate` | ✓ | ✓ | the hire/payment date |
| `coachingStartDate` | ✓ | ✓ | differs from `signUpDate` on CoachMatch only |
| `planPurchased` | product name | product name | |
| `churnDate` | — | `null` | clears a stale churn on a returning athlete |
| `name` | parsed | **never** | see the naming problem in §3.1 |
| `leadSource` | `COACHMATCH` on that channel only | **never** | |
| `sport`, `athleteLevel`, `phones`, `preferredLanguage`, `addressCountry` | — | **never** | |

**The update path deliberately writes six fields and no more.** `coachmatch-lead-automation.json` already sets `leadSource`, `preferredLanguage`, `sport`, `athleteLevel`, `addressCountry` and `phones` when the *lead* is created — so by the time a CoachMatch athlete converts, those fields hold real, hard-won qualification data. Overwriting them at conversion would destroy the attribution and profiling the lead pipeline spent weeks collecting. Create-only for acquisition facts, always-write for conversion facts.

**`leadSource` on a Private create is left null on purpose.** The TP Payments email carries no signal about origin — Iván's own example is a referral from an existing athlete, but it could equally be Instagram or the website form. Null is honest; `OTHER` is a guess that becomes indistinguishable from a real "other" six months later. The Telegram asks instead.

### Language — the one thing neither email tells us

`subscriber_tokens.preferred_language` and the eventual welcome email both need a language, and **neither confirmation email contains one.** The chain resolves it by reading `preferredLanguage` off the existing Twenty record if the athlete was already a lead (usually true for CoachMatch, since the lead workflow sets it), and writing SQL `NULL` when it isn't known. It does **not** default to Spanish — the same reasoning as `leadSource`, and per §13 the members-area auth is language-agnostic anyway, so a null costs nothing today.

The Telegram surfaces it as `Idioma: FALTA -- ponelo en Twenty`. Iván has spoken to every one of these athletes on WhatsApp before they paid, so he knows the answer; it's a five-second fix and a correct one, versus a guess that looks like data.

### Build instructions

**Import `automation/stage2-coaching-upsert-paste.json`** the same way as before — open, select all, copy, paste onto the n8n canvas. Ten nodes, internally wired.

**Two credentials to set by hand after pasting:**

- `Insert Coaching Token in Postgres` — the credential comes in as `REPLACE_ME` (the repo's workflow copies never carry a real Postgres credential id). Open the node and select **Members Postgres** from the dropdown.
- The Twenty and Telegram nodes carry working `{id, name}` references and should need nothing.

**Then wire and delete:**

| # | Action | From | To |
|---|---|---|---|
| 1 | Create | `Route by Product` output **`Private Coaching`** | `Normalize Coaching Athlete` |
| 2 | Create | `Parse CoachMatch Hire` | `Normalize Coaching Athlete` |
| 3 | **Delete node** | `Telegram - Private Coaching Signup` | — |
| 4 | **Delete node** | `Telegram - CoachMatch Signup` | — |

Steps 3 and 4 delete the two notification nodes added yesterday. Their text says *"todavia NO se escribio nada en Twenty"*, which stops being true the moment this chain is wired — and a message that lies is worse than no message. `Telegram - Nuevo Atleta 1a1` replaces both at the end of the chain, and carries the members password so athletes can be onboarded by hand until the welcome email is built.

### Failure handling — two kinds, handled two ways

*Added August 8, 2026, after the happy path went green.*

The notification sits at the **end** of the chain, so a failure halfway through produced no message at all — the run just stopped and nothing said so. Two fixes, deliberately different, because **an expected business case and an unexpected failure deserve different treatment.**

**1. Duplicate-on-create — expected, so it gets its own message.** `Check Existing Person (Coaching)` dedupes by **email only**. Twenty's own duplicate detection also considers **name**. So an athlete created by hand or through the July backfill, stored under a different email or none at all, passes the check and is then rejected on create with `400 — "A duplicate entry was detected"`. **This is confirmed, not theoretical** — it happened on the first Stage 2 test run, against a real athlete Iván had created manually. With 35 athletes imported by the July 25 backfill, it will happen again.

- Import `automation/stage2-create-error-catch-paste.json` (one Telegram node + sticky).
- Open **`Create Person (Coaching)`** → **Settings** tab → **On Error** → **Continue (using error output)**. The node grows a second, red output.
- Wire that **error output** → `Telegram - Alta 1a1 Fallida`. The success output keeps its existing connection to `Coaching Athlete Upserted` — nothing about the happy path changes.

The message names the likely cause and the exact manual fix (find by name in Twenty, add the email, re-run), and states plainly that **no password or members access was created** — because the failure happens before the token nodes, and a half-onboarded athlete is worse than an obviously-failed one.

*Using the node's error output rather than `neverError: true` + an IF is deliberate: `neverError` turns a failure into a success-shaped item that then flows down the happy path until something else breaks, which is the same implicit-fall-through pattern as the original All-Access bug.*

**2. Everything else — unexpected, so it gets collected and mailed daily.** *(Revised Aug 8, 2026 on Iván's push-back: the first design sent a Telegram per failure, which he flagged would get messy. Correct — and the revision sharpened the rule rather than just lowering the volume.)*

**The rule: interrupt for a person, batch for a machine.** A paying athlete stuck without access is worth a Telegram the moment it happens — that's `Telegram - Alta 1a1 Fallida` above, and it stays immediate and deliberately does **not** route through the collector. A transient API timeout at 3am is not worth a notification at all until morning. Two mechanisms, split on who is waiting.

- `automation/n8n-error-collector-workflow.json` — Error Trigger → one row in `n8n_errors`. Sends nothing in the moment.
- `automation/n8n-daily-error-digest-workflow.json` — 08:00 daily, reads the last 24h, mails a summary grouped by workflow. **Sends nothing on a clean day.**

Set the collector per workflow: three dots → **Settings** → **Error Workflow** → `Error Collector (global)`. Worth setting on **every** workflow — the CoachMatch lead pipeline, the contact form and the content engine all have the same silent-failure gap.

Create the table first:

```sql
CREATE TABLE IF NOT EXISTS n8n_errors (
  id            bigserial PRIMARY KEY,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  workflow_name text,
  workflow_id   text,
  node_name     text,
  error_message text,
  execution_id  text,
  execution_url text
);
CREATE INDEX IF NOT EXISTS n8n_errors_occurred_at_idx ON n8n_errors (occurred_at DESC);
```

> **The collector uses the Postgres `Insert` operation, not `Execute Query` — and that is not a style preference.** `queryReplacement` splits its input on commas to map values onto `$1, $2, …`, and **error messages are full of commas.** The same mechanism already cost a debugging round on Aug 8, when an empty `preferredLanguage` produced a trailing empty value that got dropped and Postgres reported `there is no parameter $4`. Free text must never go through `queryReplacement`. Standing rule.

**Known trade-off, stated rather than hidden:** a silent digest is indistinguishable from a broken one. Accepted because failed executions remain visible in n8n's own Executions list, so the digest is a convenience layer and not the only record — and because a daily "all clear" email is the fastest way to train yourself to ignore the one that matters.

### Testing

Re-pin the **D2** (Private) and **D4** (CoachMatch) payloads from §3.2 Phase D and run the full workflow.

> **Change the email address in the D4 payload before running it here.** As written in §3.2 it carries a real athlete's name and address, copied verbatim from Iván's sample email. That was harmless for Stage 1, where the branch only sent a Telegram — but this chain writes to Twenty and Postgres, so a real person gets modified. *Learned the hard way, Aug 8, 2026: the first Stage 2 run hit a Twenty `400 — "A duplicate entry was detected"` on exactly this.* **A test payload that was safe under one version of a workflow is not automatically safe under the next.** Swap in something like `test-cm@example.com` and a fake name.

Check after each run:

1. The 🏆 Telegram arrives, with `EMPIEZA` correct and a `Password members` value.
2. In Twenty: the Person has `customerType = OPT1_1_COACHING`, `leadStatus = WON_CUSTOMER`, and `coachingStartDate` populated.
3. In Postgres — one active token, `preferred_language` NULL for a fresh test athlete:

```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT email, token, preferred_language, active FROM subscriber_tokens ORDER BY created_at DESC LIMIT 5;"
```

4. **The update path is the one that matters most.** Run D4 **twice**. The second run must say `Twenty: actualizado`, and must **not** have changed the name, sport or leadSource — that's the test that the create-only convention actually holds. Then delete both test records.

---

## 3.4 Stage 4 — the welcome email

*Written August 8, 2026. Voice sourced from `brand-guidelines.md` §8, `automation/coaching-checkin/monday-message-voice-guide.md` and `methodology.md` §10 — not invented.*

### Decisions (Iván, Aug 8, 2026)

- **Auto-send, Spanish as the fallback** when `preferredLanguage` is UNKNOWN. EN and PT are used **only** when Twenty actually says so, so a known English athlete never receives a Spanish email — the fallback applies to unknowns, not to everyone.
- **Contents:** welcome to the team → the intake form → members login and password → the expectation that *we talk within 24 hours of the form being submitted, and the first days of training follow from that conversation.*

**What that promise does, and why it's the strongest line in the email.** It replaces a vague "we'll be in touch" with a specific, reciprocal deal: the athlete does one thing, and a named outcome follows within a named window. `methodology.md` §2 identifies unresponsive athletes as the main way this service fails to deliver value — an athlete who never fills the form never gets a plan, and that shows up later as churn nobody can explain. Tying the form to a concrete reward the athlete actually wants is the cheapest lever against that, and it costs nothing to state.

*Note it is also a commitment Iván now has to keep. The 24-hour window is his own documented response norm (§10), so it isn't a new promise — but it is now written down and sent to every athlete, which is different from being an unstated habit.*

### Voice notes applied

The email follows the athlete-message register, not the website register. Those differ, and the difference is deliberate: `brand-guidelines.md` §8 says avoid exclamation marks, but that governs site copy — two years of real athlete messages in the Monday voice guide use them warmly and constantly. Site voice is not messaging voice.

Also applied: **neutral tuteo, not voseo.** The voice guide says voseo/tuteo mixed, adapted per athlete — but that's for a message written to one person. This is a template going to a Colombian, a Peruvian and an Argentine alike, so it uses the form all of them read as natural. Adaptation belongs in the WhatsApp conversation that follows, where it can actually be per-athlete. No emojis, consistent with two years of real messages.

Each language is written natively rather than translated, per `brand-guidelines.md` §8.

### Build

Import `automation/stage4-welcome-email-paste.json` (3 nodes).

**Before anything else, open `Build Welcome Email` and set `FORM_URL`** at the top of the code. The node **throws deliberately** if you don't — a failed run is far better than a paying athlete receiving a dead link, and a placeholder that silently ships is exactly the kind of thing that survives to production.

Wire:

| # | Action | From | To |
|---|---|---|---|
| 1 | **Delete** | `Insert Coaching Token in Postgres` | `Telegram - Nuevo Atleta 1a1` |
| 2 | Create | `Insert Coaching Token in Postgres` | `Build Welcome Email` |
| 3 | Create | `Send Coaching Welcome Email` | `Telegram - Nuevo Atleta 1a1` |

**Then fix one line in `Telegram - Nuevo Atleta 1a1`.** It reads the password as `{{ $json.member_token }}`, which worked only while the Telegram sat directly after the token generator. With two nodes now in between, `$json` is the email node's output and the password would render blank. Change that line to:

```
Password members: {{ $('Generate Coaching Token').item.json.member_token }}
```

*This is the same class of breakage as the `source_date` bug: an expression that reads `$json` is silently coupled to whatever node happens to sit immediately upstream, and inserting a node into the chain breaks it without any error. Referencing nodes by name is the fix.*

Optionally add a line so the Telegram reports which language went out — useful while the Spanish-default assumption is still unproven:

```
Welcome enviado en: {{ $('Build Welcome Email').item.json.langUsed }}{{ $('Build Welcome Email').item.json.langWasKnown ? '' : ' (default, idioma desconocido)' }}
```

### Testing

Re-run the Private payload with an address **you can actually read** — not `example.com`, since the point is to see the rendered email. Check: the form link resolves, the password matches the `subscriber_tokens` row, and the Spanish reads like you and not like a translation.

Then delete the test Person, its token row, and re-run once more with a `preferredLanguage` of `ENGLISH` set on the record to confirm the branch switches.

---

## 4. The flow, as tasks

`M` = manual and staying manual (coaching judgment). `A` = automatable. `A*` = automatable but blocked on an open decision below.

### Stage 0 — Pre-sale · M · exists
Athlete shares goal, experience, available hours over WhatsApp → Instagram race photos + Google Business Profile reviews as social proof → subscription link with price, inclusions, cancel-anytime stated plainly. Owned by `methodology.md` §3. Also here: the **red-flag screen** (triathlete who can't swim, runner with no GPS watch, cyclist with no power meter or HR strap) — a "no" or a re-scope happens *before* payment, not after.

### Stage 1 — Detect the signup · A
1. ~~Capture a real Private-channel confirmation email~~ **Done Aug 8, 2026 — parsed, spec in §3.1.** Remaining: the **full list of active Private coaching product names** in the TP Payments product builder. One is known (`Coaching personalizado - Un deporte (running, ciclismo, natación)`, $99, Apr 2026); there are certainly others — multi-sport, and any EN/PT variants — and the classifier allowlist can't be written without all of them.
2. ~~Capture a real CoachMatch notification~~ **Done Aug 8, 2026 — parsed, spec in §3.1.** Remaining: confirm whether any CoachMatch tier other than `Bronze` is ever sold.
3. **Fix the unfiltered All-Access branch — see §3. Do this first, it is a live bug.** Two parts: (a) add a product-name condition so the All-Access branch only fires on the three real All-Access products, with an explicit Telegram alert on any unmatched product rather than a silent pass-through; (b) run a one-time audit of existing `ALL_ACCESS` records in Twenty against `planPurchased` to find coaching athletes mislabelled by it, and check `subscriber_tokens` for tokens issued to them.
4. Build the trigger: reuse the IMAP node, add a 1:1 branch on product-name match.

### Stage 2 — Twenty record · A
5. Dedupe by email. **The update path is the common case, not the exception** — most 1:1 athletes arrive as an existing CoachMatch or website-form lead. Create is the fallback.
6. Set: `customerType: OPT1_1_COACHING`, `leadStatus: WON_CUSTOMER`, `signUpDate` (**not** `purchaseDate` — the two are separate and easily conflated, §12), `preferredLanguage`, `addressCountry`.
7. Set on **create only**, never on update: `sport`, `leadSource`, `athleteLevel` — overwriting these on an existing lead destroys real qualification data. This convention is already established in `backfill_existing_customers.py`.
8. Add a Twenty field or convention for **onboarding state** so the CRM shows where an athlete is without holding the payload: `PAID` → `INTAKE_SENT` → `INTAKE_RECEIVED` → `WEEK_MAPPED` → `TESTING` → `ACTIVE`. *(New field — needs creating in Twenty's UI by Iván; Twenty's introspection is disabled so the enum must be confirmed by hand, §8.)*

### Stage 3 — Provision access · A
9. ~~Open decision~~ **Decided Aug 8, 2026: yes, included, password in the welcome email, same as All-Access.** Built in the same pass as Stage 2 — see §3.3.

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

1. ~~The full list of active Private coaching product names~~ **Answered Aug 8, 2026: one product, `Triaperformance 1-1 Coaching`, $149/mo + $50 startup, promocode `NOSTARTUP`. One CoachMatch tier, Bronze.** Build instructions in §3.2.
2. **Phase A audit results** — any "NO RECONOCIDO" Telegram since July 24, 2026, plus the Twenty and `subscriber_tokens` cross-checks. That's the exact list of records damaged by the §3 bug.
3. ~~The `coachingStartDate` API name and the full `leadSource` enum~~ **Both answered Aug 8, 2026** — field created as `coachingStartDate` (Date), and `leadSource` has six values including `COACHMATCH`. Details and the resulting mapping in §3.2 Phase B.
4. **The Google Form's actual questions** — paste them, or share the form. Blocks the typed columns in `athlete_intake`, the Stage 7 digest, and the `athlete_profile` parse.
5. **Do 1:1 athletes get members-area access?** Yes/no. Blocks Stage 3 and one paragraph of the welcome email.
5. **The Stage 5 listening decision** — recommendation is (b), Apps Script → Caddy → n8n.
6. **Create the onboarding-state field in Twenty's UI** and read back the exact enum values, since introspection is disabled.

## 6. Sequencing note

Task 3 in Stage 1 goes first and is not really part of this project — it's a live bug that this project happened to uncover (§3). There are likely wrong records in Twenty right now, and every 1:1 sale adds another.

After that, the cheapest real win is task 25 (the templated test-hygiene message): it's already a message he sends every time, it needs no form, no schema and no trigger, and it converts a recurring manual send into a template today.
