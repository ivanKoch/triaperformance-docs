# All-Access PT subscriber outreach — September 2026

**Status:** ✅ **EMAIL SENT September 4, 2026**, token rotated first. **WhatsApp NOT sent — no phone number on file for this subscriber** (see below). Owner: Iván. **Retire after the ~10-day access check.**
**Audience:** exactly one person — the single live All-Access subscriber, Portuguese, $29.99 tier (`triaperformance-pricing-and-positioning.md` §All-Access subscription pricing). Has never logged in to the members area.
**Why now:** coach support was added to All-Access September 4, 2026 and the existing subscriber gets it retroactively (`triaperformance-pricing-and-positioning.md`). That is the reason to write; the re-engagement is what the message is for.

**This is not the members-area announcement.** `members-area-announcement-2026-08.md` is a 33-person mail-merge to **coaching athletes** in Spanish, saying "your coaching includes this." This is one message to a **paying subscriber** in Portuguese, saying "your subscription includes this." Different audience, different claim, different language. Do not merge them.

---

## Framing decision

**"What's new", not "I owe you an apology".** No reference to the subscriber never having logged in, no guilt, no win-back framing. The honest hook is real: the library went from Spanish-only to 13 Portuguese tools, and coach support did not exist when they subscribed. There is genuinely new value to hand over, so the message hands it over.

## Figures used, and where they come from

| Figure | Value | Source, read September 4, 2026 |
|---|---|---|
| Published PT plans | **53** (28 running · 9 cycling · 8 triathlon · 4 swimming · 4 duathlon) | `data/training_plans_inventory.csv` |
| PT members tools live | **13** | `site/_data/library.json` → `pt.live` |
| TP Premium standalone | **$19.95/mo** | `triaperformance-pricing-and-positioning.md` |

⚠️ **The PT checkout title is `"Acesso Total: Planos de Treino (Corrida + Ciclismo + Triatlo)"` and omits TrainingPeaks Premium entirely.** So this subscriber may not know Premium is included — which is why the email names it explicitly and tells them to check their account. Same reason the plan count is stated as all 53, not the three-discipline subset the product title implies (that contradiction was resolved on the public page September 4, 2026).

## Coach-support boundary — stated in the copy on purpose

Questions about a tool, zones, or which plan to pick: answered personally. **Not** training review, **not** weekly adjustments, **not** personalised testing — those define 1:1 at $149. The boundary is written into both drafts because close #1 records 26 legacy athletes below $149 and a warm, open-ended promise here is a visible downgrade path.

---

## Before sending — rotate the token

> ✅ **Done September 4, 2026.** Token rotated, then the email sent — in that order, as specified. The commands below stay as the record of what was run and as the pattern for the next one.

The `subscriber_tokens` table was pasted into a chat transcript twice during the August i18n branch. This subscriber has **never logged in**, so rotating costs nothing and breaks nothing — no cookie to invalidate, no experience they did not expect.

**1. Identify the row.** Two PT tokens exist; only one is the All-Access subscriber. Cross-check `customerType = ALL_ACCESS` in Twenty before touching anything.

```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT email, preferred_language, access_count, created_at
FROM subscriber_tokens
WHERE active = TRUE
  AND preferred_language = 'PORTUGUESE'
  AND twenty_person_id <> 'QA-FIXTURE'
ORDER BY created_at;
SQL
```

**2. Rotate, then send.** New token first, message second — a failed send must never leave them holding a dead password.

```bash
EMAIL='<the-address-from-step-1>'
NEW=$(python3 -c "import secrets; print(''.join(secrets.choice('ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789') for _ in range(20)))")
echo "New token: $NEW"
docker exec -i analytics-postgres psql -U analytics -d members <<SQL
UPDATE subscriber_tokens SET token = '$NEW'
WHERE email = '$EMAIL' AND active = TRUE;
SQL
```

**3. Verify before sending.**

```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT email, token, preferred_language, active, access_count
FROM subscriber_tokens
WHERE email = '<the-address>' AND active = TRUE;
SQL
```

---

## The email

**Assunto:** `Tudo o que já está incluído no seu All-Access`

*(Alternativas: `Novidades no seu All-Access` · `Sua área de membros já está pronta em português`)*

```
Oi {{primeiro_nome}}, tudo bem?

Te escrevo porque o All-Access mudou bastante nos últimos meses e quero
que você use tudo o que já está incluído na sua assinatura — inclusive
algumas coisas que provavelmente você nem sabe que tem.

1. Todos os planos, não só um.

São 53 planos publicados em português: 28 de corrida, 9 de ciclismo, 8
de triatlo, 4 de natação e 4 de duatlo. E você pode trocar de plano
quantas vezes quiser, sem pagar nada a mais. Terminou um bloco de 10k e
quer partir para a meia? É só trocar.

2. TrainingPeaks Premium está incluído.

Sozinho ele custa US$ 19,95 por mês. Se você ainda estiver usando a
conta gratuita, vale abrir o TrainingPeaks e conferir — o gráfico de
PMC, o histórico completo e a análise por intervalos já estão liberados
para você.

3. A Área de Membros — esta é a parte nova.

São 13 ferramentas em português, feitas para usar na hora, no celular,
e não PDFs para guardar numa pasta:

- Antes e depois de treinar: a ativação que se monta sozinha conforme o
  esporte, como você está chegando e o equipamento que tem; mobilidade
  pós-treino de 10, 20 ou 30 minutos; core para quarto de hotel; core do
  ciclista; e um timer de respiração em caixa.
- Quando algo dói: joelhos, aquiles e ombro de nadador. Carga
  progressiva de verdade, com as regras para saber a cada dia se você
  passou do ponto.
- Entender seus números: a calculadora das suas sete zonas nos três
  esportes, como configurar o Garmin campo por campo, carga de treino
  (TSS, CTL, ATL e o PMC) explicada uma vez e direito, hipertrofia e
  força, e os guias em PDF.

Subo ferramentas novas praticamente toda semana.

4. Suporte do coach — novidade, e já vale para você.

Dúvida sobre uma ferramenta, sobre as suas zonas ou sobre qual plano
escolher: me escreve e eu respondo pessoalmente. Para ser claro sobre o
limite: não é análise dos seus treinos nem ajuste semanal do plano —
isso é o acompanhamento 1:1. Mas pergunta é pergunta, e ela tem
resposta.

Como entrar:
https://triaperformance.com/members/pt/login/
Senha: {{senha}}

A senha é sua, não compartilhe. O navegador guarda, então você digita
uma vez só.

E se tiver alguma ferramenta que te faria falta e não está lá, responde
este email dizendo qual. É assim que eu decido o que construir depois.

Abraço,

Iván
```

### Why it is written this way

- **The order is by value, not by novelty.** Plans first, Premium second, library third — because the first two are things they are already paying for and may not be using, and a subscriber who discovers they had Premium all along has a reason to open the members area next.
- **Premium gets its own numbered point.** The PT checkout title never mentioned it. This is the single most likely unknown inclusion in the whole message.
- **The library is described by what it does, not by what it is called.** "A ativação que se monta sozinha" beats "Ativação", because the tool names mean nothing to someone who has never seen them.
- **The coach-support boundary is in the copy.** Warm and open-ended here costs $110/month of coaching-price integrity later.
- **The last line is the useful one.** One subscriber's answer on what is missing is a better read on the tools backlog than none.
- **No emojis, no urgency, no upsell.** They already pay. There is nothing to convert.

---

## The WhatsApp

**NOT SENT — no phone number on file for this subscriber, and that is by design.** *(Iván, September 4, 2026, correcting this file's first version, which had logged it as a channel gap.)* **All-Access is self-serve: the subscriber buys through a TrainingPeaks checkout and never needs a conversation, so no phone number is asked for.** *The line runs one way and stays open — Iván's number is public, a subscriber who writes on WhatsApp gets an answer, and that is the coach-support promise doing its job. What does not happen is Iván initiating.* **So for a subscriber, email carries the whole message on its own** — which is the real constraint on any draft written for this audience, and the reason the email above names all four inclusions rather than opening a conversation. *The draft below is kept only for the case where a number already exists: a subscriber who was a 1:1 athlete first, or one who wrote in.*

Three messages, sent in order. Shorter, no headers, no bullet formatting that WhatsApp will mangle.

**1.**
```
Oi {{primeiro_nome}}, tudo bem? Aqui é o Iván, da Triaperformance.

Te escrevo porque o All-Access mudou bastante nos últimos meses e
quero que você use tudo o que já está incluído na sua assinatura.

Três coisas rápidas:

1) Todos os 53 planos em português estão liberados para você, e dá para
trocar de plano quantas vezes quiser, sem custo nenhum.

2) O TrainingPeaks Premium está incluído na assinatura (US$ 19,95/mês
por fora). Se você ainda estiver na conta gratuita, vale conferir.

3) A Área de Membros, que é a parte nova: 13 ferramentas em português —
calculadora de zonas, ativação e mobilidade que se montam sozinhas,
rotinas para joelho, aquiles e ombro, core para quarto de hotel, como
configurar o Garmin e o guia de carga de treino. Subo coisa nova quase
toda semana.
```

**2.**
```
Para entrar:
https://triaperformance.com/members/pt/login/

Senha: {{senha}}

É sua, não compartilhe. O navegador guarda, então é só uma vez.
```

**3.**
```
E tem uma novidade que já vale para você: agora o All-Access inclui
suporte do coach. Dúvida sobre uma ferramenta, sobre as suas zonas ou
sobre qual plano escolher, é só me chamar por aqui. (Análise de treino
e ajuste semanal continuam sendo do 1:1, mas pergunta tem resposta.)

Se faltar alguma ferramenta que te ajudaria, me diz qual — é assim que
eu decido o que construir depois.
```

---

## After sending

**Sent September 4, 2026 — check on or after September 14.** Re-run `access_count` for that row in ~10 days. It is a sample of one, so it proves nothing statistically — but it is the only All-Access subscriber there is, and All-Access NRR is 27.3%. Whether this person logs in is the whole of what is knowable about whether the product is being used.

Record the outcome in the September close (`monthly-close/2026-09.md`) rather than here, and retire this file.

```bash
docker exec -i analytics-postgres psql -U analytics -d members <<'SQL'
SELECT email, access_count, last_access_at
FROM subscriber_tokens
WHERE active = TRUE
  AND preferred_language = 'PORTUGUESE'
  AND twenty_person_id <> 'QA-FIXTURE';
SQL
```

*(If `last_access_at` does not exist on this table, drop it from the SELECT — `access_count` alone answers the question.)*
