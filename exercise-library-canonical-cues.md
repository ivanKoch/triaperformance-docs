# Canonical cue drafts — members-area exercise library

**Working file. PARKED September 8, 2026 (D5): race landing pages take the WIP
slot first.** Every cue below is drafted and signed off; none of it is built.
**Retires the day `site/_data/exercises.json` is generated from it.**

Decisions and their reasoning: `exercise-library-decisions.md` — read that first,
it is the home doc. Raw dedup evidence: `members-exercise-dedup-review.md`
(regenerable with `automation/cluster-exercise-duplicates.js`; superseded by the
ledger and kept only as the working). Inventory: `data/members_exercises.csv`.

⚠️ **Nothing here needs re-deciding.** *A future session picking this up applies
the drafts, it does not re-open them.*

---

# Batch 1 — the nine clusters with 3+ copies

Working file. **Retires the day `site/_data/exercises.json` is built from it.**
Decisions go in `exercise-library-decisions.md`; this is the material they act on.

Format per cluster: the proposed canonical `cue` (movement description only),
then the `note` each placement keeps. A placement with `—` needs no note: its
original cue said nothing the canonical does not already say.

⚠️ **Three clusters carry a flag. Those are Iván's call and are marked 🚩.**

---

## 1. `catcow` — Gato-camello  *(6 copies; absorbs core's "Gato-vaca")*

> En cuadrupedia, alterna redondear y arquear la columna al ritmo de la respiración: exhala redondeando, inhala arqueando. Muévete desde la pelvis y deja que la columna la siga vértebra por vértebra, no en bloque — la mayoría hace lo contrario y solo mueve el cuello y los hombros.

| placement | note |
|---|---|
| activacion | — |
| core | Rango cómodo, no máximo: acabas de levantarte. |
| movilidad | Post-entreno esto es para soltar, no para movilizar fuerte. |
| recuperacion | Aquí tienes tiempo: hazlo el doble de lento de lo que harías antes de entrenar, y busca los segmentos que no se mueven. |
| core-ciclista | Esto es control articular, no un estiramiento. |
| core-corredor | Esto es control articular, no un estiramiento. |

*Minor:* the cyclist original said "control **pélvico y** articular". Unified to the
runner's wording since the two notes were otherwise identical. Say if the pelvic
half was load-bearing for the cyclist and it goes back.

## 2. `bridge` — Puente de glúteos  *(4 copies)*  🚩 hold time

> Pies apoyados cerca de los glúteos. Sube la cadera empujando con los talones y sostén dos segundos arriba apretando fuerte los glúteos — la pausa es el ejercicio, el movimiento es solo cómo llegas ahí. Baja controlado, sin arquear la lumbar. Si lo sientes en los isquios, acerca los pies.

| placement | note |
|---|---|
| activacion | — |
| core | Busca abrir el frente de la cadera, que es lo que el avión y la silla te cerraron. |
| rodillas | — |
| core-ciclista | La pausa es lo que despierta el glúteo; sin ella son quince repeticiones de nada. |

✅ **RESOLVED (D2c): two seconds everywhere.** ~~`activacion` prescribes a ONE-second squeeze; the other three say two.** One
canonical cue can only carry one number. Not drift — possibly deliberate, since
activación is a warm-up and the others are strength work.~~

## 3. `deadbug` — Dead bug  *(4 copies)*

> Boca arriba, brazos al techo y rodillas a 90°. Extiende brazo y pierna contrarios, lentos, sin que la lumbar se despegue del piso ni un milímetro. Exhala fuerte mientras la pierna se extiende — es la exhalación la que aplana la espalda contra el suelo, no la fuerza abdominal. Si la lumbar se levanta, baja menos la pierna.

| placement | note |
|---|---|
| activacion | — |
| core | — |
| recuperacion | — |
| core-ciclista | Es la capacidad de mantener el tronco rígido mientras las piernas se mueven en rango amplio, que es literalmente pedalear. |

## 4. `birddog` — Bird dog  *(4 copies)*  🚩 one does not belong

> En cuadrupedia, extiende brazo y pierna contrarios hasta la línea del tronco y sostén dos segundos arriba. La cadera queda cuadrada al piso: si se abre hacia un costado, bajaste el estándar del ejercicio para poder estirar más. Imagina un vaso de agua apoyado en la lumbar que no se puede volcar.

| placement | note |
|---|---|
| core | — |
| recuperacion | — *(was three seconds; **now two** per D2c)* |
| core-ciclista | Aprieta el glúteo al estirar la pierna. |
| ~~core-corredor~~ | ✅ **SPLIT — own entry `birddog-dynamic`, shares the video (D2a)** |

🚩 **`core-corredor`'s "Bird dog dinámico" is a different exercise.** Its cue says
*"alterna sin pausas largas"* — the explicit opposite of a two-second hold — and
its purpose is the cross-gait pattern, *"hombro contra glúteo opuesto, que es el
que sostiene la zancada"*. **Recommend keeping `birddog-dynamic` as its own
library entry** sharing the same video. Merging it would silently convert a
runner's dynamic drill into an isometric hold.

## 5. `hipflexSqueeze` — Psoas con apriete de glúteo  *(3 copies)*

> Media rodilla en el piso, pie de adelante plano. Aprieta fuerte el glúteo de la pierna de atrás antes de avanzar la cadera — ese apriete es lo que apaga el psoas y lo deja estirar de verdad. Es la clave del ejercicio.

| placement | note |
|---|---|
| activacion | — |
| core-ciclista | Después de horas de sillín, este es el estiramiento que más te devuelve. |
| core-corredor | Corriendo se acorta kilómetro a kilómetro; es el estiramiento que más te devuelve. |

✅ **This merge fixes a live bug.** Activación's cue currently opens *"Misma
posición, pero…"* — it only parses if you have just read the exercise above it in
that one routine. Any reordering, or a subscriber landing mid-list, gets a
sentence with no referent. The canonical cue stands alone.

## 6. `wgs` — El mejor estiramiento del mundo  *(3 copies; absorbs core's "World's greatest stretch")*

> Zancada profunda con el pie adelantado por fuera de la mano. Baja el codo de adentro hacia el piso, aguanta un segundo, y después rota ese brazo abriendo hacia el techo siguiendo la mano con la mirada. Cadera, aductor, columna torácica y tobillo en un solo movimiento.

| placement | note |
|---|---|
| activacion | — |
| core | Es la mejor transición que existe hacia los estiramientos profundos. |
| recuperacion | Sostén arriba tres respiraciones antes de volver. |

*Name:* Spanish wins — it is the name on two of three pages, and the third was an
untranslated English title sitting on a Spanish page.

## 7. `swingFB` — Balanceo de pierna (frontal)  *(3 copies)*  🚩 one is two exercises

> Apóyate en una pared y balancea la pierna adelante y atrás. Aumenta el rango poco a poco — arrancar en el rango máximo es cómo se tira un isquio antes de correr.

| placement | note |
|---|---|
| activacion | — |
| rodillas | — |
| ~~recuperacion~~ | ✅ **SPLIT into `swingFB` + `swingLat` (D2b)** |

🚩 **`recuperacion`'s "Balanceo de piernas" is front-back AND lateral in one
entry** — *"y después cruzada de lado a lado"*. The lateral swing already exists
as its own exercise (`swingLat`, "Balanceo lateral de pierna") in activación and
rodillas. So recuperación either splits into the two existing exercises, or stays
as a third combined entry.

## 8. `thread` — Thread the needle  *(3 copies)*

> En cuadrupedia, pasa un brazo por debajo del cuerpo apoyando el hombro; después abre ese mismo brazo hacia el techo siguiendo la mano con la mirada. La cadera se queda quieta y encuadrada — la rotación sale de la columna dorsal.

| placement | note |
|---|---|
| core *(variant)* | — |
| core-ciclista | Es exactamente lo que se te traba después de horas en el manillar. |
| core-corredor | Todo el circuito de hoy entrena a no rotar; para eso el tórax tiene que poder rotar, o la lumbar rota en su lugar. |

## 9. `slBridge` — Puente de glúteos a una pierna  *(3 copies)*

> Un talón apoyado cerca de los glúteos, la otra rodilla abrazada al pecho. Empuja con el talón y aprieta el glúteo arriba. Si lo sientes en la lumbar, la cadera se te fue en anteversión — mete la pelvis y baja la altura.

| placement | note |
|---|---|
| aquiles | Cadena posterior fuerte, menos trabajo de frenado para abajo. |
| rodillas | — |
| core-ciclista | La idea es aislar el glúteo, no que el psoas dominante haga otra vez todo el trabajo. |

---

**Six of nine merge cleanly.** Clusters 1, 3, 5, 6, 8 and 9 need no coaching
decision — the canonical cue is the fullest existing description and every
context sentence survives as a note. The three flagged ones are in
`exercise-library-decisions.md` as D2a / D2b / D2c.


---

# Batch 2 — the seventeen two-copy clusters

Working file, same contract as batch 1: **retires the day
`site/_data/exercises.json` is built.** Canonical `cue` = movement description
only; every context sentence survives as that placement's `note`.

✅ **All seventeen resolved September 8, 2026** (D2d, D2e).

---

## 1. `fig4` — Figura 4
> Cruza un tobillo sobre la rodilla contraria y trae la pierna de abajo hacia el pecho. Empuja suave la rodilla cruzada hacia afuera con el codo. Empieza por el lado que sientes más rígido.

activacion — *Casi todos tenemos un lado más rígido, y ese es el que necesita los segundos.* · movilidad — —

## 2. `twist` — Torsión espinal
> Acostado, lleva una rodilla cruzada al lado opuesto con los brazos abiertos y la mirada al lado contrario. El hombro no se despega del piso — si se despega, baja la rodilla. Suelta un poco más en cada exhalación.

activacion — — · movilidad — —

## 3. `hamTowel` — Isquios con toalla
> Toalla en la planta del pie, pierna extendida hacia el techo. Tira desde la toalla, no desde el cuello. La otra pierna queda apoyada en el piso.

activacion — — · movilidad *(variant)* — —

## 4. `childReach` — Postura del niño con alcance lateral
> Desde la postura del niño, camina las manos hacia un costado hasta sentir el dorsal por el lateral del tronco. La cadera se queda atrás, no la sigas con el tronco.

activacion — — · movilidad — —

## 5. ✅ RESOLVED (D2d) — movilidad moves to the `hipflexSqueeze` cluster
The pass matched movilidad's *"Psoas de rodillas con apriete"* to activación's
plain *"Psoas de rodillas"*. **It joins the batch-1
squeeze cluster instead** (`hipflexSqueeze`, batch 1 §5) — its cue prescribes the
glute squeeze, which is the entire difference between the two.

*Why this matters beyond one row:* activación deliberately carries **both** as a
base/progression pair — `hipflex` (mete la pelvis) and `hipflexSqueeze` (misma
posición, pero aprieta el glúteo). Filing movilidad's under the base version
would merge a progression into its own regression.

## 6. `swingLat` — Balanceo lateral de pierna  *(also gains recuperación's placement via D2b)*
> De frente a la pared, cruza la pierna de lado a lado por delante del cuerpo. Abre aductores y despierta la cadera externa.

activacion — — · rodillas — — · recuperacion — *(new placement, D2b)*

## 7. `thoracicRot` — Rotación torácica en cuadrupedia
> En cuatro puntos, una mano detrás de la cabeza. Lleva el codo hacia la rodilla contraria y después abre rotando el torso, siguiendo el codo con la mirada. La cadera se queda cuadrada — si se va contigo, estás rotando desde la lumbar y no desde la espalda alta.

activacion — *Es la espalda alta la que te falta para respirar.* · recuperacion — —

## 8. `ytw` — Y-T-W boca abajo
> Boca abajo, frente apoyada, pulgares al techo. Despega los brazos en Y, después en T (en cruz), después en W (codos a 90° junto a las costillas, juntando las escápulas). Las escápulas van hacia abajo, nunca hacia las orejas: si te encoges, el trabajo se lo lleva el trapecio superior.

activacion — — · recuperacion — —

## 9. `stickPass` — Pasada de bastón (con tope)
> Agarre muy ancho, brazos estirados, pasa el bastón de los muslos hacia la espalda baja y vuelve. Esto no es un concurso de flexibilidad: detente donde se te abran las costillas, se te arquee la lumbar o se te suban los hombros. Si tienes que forzar, achica el agarre.

activacion — *El frente del hombro de un nadador suele estar de sobra suelto; lo que buscas aquí es la espalda alta, no ganar rango adelante.* · recuperacion *(variant)* — —

## 10. `slBridgeSimple` — Puente a una pierna
> Un pie apoyado, la otra rodilla al pecho. Sube la cadera empujando con el talón y mantén la pelvis pareja, sin que un lado se caiga. Si se cae, baja el rango o hazlo con las dos piernas.

core *(variant)* — — · recuperacion — —

## 11. `bridgeMarch` — Puente con marcha
> Puente arriba y sostenido, y desde ahí despega un pie unos centímetros, apoya, y cambia. La cadera no baja y no rota. Despacio: esto es control, no repeticiones.

core *(variant)* — — · recuperacion — —

## 12. `couchStretch` — Couch stretch  ✅ RESOLVED (D2e): one entry, wall canonical
> De rodillas de espaldas a la pared, la rodilla de atrás en el rincón y el empeine apoyado en la pared, el otro pie adelante en zancada. Mete la pelvis y aprieta el glúteo de la pierna de atrás antes de buscar más rango — sin eso estiras la lumbar y no el cuádriceps.

core — *Sin pared: rodilla contra la base de la cama y el empeine apoyado arriba. Sesenta segundos por lado y vas a sentir el viaje entero salir de ahí.* · rodillas — — · movilidad *(variant)* — *Casi nadie necesita subir el tronco tanto como cree.*

## 13. `child` — Postura del niño
> Sentado sobre los talones, brazos largos adelante, frente hacia el piso. Respira largo y profundo hacia la espalda baja, y deja que la cadera baje un poco más con cada exhalación.

movilidad — *Aquí el objetivo es bajar pulsaciones, no estirar más.* · core-ciclista — *No es relleno: es donde el sistema baja de revoluciones después de 20 minutos de tensión.*

## 14. `openBook` — Libro abierto
> De costado, rodillas flexionadas y apiladas, brazos juntos adelante. Abre el brazo de arriba siguiendo la mano con la mirada y deja las rodillas quietas. Si las rodillas se separan, la rotación se te fue a la lumbar.

movilidad — — · recuperacion — *Quédate cinco respiraciones donde llegues antes de volver.*

## 15. `thoracicRoller` — Extensión torácica en el rodillo
> Rodillo cruzado bajo la espalda alta, manos detrás de la nuca. Extiende hacia atrás sobre él soltando el aire, después muévelo dos dedos hacia arriba y repite, segmento por segmento. **Nunca por debajo de las últimas costillas** — ahí se extiende la lumbar, que no es la que está rígida. Los glúteos quedan apoyados.

⚠️ *Drafting note: the two originals carried **different** safety cues — "la lumbar
no se arquea, los glúteos quedan apoyados" (recuperación) and "nunca abajo de las
últimas costillas" (hombro). **Both are kept.** Neither was redundant; they guard
the same error by different means, and dropping either to shorten the cue would
have removed a real guardrail.*

recuperacion *(variant)* — — · hombro — —

## 16. `extRotIso` — Rotación externa isométrica
> Parado de costado a un marco de puerta o una pared, codo pegado a las costillas y flexionado a 90°, el dorso de la mano contra el marco. Empuja hacia afuera al 50% y sostén. Nada se mueve: que el hombro no se vaya adelante y el codo no se separe de las costillas.

recuperacion — — · hombro — *Arranca siempre por aquí: si hoy te molesta, esto baja el dolor y te deja hacer el resto con buena técnica en vez de esquivándolo.*

## 17. `sideRaise` — Elevación lateral acostado
> De costado, pierna de arriba recta y la punta del pie apuntando levemente hacia el piso. Sube lento. Tiene que arder en el lateral del glúteo — si lo sientes en la ingle, estás rotando la pierna.

aquiles — *Lo que la cadera no estabiliza arriba, el tobillo lo compensa abajo.* · rodillas — —


---

# Batch 3 — the 73 tier-C pairs, triaged

Working file. **Retires when `site/_data/exercises.json` is built.**

**61 of the 73 are noise** and need no decision: they are family resemblance
between exercises that are already, correctly, separate entries — *Puente de
glúteos* against *Puente de glúteos a una pierna*, *Dead bug* against *Dead bug
isométrico*, *Plancha lateral* against *Plancha lateral dinámica*. The pass
flagged them because a base movement and its progression share vocabulary. **A
progression is not a duplicate**; merging any of these would delete a
prescription.

That leaves **8 real merges** and **4 real decisions**.

---

## Merging — naming drift only, no coaching change

| canonical | absorbs | note kept from |
|---|---|---|
| `openBook` · **Libro abierto** | hombro's *Apertura torácica (libro abierto)* | hombro's *"si la espalda alta no rota, el hombro busca el rango que le falta"* |
| `crossBody` · **Estiramiento cruzado de hombro** | movilidad's *Cruce de hombro* | both — push from the elbow, and depress the scapula first |
| `wallAngel` · **Ángeles de pared** | recuperación's *Ángeles en la pared* | both stop rules — *"frena donde algo se despegue"* and *"si la lumbar se despega o las muñecas se van"* |
| `rollQuad` · **Rodillo: cuádriceps** | movilidad's *Cuádriceps con rodillo* | both — medium pressure, and stop-and-flex on a sore point |
| `ballPec` · **Pelota: pectoral menor** | movilidad's *Pectoral menor con pelota* | ⚠️ both — *"no se rodea, se sostiene"* **and** hombro's nerve warning |
| `sidePlankRaise` · **Plancha lateral con elevación de pierna** | core's *Plancha lateral + elevación de pierna* | core-ciclista's knee-collapse rationale |
| `ankleKick` · **Flexión plantar activa** | activación's *Tobillos para la patada* | activación's *"si vienes de correr, este es tu punto débil en el agua"* |
| `fig4` · **Figura 4** | movilidad's *Figura 4 boca arriba*, core-corredor's *Figura de 4*, core's *Figura 4 acostado* | core-corredor's post-long-run rationale |

**`Figura 4 sentado` stays its own entry** — it is done seated on the edge of a
bed, which is a different position, not a different wording.

## Decided without asking — say if either is wrong

- **`Y-T-W boca abajo` and `I-Y-T boca abajo` stay separate.** Different letters
  mean different arm positions: W is elbows at 90° beside the ribs, I is arms
  straight overhead. The shoulder artifact also prescribes its own progression
  (*"sin peso las tres veces primero"*). Same family, different prescription.
- **`Barridos 90-90 de cadera` and `Cadera 90/90` stay separate.** Same seated
  position, different movement: core sweeps the knees like a windshield wiper,
  recuperación leans over the front leg and then transitions side to side
  *without using the hands* — and its cue says that transition **is** the
  exercise.

## Resolved by Iván — both consolidate rather than split

- **`rollCalf` — one entry, and the Achilles restriction becomes the cue for
  everyone** (D3a). *"Nunca pases el rodillo por el tendón"* now applies in
  movilidad and rodillas too. **The safest cue became the default rather than the
  narrowest exception** — nobody should be rolling an Achilles tendon, so the
  restriction was never really aquiles-specific.
  > Gemelo sobre el rodillo, la otra pierna cruzada encima para cargar. **Solo la parte carnosa** — de debajo de la rodilla hasta donde el músculo se vuelve tendón, y ahí paras. **Nunca pases el rodillo por el tendón de Aquiles**: es tejido muy inervado y la fricción ahí solo lo irrita más. Párate 20 segundos en el punto que más se queja en vez de ir y venir rápido.

  aquiles — — · movilidad — — · rodillas — *Gemelos duros restan movilidad de tobillo, y lo que el tobillo no absorbe lo absorbe la rodilla.*

- **`balance` — one entry, eyes closed as recuperación's note** (D3b).
  > Parado en una pierna, rodilla apenas flexionada, mirando un punto fijo. Que la cadera no se caiga del lado que está en el aire — ese descenso es exactamente lo que le pasa a tu pelvis en cada zancada. Si te resulta fácil, cierra los ojos.

  rodillas — — · recuperacion — *Hoy hazlo con los ojos cerrados, con una pared o una silla al alcance de la mano — se pierde el equilibrio, esa es la idea. Busca que el pie trabaje: dedos activos, tobillo corrigiendo.*
