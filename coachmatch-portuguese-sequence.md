# CoachMatch Portuguese sequence — All-Access as the second offer

**Opened September 4, 2026. Iván's idea.** Home doc for the Portuguese CoachMatch lead sequence: the three email bodies, the WhatsApp first touch, and the n8n changes that route to them. **Owns no prices** (`triaperformance-pricing-and-positioning.md`) and **no Spanish copy** — the ES bodies stay where they are, in the two workflow JSONs.

## The decision, in one line

**A Brazilian CoachMatch lead is offered $149 coaching in Spanish or English, and All-Access at $29.99 as the product that is fully in Portuguese.** Language is the fork, not price.

**Why that framing and not "cheaper option":** email 1 spends its whole body arguing $149 is the complete service rather than a stripped tier, and undercutting that two paragraphs later works against the copy. Forking on language means the athlete self-selects on a constraint that has nothing to do with willingness to pay, so the $149 is never presented as negotiable.

## What changed to make this possible

- **Iván can coach a Brazilian at $149 — in Spanish or English, not Portuguese.** Many Brazilian athletes are comfortable in either. The email says so plainly rather than discovering it three messages in.
- **`Skip WhatsApp Outreach — BR/AR` is reversed for Brazil.** *(Iván, September 4, 2026.)* **The reason it existed was never recorded in this repo and is recorded here: Iván was not offering CoachMatch coaching to Portuguese-speaking athletes at all, to avoid the language barrier.** That is no longer the policy. **Argentina stays excluded** — it was skipped for a different reason and nothing here changes it.
- **All-Access is now worth selling in Portuguese**: 53 published plans, TrainingPeaks Premium, 13 members tools in PT, and written coach support.
- **TrainingPeaks is fine with it.** *(Iván confirmed with the CoachMatch team, September 4, 2026.)* Routing a CoachMatch lead into a 3.5% TP Payments product still delivers TrainingPeaks a Premium subscription and an active user. **Recorded because a future session will otherwise re-raise it as a commission risk.**

## Two standing constraints on the copy

**1. The checkout title cannot be changed and the email must absorb that.** The PT product is `"Acesso Total: Planos de Treino (Corrida + Ciclismo + Triatlo)"` — no mention of Premium, only three sports — and **it is not being renamed, because a live subscriber holds it** *(Iván, September 4, 2026)*. ⚠️ *Renaming would also break `'acesso total'` as the anchor string in **two** nodes of `subscription-lifecycle-automation.json` — `Map Language + Build Twenty Fields` and `Classify Product` — which is the August 13 incident that silently classified every new subscription as UNKNOWN. **Do not propose the rename again.***
**The consequence for the copy:** email and website call it **Triaperformance All-Access**, and every message that links to the checkout **names the old title in advance** so a lead does not hit an unfamiliar, narrower-sounding product at the moment of payment. One line, and it converts a mismatch into a reassurance.

**2. The three free guides are Spanish-only.** `pre-entreno.pdf`, `intervalos.pdf` and `zonas-de-entrenamiento.pdf` are the payload of Spanish email 3 — *and they are unusable to a Brazilian*. **So the PT sequence does not give them away**, which is the right outcome anyway: handing a free lead magnet to someone you are trying to sell a $29.99 product to works against the offer. **PT email 3 makes the All-Access ask instead.** *(The zones guide is being rebuilt and stops being Spanish-only — `open-loops.md`. Revisit only if the PT version ships and email 3 is underperforming.)*

---

## The sequence

| # | Day | Lead offer | Second offer |
|---|---|---|---|
| 1 | 0 | Coaching $149, in ES/EN | All-Access $29.99, named and linked |
| 2 | 1 | Coaching — why a coach beats a plan | one line, no link |
| 3 | 2 | — | All-Access, the whole email, checkout link |

**Email 2 deliberately does not re-sell All-Access.** It is the argument for coaching, and repeating a cheaper option in the middle of it is where cannibalisation would actually come from. One sentence at the end keeps the door open.

---

## Email 1 — day 0

**Node:** `Send an Email PT` in `coachmatch-lead-automation.json`, off the `Route by Language` Switch.
**Assunto:** `{{firstname}}, recebi o seu pedido na TrainingPeaks (próximos passos)`

🚨 ***Rebuilt September 5, 2026, and the reason matters more than the copy.*** *The first version of this email was translated from the Spanish body **in the repo copy of the workflow**, which was stale — the live Spanish email 1 had been rewritten and no longer contains the "$149 vs $229 vs $359 / esqueça essa limitação" pitch at all. It now opens with "antes de falar de planos, entender onde você está", adds the gym/strength bullet, and states the price with "não tem tempo mínimo de permanência".* **The repo copies of n8n workflows are documentation, not the live source — a translation made from one is a translation of the past.** *Iván caught it by reading the export. Standing consequence: before translating or quoting any n8n copy, get a fresh export.*

The current body is in `automation/coachmatch-lead-automation.json`, node `Send an Email PT`. It mirrors the live Spanish email exactly — same opening, same "good match" framing, same four bullets, same $149 and same no-commitment line — and adds two blocks after the price:

1. **The language condition.** The 1:1 happens in Spanish or English, not Portuguese; many Brazilian athletes are fine with either, and TrainingPeaks itself is in their language regardless.
2. **All-Access at $29.99** as the answer to the objection that condition creates — 53 PT plans, Premium, 13 tools, written support with the 1:1 boundary stated, checkout link, and the "Acesso Total" title named in advance.

**Coaching is still the lead offer and still the first price the lead sees.** A Brazilian happy to work in Spanish or English reads it as an ordinary $149 pitch with a footnote.

**Why the language paragraph sits after the $149 pitch, not before:** leading with "I don't coach in Portuguese" makes the whole email read as a disqualification. Placed after, it is a condition on an offer the lead already wants.

## Email 2 — day 1

**Node:** `Send an Email` in `coachmatch-email-nurture-2-3.json`, PT branch.
**Assunto:** `{{firstname}}, não procure um plano — procure um treinador`

```html
<p>Olá {{ firstname }},</p>

<p>Seguindo o meu email de ontem, queria te contar uma coisa que aprendi
treinando dezenas de atletas.</p>

<p>Um plano perfeito no papel não serve de nada se não se adapta à sua
realidade. Um PDF não sabe que você teve reunião até tarde, que dormiu mal,
ou que hoje acordou com mais energia do que o normal.</p>

<p>Por isso o que te ofereci ontem não é "subir treinos no TrainingPeaks". É
comunicação constante e feedback de verdade, sempre incluído, sem custo
extra:</p>

<ul>
  <li>Apareceu uma viagem de última hora? A gente ajusta o plano.</li>
  <li>Não entendeu uma sessão? Você me escreve e resolvemos.</li>
  <li>Precisa de um empurrão? Estarei ali.</li>
</ul>

<p>Se você ler as
<a href="https://maps.app.goo.gl/Dfw4166sxw3WGwA3A">avaliações no Google</a>,
vai ver que o que os meus atletas mais valorizam não são os números — é
exatamente isso: a adaptação à agenda deles e o check-in semanal.</p>

<p>Não quero te vender uma planilha. Quero fazer parte do seu processo.</p>

<p>Seguimos no <a href="https://wa.me/573105437088">WhatsApp</a> e vemos como
encaixar isso nos seus horários. (E se a questão for a língua, o All-Access
que te mencionei ontem continua de pé, todo em português.)</p>

<p>Abraço,<br>
Iván Koch — Head Coach, Triaperformance<br>
TrainingPeaks Partner Coach Level 2 · IRONMAN U Certified</p>
```

---

## Email 3 — day 2

**Node:** `Send an Email1` in `coachmatch-email-nurture-2-3.json`, PT branch.
**Assunto:** `{{firstname}}, e se o problema for a língua?`

*(Alternativa: `{{firstname}}, tudo em português por US$ 29,99`)*

```html
<p>Olá {{ firstname }},</p>

<p>Imagino que você esteja ocupado, ou que já tenha encontrado o treinador
que procurava. Sem problema nenhum.</p>

<p>Mas se o que te segurou foi eu ter dito que o acompanhamento 1:1 é em
espanhol ou inglês, então vale um último email — porque para isso eu tenho a
resposta certa.</p>

<p><strong>Triaperformance All-Access, US$ 29,99 por mês, inteiramente em
português.</strong></p>

<ul>
  <li><strong>Os 53 planos em português</strong>: 28 de corrida, 9 de
  ciclismo, 8 de triatlo, 4 de natação e 4 de duatlo. Troque de plano quantas
  vezes quiser, sem custo — terminou um bloco de 10k e quer partir para a
  meia, é só trocar.</li>
  <li><strong>TrainingPeaks Premium incluído.</strong> Sozinho custa
  US$ 19,95/mês, ou seja, mais de metade do preço da assinatura.</li>
  <li><strong>13 ferramentas na Área de Membros</strong>, todas em português
  e todas montadas na hora, no celular: as suas sete zonas nos três esportes,
  ativação e mobilidade que se adaptam ao seu dia, rotinas de carga
  progressiva para joelho, aquiles e ombro de nadador, core para quarto de
  hotel, configuração do Garmin campo a campo, e o guia de carga de treino
  (TSS, CTL, ATL e o PMC) explicado direito. Subo ferramentas novas quase
  toda semana.</li>
  <li><strong>Suporte meu por escrito, em português.</strong> Dúvida sobre
  uma ferramenta, sobre as suas zonas ou sobre qual plano escolher: me
  escreve que eu respondo.</li>
</ul>

<p>Comparado com o que você já ia gastar: só o TrainingPeaks Premium mensal
são US$ 19,95, e um plano avulso costuma sair entre US$ 40 e US$ 50. O
All-Access custa US$ 29,99 e inclui os dois, mais tudo o que está acima.</p>

<p><a href="https://checkout.trainingpeaks.com/product/938a0833-d337-4a9f-a33a-34199d662d4a"><strong>Assinar o All-Access — US$ 29,99/mês</strong></a><br>
<em>No checkout da TrainingPeaks o produto aparece como "Acesso Total:
Planos de Treino" — é este mesmo. Cancela quando quiser.</em></p>

<p>E se preferir retomar a conversa sobre o acompanhamento 1:1, estou aqui:
<a href="https://wa.me/573105437088">WhatsApp</a>.</p>

<p>Um abraço,<br>
Iván Koch — Head Coach, Triaperformance<br>
TrainingPeaks Partner Coach Level 2 · IRONMAN U Certified</p>
```

**Why this replaces the free guides rather than adding to them:** the three PDFs are Spanish-only, so they were never a gift to this audience. And this is the last message in the sequence — the lead is about to be auto-closed as `LOST_NO_RESPONSE`. A $29.99 ask is worth more here than a download.

---

## WhatsApp — first touch

**Node:** `Code in JavaScript4` in `coachmatch-lead-automation.json`, PT branch. Message is URL-encoded into the `wa.me` deep link exactly as the Spanish one is; Iván sends it from the Telegram ping.

```
Olá {{firstname}}! Aqui é o Iván, da Triaperformance — coach certificado e
partner da TrainingPeaks. Vi o seu pedido no Coach Match.

Me conta: qual é o seu objetivo e como você está treinando hoje?

(Só para já deixar claro: o acompanhamento 1:1 eu faço em espanhol ou
inglês. Se você preferir tudo em português, tenho o All-Access por US$ 29,99
— todos os planos, TrainingPeaks Premium e a área de membros. Te explico.)
```

*Kept to one message: the parenthetical exists so a lead who would otherwise not reply because of the language has a reason to.*

---

## The n8n changes

**Both workflows were rebuilt as complete JSON and handed over September 5, 2026** — paste-into-canvas replacements, not step-by-step edits, because the node count and rewiring made hand-editing the riskier option. Both import inactive with `versionId` stripped, credential references intact, and no orphan nodes.

### `coachmatch-lead-automation.json` — 19 nodes

- **`Route by Language`** — new Switch after `If`, on `preferred_language_enum`. `PT` → `Send an Email PT`, `ES` → the existing `Send an Email`, **`fallbackOutput: 1`** so English or empty routes Spanish rather than nowhere.
- **`Send an Email PT`** — feeds the *existing* `Code in JavaScript6`, so there remains exactly one path that writes `emailTouchCount: 1`.
- **`Skip WhatsApp Outreach — BR/AR` → `Skip WhatsApp Outreach — AR`.** Brazil condition removed; Argentina and the no-phone check kept. *Renamed so the name cannot outlive the rule.*
- **`Code in JavaScript4`** — WhatsApp first-touch message branches on language, empty-name guard preserved on both branches, Brazilian leads prefixed 🇧🇷 in the Telegram line.

### `coachmatch-email-nurture-2-3.json` — 13 nodes

- **`HTTP Request`** — the GraphQL selection set now fetches `preferredLanguage`. ⚠️ *This had to come first: the Switch had nothing to read until it existed, and the field had been written to Twenty since July while nothing read it.*
- **`Code in JavaScript`** — carries `preferredLanguage` through to the loop.
- **`Switch`** — two outputs became four: `Email 2 ES` / `Email 2 PT` / `Email 3 ES` / `Email 3 PT`. **The ES branches test `≠ PORTUGUESE`, not `= SPANISH`**, so an English or null lead still gets a sequence instead of dropping out.
- **`Send an Email PT`** and **`Send an Email1 PT`** feed the existing increment nodes. **No duplicate increment path** — a second one is how a lead skips an email.

### `automation/twenty_followup_check.py` — done September 5, 2026

`NO_WHATSAPP_COUNTRIES` is now `{"argentina"}`; `MESSAGE_TEMPLATES` is keyed by language with Portuguese nudges 2 and 3; the GraphQL query fetches `preferredLanguage`; `build_whatsapp_link()` takes a language and **falls back to Spanish on anything not explicitly Portuguese**, so a null value produces a message rather than a `KeyError`. Portuguese leads are prefixed 🇧🇷 in the digest. *The Portuguese message 3 swaps the Spanish version's "web with coaching plans" line for the All-Access checkout link — the last WhatsApp touch and the last email now make the same ask.* **Reaches the box on the dispatcher's next `git pull`, so it needs Iván's commit and push.**

### Testing — what a manual single-item test cannot catch

**Set the execution mode explicitly on every Code node touched** (`runOnceForEachItem` vs `runOnceForAllItems`). *Confirmed live July 31, 2026: an IMAP poll delivering two leads at once caused follow-up nodes to update only the first, with no error thrown.* **Replay a real multi-item execution containing one Brazilian and one Spanish-speaking lead** — a single-item test in the n8n UI cannot see this class of bug, and this change adds branches on exactly the field that distinguishes them.

⚠️ **Sequence-straddling:** Portuguese email 2 opens with *"seguindo o meu email de ontem"*, which is only true if email 1 was also Portuguese. **Activate the lead workflow first**, or make sure no lead is mid-sequence when the nurture workflow flips.

## Measurement

**The question is whether Brazilian CoachMatch leads convert to anything at all.** Before or alongside the first send, get the baseline out of Twenty: how many Brazilian CoachMatch leads all-time, and how many reached `WON_CUSTOMER`. If it is zero, there is no cannibalisation risk to reason about — a sale that does not happen cannot be displaced. If it is not zero, the trade matters: **All-Access PT nets $19.94/month against ~$119.20 for a $149 CoachMatch athlete, six to one**, and the language framing is the only thing keeping the cheaper offer from taking sales the expensive one would have made.

Read it at the monthly closes, not by watching for the first signup. Record the outcome in `monthly-close/YYYY-MM.md`.
