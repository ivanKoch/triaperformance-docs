# Blend360 — Manager of Systems & Automation (Montevideo, hybrid)

**Assessment and interview drill.** Written September 9, 2026. Figures cited are the ones verified against `data/revenue_history.csv`, `monthly-close/2026-08.md` and `exercise-library-decisions.md` earlier this session.

---

## 1. The read

### What this role actually is

Strip the title. This is **internal BizTech / business systems** at a consultancy: sit between the business functions and the IT team, find friction, write requirements, follow delivery through to adoption. It is the internal-enablement function, and at an AI services firm it is the function that makes the company run — not the one that bills.

Three structural facts the JD gives away:

- **No P&L.** Not mentioned once.
- **No team.** Not one line about direct reports, hiring, or managing people. "Manager" here is a **band**, not a management job.
- **You do not build.** *"Translate business needs into scoped, actionable requirements the IT team can execute against."* IT builds. You spec, prioritise, and validate.

### The problem that matters more than seniority

⚠️ **This is a requirements-writing job, and "I stopped writing requirements for someone else to build" is the literal centre of your positioning.**

Your About section says it in those words. Your best interview story — the exercise library — is about *building the thing and discovering something only building reveals*. The observability story is about *instrumenting something you own*. Every asset you spent last week sharpening argues that you're past the spec-and-wait seat.

That is not a reason to skip the interview. It **is** the thing to test in the first fifteen minutes, because it decides whether this is a step sideways or a step back. There's a real chance the role is under-scoped rather than junior — see below — but you find that out by asking, not by hoping.

### Three more practical flags

| Flag | Why it matters | What to do |
|---|---|---|
| **Montevideo, hybrid** | You're in Posadas. That's not a commute, it's a relocation. | Ask on call one. If hybrid is firm, this is likely dead regardless of fit — don't invest four rounds finding out. |
| **Comp** | Manager band, Uruguay, consultancy. Probably below your $7,600 COO number, possibly well below. | Ask for the band early. You're practising, not desperate. |
| **Title mismatch in their own JD** | Posted as *Manager of Systems & Automation*; the body opens *"The Manager of Operations bridges…"*. | A copy-paste artifact means the role is **newly scoped and not settled**. That's your opening — an unsettled role can be shaped upward by the person who describes it better than they did. |

### Where you're genuinely strong

You clear or exceed almost every required line:

- *7+ years sitting between business users and a technical team* — Chief of Staff / Head of Data at OneLocal, regional PMO at Uber Eats. Direct hit.
- *Functional fluency in two+ domains* — Finance, Operations, Sales, Client Management. You're over the bar, not at it.
- *Working knowledge of integration concepts and automation tools* — you run n8n in production, self-hosted, with real failure modes you can name.
- *Proficient with AI tools as a daily driver; prompt engineering, agentic workflows* — this is the line most candidates will bluff. You can produce artifacts.
- *n8n / APIs / integrations* (preferred) — you're above a preferred qualification, which is where offers get made.
- *Matrixed organisation, multiple geographies* — Beat: Argentina P&L, then Colombia HQ plus four satellite cities.

**The one required box you don't tick: professional services / consulting firm experience.** You're operator-side, always in-house. Prepare for it rather than hoping it doesn't come up — see §3.

### The thing to notice about Blend specifically

**They sell AI services. You'd be running AI internally at a company whose entire external product is AI.**

Cuts both ways, and you should say so out loud in the interview:

- **For you:** your evidence gets evaluated properly. At most companies "I built a self-hosted agent stack with per-caller token accounting" is noise. Here, someone in the room knows exactly how hard the observability piece is and that almost nobody does it.
- **Against you:** they'll probe deeper than a normal ops interview, and internal enablement at a consultancy is chronically under-resourced next to the billable practice. Ask what budget and IT capacity this function actually commands.

### Verdict

**Take the call. Go in testing two things, not selling.**

1. Is this a build seat or a spec seat? *("Would I be shipping automations myself, or writing requirements for IT to ship?")*
2. Is hybrid-Montevideo firm?

If it's a spec seat **and** hybrid is firm, decline politely after round one and keep the relationship — Blend hires at Director level too, and the person who interviewed well for the wrong role is who they call for the right one.

If the role is unsettled and they're open, **this is one you can shape upward**: propose the version of the job where you build the first version of anything before speccing it. That's a better job than the one they posted and you're one of very few people who could do it.

---

## 2. The AI answers — drill these

The JD names the AI competencies precisely. Five questions follow from it almost mechanically.

### Q1. "How do you use AI in your day-to-day work?"

*The screening question. Most candidates answer "I use ChatGPT for drafting." Do not be most candidates — but do not open with the stack either.*

> Three levels, and the third is the one that took me longest to get right.
>
> Level one is what everyone does — drafting, research, summarising. That's table stakes and it's not interesting.
>
> Level two is building with it. I write production Python and SQL with AI assistance every day. That changed what I can do alone: I run a self-hosted stack — an LLM agent, a workflow engine, a CRM, a Postgres database and a public website, all containers I deploy and maintain — and a year ago I'd have needed to hire someone for that.
>
> Level three is where I think most organisations are still weak, and it's operating AI in production rather than using it. That means knowing what it costs per caller, having a gate that catches it when it's wrong, and knowing which processes are agent-shaped in the first place. That third one is where I'd spend my time in a role like this, because level one and two spread on their own — people find those. Level three doesn't happen unless somebody owns it.

**Then stop.** Let them pick which level to go deeper on.

### Q2. "Tell me about an agentic workflow you've built."

*Named explicitly in the requirements. Lead with the gate, not the agents — the gate is what makes it sound operated rather than played with.*

> I run a content pipeline with three agents on cron. A research agent proposes topics, a writer drafts against a brand voice, a translator produces two more languages. It commits to git, builds, and publishes.
>
> The design decision that matters is the human approval gate in the middle. Agents propose; a person ships. That's what makes a bad draft cost a rejection instead of a published article — and it's why I could afford to run it unattended at all.
>
> Two things I'd carry over. First: the output contract broke before the model did. My first version asked for HTML inside a JSON string and it died on an unescaped quote nine thousand characters in. Same shape of bug as a delimiter-joined string parsed by a layer that also splits on that delimiter — the failure was never the model's reasoning, it was the interface I gave it.
>
> Second: the agent did exactly what I told it and was wrong anyway. My translator localised the race in an article — a Valencia marathon became a US one for English readers — because the market notes told it to adapt for the local market. Defensible on its face, wrong twice: it trades high-intent low-competition search traffic for a keyword every domestic coach contests, and it breaks the page's own "same content, translated" declaration.
>
> That's the failure mode I watch for now. Output that looks correct and is structurally wrong is the one that survives review, and the fix is a rule in the contract, not a better prompt.

### Q3. "How do you decide where AI adds the most value?"

*Their words: "identifying where AI augmentation adds the most value." This is a selection question, and selection is an ops skill.*

> I use three filters, in order.
>
> **Is it bounded?** A task with a defined input and a defined output. If a human can't say what "done" looks like, an agent can't either — it'll produce something plausible and you won't know.
>
> **Is there a cheap check?** Not "is it high volume" — is being wrong cheap to catch. My content pipeline qualifies because a bad draft costs me a rejection. Anything that touches money, a customer commitment, or a compliance record fails this filter until the check exists, and building the check is then the actual project.
>
> **Does it recur enough to earn the maintenance?** Every automation is a thing someone now maintains forever. My own test is: does this take my time once to build something durable, or does it take my time forever?
>
> The failure I'd watch for in an organisation like yours is the second filter. Plenty of processes are bounded and high-volume, which makes them look automatable, and quietly produce plausible wrong answers at scale because nobody built the check. That's not a model problem, it's a selection problem, and it's the expensive one.

### Q4. "How do you evaluate whether AI output is good?" *(or: "when has AI given you a wrong answer?")*

*The JD says "able to critically evaluate outputs and iterate effectively." Use the exercise-library story — it's your best and it's honest about your own mistake.*

> Two answers, because they're different problems.
>
> On a single output, I check whether it's testing what I think it's testing. I have a standing example: I had a checker that validated my published product links, and it filtered on the same flag it was supposed to be verifying — so it structurally could not find the failures it existed to catch. Same shape as asking a model to grade its own work. Before trusting any check, I ask what it would look like if the thing were wrong in the other direction. If the answer is "identical," it isn't a check.
>
> The bigger one is what AI does to your judgment over time, and I have a fresh mistake for that.
>
> I built nine tools for my members area over about a month, each with exercises in it — name, coaching cue, sets and reps — written inline as I wrote the tool. Then I wanted to film demo videos and needed a list of what to film. There was no list. Extracting one showed 188 real exercises stored as 759 copies across three languages, one movement carrying up to four different names. Editing a single cue correctly meant editing eighteen places across fifteen files.
>
> The interesting part isn't the mess, it's why I didn't see it coming. Duplication normally hurts — the second time you build something it's annoying enough that you stop and factor it out. With AI assistance each tool cost me an afternoon, so it never got annoying. **The friction that used to force the design decision was gone.**
>
> That's the lesson I'd bring here: when building an instance gets cheap, the missing abstraction stops announcing itself. You have to replace that signal with a deliberate checkpoint, because nothing in the work will supply it any more. And the fix wasn't the cleanup — I did that in a day. The fix is a lookup step in the authoring process, because a canonical library nothing is obliged to consult is just a suggestion.

*🔑 Land the last sentence slowly. It's the most senior thing you say in the whole interview, and it maps directly onto their "drive adoption of existing capabilities before adding new tools."*

### Q5. "How do you tell a process problem from a technology problem?"

*Straight from the JD. This one you answer with data, not philosophy.*

> By looking, before recommending anything — and I got this wrong on my own business until the data existed.
>
> My pricing document spent most of its length arguing $149 versus $99. Once my pipeline could produce a loss-reason breakdown, I pulled 182 lost leads. **Price accounted for under 7% of losses. No response accounted for 71%.**
>
> I'd been optimising the objection I could hear instead of the one I couldn't. And an unvoiced objection can't be answered — but a response rate can be worked. On top of that, the channels that cost me zero commission convert five to seven times better than the one taking 20%, they just produce almost no volume. That's a distribution problem, not a pricing problem, and no amount of tooling would have surfaced it.
>
> So my honest answer is that most of the time you can't tell the two apart by reasoning about it. You need one number that discriminates between them, and getting that number is usually a smaller job than the solution either side would have led you to build.

---

## 3. The two questions you'll be least ready for

### "You've never worked in professional services. Why would you be effective here?"

*Don't argue the premise. Name what transfers and what doesn't — that's what a senior candidate does.*

> That's fair and I'd rather be straight about it. What I don't have is the reflex for utilisation, bench management, and the rhythm of a firm where the same people are a cost line and a revenue line at once. I'd need a quarter to be useful about that.
>
> What transfers is the specific thing this role is: I've spent my career as the person between business teams and a technical team, and I've been on both sides of it. At OneLocal I was Chief of Staff and Head of Data — the translation seat. At Uber Eats I was in the regional PMO, which is the same job with more stakeholders and less authority. And for the last two years I've been the technical team, which changed how I write requirements more than anything else has: I've been on the receiving end of my own vague spec.
>
> The domain I'd have to learn. The position between the two groups is the one I've held for ten years.

### "This is a Manager role. You've been a Director and a COO. Why this?"

*Answer honestly. A rehearsed non-answer here reads as desperation and kills more offers than the title gap does.*

> I'll be direct, because you'd wonder otherwise. The title is a step down from where I've been, and it's not what I'm looking for on its own.
>
> What interests me is the scope, and I want to test whether the scope matches the title. A function that sits across Finance, People, Operations, Legal, Sales and Delivery, sets the automation backlog, and owns whether the technology actually gets adopted — at a firm whose product is AI — that's a bigger job than the band suggests, and it's the job I've been doing informally for two years.
>
> So the honest version is: I'm interested if this role is being built rather than filled. If it's a defined seat writing requirements for a defined IT backlog, I'd be underusing what I bring and you'd be paying for capability you don't need. That's a real question for me and I'd rather ask it now than in round four.

---

## 4. Ask them these

Pick three or four. Every one is diagnostic, not decorative.

1. **"Would I be shipping automations myself, or writing requirements for IT to ship them?"** *The single most important answer in the conversation.*
2. **"Who does this role report to, and does it have direct reports or a budget?"** *Establishes the real band. They left it out of the JD.*
3. **"Is hybrid in Montevideo firm, or is there flex for someone in the region?"** *Ask on call one. Don't burn four rounds.*
4. **"How much IT capacity does internal enablement actually get, against the client-facing practice?"** *The chronic failure mode of internal functions at consultancies. Asking it signals you've run one.*
5. **"When something an agent produces internally is wrong today, who catches it and how long does that take?"** *Reveals their actual maturity, and it's the question almost nobody asks.*
6. **"What's the first thing you'd want fixed in the first ninety days?"** *If they can't answer, the role isn't scoped — which is either your opportunity or your warning.*
