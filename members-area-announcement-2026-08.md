# Members-area announcement — the un-told cohort (August 2026)

**Status:** draft, not sent **· verified: 2026-08-14**. Owner: Iván.
**Why this exists:** `open-loops.md` NOW → "33 athletes have a members-area password nobody ever told them about." Of ~35 real athletes with active tokens, two have ever opened the members area. The July 25, 2026 backfill granted access to 35 1:1 coaching athletes and deliberately sent zero emails (`ai-infrastructure-documentation.md` §13). This is the email that closes that gap.

---

## Rotate every token as part of this send

*(Added Aug 10, 2026.)* The full `subscriber_tokens` table — all 36 live tokens — was pasted into a chat transcript twice during the i18n branch. Risk is low (what's protected is training content, and the plain-text storage tradeoff is already an accepted, documented decision — `ai-infrastructure-documentation.md` §13), and rotating 35 athletes' access as a standalone action would be worse than the exposure: 33 of them have never been told they have access at all, so "here is your new password" would be the first they'd hear of any password.

**This email is the free rotation window.** Every recipient is being handed a password anyway. Generate a fresh token per athlete inside the mail-merge and write it in the same pass, so the exposure closes at zero additional cost and nobody experiences a change they weren't expecting.

Per athlete, in this order — new token first, email second, so a failed send never leaves someone holding a password that no longer works:

```bash
NEW=$(python3 -c "import secrets; print(''.join(secrets.choice('ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789') for _ in range(20)))")
docker exec -i analytics-postgres psql -U analytics -d members -c \
  "UPDATE subscriber_tokens SET token = '$NEW' WHERE email = '<athlete>' AND active = TRUE;"
```

Two athletes are currently *using* their access — `jonah.warner` (16 visits) and `andreaghisays` (3). Their cookies hold the old token and they will be logged out at next page load. They are on the send list, so the new password arrives at the same moment; no separate warning needed, but do not rotate them days ahead of the send.

**Do not rotate the three `QA-FIXTURE` rows** — they're yours, documented in `automation/members-area/OPERATIONS.md`, and not part of this audience.

---

## Before sending — three checks, in order

1. **Pull the real audience.**
   ```bash
   docker exec -i analytics-postgres psql -U analytics -d members -c \
     "SELECT email, token, preferred_language FROM subscriber_tokens WHERE active = TRUE AND access_count = 0 AND preferred_language = 'SPANISH' ORDER BY email;"
   ```
   Each athlete's own token goes in their own email. **This is a mail-merge, not a BCC blast** — the password is per-person, and one careless "to all" leaks 33 credentials to 33 people.

2. **Reconcile against Twenty first.** An active token is not proof of an active coaching relationship. Check `customerType` and `churnDate` for every address on the list and drop anyone churned. Emailing a former athlete about "your members area" is worse than not emailing at all.

3. **Spanish only this round.** One never-logged-in athlete is English (`tischhausern`). `/members/en/` exists as of Aug 10, 2026 but its library is empty — sending her there today delivers on the promise with an empty room. She gets a personal note once the zone calculator ships, not this blast. Portuguese: none in this cohort.

---

## The email

Voice per `automation/coaching-checkin/monday-message-voice-guide.md` and `methodology.md` §10 — warm-professional, zero fluff, no emojis, varied and natural. Deliberately **not** a marketing email: these people already pay, there is nothing to sell them, and the only job is to hand over something they already own.

**Subject:** `Algo que ya tienes y todavía no usaste`

*(Alternatives, if that reads too clever: `Tu acceso al Área de Miembros` · `Te debía este acceso`)*

**Body:**

```
Hola {{ first_name }}!

Te escribo por algo que tendría que haberte mandado hace rato.

Desde julio tienes acceso a un área de miembros del sitio, con las
herramientas y guías que uso en el coaching: los protocolos de testing,
la guía de zonas y umbral, cómo leer la carga de entrenamiento (TSS,
CTL, ATL, el gráfico PMC), los playbooks de ejecución de carrera por
distancia, la calculadora de nutrición y carga de carbohidratos, y un
par de rutinas de fuerza y activación para las semanas complicadas.

Nunca te avisé que estaba ahí. Culpa mía.

Entra aquí: https://triaperformance.com/members/
Contraseña: {{ token }}

Es tuya, no la compartas. Queda guardada en el navegador, así que la
vas a tener que poner una sola vez.

Si algo de lo que hay ahí no te queda claro, o si hay una herramienta
que te serviría y no está, decímelo — estoy sumando cosas nuevas y me
sirve saber qué falta.

Gracias!

Iván
```

### Why it's written this way

- **It opens by admitting the gap.** "Tendría que haberte mandado hace rato" and "culpa mía" — because the honest version is the true one, and it pre-empts the obvious question of why they're only hearing about this now. Anything that dressed it up as a launch would be a lie they can date-check against their own start date.
- **It names the actual contents, specifically.** "Un área de miembros con recursos" gets deleted. Naming TSS/CTL/ATL and the PMC chart is the line that makes a coached athlete recognise it as something they'd want.
- **No CTA language, no urgency, no deadline.** They already pay. There is nothing to convert.
- **The last paragraph is the useful part.** "Dime qué falta" turns a one-way announcement into a read on the tools backlog — which is currently prioritised on Iván's judgement alone. 33 replies would be the best input available for deciding what gets built after the zone calculator.
- **No mention of "new tools every week."** That promise lives in the All-Access welcome email and is already a standing commitment; repeating it to coaching athletes adds a second audience to it for no gain.

---

## After sending

Wait ~10 days, then re-run the audience query. `access_count > 0` for anyone on the list is the measurement — and it is the only clean read this business will ever get on whether the members area is worth building tools for, because it is a single announcement to a known, warm, non-cold list with no other variable moving.

If it stays near zero, that is a finding about the members area, not about the email.
