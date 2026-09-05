#!/usr/bin/env python3
"""
recovery-i18n.py — derives /members/en/recovery/ and /members/pt/recuperacao/
from /members/recuperacion/.

Same purpose and the same guards as `automation/mobility-i18n.py`, with one
mechanical improvement worth knowing about: the exercise names and cues are
translated BY POSITION rather than by matching the Spanish text.

Why: this page has 50 name/cue pairs, several of them long. A literal-match map
means 50 chances to mistype a source key, and a mistyped key is a mapping that
never fires. Instead, EX below is an ORDERED list, and the script asserts that
the name it finds at position i is the name this file expects at position i.
So a drift in the Spanish page is a hard failure naming the exact position,
rather than a silent no-op — and the ids, modes, holds, tags-as-structure and
the three routine tables are still never touched by anything here.

It is NOT a build step. It is the derivation record: when a Spanish cue is
corrected, this file says what the other two languages say in the same place.

Guards, all fatal:
  * every ordered entry must match the Spanish name it claims to translate;
  * every COPY mapping must fire;
  * the output is swept for surviving Spanish words. A survivor fails the run.

Usage, from the repo root:   python3 automation/recovery-i18n.py
"""

import io, os, re, sys

SRC = "site/members/recuperacion/index.njk"
OUT = {"en": "site/members/en/recovery/index.njk",
       "pt": "site/members/pt/recuperacao/index.njk"}

HEADER = """{#- RECUPERACIÓN ACTIVA, %(LANGNAME)s SIBLING of /members/recuperacion/.
    Derived from the Spanish page by `automation/recovery-i18n.py`, which
    substitutes string literals and nothing else — so the exercise ids, the
    three routine tables, the block composition, every hold and every mode are
    identical to the Spanish page by construction, not by review.

    *** DO NOT HAND-EDIT THE STRUCTURE HERE. *** If a routine changes, it
    changes in the Spanish page and this one is regenerated. If a CUE changes,
    fix it in both places in the same pass — the script's ordered list is the
    record of which string corresponds to which.

    Home doc: `recovery-brief.md`. It owns all of it: the six decisions, and in
    particular why the three blocks are named the way they are (a third of this
    session is strength work and the athlete is entitled to know), and why the
    30-minute cores lead with CARs, flows and long holds rather than with the
    movements the library already had.

    *** THE CLINICAL REVERSALS ARE THE REASON THIS FILE IS TESTED IN ITS OWN
    LANGUAGE: NO shoulder dislocates (third attempt — the capped stick pass-
    through is a VARIANT and its cue carries the cap), NO Jefferson curls, and
    the eyes-closed balance stays capped. A translation is exactly where a
    clinical decision silently reverts, because the reviewer is reading for
    fluency. The same assertions that run against the Spanish page run here. ***

    *** AND THE TWO DELIBERATE DISAGREEMENTS WITH /members/movilidad/ SURVIVE
    TRANSLATION: frog pose and winged dragon belong HERE, on fresh tissue, and
    were cut from the post-workout tool for that reason. Do not harmonise. ***

    *** EVERY NOTE ABOUT THIS PAGE BELONGS IN THIS BLOCK. Almost the whole page
    is inside {%% raw %%}, where a Nunjucks comment is NOT a comment — it is
    literal text that renders to the reader. Use an HTML comment or write it
    here. -#}"""

LANGNAME = {"en": "ENGLISH", "pt": "PORTUGUESE"}

# ---------------------------------------------------------------------------
# ORDERED name/cue translations. Position i here must be the i-th `name:` in the
# Spanish page; the script asserts it. `es` is the expected Spanish name and is
# a CHECK, not a lookup key.
# ---------------------------------------------------------------------------
EX = [
 dict(es="CARs de cadera",
   en=("Hip CARs",
       "Standing or on all fours, bring the knee to your chest, open it out to the side, rotate it behind you and lower — the biggest circle you can make <strong>with nothing moving but the hip</strong>. Very slow: two or three circles in the minute. <strong>If your torso compensates, make the circle smaller</strong>; the range you control is the range you have."),
   pt=("CARs de quadril",
       "Em pé ou em quatro apoios, leve o joelho ao peito, abra para o lado, gire para trás e desça — o maior círculo que conseguir <strong>sem que nada além do quadril se mova</strong>. Bem devagar: dois ou três círculos no minuto. <strong>Se o tronco compensar, diminua o círculo</strong>; a amplitude que você controla é a amplitude que você tem.")),
 dict(es="CARs de hombro",
   en=("Shoulder CARs",
       "Arm straight, raise it in front of you to overhead, rotate it and lower it behind — the widest circle you can draw. <strong>Ribs down, and your other hand on your sternum to feel whether the torso moves.</strong> Two or three turns in the minute, with tension through the whole arm."),
   pt=("CARs de ombro",
       "Braço estendido, suba pela frente até em cima, gire e desça por trás, desenhando o maior círculo possível. <strong>Costelas para baixo e a outra mão no esterno para sentir se o tronco se mexe.</strong> Duas ou três voltas no minuto, com tensão no braço inteiro.")),
 dict(es="CARs de columna",
   en=("Spine CARs",
       "Sitting on your heels or on a chair. Segment by segment: thoracic flexion and extension, then side bending each way, then rotation. <strong>The hips do not move — if they do, you have stopped moving your spine.</strong> It is slow and it is boring, and it is one of the things that gives back the most range."),
   pt=("CARs de coluna",
       "Sentado sobre os calcanhares ou numa cadeira. Segmento por segmento: flexão e extensão torácica, depois inclinação para cada lado, depois rotação. <strong>O quadril não se move — se ele se move, você já não está movendo a coluna.</strong> É lento e é chato, e é das coisas que mais devolvem amplitude.")),
 dict(es="CARs de tobillo",
   en=("Ankle CARs",
       "Sitting with the leg straight, draw the biggest circle you can with your toes, both directions. <strong>The knee and the leg stay still.</strong> Find the edge of the range and pause there a second at every point."),
   pt=("CARs de tornozelo",
       "Sentado com a perna estendida, desenhe o maior círculo possível com a ponta do pé, nas duas direções. <strong>O joelho e a perna ficam parados.</strong> Procure o limite da amplitude e pare um segundo em cada ponto.")),
 dict(es="Perro abajo a perro arriba",
   en=("Down dog to up dog",
       "Flow between the two positions with your breath: exhale into downward dog driving the heels toward the floor, inhale through to upward dog opening the chest. <strong>Do not rush the transition: half the benefit is in the journey</strong>, not in the two photographs."),
   pt=("Cão para baixo a cão para cima",
       "Flua entre as duas posturas no ritmo da respiração: expire indo ao cão para baixo empurrando os calcanhares ao chão, inspire passando ao cão para cima abrindo o peito. <strong>Sem apressar a transição: metade do benefício está no caminho</strong>, não nas duas fotos.")),
 dict(es="Saludo al sol lento",
   en=("Slow sun salutation",
       "The full sequence, slowly, one movement per breath: standing, arms overhead, fold forward, half lift, plank, downward dog, step forward, and back up. <strong>Repeat it as many times as fit in the block, alternating which leg steps forward.</strong> It is the only part of the session that will lift your heart rate a little, and that is fine."),
   pt=("Saudação ao sol lenta",
       "Sequência completa e lenta, um movimento por respiração: em pé, braços para cima, dobre à frente, meia elevação, prancha, cão para baixo, passo à frente, e volte. <strong>Repita quantas vezes couberem no bloco, alternando qual perna vai à frente.</strong> É a única parte da sessão que vai subir um pouco seus batimentos, e tudo bem que seja assim.")),
 dict(es="Guerrero I a II y Triángulo",
   en=("Warrior I to II and Triangle",
       "Warrior I with the hips square to the front, open into Warrior II turning the torso, and from there drop into triangle reaching the long arm out. <strong>Hold each one about five breaths before moving on.</strong> Front knee always over the ankle, never past the foot."),
   pt=("Guerreiro I a II e Triângulo",
       "Guerreiro I com o quadril de frente, abra para Guerreiro II girando o tronco, e dali desça ao triângulo estendendo o braço longo. <strong>Sustente cada uma por umas cinco respirações antes de passar à seguinte.</strong> O joelho da frente sempre sobre o tornozelo, nunca à frente do pé.")),
 dict(es="Sentadilla profunda sostenida",
   en=("Deep squat hold",
       "All the way down, heels on the floor, elbows inside the knees pressing gently outward. <strong>Move around inside the position: side to side, a little forward and back.</strong> If your heels lift, put something under them — the right position with help beats the wrong one without."),
   pt=("Agachamento profundo sustentado",
       "Lá embaixo, calcanhares no chão, cotovelos por dentro dos joelhos empurrando suavemente para fora. <strong>Movimente-se dentro da postura: de um lado para o outro, um pouco para frente e para trás.</strong> Se os calcanhares levantarem, apoie-os em algo — a posição correta com ajuda vale mais que a incorreta sem ela.")),
 dict(es="Postura de la rana",
   en=("Frog pose",
       "Knees wide and in line with your hips, ankles behind the knees, forearms on the floor. Lower your hips to the first point of tension and <strong>stay there three minutes breathing, without chasing more</strong>. This is a passive position: the time does the work, you do not. <strong>Recovery days only</strong> — it does not belong on tissue you just trained."),
   pt=("Postura do sapo",
       "Joelhos abertos e alinhados com o quadril, tornozelos atrás dos joelhos, antebraços no chão. Desça o quadril até o primeiro ponto de tensão e <strong>fique ali três minutos respirando, sem buscar mais</strong>. Esta é uma postura passiva: o tempo faz o trabalho, você não. <strong>Só num dia sem sessão</strong> — sobre tecido recém-treinado não vai.")),
 dict(es="Dragón alado",
   en=("Winged dragon",
       "Very long lunge, hands inside the front foot, back knee down. Let the front knee fall outward and drop onto your forearms if you get there. <strong>It is intense: stay at a 6 or 7 out of 10, never more.</strong> Breathe long and do not force it with bouncing."),
   pt=("Dragão alado",
       "Afundo bem longo, mãos por dentro do pé da frente, joelho de trás no chão. Deixe o joelho da frente cair para fora e desça sobre os antebraços se alcançar. <strong>É intensa: fique num 6 ou 7 de 10, nunca mais.</strong> Respire longo e não force com molejo.")),
 dict(es="Psoas con contracción y suelta",
   en=("Hip flexor, contract and release",
       "Half-kneeling with the pelvis tucked. <strong>Press the back knee into the floor at 20% for 5 seconds, release, and move a little further in.</strong> Three or four times in the block. That contract-and-release is what actually buys range; without it this is just another stretch."),
   pt=("Psoas com contração e soltura",
       "Meio ajoelhado com a pelve encaixada. <strong>Empurre o joelho de trás contra o chão a 20% por 5 segundos, solte, e avance um pouco.</strong> Três ou quatro vezes no bloco. Essa contração-e-soltura é o que realmente ganha amplitude; sem ela é só mais um alongamento.")),
 dict(es="Isquios con contracción y suelta",
   en=("Hamstrings, contract and release",
       "On your back, leg toward the ceiling held behind the thigh. <strong>Press your heel into your hands at 20% for 5 seconds, release, and raise the leg a little further.</strong> Three or four cycles. The bottom leg stays down the whole time."),
   pt=("Isquiotibiais com contração e soltura",
       "Deitado, perna para o teto segurada por trás da coxa. <strong>Empurre o calcanhar contra as mãos a 20% por 5 segundos, solte, e suba a perna um pouco mais.</strong> Três ou quatro ciclos. A perna de baixo fica apoiada o tempo todo.")),
 dict(es="Equilibrio en una pierna, ojos cerrados",
   en=("Single-leg balance, eyes closed",
       "Stand on one leg and close your eyes. <strong>With a wall or a chair within arm's reach</strong> — you will lose your balance, that is the point. Let the foot work: toes active, ankle correcting. Forty seconds a side is plenty."),
   pt=("Equilíbrio numa perna, olhos fechados",
       "Em pé numa perna, feche os olhos. <strong>Com uma parede ou cadeira ao alcance da mão</strong> — você vai perder o equilíbrio, essa é a ideia. Deixe o pé trabalhar: dedos ativos, tornozelo corrigindo. Quarenta segundos por lado bastam e sobram.")),
 dict(es="Enrollado vertebral boca arriba",
   en=("Supine segmental roll-down",
       "On your back, knees bent. Peel the pelvis up <strong>vertebra by vertebra</strong> until you are resting on your shoulder blades, and come down the same way, laying the spine down from the top. What you want is the spine articulating in segments, not height. Five or six slow cycles."),
   pt=("Enrolamento vertebral deitado",
       "Deitado, joelhos dobrados. Descole a pelve e suba <strong>vértebra por vértebra</strong> até apoiar nas escápulas, e desça igualmente devagar, apoiando de cima para baixo. O que você busca é a coluna articulando por segmentos, não subir alto. Cinco ou seis ciclos lentos.")),
 dict(es="Escaneo corporal",
   en=("Body scan",
       "On your back, legs long, palms up. Travel through your body from feet to head, <strong>pausing at each area for the length of one breath and letting go of whatever you find tight</strong>. Jaw and upper traps last: there is almost always something left there."),
   pt=("Escaneamento corporal",
       "Deitado, pernas longas, palmas para cima. Percorra o corpo dos pés à cabeça, <strong>parando em cada região o tempo de uma respiração e soltando o que encontrar apertado</strong>. Mandíbula e trapézios no fim: quase sempre sobra algo ali.")),
 dict(es="Gato-camello",
   en=("Cat-cow",
       "On all fours, alternate rounding and arching with your breath, <strong>vertebra by vertebra</strong>. Here you have time: do it twice as slowly as you would before training, and hunt for the segments that are not moving."),
   pt=("Gato-vaca",
       "Em quatro apoios, alterne arredondar e arquear no ritmo da respiração, <strong>vértebra por vértebra</strong>. Aqui você tem tempo: faça o dobro de devagar do que faria antes de treinar, e procure os segmentos que não se movem.")),
 dict(es="Rotación torácica en cuadrupedia",
   en=("Quadruped thoracic rotation",
       "On all fours, one hand behind your head. Take the elbow toward the opposite knee, then open, rotating the torso and following the elbow with your eyes. <strong>The hips stay square</strong> — if they travel with you, you are rotating from your lower back."),
   pt=("Rotação torácica em quatro apoios",
       "Em quatro apoios, uma mão atrás da cabeça. Leve o cotovelo em direção ao joelho oposto e depois abra girando o tronco, seguindo o cotovelo com o olhar. <strong>O quadril fica quadrado</strong> — se ele for junto, você está girando pela lombar.")),
 dict(es="Libro abierto",
   en=("Open book",
       "On your side, knees bent and stacked, arms together in front. <strong>Open the top arm following your hand with your eyes, and keep the knees still.</strong> Stay five breaths wherever you get to before coming back."),
   pt=("Livro aberto",
       "Deitado de lado, joelhos flexionados e alinhados, braços juntos à frente. <strong>Abra o braço de cima acompanhando a mão com o olhar, e mantenha os joelhos parados.</strong> Fique cinco respirações onde chegar antes de voltar.")),
 dict(es="Extensión torácica sobre rodillo",
   en=("Thoracic extension over the roller",
       "Roller across your upper back, hands behind your head. Extend back over it and <strong>move it two fingers higher and repeat</strong>, segment by segment. The lower back does not arch: your hips stay down."),
   pt=("Extensão torácica sobre o rolo",
       "Rolo atravessado sob a parte alta das costas, mãos atrás da cabeça. Estenda para trás sobre ele e <strong>mova-o dois dedos para cima e repita</strong>, segmento por segmento. A lombar não arqueia: o quadril fica apoiado.")),
 dict(es="El mejor estiramiento del mundo",
   en=("World's greatest stretch",
       "Long lunge, inside hand to the floor beside the foot, and <strong>open the chest rotating the top arm toward the ceiling</strong>. Hold at the top for three breaths before coming back. Hip, adductor and thoracic spine in one movement."),
   pt=("O melhor alongamento do mundo",
       "Afundo longo, mão de dentro no chão ao lado do pé, e <strong>abra o peito girando o braço de cima para o teto</strong>. Sustente em cima por três respirações antes de voltar. Quadril, adutor e torácica num só movimento.")),
 dict(es="Cadera 90/90",
   en=("90/90 hip",
       "Seated, one leg at 90° in front and the other at 90° to the side. Lean over the front leg, come back, and <strong>switch sides by lifting the knees and turning without using your hands</strong>. That active transition is the exercise; the lean is only half of it."),
   pt=("Quadril 90/90",
       "Sentado, uma perna a 90° à frente e a outra a 90° ao lado. Incline-se sobre a da frente, volte, e <strong>passe para o outro lado levantando os joelhos e girando sem usar as mãos</strong>. Essa transição ativa é o exercício; a inclinação é só metade.")),
 dict(es="Zancada spiderman con rotación",
   en=("Spiderman lunge with rotation",
       "From a plank, bring your foot outside the hand on the same side. Drop the elbow toward the floor, and from there <strong>rotate, opening the arm to the ceiling</strong>. Two or three slow reps a side inside the block, not one long hold."),
   pt=("Afundo spiderman com rotação",
       "Da prancha, leve o pé por fora da mão do mesmo lado. Desça o cotovelo em direção ao chão, e dali <strong>gire abrindo o braço para o teto</strong>. Duas ou três repetições lentas por lado dentro do bloco, não uma só sustentada.")),
 dict(es="Caminata de oruga",
   en=("Inchworm",
       "Standing, fold forward and walk your hands out to a plank without moving your feet. Walk them back to return. <strong>Legs as straight as they will tolerate</strong> — that is where the hamstring work is."),
   pt=("Caminhada da lagarta",
       "Em pé, dobre à frente e caminhe com as mãos até a prancha, sem mover os pés. Volte caminhando as mãos para trás. <strong>As pernas o mais estendidas que aguentarem</strong> — é aí que está o trabalho de isquiotibiais.")),
 dict(es="Sentadilla cosaca",
   en=("Cossack squat",
       "Feet wide, shift your weight down over one leg leaving the other straight with the toes up. <strong>Chest tall and the heel of the working leg flat on the floor.</strong> Move side to side slowly; do not go all the way down if your back rounds."),
   pt=("Agachamento cossaco",
       "Pés bem abertos, desça o peso sobre uma perna deixando a outra estendida com a ponta do pé para cima. <strong>Peito alto e o calcanhar da perna que desce colado ao chão.</strong> Passe de um lado ao outro devagar; não desça até embaixo se as costas arredondarem.")),
 dict(es="Balanceo de piernas",
   en=("Leg swings",
       "Leaning on the wall, swing the leg forward and back, then across your body side to side. <strong>Build the range gradually</strong> — starting at your maximum is how a hamstring gets pulled, even on an easy day."),
   pt=("Balanço de pernas",
       "Apoiado na parede, balance a perna para frente e para trás, depois cruzada de um lado ao outro. <strong>Aumente a amplitude aos poucos</strong> — começar no máximo é como se estira um isquiotibial, mesmo num dia leve.")),
 dict(es="Rodilla a la pared",
   en=("Knee to wall",
       "Foot a hand's width from the wall, <strong>touch the wall with your knee without the heel lifting</strong>. If it comes easily, move the foot back a centimetre and try again. It is the most honest measure of your ankle you have, and it improves with repetitions, not with force."),
   pt=("Joelho na parede",
       "Pé a um palmo da parede, <strong>toque a parede com o joelho sem que o calcanhar saia do chão</strong>. Se conseguir fácil, afaste o pé um centímetro e tente de novo. É a medida mais honesta do seu tornozelo, e melhora com repetições, não com força.")),
 dict(es="Ángeles en la pared",
   en=("Wall angels",
       "Back against the wall, <strong>lower back flat against it</strong>, arms in a W with elbows and the backs of your hands touching. Slide the arms up and down without anything peeling off. <strong>Stop exactly where something lifts</strong> — that is your range today, and forcing past it does not make it bigger."),
   pt=("Anjos na parede",
       "Costas contra a parede, <strong>lombar colada nela</strong>, braços em W com os cotovelos e o dorso das mãos encostados. Suba e desça os braços sem que nada descole. <strong>Pare exatamente onde algo descolar</strong> — até ali vai sua amplitude de hoje, e forçar mais não a aumenta.")),
 dict(es="Pasada de bastón (con tope)",
   en=("Stick pass-through (capped)",
       "Very wide grip, arms straight, take the stick from your thighs back behind you and return. <strong>This is not a flexibility contest: stop where your ribs flare, your lower back arches, or your shoulders rise.</strong> If you have to force it, narrow the grip."),
   pt=("Passada de bastão (com limite)",
       "Pegada bem larga, braços estendidos, passe o bastão das coxas para trás e volte. <strong>Isto não é um concurso de flexibilidade: pare onde as costelas abrirem, a lombar arquear ou os ombros subirem.</strong> Se precisar forçar, feche a pegada.")),
 dict(es="Escorpión boca abajo",
   en=("Prone scorpion",
       "Face down, arms out in a cross. Take one heel across toward the opposite hand letting the hips rotate, <strong>and keep your chest as close to the floor as you can</strong>. Slow going out and slow coming back."),
   pt=("Escorpião de bruços",
       "De bruços, braços em cruz. Leve um calcanhar cruzado em direção à mão oposta deixando o quadril girar, <strong>e o peito o mais colado ao chão possível</strong>. Devagar na ida e devagar na volta.")),
 dict(es="CARs de cuello",
   en=("Neck CARs",
       "Seated, shoulders still. Chin to chest, roll toward one shoulder, take the ear back, and complete the circle — very slowly, hunting for where it catches. <strong>Never forced and never fast</strong>: if you get dizziness or tingling, stop."),
   pt=("CARs de pescoço",
       "Sentado, ombros parados. Queixo ao peito, role em direção a um ombro, leve a orelha para trás e complete o círculo — bem devagar, procurando onde trava. <strong>Nunca à força e nunca rápido</strong>: se aparecer tontura ou formigamento, pare.")),
 dict(es="Almeja lenta",
   en=("Slow clamshell",
       "On your side, knees bent and heels together. Open the top knee <strong>without your hips rolling backward</strong> — put your hand on the glute and feel that it is working there. Slow, and hold a second at the top."),
   pt=("Concha lenta",
       "Deitado de lado, joelhos dobrados e calcanhares juntos. Abra o joelho de cima <strong>sem que o quadril caia para trás</strong> — ponha a mão no glúteo e sinta que ele trabalha ali. Devagar, e sustente um segundo em cima.")),
 dict(es="Almeja con minibanda",
   en=("Clamshell with a mini-band",
       "Band above the knees. Same movement against resistance, <strong>and the lowering as slow as the lift</strong>."),
   pt=("Concha com miniband",
       "Faixa acima dos joelhos. Mesmo movimento contra resistência, <strong>e a descida tão lenta quanto a subida</strong>.")),
 dict(es="Puente a una pierna",
   en=("Single-leg bridge",
       "One foot planted, the other knee to your chest. Lift the hips driving through the heel and <strong>keep the pelvis level — do not let one side drop</strong>. If it drops, reduce the range or do it on both legs."),
   pt=("Ponte numa perna",
       "Um pé apoiado, o outro joelho no peito. Suba o quadril empurrando pelo calcanhar e <strong>mantenha a pelve nivelada — sem deixar um lado cair</strong>. Se cair, reduza a amplitude ou faça com as duas pernas.")),
 dict(es="Puente con marcha",
   en=("Bridge with a march",
       "Bridge up and held, and from there lift one foot a few centimetres, put it down, and change. <strong>The hips do not drop and do not rotate.</strong> Slowly: this is control, not repetitions."),
   pt=("Ponte com marcha",
       "Ponte em cima e sustentada, e dali descole um pé alguns centímetros, apoie, e troque. <strong>O quadril não desce e não gira.</strong> Devagar: isto é controle, não repetições.")),
 dict(es="Bird dog",
   en=("Bird dog",
       "On all fours, extend opposite arm and leg to horizontal. <strong>Hold three seconds at the top with the lower back still</strong> — if your back arches or your hips rotate, lower the leg. Picture a glass of water on your lower back."),
   pt=("Bird dog",
       "Em quatro apoios, estenda braço e perna contrários até a horizontal. <strong>Sustente três segundos em cima com a lombar parada</strong> — se as costas arquearem ou o quadril girar, desça a perna. Imagine um copo d'água sobre a lombar.")),
 dict(es="Dead bug",
   en=("Dead bug",
       "Lower back flat on the floor, arms and knees up. Extend opposite arm and leg <strong>without your back lifting a millimetre</strong>. Exhale as you extend. Slow: the goal is control."),
   pt=("Dead bug",
       "Lombar colada ao chão, braços e joelhos para cima. Estenda braço e perna contrários <strong>sem que as costas descolem um milímetro</strong>. Expire ao estender. Devagar: o objetivo é controle.")),
 dict(es="Plancha lateral dinámica",
   en=("Dynamic side plank",
       "On your forearm, hips up and body in a line. <strong>Lower the hips until they brush the floor and lift again</strong>, slow and controlled. Knees down if the long version breaks your line."),
   pt=("Prancha lateral dinâmica",
       "Sobre o antebraço, quadril para cima e corpo alinhado. <strong>Desça o quadril até roçar o chão e suba de novo</strong>, devagar e controlado. Com os joelhos apoiados se a versão longa quebrar sua linha.")),
 dict(es="Caminata de oso",
   en=("Bear crawl",
       "On all fours with your knees a hand's width off the floor. Go forward and back moving opposite hand and foot, <strong>hips low and without swaying side to side</strong>. Short steps."),
   pt=("Caminhada do urso",
       "Em quatro apoios com os joelhos a um palmo do chão. Avance e recue movendo mão e pé contrários, <strong>com o quadril baixo e sem balançar de um lado para o outro</strong>. Passos curtos.")),
 dict(es="Flexión escapular",
   en=("Scapular push-up",
       "In a high plank with your <strong>elbows locked straight the whole time</strong>: let your chest sink, squeezing the shoulder blades together, then push the floor away, spreading them as far as they go. The movement is three or four centimetres and it is exactly the muscle a swimmer is missing."),
   pt=("Flexão escapular",
       "Em prancha alta com os <strong>cotovelos estendidos o tempo todo</strong>: deixe o peito descer juntando as escápulas, e depois empurre o chão afastando-as ao máximo. O movimento tem três ou quatro centímetros e é exatamente o músculo que falta a um nadador.")),
 dict(es="Y-T-W boca abajo",
   en=("Prone Y-T-W",
       "Face down, forehead resting, thumbs to the ceiling. Lift the arms into a Y, then a T, then a W. <strong>The shoulder blades go down, never toward your ears</strong>: if you shrug, the upper trap takes the work."),
   pt=("Y-T-W de bruços",
       "De bruços, testa apoiada, polegares para o teto. Descole os braços em Y, depois em T, depois em W. <strong>As escápulas vão para baixo, nunca em direção às orelhas</strong>: se você encolher, o trabalho vai para o trapézio superior.")),
 dict(es="Y-T-W con banda",
   en=("Y-T-W with a band",
       "Standing with the band in front of you, same sequence against low resistance. <strong>Many repetitions and little tension</strong> — that is what the posterior cuff responds to, not load."),
   pt=("Y-T-W com faixa",
       "Em pé com a faixa à frente, mesma sequência contra resistência baixa. <strong>Muitas repetições e pouca tensão</strong> — é a isso que o manguito posterior responde, não à carga.")),
 dict(es="Rotación externa isométrica",
   en=("Isometric external rotation",
       "Elbow tucked to your side at 90°, the back of your hand against a doorframe or a wall. <strong>Press outward at 50% and hold, with nothing moving.</strong> Do not let the shoulder travel forward or the elbow leave your ribs."),
   pt=("Rotação externa isométrica",
       "Cotovelo colado ao corpo a 90°, dorso da mão contra o batente de uma porta ou a parede. <strong>Empurre para fora a 50% e sustente, sem que nada se mova.</strong> Não deixe o ombro ir à frente nem o cotovelo sair das costelas.")),
 dict(es="Rotación externa con minibanda",
   en=("External rotation with a mini-band",
       "Band anchored at elbow height, elbow tucked to your side. Rotate outward and <strong>come back slower than you went</strong>. Short range and control."),
   pt=("Rotação externa com miniband",
       "Faixa ancorada na altura do cotovelo, cotovelo colado ao corpo. Gire para fora e <strong>volte mais devagar do que foi</strong>. Amplitude curta e controle.")),
 dict(es="Caminata lateral en media sentadilla",
   en=("Lateral walk in a half squat",
       "Half squat, chest tall, and walk sideways with even steps without fully bringing your feet together. <strong>Knees pressing outward the whole time</strong> and the hips at a constant height. Out and back."),
   pt=("Caminhada lateral em meio agachamento",
       "Meio agachamento, peito alto, e caminhe de lado com passos iguais sem juntar os pés por completo. <strong>Joelhos empurrando para fora o tempo todo</strong> e o quadril na mesma altura. Ida e volta.")),
 dict(es="Caminata lateral con minibanda",
   en=("Lateral walk with a mini-band",
       "Band at the ankles or above the knees. Same step against resistance, <strong>and without the trailing foot dragging</strong>."),
   pt=("Caminhada lateral com miniband",
       "Faixa nos tornozelos ou acima dos joelhos. Mesmo passo contra resistência, <strong>e sem que o pé de trás arraste</strong>.")),
 dict(es="Elevación de talones excéntrica",
   en=("Eccentric calf raise",
       "Rise on both legs and <strong>lower on one, counting three seconds</strong>. The lowering is the exercise. Alternate which leg lowers."),
   pt=("Elevação de panturrilha excêntrica",
       "Suba com as duas pernas e <strong>desça com uma só, contando três segundos</strong>. A descida é o exercício. Alterne a perna que desce.")),
 dict(es="Excéntricas en escalón",
   en=("Eccentrics off a step",
       "Forefoot on the edge of a step. Up on two, down on one <strong>letting the heel drop below the step</strong>, three seconds. If you are on the Achilles protocol, do not add volume here: count these sets as part of that one."),
   pt=("Excêntricas no degrau",
       "Meia planta na borda de um degrau. Suba com dois, desça com um <strong>deixando o calcanhar cair abaixo do degrau</strong>, três segundos. Se você está no protocolo de aquiles, não some volume aqui: conte estas séries como parte daquele.")),
 dict(es="Flexión plantar activa",
   en=("Active plantarflexion",
       "Sitting with your legs straight, <strong>point your toes as far away as they go and hold five seconds</strong>, then pull them back toward you. Active, not passive: it is the range that pushes water in your kick."),
   pt=("Flexão plantar ativa",
       "Sentado com as pernas estendidas, <strong>aponte as pontas dos pés o mais longe que conseguir e sustente cinco segundos</strong>, depois traga-as para você. Ativa, não passiva: é a amplitude que empurra a água na pernada.")),
 dict(es="Activación de transverso",
   en=("Transverse abdominis activation",
       "On your back, knees bent, hands on your hip bones just inside them. <strong>Breathe into your belly, and as you exhale draw the navel in and up without moving the pelvis.</strong> You should feel a soft tension under your fingers. It is subtle, and it is the base of everything else."),
   pt=("Ativação do transverso",
       "Deitado, joelhos dobrados, mãos sobre os ossos do quadril por dentro. <strong>Inspire para a barriga, e ao expirar leve o umbigo para dentro e para cima sem mover a pelve.</strong> Você deve sentir uma tensão suave sob os dedos. É sutil, e é a base de todo o resto.")),
 dict(es="Estocada inversa con brazos arriba",
   en=("Reverse lunge, arms overhead",
       "Long step back lowering the knee, <strong>with both arms straight overhead and your ribs down</strong>. The arms overhead are what turn this into hip and thoracic work at the same time."),
   pt=("Afundo reverso com braços acima",
       "Passo longo para trás descendo o joelho, <strong>com os dois braços estendidos acima da cabeça e as costelas para baixo</strong>. Os braços em cima são o que transforma isto em trabalho de quadril e torácica ao mesmo tempo.")),
]

# ---------------------------------------------------------------------------
# Everything that is not a name or a cue. Literal match; every one must fire.
# ---------------------------------------------------------------------------
COPY = {
"en": {
 "Recuperación activa — Triaperformance All-Access": "Active Recovery — Triaperformance All-Access",
 "Biblioteca": "Library",
 "/ Recuperación": "/ Recovery",
 "Recuperación activa": "Active recovery",
 "Recuperación": "Recovery",
 "Tu día de recuperación": "Your recovery day",
 "Dos preguntas y armamos la sesión. Movilidad lenta, algo de activación y posturas largas — todo por tiempo, los unilaterales por lado.":
   "Two questions and the session builds itself. Slow mobility, some activation work and long holds — all timed, single-side ones per side.",
 "¿Cuál es tu deporte?": "What is your sport?",
 "Correr": "Running", "Bici": "Cycling", "Nadar": "Swimming",
 "Triatlón": "Triathlon", "Todo el cuerpo": "Full body",
 "¿Cuánto tiempo tienes?": "How long do you have?",
 "30 min": "30 min", "45 min": "45 min", "60 min": "60 min",
 "Los tres tienen los mismos tres bloques y crecen juntos. Sesenta es donde entran el flujo largo y las posturas pasivas profundas, que es lo que no cabe en ningún otro lado.":
   "All three have the same three blocks and they grow together. Sixty is where the long flow and the deep passive holds fit — the things that do not fit anywhere else.",
 "Alcanza con una colchoneta y una pared. Si tienes banda, rodillo, bastón o un escalón, algunos ejercicios ofrecen esa versión con el botón":
   "A mat and a wall are enough. If you have a band, a roller, a stick or a step, some exercises offer that version through the",
 "Cambiar ejercicio": "Change exercise",
 "Esto es una sesión suave, no un día libre.": "This is an easy session, not a day off.",
 " Hay un bloque de activación real — glúteo, core y escápula. Ponlo en un día fácil o de descanso, no la víspera de una sesión de calidad ni de un fondo.":
   " There is a real activation block in here — glutes, core and shoulder blades. Put it on an easy or rest day, not the day before a quality session or a long one.",
 "¿Entrenas hoy? Entonces esto no es lo que buscas: ": "Training today? Then this is not what you want: ",
 "Activación": "Activation",
 " antes de entrenar, ": " before you train, ",
 "Movilidad": "Mobility",
 " después. Esta sesión es para el día que no entrenas.": " after. This session is for the day you do not train.",
 "Armar mi sesión →": "Build my session →",
 "Empezar la sesión →": "Start the session →",
 "Sesión completa": "Session complete",
 "← Cambiar opciones": "← Change options",
 " minutos": " minutes",
 "Posturas largas": "Long holds",
 "Sin equipo": "No equipment", "Pared": "Wall", "Rodillo": "Roller",
 "Minibanda": "Mini-band", "Banda larga": "Long band",
 "Bastón o palo": "Stick or broomstick", "Escalón": "Step",
 "Recuperación para corredores": "Recovery for runners",
 "Recuperación para ciclistas": "Recovery for cyclists",
 "Recuperación para nadadores": "Recovery for swimmers",
 "Recuperación para triatletas": "Recovery for triathletes",
 "Recuperación de cuerpo completo": "Full-body recovery",
 "Cadera, tobillo y cadena posterior, con control lento y posturas largas. Es una sesión suave, no un día libre.":
   "Hips, ankles and posterior chain, with slow control and long holds. It is an easy session, not a day off.",
 "Rotación torácica, independencia de cadera y el glúteo que la bici apaga. Es una sesión suave, no un día libre.":
   "Thoracic rotation, hip independence and the glutes the bike switches off. It is an easy session, not a day off.",
 "Control escapular, torácica y cuello — y el tobillo, que en el agua empuja. Es una sesión suave, no un día libre.":
   "Scapular control, thoracic spine and neck — and the ankle, which is what pushes water. It is an easy session, not a day off.",
 "Las tres cadenas conectadas, más equilibrio y propiocepción. Es una sesión suave, no un día libre.":
   "All three chains connected, plus balance and proprioception. It is an easy session, not a day off.",
 "Recorrido completo de arriba a abajo, sin deporte asignado. Es una sesión suave, no un día libre.":
   "A full pass from top to bottom, no sport assumed. It is an easy session, not a day off.",
 "Un día sin correr es cuando el tejido acepta trabajo que no aceptaría cansado: rango controlado, posturas pasivas largas y contracción-suelta. Nada de esto entra en los diez minutos antes de una sesión, y es exactamente lo que le falta a un corredor que solo corre.":
   "A day without running is when tissue accepts work it would refuse when tired: controlled range, long passive holds and contract-relax. None of that fits into the ten minutes before a session, and it is exactly what a runner who only runs is missing.",
 "La bici te deja tres deudas que no se pagan pedaleando: torácica que no rota, cadera que solo trabaja en un plano y glúteo que se apagó. Un día suelto es cuando se pueden atacar de verdad, porque hay tiempo para lo lento y para lo largo.":
   "The bike leaves you three debts that pedalling does not pay off: a thoracic spine that will not rotate, hips that only work in one plane, and glutes that have switched off. A free day is when you can actually go at them, because there is time for the slow and the long.",
 "El hombro del nadador no se arregla estirando: se arregla con control escapular y rango que puedas sostener. Eso es trabajo lento y repetido, y necesita un día en el que no tengas que entrar al agua después.":
   "A swimmer's shoulder is not fixed by stretching: it is fixed with scapular control and range you can hold. That is slow, repeated work, and it needs a day when you do not have to get in the water afterwards.",
 "Tres deportes dejan tres patrones y ninguno se corrige apurado. Este es el día para lo que no entra en una activación: CARs largos, posturas pasivas, contracción-suelta y equilibrio, que es lo primero que se pierde con el volumen.":
   "Three sports leave three patterns and none of them is corrected in a hurry. This is the day for what does not fit into an activation: long CARs, passive holds, contract-relax and balance, which is the first thing volume takes away.",
 "Un día de recuperación bien usado hace más por tu rango que tres activaciones apuradas. Aquí hay tiempo para lo lento, lo largo y lo aburrido, que es donde está casi todo el beneficio.":
   "A recovery day used well does more for your range than three rushed activations. Here there is time for the slow, the long and the boring, which is where almost all of the benefit lives.",
 "Listo. Eso es una sesión, no un descanso — tenlo en cuenta mañana.":
   "Done. That was a session, not a rest — keep it in mind tomorrow.",
 "Sin deporte asignado. Sirve igual para un día de gimnasio o para uno de escritorio.":
   "No sport assumed. Works just as well for a gym day or a desk day.",
 "Para el que hace los tres: prioriza cadera y hombro, y suma equilibrio.":
   "For the athlete doing all three: it prioritises hips and shoulders, and adds balance.",
},
"pt": {
 "Recuperación activa — Triaperformance All-Access": "Recuperação ativa — Triaperformance All-Access",
 "Biblioteca": "Biblioteca",
 "/ Recuperación": "/ Recuperação",
 "Recuperación activa": "Recuperação ativa",
 "Recuperación": "Recuperação",
 "Tu día de recuperación": "Seu dia de recuperação",
 "Dos preguntas y armamos la sesión. Movilidad lenta, algo de activación y posturas largas — todo por tiempo, los unilaterales por lado.":
   "Duas perguntas e a sessão se monta sozinha. Mobilidade lenta, um pouco de ativação e posturas longas — tudo por tempo, os unilaterais por lado.",
 "¿Cuál es tu deporte?": "Qual é o seu esporte?",
 "Correr": "Corrida", "Bici": "Bike", "Nadar": "Natação",
 "Triatlón": "Triatlo", "Todo el cuerpo": "Corpo inteiro",
 "¿Cuánto tiempo tienes?": "Quanto tempo você tem?",
 "30 min": "30 min", "45 min": "45 min", "60 min": "60 min",
 "Los tres tienen los mismos tres bloques y crecen juntos. Sesenta es donde entran el flujo largo y las posturas pasivas profundas, que es lo que no cabe en ningún otro lado.":
   "Os três têm os mesmos três blocos e crescem juntos. Sessenta é onde entram o fluxo longo e as posturas passivas profundas, que é o que não cabe em nenhum outro lugar.",
 "Alcanza con una colchoneta y una pared. Si tienes banda, rodillo, bastón o un escalón, algunos ejercicios ofrecen esa versión con el botón":
   "Basta um colchonete e uma parede. Se você tiver faixa, rolo, bastão ou um degrau, alguns exercícios oferecem essa versão pelo botão",
 "Cambiar ejercicio": "Trocar exercício",
 "Esto es una sesión suave, no un día libre.": "Isto é uma sessão leve, não um dia de folga.",
 " Hay un bloque de activación real — glúteo, core y escápula. Ponlo en un día fácil o de descanso, no la víspera de una sesión de calidad ni de un fondo.":
   " Há um bloco de ativação de verdade — glúteo, core e escápula. Coloque num dia leve ou de descanso, não na véspera de uma sessão de qualidade nem de um longão.",
 "¿Entrenas hoy? Entonces esto no es lo que buscas: ": "Vai treinar hoje? Então não é isto que você procura: ",
 "Activación": "Ativação",
 " antes de entrenar, ": " antes de treinar, ",
 "Movilidad": "Mobilidade",
 " después. Esta sesión es para el día que no entrenas.": " depois. Esta sessão é para o dia em que você não treina.",
 "Armar mi sesión →": "Montar minha sessão →",
 "Empezar la sesión →": "Começar a sessão →",
 "Sesión completa": "Sessão completa",
 "← Cambiar opciones": "← Trocar opções",
 " minutos": " minutos",
 "Posturas largas": "Posturas longas",
 "Sin equipo": "Sem equipamento", "Pared": "Parede", "Rodillo": "Rolo",
 "Minibanda": "Miniband", "Banda larga": "Faixa longa",
 "Bastón o palo": "Bastão ou cabo", "Escalón": "Degrau",
 "Recuperación para corredores": "Recuperação para corredores",
 "Recuperación para ciclistas": "Recuperação para ciclistas",
 "Recuperación para nadadores": "Recuperação para nadadores",
 "Recuperación para triatletas": "Recuperação para triatletas",
 "Recuperación de cuerpo completo": "Recuperação de corpo inteiro",
 "Cadera, tobillo y cadena posterior, con control lento y posturas largas. Es una sesión suave, no un día libre.":
   "Quadril, tornozelo e cadeia posterior, com controle lento e posturas longas. É uma sessão leve, não um dia de folga.",
 "Rotación torácica, independencia de cadera y el glúteo que la bici apaga. Es una sesión suave, no un día libre.":
   "Rotação torácica, independência de quadril e o glúteo que a bike desliga. É uma sessão leve, não um dia de folga.",
 "Control escapular, torácica y cuello — y el tobillo, que en el agua empuja. Es una sesión suave, no un día libre.":
   "Controle escapular, torácica e pescoço — e o tornozelo, que na água empurra. É uma sessão leve, não um dia de folga.",
 "Las tres cadenas conectadas, más equilibrio y propiocepción. Es una sesión suave, no un día libre.":
   "As três cadeias conectadas, mais equilíbrio e propriocepção. É uma sessão leve, não um dia de folga.",
 "Recorrido completo de arriba a abajo, sin deporte asignado. Es una sesión suave, no un día libre.":
   "Uma passagem completa de cima a baixo, sem esporte definido. É uma sessão leve, não um dia de folga.",
 "Un día sin correr es cuando el tejido acepta trabajo que no aceptaría cansado: rango controlado, posturas pasivas largas y contracción-suelta. Nada de esto entra en los diez minutos antes de una sesión, y es exactamente lo que le falta a un corredor que solo corre.":
   "Um dia sem correr é quando o tecido aceita trabalho que recusaria cansado: amplitude controlada, posturas passivas longas e contração-soltura. Nada disso cabe nos dez minutos antes de uma sessão, e é exatamente o que falta a um corredor que só corre.",
 "La bici te deja tres deudas que no se pagan pedaleando: torácica que no rota, cadera que solo trabaja en un plano y glúteo que se apagó. Un día suelto es cuando se pueden atacar de verdad, porque hay tiempo para lo lento y para lo largo.":
   "A bike deixa três dívidas que não se pagam pedalando: torácica que não gira, quadril que só trabalha num plano e glúteo que desligou. Um dia livre é quando dá para atacá-las de verdade, porque há tempo para o lento e para o longo.",
 "El hombro del nadador no se arregla estirando: se arregla con control escapular y rango que puedas sostener. Eso es trabajo lento y repetido, y necesita un día en el que no tengas que entrar al agua después.":
   "O ombro do nadador não se resolve alongando: resolve-se com controle escapular e amplitude que você consiga sustentar. Isso é trabalho lento e repetido, e precisa de um dia em que você não tenha que entrar na água depois.",
 "Tres deportes dejan tres patrones y ninguno se corrige apurado. Este es el día para lo que no entra en una activación: CARs largos, posturas pasivas, contracción-suelta y equilibrio, que es lo primero que se pierde con el volumen.":
   "Três esportes deixam três padrões e nenhum se corrige com pressa. Este é o dia para o que não cabe numa ativação: CARs longos, posturas passivas, contração-soltura e equilíbrio, que é a primeira coisa que o volume tira.",
 "Un día de recuperación bien usado hace más por tu rango que tres activaciones apuradas. Aquí hay tiempo para lo lento, lo largo y lo aburrido, que es donde está casi todo el beneficio.":
   "Um dia de recuperação bem usado faz mais pela sua amplitude do que três ativações apressadas. Aqui há tempo para o lento, o longo e o chato, que é onde está quase todo o benefício.",
 "Listo. Eso es una sesión, no un descanso — tenlo en cuenta mañana.":
   "Pronto. Isso foi uma sessão, não um descanso — leve isso em conta amanhã.",
 "Sin deporte asignado. Sirve igual para un día de gimnasio o para uno de escritorio.":
   "Sem esporte definido. Serve igual para um dia de academia ou de escritório.",
 "Para el que hace los tres: prioriza cadera y hombro, y suma equilibrio.":
   "Para quem faz os três: prioriza quadril e ombro, e soma equilíbrio.",
},
}

# Spanish JS section comments — build notes, replaced WHOLE rather than
# translated phrase by phrase. They run BEFORE the copy pass, so a generic key
# like " minutos" cannot reach inside one and half-rewrite it.
C1 = ("SOLO EN ESTA HERRAMIENTA\n"
      "       CARs, flujos, posturas largas, PNF y equilibrio. Esto es lo que la\n"
      "       activación no puede hacer en doce minutos, y por eso ABRE las rutinas en\n"
      "       vez de cerrarlas. Si un día esto queda al final, la herramienta volvió a\n"
      "       ser la matriz de activación estirada. */")
C2 = ("=== MOVILIDAD\n"
      "       Movimientos que también existen en /members/core/ o en la matriz de\n"
      "       activación. Están aquí porque son los correctos, pero son MINORÍA y van\n"
      "       después de los de arriba — ver la decisión 1 en el bloque de notas. */")
C3 = ("========== ACTIVACIÓN\n"
      "       Esto es trabajo de fuerza y control, no movilidad, y por eso el bloque se\n"
      "       llama como se llama. Ver la decisión 4 arriba: la copia no puede sugerir\n"
      "       que esta sesión sale gratis. */")

COMMENTS = {
"en": {
 C1: ("ONLY IN THIS TOOL\n"
      "       CARs, flows, long holds, PNF and balance. This is what an activation\n"
      "       cannot do in twelve minutes, and it is why these OPEN the routines rather\n"
      "       than closing them. If this ever ends up at the bottom, the tool has gone\n"
      "       back to being the activation matrix stretched out. */"),
 C2: ("=== MOBILITY\n"
      "       Movements that also exist in /members/core/ or in the activation matrix.\n"
      "       They are here because they are the right ones, but they are a MINORITY and\n"
      "       they come after the block above — see decision 1 in the header. */"),
 C3: ("========== ACTIVATION\n"
      "       This is strength and control work, not mobility, which is why the block is\n"
      "       named the way it is. See decision 4 above: the copy must never suggest this\n"
      "       session comes for free. */"),
},
"pt": {
 C1: ("SÓ NESTA FERRAMENTA\n"
      "       CARs, fluxos, posturas longas, PNF e equilíbrio. É o que uma ativação não\n"
      "       consegue fazer em doze minutos, e por isso ABREM as rotinas em vez de\n"
      "       fechá-las. Se um dia isto ficar no fim, a ferramenta voltou a ser a matriz\n"
      "       de ativação esticada. */"),
 C2: ("=== MOBILIDADE\n"
      "       Movimentos que também existem em /members/core/ ou na matriz de ativação.\n"
      "       Estão aqui porque são os corretos, mas são MINORIA e vêm depois do bloco\n"
      "       acima — ver a decisão 1 no cabeçalho. */"),
 C3: ("========== ATIVAÇÃO\n"
      "       Isto é trabalho de força e controle, não mobilidade, e por isso o bloco se\n"
      "       chama como se chama. Ver a decisão 4 acima: a copy não pode sugerir que\n"
      "       esta sessão sai de graça. */"),
},
}

# Per-language URLs. The breadcrumb and every cross-link must point at the
# reader's own language — a Spanish URL surviving here is the failure the
# verification asserts against.
URLS = {
 "en": {"/members/#biblioteca": "/members/en/#biblioteca",
        "/members/rodillas/": "/members/en/knees/",
        "/members/aquiles/": "/members/en/achilles/",
        "/members/hombro/": "/members/en/shoulder/",
        "/members/activacion/": "/members/en/activation/",
        "/members/movilidad/": "/members/en/mobility/"},
 "pt": {"/members/#biblioteca": "/members/pt/#biblioteca",
        "/members/rodillas/": "/members/pt/joelhos/",
        "/members/aquiles/": "/members/pt/aquiles/",
        "/members/hombro/": "/members/pt/ombro/",
        "/members/activacion/": "/members/pt/ativacao/",
        "/members/movilidad/": "/members/pt/mobilidade/"},
}

# The pain hand-off, as COMPLETE strings including their URLs and link text.
# *** Deliberately not assembled from fragments. An earlier version mapped " o "
# and " u " as connectors and applied them globally, which also rewrote
# "bastón o un escalón", "Bastón o palo", "un día fácil o de descanso" and
# "gimnasio o para uno". Four of five failures from one shortcut. ***
PAIN = {
"en": {
 'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasa por <a href="/members/rodillas/">Rodillas</a> o <a href="/members/aquiles/">Aquiles</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
   'If something <strong>hurts</strong> rather than feels stiff, this is not the right tool today: go to <a href="/members/en/knees/">Knees</a> or <a href="/members/en/achilles/">Achilles</a>. And if the pain persists, that is a doctor, not a routine.',
 'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasa por <a href="/members/rodillas/">Rodillas</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
   'If something <strong>hurts</strong> rather than feels stiff, this is not the right tool today: go to <a href="/members/en/knees/">Knees</a>. And if the pain persists, that is a doctor, not a routine.',
 'Si el hombro <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasa por <a href="/members/hombro/">Hombro de nadador</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
   'If the shoulder <strong>hurts</strong> rather than feels stiff, this is not the right tool today: go to <a href="/members/en/shoulder/">Swimmer\u2019s Shoulder</a>. And if the pain persists, that is a doctor, not a routine.',
 'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasa por <a href="/members/rodillas/">Rodillas</a>, <a href="/members/aquiles/">Aquiles</a> u <a href="/members/hombro/">Hombro</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
   'If something <strong>hurts</strong> rather than feels stiff, this is not the right tool today: go to <a href="/members/en/knees/">Knees</a>, <a href="/members/en/achilles/">Achilles</a> or <a href="/members/en/shoulder/">Shoulder</a>. And if the pain persists, that is a doctor, not a routine.',
},
"pt": {
 'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasa por <a href="/members/rodillas/">Rodillas</a> o <a href="/members/aquiles/">Aquiles</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
   'Se algo <strong>dói</strong> em vez de estar duro, esta não é a ferramenta de hoje: passe por <a href="/members/pt/joelhos/">Joelhos</a> ou <a href="/members/pt/aquiles/">Aquiles</a>. E se a dor continuar, é consulta médica, não uma rotina.',
 'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasa por <a href="/members/rodillas/">Rodillas</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
   'Se algo <strong>dói</strong> em vez de estar duro, esta não é a ferramenta de hoje: passe por <a href="/members/pt/joelhos/">Joelhos</a>. E se a dor continuar, é consulta médica, não uma rotina.',
 'Si el hombro <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasa por <a href="/members/hombro/">Hombro de nadador</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
   'Se o ombro <strong>dói</strong> em vez de estar duro, esta não é a ferramenta de hoje: passe por <a href="/members/pt/ombro/">Ombro de Nadador</a>. E se a dor continuar, é consulta médica, não uma rotina.',
 'Si algo <strong>duele</strong> en vez de sentirse duro, esto no es lo tuyo hoy: pasa por <a href="/members/rodillas/">Rodillas</a>, <a href="/members/aquiles/">Aquiles</a> u <a href="/members/hombro/">Hombro</a>. Y si el dolor sigue, es consulta médica, no una rutina.':
   'Se algo <strong>dói</strong> em vez de estar duro, esta não é a ferramenta de hoje: passe por <a href="/members/pt/joelhos/">Joelhos</a>, <a href="/members/pt/aquiles/">Aquiles</a> ou <a href="/members/pt/ombro/">Ombro</a>. E se a dor continuar, é consulta médica, não uma rotina.',
},
}

LEFTOVER = {
 "en": ["Sin equipo", "rodilla", "cadera", "hombro", "ejercicio", "minutos",
        "Recuperación", "sesión", " los ", " las ", " para ", "Movilidad"],
 "pt": ["Sin equipo", "rodilla", "cadera", "ejercicio", "Recuperación",
        "sesión", " los ", " las ", "hacia", " y "],
}


def build(lang):
    src = io.open(SRC, encoding="utf-8").read()

    start = src.index("{#-"); end = src.index("-#}") + 3
    src = src[:start] + (HEADER % {"LANGNAME": LANGNAME[lang]}) + src[end:]

    # 1. Names and cues, BY POSITION, each verified against the Spanish it claims.
    names = re.findall(r'name: "((?:[^"\\]|\\.)*)"', src)
    cues  = re.findall(r'cue: "((?:[^"\\]|\\.)*)"', src)
    if len(names) != len(EX) or len(cues) != len(EX):
        print("FAIL [%s] the page has %d names / %d cues, this script has %d entries"
              % (lang, len(names), len(cues), len(EX)))
        return None
    for i, (found, entry) in enumerate(zip(names, EX)):
        if found != entry["es"]:
            print("FAIL [%s] position %d: page says %r, script expects %r"
                  % (lang, i, found, entry["es"]))
            return None

    def sub_nth(text, key, replacements):
        out, idx = [], 0
        for m in re.finditer(key + r': "((?:[^"\\]|\\.)*)"', text):
            out.append(text[idx:m.start()])
            out.append('%s: "%s"' % (key, replacements.pop(0)))
            idx = m.end()
        out.append(text[idx:])
        return "".join(out)

    src = sub_nth(src, "name", [e[lang][0] for e in EX])
    src = sub_nth(src, "cue",  [e[lang][1] for e in EX])

    # 2. The pain hand-off FIRST, as complete strings — its literals still
    #    contain the Spanish URLs, so it has to run before the URL map.
    for a, b in PAIN[lang].items():
        if a not in src:
            print("FAIL [%s] pain string never matched: %s" % (lang, a[:80]))
            return None
        src = src.replace(a, b)
    # Then every remaining cross-link (the routing aside, the breadcrumb).
    for a, b in URLS[lang].items():
        src = src.replace(a, b)

    # 3. Section comments WHOLE, before the copy pass.
    misses = []
    for k, v in COMMENTS[lang].items():
        if k not in src: misses.append("[comment] " + k.split("\n")[0])
        else: src = src.replace(k, v)

    # 4. Everything else. Longest first so a short key cannot eat a long one.
    for k in sorted(COPY[lang], key=len, reverse=True):
        if k not in src:
            misses.append(k); continue
        src = src.replace(k, COPY[lang][k])
    if misses:
        print("FAIL [%s] %d mapping(s) never matched:" % (lang, len(misses)))
        for m in misses: print("   - " + m[:110])
        return None

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
            ok = False; continue
        os.makedirs(os.path.dirname(out), exist_ok=True)
        io.open(out, "w", encoding="utf-8").write(built)
        print("wrote %s  (%d bytes)" % (out, len(built)))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
