#!/usr/bin/env python3
"""
mobility-i18n.py — derives /members/en/mobility/ and /members/pt/mobilidade/
from /members/movilidad/ by substituting STRING LITERALS ONLY.

Why a script and not two hand-written pages: the structural transformation is
then provably identical for both languages, and the exercise id lists, phase
composition, modes, holds and tag placement cannot drift, because nothing in
this script can touch them. The same reason and the same method as the activation
matrix's EN/PT pass (`activation-matrix.md` §v1.1).

It is NOT a build step and is not wired into anything. It is the derivation
record: when a Spanish cue is corrected, this file is what says what the other
two languages say in the same place, so the correction can be applied to all
three in one pass instead of being noticed in one language six weeks later.

Two things make it safe to re-run:
  * every mapping must fire — an untranslated key is a hard failure, not a warning;
  * after substitution the output is swept for Spanish-only characters and for a
    known list of Spanish words. A survivor fails the run.

Usage, from the repo root:   python3 automation/mobility-i18n.py
"""

import io, os, re, sys

SRC = "site/members/movilidad/index.njk"
OUT = {"en": "site/members/en/mobility/index.njk",
       "pt": "site/members/pt/mobilidade/index.njk"}

# ---------------------------------------------------------------------------
# The header comment block. It is BUILD NOTES, not page copy, so it is replaced
# wholesale per language rather than translated — and each sibling's block says
# where the reasoning lives instead of restating it, because five copies of the
# clinical argument in three languages is exactly the duplication this repo
# keeps paying for.
# ---------------------------------------------------------------------------
HEADER = """{#- MOVILIDAD POST-ENTRENO, %(LANGNAME)s SIBLING of /members/movilidad/.
    Derived from the Spanish page by `automation/mobility-i18n.py`, which
    substitutes string literals and nothing else — so the exercise ids, the
    three routine tables, the phase composition, every hold and every mode are
    identical to the Spanish page by construction, not by review.

    *** DO NOT HAND-EDIT THE STRUCTURE HERE. *** If a routine changes, it
    changes in the Spanish page and this one is regenerated. If a CUE changes,
    fix it in both places in the same pass — the script's map is the record of
    which string corresponds to which.

    Home doc: `mobility-brief.md`. It owns all of it: the five decisions that
    reversed the source doc (durations are 10/20/30, mat-only base, intensity
    rather than depth, triathlon is the brick, "todo el cuerpo"), and the three
    clinical reversals — NO sleeper stretch, NO doorframe pec stretch, NO camel.

    *** THE CLINICAL REVERSALS ARE THE REASON THIS FILE IS TESTED IN ITS OWN
    LANGUAGE. A translation is exactly where a clinical decision silently
    reverts, because the reviewer is reading for fluency and "sleeper stretch"
    has a plausible-sounding rendering in both English and Portuguese. The same
    assertions that run against the Spanish page run against this one. ***

    *** EVERY NOTE ABOUT THIS PAGE BELONGS IN THIS BLOCK. Almost the whole page
    is inside {%% raw %%}, where a Nunjucks comment is NOT a comment — it is
    literal text that renders to the reader. Use an HTML comment or write it
    here. -#}"""

LANGNAME = {"en": "ENGLISH", "pt": "PORTUGUESE"}

# ---------------------------------------------------------------------------
# The maps. Order matters only in that longer keys are applied first, so a short
# string can never eat a fragment of a longer one; the script sorts for that.
# ---------------------------------------------------------------------------

EN = {
# --- front matter + page chrome ---
"Movilidad post-entreno — Triaperformance All-Access": "Post-Workout Mobility — Triaperformance All-Access",
"Biblioteca": "Library",
"/ Movilidad": "/ Mobility",
"Movilidad": "Mobility",
"Tu vuelta a la calma": "Your cool-down",
"Dos preguntas y armamos la sesión. Cada ejercicio va por tiempo, los unilaterales por lado — no hay nada que contar.":
  "Two questions and the session builds itself. Every exercise is timed, single-side ones per side — there is nothing to count.",
"¿De qué venís?": "What are you coming off?",
"Correr": "Running",
"Bici": "Riding",
"Nadar": "Swimming",
"Triatlón": "Multi-sport",
"Todo el cuerpo": "Full body",
"¿Cuánto tiempo tenés?": "How long do you have?",
"10 min": "10 min",
"20 min": "20 min",
"30 min": "30 min",
"Los tres arrancan igual. Veinte suma el resto de la cadena, y treinta suma las zonas que nadie estira y un cierre largo para bajar pulsaciones.":
  "All three start the same way. Twenty adds the rest of the chain; thirty adds the spots nobody stretches, and a long close to bring your heart rate down.",
"Alcanza con una colchoneta y una pared. Si tenés rodillo o pelota, algunos ejercicios ofrecen esa versión con el botón":
  "A mat and a wall are enough. If you have a roller or a ball, some exercises offer that version through the",
"Cambiar ejercicio": "Change exercise",
"Armar mi sesión →": "Build my session →",
"Empezar la sesión →": "Start the session →",
"Sesión completa": "Session complete",
"← Cambiar opciones": "← Change options",
" minutos": " minutes",

# --- phases ---
"Descarga": "Unload",
"Cadena completa": "Full chain",
"Zonas olvidadas": "Forgotten spots",
"Cierre": "Close",

# --- tags ---
"Sin equipo": "No equipment",
"Pared": "Wall",
"Rodillo": "Roller",
"Pelota": "Ball",
"Toalla": "Towel",

# --- exercise names ---
"Sóleo en pared": "Soleus at the wall",
"Gemelos con rodillo": "Calves on the roller",
"Gemelo en pared": "Calf at the wall",
"Isquios boca arriba": "Supine hamstring stretch",
"Isquios con toalla": "Hamstring with a towel",
"Figura 4 boca arriba": "Supine figure 4",
"Glúteo con pelota": "Glute on a ball",
"Psoas de rodillas con apriete": "Half-kneeling hip flexor with a squeeze",
"Cuádriceps de costado": "Side-lying quad stretch",
"Cuádriceps con rodillo": "Quads on the roller",
"Couch stretch en pared": "Couch stretch at the wall",
"Cruce de cadera externa": "Supine outer-hip crossover",
"Tensor y vasto externo con rodillo": "TFL and outer quad on the roller",
"Estocada lateral en media rodilla": "Half-kneeling side lunge",
"Mariposa": "Butterfly",
"Arco y dedos del pie": "Foot arch and toes",
"Fascia plantar con pelota": "Plantar fascia on a ball",
"Tobillos y empeine": "Ankles and insteps",
"Empeine y tibial con rodillo": "Shin and instep on the roller",
"Postura del niño": "Child's pose",
"Niño con alcance lateral": "Child's pose with a side reach",
"Torsión boca arriba": "Supine twist",
"Esfinge suave": "Gentle sphinx",
"Libro abierto": "Open book",
"Gato-camello": "Cat-cow",
"Extensión torácica en cuadrupedia": "Quadruped thoracic extension",
"Cruce de hombro": "Cross-body shoulder stretch",
"Apertura de pecho boca abajo": "Prone chest opener",
"Pectoral menor con pelota": "Pec minor on a ball",
"Tríceps y dorsal por encima de la cabeza": "Overhead triceps and lat",
"Cuello y trapecio": "Neck and upper trap",
"Antebrazos y muñecas": "Forearms and wrists",
"Piernas en la pared": "Legs up the wall",
"Respiración de cierre": "Closing breath",

# --- cues ---
"Punta del pie contra la pared, talón en el piso, y <strong>llevá la rodilla hacia la pared manteniéndola flexionada</strong>. Rodilla doblada es sóleo, y el sóleo es el que se come la carga cuando corrés. Si lo sentís en la panza del gemelo, doblá más la rodilla.":
  "Toes against the wall, heel on the floor, and <strong>drive the knee toward the wall keeping it bent</strong>. A bent knee is soleus, and the soleus is what takes the load when you run. If you feel it in the belly of the calf, bend the knee more.",
"Sentado, el gemelo sobre el rodillo y la otra pierna cruzada encima para cargar. <strong>Parate 20 segundos en el punto que más se queja</strong> en vez de ir y venir rápido.":
  "Seated, calf on the roller and the other leg crossed on top for load. <strong>Stop for 20 seconds on the spot that complains most</strong> instead of rolling quickly back and forth.",
"Misma posición, pero ahora <strong>con la rodilla estirada y el talón clavado en el piso</strong>. Rodilla derecha es gemelo. Cadera adelante y tronco erguido — si te vas de espaldas, perdiste el estiramiento.":
  "Same position, but now <strong>with the knee straight and the heel pinned to the floor</strong>. A straight knee is gastroc. Hips forward and torso tall — if you lean back, you have lost the stretch.",
"Agarrate por detrás del muslo y <strong>estirá la rodilla hasta donde llegue sin que la cadera se despegue del piso</strong>. La otra pierna queda apoyada. La punta del pie hacia vos recién al final, no desde el principio.":
  "Hold behind the thigh and <strong>straighten the knee as far as it goes without the hip lifting off the floor</strong>. The other leg stays down. Pull the toes toward you at the end, not from the start.",
"Toalla en la planta del pie, pierna extendida hacia el techo. <strong>Tirá desde la toalla, no desde el cuello.</strong>":
  "Towel around the sole, leg extended toward the ceiling. <strong>Pull from the towel, not from your neck.</strong>",
"Cruzá un tobillo sobre la rodilla contraria y traé la pierna de abajo hacia el pecho. <strong>Empujá suave la rodilla cruzada hacia afuera con el codo.</strong> Empezá por el lado que sentís más rígido.":
  "Cross one ankle over the opposite knee and draw the bottom leg toward your chest. <strong>Push the crossed knee gently outward with your elbow.</strong> Start on the side that feels stiffer.",
"Sentado sobre la pelota, buscá el punto del glúteo que se queja y <strong>quedate quieto ahí respirando</strong> en vez de rodar. Cruzá el tobillo sobre la rodilla para llegar más profundo.":
  "Sitting on the ball, find the spot in the glute that complains and <strong>stay still there and breathe</strong> instead of rolling. Cross the ankle over the knee to get deeper.",
"Media rodilla, pie de adelante plano. <strong>Meté la pelvis y apretá fuerte el glúteo de atrás antes de avanzar</strong> — sin ese apriete estás estirando la lumbar y no el psoas. Ese apriete es el ejercicio.":
  "Half-kneeling, front foot flat. <strong>Tuck the pelvis and squeeze the back glute hard before you move forward</strong> — without that squeeze you are stretching your lower back, not the hip flexor. The squeeze is the exercise.",
"De costado, agarrá el tobillo de arriba y llevá el talón a la cola <strong>con la pelvis metida y la rodilla apuntando al piso</strong>, no abierta hacia afuera. Si la lumbar se arquea, aflojá el rango.":
  "On your side, take the top ankle and bring the heel toward your glute <strong>with the pelvis tucked and the knee pointing at the floor</strong>, not flared out. If your lower back arches, back off the range.",
"Boca abajo, el muslo sobre el rodillo, del pliegue de la cadera hasta arriba de la rodilla. <strong>Presión media: si tenés que aguantar la respiración, es demasiada.</strong>":
  "Face down, thigh on the roller, from the hip crease to just above the knee. <strong>Medium pressure: if you have to hold your breath, it is too much.</strong>",
"De rodillas de espaldas a la pared, el empeine apoyado en ella. <strong>Meté la pelvis antes de subir el tronco</strong> — casi nadie necesita subir tanto como cree.":
  "Kneeling with your back to the wall, the top of the foot resting against it. <strong>Tuck the pelvis before you lift your torso</strong> — almost nobody needs to come up as far as they think.",
"Boca arriba, llevá una rodilla cruzada al lado opuesto <strong>dejando que la pelvis rote con ella</strong>, brazos abiertos. Buscás el tensor y el glúteo, por fuera de la cadera. <strong>La cintilla iliotibial no se estira ni se ablanda a golpes: lo que se afloja es lo que tira de ella.</strong>":
  "On your back, take one knee across to the opposite side <strong>letting the pelvis rotate with it</strong>, arms wide. You are after the TFL and the glute, on the outside of the hip. <strong>The IT band does not stretch and does not soften under punishment: what loosens is whatever is pulling on it.</strong>",
"El rodillo justo debajo del hueso de la cadera por fuera, y después en el lateral del muslo. <strong>Presión moderada y lenta.</strong> No busques la cintilla: buscá el músculo de arriba y el de adelante-afuera.":
  "The roller just below the hip bone on the outside, then along the side of the thigh. <strong>Moderate pressure, slow.</strong> Do not hunt for the band itself: work the muscle above it and the one in front of it.",
"De rodillas, una pierna estirada al costado con el pie apoyado, y <strong>llevá la cadera hacia atrás y hacia el lado contrario</strong>. Espalda larga. Es el aductor largo, que en carrera y en bici trabaja mucho más de lo que nadie cree.":
  "Kneeling with one leg straight out to the side, foot flat, and <strong>take your hips back and toward the opposite side</strong>. Long spine. This is adductor longus, which works far harder in running and riding than anyone credits.",
"Plantas de los pies juntas, y <strong>inclinate desde la cadera con la espalda larga</strong> — no redondees para llegar más abajo, que es puro engaño. Los codos pueden empujar suave las rodillas.":
  "Soles of the feet together, and <strong>hinge from the hips with a long spine</strong> — do not round to get lower, that is just cheating. Your elbows can press gently on the knees.",
"Sentado sobre los talones con los dedos de los pies flexionados hacia adelante — si es mucho, apoyá las manos y sacá peso. Después abrí y cerrá los dedos. <strong>La fascia plantar se endurece después de correr y nadie la toca hasta que duele.</strong>":
  "Sit back on your heels with your toes tucked under — if it is too much, put your hands down and take weight off. Then spread and close the toes. <strong>The plantar fascia stiffens after a run and nobody touches it until it hurts.</strong>",
"Rodá la planta del pie sobre la pelota, del talón a los dedos, lento, <strong>frenando en los puntos que se quejan</strong>. Presión que puedas sostener respirando normal.":
  "Roll the sole of the foot over the ball, heel to toes, slowly, <strong>pausing on the spots that complain</strong>. Pressure you can hold while breathing normally.",
"Sentado sobre los talones con los empeines planos en el piso, <strong>y subí apenas las rodillas para cargar el empeine</strong>. Después, círculos amplios de tobillo. Si venís de nadar, un tobillo que no apunta frena la patada; si venís de correr, es el que se te puso duro.":
  "Sit back on your heels with the tops of the feet flat on the floor, <strong>then lift the knees slightly to load the insteps</strong>. Then wide ankle circles. Coming off a swim, an ankle that will not point brakes your kick; coming off a run, this is the one that stiffened up.",
"En cuadrupedia, el rodillo sobre la parte de adelante de la tibia, y rodá despacio de la rodilla al tobillo. Zona sensible: <strong>menos presión de la que creés.</strong>":
  "On all fours, roller on the front of the shin, rolling slowly from knee to ankle. Tender area: <strong>less pressure than you think.</strong>",
"Sentado sobre los talones, brazos largos adelante, frente al piso. <strong>Respirá hacia la espalda baja</strong> y dejá que la cadera baje un poco más con cada exhalación. Acá el objetivo es bajar pulsaciones, no estirar más.":
  "Sitting back on your heels, arms long in front, forehead down. <strong>Breathe into your lower back</strong> and let the hips settle a little further with each exhale. The goal here is to bring the heart rate down, not to stretch harder.",
"Desde la postura del niño, caminá las manos hacia un costado hasta sentir el dorsal por el lateral del tronco. <strong>La cadera se queda atrás</strong>, no la sigas con el tronco.":
  "From child's pose, walk your hands to one side until you feel the lat down the side of your torso. <strong>The hips stay back</strong> — do not let your torso follow them around.",
"Rodilla cruzada al lado opuesto, brazos abiertos, mirada al lado contrario. <strong>El hombro no se despega del piso</strong> — si se despega, bajá la rodilla. Soltá un poco más en cada exhalación.":
  "Knee crossed to the opposite side, arms wide, eyes to the other side. <strong>The shoulder stays on the floor</strong> — if it lifts, lower the knee. Let go a little more on each exhale.",
"Boca abajo, codos debajo de los hombros, pelvis pesada en el piso. <strong>Es una extensión suave y sostenida, no una cobra.</strong> Si te aprieta la lumbar, llevá los codos más adelante hasta que deje de apretar.":
  "Face down, elbows under the shoulders, pelvis heavy on the floor. <strong>This is a gentle sustained extension, not a cobra.</strong> If your lower back pinches, walk the elbows further forward until it stops.",
"De costado, rodillas flexionadas y apiladas, brazos juntos adelante. <strong>Abrí el brazo de arriba siguiendo la mano con la mirada, y dejá las rodillas quietas.</strong> Si las rodillas se separan, la rotación se te fue a la lumbar.":
  "On your side, knees bent and stacked, arms together in front. <strong>Open the top arm, following your hand with your eyes, and keep the knees still.</strong> If the knees come apart, the rotation has gone into your lower back.",
"En cuadrupedia, alterná redondear y arquear al ritmo de la respiración. <strong>Vértebra por vértebra</strong>, no en bloque. Lento: post-entreno esto es para soltar, no para movilizar fuerte.":
  "On all fours, alternate rounding and arching with your breath. <strong>Vertebra by vertebra</strong>, not in one block. Slow: after a session this is for letting go, not for hard mobilising.",
"De rodillas, antebrazos apoyados adelante y la cola hacia los talones. <strong>Hundí el pecho hacia el piso dejando que se abran las axilas.</strong> El movimiento es de la espalda alta: si se arquea la lumbar, acercá más la cola a los talones.":
  "Kneeling, forearms down in front and hips back toward your heels. <strong>Let the chest sink toward the floor and the armpits open.</strong> The movement is upper back: if your lower back arches, bring your hips closer to your heels.",
"Llevá el brazo cruzado por delante del pecho y <strong>empujá desde el codo, nunca desde la muñeca</strong>. La clave: bajá el omóplato y no dejes que el hombro se vaya adelante. Si se va adelante, estás moviendo la escápula en vez de soltar la parte de atrás del hombro.":
  "Take the arm across your chest and <strong>press from the elbow, never from the wrist</strong>. The key: pull the shoulder blade down and do not let the shoulder travel forward. If it travels forward, you are sliding the scapula instead of releasing the back of the shoulder.",
"Boca abajo, un brazo extendido en cruz a la altura del hombro, y rodá el cuerpo hacia ese lado apoyando el pie contrario. <strong>Buscá el pecho, no el frente del hombro</strong> — si lo sentís dentro de la articulación, bajá el brazo unos centímetros y volvé a probar.":
  "Face down, one arm out to the side at shoulder height, and roll your body toward that side, planting the opposite foot. <strong>Look for the chest, not the front of the shoulder</strong> — if you feel it inside the joint, lower the arm a few centimetres and try again.",
"Boca abajo, la pelota debajo de la clavícula, por dentro del hombro. <strong>Presión suave y quieta.</strong> Esta zona no se rodea, se sostiene.":
  "Face down, ball under the collarbone, just inside the shoulder. <strong>Gentle, still pressure.</strong> You do not roll this area, you hold it.",
"Codo arriba junto a la oreja, mano entre los omóplatos, y empujá suave el codo con la otra mano. <strong>Costillas abajo</strong> — si la lumbar se arquea, ganaste rango con la espalda y no con el hombro.":
  "Elbow up beside your ear, hand between the shoulder blades, press the elbow gently with the other hand. <strong>Ribs down</strong> — if your lower back arches, you bought that range with your spine and not with your shoulder.",
"Sentado, la mano del lado que estirás sujeta el borde de la colchoneta, y llevá la oreja al hombro contrario <strong>sin encoger el hombro</strong>. No tires con la otra mano: el peso de la cabeza alcanza y sobra.":
  "Seated, the hand on the side you are stretching holds the edge of the mat, and take your ear toward the opposite shoulder <strong>without shrugging</strong>. Do not pull with the other hand: the weight of your head is more than enough.",
"En cuadrupedia, girá la mano hasta que los dedos apunten a las rodillas y <strong>sentate lento hacia atrás</strong>. Después dá vuelta la mano y apoyá el dorso para el otro lado. Horas agarrado al manillar se pagan acá.":
  "On all fours, turn the hand until the fingers point at your knees and <strong>sit slowly back</strong>. Then flip the hand and rest the back of it down for the other direction. Hours gripping the bars get paid for here.",
"Cola cerca de la pared, piernas verticales apoyadas en ella, brazos al costado. <strong>Dos minutos enteros, y no estás estirando nada: estás bajando pulsaciones y sacándote el peso de las piernas.</strong> Si tira mucho de los isquios, alejá la cola de la pared.":
  "Hips close to the wall, legs resting vertically against it, arms by your sides. <strong>Two full minutes, and you are not stretching anything: you are bringing your heart rate down and taking the weight out of your legs.</strong> If it pulls too hard on the hamstrings, move your hips further from the wall.",
"Boca arriba, rodillas dobladas, una mano en el pecho y otra en la panza. <strong>Inhalá 4 segundos por la nariz llevando el aire a la panza, exhalá 6 por la boca.</strong> La exhalación larga es la que baja el sistema nervioso, y es lo que convierte esto en recuperación y no en una entrada en calor tardía. Si querés un protocolo con timer, tenés <a href=\\\"/members/respiracion/\\\">Respiración en caja</a>.":
  "On your back, knees bent, one hand on your chest and one on your belly. <strong>Inhale 4 seconds through the nose, sending the air into your belly; exhale 6 through the mouth.</strong> The long exhale is what settles the nervous system, and it is what makes this recovery rather than a late warm-up. If you want a protocol with a timer, there is <a href=\\\"/members/en/breathing/\\\">Box Breathing</a>.",

# --- titles, subtitles, why, done, hints ---
"Movilidad post-carrera": "Post-run mobility",
"Movilidad post-bici": "Post-ride mobility",
"Movilidad post-natación": "Post-swim mobility",
"Movilidad post-combinado": "Post-brick mobility",
"Movilidad de cuerpo completo": "Full-body mobility",
"Cadena posterior, psoas y glúteo, que es lo que te acaba de trabajar. Sostenés cada posición, no rebotás.":
  "Posterior chain, hip flexors and glutes — what you just worked. You hold each position; you do not bounce.",
"Abrir lo que la posición de bici cerró: cadera, pecho y espalda alta. Sostenés cada posición, no rebotás.":
  "Opening what the bike position closed: hips, chest and upper back. You hold each position; you do not bounce.",
"Descomprimir el hombro y la espalda alta — y las piernas, que patearon una hora y nadie estira.":
  "Decompressing the shoulder and upper back — and the legs, which kicked for an hour and nobody stretches.",
"Lo que dejaron las tres cosas juntas: cuádriceps y gemelos de correr, cadera de la bici, dorsal de nadar.":
  "What all three left behind: quads and calves from the run, hips from the bike, lats from the swim.",
"Sin deporte asignado: recorrido completo de arriba a abajo. Sirve igual después del gimnasio o de un día largo.":
  "No sport assumed: a full pass from top to bottom. Works just as well after the gym or a long day.",
"Correr deja el sóleo y los isquios con tono alto y el psoas corto, y después te sentás ocho horas encima de eso. Diez minutos en el piso ahora valen más que media hora mañana, porque el tejido todavía está caliente y todavía te acordás de qué te molestó.":
  "Running leaves the soleus and hamstrings with high tone and the hip flexors short, and then you sit on top of that for eight hours. Ten minutes on the floor now is worth more than half an hour tomorrow, because the tissue is still warm and you still remember what bothered you.",
"En la bici estás una hora o cinco en la misma posición: cadera cerrada, espalda alta redondeada, cuello extendido para mirar adelante y las manos agarrando. Nada de eso se arregla solo, y es acumulativo — la molestia lumbar del ciclista casi nunca empieza en la lumbar.":
  "On the bike you spend an hour or five in one position: hips closed, upper back rounded, neck extended to look ahead and hands gripping. None of that resolves on its own, and it accumulates — a cyclist's low-back complaint almost never starts in the low back.",
"Nadar deja el dorsal y el pectoral menor tirando del hombro hacia adelante, que es exactamente la posición desde la que se pincha. Y deja las piernas afuera de la conversación: pateaste una hora con el tobillo en punta y mañana salís a correr con eso.":
  "Swimming leaves the lat and pec minor pulling the shoulder forward, which is exactly the position it gets pinched from. And it leaves the legs out of the conversation: you kicked for an hour with the ankle pointed and tomorrow you run on that.",
"Un día combinado deja tres deudas distintas y ninguna se paga con la misma postura. Esta sesión toca las tres: lo que corriste, lo que pedaleaste y lo que nadaste, en ese orden de prioridad.":
  "A multi-sport day leaves three different debts and no single position pays them off. This session covers all three: what you ran, what you rode and what you swam, in that order of priority.",
"Cuando no sabés qué te dejó duro, o fue de todo un poco, el mejor uso del tiempo es un recorrido completo en vez de insistir sobre una sola zona. Vale igual para un día de gimnasio o para un día largo de trabajo.":
  "When you do not know what left you stiff, or it was a bit of everything, the best use of the time is a full pass rather than hammering one area. That holds just as well for a gym day or a long day at a desk.",
"Listo. Comé algo en la próxima media hora.": "Done. Eat something in the next half hour.",
"Listo. Eso es la sesión completa.": "Done. That is the full session.",
"Para un día con más de un deporte: un ladrillo, o bici a la mañana y carrera a la tarde.":
  "For a day with more than one sport: a brick, or a ride in the morning and a run in the afternoon.",
"Si sentís todo duro, si fue día de gimnasio, o si no querés elegir.":
  "If everything feels stiff, if it was a gym day, or if you would rather not choose.",

# --- pain hand-off (single-quoted in the source; HTML inside) ---
'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasá por <a href="/members/rodillas/">Rodillas</a> o <a href="/members/aquiles/">Aquiles</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
  'If something <strong>hurts</strong> rather than feels stiff, this is not the right tool today: go to <a href="/members/en/knees/">Knees</a> or <a href="/members/en/achilles/">Achilles</a>. And if the pain persists, that is a doctor, not a routine.',
'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasá por <a href="/members/rodillas/">Rodillas</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
  'If something <strong>hurts</strong> rather than feels stiff, this is not the right tool today: go to <a href="/members/en/knees/">Knees</a>. And if the pain persists, that is a doctor, not a routine.',
'Si el hombro <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasá por <a href="/members/hombro/">Hombro de nadador</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
  'If the shoulder <strong>hurts</strong> rather than feels stiff, this is not the right tool today: go to <a href="/members/en/shoulder/">Swimmer’s Shoulder</a>. And if the pain persists, that is a doctor, not a routine.',
'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasá por <a href="/members/rodillas/">Rodillas</a>, <a href="/members/aquiles/">Aquiles</a> u <a href="/members/hombro/">Hombro</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
  'If something <strong>hurts</strong> rather than feels stiff, this is not the right tool today: go to <a href="/members/en/knees/">Knees</a>, <a href="/members/en/achilles/">Achilles</a> or <a href="/members/en/shoulder/">Shoulder</a>. And if the pain persists, that is a doctor, not a routine.',

# --- in-file section comments (Spanish in the source; the completeness sweep
#     catches these, which is exactly what it is for) ---
'PIERNA / CADERA */':
  'LEG / HIP */',
'TRONCO / ESPALDA */':
  'TRUNK / BACK */',
'CIERRE */':
  'CLOSE */',
'HOMBRO / CUELLO\n       El cruce de hombro reemplaza al sleeper stretch del documento original, y\n       la apertura boca abajo reemplaza al estiramiento en el marco de la puerta.\n       Las dos razones están arriba, en el bloque de notas. */':
  "SHOULDER / NECK\n       The cross-body stretch replaces the source doc's sleeper stretch, and the\n       prone chest opener replaces its doorframe stretch. Both reasons are in the\n       header block above, and in `mobility-brief.md` §3. */",
}

PT = {
"Movilidad post-entreno — Triaperformance All-Access": "Mobilidade pós-treino — Triaperformance All-Access",
"Biblioteca": "Biblioteca",
"/ Movilidad": "/ Mobilidade",
"Movilidad": "Mobilidade",
"Tu vuelta a la calma": "Sua volta à calma",
"Dos preguntas y armamos la sesión. Cada ejercicio va por tiempo, los unilaterales por lado — no hay nada que contar.":
  "Duas perguntas e a sessão se monta sozinha. Cada exercício é por tempo, os unilaterais por lado — não há nada para contar.",
"¿De qué venís?": "Você está vindo de quê?",
"Correr": "Corrida",
"Bici": "Bike",
"Nadar": "Natação",
"Triatlón": "Combinado",
"Todo el cuerpo": "Corpo inteiro",
"¿Cuánto tiempo tenés?": "Quanto tempo você tem?",
"10 min": "10 min",
"20 min": "20 min",
"30 min": "30 min",
"Los tres arrancan igual. Veinte suma el resto de la cadena, y treinta suma las zonas que nadie estira y un cierre largo para bajar pulsaciones.":
  "Os três começam igual. Vinte acrescenta o resto da cadeia; trinta acrescenta as zonas que ninguém alonga e um encerramento longo para baixar os batimentos.",
"Alcanza con una colchoneta y una pared. Si tenés rodillo o pelota, algunos ejercicios ofrecen esa versión con el botón":
  "Basta um colchonete e uma parede. Se você tiver rolo ou bolinha, alguns exercícios oferecem essa versão pelo botão",
"Cambiar ejercicio": "Trocar exercício",
"Armar mi sesión →": "Montar minha sessão →",
"Empezar la sesión →": "Começar a sessão →",
"Sesión completa": "Sessão completa",
"← Cambiar opciones": "← Trocar opções",
" minutos": " minutos",

"Descarga": "Descarga",
"Cadena completa": "Cadeia completa",
"Zonas olvidadas": "Zonas esquecidas",
"Cierre": "Encerramento",

"Sin equipo": "Sem equipamento",
"Pared": "Parede",
"Rodillo": "Rolo",
"Pelota": "Bolinha",
"Toalla": "Toalha",

"Sóleo en pared": "Sóleo na parede",
"Gemelos con rodillo": "Panturrilhas no rolo",
"Gemelo en pared": "Panturrilha na parede",
"Isquios boca arriba": "Isquiotibiais deitado",
"Isquios con toalla": "Isquiotibiais com toalha",
"Figura 4 boca arriba": "Figura 4 deitado",
"Glúteo con pelota": "Glúteo na bolinha",
"Psoas de rodillas con apriete": "Psoas ajoelhado com contração",
"Cuádriceps de costado": "Quadríceps deitado de lado",
"Cuádriceps con rodillo": "Quadríceps no rolo",
"Couch stretch en pared": "Couch stretch na parede",
"Cruce de cadera externa": "Cruzamento de quadril externo",
"Tensor y vasto externo con rodillo": "Tensor e vasto lateral no rolo",
"Estocada lateral en media rodilla": "Afundo lateral ajoelhado",
"Mariposa": "Borboleta",
"Arco y dedos del pie": "Arco e dedos do pé",
"Fascia plantar con pelota": "Fáscia plantar na bolinha",
"Tobillos y empeine": "Tornozelos e peito do pé",
"Empeine y tibial con rodillo": "Canela e peito do pé no rolo",
"Postura del niño": "Postura da criança",
"Niño con alcance lateral": "Criança com alcance lateral",
"Torsión boca arriba": "Torção deitado",
"Esfinge suave": "Esfinge suave",
"Libro abierto": "Livro aberto",
"Gato-camello": "Gato-vaca",
"Extensión torácica en cuadrupedia": "Extensão torácica em quatro apoios",
"Cruce de hombro": "Alongamento cruzado de ombro",
"Apertura de pecho boca abajo": "Abertura de peito de bruços",
"Pectoral menor con pelota": "Peitoral menor na bolinha",
"Tríceps y dorsal por encima de la cabeza": "Tríceps e dorsal acima da cabeça",
"Cuello y trapecio": "Pescoço e trapézio",
"Antebrazos y muñecas": "Antebraços e punhos",
"Piernas en la pared": "Pernas na parede",
"Respiración de cierre": "Respiração de encerramento",

"Punta del pie contra la pared, talón en el piso, y <strong>llevá la rodilla hacia la pared manteniéndola flexionada</strong>. Rodilla doblada es sóleo, y el sóleo es el que se come la carga cuando corrés. Si lo sentís en la panza del gemelo, doblá más la rodilla.":
  "Ponta do pé na parede, calcanhar no chão, e <strong>leve o joelho em direção à parede mantendo-o flexionado</strong>. Joelho dobrado é sóleo, e o sóleo é quem absorve a carga quando você corre. Se sentir na barriga da panturrilha, dobre mais o joelho.",
"Sentado, el gemelo sobre el rodillo y la otra pierna cruzada encima para cargar. <strong>Parate 20 segundos en el punto que más se queja</strong> en vez de ir y venir rápido.":
  "Sentado, a panturrilha sobre o rolo e a outra perna cruzada por cima para dar carga. <strong>Pare 20 segundos no ponto que mais reclama</strong> em vez de ir e voltar rápido.",
"Misma posición, pero ahora <strong>con la rodilla estirada y el talón clavado en el piso</strong>. Rodilla derecha es gemelo. Cadera adelante y tronco erguido — si te vas de espaldas, perdiste el estiramiento.":
  "Mesma posição, mas agora <strong>com o joelho estendido e o calcanhar fixo no chão</strong>. Joelho reto é gastrocnêmio. Quadril à frente e tronco ereto — se você joga o corpo para trás, perdeu o alongamento.",
"Agarrate por detrás del muslo y <strong>estirá la rodilla hasta donde llegue sin que la cadera se despegue del piso</strong>. La otra pierna queda apoyada. La punta del pie hacia vos recién al final, no desde el principio.":
  "Segure por trás da coxa e <strong>estenda o joelho até onde der sem que o quadril saia do chão</strong>. A outra perna fica apoiada. A ponta do pé para você só no final, não desde o começo.",
"Toalla en la planta del pie, pierna extendida hacia el techo. <strong>Tirá desde la toalla, no desde el cuello.</strong>":
  "Toalha na sola do pé, perna estendida para o teto. <strong>Puxe pela toalha, não pelo pescoço.</strong>",
"Cruzá un tobillo sobre la rodilla contraria y traé la pierna de abajo hacia el pecho. <strong>Empujá suave la rodilla cruzada hacia afuera con el codo.</strong> Empezá por el lado que sentís más rígido.":
  "Cruze um tornozelo sobre o joelho oposto e traga a perna de baixo em direção ao peito. <strong>Empurre o joelho cruzado suavemente para fora com o cotovelo.</strong> Comece pelo lado que estiver mais rígido.",
"Sentado sobre la pelota, buscá el punto del glúteo que se queja y <strong>quedate quieto ahí respirando</strong> en vez de rodar. Cruzá el tobillo sobre la rodilla para llegar más profundo.":
  "Sentado sobre a bolinha, procure o ponto do glúteo que reclama e <strong>fique parado ali respirando</strong> em vez de rolar. Cruze o tornozelo sobre o joelho para chegar mais fundo.",
"Media rodilla, pie de adelante plano. <strong>Meté la pelvis y apretá fuerte el glúteo de atrás antes de avanzar</strong> — sin ese apriete estás estirando la lumbar y no el psoas. Ese apriete es el ejercicio.":
  "Meio ajoelhado, pé da frente apoiado. <strong>Encaixe a pelve e contraia forte o glúteo de trás antes de avançar</strong> — sem essa contração você está alongando a lombar e não o psoas. A contração é o exercício.",
"De costado, agarrá el tobillo de arriba y llevá el talón a la cola <strong>con la pelvis metida y la rodilla apuntando al piso</strong>, no abierta hacia afuera. Si la lumbar se arquea, aflojá el rango.":
  "Deitado de lado, segure o tornozelo de cima e leve o calcanhar ao glúteo <strong>com a pelve encaixada e o joelho apontando para o chão</strong>, não aberto para fora. Se a lombar arquear, reduza a amplitude.",
"Boca abajo, el muslo sobre el rodillo, del pliegue de la cadera hasta arriba de la rodilla. <strong>Presión media: si tenés que aguantar la respiración, es demasiada.</strong>":
  "De bruços, a coxa sobre o rolo, da dobra do quadril até acima do joelho. <strong>Pressão média: se você precisa prender a respiração, está demais.</strong>",
"De rodillas de espaldas a la pared, el empeine apoyado en ella. <strong>Meté la pelvis antes de subir el tronco</strong> — casi nadie necesita subir tanto como cree.":
  "Ajoelhado de costas para a parede, o peito do pé apoiado nela. <strong>Encaixe a pelve antes de subir o tronco</strong> — quase ninguém precisa subir tanto quanto acha.",
"Boca arriba, llevá una rodilla cruzada al lado opuesto <strong>dejando que la pelvis rote con ella</strong>, brazos abiertos. Buscás el tensor y el glúteo, por fuera de la cadera. <strong>La cintilla iliotibial no se estira ni se ablanda a golpes: lo que se afloja es lo que tira de ella.</strong>":
  "Deitado, leve um joelho cruzado para o lado oposto <strong>deixando a pelve girar junto</strong>, braços abertos. Você quer o tensor e o glúteo, na parte de fora do quadril. <strong>A banda iliotibial não alonga nem amolece na força: o que solta é aquilo que puxa ela.</strong>",
"El rodillo justo debajo del hueso de la cadera por fuera, y después en el lateral del muslo. <strong>Presión moderada y lenta.</strong> No busques la cintilla: buscá el músculo de arriba y el de adelante-afuera.":
  "O rolo logo abaixo do osso do quadril, por fora, e depois na lateral da coxa. <strong>Pressão moderada e lenta.</strong> Não procure a banda: trabalhe o músculo de cima e o da frente-lateral.",
"De rodillas, una pierna estirada al costado con el pie apoyado, y <strong>llevá la cadera hacia atrás y hacia el lado contrario</strong>. Espalda larga. Es el aductor largo, que en carrera y en bici trabaja mucho más de lo que nadie cree.":
  "Ajoelhado, uma perna estendida para o lado com o pé apoiado, e <strong>leve o quadril para trás e para o lado oposto</strong>. Coluna longa. É o adutor longo, que na corrida e na bike trabalha muito mais do que se imagina.",
"Plantas de los pies juntas, y <strong>inclinate desde la cadera con la espalda larga</strong> — no redondees para llegar más abajo, que es puro engaño. Los codos pueden empujar suave las rodillas.":
  "Solas dos pés unidas, e <strong>incline a partir do quadril com a coluna longa</strong> — não arredonde para chegar mais baixo, isso é só ilusão. Os cotovelos podem pressionar levemente os joelhos.",
"Sentado sobre los talones con los dedos de los pies flexionados hacia adelante — si es mucho, apoyá las manos y sacá peso. Después abrí y cerrá los dedos. <strong>La fascia plantar se endurece después de correr y nadie la toca hasta que duele.</strong>":
  "Sentado sobre os calcanhares com os dedos dos pés dobrados para a frente — se for demais, apoie as mãos e tire peso. Depois abra e feche os dedos. <strong>A fáscia plantar endurece depois de correr e ninguém toca nela até doer.</strong>",
"Rodá la planta del pie sobre la pelota, del talón a los dedos, lento, <strong>frenando en los puntos que se quejan</strong>. Presión que puedas sostener respirando normal.":
  "Role a sola do pé sobre a bolinha, do calcanhar aos dedos, devagar, <strong>parando nos pontos que reclamam</strong>. Pressão que você consiga sustentar respirando normalmente.",
"Sentado sobre los talones con los empeines planos en el piso, <strong>y subí apenas las rodillas para cargar el empeine</strong>. Después, círculos amplios de tobillo. Si venís de nadar, un tobillo que no apunta frena la patada; si venís de correr, es el que se te puso duro.":
  "Sentado sobre os calcanhares com o peito dos pés apoiado no chão, <strong>e levante um pouco os joelhos para carregar o peito do pé</strong>. Depois, círculos amplos de tornozelo. Se você vem da natação, um tornozelo que não estende freia a pernada; se vem da corrida, é ele que endureceu.",
"En cuadrupedia, el rodillo sobre la parte de adelante de la tibia, y rodá despacio de la rodilla al tobillo. Zona sensible: <strong>menos presión de la que creés.</strong>":
  "Em quatro apoios, o rolo sobre a frente da canela, rolando devagar do joelho ao tornozelo. Região sensível: <strong>menos pressão do que você imagina.</strong>",
"Sentado sobre los talones, brazos largos adelante, frente al piso. <strong>Respirá hacia la espalda baja</strong> y dejá que la cadera baje un poco más con cada exhalación. Acá el objetivo es bajar pulsaciones, no estirar más.":
  "Sentado sobre os calcanhares, braços longos à frente, testa no chão. <strong>Respire em direção à lombar</strong> e deixe o quadril descer um pouco mais a cada expiração. Aqui o objetivo é baixar os batimentos, não alongar mais.",
"Desde la postura del niño, caminá las manos hacia un costado hasta sentir el dorsal por el lateral del tronco. <strong>La cadera se queda atrás</strong>, no la sigas con el tronco.":
  "Da postura da criança, caminhe as mãos para um lado até sentir o dorsal na lateral do tronco. <strong>O quadril fica para trás</strong> — não deixe o tronco acompanhar.",
"Rodilla cruzada al lado opuesto, brazos abiertos, mirada al lado contrario. <strong>El hombro no se despega del piso</strong> — si se despega, bajá la rodilla. Soltá un poco más en cada exhalación.":
  "Joelho cruzado para o lado oposto, braços abertos, olhar para o lado contrário. <strong>O ombro não sai do chão</strong> — se sair, desça o joelho. Solte um pouco mais a cada expiração.",
"Boca abajo, codos debajo de los hombros, pelvis pesada en el piso. <strong>Es una extensión suave y sostenida, no una cobra.</strong> Si te aprieta la lumbar, llevá los codos más adelante hasta que deje de apretar.":
  "De bruços, cotovelos sob os ombros, pelve pesada no chão. <strong>É uma extensão suave e sustentada, não uma cobra.</strong> Se a lombar apertar, leve os cotovelos mais à frente até parar de apertar.",
"De costado, rodillas flexionadas y apiladas, brazos juntos adelante. <strong>Abrí el brazo de arriba siguiendo la mano con la mirada, y dejá las rodillas quietas.</strong> Si las rodillas se separan, la rotación se te fue a la lumbar.":
  "Deitado de lado, joelhos flexionados e alinhados, braços juntos à frente. <strong>Abra o braço de cima acompanhando a mão com o olhar, e mantenha os joelhos parados.</strong> Se os joelhos se separam, a rotação foi para a lombar.",
"En cuadrupedia, alterná redondear y arquear al ritmo de la respiración. <strong>Vértebra por vértebra</strong>, no en bloque. Lento: post-entreno esto es para soltar, no para movilizar fuerte.":
  "Em quatro apoios, alterne arredondar e arquear no ritmo da respiração. <strong>Vértebra por vértebra</strong>, não em bloco. Devagar: pós-treino isso é para soltar, não para mobilizar forte.",
"De rodillas, antebrazos apoyados adelante y la cola hacia los talones. <strong>Hundí el pecho hacia el piso dejando que se abran las axilas.</strong> El movimiento es de la espalda alta: si se arquea la lumbar, acercá más la cola a los talones.":
  "Ajoelhado, antebraços apoiados à frente e o quadril em direção aos calcanhares. <strong>Afunde o peito em direção ao chão deixando as axilas abrirem.</strong> O movimento é da parte alta das costas: se a lombar arquear, aproxime mais o quadril dos calcanhares.",
"Llevá el brazo cruzado por delante del pecho y <strong>empujá desde el codo, nunca desde la muñeca</strong>. La clave: bajá el omóplato y no dejes que el hombro se vaya adelante. Si se va adelante, estás moviendo la escápula en vez de soltar la parte de atrás del hombro.":
  "Leve o braço cruzado à frente do peito e <strong>empurre pelo cotovelo, nunca pelo punho</strong>. A chave: abaixe a escápula e não deixe o ombro ir para a frente. Se ele vai para a frente, você está deslizando a escápula em vez de soltar a parte de trás do ombro.",
"Boca abajo, un brazo extendido en cruz a la altura del hombro, y rodá el cuerpo hacia ese lado apoyando el pie contrario. <strong>Buscá el pecho, no el frente del hombro</strong> — si lo sentís dentro de la articulación, bajá el brazo unos centímetros y volvé a probar.":
  "De bruços, um braço estendido para o lado na altura do ombro, e role o corpo para esse lado apoiando o pé oposto. <strong>Procure o peitoral, não a frente do ombro</strong> — se sentir dentro da articulação, desça o braço alguns centímetros e tente de novo.",
"Boca abajo, la pelota debajo de la clavícula, por dentro del hombro. <strong>Presión suave y quieta.</strong> Esta zona no se rodea, se sostiene.":
  "De bruços, a bolinha sob a clavícula, por dentro do ombro. <strong>Pressão suave e parada.</strong> Essa região não se rola, se sustenta.",
"Codo arriba junto a la oreja, mano entre los omóplatos, y empujá suave el codo con la otra mano. <strong>Costillas abajo</strong> — si la lumbar se arquea, ganaste rango con la espalda y no con el hombro.":
  "Cotovelo para cima ao lado da orelha, mão entre as escápulas, e empurre o cotovelo suavemente com a outra mão. <strong>Costelas para baixo</strong> — se a lombar arquear, você ganhou amplitude com a coluna e não com o ombro.",
"Sentado, la mano del lado que estirás sujeta el borde de la colchoneta, y llevá la oreja al hombro contrario <strong>sin encoger el hombro</strong>. No tires con la otra mano: el peso de la cabeza alcanza y sobra.":
  "Sentado, a mão do lado que você alonga segura a borda do colchonete, e leve a orelha ao ombro oposto <strong>sem encolher o ombro</strong>. Não puxe com a outra mão: o peso da cabeça já basta.",
"En cuadrupedia, girá la mano hasta que los dedos apunten a las rodillas y <strong>sentate lento hacia atrás</strong>. Después dá vuelta la mano y apoyá el dorso para el otro lado. Horas agarrado al manillar se pagan acá.":
  "Em quatro apoios, gire a mão até os dedos apontarem para os joelhos e <strong>sente devagar para trás</strong>. Depois vire a mão e apoie o dorso para o outro lado. Horas segurando o guidão se pagam aqui.",
"Cola cerca de la pared, piernas verticales apoyadas en ella, brazos al costado. <strong>Dos minutos enteros, y no estás estirando nada: estás bajando pulsaciones y sacándote el peso de las piernas.</strong> Si tira mucho de los isquios, alejá la cola de la pared.":
  "Quadril perto da parede, pernas apoiadas na vertical, braços ao lado do corpo. <strong>Dois minutos inteiros, e você não está alongando nada: está baixando os batimentos e tirando o peso das pernas.</strong> Se puxar muito os isquiotibiais, afaste o quadril da parede.",
"Boca arriba, rodillas dobladas, una mano en el pecho y otra en la panza. <strong>Inhalá 4 segundos por la nariz llevando el aire a la panza, exhalá 6 por la boca.</strong> La exhalación larga es la que baja el sistema nervioso, y es lo que convierte esto en recuperación y no en una entrada en calor tardía. Si querés un protocolo con timer, tenés <a href=\\\"/members/respiracion/\\\">Respiración en caja</a>.":
  "Deitado, joelhos dobrados, uma mão no peito e outra na barriga. <strong>Inspire 4 segundos pelo nariz levando o ar à barriga, expire 6 pela boca.</strong> A expiração longa é o que acalma o sistema nervoso, e é o que transforma isso em recuperação em vez de um aquecimento tardio. Se quiser um protocolo com timer, existe <a href=\\\"/members/pt/respiracao/\\\">Respiração em caixa</a>.",

"Movilidad post-carrera": "Mobilidade pós-corrida",
"Movilidad post-bici": "Mobilidade pós-bike",
"Movilidad post-natación": "Mobilidade pós-natação",
"Movilidad post-combinado": "Mobilidade pós-combinado",
"Movilidad de cuerpo completo": "Mobilidade de corpo inteiro",
"Cadena posterior, psoas y glúteo, que es lo que te acaba de trabajar. Sostenés cada posición, no rebotás.":
  "Cadeia posterior, psoas e glúteo — o que acabou de trabalhar. Você sustenta cada posição, não faz molejo.",
"Abrir lo que la posición de bici cerró: cadera, pecho y espalda alta. Sostenés cada posición, no rebotás.":
  "Abrir o que a posição na bike fechou: quadril, peito e parte alta das costas. Você sustenta cada posição, não faz molejo.",
"Descomprimir el hombro y la espalda alta — y las piernas, que patearon una hora y nadie estira.":
  "Descomprimir o ombro e a parte alta das costas — e as pernas, que bateram uma hora e ninguém alonga.",
"Lo que dejaron las tres cosas juntas: cuádriceps y gemelos de correr, cadera de la bici, dorsal de nadar.":
  "O que as três coisas juntas deixaram: quadríceps e panturrilhas da corrida, quadril da bike, dorsal da natação.",
"Sin deporte asignado: recorrido completo de arriba a abajo. Sirve igual después del gimnasio o de un día largo.":
  "Sem esporte definido: uma passagem completa de cima a baixo. Serve igual depois da academia ou de um dia longo.",
"Correr deja el sóleo y los isquios con tono alto y el psoas corto, y después te sentás ocho horas encima de eso. Diez minutos en el piso ahora valen más que media hora mañana, porque el tejido todavía está caliente y todavía te acordás de qué te molestó.":
  "Correr deixa o sóleo e os isquiotibiais com tônus alto e o psoas encurtado, e depois você senta oito horas em cima disso. Dez minutos no chão agora valem mais que meia hora amanhã, porque o tecido ainda está quente e você ainda lembra do que incomodou.",
"En la bici estás una hora o cinco en la misma posición: cadera cerrada, espalda alta redondeada, cuello extendido para mirar adelante y las manos agarrando. Nada de eso se arregla solo, y es acumulativo — la molestia lumbar del ciclista casi nunca empieza en la lumbar.":
  "Na bike você passa uma hora ou cinco na mesma posição: quadril fechado, parte alta das costas arredondada, pescoço estendido para olhar à frente e as mãos segurando. Nada disso se resolve sozinho, e é cumulativo — a dor lombar do ciclista quase nunca começa na lombar.",
"Nadar deja el dorsal y el pectoral menor tirando del hombro hacia adelante, que es exactamente la posición desde la que se pincha. Y deja las piernas afuera de la conversación: pateaste una hora con el tobillo en punta y mañana salís a correr con eso.":
  "Nadar deixa o dorsal e o peitoral menor puxando o ombro para a frente, que é exatamente a posição de onde ele pinça. E deixa as pernas fora da conversa: você bateu uma hora com o tornozelo em ponta e amanhã sai para correr com isso.",
"Un día combinado deja tres deudas distintas y ninguna se paga con la misma postura. Esta sesión toca las tres: lo que corriste, lo que pedaleaste y lo que nadaste, en ese orden de prioridad.":
  "Um dia combinado deixa três dívidas diferentes e nenhuma se paga com a mesma postura. Esta sessão cobre as três: o que você correu, o que pedalou e o que nadou, nessa ordem de prioridade.",
"Cuando no sabés qué te dejó duro, o fue de todo un poco, el mejor uso del tiempo es un recorrido completo en vez de insistir sobre una sola zona. Vale igual para un día de gimnasio o para un día largo de trabajo.":
  "Quando você não sabe o que deixou o corpo duro, ou foi um pouco de tudo, o melhor uso do tempo é uma passagem completa em vez de insistir em uma só região. Vale igual para um dia de academia ou um dia longo de trabalho.",
"Listo. Comé algo en la próxima media hora.": "Pronto. Coma alguma coisa na próxima meia hora.",
"Listo. Eso es la sesión completa.": "Pronto. Essa é a sessão completa.",
"Para un día con más de un deporte: un ladrillo, o bici a la mañana y carrera a la tarde.":
  "Para um dia com mais de um esporte: um tijolo, ou bike de manhã e corrida à tarde.",
"Si sentís todo duro, si fue día de gimnasio, o si no querés elegir.":
  "Se está tudo duro, se foi dia de academia, ou se você prefere não escolher.",

'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasá por <a href="/members/rodillas/">Rodillas</a> o <a href="/members/aquiles/">Aquiles</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
  'Se algo <strong>dói</strong> em vez de estar duro, esta não é a ferramenta de hoje: passe por <a href="/members/pt/joelhos/">Joelhos</a> ou <a href="/members/pt/aquiles/">Aquiles</a>. E se a dor continuar, é consulta médica, não uma rotina.',
'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasá por <a href="/members/rodillas/">Rodillas</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
  'Se algo <strong>dói</strong> em vez de estar duro, esta não é a ferramenta de hoje: passe por <a href="/members/pt/joelhos/">Joelhos</a>. E se a dor continuar, é consulta médica, não uma rotina.',
'Si el hombro <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasá por <a href="/members/hombro/">Hombro de nadador</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
  'Se o ombro <strong>dói</strong> em vez de estar duro, esta não é a ferramenta de hoje: passe por <a href="/members/pt/ombro/">Ombro de Nadador</a>. E se a dor continuar, é consulta médica, não uma rotina.',
'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasá por <a href="/members/rodillas/">Rodillas</a>, <a href="/members/aquiles/">Aquiles</a> u <a href="/members/hombro/">Hombro</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
  'Se algo <strong>dói</strong> em vez de estar duro, esta não é a ferramenta de hoje: passe por <a href="/members/pt/joelhos/">Joelhos</a>, <a href="/members/pt/aquiles/">Aquiles</a> ou <a href="/members/pt/ombro/">Ombro</a>. E se a dor continuar, é consulta médica, não uma rotina.',

# --- in-file section comments ---
'PIERNA / CADERA */':
  'PERNA / QUADRIL */',
'TRONCO / ESPALDA */':
  'TRONCO / COSTAS */',
'CIERRE */':
  'ENCERRAMENTO */',
'HOMBRO / CUELLO\n       El cruce de hombro reemplaza al sleeper stretch del documento original, y\n       la apertura boca abajo reemplaza al estiramiento en el marco de la puerta.\n       Las dos razones están arriba, en el bloque de notas. */':
  'OMBRO / PESCOÇO\n       O alongamento cruzado substitui o sleeper stretch do documento original, e\n       a abertura de peito de bruços substitui o alongamento no batente da porta.\n       As duas razões estão no bloco do topo e em `mobility-brief.md` §3. */',
}

# The library breadcrumb on the setup screen is hardcoded per language; the
# partial's own crumb resolves from nav.json, but this one is in our markup.
CRUMB = {"en": ('href="/members/#biblioteca"', 'href="/members/en/#biblioteca"'),
         "pt": ('href="/members/#biblioteca"', 'href="/members/pt/#biblioteca"')}

MAPS = {"en": EN, "pt": PT}

# Spanish that must not survive. Deliberately words with no English or
# Portuguese homograph, so a hit is a real miss and not a false alarm.
LEFTOVER = {
 "en": ["Sin equipo", "Pared", "Rodillo", "Pelota", "ejercicio", "hombro",
        "rodilla", "cadera", "piso", "pecho", "espalda", " los ", " las ",
        " que ", " para ", "Movilidad", "minutos"],
 "pt": ["Sin equipo", "ejercicio", "rodilla", "cadera", " los ", " las ",
        "Movilidad", "estiramiento", " y ", "hacia"],
}

def build(lang):
    src = io.open(SRC, encoding="utf-8").read()

    # Replace the header comment block wholesale.
    start = src.index("{#-")
    end = src.index("-#}") + 3
    src = src[:start] + (HEADER % {"LANGNAME": LANGNAME[lang]}) + src[end:]

    mapping = MAPS[lang]
    # Longest first: a short key can never consume part of a longer one.
    misses = []
    for k in sorted(mapping, key=len, reverse=True):
        if k not in src:
            misses.append(k)
            continue
        src = src.replace(k, mapping[k])
    if misses:
        print("FAIL [%s] %d mapping(s) never matched:" % (lang, len(misses)))
        for m in misses:
            print("   - " + m[:110])
        return None

    a, b = CRUMB[lang]
    assert a in src, "crumb anchor missing"
    src = src.replace(a, b)

    leftovers = [w for w in LEFTOVER[lang] if w in src]
    if leftovers:
        print("FAIL [%s] untranslated Spanish survived: %r" % (lang, leftovers))
        for w in leftovers:
            i = src.index(w)
            print("   ...%s..." % src[max(0, i - 90):i + 90].replace("\n", " "))
        return None
    return src

def main():
    if not os.path.exists(SRC):
        sys.exit("run from the repo root; %s not found" % SRC)
    ok = True
    for lang, out in OUT.items():
        built = build(lang)
        if built is None:
            ok = False
            continue
        os.makedirs(os.path.dirname(out), exist_ok=True)
        io.open(out, "w", encoding="utf-8").write(built)
        print("wrote %s  (%d bytes)" % (out, len(built)))
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
