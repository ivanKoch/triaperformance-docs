# Weekly KB Hygiene — the prompt

*Written August 8, 2026, distilled from the consolidation session that produced `open-loops-archive.md` and the "one home per initiative" rule. Paste the block below into a fresh conversation once a week. Everything above and below it is context for why it's shaped this way — the prompt itself is the fenced block.*

**Cadence:** weekly, ~30–45 min. Best on a day with no build work queued, because the output is a decision list and it competes with itself if a branch is mid-flight.

---

## The prompt

```
Act as my knowledge-base editor for Triaperformance. Prompt me for folder access
to the local repo first.

This is a weekly hygiene pass, not a build session. No feature work. Read before
you write, report before you edit, and never commit or push.

=== STEP 1: VERIFY LIVE STATE AGAINST LIVE SYSTEMS ===

Before anything else, print the first 5 lines of every SETUP.md, *-runbook.md and
*-brief.md, and flag any "Status:" / "not deployed" / "not built" claim in them.
Added Aug 13, 2026: one such line sat wrong at the top of a runbook for two and a
half weeks, saying an engine was unbuilt while it ran on cron. It survived
because normal work never opens those files. This costs 30 seconds.


Do this FIRST, before reading any doc's claims as true. The single most expensive
recurring failure in this repo is a status written down that outlived reality.

- Fetch triaperformance.com/planes/, /en/plans/, /pt/planos/. Note what each
  prints as its plan count.
- Re-derive every figure the repo claims to own, from the file that owns it:
    * published plan count + language split -> data/training_plans_inventory.csv
      (is_published=TRUE), and cross-check it against what the live site printed
    * plan sales figures -> data/plan_sales.csv, data/plan_performance.csv
    * anything else a doc states as a number: find its source file, or flag that
      it has none
- Scan published plan names for city/race tokens. There should be zero
  race-stamped plans; that model is permanently retired.
- Tell me anything that needs checking on a system you can't reach (TrainingPeaks,
  n8n, Twenty, the VPS) as an explicit question, with the exact command or the
  exact screen to look at. Do not assume, and do not treat my silence as a yes.

=== STEP 2: THE COMPLETE OPEN-ITEMS LIST ===

- Read open-loops.md. That's the live list.
- Then find every open item that is NOT in it. Grep the whole repo for unchecked
  boxes, "still open", "not yet", "pending", "TODO", "open question", "to verify",
  "needs Iván". Runbooks, methodology.md section 13, brief section 9s, and the
  infra doc's numbered sections all hide items this way.
- Give me ONE consolidated list: what's in open-loops.md, and separately what was
  hiding elsewhere and needs promoting.
- Flag anything in open-loops.md that I've already told you is done in a past
  session, and anything that's been open more than 3 weeks with no movement —
  those are usually decisions I'm avoiding, not tasks I'm behind on.
- Check the WIP rule honestly: 1 big branch + 1 small slot. If the small slot is
  over its limit, say the number out loud. Don't quietly accept it.

=== STEP 3: INCONSISTENCIES ===

- Any figure stated differently in two docs. Name the owner doc and every copy.
- Any doc calling something open/pending that open-loops.md shows as closed.
- Any present-tense claim that's no longer true (things "being built" that are
  built, things "that don't exist yet" that do, tools described as living
  somewhere they no longer live).
- Any retracted claim still circulating — INCLUDING claims restated inside a
  correction note in order to deny them. A denial keeps the claim alive; the next
  reader quotes the denial. Check your own past correction notes for this.
- Any customer-facing copy in the repo (GBP posts, listing rewrites, page copy)
  carrying a stale number. These are the expensive ones — they're published.

=== STEP 4: DUPLICATION AND RETIREMENT ===

- Measure it, don't eyeball it: script a near-duplicate passage count between
  every pair of docs (normalise to word sets, Jaccard > ~0.55, sentences > 90
  chars). Report the top pairs with counts.
- For each hot pair: name which doc should OWN that content, and propose the
  other side be cut to a pointer.
- Apply the standing rule: one home per initiative, one home per list. A doc that
  has finished its job gets RETIRED — its live pieces moved into the owning doc,
  then deleted — not left in the index to be re-read and re-quoted as current.
  Name any doc that now qualifies.
- Report total repo word count vs. last week's, so the trend is visible.

=== STEP 5: REPORT, THEN ASK ===

Give me the findings first. Then split proposed fixes into:
  (a) mechanical and clearly right — stale numbers, closed items, dead
      references. Propose doing these immediately.
  (b) structural — deleting or merging docs, moving sections, changing what a
      doc owns. Wait for my go-ahead on each.

Push back on me where the data disagrees with what I've said. Lead with the
answer, keep it short, cut any word that doesn't change the meaning.

=== HOUSE RULES WHILE EDITING ===

- Corrections go in as dated inline notes that say what the line used to claim
  and why it was wrong. Append, don't silently rewrite.
- EXCEPTION: a claim that was retracted as false gets DELETED, not struck
  through and not restated in its own correction note. Struck-through text still
  reads as text.
- Never rewrite dated build records in ai-infrastructure-documentation.md to
  current values. They were correct on their date. Append a note at the end of
  the section saying the figures are historical and naming the owner file.
- Don't create a new doc to solve doc bloat unless it's an archive split.
- Never add, commit or push. Tell me what to commit.

=== END OF SESSION ===

- Update open-loops.md: live items only.
- Move anything closed to open-loops-archive.md with its closing note intact —
  the reasoning is what stops the question being re-asked in six weeks.
- Add one session-log entry to open-loops-archive.md.
- If a doc was added, renamed or retired, update the KB index in
  triaperformance-project-instructions.md in the same session, and remind me to
  paste that file into the project's Custom instructions field.
- Tell me explicitly whether anything this session met the bar for updating
  project Memory. Most weeks nothing will, and that's the correct answer.
```

---

---

## The status-claim audit — a separate, one-off pass

*Added August 13, 2026, after `automation/content-engine/SETUP.md` was found opening with **"Status: written, nothing deployed"** for two and a half weeks while both agents, the writer and the admin page had been live since Aug 4. Same day, `triaperformance-business-overview.md` still said "nine tools are live" against a library that had been rebuilt, and all three All-Access pages sold a members area containing a tool deleted that morning.*

**Why the weekly pass did not catch it, which is the whole point.** Step 1 of the weekly prompt already says "verify live state against live systems" — and this still happened, three times, in one repo, in one day. Two reasons:

1. **The weekly pass reads the docs it reads.** `open-loops.md`, the strategy docs, the infra doc. It does not open `automation/*/SETUP.md`, because the index explicitly says runbooks are "not read during normal work". *A stale line in a file nobody opens is invisible to a pass that only checks files it opens.*
2. **The damage is asymmetric and the weekly pass treats it symmetrically.** A doc claiming something is live when it isn't causes a confused five minutes. ***A doc claiming something is NOT built when it is causes weeks of nothing*** — anyone deciding whether to build on the content engine read line 3 and stopped. That asymmetry deserves its own sweep.

**Run this once, mechanically, across the whole repo. It is not the weekly pass and should not be folded into it** — the weekly pass is a judgement session with a WIP limit; this is a grep-driven inventory that either finds contradictions or doesn't.

```
Act as my knowledge-base auditor for Triaperformance. Prompt me for folder access
to the local repo first.

ONE JOB: find every place a document asserts BUILD OR DEPLOY STATE, and check
whether that assertion is still true. Nothing else. No feature work, no
restructuring, no new docs. Never commit or push.

Background: on Aug 13, 2026 automation/content-engine/SETUP.md opened with
"Status: written, nothing deployed" while the whole engine had been live on cron
for two and a half weeks. Nobody noticed because it is the first line of a file
that normal work never opens. The same day, two other docs and three sales pages
were found describing things that had changed.

=== STEP 1: SWEEP, DON'T READ ===

Grep the entire repo -- including automation/**, site/**, every runbook, and
every *.md -- for claims about state. Search at minimum:

  not deployed, nothing deployed, not built, not yet, no todavía, todavía no,
  pending, still pending, planned, upcoming, próximamente, coming soon, TODO,
  WIP, "written but", "designed but", "in progress", "no live", "not live",
  "Status:", "Estado:", "Build status", "not wired", "unbuilt", "parked"

Also list, separately: THE FIRST 5 LINES OF EVERY FILE named SETUP.md, *-runbook.md,
or *-brief.md. Status headers live at the top of files, and the top of a file
is what a future reader treats as current.

Output a table before changing anything: file, line, the claim, and which
system would confirm or refute it.

=== STEP 2: VERIFY AGAINST A DIFFERENT SOURCE THAN THE CLAIM ===

For each row, check against something OTHER than the doc that made the claim:

  - Code/pages exist?        -> the filesystem, and the built output in _site/
  - Deployed on the VPS?     -> ASK ME. Give me the exact command to run
                                (docker ps, crontab -l, curl a health endpoint).
                                You have no VPS access; do not infer from the repo.
  - Live on the website?     -> fetch the real URL
  - n8n / Twenty / TP?       -> ASK ME. Never infer from the reference JSON;
                                that file is documentation, not the system.

If you cannot verify a row, say so and leave it. An unverified row stays in the
report as unverified; it does not get "corrected" on a guess.

=== STEP 3: SORT BY BLAST RADIUS, NOT BY COUNT ===

Report in this order, and say plainly which is which:

  A. SAYS NOT BUILT / NOT DEPLOYED, BUT IT IS.  <- most expensive, fix first.
     These silently stop work. Name what each one has been blocking.
  B. SAYS LIVE / DONE, BUT IT ISN'T.            <- causes wrong decisions.
  C. Numbers that moved (counts, prices, subscriber and athlete figures).
  D. Named things that no longer exist (retired tools, deleted pages, renamed
     products) still being described as current -- especially in anything
     customer-facing.

=== STEP 4: FIX, THE REPO'S WAY ===

  - Corrections are DATED INLINE NOTES that say what the line used to claim and
    why it was wrong. Append; do not silently rewrite. The wrong version is the
    evidence.
  - Grep for the CLAIM after fixing, not for the correction -- a correction that
    quotes the stale claim keeps it findable and quotable.
  - One home per figure. If a number appears in more than one file, fix every
    copy in this same pass and say which file owns it.

=== STEP 5: THE STRUCTURAL QUESTION ===

For each status line found, ask whether it should exist at all. A runbook
describes a PROCEDURE; build state belongs in open-loops.md, which is read at the
start of every session. A "Status:" header on a runbook is a copy of open-loops
that nobody updates.

Propose -- do not apply -- either:
  (a) delete the status line and let open-loops.md own it, or
  (b) keep it and add "verified: <date>", so the next reader can see its age.

=== END ===

  - Give me a commit message and the list of files changed. I commit and push.
  - Add any NEW failure mode you found to kb-hygiene-prompt.md, so the weekly
    pass inherits it.
  - Tell me if anything met the bar for project Memory. Usually nothing does.
```

### Failure modes found on the first real run of this pass (August 14, 2026) — fold these into the weekly Step 1

*The audit above was run once, mechanically, on Aug 14, 2026. It found six patterns the weekly pass would not have caught. Each is now a one-line check.*

1. **A status claim inside a HEADING is the least-revised line in any file.** `ai-infrastructure-documentation.md` §15 was titled *"(built July 26, 2026; not yet cut over)"* for **sixteen days** after the cutover, in the technical source of truth, where it also renders in the table of contents. Nobody edits a heading when appending a dated note underneath it. **Check: grep `^#{1,4} .*(not |un|pending|TBD|WIP)` across all `*.md`.**
2. **A "trigger to build: X ships" line is a status claim that nothing re-reads on the day X ships.** `race-landing-pages-longlist.md` and `race-page-content-outline.md` both said *"not blocking anything — trigger is the plan template shipping."* The plan template shipped **Aug 6**; `open-loops.md` had already promoted race pages to NEXT #1; both headers still read as parked eight days later. **Check: for every "trigger:" in the repo, ask whether the trigger has already fired.** A parked doc never notices its own unparking.
3. **The correction landed in the file nobody opens and missed the file everybody opens.** On Aug 13 `automation/content-engine/SETUP.md` was fixed — correctly. `content-engine-brief.md`, the doc the KB index calls *"the status-driven content pipeline design"*, still said **"Still not built: the `content` Postgres database and the five agents"** and **"Status: design"**. **Check: when you correct a status line, grep the repo for the *system's name* and fix every sibling claim in the same session.** One fix is never one file.
4. **A "what's left to build" table is the most expensive thing in the repo to leave stale, because its whole purpose is to be trusted.** `artifact-publish-runbook.md`'s "In progress" table — which `open-loops.md` points at *by name* — listed the zone calculator as **"not started"** four days after it shipped in three languages, and the activation artifact as **"awaiting port"** the day after it shipped. **Check: any table whose column is called State, Status or Shipped gets re-derived from the filesystem, not read.**
5. **A deleted page leaves five copies of its URL behind, and one of them is a procedure.** Aug 13's retirements (`zonas`, `tests`, `carrera`, `kettlebell`, `nutricion`, `activacion-ciclismo`) were still listed as current in `website-build-cutover-runbook.md`'s verification checklist (which sends the operator to five 404s), `automation/content-engine/SETUP.md`, `triaperformance-growth-roadmap.md` twice, and `artifact-publish-runbook.md`. **Check: on the day a page is deleted, grep its path across `*.md`, `*.njk`, `*.json` and `automation/` — not just `site/`.**
6. **A `_note` inside a data file claiming the file is incomplete.** `site/_data/zonesUi.json` opened with *"Spanish only for now"* while holding fully populated `es`, `en` and `pt` objects. **Check: grep `_note`/`_comment` keys in `site/_data/*.json` against what the file actually contains.**

7. **A stale open-items list does not merely fail to inform — it manufactures work.** Two entries on `infrastructure.html`'s list (the Managed Hermes cancellation, the Twenty API-key rotation) were closed long ago, and the list caused them to be re-asked of Iván **three separate times**. *Each re-ask spends trust in the list, and a list nobody trusts is a list nobody updates.* **Check: any list of open items outside `open-loops.md` is a defect, not a convenience.** That one was deleted Aug 14, 2026.
8. **A status claim written in the FUTURE tense never expires on its own.** `zones-calculator-brief.md` carried *"They promise the calculator is behind the login. **It is about to be public.**"* True for one day; it then read as a pending future event indefinitely. Likewise `plan-capture.js`'s *"NOT LIVE YET **as of this commit**"* — the code ships, the sentence stays, and nothing rebuilds it. **Check: grep `about to`, `as of this commit`, `will be`, `once X ships` — and never put deploy state in a source comment.**
9. **A runbook written the day before its system goes live is stale on arrival.** `zone-magnet-runbook.md` was created Aug 13 opening **"Status: NOT LIVE"** and was false within 24 hours — the shortest-lived stale claim in the repo. *This is not carelessness; it is structural. A deploy runbook is by definition written before the deploy.* **Since Aug 14, 2026 every `Status:` line on a runbook or brief carries a `verified: <date>` stamp.** Ten had none. **Check: a `Status:` line with no `verified:` date is itself a finding — stamp it or delete it.**

**And one live-systems finding worth repeating every week:** *`/en/plans/` served **108 plans**; the same URL with `?v=` appended served **111**, the correct number. **A cached HTML page can make a live-URL check confirm a stale claim.** Always fetch live pages with a cache-busting query string during a hygiene pass — otherwise Step 1 "verified against the live site" can be verifying yesterday's site.*

**What this pass is not.** Not a rewrite, not a consolidation, not a place to fix writing. If a doc is stale *and* badly organised, fix the staleness here and log the reorganisation for the weekly pass. *The reason this is separate from the weekly pass is that it is boring and mechanical, and boring mechanical passes are the only kind that reliably find this class of error.*

## Why each step is shaped this way

**Step 1 runs first, and against live systems, because the repo's worst failure mode is documentary, not technical.** Four times now a state written down has outlived reality: the "6 dead plans" myth, the `plans_raw` duplicate ghost, a storefront documented as undeployed for a week while live (holding four queued items behind a gate that had already opened), and a race-stamped plan still serving on the live catalog after the sweep that was supposed to have caught it. That last one was found by reading the live page, not the CSV — the sweep had been verified against the same file that produced it, which can only ever confirm itself. **Verify against a different source than the one that made the claim.**

**Step 2 exists because `open-loops.md` is only the single source of truth if something actively enforces it.** On Aug 8 there were eleven genuinely open items living only in runbooks, `methodology.md` §13, and the infra doc — invisible to every session that started by reading the list. Items don't migrate on their own.

**Step 3's fourth bullet is the one that's easy to skip.** In this session the first correction pass replaced a retired claim with a note that quoted the claim while explaining its deletion — reproducing the exact mechanism that had kept it alive for three weeks. It was caught by grep, not by reading. Grep for the claim, not for the correction.

**Step 4 is measured rather than judged** because "these two docs feel similar" doesn't survive a disagreement and "12 near-duplicate passages between these two files" does. That measurement is what justified retiring the storefront brief.

**Step 5's split matters** because mechanical fixes are cheap and reversible, structural ones delete things. Bundling them means either the safe fixes wait on a decision, or the deletions happen without one.

## What this pass is NOT for

Not a planning session, not a build session, and not a place to open a new branch. If it surfaces something that deserves real work, it goes into `open-loops.md` with a trigger and waits for a session with the WIP room to take it. A hygiene pass that turns into a build session stops being run weekly, and a hygiene pass that isn't run weekly is how the repo got here.
