# Lead magnet — Las sesiones que hacen crecer cada zona

**Home doc for this deliverable.** Source content for the PDF promised by the zone calculator's email capture ("Un email con las sesiones por zona para el deporte que elegiste"). Decisions and open questions live here; the build record goes to `ai-infrastructure-documentation.md`.

**Status:** content approved and **built as three PDFs — ES, EN and PT — August 13, 2026** — `sesiones-por-zona.pdf` / `training-zone-sessions.pdf` / `sessoes-por-zona.pdf` in `site/assets/guias/`, 16 pages each, three sports each. Every word lives in `automation/lead-magnet-content.js`, keyed by language; the builder is template only. Build one with `node automation/build-lead-magnet-pdf.js <es|en|pt>`. **Not yet wired to `/api/zone-workouts`**, which is the remaining blocker: the calculator's capture posts to an endpoint that does not exist, so nothing delivers this file yet.

**The PDF is generated, not hand-made:** `automation/build-lead-magnet-pdf.js` renders branded HTML through headless Chromium. Re-running it is one command, which is the point — the zone percentages in this guide are copies of `data/zones.csv`, and the whole reason the source doc needed correcting in the first place was a copy that drifted. *The session text lives in the script's DATA block, not parsed out of this markdown: parsing prose to rebuild prose is fragile. If the two disagree, this file is the doc and the script is the artefact — fix both in the same session.*

**Design decisions worth keeping:** white typographic cover, not a blue slab — brand-guidelines §6 names High North (white-dominant, typography doing the work) as the reference, and separately a full-bleed colour panel does not survive Chromium's print margin box, so the blue version rendered as an inset rectangle with an uneven gutter. Zone X and Y are tinted in every table and get a darker zone marker, so the two zones the whole model exists to separate are visually separated too. The CTA page carries `page-break-inside: avoid` on purpose: the first build spilled the closing line onto a page of its own, which reads as a mistake at exactly the moment the document asks for money.

**CTA order (Iván, August 13, 2026): All-Access first, coaching second, single plan third.** All-Access is built, recurring, near-zero marginal effort and sitting at 2 subscribers — its constraint is distribution, and a reader who has just tested, calculated zones and read the sessions is the most qualified audience it will ever get. 1:1 at $149 is second because it converts slowly from a cold PDF and it costs Iván's calendar, which the roadmap protects. The closing line offers to say "ninguno" — kept deliberately; it is the same honesty the reviews already describe.

---

## Provenance and what was corrected

Source: Iván's `8020 workout guide.md`, August 13, 2026. The prose, structure and session ideas are his. **What changed was the zone model, which had drifted from `data/zones.csv` in four ways** — corrected here without preserving the originals inline, because this is a draft that never shipped, not a published doc being amended:

1. **Zone 4 and 5 were named and described one zone too high.** The source called Z4 "VO2 Max" and Z5 "Capacidad Anaeróbica / Sprint". The repo names them **Umbral alto** ("intensivo de umbral, la otra sesión clave") and **VO2máx** ("series cortas, poco volumen, alto costo") — `site/_data/zoneCopy.json`. The VO2max sessions moved from Z4 to Z5 with the name; Z4 gained the intensive-threshold sessions it was missing.
2. **Z4 and Z5 boundaries were wrong.** Source: Z4 = 102–110% LTHR, Z5 = ">110%". Repo: **Z4 = 102–105%, Z5 = 105–120%**.
3. **%FCmáx appeared as a second reference metric** ("90-95% de tu FC Máxima"). Nothing in this business is anchored on max HR — every zone in `zones.csv` is a percentage of threshold. Removed.
4. **Percentages were given for heart rate only**, then described in pace terms. The three metrics genuinely differ (running Z4 is 102–105% by HR and 102–115% by pace) and the calculator now shows all three side by side. Both are given here.

**Cycling** (source: Iván's second doc, same day) needed every band rewritten, not just the top two: the source used a classic Coggan-style FTP ladder (Z2 = 56–75%, ZX = 76–85%, Z3 = 86–95%, ZY = 96–105%) against the repo's threshold-anchored one (Z2 = 70–83%, ZX = 83–91%, Z3 = 91–100%, ZY = 100–102%). Same Z4/Z5 one-zone shift as running. Two sessions also contradicted their own zone and were repitched: `4 x 10 min al 90% FTP` sat in Zone 3 while 90% FTP is Zone X, and `2 x 20 al 100% FTP` — the most standard threshold session in cycling — was filed under a zone the doc called residual and pre-race-only. It now anchors Zone 3, where it belongs.

**Swimming** was the largest correction, and the only one that would have actively hurt an athlete. The source prescribed zones as fixed offsets from CSS (`Z1 = CSS + 6–8 s/100m`, `Z2 = CSS + 3–5 s`). Against `zones.csv`, for a 1:30/100m swimmer, Z1 is **CSS +17 to +30 s** and Z2 is **CSS +9 to +17 s** — so the source's easy zones were 10 to 25 seconds per 100 too fast, putting every aerobic swim at or above threshold. It also merged ZX with Z3 and ZY with Z4, which contradicts the calculator the reader has just used: it prints seven swim rows. **And fixed second-offsets cannot be right in principle** — Z2 is CSS +7/+14 for a 1:15 swimmer and CSS +12/+23 for a 2:00 swimmer. The guide now gives percentages and lets the calculator do the arithmetic.

*Standing rule for this doc: the percentages below are copies. `data/zones.csv` owns them. If they move there, they move here in the same session.*

---

## Cómo leer los números

El modelo es polarizado 80/20: cerca del 80% del volumen se mantiene suave, el 20% es realmente intenso. Hasta ahí, cinco zonas alcanzarían. Las otras dos existen por un motivo distinto.

**La X y la Y no son zonas nuevas.** Son pedazos que les recortamos a la Zona 2 y a la Zona 4. Les dimos nombre propio porque a las dos las queremos evitar — y no se pueden evitar zonas que no tienen nombre. Lo interesante es que las evitamos por razones exactamente opuestas.

**Zona X — la parte rápida de la Zona 2.** Es el techo de tu Zona 2. Sale bastante más cara en fatiga y te devuelve prácticamente el mismo estímulo aeróbico que si hubieras ido más lento: pagás más y te llevás lo mismo. Es el error más común del entrenamiento de resistencia, y casi nunca es una decisión — salís a hacer un rodaje suave, te sentís bien, el ritmo se acomoda solo unos segundos, y terminás la semana con la fatiga de una sesión de calidad que nunca hiciste y sin piernas para la que sí tenías programada. La excepción es el maratón y el Ironman: ahí la Zona X es tu ritmo de competición y hay que entrenarla a propósito.

**Zona Y — el piso de la Zona 4.** También se evita, pero la intuición es la contraria: no es que sobre, es que no alcanza. Tu umbral no es una línea fija — se mueve con la forma, el descanso, el calor y el día. Entrenar justo al 100% de tu número no te garantiza nada: si ese día tu umbral real está un poco más arriba, la sesión te quedó corta y las adaptaciones no llegaron. Pagaste el costo de una sesión de umbral sin comprar el beneficio. Para asegurarlas hay que entrenar un poco por encima: desde el **102%**, que es justamente el piso de la Zona 4. La Zona Y es esa franja de duda entre el 100 y el 102, y se entrena sólo cuando es tu ritmo exacto de competición.

*(Iván, August 13, 2026 — this is the intuition the guide was missing. Naming X and Y without explaining that they are carved out of Z2 and Z4, and avoided for opposite reasons, left a reader who does not already know the model unable to tell whether these zones are good or bad.)*

Todos los porcentajes son **sobre tu umbral**, no sobre tu frecuencia cardíaca máxima. Y no coinciden entre métricas: el ritmo, el pulso y la potencia se comportan distinto en los extremos. Por eso vas a ver dos columnas.

| Zona | % FC (LTHR) | % ritmo | Para qué sirve |
|---|---|---|---|
| 1 · Recuperación | 72–81% | 60–76% | Circulación, movilidad, días off activos |
| 2 · Aeróbico base | 81–90% | 76–87% | Donde vive el 80% de tu volumen |
| X · Aeróbico alto | 90–95% | 87–93% | Ritmo de maratón |
| 3 · Tempo | 95–100% | 93–100% | Extensivo de umbral. Sesión clave |
| Y · Umbral bajo | 100–102% | 100–102% | La franja justo alrededor del umbral |
| 4 · Umbral alto | 102–105% | 102–115% | Intensivo de umbral. La otra sesión clave |
| 5 · VO2máx | 105–120% | 115–140% | Series cortas, poco volumen, alto costo |

**Qué métrica manda al correr:** potencia > ritmo > frecuencia cardíaca. El pulso reacciona con retraso al esfuerzo, así que es el respaldo, no la señal principal, cuando hay una métrica mejor disponible. La excepción son los días fáciles, donde la FC funciona bien como techo.

---

## Zona 1 · Recuperación — 72–81% FC · 60–76% ritmo

**Qué es.** La intensidad más baja. Se siente casi incómodamente lento y requiere retenerte a propósito.

**Qué adapta.** Facilita el flujo sanguíneo a los músculos dañados y acelera la limpieza de desechos metabólicos sin introducir estrés nuevo que a su vez haya que recuperar.

**Sesiones**

1. **Trote regenerativo** — 20 a 40 minutos muy suaves, el día después de una sesión dura.
2. **Calentamiento y vuelta a la calma** — 10 a 15 minutos antes y después de cualquier sesión de calidad.

**Qué no hacer.** No mires el reloj buscando un ritmo digno. Si te preocupa que el ritmo parezca lento —o lo que se vea en Strava— vas a empujar a Z2 o ZX y el día pierde su función.

**Cuánto.** ~20–25% del tiempo semanal.

---

## Zona 2 · Aeróbico base — 81–90% FC · 76–87% ritmo

**Qué es.** Tu ritmo de rodaje natural. Tenés que poder sostener una conversación completa sin que se te corte la respiración.

**Qué adapta.** Desarrollo mitocondrial, más capilares, mejor uso de la grasa como combustible, resistencia a la fatiga. Es la zona que construye el motor.

**Sesiones**

1. **Tirada larga** — 90 a 120+ minutos continuos.
2. **Rodaje base** — 45 a 60 minutos, mantenimiento aeróbico entre semana.
3. **Rodaje con progresión** — 60 minutos: 15' en Z1 y el resto en Z2, terminando en la mitad alta de la zona sin cruzarla.

**Qué no hacer.** No aceleres en las subidas ni cierres con un sprint hasta casa. Eso dispara el pulso y te mete en el agujero negro de la intensidad moderada.

**Cuánto.** ~55–60% del tiempo semanal. Es la base de todo el plan.

---

## Zona X · Aeróbico alto — 90–95% FC · 87–93% ritmo

**Qué es.** Ritmo de maratón. Suma bastante más fatiga que la Z2 sin sumar mucho más beneficio aeróbico — **es la zona donde más gente entrena de más sin darse cuenta.** Se prescribe a propósito o no se pisa.

**Qué adapta.** Resistencia específica a la fatiga al ritmo de competición larga, y economía a esa velocidad exacta.

**Sesiones — solo en bloque de maratón o Ironman**

1. **Larga con calidad** — 45–60 minutos en Z2, después 40–50 minutos en Zona X, 10' de vuelta a la calma.
2. **Bloques fraccionados** — 3 x 20 minutos en Zona X con 5' en Z1 entre bloques, dentro de una tirada larga.

**Qué no hacer.** No caigas acá por accidente en un día fácil. Si no estás preparando una distancia larga, evitala.

**Cuánto.** 0% si no estás en bloque de maratón o IM. En bloque, 5–10%, y se descuenta del 20% intenso — no es una zona barata.

---

## Zona 3 · Tempo — 95–100% FC · 93–100% ritmo

**Qué es.** Cómodamente duro. Para la mayoría cae cerca del ritmo de medio maratón; el ritmo que podrías sostener una hora entera está en el borde superior de la zona, no en el medio.

**Qué adapta.** Aumenta la capacidad de reciclar lactato —lo que sube el umbral— y mejora la resistencia a velocidades submáximas. Es una de las dos sesiones clave de la semana.

**Sesiones**

1. **Tempo continuo** — 15' Z1 + 20 a 30 minutos sostenidos en Z3 + 10' Z1.
2. **Intervalos cruise** — 4 x 8 minutos en Z3 con 2 minutos en Z1.
3. **Tempo fraccionado largo** — 3 x 15 minutos en Z3 con 3 minutos en Z1. Sesión avanzada: 45 minutos de trabajo, no la pongas antes de tener varios meses de tempos continuos encima.

**Qué no hacer.** Convertir el tempo en carrera. Si te vas a Z4, perdés el propósito metabólico y llegás fatigado a la sesión siguiente.

**Cuánto.** ~5–10%.

---

## Zona Y · Umbral bajo — 100–102% FC · 100–102% ritmo

**Qué es.** La franja finísima justo alrededor del umbral. Demasiado exigente para sostenerla como un tempo, y demasiado suave para dar las adaptaciones de VO2máx.

**Dónde vive en la práctica:** es territorio de **15k**, y son los **últimos 3 kilómetros de un medio maratón** — cuando ya no queda nada que administrar y el ritmo sube solo. Si tenés que ponerle una carrera, esa es. Fuera de ahí, es una zona rara de entrenar a propósito.

**Qué adapta.** Tolerancia a trabajar exactamente en el umbral, y familiaridad con ese ritmo si es tu ritmo de competición.

**Sesiones — solo si competís a este ritmo**

1. **Simulacro de carrera** — 3 x 10 minutos en Zona Y con 3' de recuperación.
2. **Medio maratón por el final** — 30 minutos continuos en Z3 y, sin pausa, 10 minutos en Zona Y. Entrena exactamente lo que decide un medio: cerrar por encima del umbral con 18 kilómetros en las piernas. Es la sesión que más justifica que esta zona exista.
3. **Bloques cortos** — 5 x 5 minutos en Zona Y con 90 segundos suaves.

**Qué no hacer.** Programarla de rutina. Si no estás preparando una distancia que se corre exactamente a este ritmo, la Z3 y la Z4 hacen el mismo trabajo mejor repartido.

**Cuánto.** Residual fuera de bloques de competición.

---

## Zona 4 · Umbral alto — 102–105% FC · 102–115% ritmo

**Qué es.** Intervalos por encima del umbral, más largos que una serie de VO2máx y más cortos que un tempo. Es **la otra sesión clave** de la semana junto con la Z3: la Z3 acumula volumen a umbral, la Z4 acumula intensidad justo por encima.

**Qué adapta.** Sube el umbral por arriba en lugar de por abajo: mejora la capacidad de tolerar y reciclar lactato a velocidades que no podrías sostener media hora.

**Sesiones**

1. **Series largas de umbral** — 5 x 6 minutos en Z4 con 2 minutos en Z1.
2. **Series medias** — 8 x 3 minutos en Z4 con 90 segundos en Z1.
3. **Bloques dobles** — 2 x 12 minutos en la parte baja de la Z4 con 3 minutos en Z1.

**Qué no hacer.** No la corras a ritmo de 5k. La Z4 por ritmo llega hasta el 115%, pero estas sesiones viven en la mitad baja de esa franja: si arrancás demasiado rápido, la sesión se convierte en VO2máx a medias y no cumple ninguna de las dos funciones.

**Cuánto.** ~5–8%.

---

## Zona 5 · VO2máx — 105–120% FC · 115–140% ritmo

**Qué es.** Series cortas, poco volumen, alto costo. Ritmo de 3k a 5k en la parte baja de la zona; por encima, trabajo neuromuscular puro.

**Qué adapta.** Aumenta el VO2máx, mejora el volumen sistólico y optimiza la economía de carrera de forma marcada.

**Sesiones**

1. **Series clásicas de VO2máx** — 6 x 800 metros con 2 a 3 minutos de recuperación (trote muy suave o caminata).
2. **Intervalos por tiempo** — 5 x 3 minutos con 2 a 3 minutos de recuperación.
3. **Series cortas** — 10 a 12 x 400 metros con 90 segundos a 2 minutos.

**Trabajo neuromuscular** (cuestas cortas, rectas progresivas): 8 a 10 x 15 segundos en subida a tope, bajando caminando, con 2 a 3 minutos entre repeticiones. **No se prescribe por zona sino por duración y esfuerzo máximo** — el esfuerzo termina antes de que el pulso llegue a ningún lado, así que ni la FC ni la zona te dicen nada útil acá. Van al final de un rodaje suave, en dosis muy chicas.

**Qué no hacer.** Recortar los descansos por falso heroísmo. Si acortás la recuperación vas a llegar a la serie 5 tan cansado que el ritmo se cae a Z3 y la sesión deja de ser VO2máx. Tenés que poder repetir el mismo ritmo en la última serie que en la primera.

**Métricas.** Acá el ritmo es lo único que manda. La FC llega tarde: si esperás a que el pulso suba para regular, el primer minuto lo corriste como un sprint y la serie se arruina. Salí al ritmo objetivo desde el segundo cero.

**Cuánto.** ~2–5%, incluyendo el trabajo neuromuscular.

---

## Reparto semanal

| Zona | % del tiempo semanal |
|---|---|
| 1 · Recuperación | 20–25% |
| 2 · Aeróbico base | 55–60% |
| X · Aeróbico alto | 0% general · 5–10% en bloque de maratón/IM |
| 3 · Tempo | 5–10% |
| Y · Umbral bajo | Residual |
| 4 · Umbral alto | 5–8% |
| 5 · VO2máx | 2–5% |

Suma cerca de 100% en cualquier combinación válida: si estás en bloque de maratón, la Zona X sale del presupuesto intenso, no del fácil.

---
---

# Ciclismo — métrica principal: potencia (FTP)

| Zona | % FTP | % FC (LTHR) | Para qué sirve |
|---|---|---|---|
| 1 · Recuperación | 50–70% | 72–81% | Circulación, días off activos |
| 2 · Aeróbico base | 70–83% | 81–90% | Donde vive el 80% de tu volumen |
| X · Aeróbico alto | 83–91% | 90–95% | Ritmo de 70.3 e Ironman |
| 3 · Tempo | 91–100% | 95–100% | Extensivo de umbral. Sesión clave |
| Y · Umbral bajo | 100–102% | 100–102% | La franja justo alrededor del FTP |
| 4 · Umbral alto | 102–110% | 102–105% | Intensivo de umbral. La otra sesión clave |
| 5 · VO2máx | 110–150% | 105–120% | Series cortas, poco volumen, alto costo |

**Qué métrica manda:** potencia, siempre. La FC va detrás con varios minutos de retraso y en intervalos cortos no sirve para pautar nada. Sí sirve para una cosa que la potencia no te dice: el desacople. Si a las tres horas seguís en Z2 de vatios pero el pulso se fue a Z3, tu Zona 2 metabólica se terminó por hoy.

## Zona 1 · Recuperación — 50–70% FTP

**Qué es.** El paseo de café. Las piernas giran sin resistencia.

**Qué adapta.** Circulación para limpiar desechos metabólicos sin reclutar fibra rápida ni sumar fatiga central.

**Sesiones**

1. **Rodillo regenerativo** — 30 a 45 minutos a cadencia alta (90+ rpm) sin resistencia.
2. **Calentamiento y vuelta a la calma** — 15 minutos suaves antes y después de un bloque de intervalos.

**Qué no hacer.** Empujar en los repechos. En la calle, la tentación de pararte en los pedales en una subida te manda a Z3 o Z4 en segundos. Si salís afuera, plato chico y piñón grande; si estás en rodillo, modo ERG.

**Cuánto.** ~20–25%.

## Zona 2 · Aeróbico base — 70–83% FTP

**Qué es.** Tu ritmo de *endurance*. La zona que construye el motor.

**Qué adapta.** Biogénesis mitocondrial, densidad capilar y oxidación de grasas.

**Sesiones**

1. **Salida larga** — 2 a 4+ horas estables en la mitad de la Z2.
2. **Rodaje de semana** — 60 a 90 minutos estables.

**Qué no hacer.** Ser reactivo al terreno. El error más caro del ciclismo es el índice de variabilidad alto: bajar a cero vatios y subir cada repecho en Z4. Pedaleá también en las bajadas para sostener la tensión muscular dentro de la zona.

**Cuánto.** ~55–60%.

## Zona X · Aeróbico alto — 83–91% FTP

**Qué es.** Lo que en ciclismo se llama *sweet spot*. Mucho estrés muscular periférico por vatio. Es el ritmo de un 70.3 y de un Ironman.

**Qué adapta.** Resistencia específica a la fatiga y eficiencia biomecánica en posición aerodinámica.

**Sesiones — específico de 70.3 / Ironman**

1. **Intervalos largos de carrera** — 4 x 20 minutos en ZX con 5' suaves. Sesión avanzada: son 80 minutos en zona.
2. **Simulación de 70.3** — 2 horas con 3 bloques de 30 minutos en ZX.

**Qué no hacer.** Convertir la salida grupal del fin de semana en esto. Esas salidas suelen ser una fiesta ininterrumpida de Zona X: queman mucho y te hacen poco más rápido.

**Cuánto.** 0% fuera de bloque de 70.3/IM; dentro, sale del presupuesto intenso.

## Zona 3 · Tempo — 91–100% FTP

**Qué es.** Justo por debajo del ácido. Cuesta hablar, la respiración es profunda y rítmica. Es una de las dos sesiones clave de la semana.

**Qué adapta.** Sube el FTP, mejora el aclaramiento de lactato y la tolerancia al esfuerzo sostenido.

**Sesiones**

1. **Los 2 x 20** — 2 x 20 minutos al 95–100% del FTP con 5' de recuperación. La sesión de umbral más probada que existe en ciclismo.
2. **Criss-cross** — 3 x 15 minutos alternando 2 minutos en la parte baja de la Z3 y 1 minuto en la parte alta.
3. **Intervalos de umbral base** — 4 x 10 minutos al 95% del FTP con 3' de recuperación.

**Qué no hacer.** Pasarte de vatios en los primeros tres minutos. El lactato que generás ahí no lo vas a poder reciclar después, y la sesión se convierte en una agonía anaeróbica que no entrena lo que venías a entrenar.

**Cuánto.** ~5–10%.

## Zona Y · Umbral bajo — 100–102% FTP

**Qué es.** La franja exacta alrededor del FTP. Es el ritmo de una contrarreloj de 40 km y el de la bici de un triatlón olímpico.

**Qué adapta.** Familiaridad con el ritmo de competición y tolerancia a sostenerlo sin pasarse.

**Sesiones — solo si competís a este ritmo**

1. **Potencia de olímpico** — 2 x 20 minutos al 100–102% del FTP con 5 a 10 minutos de recuperación.
2. **Bloques de contrarreloj** — 3 x 12 minutos en Zona Y con 4' suaves.

**Qué no hacer.** Vivir acá. Un par de vatios por encima del FTP durante 20 minutos es sostenible; cinco no lo son, y la diferencia no la vas a sentir hasta el minuto 15.

**Cuánto.** Residual fuera de bloques de competición.

## Zona 4 · Umbral alto — 102–110% FTP

**Qué es.** Intervalos por encima del FTP, más largos que una serie de VO2máx y más cortos que un tempo. Es la otra sesión clave junto con la Z3.

**Qué adapta.** Sube el umbral por arriba: mejora la capacidad de tolerar y reciclar lactato a vatios que no sostendrías media hora.

**Sesiones**

1. **Series largas** — 5 x 6 minutos al 105–108% del FTP con 3' en Z1.
2. **Over-unders** — 4 x 9 minutos alternando 2 minutos al 105% y 1 minuto al 95%.
3. **Series medias** — 8 x 3 minutos en Z4 con 90 segundos suaves.

**Qué no hacer.** Hacer trampa con la cadencia. Si terminás moviendo los vatios a 60 rpm estás haciendo pesas arriba de la bici en lugar de estresar el sistema cardiovascular. Sostené 90–100 rpm.

**Cuánto.** ~5–8%.

## Zona 5 · VO2máx — 110–150% FTP

**Qué es.** Series cortas, poco volumen, alto costo. Dolor agudo y respiración descontrolada.

**Qué adapta.** Expande el techo aeróbico, fuerza de pedaleo y reclutamiento máximo de fibras.

**Sesiones**

1. **VO2 clásico** — 5 x 3 minutos al 115% del FTP con 3 minutos muy suaves.
2. **Micro-intervalos 30/30** — 3 bloques de 10 x (30 segundos al 115–120% / 30 segundos suaves), con 5' entre bloques.
3. **Series de 5** — 4 x 5 minutos al 110–113% con 5' de recuperación.

**Trabajo neuromuscular:** 8 x 20 segundos a máximo esfuerzo (bien por encima del 150% del FTP) con recuperación completa de 3 minutos o más. **No se prescribe por zona sino por esfuerzo y duración** — se mide después, mirando los picos de potencia.

**Qué no hacer.** Recortar los descansos. Si llegás a la serie 4 sin poder repetir los vatios de la primera, dejaste de hacer VO2máx y estás acumulando fatiga por deporte.

**Cuánto.** ~2–5%, incluyendo el trabajo neuromuscular.

---
---

# Natación — métrica principal: ritmo sobre tu velocidad crítica (CSS)

El agua neutraliza la frecuencia cardíaca: es imprecisa y encima no la podés mirar mientras nadás. Todo se pauta con el **ritmo sobre tu velocidad crítica (CSS)** y el reloj de pared.

| Zona | % de tu CSS | Si tu CSS es 1:30/100m | Para qué sirve |
|---|---|---|---|
| 1 · Recuperación | 75–84% | 1:47 – 2:00 | Técnica, aflojes, calentamiento |
| 2 · Aeróbico base | 84–91% | 1:39 – 1:47 | Donde vive el 80% de tu volumen |
| X · Aeróbico alto | 91–96% | 1:34 – 1:39 | Aguas abiertas y ritmo de 70.3 |
| 3 · Tempo | 96–100% | 1:30 – 1:34 | Extensivo de umbral. Sesión clave |
| Y · Umbral bajo | 100–102% | 1:28 – 1:30 | La franja justo alrededor del CSS |
| 4 · Umbral alto | 102–106% | 1:25 – 1:28 | Intensivo de umbral |
| 5 · VO2máx | 106–140% | 1:04 – 1:25 | Series cortas, alto costo |

> **Por qué esto va en porcentajes y no en "CSS + 5 segundos".** Los segundos por 100 no son transferibles entre nadadores. La Zona 2 son **+7 a +14 segundos** sobre el CSS si nadás 1:15, y **+12 a +23 segundos** si nadás 2:00. Un mismo "+5 segundos" es Zona 2 para uno y Zona 3 para el otro. La calculadora hace esa cuenta con tu número; la tabla de arriba es la que no cambia.

## Zona 1 · Recuperación y técnica — 75–84% CSS

**Qué es.** Nado muy lento y consciente. El día que no venís a entrenar el motor, venís a entrenar la mano.

**Qué adapta.** Sensibilidad con el agua y corrección técnica.

**Sesiones**

1. **Bloque de técnica** — 8 x 50 metros de ejercicios (punto ciego, un solo brazo, puños cerrados) con muchísimo descanso.
2. **Calentamiento y afloje** — 200 a 400 metros suaves al principio y al final de cada sesión.

**Qué no hacer.** Contener la respiración o nadar tenso. Tiene que ser un masaje líquido.

**Cuánto.** ~20–25%.

## Zona 2 · Aeróbico base — 84–91% CSS

**Qué es.** Ritmo continuo y fluido, claramente más lento que tu CSS. **Es la zona que más gente nada demasiado rápido**, porque en la pileta el ritmo cómodo se parece bastante al ritmo de umbral.

**Qué adapta.** Resistencia muscular del tren superior, eficiencia mecánica, base aeróbica.

**Sesiones**

1. **Fraccionado largo** — 3 x 400 metros en Z2 con 20 a 30 segundos de descanso.
2. **Endurance pull** — 1000 metros continuos con pull-buoy, para aislar la brazada.
3. **Escalera aeróbica** — 400 / 300 / 200 / 100 en Z2 con 20 segundos, repetido dos veces.

**Qué no hacer.** Picarte con el del carril de al lado. Es el error número uno de las piletas y convierte todo tu volumen aeróbico en Zona 3.

**Cuánto.** ~55–60%.

## Zona X · Aeróbico alto — 91–96% CSS

**Qué es.** Ritmo de aguas abiertas y de la natación de un 70.3. Un poco por debajo del CSS, sostenible mucho tiempo, y con el mismo problema que en los otros deportes: acumula fatiga sin dar lo que da el umbral.

**Qué adapta.** Resistencia específica al ritmo de competición larga y ritmo constante sin referencias de pared.

**Sesiones — específico de aguas abiertas / 70.3**

1. **Bloques largos** — 4 x 300 metros en ZX con 20 segundos de descanso.
2. **Simulación de tramo** — 2 x 600 metros continuos en ZX con 45 segundos.

**Qué no hacer.** Usar esta zona como si fuera la Z2 porque "se siente cómoda". Se prescribe a propósito o no se nada.

**Cuánto.** 0% fuera de bloque de aguas abiertas o 70.3.

## Zona 3 · Tempo — 96–100% CSS

**Qué es.** Tu ritmo de umbral. Requiere concentración alta: tenés que convertirte en un metrónomo.

**Qué adapta.** Eleva el umbral de lactato en hombros y dorsales, y asienta el ritmo de competición.

**Sesiones**

1. **La serie de CSS** — 10 x 100 metros clavados en tu ritmo CSS con 10 a 15 segundos de descanso. El descanso corto es el estímulo.
2. **Tirada a ritmo** — 4 x 200 metros en Z3 con 20 segundos.
3. **Bloques largos de umbral** — 3 x 300 metros en Z3 con 30 segundos.

**Qué no hacer.** Estirar los descansos en la pared. El estímulo depende de que sean cortos: si descansás un minuto entre 100 y 100, la serie deja de ser de umbral.

**Cuánto.** ~5–10%.

## Zona Y · Umbral bajo — 100–102% CSS

**Qué es.** La franja finísima justo por encima del CSS. En natación es el ritmo con el que cerrás una prueba de 1500 metros.

**Sesiones — solo si competís a este ritmo**

1. **Cierre de 1500** — 6 x 150 metros en Zona Y con 30 segundos de descanso.
2. **Simulacro** — 3 x 400 metros: los primeros 300 en Z3 y los últimos 100 en Zona Y, sin cambiar la técnica.

**Qué no hacer.** Confundirla con la Z4. Son dos segundos por 100 de diferencia y la sensación es muy parecida los primeros 200 metros; la diferencia aparece en el metro 600.

**Cuánto.** Residual.

## Zona 4 · Umbral alto — 102–106% CSS

**Qué es.** Claramente por encima del CSS. El agua se pone pesada y quema el tríceps.

**Qué adapta.** Potencia de brazada y tolerancia a nadar rápido con la técnica todavía armada.

**Sesiones**

1. **Series cortas** — 15 x 50 metros en Z4 con 20 a 30 segundos.
2. **Pirámide invertida** — 200 / 150 / 100 / 50, acelerando a medida que se acorta, con 30 segundos entre repeticiones.
3. **Series de 100** — 8 x 100 metros en Z4 con 30 segundos.

**Qué no hacer.** Desarmar la técnica. En el agua, más fuerza bruta sin técnica es más arrastre, no más velocidad. Si sentís que estás apaleando el agua, bajá a Z3.

**Cuánto.** ~5–8%.

## Zona 5 · VO2máx y velocidad — 106–140% CSS

**Qué es.** Tu ritmo máximo de 100 y 200 metros, y por encima, velocidad pura.

**Qué adapta.** Reclutamiento neuromuscular máximo y agarre explosivo del agua.

**Sesiones**

1. **Series de VO2** — 8 x 100 metros fuertes con 45 segundos a 1 minuto de descanso.
2. **Piques** — 8 x 25 metros a máxima velocidad, saliendo cada 1:30.
3. **Sprints con salida** — 6 x 50 metros máximos con 2 minutos de descanso completo.

**Qué no hacer.** Nadar los piques cansado al final de la sesión. La velocidad se entrena descansado, si no estás entrenando otra cosa con el nombre equivocado.

**Cuánto.** ~2–5%.

---

## Bonus — la transición (el *brick*)

En triatlón las zonas se ven afectadas por la fatiga acumulada, y ahí la regla de métricas cambia. Correr en "Zona 2" apenas bajado de la bici ignora que el costo fisiológico de la bici ya te subió el pulso: el ritmo que ayer era fácil, hoy es metabólicamente caro.

En un brick, **la FC manda sobre el ritmo** — es la única de las dos que sabe lo que pasó en las tres horas anteriores. Si el pulso se te va a Z3, frená el ritmo aunque el reloj diga que vas suave. Es la única situación de todo este documento donde el pulso gana.


---

## Translation notes (August 13, 2026)

Written natively per language rather than translated line by line, per `brand-guidelines.md` §8. Three decisions inside that worth recording:

**Each language's PDF links its own products.** The English guide points at the English All-Access checkout at **US$ 39.99**; the Portuguese one points at the Portuguese product at **US$ 29,99**, which is the real price of that edition and not a rounding of the Spanish one. Copies of `triaperformance-pricing-and-positioning.md` — if those move, they move here.

**The Portuguese guide carries Spanish testimonials.** There are zero Portuguese reviews (`social-proof-and-reviews.md`), so the quotes are the Chilean and Mexican ones, in the original Spanish, attributed to their countries. **Translating a testimonial would misrepresent what the person said**, and inventing a Portuguese one is not an option. A Brazilian reader gets a quote in Spanish from a Chilean athlete, which is honest but visibly thin — *this is the clearest argument yet for the PT review-generation item in `open-loops.md`, and the guide is where the gap now shows.*

**The seven-zone table is identical across all three** because it comes from `data/zones.csv`. Only the prose around it is per-language. That is deliberate: the zone model is the same model, and three hand-written copies of the same numbers is the exact failure this project has a standing rule against.
