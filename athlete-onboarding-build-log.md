# 1:1 Athlete Onboarding — build log (CLOSED)

**Closed August 9, 2026.** This is the build record for the 1:1 onboarding branch: the phases, the paste-and-wire steps, the test payloads, and the bugs found along the way. Everything described here **is built, tested and live**.

**Read this only when you need the reasoning behind a past decision, or the exact shape of a TrainingPeaks email.** For what the system does today, the standing decisions, and what is still open, read `athlete-onboarding-flow.md` — that is the home doc and the only one that needs loading in a normal session.

*Split out of `athlete-onboarding-flow.md` on August 9, 2026, the day the branch closed. That file had reached 96 KB, roughly 60 KB of which were instructions for building something already built — the same shape as `open-loops.md` before its own split, and the same failure the retired plan-storefront brief caused by staying in the index. Nothing was summarised on the way out; the sections below are unchanged.*

**Technical rules extracted from this work live in `ai-infrastructure-documentation.md` §12 and §21**, not here — that doc owns systems, this one owns the build narrative.

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

Test by **pinning data on the trigger node** rather than sending real email: open `Email Trigger (IMAP)` → in the **Output** panel click **Edit Output** (pencil) → paste the JSON → **Save**. The node now shows a pin icon and every run uses that data instead of polling IMAP.

> **Unpin when finished, and do not restore whatever was pinned before.**
>
> Pinned data is **ignored during production runs** — n8n only applies it to manual executions in the editor — so a forgotten pin never affects live behaviour. It matters for two other reasons. First, any future "Test workflow" click silently replays a fake athlete against live Twenty, Postgres and SMTP; that is exactly how `test-aa@example.com` came to exist. Second, and more important: **whatever was pinned here originally was a real TrainingPeaks email**, which means a real customer's name and address. `pinData` travels inside the exported workflow JSON, so restoring it would put a customer's PII one export away from this repo — against the standing rule that customer names and emails never enter it. *(Checked Aug 9, 2026: all four workflow mirrors in `automation/` have empty `pinData`. Nothing has leaked.)*
>
> **This is why every test payload in this doc is synthetic.** The documentation carries the fixtures so the workflow doesn't have to.

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

~~Set the collector per workflow: three dots → **Settings** → **Error Workflow** → `Error Collector (global)`.~~ 🚨 ***Corrected September 3, 2026 — this instruction was followed with a different workflow and the mistake was invisible for a month.*** **The live instance already had `Error notifier (global)`, which sends the Telegram, and that is what got wired into every workflow's Error Workflow field.** *n8n allows exactly **one** error workflow per workflow, so `Error Collector (global)` was not misconfigured — it was **unreachable**, and its execution count stayed at zero while `n8n_errors` stayed empty and the 08:00 digest returned green every morning with nothing to send.* ***Both names are reasonable things to put in that field, the field holds one value, and nothing anywhere compared the two.*** **The fix was to move the `Store Error in Postgres` node into `Error notifier (global)`** — one node, parallel to the Telegram so the alert never waits on Postgres — *and delete the collector.* **Verified September 3, 2026 by a deliberate smoke test** *(a temporary active workflow with a webhook and `throw new Error(...)`, fired from the box): row written, Telegram delivered.* ⚠️ *The test had to be a **production** execution — the Error Trigger does not fire for manual runs, which is the most likely way to get a false negative here.* Worth setting on **every** workflow — the CoachMatch lead pipeline, the contact form and the content engine all have the same silent-failure gap.

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

✅ ***Digest confirmed delivering, September 3, 2026*** — *forced run, email received with one error in it. The full chain is verified end to end: failure → Error Trigger → notifier → `n8n_errors` → 08:00 digest → inbox.*

**Known trade-off, stated rather than hidden:** a silent digest is indistinguishable from a broken one. ⚠️ ***That trade-off came due: it hid a completely unwired collector for a month, and the only visible symptom — a workflow with zero executions — was not being watched by anything.*** *Accepting it a second time is a choice, not an oversight; the cheap mitigation is a monthly `n8n_errors` count in the close, where a zero is read by a human who knows what non-zero looks like.* Accepted because failed executions remain visible in n8n's own Executions list, so the digest is a convenience layer and not the only record — and because a daily "all clear" email is the fastest way to train yourself to ignore the one that matters.

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

---

## 3.6 Stages 5–6 — receiving and storing the intake

*August 9, 2026. Built as its own workflow, **not** added to `subscription-lifecycle-automation`.* That file is at 49 nodes and already carries an unrelated tenant (the resend-password webhook). The right split for n8n workflows is **by trigger, not by stage** — one IMAP-driven workflow, one webhook-driven workflow — because a trigger is what defines a workflow's failure domain and its execution history.

### Decisions

- **Apps Script → webhook, not the n8n Google Sheets trigger.** No Google credentials in n8n (an unstarted open item), no polling job, and it reuses the Caddy route pattern already debugged for the contact form. The cost — code living in Google, outside version control — is handled by mirroring it at `automation/athlete-intake/onFormSubmit.gs`, the same pattern used for `Caddyfile` and the VPS Python scripts. **Edit the repo copy, paste to Google; never the reverse.**
- **The endpoint is authenticated by a Header Auth credential on the webhook node**, not by a comparison inside the workflow. `/api/athlete-intake` is public; without a check, anyone who finds it can inject fake athlete intakes into the database.
  *Revised Aug 9, 2026.* The first design compared the header against a literal string in an IF node. That works, but **it bakes the secret into the workflow JSON — the file that gets mirrored into this repo and committed**, which breaks the standing no-secrets-in-the-repo rule the moment the mirror is updated. Using n8n's built-in Header Auth keeps the value in the credential store, rejects bad requests with a 401 *before any node runs*, and removes three nodes.
  *Accepted trade-off:* n8n rejects unauthorized requests without executing the workflow, so there is no Telegram on a failed attempt. The "someone is probing the endpoint" alert is lost. Worth it — a secret in git is a certainty, a probe alert is a maybe, and the alert would itself have been a noise vector.
- **Split from the Gemini briefing deliberately.** This chunk receives and stores; the briefing is next. The Caddy `rewrite` gotcha cost real debugging time on `/api/contact-form` in July 2026, so the plumbing gets proven on its own before an LLM call is layered on top of it.

### Keyed on question text, never column position

Both gotchas from §3.5 are handled by using `e.namedValues`, which Google delivers as a **question-text → answer map**. Column order is irrelevant, deleted questions are simply absent, and new questions appear under their own name. The n8n normalizer matches the same way, with a trailing-space-and-case-tolerant lookup — the live form already contains `Disponibilidad semanal [Sábado ]`, with a trailing space, which an exact match would miss.

**Language is detected from the question text too** (`Correo electrónico` vs `Email address`), not the sheet name — sheets get renamed and copied, and the current exports are literally named "Copy of ES" and "Copy of EN".

### The two real test answers, and what they prove

The first submissions on the redesigned form:

> **ES:** *"Lunes: descanso / Martes y jueves: running, intensidad por la mañana / Sábado running regenerativo / Domingo running fondo / Los demás días ciclismo regenerativo opcional por la mañana o la tarde / Gimnasio miércoles y viernes"*

> **EN:** *"Rest on Sundays / Saturday more time available / Monday to Friday: available only 1 hour in the morning"*

Neither is the strict day-by-day list the example asked for, and that is the useful finding. Real answers **group days** ("Martes y jueves", "Monday to Friday"), use **implicit sets** ("los demás días"), **layer** activities across a week rather than listing them per day, and describe **constraints** rather than plans. No checkbox grid could have captured any of this — and equally, no regex will parse it. This is exactly the shape of input that justifies a model.

**Both are also incomplete, in different ways.** The Spanish answer gives no durations. The English answer — from a triathlete with 6–8 hours a week — never says which sport happens on which day. **This is why "report what's missing" is a requirement of the briefing and not a nicety:** the gaps are specific, they differ per athlete, and they are precisely what Iván needs to ask on WhatsApp.

### Build

**1. Create the table** — run from Iván's terminal, as a heredoc:

```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
CREATE TABLE IF NOT EXISTS athlete_intake (
  id               bigserial PRIMARY KEY,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  form_language    text,
  email            text NOT NULL,
  full_name        text,
  twenty_person_id uuid,
  raw              jsonb NOT NULL,
  briefing         text,
  briefing_model   text,
  briefing_at      timestamptz
);
CREATE INDEX IF NOT EXISTS athlete_intake_email_idx ON athlete_intake (email);
CREATE INDEX IF NOT EXISTS athlete_intake_submitted_idx ON athlete_intake (submitted_at DESC);
SQL
```

> **`docker exec -i`, not `-it`.** The `-t` flag allocates a TTY, which breaks heredoc input.
>
> *Corrected Aug 9, 2026.* This block was originally written as bare SQL, and was pasted straight into bash — which tried to execute each line as a shell command and produced a screen of `command not found`. Harmless, but avoidable. **Standing rule for this repo: every command written for Iván is copy-pasteable as-is into his shell.** SQL is never presented on its own; it always arrives inside the `docker exec` that runs it. Same for any future psql snippet here.

`raw jsonb` holds the complete submission, always. The typed columns exist only for the fields automation actually branches on. **A schema that stores only what today's parser understands silently discards whatever the form gains next** — and this form has now changed once already.

The `briefing*` columns are created empty here and filled by the next chunk, so the table doesn't need altering mid-build.

**2. Caddy route** — added to `automation/Caddyfile`. Commit, push, and let the daily `deploy-website.sh` job diff and reload it, or trigger that job manually. Do not hand-edit `/etc/caddy/Caddyfile` on the box.

**3. Apps Script** — `automation/athlete-intake/onFormSubmit.gs` carries its own setup instructions in the header. The trigger must be the **installable** "On form submit" from the spreadsheet, not the simple `onFormSubmit()`: simple triggers can't call external URLs, because `UrlFetchApp` requires authorization.

> **Both forms write to one spreadsheet, on tabs `ES` and `EN`** *(confirmed by Iván, Aug 9, 2026)*. A spreadsheet-level form-submit trigger fires for **every** form linked to that spreadsheet, so this is **one script and one trigger**, not one per language.
>
> **Language is resolved from two independent signals, and disagreement is recorded.** The tab name is explicit and under Iván's control, but it's a *label*, and labels drift — the exported copies were already named "Copy of ES". The question text is derived from *content* and cannot be wrong. Content wins; the tab name is the fallback when a question gets reworded. Computing both costs nothing and catches a real misconfiguration class: a form rewired to the wrong tab would otherwise send English athletes a Spanish briefing with nothing anywhere saying so. The `language_mismatch` flag lands in `raw` and is surfaced in the briefing step.
>
> The file also carries `testReplayLastRow()` — run it once by hand from the Apps Script editor to prove the whole path (properties → Caddy → n8n → Postgres) without waiting for a real athlete. It replays the last row of a chosen tab as if it had just been submitted.

The script emails Iván if the POST fails, and says explicitly that the response is still safe in the sheet. **A silently lost submission is the worst outcome in this whole flow** — the athlete believes they've done their part, and nothing downstream ever knows.

**4. n8n** — new workflow named `Athlete Intake Form`, paste `automation/stage5-athlete-intake-paste.json`. Activate it: a webhook only serves its production URL while the workflow is active.

Two credentials, neither of them new-per-table:

- `Store Intake in Postgres` → **Members Postgres**. n8n Postgres credentials are per **database**, not per table, and `athlete_intake` lives in the same `members` database as `subscriber_tokens` — so no new credential is needed. The table dropdown stays empty until a credential is selected, which is the usual reason a freshly created table "doesn't appear".
- `Webhook - Athlete Intake` → **Header Auth** credential named `Athlete Intake Secret`, header name `X-Intake-Secret`, value generated with `openssl rand -hex 32` and stored in Bitwarden. Same value goes into the Apps Script property.

> **Then delete six of the ten column mappings on the Postgres node.** Once the credential connects, n8n auto-populates *every* column from the table schema, and two of the defaults it inserts are actively wrong:
> - **`id` arrives pre-filled with `0`.** That overrides the `bigserial` sequence and inserts literal id 0; the next submission collides on the primary key.
> - **`submitted_at` arrives blank**, and blank is not absent. A column default only applies when the column is **omitted from the INSERT** — an explicit empty value sends NULL and violates `NOT NULL DEFAULT now()`.
>
> Remove `id`, `submitted_at`, `twenty_person_id`, `briefing`, `briefing_model`, `briefing_at`. Keep exactly **`form_language`, `email`, `full_name`, `raw`**.
>
> `email` and `raw` have no delete icon — n8n won't let you remove `NOT NULL` columns, which doubles as confirmation the schema loaded correctly.
>
> **General rule: a column the database should fill must be omitted from the mapping, never left blank.**

---

---

## 3.7 Stage 7 — the Gemini briefing

*August 9, 2026. Extends the `Athlete Intake Form` workflow; runs after the intake row is stored.*

### Why a model at all

The three inputs that matter most — the ideal week, the goal, the injury history — are all prose, and the real answers group days, use implicit sets, and describe constraints rather than plans (§3.6). No parser handles that. But the briefing's real value isn't the summary; it's **section 4, what to ask on WhatsApp**. Both real test answers were incomplete in *different* ways, and naming the specific gap per athlete is a judgement task.

### Model choice

`gemini-3.1-pro-preview` — the same model `automation/content-engine`'s writer uses, so it's already proven against this API key. **Pro, not the `gemini-3.5-flash` Hermes runs on**, and the reason is in `ai-infrastructure-documentation.md` lesson 7: *"Hermes unreliability on sustained agentic work (flash-tier) — narrated success while producing broken code."* This runs a few times a month; the cost difference is noise and the quality difference is not. *(Note, August 17, 2026 — **Hermes no longer runs `gemini-3.5-flash`; it runs `gemini-3.7-flash`** as of that date. The sentence above is left as the record of the reasoning at the time, but do not read it as a current statement of what Hermes runs. The briefing itself is still on `gemini-3.1-pro-preview` and was deliberately not moved — see `ai-infrastructure-documentation.md` §33.)*

*Noted tension, not resolved here:* `-preview` is a rolling alias, and infra §3 records a deliberate preference for pinned stable releases "not a `-preview` or `-latest` rolling alias that could change behavior unannounced". The content engine already defaults to a preview alias, so this follows existing practice rather than inventing a second one — but both should move to a pinned release together.

### Prompt design

The prompt is condensed from `methodology.md` §2, §3 and §5 — the test-protocol table, the red-flag list, and the 50+ block rule. **If the methodology changes, `Build Briefing Prompt` is the thing to update.**

Three rules do the heavy lifting:

- **"No inventes NADA. Si el atleta no dijo algo, escribi exactamente *no lo dijo*."** A briefing that quietly fills gaps is worse than no briefing, because Iván would plan against invented constraints.
- **Every day in the proposed week is tagged `[dicho]` or `[inferido]`.** The model must expand "los demás días" into seven days to be useful, and marking which days were actually stated keeps that expansion honest and checkable at a glance.
- **Injuries are listed with "derivar a médico", never interpreted.** `methodology.md` §11 makes this absolute for humans and AI alike.

**Age is computed in code, not left to the model** — date arithmetic is exactly the kind of thing an LLM gets subtly wrong, and `methodology.md` §5 hangs a real structural decision on it (50+ gets 2+1 blocks and shortened ATL/CTL constants).

### Build

Paste `automation/stage7-briefing-paste.json` into the **existing** `Athlete Intake Form` workflow.

**Credential:** new Header Auth named `Gemini API` — header name `x-goog-api-key`, value = the same `GOOGLE_API_KEY` already on the VPS for Hermes. Set it on `Call Gemini`. `Get Intake Id` and `Save Briefing` use **Members Postgres**.

**Rewire:**

| # | Action | From | To |
|---|---|---|---|
| 1 | **Delete node** | `Telegram - Intake Recibido` | — |
| 2 | Create | `Store Intake in Postgres` | `Respond OK` |
| 3 | Create | `Respond OK` | `Get Intake Id` |

**`Respond OK` moves to the middle of the chain on purpose.** Gemini takes 10–30 seconds; n8n keeps executing after responding, so Apps Script gets its 200 as soon as the row is safely stored rather than holding a connection open through an LLM call. The intake is durable at that point, so a later failure costs the briefing, never the data.

`Telegram - Intake Recibido` is deleted rather than kept: two Telegrams per athlete is noise, and the second one carries everything the first did.

### Testing

Run `testReplayLastRow()` again. Expect a briefing email within ~30s, a ✅ Telegram, and:

```bash
docker exec -it analytics-postgres psql -U analytics -d members -c \
  "SELECT id, email, briefing_model, briefing_at, left(briefing, 200) FROM athlete_intake ORDER BY id DESC LIMIT 1;"
```

**Read section 4 of the briefing against the raw answer.** That section is the whole point, and it's the one part only Iván can judge: does it name the gaps he'd actually have asked about on WhatsApp?

---

---

## 3.8 Stage 11 — the exit path

*August 9, 2026, from three real cancellation emails.*

### Private: already handled, verified by hand

Subject is exactly `Subscription cancellation`, and the body reads *"...inform you that **Harvey Sierra's (harveysierra@gmail.com)** subscription to **Coaching personalizado - Un deporte (running, ciclismo, natación)** has been cancelled."*

`Parse Churn Email`'s existing regex was traced against that string character by character and **matches**: name, email and product all capture correctly, and the product's own parentheses don't break the email capture because that group is `[^)]+` and closes first. `Mark Churned in Twenty` sets `churnDate` + `CHURNED_CUSTOMER` and never touches `customerType`, which is exactly right for a coaching athlete. **No change needed.** The earlier "probably fine" is now "verified".

*One hardening worth doing: the regex requires a straight apostrophe in `X's`. If TrainingPeaks ever switches to a typographic `'`, the parse returns null. Failure is visible rather than silent — a null parse fails the person lookup and fires `Telegram Alert - Churn Unmatched` — but `['']s` costs nothing.*

### CoachMatch: two traps, both real

**Trap 1 — TrainingPeaks sends two emails, and one subject contains the other.**

| | Subject | Meaning |
|---|---|---|
| Request | `TrainingPeaks Coaching Service Cancellation **Request** - Athlete X` | notice; ends on a future date, keep coaching until then |
| Confirmed | `TrainingPeaks Coaching Service Cancellation - Athlete X` | actually cancelled |

A `contains "Coaching Service Cancellation"` filter matches **both** — the request email would churn an athlete who is still paying and still being coached, and revoke their access mid-service. **This is the identical collision already documented in §12** (`Subscription cancellation` vs `...cancellation scheduled`), which is why that filter uses exact match. The fix here: filter on `Cancellation - Athlete`, where the ` - Athlete` immediately after `Cancellation` excludes the Request variant. Per Iván's instruction only the confirmed email is acted on.

*The subject is used rather than the body headline because it can't line-wrap. In `textPlain` the body breaks mid-sentence — "has cancelled their Coach\nMatch Bronze level" — so any phrase-matching across that wrap would silently fail.*

**Trap 2 — the confirmed email has no email address in it.**

> *"This is a confirmation that Nelson Carrion **()** has cancelled their Coach Match Bronze level coaching service subscription."*

Empty parentheses. The *request* email includes the address; the *confirmed* one doesn't. **Every other branch in this workflow joins on email, and this one cannot.**

So it matches **by name**, and does it carefully:

1. Fetch only `customerType = OPT1_1_COACHING` from Twenty — a few dozen records, not the whole CRM.
2. Compare in code on a **normalized token set**: accents stripped, lowercased, punctuation removed, words sorted. `"Nelson Carrion"` matches a record stored as first `Nelson` / last `Carrion` regardless of how the name was split on the way in — which matters, because §3.1 established that the split is unreliable for Latin American names.
3. A single loose fallback for one name written more fully than the other (`Nelson Carrion` vs `Nelson Andrés Carrion`), still requiring a unique winner.
4. **Anything other than exactly one match writes nothing** and sends a Telegram listing the near-misses. Zero matches and two matches are both cases where a guess would churn the wrong athlete.

The name is also read from the subject as a second source, and a mismatch between subject and body is flagged — the same double-signal pattern used for form language.

### The goodbye email

Sent on **both** exit paths, in the athlete's language, defaulting to Spanish. Confirms the cancellation, states plainly that members access has ended, and leaves the door open.

**Deliberately absent: any exit survey, any "why are you leaving?", any discount or win-back offer.** `methodology.md` §2 documents the real practice — exit is soft-framed, cordial, and ends cleanly at the billing boundary with *no post-cancellation analysis*. Automating a retention pitch here would contradict how Iván actually coaches, and the win-back play already has its own home as a separate, deliberate campaign in `open-loops.md`. **The moment of cancellation is the wrong moment for it.**

`Build Goodbye Email` reads only `$json` and never references an upstream node by name, because it is fed by two branches and only one runs per execution — referencing a node that didn't run throws. Each branch ends with a small Set node producing the same three fields.

### Build

Paste `automation/stage11-cancellation-paste.json`. Credentials: Twenty API, Members Postgres, Hermes Bot, SMTP account.

**Wire four connections. The first is additive — do not delete the existing link:**

| # | Action | From | To |
|---|---|---|---|
| 1 | Create | `Email Trigger (IMAP)` | `Filter - Is CoachMatch Cancellation` |
| 2 | Create | `Revoke Token in Postgres` *(existing churn branch)* | `Churned Athlete (Subscription)` |

Step 2 adds a second outgoing connection; `Revoke Token in Postgres` keeps whatever it already feeds. Everything else in the paste is pre-wired.

### Testing

```json
[{"subject":"TrainingPeaks Coaching Service Cancellation - Athlete Test A Prueba R","date":"2026-08-09T12:00:00.000Z","textPlain":"Coach Match Cancellation Confirmation Iván Koch - Triaperformance, This is a confirmation that Test A Prueba R () has cancelled their Coach Match Bronze level coaching service subscription. Please contact us at coachmatch@trainingpeaks.com with any questions."}]
```

Create that athlete first by re-running the CoachMatch signup payload from §3.2, then pin this. Expect: matched by name, `CHURNED_CUSTOMER` + `churnDate` in Twenty, token deactivated, goodbye email, 👋 Telegram.

**Then run the Request variant and confirm nothing happens** — this is the more important test, because a false positive here churns a paying athlete:

```json
[{"subject":"TrainingPeaks Coaching Service Cancellation Request - Athlete Test A Prueba R","date":"2026-08-09T12:00:00.000Z","textPlain":"Coach Match Cancellation Request Confirmation Iván Koch - Triaperformance, This is a confirmation that Test A Prueba R (test-cm@example.com) has requested to cancel their Coach Match Bronze level coaching service subscription, effective August 20, 2026."}]
```

Expected result: **the filter rejects it and no branch runs at all.**

---
