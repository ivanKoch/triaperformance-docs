# Sales Playbook — 1:1 Coaching (inbound)

**Created August 12, 2026.** Home doc for the pre-sale and onboarding message library. Spanish first; EN/PT are a later pass.

**What this doc owns:** the actual texts Iván sends to an inbound coaching lead, from first contact to the end of week 2, plus the objection bank and the rules about sequence.

**What it does not own:**
- **Prices.** Owner is `triaperformance-pricing-and-positioning.md`. Every number below is a *copy* — if a price moves, fix it there first, then correct every template here in the same session.
- **Coaching content** (what to prescribe, test protocols, zones). Owner is `methodology.md`. §3 of that doc owns the pre-sale *flow*; this doc is the words. Where a template encodes a protocol, it points at the section rather than restating it.
- **The automated first-touch messages.** The CoachMatch WhatsApp opener and the 3-email nurture live in `automation/coachmatch-lead-automation.json` and `automation/coachmatch-email-nurture-2-3.json`. Those are the live source; the copies below are for reference only, so a change goes into n8n first.

---

## 0. The evidence this is built on

Derived from 13 real converted-athlete WhatsApp transcripts (Dec 2025 – Aug 2026), read in full on August 12, 2026. Not from theory.

> ***Read §5's "hole in the evidence" before treating any of this as proven.*** *Every athlete in the sample bought. Nothing below can distinguish "what caused the yes" from "what the yeses happened to look like."*

**What the transcripts show:**

1. **Price arrives before qualification.** A number is named in 9 of the 13 conversations, and in 6 of those it arrives before Iván knows the athlete's available hours. Roberto Fernández got $149 six minutes after his first message; Rafael after one question.
2. **The two conversations that built value first closed at full price with no friction.** Nadine (EN, $149) — goal mirrored back, three stated objections answered by name, *then* price as part of the plan: *"yes I like your plan and suggestions! I also agree with the $149."* Ashley ($99) — race ladder proposed first, subscribed within hours. **n=2. This is a reason to run the sequence deliberately and count, not a proven mechanism.**
3. **A price menu costs money.** Eliezer was given $75 / $99 / $149 unprompted, in the same conversation where he agreed to buy a $355 Stryd pair on Iván's recommendation. He chose "el básico."
4. **"Gold service at Bronze price" produces tier-shopping.** Rafael spent a day asking *"¿el oro? ¿o el plata?"*; Christian answered it with *"me habías comentado que manejabas una tarifa diferente para latinos?"* A discount frame invites the question "so what's the real price."
5. **The pain that justifies $149 arrives by luck.** Three athletes volunteered a failed previous attempt unprompted — Roberto F (*"terminé lesionado, tuve que detener el programa"*), Alfonso (*"siempre que corro 4 veces me lesioné"*), Gui (*"edema óseo por sobrecarga"*). None was asked.
6. **A template with the wrong variable still ships.** Gui — Amsterdam marathon, a 163 km Gran Fondo and Pucón 70.3 — was sent *"Plan de entrenamiento de running + gimnasio"* and *"estrategias nutricionales para el 21k"*, pasted from Javier's conversation the same day. He bought anyway. **This is the argument for variables in braces rather than a block that reads fine at a glance.**
7. **Zero referral asks in 13 conversations.** María Emilia — the only Private athlete in the set, worth $24.59/month more than a CoachMatch athlete — arrived as a spouse-of-a-lead by accident.

---

## 1. Rules of sequence (the part that isn't a template)

1. **Never name a price before you know the goal, the deadline and the available hours.** Those three are the whole qualification. If the lead asks the price first, use **B1** — you answer, but you earn the right to frame it.
2. **One price. Never a menu.** $149. The $75 monthly-contact plan and the $39.99 All-Access subscription exist and are real, but they are *responses to a stated constraint* (B2, B3), never options presented up front.
3. **There are three things you can concede, and the price is not one of them.** In the order you should reach for them:
   1. **Time — the start date (A5b).** Costs no cash at all. Works on a *timing* objection, which is the commonest non-price stall.
   2. **The startup fee**, Private channel only, code `NOSTARTUP` — $48.25 once. Works on a *price* objection. Source: `triaperformance-pricing-and-positioning.md` §Starting fee.
   3. **A different product** — All-Access at $39.99 (B2) or the $75 monthly-contact plan (B3). Works on a *budget* constraint, and only when the constraint is real.
   **The $149 itself never moves.** One public price; discounts are private exceptions, never advertised (pricing rules 1 and 2).
4. **Ask what failed before.** One question, every lead, before the price. It is the single highest-value question in the whole corpus and it has never been asked deliberately.
5. **Offer the call when the lead hesitates, not when they're ready.** Roberto Palacios closed 20 minutes after a 16-minute video call. Every call in these transcripts was requested by the athlete. A call is the strongest tool available and it is currently reactive.
6. **Do not send the reviews + Instagram block as a greeting.** It currently goes out immediately after the athlete's first context message, before anything has been said that would make them want proof. Social proof answers a doubt; sent first it reads as a brochure. Send it with **A3** or in **B4**.

---

## 2. Block A — Pre-sale

### A1 · First contact (reference only — lives in n8n)

Sent automatically on lead creation by `coachmatch-lead-automation.json`. Do not edit here; edit the node and mirror.

> Hola {NOMBRE}
>
> Mi nombre es Iván, de Triaperformance, soy coach certificado y partner de Training Peaks. Te contacto ya que solicitaste información en Training Peaks sobre coaching personalizado.
>
> Cuentame, con qué objetivo y cómo estás entrenando hoy en día?

### A2 · Discovery — the five questions

Send as **one message**, not five. Athletes answer long messages in full (Nadine, Alfonso, Gui, Roberto F all wrote paragraphs); a drip of one-liners gets one-word answers.

> Perfecto {NOMBRE}, gracias por escribir. Para poder decirte con honestidad si te puedo ayudar y cómo, cuéntame:
>
> 1. ¿Cuál es el objetivo y para cuándo? (carrera, fecha, y si tienes un tiempo en mente)
> 2. ¿Cuántas horas por semana tienes realmente disponibles, y en qué días / momentos del día?
> 3. ¿Qué estás haciendo hoy — plan propio, app, otro coach, nada?
> 4. **¿Qué intentaste antes que no te funcionó?** Lesiones, planes que abandonaste, procesos que te dejaron a mitad de camino.
> 5. ¿Con qué cuentas? Reloj, banda cardíaca, potenciómetro, rodillo, gimnasio, piscina.

*Question 4 is the one that isn't in the current process. It is what makes A3 possible.*

### A3 · The mirror — the message that earns the price

**This is the highest-leverage text in the document.** It is the Nadine message, generalised. It has four parts and the order matters:

1. **Their goal, restated in their own numbers** — proves you read it.
2. **Their stated obstacles, named one by one**, each with what you would actually do about it. Not features — the specific decision for their case.
3. **An honest read on feasibility.** If the goal is achievable, say so plainly and say what it depends on. If it isn't, say that too — Roberto F's "¿qué es realista para el 27 de septiembre?" was answered with *"no tengo nada de información para poder contestarte esto"*, and it did not cost the sale. It probably won.
4. **Then, and only then, A4.**

> {NOMBRE}, gracias por todo el contexto. Te doy mi lectura.
>
> **Tu objetivo:** {OBJETIVO_EN_SUS_NUMEROS} para {FECHA}. {LECTURA_DE_FACTIBILIDAD — "es 100% alcanzable si hacemos un proceso de X meses" / "vamos a necesitar un objetivo intermedio antes"}.
>
> **{OBSTACULO_1}:** {QUÉ_HARÍAS_ESPECÍFICAMENTE}.
>
> **{OBSTACULO_2}:** {QUÉ_HARÍAS_ESPECÍFICAMENTE}.
>
> **{OBSTACULO_3}:** {QUÉ_HARÍAS_ESPECÍFICAMENTE}.
>
> Somos un grupo de entrenamiento virtual que une a atletas de toda Latinoamérica.
> • Instagram, para ver qué están logrando y preparando mis atletas 👇 https://www.instagram.com/triaperformance/
> • Reseñas de mis atletas 👇 https://maps.app.goo.gl/Dfw4166sxw3WGwA3A

**Worked example (Nadine, the real one, translated to the template):**
- Obstacle 1, travel + military schedule → *"plan altamente estructurado pero ágil: diseñado para que lo ejecutes igual con tu setup normal o adaptándolo en el gym de un hotel"*
- Obstacle 2, run pace in heat and humidity → *"enfoque polarizado para construir motor aeróbico de forma segura, más sesiones brick específicas"*
- Obstacle 3, lower back under load → *"bloques de fuerza con foco en trabajo unilateral, evitando carga axial directa sobre la columna"*

**Worked example (Roberto F — the objection was a failed coaching process):**
- *"Con mi sistema es difícil llegar a ese nivel de sobreentrenamiento: te programo semanalmente cuidando la carga, y hacemos feedback todos los lunes. Estoy muy cerca del progreso de cada corredor."* — this is already his line and it works. It belongs in A3, not after the price.

### A4 · Price + what's included

**The block that was missing.** One message. The price sits *inside* the service definition, not before it.

> Trabajo con un único plan, todo incluido, de **149 USD por mes**:
>
> • **Plan 100% personalizado** de {DEPORTES} + gimnasio en Training Peaks, construido sobre tu semana real — no un plan pre-hecho ni planificado con IA ni en grupo.
> • **Testing inicial y re-tests** para definir tus zonas con datos, no con estimaciones. Sin esto, entrenar en zonas es adivinar.
> • **Seguimiento semanal, todos los lunes.** Yo inicio la conversación: reviso tus números, te pido tus sensaciones, y ajustamos. No tienes que perseguirme.
> • **Ajustes ilimitados.** Viaje, semana de trabajo imposible, una molestia: se reacomoda el plan. Las sesiones perdidas no se acumulan ni se comprimen después.
> • **Comunicación directa conmigo por WhatsApp** toda la semana, sin límite de mensajes.
> • **Análisis de tus sesiones** cuando lo pidas.
> • **Training Peaks Premium incluido** (21 USD/mes por su cuenta), que además trae Training Peaks Virtual, el simulador de ciclismo.
> • Estrategia **nutricional para tus sesiones clave y tu carrera** {OBJETIVO} (nutrición del día a día es de un profesional de la nutrición, no mía).
> • **El plan y el seguimiento los hago yo personalmente.** No hay equipo detrás ni plantillas rotando.
> • **Sin tiempo de permanencia.** Te suscribes y te desuscribes cuando quieras.

*Rules for this block:*
- *`{DEPORTES}` and `{OBJETIVO}` are mandatory substitutions. This is the exact line that shipped wrong to Gui.*
- *Do not add "descuento", "precio preferencial", "tarifa Latam" or the Bronze/Silver/Gold comparison. See B5.*

### A5 · Closing — the subscription steps

**CoachMatch** (verbatim, his existing text — leave as is, it works):

> - Ingresá en el link que te paso a continuación, seleccioná el plan Bronze.
> - Una vez que hagas el pago del primer mes, nuestras cuentas quedan vinculadas.
> - Cuando me llegue la notificación, te paso un cuestionario para que completes con información tuya, de tus últimos entrenamientos, carreras y preferencias personales.
> - Con eso te puedo enviar unos entrenamientos para los próximos días y luego planear con más tiempo las próximas 2 semanas.
> .
> https://www.trainingpeaks.com/coach/ivankoch#pricing

**Private** (referral, website, Instagram — the channel worth $24.59/mo more; a *referred* athlete carries a $9 TrainingPeaks Premium cost, so $15.59 — see `triaperformance-pricing-and-positioning.md` §TrainingPeaks Premium):

> - Te dejo el link de suscripción: {CHECKOUT_URL}
> - El primer mes incluye un fee de setup de 50 USD por el onboarding, el testing y la construcción de tu primer bloque.
> - Una vez confirmado el pago, nuestras cuentas quedan vinculadas y te paso el cuestionario.
> - Con eso preparo tus primeros entrenamientos y luego planeamos las próximas 2 semanas.

*Checkout URLs: `triaperformance-pricing-and-positioning.md`. Startup-fee waiver code `NOSTARTUP` is a closing lever — see B6.*

### A5b · The flexible start date — the close for a *timing* objection

**Use when the lead is sold but not ready: "empiezo el mes que viene", "después de mi carrera", "en enero te escribo".** Not on a price objection — that is B2/B6 — and **never unprompted on someone ready to start today**, which converts a paying week into a free one for nothing.

**This is not a new idea. It is already the thing that closed Alfonso** *(May 24, 2026: "nos ponemos en contacto en 2 semanas" → Jun 2, offered a Jun 15 start → subscribed the same day → **ran his threshold test on Jun 6, nine days before billing began**)*. It had no name, so it has been used once instead of every time it applies.

**Why it works and what it costs.** TrainingPeaks lets the athlete pick their own start date, and **TP pays in batches — a signup on the 12th and a signup on the 31st land in the same payout.** So the free days cost **no cash at all**; they cost hours. TrainingPeaks actively promotes this play to its coaches, so it is a normal move in this marketplace rather than an improvisation.

> Perfecto, y esto lo acomodamos a tu fecha — no hace falta que esperes.
>
> En Training Peaks el día de inicio lo eliges tú. Suscríbete hoy y pon como fecha de inicio el **{FECHA_INICIO}**. Mientras tanto:
>
> • Nuestras cuentas quedan vinculadas hoy mismo.
> • Hacemos el onboarding ahora: cuestionario, tu semana ideal, y te dejo Training Peaks configurado.
> • Y hacemos tu **test de umbral antes de arrancar**, así el {FECHA_INICIO} empiezas con tus zonas reales y no con estimaciones.
> • El cobro sale recién el {FECHA_INICIO}.
>
> Dicho de otra forma: los días de aquí al {FECHA_INICIO} no te los cobro, y los usamos para que tu primer mes sea entrenamiento de verdad y no puesta a punto.

**Four guardrails. The first two are where this goes wrong:**

1. **Cap the window** at ~2 weeks, or "the end of the current month." Uncapped, "pick any start date" is how someone signs on August 12 and starts October 1.
2. **Only in response to a stated delay.** Same rule as the downsell in B2 — it is an answer to a constraint, never an option on a list.
3. **Deliver setup, not training: account linking, intake form, semana ideal, testing, zones.** Not a training block. That is the natural boundary and the best hours-to-perceived-value ratio available.
4. **Accept the cancel-before-billing risk; do not engineer against it.** They could take the test and never be charged. `tenure-analysis.md` §2: **2% of athletes churn inside month one.** The exposure is a rounding error against one extra signup a month.

**The argument that isn't about closing.** The free window makes **month one better, not just cheaper** — zones set before day one means the first paid month is training rather than setup, which is precisely where retention leaks (`tenure-analysis.md` §3: the damage is concentrated between months 6 and 12, and it starts with a weak first block). **Treat the free days as a service improvement you happen to be able to sell with, not a discount you happen to deliver.**

*Noted so it isn't later mistaken for confused pricing: this is the same deliverable as **`open-loops.md` NEXT #8**, the +$50 testing-and-zones consultation for plan buyers. Sold there, given here. Different customer, different job — a plan buyer is paying to remove a one-off problem; a coaching lead is being shown what the service is before the meter starts.*

### A6 · Follow-up when they go quiet

The watchdog's messages 2 and 3 live in `automation/twenty_followup_check.py` and are generic. This is the version for a lead who already got A3/A4 — it re-opens with the plan, not with a nudge.

> {NOMBRE}, ¿cómo va? Te dejo esto por si te quedó alguna duda.
>
> Una cosa que quizás no quedó clara: {EL_OBSTACULO_QUE_MÁS_LE_PREOCUPA} es exactamente el tipo de cosa que resolvemos en el seguimiento semanal, no algo que tengas que tener resuelto antes de empezar.
>
> Si quieres, hacemos una llamada de 15 minutos y lo vemos en vivo. Pasame 2 o 3 horarios y te agendo.

---

## 3. Block B — Objections

### B1 · "¿Cuánto cuesta?" asked before anything else

Do not answer with a number alone. Answer with a number and a hook back into qualification.

> Te cuento en un minuto, pero antes dos preguntas rápidas para no venderte algo que no te sirve: ¿cuál es el objetivo y para cuándo, y cuántas horas por semana tienes disponibles de verdad?
>
> El plan es uno solo, todo incluido, 149 USD por mes. Con tus respuestas te digo si te puedo ayudar y exactamente cómo lo armaría en tu caso.

### B2 · "Es caro" / "no tengo el presupuesto ahora"

Javier said exactly this in December, bought All-Access at $39.99 in January, and moved to coaching four months later. **The downsell works — it is the only documented path from a price objection to a paying coaching athlete, and it happened reactively.** Make it deliberate.

> Te entiendo perfectamente, y prefiero que empieces por donde te alcanza que no empieces.
>
> Tengo una suscripción de **39.99 USD/mes** que no incluye coaching — no hay seguimiento personalizado — pero sí:
> • Todos mis planes de entrenamiento (running, ciclismo, natación, triatlón, pérdida de peso). Cada uno vale entre 48 y 64 USD; tú tienes acceso ilimitado y puedes cambiar de plan cuando quieras.
> • Training Peaks Premium incluido, con Training Peaks Virtual.
> • Mis guías de entrenamiento mental y nutricional.
> • Y si te surge una duda, me escribes por acá igual.
>
> Empiezas ahí, y cuando quieras el proceso personalizado hablamos. {CHECKOUT_ALLACCESS}

*Then set a real follow-up. Javier came back on his own; do not rely on that.*

### B3 · "Quiero algo más autónomo / no necesito tanto seguimiento"

Only for genuinely advanced athletes. **Never offer this to a beginner** — Christian asked for the cheaper "tarifa para latinos" and Iván correctly talked him out of it: *"en mi opinión, tú necesitas un poco más de seguimiento, especialmente al principio."* Keep that instinct.

> Tengo un plan de 75 USD que funciona así: te cargo un mes completo en tu calendario, tú lo ejecutas, y al cierre del mes me compartes tu feedback y con eso armo el siguiente. **No incluye comunicación durante el mes.**
>
> Es para atletas que ya saben entrenar, que resuelven solos un conflicto de agenda o una molestia. En tu caso {RAZÓN_POR_LA_QUE_APLICA_O_NO}.

### B4 · "Ya tuve un coach / un plan y no funcionó" (or: "terminé lesionado")

The most common real objection in the corpus, and the easiest to answer well.

> Es la razón más común por la que llegan atletas a mí, así que déjame ser concreto sobre qué es distinto:
>
> • **Se testea.** Tus zonas salen de un test tuyo, no de una calculadora por edad ni de un plan genérico. Se re-testea cada 2–3 meses para probar que estás mejorando.
> • **La carga se mide.** Training Peaks me da CTL (fitness), ATL (fatiga) y TSB (forma). Eso es objetivo. Encima de eso están tus sensaciones — sueño, fatiga en el día, cuerpo adolorido — y esas pesan más que los números. A veces las métricas están en rango y hay que parar igual.
> • **Todos los lunes te pregunto.** Es un ritual, no una promesa: hace más de 2 años que no falla. Un problema no llega a ser una lesión porque nunca pasan más de 7 días sin que lo hablemos.
> • **Las sesiones perdidas se quedan atrás.** No se comprimen el sábado. Ahí es donde la gente se lesiona.
>
> Estas son reseñas de mis atletas, varias de gente que llegó igual que tú 👇 https://maps.app.goo.gl/Dfw4166sxw3WGwA3A

### B5 · "¿Qué plan elijo — Bronze, Silver, Gold?" / "¿hay tarifa para latinos?"

Both questions are produced by the discount frame. **Answer without repeating it.**

> Bronze — es el único que uso. Un solo plan, todo incluido, sin niveles.
>
> Los tres niveles que ves en Training Peaks son su estructura para el mercado de EE.UU. y no describen cómo trabajo yo: no tengo un plan con "una llamada al mes" y otro con más. Todos mis atletas reciben lo mismo, y es lo que te describí arriba.

*Do not write "te doy el servicio del Gold al precio del Bronze." It's a better-sounding sentence that makes the next question "so what does the Gold actually cost."*

### B6 · "Lo voy a pensar"

María Emilia said this and came back in 3 days; Alfonso said "hablamos en 2 semanas" and came back in 9 days. **Both returned on their own. Neither was given a reason to return sooner, and both had already decided.** So: don't push, but attach the decision to something concrete.

> Dale, sin apuro. Dos cosas para que las tengas mientras lo piensas:
>
> 1. No hay tiempo de permanencia. Te suscribes, hacemos un mes, y a los 25 días nos sentamos a revisar adaptación, fatiga y constancia antes de que se renueve. Si no te sirvió, te desuscribes.
> 2. {ANCLA_TEMPORAL: "faltan X semanas para {FECHA_CARRERA}; para llegar bien necesitamos empezar antes de {FECHA_LÍMITE}, sobre todo porque las primeras 2 semanas son base y test" }
>
> Cuando quieras, acá estoy.

*The "first month then review" offer is Roberto F's own ask, granted immediately, and he closed the same hour. It is a free close — it costs nothing that "cancel anytime" doesn't already cost.*

**Read which objection it actually is before choosing the lever — they look identical in a chat window and take opposite responses:**

- **"No es el momento" / "empiezo después de X" → timing. Use A5b**, the flexible start date. Do not discount anything; there is nothing to discount. *Alfonso and Javier both said a version of this and both were answered with information rather than a start date — Alfonso came back nine days later on his own, Javier took four months and bought a different product.*
- **"Es caro" → price.** `NOSTARTUP` if Private (a $48.25 concession that protects the $149), or B2 if the budget constraint is real. **Never discount the monthly.**
- **"Lo voy a pensar" with no reason attached → neither yet.** Ask which one it is. The message above does that by attaching the decision to a date; if they answer with a date, it was timing.

### B7 · "¿Incluye nutrición?"

Christian asked this before paying; it is also logged as a purchase-point objection on the plans side (`open-loops.md`, weight-loss nutrition guide).

> Sí, en la parte que me corresponde: estrategia nutricional para tus sesiones clave y para la carrera — qué comer antes, qué llevar, cuántos carbohidratos por hora, cómo practicarlo en los entrenos largos.
>
> La nutrición del día a día (composición corporal, plan de comidas) es de un profesional de la nutrición. Te digo esto de frente porque un coach que te dice que hace todo, no hace todo.

### B8 · "¿Cómo comparo esto con Runna / una app?"

Iván raised this himself with Roberto F, before being asked — good instinct, keep it.

> Comparado con una app, esto es caro. Te lo digo yo antes de que lo pienses tú.
>
> Lo que compras es la diferencia entre un plan que se ajusta y uno que no. Una app no sabe que dormiste 4 horas, que tuviste una reunión hasta las 11, que la piscina cerró, o que tenías una molestia el martes. Y no te va a decir "esta semana paramos".
>
> Si tu semana es predecible y no tienes historial de lesiones, una app te alcanza y te lo digo sin problema. Si tu agenda se rompe seguido o ya te lesionaste siguiendo un plan fijo, ahí es donde esto se paga solo.

### B9 · Referral ask

> **Heading corrected August 26, 2026.** This read *"Referral ask — after the first good result"*, which is now only half true: there are **two motions**, and only the personal ask waits for a result. Disclosure goes to every engaged athlete at any tenure. Owner of that split: `referral-program-brief.md` §2.

**Missing entirely from all 13 conversations.** Send after a PR, a race, or a clean test improvement — never cold, and never to an athlete who isn't engaged. Private-channel referrals are the highest-margin acquisition there is (3.5% vs 20%).

> {NOMBRE}, {LOGRO_CONCRETO} — muy bien ejecutado.
>
> Un pedido, y va con algo de mi parte: si tienes a alguien entrenando cerca — pareja, compañero de grupo, alguien del club que esté peleando con lo mismo que peleabas tú hace {TIEMPO} — pásame el contacto o pásale el mío.
>
> Si arranca conmigo, a él le saco el fee de setup y a ti te mando **50 USD** cuando complete su segundo mes. El plan hoy está en **149 USD**, así que es una buena puerta de entrada para alguien que te importe.
>
> Y si ahora no tienes a nadie en mente, no hay problema — queda dicho y seguimos.

**The last line is not politeness.** An ask with no easy exit turns a coaching relationship into a sales one for everybody who doesn't have a name to give — which will be most of them, most of the time.

#### B9a · Disclosure — the standing message *(added August 26, 2026, Iván's own draft)*

**This is the *disclosure* motion, not the ask** — every engaged athlete, any tenure, no result required. Sent on a Monday riding the weekly check-in, after the athlete's own feedback loop is closed, never as a standalone blast. *Iván's reasoning, and it is the whole timing rule: 37 messages sent cold on a random day produce 37 athletes asking for something back.* Ownership of the when/who: `referral-program-brief.md` §2–3.

**Two variants. The only difference is one word in the price line**, and it exists because CoachMatch athletes never paid a setup fee and need telling the fee exists at all.

**A · Legacy-rate athletes (~32)**

> {NOMBRE}, un comentario más antes de cerrar el feedback semanal.
>
> Armé un programa de referidos y me gustaría comentártelo:
>
> Los **nuevos** atletas que se unen al equipo **ya** pagan el precio estándar de 149 USD/mes y 50 USD de fee de setup por única vez el primer mes.
>
> Si me presentas a alguien y empieza, estos son los beneficios:
>
> • Tu referido no paga los 50 USD de setup.
> • Tú recibes una gift card de Amazon de 50 USD cuando el referido completa su segundo mes.
> • No hay tope de referidos. Si me refieres 10 atletas, son 500 USD en gift cards.
>
> Piensa en quien tengas entrenando cerca — pareja, compañero de grupo, alguien del club que esté peleando con lo mismo que peleabas tú hace un año.
>
> Te dejo acá cómo funciona, por si lo quieres leer con calma: {LINK_TERMINOS}
>
> Sin compromiso. Si ahora no se te ocurre nadie, no hay problema — queda dicho y seguimos.

**B · Full-price athletes (8)** — identical, except the price line drops *nuevos* and *ya*:

> Los atletas que se unen al equipo pagan el precio estándar de 149 USD/mes y 50 USD de fee de setup por única vez el primer mes.

***The load-bearing property of this message is what it does not say.*** It never mentions the reader's own rate, in any direction — no guarantee, no comparison, no *"descuento"*. **An earlier draft led with "tu tarifa no se toca, nunca" and Iván rejected it as "so defensive it's unnatural."** *That was correct: a reassurance raises the very question it answers, and nothing else in the message would have made a $75 athlete think about their price.* Full reasoning: `referral-program-brief.md` §4.

*A second safeguard is structural rather than editorial: the 32 recipients are a mix of $75 / $89 / $99, so a single message **cannot** name any athlete's own rate — only $149.*

**C · English** *(added Aug 26, 2026 — Iván's own draft, for the first real send.)* Same structure. Link: `https://triaperformance.com/en/referrals/`.

> {NAME}, one more thing before we wrap up this week's feedback. You've only just joined, so this is purely so you have it.
>
> I've put together a referral program and I'd like to share it with you:
>
> New athletes joining the team now pay the standard rate of 149 USD/month plus a one-time 50 USD setup fee in the first month.
>
> If you introduce me to someone and they start, these are the benefits:
>
> • Your referral doesn't pay the 50 USD setup fee.
> • You receive a 50 USD Amazon gift card when they complete their second month.
> • There's no limit on referrals. If you refer 10 athletes, that's 500 USD in gift cards.
>
> Think about the people you train with — a partner, a training buddy, or someone at the club who's struggling with the same things that made you come looking for a coach.
>
> I'll leave the details here in case you want to read them in your own time: https://triaperformance.com/en/referrals/
>
> No pressure. If no one comes to mind right now, no problem — just wanted to mention it, and we'll keep moving forward.

> ⚠️ ***One line in the first draft would have gone out wrong, and it is the kind that survives proofreading:*** it read *"someone at the club who is struggling with the same things you were **a year ago**"* — a direct translation of the Spanish *"hace un año"*, which was written for the legacy cohort. **The intended recipient had joined weeks earlier, and the same message's own opening line said so.** *Two sentences apart, one acknowledged she was new and the other assumed a year of shared history.* **Replaced with *"the same things that made you come looking for a coach"***, which is true at any tenure and echoes §1 rule 4's discovery question instead of inventing a past. *The general lesson: a template's time references are bound to the cohort it was written for, and they do not survive an audience change silently — they survive it plausibly.*

#### B9b · The forwardable blurb

**Appended to both variants, and also lives on the terms page with a copy button.** *The point is that the referrer composes nothing* — B9 above tells the athlete to *"pásame el contacto o pásale el mío"* and hands them nothing to paste, which is the single likeliest reason a willing referrer does nothing.

> *"Te paso el contacto de mi coach, Iván Koch — Triaperformance, certificado y partner de TrainingPeaks. No es un plan genérico: te hace un test, te arma tus zonas y te ajusta la semana según cómo vas. Si le dices que vas de mi parte te saltea el fee de setup, que son 50 USD. Acá te puedes poner en contacto con él: https://wa.me/573105437088"*

**Two things in there are load-bearing, not phrasing:**

1. ***"si le dices que vas de mi parte"* is the entire attribution mechanism.** Without it a referred lead arrives anonymous and `referredBy` cannot be filled — which is the field the whole payout depends on.
2. **It routes to WhatsApp, not to a checkout** *(Iván's call, Aug 26, 2026 — the blurb originally carried a `{LINK_PRIVADO}` checkout URL)*. ***This is the better design and it also dissolved a blocker:*** the Private 1:1 checkout URL turned out to exist nowhere in this repo — A5 points at `triaperformance-pricing-and-positioning.md`, which carries only the three **All-Access** URLs — so the blurb was one paste away from shipping an unfilled variable, i.e. §0 finding #6 exactly. **Routing to a conversation removes the variable entirely**, and it is strictly better for attribution: Iván hears who sent them in the athlete's own words rather than inferring it from a link.
   > ⚠️ **The cost, and it is real: the channel decision moves out of the link and into Iván's memory.** A checkout URL routes to Private (3.5%) mechanically; a WhatsApp conversation routes wherever he sends them, and **CoachMatch costs 20%** — dropping the referred athlete's LTV from ~$1,213 to ~$1,073. *(copy corrected Aug 26, 2026 — the $9 TrainingPeaks Premium inclusion; owner `triaperformance-pricing-and-positioning.md` §TrainingPeaks Premium.)* *This has already happened once: both of Ferenz Feher's referrals carry `leadSource: COACHMATCH` and have paid TrainingPeaks a commission every month since.* **Every referred lead closes on the Private checkout in A5, never `trainingpeaks.com/coach/ivankoch#pricing`.**

#### B9c · The warm inbound reply — when a referred athlete writes

**Arrives on WhatsApp via the blurb's `wa.me` link, usually opening with some version of *"voy de parte de {REFERIDOR}".***

> {NOMBRE}, qué tal. {REFERIDOR} me habló de ti.
>
> Y sí, lo que te dijo es cierto: si arrancas, el fee de setup de 50 USD no lo pagas. Eso ya está, no hace falta negociarlo.
>
> Antes de hablar de plan o de precio quiero entender qué necesitas. Tres cosas:
>
> • ¿Cuál es tu objetivo y para cuándo? Si hay una carrera con fecha, mejor.
> • ¿Cuántas horas por semana tienes de verdad, contando trabajo y familia?
> • Y la más importante: **¿qué intentaste antes que no funcionó?** Un plan que abandonaste, una lesión, un bloque que te dejó quemado — lo que sea.
>
> Con eso te digo de frente si te puedo ayudar y cómo.

**Why it is built this way, against the rules in §1:**

- **It confirms the waiver in one line and then leaves it.** The referrer already named a price component, so pretending it hasn't been mentioned reads as evasive; continuing on it makes the fee the frame. Confirm, close, move to qualification.
- **It does not name $149.** Rule 1 still holds: no price before goal, deadline and real available hours. *A referral does not exempt you from qualifying — it exempts you from having to build trust first, which is a different saving.*
- **It asks what failed before** (rule 4), which §0 calls the single highest-value question in the corpus and which no lead in the 13 transcripts was ever actually asked.
- **No reviews block, no Instagram, no proof-stacking.** Rule 6 says social proof answers a doubt; a referred athlete arrives without that doubt, and sending proof anyway tells them you did not notice who vouched for you.

> ⚠️ **A tension worth naming rather than pretending away: the blurb names a price component before any qualification**, which §0 finding #1 identifies as the corpus's most expensive habit. *The mitigation is real but it is not a fix: the number does not arrive from Iván, it arrives from a trusted friend wrapped inside a recommendation, which is a different speech act.* **Watch whether referred leads tier-shop or haggle more than cold ones.** If they do, the blurb's fee line is the first thing to cut.

#### B9d · The payout message

Sent when the weekly reminder fires and the second payment is confirmed in the TrainingPeaks payments list.

> {NOMBRE}, buena noticia: {REFERIDO} acaba de completar su segundo mes.
>
> Así que te toca lo tuyo. Dime dos cosas y te la mando hoy:
>
> • A qué correo te llega mejor.
> • De qué tienda la prefieres — amazon.com, o la de tu país si existe.
>
> Y gracias de verdad. {REFERIDO} llegó porque hablaste bien de mí, y eso vale bastante más que cualquier anuncio.

*Asking which store is not politeness — it is §7's operational step. An `amazon.com` balance does not redeem on `amazon.com.mx` or `amazon.es`, so the store has to be chosen before the card is bought, not after.*

#### B9e · The referral that did not convert — say it out loud

***Added August 26, 2026, and it was not in the original plan.*** The terms say *"si cancela antes, no hay pago."* **Nothing said who tells the referrer.**

> {NOMBRE}, te cuento para que no quedes en el aire: {REFERIDO} decidió parar antes de completar el segundo mes, así que esta vez la gift card no aplica.
>
> Pero el gesto lo tengo bien presente, y te agradezco igual. Cuando aparezca otra persona, ahí seguimos.

***The failure mode this exists to prevent is silence, not disappointment.*** Someone did Iván a favour, waited, and heard nothing — and the story they tell themselves is that the program is not real or that he forgot. **A "no" delivered on time costs a fraction of what an unanswered wait costs**, and the person owed this message is by definition one of his most engaged athletes. *Same principle as B9's own closing line: an ask with no clean exit turns a coaching relationship into a sales one.*

#### Legacy-rate athletes get the same $50, and should be asked first

*(Decided Aug 12, 2026, on Iván's question: should a $75 athlete be approached differently?)*

**Same reward, no adjustment.** The $50 is priced against **the athlete arriving at $149**, not against what the referrer pays. An incoming athlete is worth ~$1,213 (`tenure-analysis.md` §4) whoever sent them. *(copy corrected Aug 26, 2026 — the $9 TrainingPeaks Premium inclusion; owner `triaperformance-pricing-and-positioning.md` §TrainingPeaks Premium.)*

**And they are the best pool you have, not the worst.** The sub-$99 rates went to the earliest signups, so **today's legacy athletes are today's longest-tenured athletes** — the 2024-H2 cohort held **73% to twelve months** against 17–30% for everyone since (`tenure-analysis.md` §3). They know him, they have results, and they have had two years to meet other athletes. **Excluding the nine of them to save $50 a head would exclude the people most likely to say yes.**

#### ~~Do not bundle the ask with "you're on a legacy rate"~~ — **REVERSED August 26, 2026**

> 🚨 **This subsection's conclusion is wrong and has been overturned by Iván. Do not re-raise it.** The disclosure message **does** state $149, alongside an unconditional guarantee that the athlete's own rate never moves. *Kept in full below because the risk it names is real and the drafting rules that answer it come straight out of it.*
>
> **Why it was wrong.** (1) **The referral is unintelligible without the price** — "$50 startup fee waived" means nothing to someone who does not know there is a $50 startup fee. The offer requires the number. (2) **"Founding member" inverts the valence.** This section imagined *"you pay a discount, full price is 149"*, which does read as a setup. Iván's framing is *"you are a founding member, your rate is locked, here is what a new athlete pays."* Same facts, opposite feeling. (3) ***It had the retention effect backwards*** — rule 5 makes a pause expensive, so an athlete who knows the market rate is double has a **reason not to let it lapse**. Against `tenure-analysis.md` §3, that may be worth more than the referral half of the message.
>
> **What survives, as drafting rules:** guarantee before number; never the word *"descuento"*; state the guarantee simply and **do not explain the pause clause** (answer straight if asked — volunteering it turns a promise into fine print).
>
> ***And the safeguard is structural, not disciplinary:*** the 32 legacy athletes are a mix of $75 / $89 / $99, so **one message to all of them cannot state any athlete's own rate — only $149.** The thing this section feared most is prevented by the send list. Full reasoning: `referral-program-brief.md` §4.

**Original section, retained:**

#### Do not bundle the ask with "you're on a legacy rate"

The tempting version — *"you pay a discount because you were one of the first; full price is 149 now"* — **is true, is fair, and should still not be said here.**

- **It converts a gift into a comparison.** "Here's $50" and "by the way, you're underpaying" in the same message reads as an invoice being prepared, and the natural next thought is *"is he about to raise my rate?"* — which then has to be answered with "no," having gained nothing.
- **Grandfathering works because nobody is thinking about it.** Pricing rule 5 holds legacy rates for as long as the athlete stays continuously active, and it is the migration mechanism. **Anything that makes a $75 athlete calculate their rate is a risk to the one policy that quietly converts the book to $149 over time.** The worst case isn't awkwardness, it's prompting a lapse-and-return calculation — and returning costs them $149.

**The reframe that gets the benefit without the risk: put the $149 on the person being referred, not on the referrer.** The text above says *"el plan hoy está en 149 USD"* in the context of what their friend would pay. It states the real price, it makes the referrer feel like an insider, and it never once mentions what they are paying. **Same information, no invoice.**

*Rejected on the way past, because it will occur to someone: rewarding referrals with an extended rate lock ("your rate survives a pause") would cost no cash and be worth more to a $75 athlete than $50. **Do not.** It directly undermines pricing rule 5, and rule 5 only works because it is absolute.*

#### One collision to resolve before launch

`triaperformance-pricing-and-positioning.md` §The referral-rate exception already describes an athlete **deliberately priced at $75 because of the referrals and credibility he brings** — i.e. an arrangement where the low rate *is* the referral compensation. **Under this program he would be paid twice.** That is not necessarily wrong — he is the highest-touch relationship on the roster and evidently the best referrer — but the pricing doc itself says the arrangement should be *"an explicit, named exception rather than something that happens ad hoc."* ~~**Decide before launch whether his rate is the reward, the $50 is the reward, or both are, and write it down there.**~~ **DECIDED August 26, 2026, by Iván: both.** *Several athletes sit at $75 after long tenure; the rate is earned and so is the $50. **"That's the definition of being founding members."*** Written into `triaperformance-pricing-and-positioning.md` §The referral-rate exception, which owns it. **Not a collision — a policy.** Do not re-raise.

---

## 4. Block C — Onboarding (the first two weeks)

### C1 · Welcome + form

> Excelente {NOMBRE}, bienvenido al equipo.
>
> Te dejo el formulario para que completes con tu información, últimos entrenamientos, carreras y preferencias: {FORM_URL}
>
> Y mientras tanto te hago la pregunta más importante de todas, que va en el mensaje siguiente.

*Forms: ES `https://forms.gle/PcuUBUgRJQ5v6PDB7` · EN `https://forms.gle/BhyS5jcR2bp9yWq28`*

### C2 · Semana ideal — with a worked example

**This is the fix for the biggest hole in the current process.** The question is currently improvised each time; José was still being asked three weeks after starting (*"no me queda todavía muy claro cómo es una semana normal tuya"*), and 1 of 51 intake forms ever stated available hours (`athlete-onboarding-flow.md` §4). The example is what makes free text work.

> {NOMBRE}, para armarte el plan alrededor de tu vida y no al revés, cuéntame cómo sería tu semana ideal. No la semana perfecta teórica — la que puedes sostener un mes seguido.
>
> Necesito, por día: **qué deporte, cuánto tiempo tienes, y a qué hora**. Y además: día de descanso preferido, acceso a piscina y gimnasio (qué días y en qué horario abren), y si algún día puedes hacer doble sesión.
>
> Un ejemplo de cómo me sirve la respuesta:
>
> *"Lunes: nada, entro temprano a la oficina. Martes a viernes: 1 hora en la mañana, 6 a 7 am, antes de que se despierte la familia. Jueves es el más apretado, mejor algo corto. La piscina la tengo martes y jueves nada más. Gimnasio en casa, de noche, después de acostar al chico. Sábado: puedo salir 2-3 horas temprano. Domingo: un par de horas. Descanso: lunes."*
>
> Con ese nivel de detalle te armo la semana y no la tenemos que estar corrigiendo.

*Anything vague comes back once, immediately, naming the missing piece — not three weeks later. `methodology.md` §3 lists what the perfect-week interview has to capture.*

### C3 · First two weeks — why the paces on the watch are wrong

Sent to every athlete, currently improvised each time.

> Te dejé cargadas las primeras 2 semanas. Una aclaración importante sobre los ritmos:
>
> Para darte el ritmo exacto necesitamos un test, que vamos a hacer en unas 2 semanas. Mientras tanto Training Peaks y el reloj te van a sugerir un ritmo **estimativo**. No le prestes atención.
>
> El ritmo de estas sesiones es este: **tienes que poder correr hablando en oraciones completas.** Si no puedes, vas demasiado rápido, aunque el reloj diga que vas bien.
>
> Algunas sesiones terminan con pasadas / strides: se hacen acelerando hasta llegar a una velocidad alta al final del intervalo. No tienen que cansarte cardiovascularmente — son para activar las piernas, que recuerden lo que es la velocidad.
>
> Dos cosas de setup para hoy:
> • Conecta Training Peaks con {GARMIN/POLAR/WAHOO} y confirma que la sesión de hoy te aparece en la app y en el reloj.
> • Si tienes Garmin Coach o un plan activo de otra app, desactívalo.
> • Las rutinas de gimnasio **no** se sincronizan al reloj: se ejecutan desde el teléfono, donde vas a poder marcar series, repeticiones, pesos y ver los videos de cada ejercicio.

### C4 · Test hygiene

Flagged in `open-loops.md` as the lowest-hanging item since day one — *"pure template, three languages, no form, no trigger, no schema"* — and in the transcripts it was delivered three different ways (a "revisa las instrucciones", two voice notes, a verbal explanation). Protocol source: `methodology.md` §3; do not edit the numbers here.

> {NOMBRE}, el {DÍA} hacemos el test. Es el dato del que sale todo el resto del plan, así que vale la pena hacerlo bien una vez. Las condiciones:
>
> • **Temprano en la mañana**, con fresco, descansado, comido e hidratado.
> • **Recorrido plano y sin interrupciones** — sin semáforos, sin cruces. Si tienes que parar, el test se invalida.
> • **Banda cardíaca obligatoria.** La muñeca no sirve para esto.
> • El día anterior: bajo en fibra. En el desayuno: carbohidratos blancos. Café, si lo usas, a la hora habitual.
> • **{PROTOCOLO}** — las instrucciones exactas están en la sesión en Training Peaks. Revísalas ahora y me dices si algo no queda claro.
> • Esfuerzo **10/10**. No es un entrenamiento duro, es un máximo real.
>
> Si sale mal — GI, mala dosificación, tuviste que parar — no pasa nada: diagnosticamos por qué y lo repetimos el fin de semana siguiente con las correcciones. Es normal.

### C5 · Test results + zones

> Resultados del test:
> • **Pace de umbral** (mejores 30'): {PACE}
> • **Pulsaciones en umbral** (últimos 20'): {LTHR} bpm
>
> {LECTURA: "muy buen test, bien ejecutado" / "el segundo tramo se cayó, lo repetimos"}
>
> Ya te seteo las zonas en Training Peaks. Conviene que configures el reloj con lo mismo, más que nada para que Garmin te calcule bien las zonas — para nosotros no hace falta, pero mejor si todo coincide:
> • LTHR (Lactate threshold heart rate) = {LTHR}
> • Zonas de frecuencia cardíaca como **% de LTHR**
>
> Nota: si entrenas en altura, tu umbral a nivel del mar va a estar unos 15–20 segundos por debajo de este. Lo tenemos en cuenta según dónde corras.

### C6 · Monday check-in

Three variants. The current message varies from one line to five numbered questions and sometimes carries an unrelated research question bolted on — which is fine occasionally and shouldn't be the default. The voice guide lives in `automation/coaching-checkin/monday-message-voice-guide.md`.

**Standard:**
> Hola {NOMBRE}, ¿cómo estás? Lunes de feedback, como cada semana.
>
> 1. ¿Cómo te fue la semana pasada — qué se sintió bien y qué podemos pulir?
> 2. ¿Necesitamos ajustar algo de esta semana o de las que vienen?
> 3. ¿Alguna novedad de viajes, agenda o carreras que deba considerar?

**When they didn't answer last week** (Sergio and Roberto P each went several weeks unanswered, with no change of approach):
> {NOMBRE}, ¿todo bien? No tuve feedback tuyo la semana pasada, así que planifiqué esta con lo que vi en los números.
>
> Te pido 30 segundos: {UNA_PREGUNTA_CONCRETA_SOBRE_UNA_SESIÓN_REAL}. Mi alcance como coach es tan bueno como lo que me compartes — con los datos solos veo la mitad.

**When something in the data needs a decision:**
> {NOMBRE}, antes del feedback, una cosa que vi: {OBSERVACIÓN_CONCRETA — "el segundo intervalo del 2x12 no llegó completo"}.
>
> {DECISIÓN — "antes de progresar en duración quiero ver una ejecución limpia, así que repetimos el 2x12 esta semana"}. ¿Cómo lo sentiste tú?

---

## 5. What came out of the review, and where it went

Resolved in the same session (August 12, 2026), recorded here as pointers so none of it gets re-raised:

- **Plan-publishing cadence — DECIDED, and it now lives in `methodology.md` §6.4.** Before the first test, week by week; after the first test, four weeks loaded ahead. It was the only service complaint two athletes raised unprompted, and they had been given opposite answers.
- **Referral offer — approved and queued as a build**, `open-loops.md` **NEXT #10**. $50 to the referrer after the referred athlete's second payment, `NOSTARTUP` for the person referred, ask discretionary and earned (~90 days, engaged athletes only). Text is B9; that item owns the attribution, list, payout-trigger and ledger work.
- **The TSS / CTL / ATL / TSB explainer — `open-loops.md` NEXT #11.** A proper long-form video plus written definitions on `/recursos/`, replacing the one-off Loom that B8 currently leans on. When it exists, **update B4 and B8 to link it** rather than the Loom.
- **C2 and C4 should be sent by automation, not by hand** — no judgement is involved in either. Folded into `athlete-onboarding-flow.md` §6, Stage 9, which already owns that work.
- **EN and PT versions** ride the members-area translation pass. The English source for A3 already exists verbatim in the Nadine transcript.
- **The A2 → A3 → A4 ordering is not being run as a measured experiment.** Iván's call: use it because it's better, report back with results. Deliberately not logged as an item.

### The hole in the evidence, stated plainly

**All 13 transcripts are athletes who bought.** Every conclusion in §0 about what makes someone convert was drawn from a sample containing no one who didn't — so the strongest claim any of it supports is *"this is what the winners looked like,"* never *"this is why they said yes."* The Nadine pattern could be a cause or it could be that Nadine was going to buy regardless and simply wrote a long enough first message to make mirroring possible.

**Iván is exporting the non-converted leads.** That is the sample that can actually falsify any of this, and the specific thing to look for is whether the losses got the *same* price-first sequence as the wins — because if they did, sequence isn't the variable, and something further up (lead quality, response time, channel) is.
