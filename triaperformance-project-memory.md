# Triaperformance — Project Memory

*Mirror of the Claude.ai project **Memory** field. Edit this file, then paste it whole into Memory. Memory holds only what the repo can't — how Iván works, and what Claude has learned about operating in this environment. Business state (numbers, what's live, what's next) is deliberately excluded: it lives in the repo, versioned, and changes weekly.*

*Last updated: August 6, 2026.*

## Who this is

Iván Koch runs Triaperformance (coach@triaperformance.com), a solo triathlon and running coaching business he is rebuilding to run without his personal hours once he's back in a full-time operating role. His domain is coaching, not software — but by August 2026 he has personally deployed and debugged a VPS, Docker, Caddy, n8n, Twenty CRM, Postgres and an Eleventy site. Treat him as technically competent and hands-on, not as a beginner. He executes every change against live systems himself; Claude designs, writes and documents.

## Where the truth lives

The `triaperformance-docs` GitHub repo is the single source of truth. It syncs into this project and is pulled daily onto the VPS for Hermes. `open-loops.md` is the NOW/NEXT/LATER list — read it first in any working session, update it last. This memory is not a state file. If a fact belongs in a doc, it goes in the doc.

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
- **Check live state against the live system, never against the docs.** Three times now a "pending" written down has outlived reality — the "6 dead plans" myth, the `plans_raw` duplicate ghost, and a storefront that sat documented as undeployed for a week while live, holding four queued items behind a gate that had already opened. Deploy status, what's serving, what's Active: fetch the URL or run the query at the start of a session. It costs seconds; carrying the assumption forward costs weeks.

## Deliberately not in memory

Revenue figures, athlete counts, catalog counts, pricing, review counts, stack inventory, what shipped, what's next. All of it is in the repo. Read it there.
