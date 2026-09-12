# Coaching process review — findings and rules (September 12, 2026)

Source: a full read of every WhatsApp transcript, 97 athletes (66 churned, 31 active), first message to last, by fourteen independent readers against eight dimensions. The version with names, dates and quotes is `~/Downloads/chats/coaching-process-review-2026-09-12.md`, outside the repo. This file carries what the repo needs: the pattern, the counts, and the rules that change how the service runs. Counts are "athletes where a reader saw a clear strength / clear weakness" (n = 97; both columns possible).

| Dimension | Clear strength | Clear weakness |
|---|---|---|
| Onboarding and sale | 71 | 35 |
| Weekly loop | 48 | 45 |
| Responsiveness and promises | 31 | 65 |
| Injury, illness, life | 51 | 42 |
| Race weeks | 36 | 49 |
| Tone and relationship | 52 | 45 |
| Pauses, cancellations, payments | 25 | 56 |

## What the transcripts show

**The first two weeks are the strongest part of the service.** Same-day payment to form to plan to test in most files; price and scope stated plainly; honest about what remote coaching cannot do; lead nurture with self-set reminders that are kept. The data-backed explanation of the why (Pa:Hr, decoupling, form, FTP/kg, GAP, altitude-adjusted projections) is the product, and athletes learn it and quote it back. Race execution, when delivered, is elite; running injuries and illness are routed to professionals; the Monday message has gone out every week for two years.

**The loop decays after about month six into a template that proves presence, not attention.** Eleven athletes received between six and twenty-five consecutive Monday templates with no reply, and not one run triggered a call, a shorter plan, a pause offer or a personal message; in several the only non-template line was a review or referral ask. The engaged athlete gets analysis and season plans; the silent one gets the same message again, and pays for months.

**Small promises die, and they are almost always analysis that needs an hour at a computer.** Roughly 180 promised-and-not-delivered or asked-and-not-answered items across 97 files; keep rate on "mañana / el lunes / lo investigo / te preparo" items estimated at one in four. Race strategy is the worst case: delivered when chased, or not at all, in at least nine race weeks.

**The post-race window is where the best athletes leave, and it currently contains a photo request.** Nine goal-completed exits with no next-goal conversation; debriefs collapse exactly when the result was mediocre; at least three post-race chats contain a medal-photo request and no performance analysis.

**Tone under load.** The data is right and the delivery is prosecutorial or curt in roughly one file in two: exit ultimatums, blame assigned to the athlete for the coach's progression, one-word replies to a crisis or a bereavement, "chatgpt.com" as an answer, and the load leaking to clients ("mis 50 atletas", "el día que hablo con todos mis atletas"). One five-star athlete cancelled the day he was told "no estoy todo el día atrás del WhatsApp", six weeks before the A-race built over 32 weeks.

**Exits are administered, not handled.** The standard close is "puertas abiertas" plus "cancelá antes de que te vuelva a cobrar"; an exit question is asked in perhaps one case in ten; a TrainingPeaks pause was offered 6 times in 66 and inconsistently; review requests sit inside six goodbyes, three of them health-related; price is the first reply to a pause in four cases. One 13-month referral client was ended by the coach the day after re-committing; one cancelled athlete was blocked.

**Medical and mental red flags outside running injuries are missed, and pain is normalised by analogy.** An Afib alert, a Holter, an anaemia diagnosis, out-of-range blood work, a stated depression, a crash with shoulder pain, all without "see a doctor"; "a mí me pasa lo mismo" precedes a tear a year later; two athletes were told to push through pain and raced into a tear or crutches; one was onboarded while in physio and quit in 48 hours.

**Bookkeeping lives in the coach's head and athletes audit it.** Zones never tested for months in at least six files, or wrong by 20–100% for weeks; altitude edits with no log ("nunca las volví a su lugar"); hidden or missing weeks found by the athlete in seven files; constraints re-stated three times; a goal race absent from TP for six months; the athlete's name wrong in eight files, twice inside the automated template; credentials pasted in chat in five.

**Marketing rides on the athlete's moments.** Medal photos in nearly every post-race exchange, reviews at 90 days and at exits, referral asks stapled to debriefs, the coach's own bike, trainer and race slots sold through athletes, product pitches inside goodbyes. Three of the service-related exits sit next to one of these.

**Channel mismatch.** Audio and phone people are asked to write; five phone-first athletes never got the call they asked for; audios get "enterrados". ChatGPT was given as the answer to a paying athlete in eight files; the one who had said he was leaving ChatGPT for a coach churned in 30 days.

**Price is improvised at the moment of sale and return** in at least six files (negotiated prepay, "I changed pricing" at checkout, broken codes, returning athletes met with the new price and no positioning). The pricing doc is not the source of truth in the chat.

## Criticism of the process

The process has one gear: everything runs through Monday and through Iván. Feedback is read on Monday, changes are made on Monday, race plans are a Monday leftover, weekday requests queue, and when Monday slips the athlete finds out. There is no second gear for silence, no third gear for race week, no gear for exit. Nothing is written down per athlete except the plan — zones history, constraints, promises, goal races, return dates, medical flags all live in memory or a WhatsApp scroll, and each failed at least five times in the record. The Monday template does two jobs and fails one: it guarantees presence and it hides absence.

## The rules

1. **Silence.** Three unanswered Mondays → a personal, non-template message. Five → a call offer, a shorter plan, a TrainingPeaks pause or All-Access. The athlete chooses; drifting is not an option. Query: `athlete_engagement.csv` until the check-in script carries it.
2. **Promise log.** Anything said with "mañana / el lunes / lo investigo / te preparo" goes on a dated list, and the Monday message reports on it before asking for feedback.
3. **Race protocol.** T-7 plan in TP and in the chat; T-1 message; T+2 debrief with numbers; T+7 next-goal proposal. The photo ask is at T+7, after the debrief.
4. **Exit script.** One question ("¿qué cambió?"); the TP pause offered first; the return date taken and written; a calendar entry to write on it. No review in a goodbye. No price in the first reply to a pause. Words: `sales-playbook.md`.
5. **Red flags.** Any non-musculoskeletal medical word → "see a doctor" and ask when; pain reported twice → physio and a load cut; distress reported twice → name a professional. Never "a mí me pasa lo mismo".
6. **Onboarding gate.** Zones tested or marked provisional within 14 days; the goal race in TP on day one; fixed constraints (days, ceilings, equipment, preferred channel) on a card read before writing. Home: `athlete-onboarding-flow.md`.
7. **Channel.** Audio transcribed on the coach's side (Hermes); calls get a slot, not "mañana"; preferred channel is a field.
8. **Separation.** Marketing asks (photos, reviews, referrals, products, the coach's gear or race logistics) never in a race-week, injury or exit message, and never as the only non-template line in a silent month. ChatGPT is not an answer given to a paying athlete.

Three exchanges in the record already prove the rules: an athlete asked for feedback and offered a tier at exit came back six months later; a pause via TrainingPeaks support re-billed a month later with no chase; an athlete whose block end was pre-framed left a review. The rules make those three the default.

## When it was worst

Iván's own dating: January to June 2026, the operating role, with fifty-plus active athletes in February and March. The transcripts agree without being told: the long template runs (six athletes' silent stretches start between January and April 2026), the wrong-name templates, the two harshest exit exchanges (March 10 and July 6), the batch-mode decay of the two longest-tenured relationships, and "poniéndome al día con mis 50 atletas" all sit inside that window. The record before it (2024 to mid-2025) is the same coach with a second gear. That is the case for building the gear rather than resolving to be better.

## Athlete stories — nominations

The rule for choosing: a measurable arc with the athlete's own words in the record, consent, and preferably still active or left on good terms (the ask itself is a warm touch). Nominated, in order:

1. Ronald G. — the first athlete; sub-3 marathon (2:53:59, September 2026), sub-5 70.3, the 70.3 Worlds, Ironman next. Two years of Looms and race plans to draw on.
2. Antonio — eighteen months, a failed first attempt, then the Ironman. The story is the second attempt.
3. Luis Casillas — two sub-3 majors run to a plan written to the second; transitioning to duathlon and a first 70.3 in 2027.
4. Jonah — a first-timer to an Ironman finish in twelve months, "outpacing the improvement curve"; left warmly, a natural ask.
5. Eduardo H. — marathon 4h29 to the low 3h30s over two years; the arc ends in an injury, which makes it honest rather than a weaker story. Needs his consent more than most.
6. Mauricio — half marathon 1:59 to 1:39 in six months, then a 70.3; said he would be back.
7. The Feher family — three members training for Chicago on one plan, one referral chain. A different kind of story: the household.
Also strong but shorter: Alfonso (1:29:50 in 89 days), Ronald H. (70.3 Worlds, FTP +9%), Cesar (70.3 PR by eight minutes, sub-6), Humberto (sub-2 to 1:46, 479 days and counting), Jose R. (down to 101 kg, riding with his partner), Astrid (first sprint, first in category). Names and evidence: the named review file outside the repo; the public version uses whatever the athlete approves.

## The tool

What the transcripts say is missing is not intelligence, it is memory with a clock. The design, on the stack that exists (Postgres, n8n, Hermes, Telegram, the Monday check-in scripts):

1. **The athlete card** — one row per athlete in Postgres: goal race and date, fixed constraints (days, ceilings, equipment), zones history with altitude flags, preferred channel, medical flags, open promises with due dates, pause return date, last athlete message date. Written by Iván through Telegram one-liners the bot parses (`promise <athlete> <what> <when>`, `flag <athlete> <what>`, `race <athlete> <name> <date>`, `pausa <athlete> <return date>`) and by forwarded WhatsApp audio, transcribed and filed. Reading a card before writing to an athlete is rule 6.
2. **The Monday brief** — Hermes reads the card and the roster before Monday and produces, per athlete, what is due (promises), what changed (silence streak from the check-in log, a race inside fourteen days, a flag raised last week, a return date reached) and one suggested personal opening line. The template becomes the fallback, not the default. This is rule 1, 2 and 3 running without recall.
3. **Triggers from the same table** — T-7 race-plan prompt with the athlete's zones and the `methodology.md` race-execution structure prefilled; T+2 debrief prompt; T+7 next-goal prompt; three unanswered Mondays → a personal-message prompt; five → the pause/All-Access prompt; a pause return date → the win-back message that day. The exit script (rule 4) writes the return date; the trigger reads it.
4. **Audio in, text out** — a forwarded voice note becomes a transcript and a card entry. Rule 7; the athletes who send audio are the ones who will not type.

Build order: card and Telegram commands first (one session), the Monday brief second (it is a query and a prompt), triggers third. The WhatsApp Business API item in LATER is the eventual intake; the Telegram bot is the intake that exists today.
