# La semana de fuerza del corredor — lead magnet

**Status: v1 BUILT in all three languages, September 9, 2026 · NOT LIVE — the pipeline needs three steps only Iván can run** (`tool-lead-runbook.md` §Before you activate). The three PDFs are in `site/assets/guias/`, the capture is on the three public runner-core pages, and the endpoint does not answer yet.

**What it is.** The guide traded for an email on `/core-para-corredores/` and its EN/PT siblings — the public copy of the runner-core tool. Six pages. Built by `automation/build-runner-week-pdf.js` from `automation/runner-week-content.js`.

| | |
|---|---|
| ES | `semana-de-fuerza-del-corredor.pdf` |
| EN | `runner-strength-week.pdf` |
| PT | `semana-de-forca-do-corredor.pdf` |

## Why this offer and not another one

*Iván chose it from four options, September 9, 2026.* **The test it had to pass was set the day before, by the decision NOT to put a capture on the pace converter:** an email box belongs on a tool only when an artifact exists that ***continues the job the tool started***. The zones calculator qualifies — you have numbers, the guide says what to do with them. A pace converter is a fifteen-second lookup with nothing to continue.

The runner-core tool ends and the athlete's real next question is **"how often, and what else?"** — which is what this guide answers, and which the tool itself cannot. The three options that lost, and why they are recorded rather than forgotten:

- **An 8-week progression.** The strongest-sounding and the worst fit. A third of it restates the 3-or-4-round button the tool already has, it implies the routine is *the programme* — which `runner-core-brief.md` explicitly rejects — and every progression in it is a coaching call Iván would have to make.
- **A printable card of the routine.** Cheapest to build and strictly worse than what the reader already has open: the tool is free, public and needs no login.
- **No capture; build `/recursos/` instead.** Not wrong, and not exclusive — this guide is the artifact that hub needs anyway. It lost on placement: the hub is not what anyone searches for, and the tool page is the one that will rank.

## Nothing in it is a new coaching decision — except one thing, which is flagged

**Every prescription in the guide is a copy of a decision that already has a home**, and the content file names the home per section:

| In the guide | Owner |
|---|---|
| Twice a week, easy days, never before quality; the upper-back gap | `runner-core-brief.md` |
| Gym placement in the week, the 12-week phases, 2 sessions as the norm | `methodology.md` §13.1 |
| What strength buys (and that it is not watts), the four errors, maintenance | `strength-guide-brief.md` |
| The traffic light and the red flags | `knee-strength-brief.md`, `achilles-brief.md` |
| "No soy médico y no diagnostico" | `methodology.md` §7, §11 |

**The week grid on page 4 was approved by Iván on September 12, 2026.** The four placement rules above it are his (`methodology.md` §13.1); the grid is what they produce for a five-run week, and it is now signed off as a week, not only as a derivation.

## The honesty that makes it worth an email

**Section 2 tells the reader what the free tool does not do**: it does not train the foot and calf spring, it does not train kneecap tracking under load, and — the one nobody else would print — **it does not train scapular endurance, because the routine deliberately swapped the paracaidista for the single-leg deadlift and that gap was accepted knowingly** (`runner-core-brief.md`). The first two point at `/members/aquiles/` and `/members/rodillas/`, which are gated; the third points at an exercise the reader can add for free.

***That ratio is the design.*** A guide whose three gaps all resolve to "subscribe" is a brochure. One of them resolving to "do a prone W with your legs on the floor" is a coach.

## Build

```bash
node automation/build-runner-week-pdf.js es    # then en, pt
```

**Needs Playwright and a Chromium.** `CHROMIUM_PATH=/path/to/chrome` overrides the browser when Playwright did not download one itself; without it the default applies.

🔑 **The builder refuses to run if the guide and the athlete's page disagree.** The six circuit exercises are named in `runner-week-content.js`, and the build checks them — ids **and order** — against `data/members_exercises.csv`, which `automation/extract-members-exercises.js` generates by evaluating the built page's own data script. Spanish is the control: its names must match the page verbatim, and EN/PT are checked by position against the same ids. *So the guide cannot describe a routine the athlete does not get, and a change to the circuit fails this build rather than shipping a quietly wrong PDF.* **Same shape as the recovery/mobility translation checks — Spanish as a check rather than a lookup key, `ai-infrastructure-documentation.md` §44.**

**Typography is Archivo**, embedded as a base64 woff2 from the site's own subset (`brand-guidelines.md` §4, reject-list item 1). ⚠️ *The two older guide builders still render in Helvetica — they predate v1.1 by a day. Logged in `design-refresh-brief.md`, not fixed here.*

## Where it appears

- **Public:** the capture on the three runner-core pages → the email delivers the PDF.
- **Members:** a download card on `/members/guias/`, `/members/en/downloads/`, `/members/pt/downloads/`. **A subscriber has already paid for this guide; asking them for an email would be charging them twice, once in money and once in friction** — the same rule the members zones calculator follows.
- **Not on `/recursos/`,** because that page does not exist yet. It is the obvious third home the day it does.

## Open

- **The pipeline is not live.** Three steps, all Iván's: the Twenty enum value, the Caddy reload, the n8n import. `tool-lead-runbook.md`.
- **The week grid needs his read** (above). It is the only unapproved thing in the document.
- **Nobody has received one.** The send path has never run end to end against the real stack — same standing gap every tool in this repo carries at v1.
- **No `List-Unsubscribe` header**, because `n8n-nodes-base.emailSend` has no header option at all (`unsubscribe-runbook.md` §Headers, corrected Sept 9). The footer link is in every send and is proportionate at today's volume.
