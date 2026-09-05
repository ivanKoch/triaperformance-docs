# Grok Bot trial — scoped research briefs

*Written September 5, 2026. Disposable: this is the input to a 3-day experiment, not a repo doc. Delete after the trial closes.*

## Ground rules for every brief below

1. **No repo access, no connectors, no file uploads.** Paste text in, copy text out. Grok Bot shares one cloud computer across bots with no security boundary between them.
2. **Nothing proprietary goes in.** No athlete data, no GSC position data, no revenue, no plan IDs, no P&L. Every prompt below is written so it needs none of that — a competitor reading the prompt learns nothing about the business.
3. **Everything comes back with a source URL per claim.** Anything without one is treated as unverified and does not enter the repo.
4. **Nothing lands in `data/` or a `.md` until verified.** Output goes to `Claude outputs/`, gets checked here, then moves.

---

## Brief 1 — Race content dossiers

**The frame changed on September 5, 2026, and it changes what this research is for.**

*Original assumption: research races to find out which ones have enough plan inventory behind them to be worth a page. That assumption is dead.* **The plan ladder is complete in all three languages at both distances** (`race-landing-pages-longlist.md` §1), **so inventory is not a gate and field size is not the ranking column.** *Iván's call:* **"the SEO should come from the content and not from the plans we are selling there."**

**What that means concretely:**
- The page ranks on what it says about the *race*. The plans are what it sells once someone is reading. Those are two different jobs and only the first one is research.
- **The gate is content richness**, not participation. A 4,000-finisher race with a brutal signature climb and a documented cut-off problem is a better page than a 40,000-finisher race with nothing distinctive to say.
- **The plan join is now fixed and trivial** — 42 km is 3 difficulties × 12/18 weeks; 21 km is Beginner 16w / Intermediate 16w / Advanced 12w. **Nothing in this research should reference, match, or recommend a plan.** That is Iván's side of the page.
- Output is a **dossier per race, not a CSV row**, because it feeds writing rather than sorting.

**Sequence: 42 km first (a shortlist drawn from Grok's 166-row discovery file), then 21 km.**

### 1A — The 42 km dossier prompt

**Batch 6–8 races per run.** Shortlist by content richness and travel market from the discovery file, not by field size.

> You are gathering raw research material for training-focused landing pages about specific marathons. A coach writes the pages; you are supplying the facts he writes from. **Do not write marketing copy, headlines, or the page itself. Do not recommend training plans, products or services.**
>
> **RACES FOR THIS RUN: `<6–8 race names>`.**
>
> For each race, return a dossier under these exact headings. Where you have nothing real for a heading, write `NOTHING FOUND` — that is a useful answer and I will use it. **Never fill a heading with generic marathon advice that would be true of any race.** The entire value here is what is specific to this one.
>
> **1. Course, kilometre by kilometre.** The actual shape of the route. Where the climbs and descents are, at which kilometre, how long and how steep. Surface changes, cobbles, tunnels, bridges, sharp turns, out-and-back sections, laps. **Name the kilometre for anything that matters.** If an official course map, elevation profile or certification document exists, use it and link it.
>
> **2. Where runners actually struggle.** The specific point on this course where people slow, blow up or drop out, and why — a late climb, a long exposed straight, a crowded early narrow section, a false flat that reads downhill. Source this from race reports, forums, coaching write-ups and split analyses rather than from the organiser's own description, which will never say a course is hard.
>
> **3. Conditions, with numbers.** Historical race-day temperature range, humidity, wind direction and typical strength, rain probability, and the start time. Sun exposure along the route if the course runs east-west or has long unshaded sections. **Give figures and their years, not adjectives.** If the race is at altitude, state the metres above sea level and where on the course it varies.
>
> **4. Cut-offs and time limits.** The overall limit, every intermediate cut-off with its kilometre and clock time, how the cut-off is enforced (sweeper vehicle, mat, course reopening to traffic), and whether the limit is measured from gun or chip. **This is a real anxiety for slower runners and it is badly documented almost everywhere — be thorough.**
>
> **5. What actually happens to the field.** Any published finish-time distribution, median and mean finish time, percentage under 3:00 / 3:30 / 4:00 / 5:00, DNF rate, and whether the field typically positive- or negative-splits. **Cite the year and the source.** This is the most valuable section and the one most likely to be unavailable; say so plainly rather than estimating.
>
> **6. Start logistics that affect race-day execution.** Wave or corral structure and how you are assigned one, how early you must arrive, bag drop, distance from the start village to the line, toilet situation, and anything about the first 3 km that shapes pacing — narrow starts, timing-mat congestion, downhill openings that invite going out too fast.
>
> **7. Registration reality.** When entry opens, how it is allocated, price bands, how fast it sells out, whether there is a lottery and its rough success rate, and any qualifying standard. **Include the date entry opens for the next edition**, because that is when people start searching.
>
> **8. Real questions people ask about this race.** 10–15 actual questions runners ask, drawn from forums, Reddit, Facebook groups, Strava club posts, race-report comments and Q&A pages — **in the languages of the markets that travel to it.** Quote the question as asked rather than tidying it into a formal heading, and note where you found it. **Do not invent plausible-sounding questions.** These become the page's FAQ and its long-tail search coverage, so their authenticity is the whole point.
>
> **9. What is written about this race already.** The three or four best existing pages about training for it, with URLs and one line on what each does well and what it leaves out. I want to know what a good page here has to beat.
>
> **Rules that apply throughout:**
> - **Every factual claim carries a source URL.** Where you are inferring rather than sourcing, write "inference:" in front of the sentence.
> - **Where sources disagree, give the range and name both sources.** Do not average them into one confident figure.
> - Prefer official course documents, results databases and race reports over listicles and travel blogs.
> - Distances in kilometres, temperatures in Celsius, elevation in metres.
> - **Nothing about training plans, coaching services or products.**

### 1B — The 21 km pass

**Half-marathons have had no discovery run at all**, so this is discovery and dossier in one — but discovery is now cheap, because field size is no longer the gate.

Run the same dossier prompt above, with one change to the opening: instead of a named race list, give it a region and ask it to **first propose 10–12 half marathons in that region worth a page — selected for distinctive course, conditions, cut-off or qualifying content, and for an evidenced ES/PT/EN travelling contingent — with one line each on why**, then stop and wait for approval before writing dossiers for the ones chosen.

**Do not simply mirror the marathon list.** A city's half and its marathon are often different races on different courses in different months with different fields, and some of the best halves belong to cities with no marathon at all.

---

### Run 1 record (Gemini, September 5, 2026) — why the prompt above looks like this

83 marathon rows plus a ~2,000-word essay, then the account hit its limit. **54 of 72 numeric field sizes were round thousands with no source. 51 of ~80 citations came from two aggregators**, one usually cited as a bare homepage. **Five citations pointed at a different race entirely** — Toronto and Xiamen both cited a Nagoya article, Dubai cited a Paris page, Mexico City cited Getty Images, Miami cited a Google support page. **Only 15 of 83 rows were in ES/PT-speaking countries**, missing Bogotá, Lima, Guadalajara, Quito, La Paz, Montevideo, Panama City, Porto Alegre, Florianópolis, Brasília and Curitiba. `travel_markets` was pattern-matched — big European race, `EN,ES,PT`, no evidence. Cape Town's row said October when the race runs in May and the 2026 edition had already happened, while the essay discussed that May result: the two halves were not produced from the same research.

**Worth keeping from run 1:** the refusal to extrapolate marathon finishers from aggregated festival totals was correct discipline and is now an explicit rule above. The Honolulu `travel_markets` call — excluded ES/PT on the evidence that ~28% of entrants are Japanese — is now the calibration example. And the sub-3 density figures it volunteered unasked (Valencia 15–20%, Indianapolis 823 of 6,678) are a genuine content thesis worth its own job later.

---

### Run 2 (Grok, September 5, 2026) — usable. Keep this file.

166 marathon rows on the **original** global prompt, not the hardened one.

| | Gemini run 1 | Grok run 2 |
|---|---|---|
| rows | 83 | 166 |
| round-1000 among numeric field sizes | 54/72 (75%) | **1/97 (1%)** |
| `UNKNOWN` (honest abstention) | 11 (13%) | 69 (42%) |
| distinct source domains | 8 | **54** |
| ES/PT-country rows | 15 | 27 |
| LatAm rows carrying a real number | ~2 | **10** |

**It obeyed the rule Gemini broke 54 times**, and the abstention rate went *up*, which is the correct direction. Each UNKNOWN cluster is explained specifically and correctly: Chinese lotteries publish caps and applicant counts rather than finisher totals, Japanese mass races have stale transparent figures, destination races mix distances in the published total. **Miami came back at 2,945 marathon-only against a ~18,500 weekend** — the festival-total trap, avoided without being told, since that rule was only added to the revised prompt. Rotterdam 17,843 and recoded `EN,ES`. Buenos Aires 12,563, Mexico City 22,646, Rio 13,070, Santiago 6,285, Medellín 5,787, São Paulo 5,380, Porto Alegre 5,727, Floripa 5,142 — the Latin American block is rankable for the first time.

**The London sub-2 in its status notes is real and verified** — Sabastian Sawe, 1:59:30, London, April 2026.

**Three fixes before this file is used:**
1. **`nb-porto-alegre-42k` must carry 1776, not `UNKNOWN`.** Grok sourced the figure and then blanked the column so the row "would not sort with the mass races." That conflates *unsourced* with *small*, and makes the row indistinguishable from a Chinese lottery on a sort. The floor is applied by filtering, not by corrupting the column.
2. **46 of 166 rows cite only bulk listicles** reused across eight or more rows (`runningwithrock.com/2025-largest-marathons-us` ×22, `rundida.com/best-marathon-in-china` ×14, `.../japan` ×11). Rule 2 of the hardened prompt is exactly this; it was not in the prompt used.
3. **`travel_markets` evidence is present on 55 of 71 claims but missing on the biggest rows** — NYC and Chicago both claim `EN,ES,PT` with empty `confidence_flags`. Where it did the work it did it well: Boston reads *"ES-PT are Six-Star and BQ tourists not a mass Latin field"*, Rome *"PT-travel-weaker-than-EN-ES"*. Those are real distinctions that change what a page should say. Fill them for NYC, Chicago, Miami and Orlando specifically.

**Also:** ~26 of the 69 UNKNOWNs are Chinese and Japanese races with no ES/PT travel relevance — the global prompt's fault, eliminated by the region batching above. And "Cape Town 2026 confirmed as Africa's first WMM" is imprecise: it becomes a Major in **2027** and was not one in 2026. Bogotá and Lima remain UNKNOWN and are the two Latin American capitals most worth a targeted follow-up.

---

### 🚨 STANDING RULE, September 5, 2026 (Iván) — official documents win, always

**"Let's always use the official page and rules information and never disagree with them."**

*This was written after I presented a derived contradiction in Medellín's cut-offs as a finding — "a 6:00 marathoner cannot legally reach km 28.5." ***That was an inference dressed as a fact, and probably wrong***: the dossier's own text says exceeding the gate means "leave, or continue on the sidewalk at your own risk," which is a withdrawal of support, not a bar on finishing. The gates may also be clock where the limit is chip, and the corral structure may shift the arithmetic.*

**The rule for every dossier and every page built from one:**
- The organiser's reglamento, FAQ and official course documents are the **source of record**. A secondary source, a runner report, or arithmetic derived from the rules **never overrides them in published copy**.
- Where our reading appears to conflict with the official text, that is a **question for the organiser**, not a claim. It goes in a "Check with organiser" line, phrased as a question, and never onto a page.
- **Rationale beyond accuracy:** a coach's page telling an athlete "you cannot legally finish" when the race publishes a 6:00 limit is both wrong-looking and harmful — the athlete may not enter. The asymmetry is not close.


### Run 3 (Grok, September 5, 2026) — the format works. Eight 42 km dossiers, kept.

**Raw output: `Claude outputs/race-dossiers-batch1-2026-09.md`.** Mexico City, Buenos Aires, Valencia, Miami, Santiago, Rio, SP City, Medellín.

~~**The single best thing in it: Medellín's cut-offs contradict its own stated limit.**~~ 🚨 **RETRACTED same day — see the standing rule above. This was a derived inference, not a finding, and it is being re-checked against the reglamento in batch 2 Part A.** The section below is kept as the record of how the mistake was made. *The race publishes a 6:00 finish limit. But the km 28.5 Sabaneta gate is* **09:00 on the clock** *against an* **05:00 start** *— four hours of race time, so ~7:00/km required to stay legal.* ***A 6:00 marathoner physically cannot reach km 28.5 within the rules of the race they entered.*** *Nobody has published this. It is directly actionable coaching content and it came out of §4 doing exactly what §4 was for.*

**Five stale-data traps caught, any one of which would have put a wrong fact on a live page:**
1. **Rio's 42 km reverted for 2026** to the pre-2019 coastal point-to-point after the Niemeyer landslide — *"do not mix 2019–2025 loop reports with 2026+."*
2. **SP City removed the Minhocão in 2026** — and Corrida360, the best existing guide, contradicts *itself* on this within one page.
3. **Valencia's cut-off moved 6:00 → 5:30 in 2025**, with a km-25 gate at 12:57 clock.
4. **Medellín's moved the other way, 5:30 (2025) → 6:00 (2026).**
5. **CDMX's 2026 start blocks are earlier than 2025**, so the 2025 last-block clock figures do not carry.

**It also resolved an ambiguity in my own shortlist.** "São Paulo" is two different races: **SP City Marathon** (Iguana, July, Pacaembu→Jockey, ~5,400) and **Maratona Internacional de São Paulo** (Yescom, April, Ibirapuera, ~4,845). It picked one, said why, and flagged that Marathon-Index's 280 m gain figure probably belongs to the other race.

**And it criticised sources rather than collecting them.** Santiago: *"Do not use Código Runner's 2026 table (km 21 '915 m'). That would be Andean foothills and contradicts every official-adjacent profile."* Rio: Strava profiles that climb the Joá "mountain" are wrong — the course goes **through** the tunnels. The "do not average" rule held everywhere: Valencia gain given as a 47–87 m range with each source named, Rio as 110/280/206/168 m.

---

**Two prompt fixes for batch 2 — fold into §1A above.**

**FIX 1 — §8 is looking in the wrong place for Spanish and Portuguese.** *It found real quoted questions for Valencia and Miami (Reddit, in English) and* **`NOTHING FOUND` for every Latin American race.** *But its diagnosis is the valuable part and is almost certainly right:* **"the conversation is YouTube / RunMX / WhatsApp."** *Where it did mine YouTube comments — Rio — it got the best material in the file ("Niemayer não é subidinha. Sobe bem!", and a runner correcting the Strava tunnel error).* **Replace the §8 instruction for ES/PT races with: YouTube comment sections on course-preview and race-recap videos, Instagram comments on the organiser's posts, race Facebook event pages and group threads, and the organiser's own FAQ headings. Reddit is an English-language artefact and should not be the first stop for a Latin American race.**

**FIX 2 — §5 asks for a table that is never published; ask for the computation instead.** *DNF rate, split studies and sub-3:30/4:00/5:00 breakdowns came back `NOTHING FOUND` on all eight.* **What it reliably got was median and sub-3% from MarathonView, which has full per-race result tables.** *So the sub-bucket distribution is* ***computable, not findable***. **Reword §5 to: "where a results database publishes the full finisher table, count the buckets yourself from it and state the year, the source and the finisher count you counted over."** *Keep DNF as a genuine `NOTHING FOUND` — races mostly do not publish starters.*

**A third thing that is not a prompt problem.** *Santiago, Medellín and partly Mexico City are blocked because* **the data exists but not as text** *— an altimetry image, a GPX inside a JavaScript map. That is not solved by more research. Medellín's GPX in particular is worth transcribing by hand: the dossier says the page "has to transcribe the GPX into named kilometres, especially the Sabaneta climb," and that plus the 09:00 gate arithmetic is the whole page.*

**Verdict: keep the format, run batch 2 with both fixes.** *Santiago was the one dud of the eight and it says so itself — a useful signal that the model's own richness self-assessment can be trusted for shortlisting.*

---

### Two rules added after batch 2 (September 5, 2026) — fold into §1A

**RULE: `NOTHING FOUND` on an official-document question must be proven against the organiser's document library, not its FAQ page.** *Batch 1 recorded "no published time limit" for Santiago. Batch 2 found* **`BASES-MARATON-DE-SANTIAGO-2026-VF1.pdf`** *— Art. 3 gives 6 hours, Art. 10º.5 gives gates at 21 km in 3:00 and 32 km in 4:35.* ***A confirmed false negative.*** *Consequence: the model's own richness self-assessment cannot be trusted for shortlisting — "thinnest of the eight" meant "I did not find the PDF," not "the material does not exist." Every `NOTHING FOUND` about rules, cut-offs, limits or course data is provisional until the organiser's own PDF library has been searched.*

**RULE: flag any figure that contradicts your own earlier output.** *Three field sizes moved silently between batches with no note:* **Rio 2025 13,070–13,132 → 12,951; SP City 5,386 → 5,317; Medellín 5,787 → 4,505 (a 22% move, and a different MarathonView race ID).* *Self-consistency is part of the standing rule, not separate from it.*

**On §5 — the "compute don't search" fix did not work, and the reason is technical.** *Results hosts (Runking, Sportmaniacs, RockTheSport) are JavaScript SPAs that cannot be dumped. The only batch-2 races with real buckets were* **Barcelona** *(Soy Corredor counted 24,943: sub-3 9.65%, sub-3:30 30.01%, sub-4 58.29%) and* **Sevilla** *(CAPIS counted 2,257 sub-3 net, 5,428 sub-3:30, 8,962 sub-4) —* ***both because a third party had already counted.*** **So the correct instruction order is: look for a published third-party count first, attempt the dump second, `NOTHING FOUND` third.**

---

### CLOSED September 5, 2026 — five batches run, 19 races researched, handed off to the build conversation

**Output files, all in `Claude outputs/`:**

| File | Contents | Status |
|---|---|---|
| `race-dossiers-batch1-2026-09.md` | Mexico City, Buenos Aires, Valencia, Miami, Santiago, Rio, SP City, Medellín | Usable. Santiago's cut-off `NOTHING FOUND` was a false negative — corrected in batch 3. |
| `race-dossiers-batch2-2026-09.md` | Bogotá, Sevilla, Barcelona, Lisboa, Porto Alegre, Monterrey + Part A fixes | Usable. |
| `race-dossiers-batch3-2026-09.md` | Madrid, Málaga, Floripa, Lima, Disney, Chicago | ⚠️ **Part A usable, Part B OFF-SPEC** — three sections dropped. Backfilled in batch 4. |
| `race-dossiers-batch4-2026-09.md` | Boston, NYC, Berlin, São Paulo Yescom, Porto + batch-3 backfill | Usable. Strongest batch. |
| `race-dossiers-batch5-section8-2026-09.md` | §8 harvest, 18 races, plus the recurring-theme count | **Read this one first.** It gives the page template its section order. |

**The four conclusions the build should inherit:**
1. **Inventory is not a gate.** The HR ladder is complete at 42 km in all three languages (`race-landing-pages-longlist.md` §1). Race pages are gated on the template, not on plans.
2. **Official documents win.** Never publish a page that contradicts an organiser's reglamento; a conflict is a question for the organiser, not a claim.
3. **Field distribution buckets do not exist.** Chicago publishes more than any marathon on earth and still has none. They exist only where a third party counted (Soy Corredor/Barcelona, CAPIS/Sevilla, Runify/Berlin). Stop asking.
4. **The travel thesis holds.** Visa regime, kit-collection rules, transport to the start and language of the official product are genuinely different content for a travelling Latin American athlete.

**And the finding that should shape the template: the course question is asked half as often as who may collect your kit** (8/18 vs 16/18). Registration mechanics dominate. Block order: registration → kit → corral → course → cut-offs in clock time → getting to the start.

---

## Brief 2 — Portuguese market research (feeds the PT offering item)

**Why this one:** the demand is confirmed and the site is nowhere near it. What's missing is a picture of what page-one for those queries actually looks like — which is public information and pure legwork.

**Paste this:**

> You are researching the Brazilian and Portuguese market for online endurance-sports coaching and structured training plans. I sell training plans and 1:1 remote coaching for running and triathlon, in Portuguese, to a mostly Brazilian audience. Answer in English; keep all Portuguese source material in Portuguese and do not translate query strings.
>
> **Part 1 — Query landscape.** For each of these commercial-intent seed queries in Brazilian Portuguese, give me the query variants real people actually search, with any demand estimate you can source: `plano de treino maratona`, `planilha de treino maratona`, `treinador online corrida`, `assessoria esportiva online`, `plano de treino meia maratona`, `plano de treino triathlon`, `plano de treino 70.3`.
> For each: list the 8–12 closest real variants, note which are transactional versus informational, and flag any where Brazilian usage diverges sharply from European Portuguese.
>
> **Part 2 — Terminology.** Build me a table of Brazilian Portuguese versus European Portuguese for the working vocabulary of endurance coaching: training, workout, session, pace, threshold, heart rate zones, tempo run, intervals, long run, taper, brick, coach, coaching service, training plan, spreadsheet/plan file, race, PB. Mark any term where using the wrong variant would immediately mark the writer as non-Brazilian to a Brazilian reader. This matters more than the translations — I want the tells.
>
> **Part 3 — Who owns page one.** For the five most transactional queries from Part 1, tell me who currently ranks on the first page. For each result: URL, what kind of page it is (product page, category hub, blog article, marketplace listing, forum thread), the title and H1 pattern, roughly how long the page is, whether it sells something directly or captures an email, and what the page is actually answering. I want the *shape* of what wins, not a scrape of the content.
>
> **Part 4 — The competitive set.** Who are the recognised online running and triathlon coaching services aimed at Brazilians? For each: what they sell, price if published, whether coaching is 1:1 or group, what platform they deliver on (TrainingPeaks, their own app, spreadsheets, WhatsApp), and their main distribution channel (SEO, Instagram, YouTube, a named coach's personal following, race-expo presence). Include both Brazilian companies and international ones that market in Portuguese.
>
> **Part 5 — Where Brazilian endurance athletes actually gather.** Named communities, forums, subreddits, Facebook groups, Strava clubs, YouTube channels, podcasts and Instagram accounts with real Portuguese-language endurance audiences. For each: rough size, what the audience is there for, and whether a coach can participate without it reading as advertising.
>
> **Part 6 — Commercial norms.** How online coaching is typically priced and paid for in Brazil: normal monthly price bands for remote 1:1 running coaching, whether Pix / boleto / instalment payment ("parcelado") is expected, and what an international coach charging in USD runs into.
>
> **Rules:** every factual claim carries a source URL. Where you cannot source something, say "unsourced — my estimate" explicitly rather than stating it flatly. Do not guess at search volumes; if you have no sourced figure, say so. Prices with a date attached, or not at all.

**On the way back:** Part 2 is the highest-value section and the easiest to verify — a Brazilian athlete confirms or destroys it in one message. Do that before Parts 3–6 change anything.

---

## Idea 3 — Gear research to break the affiliate deadlock

**Iván's idea, and it is the best of the five, because it breaks a circular dependency he has already diagnosed.** `gear` exists as an `article_type` and has produced zero articles. It is gated on the affiliate program (NEXT #9), which is gated on traffic, which is gated on articles. The expensive part of a gear article is the product legwork — current model years, real specs, real prices, actual availability in each market — and that is the exact shape of work to hand off.

**One strategic correction before writing the prompt.** NEXT #9 says "Amazon first." For an English-language audience that is right. For the Spanish LatAm audience — Argentina, Chile, Colombia, Peru, Mexico — it is probably wrong: Amazon does not serve most of those markets well, and Mercado Libre is the dominant marketplace with its own affiliate program. Brazil is a third case again (Amazon.com.br plus Mercado Livre plus Centauro). So the research brief should *test* the network choice per market rather than assume Amazon, and the answer likely splits: Amazon for EN, Mercado Libre for ES-LatAm, and a Brazil-specific answer for PT. That finding alone is worth the trial.

Scope to hand over: affiliate network terms and commission rates per market; category commission rates specifically for sporting goods, which are usually well below the headline rate; cookie windows; whether the network allows a non-resident operator; and then the product research itself for the first three or four articles — running shoes, GPS watches, heart-rate straps, indoor trainers — as current-model comparison tables with sourced prices per market.

Ask me and I will write this one out in full.

---

## Idea 4 — Competitive and pricing teardown across all three markets

`triaperformance-pricing-and-positioning.md` says price has been the only working growth lever and has never been deliberately tested, and NEXT #8 (+$50 testing-and-zones consultation) is unpriced against anything external. What is missing is a picture of the market's price ladder: what remote 1:1 endurance coaching costs in Spain, Argentina, Chile, Colombia, Mexico, Brazil, the US and the UK, at what level of service, delivered how, with what included and what charged extra. Published prices only, dated, sourced. Same for structured plan pricing on TrainingPeaks and its competitors.

This is legwork with a clear verification path — every price either has a public URL or it does not go in the table. It feeds a decision that is currently being made on intuition.

---

## Idea 5 — AI-assistant citation audit

**The most interesting of the five, and the only one where using a different model is the point rather than a workaround.**

There is a live item on the first observed AI-assistant lead (September 3), plus evidence that GPTBot has swept 200–300 TrainingPeaks plan pages — meaning the AI channel currently reads TrainingPeaks and not the site. Nobody has measured what that channel actually returns.

The job: take the 40–50 real purchase-intent questions an athlete asks before hiring a coach or buying a plan, in Spanish, English and Portuguese — "what training plan should I follow for my first marathon", "how do I find an online triathlon coach", "how many weeks do I need to prepare for a 70.3" — put each one to the assistant, and record verbatim which sources it names, which coaches or services it recommends, and what shape of page it is drawing from. That produces a baseline of who currently owns the answer, per language.

Claude cannot do this from here: the whole point is what a *different* assistant says. A trial account is the cheapest way to run it, and the output is a table Iván can re-run in three months to see whether anything he built moved it.
