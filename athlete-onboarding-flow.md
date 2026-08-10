# 1:1 Athlete Onboarding

**Home doc for the 1:1 onboarding initiative.** Created August 8, 2026; branch closed August 9, 2026.

**Build record: `athlete-onboarding-build-log.md`** — phases, wiring, test payloads, the bugs. Closed; read only for the reasoning behind a past decision or the exact shape of a TrainingPeaks email.
**Technical systems: `ai-infrastructure-documentation.md` §12 and §21.** That doc owns the systems; this one owns the decisions.
**Coaching content — what to prescribe — is owned by `methodology.md` and never restated here.**

---

## 1. What runs today

**Everything from "an athlete paid" to "Iván has a written briefing" is automatic.** No manual step.

> payment (either channel) → product classified → Twenty record created or updated → members token issued → welcome email with password and intake-form link, in the athlete's language → athlete submits the form → stored in `athlete_intake` → Gemini briefing → email + Telegram

And the exit, on both channels: `CHURNED_CUSTOMER` + `churnDate`, members access revoked, goodbye email in the athlete's language.

| Piece | Where |
|---|---|
| Signup, classification, Twenty write, members token, welcome email, both cancellation paths | `automation/subscription-lifecycle-automation.json` — IMAP-triggered |
| Form receipt, storage, Gemini briefing | `automation/athlete-intake-workflow.json` — webhook-triggered |
| Form → webhook | `automation/athlete-intake/onFormSubmit.gs` (runs in Google; repo copy is the source of truth) |
| Public route | `route /api/athlete-intake` in `automation/Caddyfile` |
| Failure reporting | `automation/n8n-error-collector-workflow.json` + `n8n-daily-error-digest-workflow.json` |

**Still manual, and mostly by choice:** the perfect-week WhatsApp conversation, the activation-vs-testing judgement, and publishing the first block. Stage 8 below is the only one worth automating further.

---

## 2. Decision: where athlete data lives

**Decided August 8, 2026: a new Postgres table on the existing `analytics-postgres` container, keyed by `twenty_person_id`. Twenty holds the commercial record; Postgres holds the training context; TrainingPeaks holds a generated human-readable mirror.**

The three candidates and why the others lose:

- **Twenty custom fields — rejected.** Twenty's Person object is the commercial record: who they are, what they bought, when they signed up, when they churned. Onboarding context is a different kind of data and breaks Twenty in three specific ways. (a) It changes over time — the perfect week gets renegotiated, the training history grows, thresholds get re-tested — and a CRM field is single-valued with no history, so every update destroys the previous answer. (b) A meaningful chunk of it is long free text, which a CRM list view renders unusable. (c) It would double the Person schema with fields that mean nothing for the other two customer types, and `customerType` already has three values.
- **TrainingPeaks notes — rejected as the system of record, kept as an output.** It's where the perfect week goes today and where it should still be visible, because that's where Iván works. But `triaperformance-business-overview.md` is explicit that there is **no programmatic access to TrainingPeaks data**. Anything stored only there is invisible to the AI Coach, to a future hired coach's handoff, and to every automation in this doc. It fails the standing test — storing there costs his time forever, because only re-reading by hand can retrieve it.
- **Postgres on `analytics-postgres` — chosen.** It's already running, already reachable from n8n's Postgres nodes with a debugged credential, and the decoupling precedent is already an explicit architectural decision in this repo: `subscriber_tokens` deliberately does not live in Twenty (§13). Same reasoning, same shape. It supports append-only history rather than destructive updates, and it is the substrate both the AI Coach and the coach-hire handoff need — which are two LATER items that currently have no data layer to stand on.

**The rule that falls out of this:** Twenty answers *"is this person a paying 1:1 athlete, since when, and are they still one"*. Postgres answers *"who is this athlete and how do they train"*. Nothing is written to both. The join is `twenty_person_id`.

### Schema

> **Status, August 9, 2026: `athlete_intake` is BUILT and live** (in `public` on the `members` database, not a separate `athletes` schema — one fewer thing to configure, and it sits alongside `subscriber_tokens`, which shares its join key). Live columns: `id`, `submitted_at`, `form_language`, `email`, `full_name`, `twenty_person_id`, `raw`, `briefing`, `briefing_model`, `briefing_at`.
>
> **`athlete_profile` was deliberately NOT created.** A schema nothing writes to is speculative, and the Gemini briefing turned out to cover much of what it was for. It belongs with Stage 8 (§6), whoever builds that.
>
> *The sketch below is the original design, kept because the reasoning still holds. Read it as intent, not as what exists.*

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

~~**Open before build:** whether this is a new database or a schema inside `members`.~~ **Settled Aug 9, 2026 — same database, `public` schema.**

---

## 3. Two acquisition channels, two triggers

Not one. This is the structural fact the whole build turns on, and the original one-line spec missed it.

- **Private** — the athlete pays through TP Payments. Subject `New subscription confirmation`, **identical to All-Access**, because both are built in the same product builder. They are told apart only by the product name on the `Subscription:` line. One active product: `Triaperformance 1-1 Coaching`, $149/mo + $50 startup, promocode `NOSTARTUP`.
- **CoachMatch** — TrainingPeaks bills the athlete directly (20% commission vs 3.5%). Different subject, different template, and the athlete usually already exists in Twenty as a lead. One tier ever sold: Bronze, $149/mo.

They converge from the Twenty-record step onward. Only detection branches.

**The generalizable lesson, and the most expensive thing this branch found:** the All-Access branch had **no `UNKNOWN` case**, so an unrecognised product didn't stop — it proceeded with `customerType: 'ALL_ACCESS'` hardcoded as an implicit default, issuing a members token and sending the wrong welcome email. *Blast radius was zero only because no subscription had come in since the workflow went live.* **Any classifier that can only say "this" or "assume this" will eventually mislabel something. Allowlists must be explicit and the fall-through must write nothing and shout.**

---

## 4. The intake form — why the availability grid was replaced

*August 8, 2026. Based on the real response exports (51 Spanish, 6 English), not on reading the form.*

The form has **39 columns**. Both languages share an identical structure, so one parser covers both. It is, on the whole, a good form — identity, devices, goals, training history, testing, injuries, self-assessment. **One question is broken, and it happens to be the one that matters most for building a week.**

### Why the availability grid fails

`Disponibilidad semanal` is a 7-day × 5-option checkbox grid: *Día de descanso · Piscina disponible · Gimnasio disponible · Puedo hacer doble sesión · Ideal para entreno largo.* Iván already bypasses it and asks on WhatsApp instead. The exports show why:

- **No time dimension at all.** The options capture *facilities and flags*. None express duration or time of day. "Gimnasio disponible" on Tuesday says a gym exists; not whether it's 45 minutes at 6am or two hours at night. `methodology.md` §3 names "morning/evening time caps" as part of the perfect-week interview — the form never asks.
- **33% of athletes (17/51) never marked a rest day anywhere.** Not because they train seven days; because nothing forces it.
- **18 cells tick `Día de descanso` together with another option.** The options aren't mutually exclusive, so "rest day with gym available" is expressible and meaningless.
- **14% of cells are blank (51/357), and blank is unreadable** — no availability, rest day, or skipped? Some athletes use blank *as* rest while others use the explicit option, so the same mark means different things per athlete.
- **It conflates four dimensions** in one list: facility access, capacity, preference, and a negation.

**The decisive finding: across all 51 completed forms, exactly one athlete stated their available hours anywhere** — and only in passing, in the final catch-all question ("Trabajo de lunes a viernes de 7:30 a 15:30"). The single most important planning input is absent from 50 of 51 responses.

> *Method note, worth keeping.* A first pass claimed "37 of 51 responses contain schedule information", which would have been a much more flattering finding. Checking the actual matches showed nearly all of them were **race times and paces** — `3:17` marathon, `6:30 min/km`, `2:11:47` half PR — caught by a regex looking for `H:MM`. The real count was one. **A number that makes the argument better is exactly the one to verify before using.**

### The fix: stop fixing it

Replace all seven grid columns with **one free-text question phrased the way Iván already asks on WhatsApp**, plus a worked example — the example is what makes free text work — and **one structured question for available hours**.

**Why free text is now the right answer, and wasn't before.** A checkbox grid is a workaround for not being able to parse prose. That constraint is gone: a model reads the answer. Structuring the input to suit a parser that no longer needs it costs the very nuance ("la piscina solo abre martes y jueves", "los viernes depende del trabajo") that makes a week actually plannable.

**And the parser's job includes reporting what's missing.** The briefing says *"no dijo horarios de mañana/tarde"* so Iván knows exactly what to chase on WhatsApp. That is what makes free text safe rather than a gamble — the failure mode becomes visible instead of silent.

**Available hours is added as a separate structured question** because it's the one number worth not leaving to prose. The form already asks hours trained *in the last three months* (cols 19–22) — that's history, not capacity, and `methodology.md` §5's 16-week example is built off available hours the form never captures.

### Two Google Forms gotchas that shape the build

1. **Deleting a question does not delete its column** from the linked responses sheet. The seven grid columns stay, holding historical data, and simply go blank for new responses.
2. **New questions are appended as new columns at the far right of the sheet, not in form order.** So sheet column *position* will not match form order after this edit.

**Therefore the pipeline keys on question text, never on column index.** The Apps Script uses `e.namedValues`, which arrives as a header→value map — immune to both gotchas, and to any future form edit.

---

---

## 5. Traps that will bite again

Every one of these was found by running real data, not by reading code. Kept here rather than in the build log because they generalise beyond this initiative.

**TrainingPeaks subject lines nest inside each other.** `Subscription cancellation` vs `...cancellation scheduled` was already known. This branch found a second: `Coaching Service Cancellation **Request** - Athlete X` (notice, future date, keep coaching) contains `Coaching Service Cancellation - Athlete X` (actually cancelled). A `contains` filter on the shorter string churns a paying athlete mid-service. **Match on a string that includes what comes next** — here, `Cancellation - Athlete`.

**The CoachMatch cancellation email has no email address.** `Nelson Carrion ()` — empty parentheses. The *request* email includes it; the *confirmed* one doesn't. Every other branch joins on email; that one matches by normalized name against `OPT1_1_COACHING` records only, and **writes nothing unless exactly one record matches**.

**Twenty's duplicate detection considers more than the field you filter on.** Dedupe by email passed, then `createPerson` returned `A duplicate entry was detected` because a hand-created athlete existed under the same *name*. With 35 athletes from the July backfill this recurs; `Create Person (Coaching)` uses the node's error output into a dedicated Telegram.

**Create-only for acquisition facts, always-write for conversion facts.** `sport`, `athleteLevel`, `phones`, `preferredLanguage`, `addressCountry`, `leadSource` are set by the *lead* pipeline and must never be overwritten at conversion — that would destroy the qualification data it collected. The update path writes six fields and no more.

**Null is honest; a plausible default is a guess that looks like data.** The TP email carries no signal about where a Private athlete came from, so `leadSource` is left null and the Telegram asks. Same for `preferredLanguage`. A written `OTHER` becomes indistinguishable from a genuine "other" six months later.

**Expressions that read `$json` are coupled to whatever node happens to sit immediately upstream.** Inserting a node into a chain breaks them silently, with no error. Reference nodes by name. *(Cost one round when the welcome email was inserted before the Telegram and the password rendered blank.)*

Two more, technical, recorded in `ai-infrastructure-documentation.md` §12 and §21: `queryReplacement` splits on commas and drops trailing empties, so free text must never go through it; and an n8n Postgres column that the database should fill must be **omitted** from the mapping, never left blank.

---

## 6. What's left

### Stage 8 — capture the perfect week · the one worth automating
The WhatsApp conversation stays manual; it's a conversation, not a form. What should change is where the answer lands: today it's typed into a TrainingPeaks note, which has **no programmatic access**, so it's invisible to the AI Coach, to a hired-coach handoff, and to every automation here. Store it as structured `perfect_week` data and *generate* the TP note from it.

This is where **`athlete_profile`** gets created. §2 designed two tables; only `athlete_intake` exists, deliberately — a schema nothing writes to is speculative. It belongs with this stage.

*Partly superseded:* the Gemini briefing already produces a day-by-day reading of the athlete's stated week and names what's missing. Stage 8 is now about **persisting and updating** that over time, not about producing it once.

### Stage 9 — the first block · M, with one cheap win
Activation-vs-testing is coaching judgement. But the **test-hygiene message** is already sent verbatim to every athlete and is pure template — three languages, no form, no trigger, no schema. It has been the lowest-hanging item since day one and is still not done.

Test *selection* is also deterministic given sport + equipment (`methodology.md` §3), and the briefing already suggests it.

### Stage 10 — definition of done
Onboarded = Twenty record `ACTIVE`, intake stored, perfect week captured, thresholds recorded from a completed test, first block published. Anything short of that is a stalled onboarding and nothing currently makes that visible. Needs the `onboardingState` field, which was specified and never created.

### Carried forward
Follow-ups created by this branch live in `open-loops.md`, not here — one list, one home.

---

## 7. Standing decisions (do not relitigate without new evidence)

1. **Twenty holds the commercial record, Postgres the training context, TrainingPeaks a generated mirror.** §2.
2. **1:1 athletes get members-area access included**, password in the welcome email. Coaching is $149/mo against All-Access at $39.99, so there is no cannibalisation risk.
3. **Spanish is the fallback language, not the default.** EN and PT are used whenever Twenty actually knows; only unknowns fall back.
4. **A Private athlete not already in Twenty is auto-created, then flagged** for the two things automation can't know: whether the name split correctly, and where they came from.
5. **The intake form's availability question is free text, and stays free text.** §4.
6. **Interrupt for a person, batch for a machine.** A paying athlete stuck without access gets an immediate Telegram; everything else waits for the 08:00 digest.
7. **No exit survey, no win-back offer in the goodbye email.** `methodology.md` §2 — exit is cordial and ends cleanly at the billing boundary. Win-back is a separate, deliberate campaign.
