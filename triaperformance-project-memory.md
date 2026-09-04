# Triaperformance — Project Memory

*Mirror of the Claude.ai project **Memory** field. Edit this file, then paste it whole into Memory. Memory holds only what the repo can't — how Iván works, and what Claude has learned about operating in this environment. Business state (numbers, what's live, what's next) is deliberately excluded: it lives in the repo, versioned, and changes weekly.*

*Last updated: September 4, 2026.*

## Who this is

Iván Koch runs Triaperformance (coach@triaperformance.com), a solo triathlon and running coaching business he is rebuilding to run without his personal hours once he's back in a full-time operating role. His domain is coaching, not software — but by August 2026 he has personally deployed and debugged a VPS, Docker, Caddy, n8n, Twenty CRM, Postgres and an Eleventy site. Treat him as technically competent and hands-on, not as a beginner. He executes every change against live systems himself; Claude designs, writes and documents. **That includes git: Claude never commits, and when asked for a commit command, matches this repo's convention — a bare one-line subject, no body, no attribution trailers.** *(Sept 4, 2026. Claude checked the log for style, saw five bare one-liners, and added a three-line trailer block anyway. A convention you look up and then override was never really looked up.)*

## Where the truth lives

The `triaperformance-docs` GitHub repo is the single source of truth, and as of **August 12, 2026 it is the *only* source.** ~~It syncs into this project~~ — **the project knowledge is now deliberately empty.** It used to hold hand-uploaded copies of 20 repo documents; they were always a day behind, they loaded automatically while the repo did not, and so a session was handed yesterday's numbers before it read anything current. Do not ask for uploads and do not read an empty knowledge base as missing context. The repo is connected at the start of every session.

**Search it, don't preload it.** The doc index in the project instructions is the map — it says which file owns what. `grep` the repo, then read only the sections that matched. **Every business figure must come from a file read in the current session**; the catalogue count moved five times in six days, so a number recalled rather than read is a number that is probably wrong.

`open-loops.md` is the NOW/NEXT/LATER list — reading it from the repo is the first tool call of a working session, and updating it is the last. This memory is not a state file. If a fact belongs in a doc, it goes in the doc.

## How to work with him

- Lead with the answer, back it with numbers, and say plainly when the data doesn't exist.
- Push back with real analysis. Agreement without evidence isn't useful to him.
- Test every recommendation against one question: does this cost his time once, or forever?
- Be concise. Cut any word that doesn't change the meaning.

## Standing lessons — earned, not assumed

- **A partial crawl's failures are evidence about the crawl, not about the targets.** (The "6 dead plans" myth, July 2026 — recorded as fact for a week, then disproven.)
- **Nothing is done until Iván reports a real result from the live system.** Reading the code is not verification.
- **Narrow an agent's job to calling tested logic, never to authoring it.** Hermes narrated success while shipping broken code (July 17, 2026).
- **Infrastructure learning for its own sake is an anti-pattern.** Every build session must leave a durable asset behind.
- **Distribution over creation.** Most of this business is under-promoted, not under-built.
- **A doc that isn't corrected on the way past rots into a contradiction.** Numbers get restated across files; when one moves, the others don't follow on their own.
- **A check whose input is the thing being checked can only ever confirm it.** *(Aug 12, 2026.)* The plan-link checker skipped every row where `is_published != TRUE`, so it structurally could not find a plan wrongly marked FALSE — which was three of the four known failures. The same shape as verifying the inventory against a file derived from the inventory. Before trusting a verification, ask what it would look like if the thing were wrong in the *other* direction. If the answer is "identical", it isn't a check.
- **Liveness is not correctness, and the difference is where the expensive bugs live.** *(Aug 12, 2026.)* Twelve published plans linked to a *different* plan's TrainingPeaks page; a buyer paid and received the wrong product. Every one of those URLs returned HTTP 200, so the link checker — which tests that a URL is alive — passed them for months. Name the property actually being tested, and notice when it isn't the one that matters.
- **When a human error recurs, make it impossible rather than write the warning down again.** *(Aug 12, 2026, four instances in one day.)* A doc warning about pasting tokens failed twice, so the roster query now runs against a view that cannot return the column. Also: the build fails if a plan links to another plan's page, if an asset has no cache-bust fingerprint, or if a zone table is short a row. A guard costs one afternoon and never needs remembering; a note costs nothing and gets read once.
- **Check live state against the live system, never against the docs.** Three times now a "pending" written down has outlived reality — the "6 dead plans" myth, the `plans_raw` duplicate ghost, and a storefront that sat documented as undeployed for a week while live, holding four queued items behind a gate that had already opened. Deploy status, what's serving, what's Active: fetch the URL or run the query at the start of a session. It costs seconds; carrying the assumption forward costs weeks.

## Deliberately not in memory

Revenue figures, athlete counts, catalog counts, pricing, review counts, stack inventory, what shipped, what's next. All of it is in the repo. Read it there.
