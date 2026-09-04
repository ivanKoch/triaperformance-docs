# LinkedIn & Personal Positioning — Iván Koch

**Home doc for how Iván presents himself to the corporate market.** Owns the headline, the About section, the Triaperformance job description, and the `/ai-systems/` showcase page. *Added September 4, 2026.*

**Owns no business figures.** Every number quoted below is a copy — `monthly-close/2026-08.md` owns the point-in-time figures, `training-plans-analysis.md` owns plan sales, `ai-infrastructure-documentation.md` owns what was built. When a close moves a number, this file's copies are corrected in the same session, same as every other copy in the repo.

---

## 1. The positioning decision (September 4, 2026, Iván)

**Angle: operator who ships AI systems.** COO/operations leader first, AI-native second. Not "AI transformation consultant," not "technical founder."

**Primary target: remote US/EU startups, seed to Series B.** Titles: COO, Head of Operations, VP Operations, Chief of Staff. Secondary: LatAm regional ops leadership and PE-backed operating roles, both of which the existing track record already serves without extra copy.

**Why this angle and not "AI leader."** The hiring signal for AI-adjacent operating roles is production evidence, not vocabulary. The five capabilities employers screen for in 2026 AI-operations postings are use-case selection, hands-on execution, AI literacy in production model behaviour, data-readiness judgment, and operating-model design — and the highest-value single signal is a deployed system that "stayed up and delivered value under real load." Iván has all five and, unusually, has them *attached to a P&L he owns*. The "AI consultant" framing throws away the P&L half, which is the scarce half.

*Source for the market read: Axial Search's 2026 AI-operations posting analysis (foundation models in 44% of postings, Python 31%, observability 30%, SQL 22%, agentic AI 21%; degree required in only 51%; certifications negligible) and Eightfold's agent-orchestration role definition. Both fetched September 4, 2026 — treat as a dated read, not a standing fact.*

**The one gap in his story, stated so it is not discovered in an interview:** everything he has built is single-operator. There is no evidence yet of *rolling AI out across a team* — governance, adoption, change management, the "82% of executives expect agents, 23% feel confident integrating them" problem. That is what a hiring COO conversation will probe. The honest answer is that he has done exactly that with humans (ClickGuard's cultural transformation, Beat's Colombia org) and has done the AI half alone; the pitch is the intersection, not a claim of having run both at once.

---

## 2. Headline (220-char limit)

**Recommended — 137 chars:**

> COO & Operations Leader | P&L owner who builds the AI systems, not just the roadmap | SaaS · Marketplaces · Fintech

**Alternate, heavier on AI — 149 chars:**

> Operations executive who ships production AI | COO · P&L, agent orchestration, ops that don't need headcount | SaaS, Marketplaces, Fintech

**Alternate, heavier on the turnaround — 143 chars:**

> COO | Took a bootstrapped SaaS from EBITDA loss to profit in 6 months | Now building the AI systems operators used to buy

*Pick one and leave it. The first is the default because "builds the AI systems, not just the roadmap" is the whole differentiator in nine words, and it still reads as an operations headline to a recruiter filtering on "COO."*

---

## 3. About section (2,600-char limit — this draft is ~1,940)

> I'm an operations executive who builds the systems, not just the org chart.
>
> Ten years running operations in high-velocity businesses — Uber Eats, Beat, Binance, OneLocal, ClickGuard — across food delivery, ride-hailing, crypto, fintech and B2B SaaS. P&L ownership, EOS/OKR operating rhythms, and cross-functional leadership across Sales, CS, Marketing, Product, Engineering and Data.
>
> Most recently, as Director of Operations (Integrator) at ClickGuard, I led the operational and cultural turnaround that took a bootstrapped B2B SaaS from EBITDA loss to strong profitability in six months — well ahead of plan — while expanding gross margin and funding the first repayment of a legacy operating loan out of cash flow.
>
> What changed in the last two years is *how* I operate. I stopped writing requirements for someone else to build and started building. Triaperformance — the coaching business I founded — is now a live production environment: a self-hosted AI stack on my own infrastructure, agents running on cron behind human approval gates, per-caller LLM cost accounting, a CRM and lead pipeline I wired myself, and a monthly close that makes every figure in the business reproducible from a file.
>
> It runs at a 71.6% operating margin with 93.4% net revenue retention, solo. Not because it's small — because the operating model was designed not to need headcount.
>
> That's the operator I think the next few years reward: someone who can own a P&L, redesign the operating model around agents, and go build the thing instead of waiting for a roadmap slot. Most of what breaks in AI adoption isn't the model. It's the operating model around it — which is an ops problem wearing a technical costume.
>
> Bachelor's in Finance, MBA. Based in Argentina, working remote-first with US and European teams.
>
> Open to COO, VP/Head of Operations, or GM roles — full-time, full bandwidth.
>
> → What I actually build, in detail: triaperformance.com/ai-systems/

**Notes on what was cut from the previous version and why:**

- ~~"I think the next generation of operators will increasingly run a focused portfolio like this, and I see it as a strength, not a distraction."~~ **Deleted.** It was a defensive answer to an objection the reader hadn't raised yet, and defending against "is this a distraction" plants the doubt. The new draft makes Triaperformance the *proof*, not the side project — at which point no defence is needed.
- ~~The Spanish second half of the old bio (data-IC positioning, "full-remote excluyente", "Individual Contributor senior").~~ **Deleted.** It targets a different job (senior data IC) than the rest of the profile (COO), and a reader who scrolls that far finds two candidates. Keep one target per profile. *If a Spanish-language version is wanted later, it is a translation of the English above, not the old text.*
- The Mercado Libre mention in the old Spanish bio is not in the English track record above. Reconcile before publishing anything that lists both.

---

## 4. Triaperformance job description (2,000-char limit — this draft is ~1,960)

> Founded and run an endurance coaching business — and turned it into the environment where I build and operate production AI systems. I own the P&L and the infrastructure.
>
> **Operating result:** 71.6% operating margin, 93.4% net revenue retention on the coaching book, 40+ athletes, run solo alongside a full-time executive role. Every figure comes from a monthly close I built and run myself.
>
> **What I designed, shipped and operate — in production, not in a notebook:**
>
> • **Self-hosted AI stack on one Linux box.** Docker, Caddy, Postgres, n8n, a self-hosted CRM, and an always-on LLM agent reachable from Telegram, browser and desktop. Private mesh network only — no public exposure, no managed platform, guardrails designed rather than defaulted.
>
> • **Orchestrated content pipeline.** Research agent → writer → human approval gate → atomic git commit → build → live, in three languages, on cron. Measured at ~$0.20 per article in three languages. Agents propose; a human ships.
>
> • **Per-caller LLM cost observability.** Five services shared one API key, so the vendor could attribute spend to the key and never to the consumer. I built token-level accounting — prompt, output and *thinking* tokens stored separately, because thinking bills at the output rate and made every call read at a fraction of its true cost. It disproved the hypothesis I built it to confirm.
>
> • **Model selection as an operating decision.** Migrated two of four model consumers to a newer release and deliberately left two behind: the published benchmarks measured coding, and the two I kept were writing long-form prose in a brand voice. Wrong proxy, no move.
>
> • **Full customer lifecycle on owned systems** — lead capture, CRM, automated nurture, onboarding, retention, and a monthly close producing a roster, a P&L and a metrics file.
>
> **Stack:** Python · SQL/Postgres · n8n · Docker · Gemini API · GCP (BigQuery, Cloud Run) · Eleventy · Caddy · Git
>
> Detail: triaperformance.com/ai-systems/

**Figures corrected against the repo, September 4, 2026:**

- ~~"45+ active athletes"~~ → **40+ athletes.** `monthly-close/2026-08.md` gives 37 paying at 2026-08-31; `triaperformance-business-overview.md` notes five further coached and not paying (one internal, two comp, two barter), so a TrainingPeaks headcount reads 42. **"40+" is defensible against both files; "45+" is defensible against neither**, and this profile is selling data discipline.
- ~~"Grew revenue 670% in year two, and surpassed that full-year mark within the first seven months of year three."~~ **Removed, pending a source.** No file in this repo reproduces 670%. `training-plans-analysis.md` owns plan-sales history (507 transactions since Jan 2023, $20,897 gross, $14,334 earnings) and the close owns current revenue; neither produces that growth figure. *It may well be true off TrainingPeaks' own annual totals — but the standing rule is that any figure quoted anywhere is reproducible from a file, and this one currently isn't. Reinstate it the moment a file produces it; a 670% growth line is worth reinstating.*
- **Kept and now sourced:** 71.6% operating margin and 93.4% coaching NRR (`monthly-close/2026-08.md` §1), ~$0.20 per three-language article set (`ai-infrastructure-documentation.md` §20), the four-consumer model split (§33), the shared-key attribution gap and the thinking-token finding (§33 addendum, Aug 30).

---

## 5. The `/ai-systems/` showcase page

**Live at `site/ai-systems/index.njk` → `/ai-systems/`.** English, `noindex: true` (so it is out of `sitemap.xml` and emits no hreflang), `navVariant: "none"` and `footerVariant: "none"` — the audience is a founder or a recruiter and the triathlon menu is noise to them. `pageCss: ai-systems.css`. GA4 and Clarity ride along from `base.njk`, per the standing new-page rule.

**Sections:** hero → architecture (inline SVG, the page's one washed section per `brand-guidelines.md` §3) → six systems in production → four decisions → the P&L the systems hold up → stack → CTA.

**The design argument, in one line:** the page's strongest claim is that it is served by the box it describes. That sentence is in the hero and should not be cut.

**Standing decisions:**

- **No LinkedIn link on the page.** Every visitor arrives from LinkedIn; linking back is a loop. The CTA is email plus a link into the business itself.
- **`noindex` is deliberate and permanent.** A career page indexed on a coaching domain competes with the coaching pages for the domain's relevance signals, and Iván does not want a recruiter-facing page surfacing on a brand search for the business.
- **The four "decisions" are the load-bearing section, not the six systems.** Anyone can now generate a working script; the differentiator is the judgment about whether to run it. If the page is ever trimmed, trim the systems, not the decisions.
- **Every claim on the page traces to `ai-infrastructure-documentation.md` or the close.** No number appears there that does not appear in this repo.

**Open:** Iván adds the URL to the LinkedIn Featured section and to the two copy blocks above. Deploy is the normal cron pull/rsync.
