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

## Why each step is shaped this way

**Step 1 runs first, and against live systems, because the repo's worst failure mode is documentary, not technical.** Four times now a state written down has outlived reality: the "6 dead plans" myth, the `plans_raw` duplicate ghost, a storefront documented as undeployed for a week while live (holding four queued items behind a gate that had already opened), and a race-stamped plan still serving on the live catalog after the sweep that was supposed to have caught it. That last one was found by reading the live page, not the CSV — the sweep had been verified against the same file that produced it, which can only ever confirm itself. **Verify against a different source than the one that made the claim.**

**Step 2 exists because `open-loops.md` is only the single source of truth if something actively enforces it.** On Aug 8 there were eleven genuinely open items living only in runbooks, `methodology.md` §13, and the infra doc — invisible to every session that started by reading the list. Items don't migrate on their own.

**Step 3's fourth bullet is the one that's easy to skip.** In this session the first correction pass replaced a retired claim with a note that quoted the claim while explaining its deletion — reproducing the exact mechanism that had kept it alive for three weeks. It was caught by grep, not by reading. Grep for the claim, not for the correction.

**Step 4 is measured rather than judged** because "these two docs feel similar" doesn't survive a disagreement and "12 near-duplicate passages between these two files" does. That measurement is what justified retiring the storefront brief.

**Step 5's split matters** because mechanical fixes are cheap and reversible, structural ones delete things. Bundling them means either the safe fixes wait on a decision, or the deletions happen without one.

## What this pass is NOT for

Not a planning session, not a build session, and not a place to open a new branch. If it surfaces something that deserves real work, it goes into `open-loops.md` with a trigger and waits for a session with the WIP room to take it. A hygiene pass that turns into a build session stops being run weekly, and a hygiene pass that isn't run weekly is how the repo got here.
