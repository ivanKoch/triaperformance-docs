# Interview narrative — "what have you built?"

**Four nested versions: 60 seconds, 2 minutes, 5 minutes, 10 minutes.** Each one contains the one before it, so you never have to switch scripts mid-answer — you just stop at the right depth or keep going when they lean in.

*Written September 9, 2026. Every figure verified against `data/revenue_history.csv` and `monthly-close/2026-08.md` the same day.*

**The one rule underneath all four:** every version ends on what it means for *them*, not on the tech. The tech is the evidence, not the point. If you finish on "…and it runs on Docker," you've given a demo. If you finish on "…which is the same problem you have with X," you've given an interview answer.

---

## 60 SECONDS — the elevator

> I run a coaching business I founded, and over the last two years I turned it into the place where I build and operate production AI systems myself.
>
> Concretely: a self-hosted stack on one Linux box — an always-on LLM agent, a workflow engine, a CRM, a Postgres database and the public website, all containers I deploy and maintain. Content agents run on cron behind a human approval gate. And I built per-caller cost accounting for the model calls, because five services shared one API key and the vendor could only ever tell me what the *key* spent, never which service spent it.
>
> The result is a business that grew 673% in year two, passed that full-year number in five months of year three, and today runs at a 71.6% operating margin with 93.4% retention — with one person and no ops hire.
>
> I'm not an engineer who learned operations. I'm an operator who got tired of writing requirements and waiting, and went and built it.

**Timing:** ~55 seconds at a normal pace. Do not rush it. The last line is the whole pitch — pause before it.

---

## 2 MINUTES — add the architecture and the operating result

Everything above, then:

> Let me give you the shape of it.
>
> One VPS. Six services in Docker: the LLM agent, n8n for workflows, a self-hosted CRM as the system of record, Postgres, the static site build, and Caddy in front. The control plane is on a private mesh network — nothing exposed to the open internet, and that was a design decision, not a default. The managed version of the agent product would have been faster to stand up and would have blocked everything I later needed to run on the same box.
>
> On top of that, three things run unattended:
>
> **One** — the lead pipeline. Inbound lead lands in the CRM, gets an automated nurture sequence, and I can update a lead's status by sending a plain-language message to a chat bot, which resolves it and writes back to the CRM.
>
> **Two** — a content engine. A research agent proposes topics, a writer drafts, I approve, and an approved draft becomes an atomic commit, a build and a live page in three languages. Measured cost: about twenty cents for a full Spanish–English–Portuguese set.
>
> **Three** — a monthly close. Roster, P&L and metrics, from files. Every number about the business is reproducible.
>
> And that last one is what actually pays. The first close told me my total operating cost — every server, subscription, certification, the LLC — was a fraction of what my sales channel takes in commission. Not close. The channel costs more than three times what running the entire business costs. That single number reordered my roadmap, and I only had it because I'd built the pipeline to produce it.

**Timing:** ~2 minutes total including the 60-second opener.

**Why this order:** infrastructure → what runs on it → the decision it changed. Never stop at the second beat. The third is the one that says "operator" instead of "hobbyist."

---

## 5 MINUTES — add two stories

Everything above, then pick **two** of these three. Do not tell all three; you'll sound like you're reciting.

### Story A — the instrumentation that disproved its own hypothesis

*Use this when the role is heavy on AI cost, platform or FinOps.*

> Here's the one I'd want to be asked about.
>
> I had five services calling the same model provider on one API key. The dashboard could tell me what each *model* spent. It could never tell me which *service* spent it — that gap is structural, not an export-format problem. And my usage chart had a spike once or twice a week that I couldn't attribute.
>
> The obvious suspect was the research agent, because it was the only weekly job. So I built token-level logging — one row per call, tagged with the caller.
>
> It was wrong twice. The research agent turned out to be the *cheapest* consumer on the box. And the heaviest day wasn't a Monday, it was a Saturday — driven by translation, because a batch limit I'd set was counted in articles, and each article costs two model calls. I'd capped the wrong unit.
>
> Two things I'd carry into any team. First: I stored *thinking* tokens in their own column, separate from input and output. On current models input plus output doesn't equal total, and the gap bills at the output rate — a one-word test probe logged seven input, one output, and a hundred and eight thinking tokens. A conventional in/out table would have understated that call by a factor of thirteen. Anyone reporting AI spend off an in/out split right now is reporting a number that's roughly half real.
>
> Second: instrumentation must not be able to kill the thing it measures. My logger catches `SystemExit` explicitly, not just `Exception`, because a missing database password would otherwise have silently killed the writer mid-article. Monitoring that can take down production is worse than no monitoring.

### Story B — the model migration I only half-did

*Use this when the role is about AI adoption, governance, or judgment.*

> A stronger, cheaper model shipped, and the obvious move was to migrate everything to it. I had four consumers on the old one. I moved two and deliberately left two.
>
> The reason is that every benchmark published for the new model measured coding, agentic reasoning and multimodal tasks. Two of my four consumers were writing long-form prose in a specific brand voice — which none of those benchmarks measure. Moving them on that evidence would have been substituting a proxy for the thing I actually cared about.
>
> And I want to be honest about the stakes, because they're small: at twenty cents an article set, the entire annual saving from moving the other two would have been less than one month of the server. So cost wasn't the argument either way. The right call was to settle it by comparison — draft the same piece on both and read the Spanish — and the approval gate is what makes that cheap. A bad draft costs me a rejection, not a published article.
>
> That's the pattern I'd bring to an AI rollout. Most of the failures I see aren't the model. They're someone adopting a tool on a benchmark that doesn't measure their use case, with no gate to catch it when it's wrong.

### Story C — the funnel finding

*Use this when the role is commercial, revenue-ops, or GTM-adjacent. This is your most "pure ops" story.*

> One more, because it's the least technical and probably the most useful.
>
> My pricing document spent most of its length arguing $149 versus $99. Once the pipeline could produce a loss-reason breakdown, I looked at 182 lost leads. Price accounted for under 7%. No response accounted for 71%.
>
> I'd been optimising the objection I could hear instead of the one I couldn't. An unvoiced objection can't be answered — but a response rate can be worked. And the channels that cost me zero commission convert five to seven times better than the one that takes 20%, they just produce almost no volume. That's a distribution problem, not a pricing problem, and I had it backwards until the data existed.

**Bridge — say this before you stop, whichever two you told:**

> The reason I tell those instead of listing the stack is that the stack isn't the differentiator any more. Anyone can generate a working script now. What's scarce is the judgment about whether to run it — and that's an operations skill, not an engineering one.

---

## 10 MINUTES — the full walkthrough

Everything above, then three more moves. This is the version for a founder or a hiring COO who's actually engaged. **Do not deliver this unprompted** — go here only when they're asking follow-ups.

### 1. The honest limit (say it before they find it)

> I should name the limit in this, because you'd find it anyway.
>
> Everything I've described is single-operator. I designed it, I built it, I'm the only user and the only one on call. What I have *not* done is roll AI out across a team — the governance, the adoption curve, the person who quietly doesn't use it, the one who uses it wrong and ships something broken.
>
> I've done that half with humans. At ClickGuard I led the operational and cultural turnaround that took the business from EBITDA loss to profitability in six months. At Beat I ran Argentina's P&L and then the whole Colombia operation, headquarters plus four satellite cities. So I know what it costs to change how a group of people work.
>
> What I'm offering is the intersection — someone who can own the P&L, redesign the operating model around agents, and build the first version himself instead of waiting for a roadmap slot. Not a claim to have done both at once at scale.

**Why this wins:** naming your own gap before they probe it converts a weakness into a credibility signal, and it puts the ClickGuard and Beat results into the conversation without you having to force them in.

### 2. The recurring failure mode (your most senior-sounding answer)

*Use this if they ask "what's been the hardest part" or "what would you do differently."*

> The bug I keep hitting isn't a bug. It's the same shape four separate times: **the copy of a thing in version control is not the copy the runtime actually reads.**
>
> A config edited in the right file and loaded from a different one. A deploy script that updates itself mid-run, so it's still executing the old copy. An environment variable defined twice, with the same value — silent today, a last-writer-wins bug the day those two values differ.
>
> The fix wasn't better code. Every server-side script now lives in version control and is pulled at invocation, and the file at the fixed path is reduced to a six-line dispatcher. That's an operating-model change, not an engineering one.
>
> And I think that's the category most AI-adjacent failures actually fall into. People look for a technical fix to what is really a question of where the source of truth lives and who's allowed to write to it.

### 3. The bridge to their business

*Have this ready and specific. Adapt the middle paragraph to the company before you walk in.*

> The reason any of this matters to you rather than being a nice hobby: I've been running the exact experiment your business is about to run, at a scale where I could afford to get it wrong.
>
> What I'd want to understand in the first month here is which of your processes are actually agent-shaped — bounded, high-volume, with a cheap way to check the output — versus the ones that just *sound* automatable and would quietly produce plausible wrong answers at scale. That's the selection problem, and getting it wrong is the expensive mistake, not the tooling.
>
> Then I'd want to know what you can currently measure about it. In my experience you can't govern spend or quality on AI work you can't attribute, and almost nobody can attribute it on day one — the tooling defaults don't give it to you.

**Then stop and ask them a question.** Ten minutes is the limit before a monologue becomes a red flag. Good ones:

- "Where are you today — is this a first deployment, or is there something running that isn't behaving?"
- "Who owns AI spend right now, and can they tell you what any single team is costing?"
- "When something an agent produces is wrong, who catches it, and how long does that take?"

---

## Numbers you can say out loud

*All verified September 9, 2026. If you're not sure of one, don't say it — the profile is selling data discipline, and a figure you can't defend costs more than a figure you didn't mention.*

| Figure | Value | Source |
|---|---|---|
| Year-two growth | **+673%** ($1,350 → $10,440) | `data/revenue_history.csv` |
| Year-three growth | **+255%** ($10,440 → $37,070) | same |
| Year three passed year two's full year in | **5 months** | same |
| 2026 Jan–Aug | **$32,542** — 88% of all of 2025 | same |
| All-time revenue | **$84,240** | same |
| Operating margin (Aug 2026) | **71.6%** | `monthly-close/2026-08.md` |
| Net revenue retention, coaching | **93.4%** | same |
| Athletes | **37 paying, 42 coached** — say "about 40" | same |
| Total monthly operating cost | **$245** — vs $819 in channel commission | same |
| Cost per article, three languages | **~$0.20** | infra doc §20 |
| Lost leads: price vs no response | **6.6% vs 70.9%** | close #1 §2 |
| Catalogue | **328 plans, 3 languages** | `data/training_plans_inventory.csv` |

**Two you should not say:** "45+ athletes" (it's 37 paying / 42 coached) and any figure about the members area's usage (two of 33 athletes have ever logged in — true, honest, and not a story you volunteer in an interview).

---

## Four questions they will ask back

**"Isn't this just a side project?"**
> It's a business that's produced $84,000 and grown every year, and it's the only environment I've had where I own the P&L *and* the infrastructure, so nothing is theoretical. It also runs at 71.6% margin on about 28 hours of coaching a month — it was built specifically so it doesn't need my calendar. That was the design goal, and it's why I have the bandwidth for a full-time seat.

**"How much of this did you actually build versus AI writing it for you?"**
> I use AI heavily to write code — that's the whole point, and pretending otherwise would be strange in this conversation. What isn't generated is the part that matters: what to build, what not to build, where the failure modes are, and whether the thing that runs is the thing I have in version control. The stories I told you are all about the second category, because that's the part that's still scarce.

**"You're not an engineer. What can't you do?"**
> I'm not going to architect a distributed system or take a 3am page for a service I didn't write. What I can do is design and run the operating model around one, build the first working version myself, instrument it so it can be governed, and speak to engineers at the level of the trade-off instead of the tool name. If the role needs a CTO, I'm the wrong candidate. If it needs someone who stops the org from buying nine tools that don't talk to each other, that's me.

**"Why leave it, if it's working?"**
> I'm not leaving it — it runs at about eight hours a week and it was built to. What I want is the scale. Everything I've described I've done for one operator and forty customers. I want to do it for an organisation, with a team and a P&L that matters, which is what I was doing before and what I'm best at.

---

## Delivery notes

- **Lead with the business result, not the stack.** "673% and 71.6% margin" earns you the right to talk about Docker. The reverse doesn't.
- **Say "I built" and "I decided," not "we."** You're describing solo work; "we" reads as hedging and they will ask who else.
- **Numbers slowly, one at a time.** Three numbers delivered clearly beat eight delivered fast — and eight sounds rehearsed.
- **The strongest single sentence you have:** *"I built the instrumentation to confirm a hypothesis and it disproved it."* Almost nobody says that in an interview. Use it.
- **Have the page open in a tab** — `triaperformance.com/ai-systems/`. If it's a video call and they ask to see something, share it rather than describing it. It's served by the box it describes, and that's worth saying out loud.
