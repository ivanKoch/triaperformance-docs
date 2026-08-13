# Test payloads — zone magnet + subscription lifecycle

*August 13, 2026.* Two workflows changed today. These are the exact inputs to prove each one, plus what to look for.

**Both use `coach+…@triaperformance.com` addresses.** Gmail delivers plus-addressed mail to the same inbox, so you receive everything, and a distinct address per test keeps the duplicate branch honest — reusing one address means the second test silently exercises a different path than you think.

---

## 1. Zone-magnet workflow (`zone-workouts`)

Tests the two fixes: the checkout link now follows `body.language`, and the Portuguese email quotes 29,99.

**Arm "Listen for test event" on the webhook node first**, then run these from the VPS. `webhook-test`, not `webhook` — and straight to n8n, not through triaperformance.com, because the production path only exists while the workflow is Active.

### English

```bash
curl -i -X POST http://100.70.89.17:5678/webhook-test/zone-workouts \
  -H 'Content-Type: application/json' \
  -d '{"email":"coach+zone-en@triaperformance.com","sport":"cycling","protocol":"cycling.30min","language":"en","source":"zone_calculator","page_url":"https://triaperformance.com/en/training-zones-calculator/cycling/","submitted_at":"2026-08-13T16:00:00.000Z"}'
```

**Expect in the email:** English copy · guide link ending **`training-zone-sessions.pdf`** · checkout link ending **`7127a1e4-…`** · **US$ 39.99**.

### Portuguese — this is the one that was doubly wrong

```bash
curl -i -X POST http://100.70.89.17:5678/webhook-test/zone-workouts \
  -H 'Content-Type: application/json' \
  -d '{"email":"coach+zone-pt@triaperformance.com","sport":"swimming","protocol":null,"language":"pt","source":"zone_calculator","page_url":"https://triaperformance.com/pt/calculadora-de-zonas/natacao/","submitted_at":"2026-08-13T16:05:00.000Z"}'
```

**Expect:** Portuguese copy · guide link ending **`sessoes-por-zona.pdf`** · checkout link ending **`938a0833-…`** · **US$ 29,99**, not 39,99.

**Click both guide links from inside the email.** Nothing in the workflow checks the file exists; if the site hasn't deployed, you get a flawless email with a dead link and no error anywhere.

### Duplicate branch

Re-send either command unchanged. Expect: the guide email **again**, one Telegram duplicate notice, **no** second Person, and a new dated line appended to that Person's `leadNotes` with `leadSource` and `leadStatus` untouched.

---

## 2. Subscription lifecycle — the product rename

Tests that the renamed ES and EN products still classify. **Before the fix these both produced `UNKNOWN`**, which means no welcome email, no members token, no `ALL_ACCESS` customerType — and no error, because the payment itself succeeds.

This one is not a webhook, it starts from an IMAP trigger. Two ways in; the first is better because it also exercises the regex in `Parse New Subscription Email`, which reads the product name before the classifier ever sees it.

### Option A — pin data on the trigger (recommended)

On **Email Trigger (IMAP)**, use *Edit Output* / pin an item with a `textPlain` field set to the block below, then run from that node.

**Spanish:**

```
Hi Ivan,

You have a new subscription.

Customer Name: Maria Gonzalez Perez (coach+subtest-es@triaperformance.com)
Subscription: Triaperformance All-Access — Todos los planes y guías + TrainingPeaks Premium - $39.99 per month
Invoice Number: TP-TEST-ES-001
Amount Charged: $39.99

Thanks,
TrainingPeaks
```

**English:**

```
Hi Ivan,

You have a new subscription.

Customer Name: John Smith (coach+subtest-en@triaperformance.com)
Subscription: Triaperformance All-Access — All training plans and guides + TrainingPeaks Premium - $39.99 per month
Invoice Number: TP-TEST-EN-001
Amount Charged: $39.99

Thanks,
TrainingPeaks
```

*The ` - $39.99 per month` tail matters — the parser captures the product name by cutting at the first ` - $`. Simulated against both new titles and it cuts in the right place; the em dash inside the title is not a hyphen, so it doesn't trigger an early cut.*

### Option B — inject after the parser

Pin this directly on **Parse New Subscription Email**'s output if you only want to test the two Code nodes:

```json
[{ "firstname": "Maria Gonzalez", "lastname": "Perez",
   "email": "coach+subtest-es@triaperformance.com",
   "subscription_name": "Triaperformance All-Access — Todos los planes y guías + TrainingPeaks Premium",
   "invoice_number": "TP-TEST-ES-001", "amount_charged": "39.99" }]
```

Swap `subscription_name` for the English title to test that side.

### What to check on the canvas

| Node | Expected |
|---|---|
| Parse New Subscription Email | `subscription_name` is the **full** title, not truncated at the em dash |
| Map Language + Build Twenty Fields | `preferredLanguage` = `SPANISH` / `ENGLISH`, `language_unrecognized` = `false` |
| Classify Product | `productType` = **`ALL_ACCESS`** (not `UNKNOWN`) |
| Route by Product | routes to **All-Access**, not the `Unknown` fallback |

Then let it run through and confirm the welcome email arrives in the right language and a token row appears in Postgres.

**Clean up afterwards:** delete the two test Persons in Twenty and their token rows (`automation/members-area/OPERATIONS.md` has the queries), or they will show up in the members-access roster as subscribers who never log in.

### Regression case worth keeping

Send one with a deliberately unknown product to confirm `UNKNOWN` still alerts rather than defaulting — that was the August 2026 bug this branch was built to prevent:

```
Subscription: Triaperformance Some Product That Does Not Exist - $10.00 per month
```

Expect: `productType = UNKNOWN`, routed to the fallback, Telegram alert fired, no Person created.
