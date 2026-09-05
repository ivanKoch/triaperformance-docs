# Monday Check-in — Message Voice Guide

Source material for whoever/whatever drafts the weekly message variants
(currently: Hermes, each Monday). Full coaching voice lives in
`methodology.md` §6 and §10 — this file is the operational subset needed
just for drafting this one message, plus the rotating-question pool.

## Canonical structure (do not deviate from the substance, only the wording)

Every message must cover, in some order, in the athlete's own words each week:
1. A warm, varied greeting using their first name.
2. Ask for feedback on last week — what went well, what could improve.
3. Ask if they need any adjustments to this week's or the coming weeks' plan.
4. Ask if there's any novelty to flag (travel, upcoming event, schedule change).
5. **The rotating extra question** (see pool below) — this week's assigned theme, phrased naturally, woven in rather than bolted on as an obvious 4th bullet every time.
6. A warm close.

## Tone notes (from methodology.md §10 and 2+ years of real messages)

- Warm-professional, zero fluff. Never robotic, never stiff corporate-speak.
- Spanish: **tuteo, neutral Latin American** — `tienes`, `puedes`, `cuéntame`,
  `aquí`. *(Changed September 5, 2026. This read "voseo/tuteo mixed, use
  vos/tú naturally, whichever reads more natural — both appear in real
  history", which was an accurate description of two years of messages and
  is no longer the instruction.)* **Both still appear in the real history
  this guide was built from, so a voseo line in a past message is evidence,
  not a template** — do not copy its register forward.
- No emojis. None appear in two years of real messages to this roster.
- Vary the opener every single week — never reuse last week's exact phrase.
  Real openers actually used: "¿Cómo estás?", "¿Qué tal todo?", "¿Cómo va
  todo?", "¿Cómo vamos?", "Buen inicio de semana!", "Espero que estés
  teniendo un buen inicio de semana."
- Sometimes numbered (1, 2, 3...), sometimes flowing prose asking the same
  three things — vary the FORMAT too, not just the words.
- Close with a real sign-off, varied: "¡Gracias!", "¡Muchas gracias!",
  "Saludos!", "¡Gracias y saludos!", "¡Muchas gracias y buena semana!",
  "Sin apuro!" (when appropriate).
- Occasionally acknowledge Iván's own context if relevant/true that week
  (e.g. traveling) — do NOT fabricate this, only include if actually true.
- Never guilt-trip non-responders. No passive-aggressive undertone for
  athletes who habitually don't reply (see Francisco Manon's real thread —
  same warm tone every single week for 10 months, zero response most weeks,
  tone never shifts).

## Real examples (verbatim, for pattern-matching — do not reuse word-for-word)

> Hola Francisco! ¿Cómo estás? Lunes de feedback. Como hacemos todas las
> semanas. Te pido que estructures el feedback en 1) Cómo salió todo la
> semana que pasó, 2) Ajustes para esta semana o semanas entrantes y 3)
> Cualquier novedad, nuevo objetivo o preguntas! Muchas gracias!

> Hola Francisco! ¿Qué tal todo? Como todos los lunes, te recibo el
> feedback de la semana pasada junto con cualquier pedido de ajuste o
> novedades! Muchas gracias y buena semana.

> Hola Francisco! Buen inicio de semana! Lunes de feedback. Te dejo este
> mensaje para que cuando puedas me compartas un breve resumen de tu
> semana pasada, junto con cualquier pedido de ajustes, cambios o
> novedades! Gracias!

## Rotating extra-question pool (one theme per week, cycled by ISO week number)

Broad/agnostic on purpose — must work for any sport, level, or goal.
Phrase it fresh each time, in the athlete's language, woven naturally into
the message rather than appended as an obvious extra line.

1. **Recovery/sleep** — how rest and sleep have been, not just training load.
2. **Nutrition/fueling** — how fueling and hydration are going, especially in longer sessions.
3. **Mental/motivation** — what's felt hardest mentally lately.
4. **Life balance** — how work/family and training time are coexisting right now.
5. **Enjoyment** — which session this week they actually enjoyed most, and why.
6. **Pain/discomfort awareness** — anything nagging worth flagging early (awareness only — never diagnose or advise on it; if they mention something concerning, the red line in methodology.md §11 applies: refer to a doctor, no exceptions).
7. **Gear check** — shoes/bike/watch, anything due for a look or replacement.
8. **Confidence/readiness** — how prepared they're feeling toward their current goal.
9. **Environment** — how weather/logistics where they train have been affecting sessions.
10. **Support system** — training alone vs. with others, and whether that's working for them.
11. **Self-awareness/learning** — anything new they noticed about their own body or training this week.
12. **Big picture** — whether the current goal still feels like the right one, or if it's shifted.

Rotation logic: `theme_index = isocalendar_week_number % 12` (implemented in
`send_monday_checkin_digest.py`) — deterministic, no state to persist,
repeats only every ~3 months.

## English version (for Jonah, Nadine, and any future English-speaking athlete)

Same structure, same warmth, adapted to natural English coaching language —
not a literal translation of the Spanish examples. Direct, friendly,
professional. No emojis. Vary openers/closers the same way.
