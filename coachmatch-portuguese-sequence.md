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

**Node:** `Send an Email` in `coachmatch-lead-automation.json`, PT branch.
**Assunto:** `{{firstname}}, sobre o seu pedido (e o preço, sem rodeios)`

```html
<p>Olá {{ firstname }},</p>

<p>Sou o Iván, Head Coach da Triaperformance e coach certificado pela
TrainingPeaks. Recebi o seu pedido no Coach Match e li pessoalmente.</p>

<p>Vou direto ao preço, porque sei que é a primeira coisa que se olha.</p>

<p>Na TrainingPeaks você viu várias opções: US$ 149, US$ 229 e US$ 359. A de
US$ 149 provavelmente aparecia como a versão reduzida — uma chamada por mês,
um email e pouco mais. Faz sentido que não tenha convencido.</p>

<p>Esqueça essa limitação. Comigo, US$ 149 não é o plano de entrada
recortado: é o serviço completo. Por esses mesmos US$ 149 por mês você tem
plano 100% personalizado e ajustado à sua vida real, ajustes sempre que
precisar, análise das suas sessões quando pedir, e comunicação direta comigo
no WhatsApp durante toda a semana.</p>

<p><strong>Uma coisa que prefiro dizer agora e não depois:</strong> o
acompanhamento 1:1 eu faço em espanhol ou em inglês. Não em português. Boa
parte dos atletas brasileiros que treino se vira muito bem em qualquer um
dos dois — e o TrainingPeaks, os treinos e os números você lê na sua língua
de qualquer forma. Se for o seu caso, seguimos.</p>

<p><strong>E se você preferir tudo em português, tenho a alternativa
certa.</strong></p>

<p>Chama-se <strong>Triaperformance All-Access</strong>, custa
<strong>US$ 29,99 por mês</strong>, e é o produto que está inteiramente em
português:</p>

<ul>
  <li>Os <strong>53 planos de treino em português</strong> — corrida,
  ciclismo, triatlo, natação e duatlo — e você troca de plano quantas vezes
  quiser, sem custo.</li>
  <li><strong>TrainingPeaks Premium incluído</strong> (US$ 19,95/mês por
  fora).</li>
  <li>A <strong>Área de Membros</strong>: 13 ferramentas em português que se
  montam sozinhas — calculadora das suas zonas, ativação e mobilidade,
  rotinas para joelho, aquiles e ombro, como configurar o Garmin, o guia de
  carga de treino.</li>
  <li><strong>Suporte meu por escrito</strong>, em português: dúvida sobre
  uma ferramenta, sobre as suas zonas ou sobre qual plano escolher, você me
  escreve e eu respondo. Não inclui revisão dos seus treinos nem ajuste
  semanal do plano — isso é o 1:1.</li>
</ul>

<p>Assinar leva um minuto:
<a href="https://checkout.trainingpeaks.com/product/938a0833-d337-4a9f-a33a-34199d662d4a">Assinar o All-Access — US$ 29,99/mês</a><br>
<em>No checkout da TrainingPeaks o produto aparece como "Acesso Total:
Planos de Treino" — é este mesmo.</em></p>

<p>Qualquer um dos dois caminhos, o mais rápido é conversarmos:
<a href="https://wa.me/573105437088">WhatsApp</a>. Me conte o seu objetivo e
vemos qual faz sentido para você.</p>

<p>Enquanto isso, o que dizem outros atletas:</p>

<ul>
  <li>Avaliações no Google:
  <a href="https://maps.app.goo.gl/Dfw4166sxw3WGwA3A">Link</a></li>
  <li>Instagram
  <a href="https://www.instagram.com/triaperformance/">@Triaperformance</a></li>
</ul>

<p>Até breve,<br>
Iván Koch — Head Coach, Triaperformance<br>
TrainingPeaks Partner Coach Level 2 · IRONMAN U Certified</p>
```

**Why the language paragraph sits where it does:** after the $149 pitch, not before. Leading with "I don't speak Portuguese" makes the whole email read as a disqualification. Placed after, it is a condition on an offer the lead already wants.

---

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

**Neither workflow branches on language today, and both already have the value.** `coachmatch-lead-automation.json` computes `preferred_language = country === 'brazil' ? 'Portuguese' : 'Spanish'` in `Code in JavaScript1` and writes `PORTUGUESE` to Twenty — then sends a hardcoded Spanish email. *A field being set is not a field being read.*

### 1. `coachmatch-lead-automation.json` — email 1

- Insert a **Switch** node between `HTTP Request2` and `Send an Email`, on
  `={{ $('Code in JavaScript1').item.json.preferred_language_enum }}`
  → outputs `PORTUGUESE` and `SPANISH` (fallback output → Spanish).
- Duplicate `Send an Email` as **`Send an Email PT`** with the subject and HTML above.
- Existing `Send an Email` stays untouched on the Spanish output.

### 2. `coachmatch-lead-automation.json` — WhatsApp first touch

- **`Skip WhatsApp Outreach — BR/AR`:** delete the `brazil` condition, keep `argentina` and keep the no-phone condition. **Rename the node `Skip WhatsApp Outreach — AR`** so the name does not outlive the rule.
- **`Code in JavaScript4`:** branch the `message` constant on `lead.preferred_language_enum === 'PORTUGUESE'`. Node is already `runOnceForEachItem` — leave it that way.
- **`automation/twenty_followup_check.py`:** `NO_WHATSAPP_COUNTRIES` drops `brazil` and `brasil`, keeps `argentina`. *Repo edit, reaches the box on the dispatcher's next `git pull`.* ⚠️ *The follow-up nudge copy in that script is Spanish and will now go to Brazilian leads — it needs a PT variant in the same pass, or the fix produces Spanish WhatsApp nudges to exactly the athletes this whole change exists to reach in Portuguese.*

### 3. `coachmatch-email-nurture-2-3.json` — emails 2 and 3

⚠️ **The GraphQL query does not fetch `preferredLanguage`, so there is nothing to branch on yet.** First change is in `HTTP Request`: add `preferredLanguage` to the `node { … }` selection set. Then carry it through the `Code in JavaScript` node's `results.push({ json: { … } })`.

- The **`Switch`** currently has two outputs on `emailTouchCount` (1 → email 2, 2 → email 3). It becomes **four**: `1+SPANISH`, `1+PORTUGUESE`, `2+SPANISH`, `2+PORTUGUESE`.
- Two new email nodes: **`Send an Email PT`** (email 2) and **`Send an Email1 PT`** (email 3).
- Both new nodes wire into the same `Code in JavaScript1` / `Code in JavaScript2` touch-count increments as their Spanish counterparts. **Do not duplicate the increment nodes** — a second increment path is how a lead skips an email.

### Testing — what a manual single-item test cannot catch

**Set the execution mode explicitly on every Code node touched** (`runOnceForEachItem` vs `runOnceForAllItems`). *Confirmed live July 31, 2026: an IMAP poll delivering two leads at once caused follow-up nodes to update only the first, with no error thrown.* **Replay a real multi-item execution containing one Brazilian and one Spanish-speaking lead** — a single-item test in the n8n UI cannot see this class of bug, and this change adds branches on exactly the field that distinguishes them.

---

## Measurement

**The question is whether Brazilian CoachMatch leads convert to anything at all.** Before or alongside the first send, get the baseline out of Twenty: how many Brazilian CoachMatch leads all-time, and how many reached `WON_CUSTOMER`. If it is zero, there is no cannibalisation risk to reason about — a sale that does not happen cannot be displaced. If it is not zero, the trade matters: **All-Access PT nets $19.94/month against ~$119.20 for a $149 CoachMatch athlete, six to one**, and the language framing is the only thing keeping the cheaper offer from taking sales the expensive one would have made.

Read it at the monthly closes, not by watching for the first signup. Record the outcome in `monthly-close/YYYY-MM.md`.
