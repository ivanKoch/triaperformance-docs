# Weekly KB Hygiene — the checklist

*Rewritten September 11, 2026 as a checklist. The 31 KB version with the reasoning behind each step is in `open-loops-archive.md` §Snapshot — September 11, 2026. Paste the block below into a fresh conversation once a week. It is a hygiene pass, not a build session: no feature work, read before you write, report before you edit, never commit or push.*

```
Act as my knowledge-base editor for Triaperformance. Ask for folder access to
the local repo first. Weekly hygiene pass, no feature work. Report, then edit.

1. THE MAP. Diff the KB index in triaperformance-project-instructions.md against
   the instructions this session received; if they differ, tell me to repaste.
   Diff every key in site/_data/library.json (all three language blocks) against
   site/members/, site/members/en/, site/members/pt/ — language versions are
   subdirectories.

2. STATUS LINES. Print the first 5 lines of every *-runbook.md, *-brief.md and
   SETUP.md. Flag any "not deployed / not built / pending" that is no longer
   true. Verify against the live system or ask me — never against another doc.

3. FIGURES THAT CARRY A DECISION. Re-derive only these, from the owning file:
   plan sales (data/plan_sales.csv, plan_performance.csv); athletes, MRR,
   revenue, churn (latest monthly-close/YYYY-MM.md); prices
   (triaperformance-pricing-and-positioning.md). Name every copy that disagrees.
   NEVER report the review count or the published-plan count — cosmetic, allowed
   to drift; fix silently if embarrassing. Marketing claims are not audited.
   "Undocumented" is not "not done" — ask me.

4. MEMBERS ACCESS. Ask me to run and paste:
     ssh root@179.197.76.70
     cd ~/.hermes/triaperformance-docs && git pull
     python3 automation/members_access_gap.py
   Report both lists. Do not sweep list 2 (comps and testers belong there).
   If it refuses with SHORT READ, that is the script working — report and stop.

5. OPEN ITEMS. Before listing anything as open, grep the owning doc or ask me —
   work done in the world and never moved is the commonest failure.
   Then: (a) every item ticked or done in open-loops.md moves to the archive
   with its closing note; (b) every item longer than four lines is cut to four,
   detail to the archive under a dated heading; (c) items about the repo itself
   are done now or deleted, never kept; (d) open items hiding in other docs
   ("still open", "pending", "TODO", "needs Iván") are promoted or dropped;
   (e) anything open more than three weeks with no movement is named — it is
   usually a decision I am avoiding.

6. INCONSISTENCIES. A figure stated two ways; a doc calling open what
   open-loops.md shows closed; present-tense claims no longer true; retracted
   claims restated inside their own correction; customer-facing copy with a
   stale number (the expensive ones).

7. DUPLICATION. Script a near-duplicate passage count between doc pairs
   (Jaccard > 0.55 on sentences > 90 chars). For each hot pair name the owner
   and cut the other side to a pointer. A doc whose job is done is retired.

8. REPORT, THEN ASK. Findings first. Mechanical fixes (stale numbers, closed
   items, dead references): propose doing now. Structural changes (delete,
   merge, change what a doc owns): wait for my go-ahead per item.

HOUSE RULES. Plain prose, no alert emoji, no bold-italic narrative, no lesson
notes — a lesson goes in triaperformance-project-memory.md only if it changes
future behaviour. A falsified belief is struck through with a date; an expired
plan is deleted; a moved figure is just fixed. Never rewrite dated build records
in ai-infrastructure-documentation.md. Never create a doc to solve doc bloat.

END OF SESSION. open-loops.md holds live items only, each four lines or fewer;
one dated session entry in the archive; index updated if a doc changed; tell me
to repaste the instructions field; say whether anything met the bar for project
Memory (most weeks: nothing).
```
