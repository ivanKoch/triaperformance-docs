#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
register-sweep.py — find (and optionally convert) Rioplatense Spanish in this repo.

WHY THIS FILE EXISTS. The September 5, 2026 sweep converted ~1,000 markers across
57 files, and the expensive part was never the replacing — it was deciding, form by
form, what each one becomes. That decision set is below. Re-deriving it for the blog
pass would cost the same day twice.

WHAT IT ENFORCES — brand-guidelines.md §8. Two axes, both required:
  * TUTEO for verbs and pronouns      (tienes / apoya / tú / ti — never tenés, apoyá, vos)
  * NEUTRAL LATIN AMERICAN vocabulary (aquí, piscina, espinilla, glúteos, poco a poco)
The second axis is the one a verb map cannot see, and it survived a full pass on
September 4 untouched — `planUi.json` was still selling "Acceso a pileta" on 51
rendered plan pages a day later.

THREE GATES, AND EACH FINDS WHAT THE OTHERS CANNOT
  1. accented   — every token ending á/é/í/ás/és/ís must be in the map or in ALLOW,
                  or the run fails. Catches ordinary voseo.
  2. clitic     — `quedate`→`quédate`, `revisalo`→`revísalo`. These carry NO accent
                  in voseo, so gate 1 is blind to all of them.
  3. unaccented — generated FROM the map by stripping accents. Some bodies are
                  written ASCII-only on purpose (n8n email nodes), so their voseo
                  looks like `podes`, `venis`, `Respondeme`, `Elegi`, `preferis`.
                  Gate 3 found four live customer-facing surfaces gates 1-2 passed.

AND THE GATE NO SCRIPT PROVIDES: read the real output once. `Elegi las dos sesiones`
survived all three gates and was found by printing the zone-magnet email to paste it
into n8n by hand.

WHAT IT DELIBERATELY DOES NOT TOUCH — see EXEMPT below. These are decisions, not
oversights, and re-"fixing" them puts the repo back out of sync with live systems.

Usage:
    python3 automation/register-sweep.py                # check everything, exit 1 if dirty
    python3 automation/register-sweep.py site/blog      # check one subtree
    python3 automation/register-sweep.py --wide site/blog            # noisy first pass on a new surface
    python3 automation/register-sweep.py --write site/blog/foo.njk   # convert
    python3 automation/register-sweep.py --diff site/blog            # show changed lines

NEVER run --write without reading the diff. Two defects in the September 5 pass were
caught only by reading it, and neither changed a replacement count that looked wrong:
`allá`→`allí` rewrote "más allá de" inside an Achilles clinical cue, and `separate`
→`sepárate` fired on the English word in a build comment.
"""
import io, os, re, sys, collections, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# EXEMPT — surfaces that stay as they are. Every entry is a dated decision.
# ---------------------------------------------------------------------------
EXEMPT = {
  "sales-playbook.md":
    "Iván's 1:1 WhatsApp message library. Carve-out taken Sept 4, 2026 and "
    "re-confirmed Sept 5 during the full sweep: these are messages he sends as "
    "himself in a conversation, and a website rule does not reach a chat. "
    "Known and intentional: §B9b says `Acá te puedes poner en contacto`, the same "
    "blurb rendered on /referidos/ says `Aquí`.",
  "automation/athlete-intake-workflow.json":
    "The `Build Briefing Prompt` node is an AI prompt whose only reader is Iván, "
    "and `Telegram - Briefing Listo` notifies him. Converted Sept 5, then REVERTED "
    "the same day on his call — the live n8n instance was never updated, so "
    "converting the repo copy only makes documentation disagree with the system "
    "it documents.",
  "automation/subscription-lifecycle-automation.json":
    "`Telegram - Nuevo Atleta 1a1` is a notification to Iván ('FALTA -- ponelo en "
    "Twenty'). Same reason and same date as above. NOTE the customer-facing email "
    "bodies in this workflow ARE tuteo and were converted Sept 5 — the exemption "
    "is the Telegram node, not the file.",
}

# History and evidence: quoted voseo here is the record of a defect, not a defect.
EXEMPT_PREFIX = ("open-loops-archive.md", "build-log.md", "athlete-onboarding-build-log.md",
                 "automation/register-sweep.py")   # this file IS the map

# 1. Pronouns / copula  (applied as phrases first, then bare)
PHRASE = [
    ("con vos mismo", "contigo mismo"), ("con vos misma", "contigo misma"),
    ("con vos", "contigo"),
    ("hacia vos", "hacia ti"), ("para vos", "para ti"), ("a vos", "a ti"),
    ("de vos", "de ti"), ("en vos", "en ti"), ("sobre vos", "sobre ti"),
    ("por vos", "por ti"), ("ante vos", "ante ti"), ("bajo vos", "bajo ti"),
    ("sin vos", "sin ti"), ("tras vos", "tras ti"), ("desde vos", "desde ti"),
    ("hasta vos", "hasta ti"), ("contra vos", "contra ti"), ("según vos", "según tú"),
    ("entre vos", "entre tú"), ("como vos", "como tú"), ("que vos", "que tú"),
    ("vos mismo", "tú mismo"), ("vos misma", "tú misma"),
    ("vos elegís", "tú eliges"), ("vos sabés", "tú sabes"),
]
BARE = {"vos": "tú", "sos": "eres"}

# 2. Present indicative 2sg: voseo -> tuteo (stem changes resolved by hand)
PRESENT = {
    # -ar, regular (drop accent)
    "entrenás":"entrenas","buscás":"buscas","llegás":"llegas","bajás":"bajas",
    "parás":"paras","acabás":"acabas","terminás":"terminas","dejás":"dejas",
    "mirás":"miras","usás":"usas","levantás":"levantas","llevás":"llevas",
    "arrancás":"arrancas","cargás":"cargas","controlás":"controlas",
    "rebotás":"rebotas","editás":"editas","pegás":"pegas","quedás":"quedas",
    "viajás":"viajas","aumentás":"aumentas","acumulás":"acumulas",
    "quemás":"quemas","operás":"operas","creás":"creas","aclimatás":"aclimatas",
    "testeás":"testeas","estimás":"estimas","calculás":"calculas","medís":"mides","pesás":"pesas","robás":"robas","trabajás":"trabajas",
    "intercalás":"intercalas","entrás":"entras","apuntás":"apuntas",
    "tocás":"tocas","empujás":"empujas","tambaleás":"tambaleas",
    "encorvás":"encorvas","avanzás":"avanzas","pedaleás":"pedaleas",
    "ordenás":"ordenas","sumás":"sumas","cansás":"cansas","descansás":"descansas",
    "revisás":"revisas","retesteás":"retesteas","presionás":"presionas",
    "nadás":"nadas","inclinás":"inclinas","estirás":"estiras","pagás":"pagas",
    "cambiás":"cambias","cancelás":"cancelas","acortás":"acortas",
    "generás":"generas","eliminás":"eliminas","pasás":"pasas","hablás":"hablas",
    "exhalás":"exhalas","inhalás":"inhalas","necesitás":"necesitas",
    "notás":"notas","tirás":"tiras","girás":"giras","estás":"estás",
    "enviás":"envías","apoyás":"apoyas","cortás":"cortas","agarrás":"agarras",
    "sacás":"sacas","separás":"separas","juntás":"juntas","alejás":"alejas",
    "acercás":"acercas","respirás":"respiras","caminás":"caminas",
    "alternás":"alternas","frenás":"frenas","aflojás":"aflojas",
    "acelerás":"aceleras","adapté":"adapté","comparás":"comparas","tratás":"tratas",
    "esperás":"esperas","dibujás":"dibujas","imaginás":"imaginas",
    "aguantás":"aguantas","recortás":"recortas","completás":"completas",
    "flexionás":"flexionas","programás":"programas","organizás":"organizas",
    "atacás":"atacas","guardás":"guardas","achicás":"achicas",
    "balanceás":"balanceas","desactivás":"desactivas","verificás":"verificas",
    "arreglás":"arreglas","apagás":"apagas","ingresás":"ingresas",
    "seleccionás":"seleccionas","fijás":"fijas","mojás":"mojas",
    "doblás":"doblas","remás":"remas","iniciás":"inicias","asignás":"asignas",
    "intentás":"intentas","traccionás":"traccionas","pausás":"pausas",
    "rotás":"rotas","despegás":"despegas","cruzás":"cruzas","estirás":"estiras",
    # -ar, stem-changing e>ie / o>ue
    "empezás":"empiezas","pensás":"piensas","cerrás":"cierras","soltás":"sueltas",
    "contás":"cuentas","probás":"pruebas","mostrás":"muestras","colgás":"cuelgas",
    "encontrás":"encuentras","recordás":"recuerdas","acordás":"acuerdas",
    "sentás":"sientas","apretás":"aprietas","despertás":"despiertas",
    "calentás":"calientas","comenzás":"comienzas","rodás":"ruedas",
    "forzás":"fuerzas","jugás":"juegas","acostás":"acuestas",
    # -er
    "corrés":"corres","hacés":"haces","metés":"metes","sabés":"sabes",
    "encogés":"encoges","amanecés":"amaneces","conocés":"conoces",
    "sometés":"sometes","crecés":"creces","debés":"debes","traés":"traes",
    "creés":"crees","aprendés":"aprendes","entretenés":"entretienes","contenés":"contienes","retenés":"retienes","detenés":"detienes","pertenecés":"perteneces","merecés":"mereces","aparecés":"apareces","ofrecés":"ofreces","agradecés":"agradeces","reconocés":"reconoces","prometés":"prometes","resolvés":"resuelves","respondés":"respondes","dependés":"dependes","comprendés":"comprendes","vendés":"vendes","defendés":"defiendes","atendés":"atiendes","encendés":"enciendes","bebés":"bebes","caés":"caes","poseés":"posees","proveés":"provees","leés":"lees","comés":"comes",
    "barrés":"barres","recorrés":"recorres","accedés":"accedes",
    "retrocedés":"retrocedes","extendés":"extiendes","entendés":"entiendes",
    "perdés":"pierdes","volvés":"vuelves","movés":"mueves","devolvés":"devuelves",
    "podés":"puedes","querés":"quieres","tenés":"tienes","sostenés":"sostienes",
    "mantenés":"mantienes","obtenés":"obtienes",
    # -ir
    "vivís":"vives","subís":"subes","abrís":"abres","escribís":"escribes",
    "salís":"sales","seguís":"sigues","conseguís":"consigues",
    "sentís":"sientes","venís":"vienes","dormís":"duermes","repetís":"repites",
    "medís":"mides","convertís":"conviertes","competís":"compites",
    "elegís":"eliges","preferís":"prefieres","referís":"refieres","sugerís":"sugieres","advertís":"adviertes","mentís":"mientes","invertís":"inviertes","discutís":"discutes","decidís":"decides","describís":"describes","corregís":"corriges","exigís":"exiges","consumís":"consumes","admitís":"admites","transmitís":"transmites","asistís":"asistes","resumís":"resumes","partís":"partes","cubrís":"cubres","sufrís":"sufres","añadís":"añades","producís":"produces","resistís":"resistes",
    "cumplís":"cumples","permitís":"permites","decidís":"decides",
    "insistís":"insistes","recibís":"recibes",
}

# 3. Imperatives (2sg affirmative)
IMPER = {
    # irregular tú imperatives
    "poné":"pon","tené":"ten","vení":"ven","hacé":"haz","decí":"di","salí":"sal",
    "mantené":"mantén","sostené":"sostén","obtené":"obtén","detené":"detén",
    "andá":"ve",
    # stem-changing
    "volvé":"vuelve","empezá":"empieza","pensá":"piensa","cerrá":"cierra",
    "soltá":"suelta","contá":"cuenta","probá":"prueba","mostrá":"muestra",
    "colgá":"cuelga","encontrá":"encuentra","recordá":"recuerda",
    "apretá":"aprieta","despertá":"despierta","calentá":"calienta",
    "comenzá":"comienza","rodá":"rueda","forzá":"fuerza","jugá":"juega",
    "acostá":"acuesta","extendé":"extiende","entendé":"entiende",
    "perdé":"pierde","mové":"mueve","devolvé":"devuelve","sentá":"sienta",
    "convertí":"convierte","sentí":"siente","seguí":"sigue","elegí":"elige",
    "repetí":"repite","medí":"mide","dormí":"duerme",
    # regular -ar
    "bajá":"baja","subí":"sube","llevá":"lleva","pasá":"pasa","empujá":"empuja",
    "buscá":"busca","dejá":"deja","alterná":"alterna","tocá":"toca",
    "despegá":"despega","cruzá":"cruza","caminá":"camina","cargá":"carga",
    "estirá":"estira","terminá":"termina","respirá":"respira","pará":"detente",
    "rotá":"rota","exhalá":"exhala","inhalá":"inhala","achicá":"achica",
    "girá":"gira","frená":"frena","apoyá":"apoya","apagá":"apaga",
    "entrá":"entra","tirá":"tira","balanceá":"balancea","aumentá":"aumenta","separá":"separa",
    "sacá":"saca","acercá":"acerca","cortá":"corta","ingresá":"ingresa",
    "cambiá":"cambia","mirá":"mira","acortá":"acorta","juntá":"junta",
    "agarrá":"agarra","alejá":"aleja","avanzá":"avanza","pegá":"pega",
    "agregá":"agrega","aflojá":"afloja","dibujá":"dibuja","apuntá":"apunta",
    "revisá":"revisa","seleccioná":"selecciona","fijá":"fija","acelerá":"acelera",
    "mojá":"moja","compará":"compara","tratá":"trata","verificá":"verifica",
    "esperá":"espera","arreglá":"arregla","desactivá":"desactiva",
    "pausá":"pausa","imaginá":"imagina","aguantá":"aguanta","presioná":"presiona",
    "recortá":"recorta","creá":"crea","arrancá":"arranca","traccioná":"tracciona",
    "remá":"rema","iniciá":"inicia","asigná":"asigna","usá":"usa",
    "intentá":"intenta","doblá":"dobla","completá":"completa","sumá":"suma",
    "controlá":"controla","flexioná":"flexiona","retesteá":"retestea",
    "guardá":"guarda","restaurá":"restaura","pedaleá":"pedalea",
    "organizá":"organiza","programá":"programa","sustentá":"sustenta",
    "atacá":"ataca","referenciá":"referencia","trabajá":"trabaja",
    "descansá":"descansa","anotá":"anota","sumergí":"sumerge",
    # regular -er / -ir
    "meté":"mete","traé":"trae","comé":"come","abrí":"abre","barré":"barre",
    "recorré":"recorre","accedé":"accede","retrocedé":"retrocede",
    "corré":"corre","resistí":"resiste","hundí":"hunde","fluí":"fluye",
    "construí":"construye","descubrí":"descubre","repartí":"reparte",
    "leé":"lee","aprendé":"aprende","escribí":"escribe","permití":"permite",
    "cumplí":"cumple","insistí":"insiste","recibí":"recibe","dividí":"divide",
}

# 4. Clitic imperatives: voseo writes them unaccented, tuteo needs the accent
CLITIC = {
    "agarrate":"agárrate","acordate":"acuérdate","sentate":"siéntate",
    "pegate":"pégate","quedate":"quédate","movete":"muévete","ponete":"ponte",
    "llevate":"llévate","apoyate":"apóyate","inclinate":"inclínate",
    "soltate":"suéltate","fijate":"fíjate","dejate":"déjate",
    "estirate":"estírate","parate":"párate","colgate":"cuélgate",
    "girate":"gírate","acostate":"acuéstate","subite":"súbete","bajate":"bájate",
    "sostenete":"sostente","mantenete":"mantente","alejate":"aléjate",
    "acercate":"acércate","relajate":"relájate","preparate":"prepárate",
    "cuidate":"cuídate","olvidate":"olvídate",
    "imaginate":"imagínate","cruzate":"crúzate","empujate":"empújate",
    "afirmate":"afírmate","apretate":"apriétate",
    "tirate":"tírate","volvete":"vuélvete","sentilo":"siéntelo",
    "sentila":"siéntela","hacelo":"hazlo","hacela":"hazla","ponelo":"ponlo",
    "ponela":"ponla","tenelo":"tenlo","tenela":"tenla","mantenelo":"mantenlo",
    "mantenela":"mantenla","sostenelo":"sostenlo","sostenela":"sostenla",
    "llevalo":"llévalo","llevala":"llévala","dejalo":"déjalo","dejala":"déjala",
    "buscalo":"búscalo","buscala":"búscala","apoyalo":"apóyalo",
    "apoyala":"apóyala","soltalo":"suéltalo","soltala":"suéltala",
    "empujalo":"empújalo","empujala":"empújala","miralo":"míralo",
    "mirala":"mírala","contalo":"cuéntalo","contala":"cuéntala",
    "tomalo":"tómalo","tomala":"tómala","sacalo":"sácalo","sacala":"sácala",
    "metelo":"mételo","bajalo":"bájalo","bajala":"bájala","subilo":"súbelo",
    "subila":"súbela","cortalo":"córtalo","cortala":"córtala",
    "abrilo":"ábrelo","abrila":"ábrela","repetilo":"repítelo",
    "repetila":"repítela","elegilo":"elígelo","elegila":"elígela",
    "seguilo":"síguelo","seguila":"síguela","probalo":"pruébalo",
    "probala":"pruébala","dejalos":"déjalos","llevalos":"llévalos",
    "usalo":"úsalo","usala":"úsala","girala":"gírala","giralo":"gíralo",
    "estiralo":"estíralo","estirala":"estírala","cerralo":"ciérralo",
    "cerrala":"ciérrala","pasalo":"pásalo","pasala":"pásala",
    "anotalo":"anótalo","anotala":"anótala","escribilo":"escríbelo",
    "escribila":"escríbela","medilo":"mídelo","medila":"mídela","alineate":"alinéate","arrugala":"arrúgala","evitala":"evítala","evitalo":"evítalo","pedila":"pídela","pedilo":"pídelo",
    "escribime":"escríbeme","escribinos":"escríbenos","movelo":"muévelo",
    "movela":"muévela","plegate":"pliégate","hablalo":"háblalo","hablala":"háblala",
    "ayudate":"ayúdate","deslizate":"deslízate","deslizalos":"deslízalos",
    "deslizalo":"deslízalo","deslizala":"deslízala","contame":"cuéntame",
    "contanos":"cuéntanos","decime":"dime","decinos":"dinos","mandame":"mándame",
    "mandanos":"mándanos","avisame":"avísame","avisanos":"avísanos",
    "escuchame":"escúchame","mirame":"mírame","dejame":"déjame","ponete":"ponte",
    "revisalo":"revísalo","cargálas":"cárgalas","cargálo":"cárgalo","llevála":"llévala","respondelas":"respóndelas","respondelo":"respóndelo","pagalo":"págalo","pagala":"págala","revisala":"revísala","rotalo":"rótalo","rotala":"rótala",
    "apoyalos":"apóyalos","apoyalas":"apóyalas","traelas":"tráelas","traelos":"tráelos",
    "estiralos":"estíralos","llevalas":"llévalas","dejalas":"déjalas",
}

# 5. Regional lexicon -> neutral LatAm (Ivan: "fully neutral latam")
LEXICON = {
    "acá":"aquí","pileta":"piscina","piletas":"piscinas",
}

# Words that LOOK like markers but are not voseo. Anything not here and not in a
# map above makes the run fail rather than pass silently.
ALLOW = set("""
más está qué después ahí atrás estrés aquí así será detrás además través allí
demás esté revés inglés portugués francés país café sofá bogotá panamá bisturí
exprés porqué quizás jamás compás interés jerez marroquí israelí quién cuál
cómo dónde cuándo porqués ademá
olá até pés trás você vocé nahí josué fechá sequenciá organizá-las
# Portuguese function words in the trilingual data files — not Spanish, not voseo
já dá vá há lá aí cá pé né dás vás hás daí aí mostrá separá deixá prescrevê
# irregular futures: the stem is not the infinitive, so the generic rule misses them
verás veré verá harás haré hará irás iré irá dirás diré dirá podrás podré podrá
pondrás pondré pondrá tendrás tendré tendrá saldrás saldrá vendrás vendrá
querrás querrá sabrás sabré sabrá valdrá habrá dará darás daré
descompondrá expondrá compondrá supondrá propondrá dispondrá repondrá
sí mí ti tú él sé dé té ó
# reviewed and left alone: "más allá de" (standard), 1st-person preterite (Ivan's own voice)
allá quizá estás estés adapté apliqué agregué ajusté prioricé cambié armé josé lesioné busqué describí armé planifiqué avisé mandé pasé estemos estén terminé olvidé empecé llegué dejé logré comencé corrí comparé mejoré aprendí revisé
estaré tendré descubrí construí repartí probé gané perdí volví salí viví hice fui
""".split())

PAIRS=[
 # Rioplatense lexicon -> neutral LatAm. Exact phrases, hand-checked in context.
 ("cerca de la cola","cerca de los glúteos"),
 ("la cola va hacia atrás","los glúteos van hacia atrás"),
 ("Mete la cola","Mete la pelvis"),
 ("el talón a la cola","el talón al glúteo"),
 ("la cola hacia los talones","los glúteos hacia los talones"),
 ("acerca más la cola a los talones","acerca más los glúteos a los talones"),
 ("aleja la cola de la pared","aleja los glúteos de la pared"),
 ("la cola queda apoyada","los glúteos quedan apoyados"),
 ("panza del gemelo","vientre del gemelo"),
 ("otra en la panza","otra en el abdomen"),
 ("el aire a la panza","el aire al abdomen"),
 ("Inhala a la panza","Inhala al abdomen"),
 ("de a poco","poco a poco"),
 # `parate` the noun vs `parate` the imperative. The phrase wins, and it only wins
 # because PAIRS run BEFORE the word map as well as after — caught in the blog diff,
 # where "volviendo después de un parate" came out as "un párate".
 ("de un parate","de una pausa"), ("un parate largo","una pausa larga"),
 ("un parate","una pausa"),
 ("Después dá vuelta la mano","Después gira la mano"),
 ("Cola cerca de la pared","Glúteos cerca de la pared"),
 ("Cola metida, costillas","Pelvis metida, costillas"),
 ("(cola por debajo)","(glúteos por debajo)"),
 ("la cola hacia los talones","los glúteos hacia los talones"),
 ("el talón a la cola","el talón al glúteo"),
 ("otra en la panza","otra en el abdomen"),
 ("el aire a la panza","el aire al abdomen"),

 ("si el natatorio está frío","si la piscina está fría"),
 ("en un natatorio frío","en una piscina fría"),
 ("canillas","espinillas"),("canilla","espinilla"),
 ("peso recién suma cuando","peso solo suma cuando"),
 ("importar recién cuando","importar solo cuando"),
 ("suma recién cuando","suma solo cuando"),
 ("hacia ti recién al final","hacia ti solo al final"),
 ("el orden prolijo","el orden perfecto"),
 ("ordenar prolijamente","ordenar cuidadosamente"),
]

# Clitic-suffix words that are ordinary Spanish, Portuguese or English — reviewed.
CLITIC_OK = set("""
adelante frente parte suelo modelo gemelo gemelos rodillo rodillos deporte fuerte siete
existe convierte constante bastante siguiente durante gente exactamente mente ambiente
elite delante levante estante instante restante distante semejante mediante protocolo
intervalo intervalos regalo palo malo kilo estilo tobillo tobillos muslo cuello cuerpo hilo
escala nivelo velo pelo cielo hielo abuelo duele suele muele vuele apriete comprime promete
permite remodela tranquilo caminos axilas vuelos planos cancelo colchonete digite estrelas
parcela treinos tabela musculo estimulo carbohydrate
exhala exhalas inhala inhalas repite repites cancela cancelas apoyate estirate
athlete triathlete classname deliberate doorframe autocomplete became lactate filename
rename dislocate rotate translate template state create update delete complete separate
execute private generate duplicate stale whole while single slate white quote route
intermediate toolname displayname calculate recalculate website labelname compete forwhotime
candidate estimate accurate slugifyname isfinite basename navigate regenerate definite
truncate meantime resolves move moves firstname lastname concrete runtime candidate
alternate alternates
""".split())

# Unaccented forms that are also ordinary words — reported only with context, never trusted.
UNACC_AMBIG = set("""
hace sale vale corre come trae mete cree lee para toma deja busca lleva baja pasa saca junta
gira tira dobla rota carga toca cruza camina estira termina respira separa apoya empuja
suelta cuenta prueba muestra cuelga encuentra recuerda acuerda sienta aprieta despierta
calienta comienza rueda fuerza juega acuesta piensa cierra empieza conta pone solta senta
roda forza jugas moves move usa crea rema inicia asigna intenta completa suma controla
flexiona guarda restaura pedalea organiza programa sustenta ataca referencia trabaja
descansa anota entra mira pega agrega afloja dibuja apunta achica alterna revisa selecciona
fija acelera moja compara trata verifica espera arregla desactiva pausa imagina aguanta
presiona recorta arranca tracciona avanza acorta agarra aleja acerca corta cambia ingresa
apaga balancea aumenta barre recorre accede retrocede resiste reparte divide permite cumple
insiste recibe resolves encontra perde devolve
""".split())


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# HOMOGRAPHS — an -ir/-er verb's voseo imperative is spelled exactly like its
# FIRST-PERSON PRETERITE. `seguí como corredor` on /sobre-ivan/ is Iván saying
# "I went on as a runner"; the same six letters as the imperative "keep going".
# Converting these by rule destroys his bio and every athlete testimonial, so
# they are never converted automatically — gate 4 reports them with their line
# and a human decides. (`vení` and `decí` are NOT here: venir and decir have
# irregular preterites, `vine` and `dije`, so those two are unambiguous.)
# This is not hypothetical: `recibí tu solicitud en TrainingPeaks`, a live
# CoachMatch subject line meaning "I received your request", would have shipped
# as an imperative on September 5.
# ---------------------------------------------------------------------------
IMPER_REVIEW = {k: v for k, v in IMPER.items()
                if k.endswith("í") and k not in ("vení", "decí")}

WORD = {}
for _d in (PRESENT, IMPER, CLITIC, LEXICON, BARE):
    WORD.update(_d)
for _k in IMPER_REVIEW:
    WORD.pop(_k, None)          # reported, never auto-converted

SUSPECT = re.compile(r"\b[a-záéíóúñ]*(?:ás|és|ís|á|é|í)\b", re.I | re.U)
CLITIC_SUF = r"(?:ate|ete|ite|alo|ala|alos|alas|elo|ela|elos|elas|ilo|ila|ilos|ilas|anos|enos|inos|ame|eme|ime)"
CLITIC_PAT = re.compile(r"\b([a-zñ]{3,})" + CLITIC_SUF + r"\b")

def _strip(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

UNACC = {}
for _vos, _tu in WORD.items():
    _u = _strip(_vos)
    if _u != _vos and _u != _tu and _u != _strip(_tu):
        UNACC[_u] = _tu
UNACC.update({"sos": "eres", "vos": "tú"})
UNACC_PAT = re.compile(r"\b(?:" + "|".join(sorted(set(UNACC), key=len, reverse=True)) + r")\b", re.I | re.U)

def match_case(src, dst):
    if src.isupper() and len(src) > 1:
        return dst.upper()
    if src[0].isupper():
        return dst[0].upper() + dst[1:]
    return dst

_KEYS = sorted(WORD, key=len, reverse=True)
# The trailing guard is Portuguese enclisis: `organizá-las`, `sequenciá-los`,
# `atacá-las`, `fechá-lo`. Those are PORTUGUESE and are spelled exactly like a
# voseo imperative — library.json holds ES, EN and PT in one file, so without this
# a sweep of that file silently rewrites Brazilian copy. open-loops.md flagged
# this class on September 4; the guard is what makes the rule enforceable instead
# of a note somebody has to remember.
_WORD_PAT = re.compile(r"\b(?:" + "|".join(re.escape(k) for k in _KEYS) + r")\b(?!-l[oa]s?\b)", re.I | re.U)

def convert(text, md=False):
    """Convert a whole text. Lines containing `~~` are left alone: in this repo a
    strikethrough marks a belief that was corrected, and the old wording IS the
    record (see the hygiene rules in the project instructions). Rewriting the
    register inside one turns the record into a contradiction."""
    if "~~" in text:
        return "\n".join(l if "~~" in l else convert(l, md) for l in text.split("\n"))
    # A `backticked` span is a citation of a literal string, not prose. Docs and code
    # comments state the rule as "`tienes`, not `tenés`" — converting the second token
    # would rewrite the rule into a tautology. Same for the quoted examples in
    # brand-guidelines.md §8 and writer_agent.py.
    spans = []
    def _stash(m):
        spans.append(m.group(0))
        return "\x00%d\x00" % (len(spans) - 1)
    # Lexicon phrases run BEFORE the word map (and again after, below): some of them
    # disambiguate a word the map would otherwise rewrite, and some are written
    # against the post-conversion wording. Applying them at both ends costs nothing
    # — the replacements do not re-trigger each other — and it is the only ordering
    # in which both kinds work.
    text = re.sub(r"`[^`\n]*`", _stash, text)
    # In MARKDOWN, a "double-quoted" span is a quotation too — these docs quote the
    # copy they are describing, and half the time the copy they quote is the OLD,
    # defective wording kept deliberately as the record. Rewriting it turns "this
    # said X and was wrong" into "this said Y and was wrong", which is worse than
    # leaving it: it destroys the evidence AND reads as a contradiction.
    # They are not converted, but they ARE reported (gate 5) — because the same
    # syntax also holds live copy quoted in a runbook, and only a human can tell a
    # record from a stale copy. Four stale copies were found that way on Sept 5.
    if md:
        text = re.sub(r'"[^"\n]{2,160}"', _stash, text)
    # Lexicon phrases get first refusal over the word map — `un parate` is a NOUN and
    # the map would make it `un párate` — and run again at the end, because some are
    # written against post-conversion wording. Both passes happen AFTER stashing:
    # brand-guidelines.md §8 states the rule as "`una pausa` not `un parate`", and a
    # pre-pass that ran before the guard rewrote the rule's own counter-example.
    for a, b in PAIRS:
        text = text.replace(a, b)
    out = text
    for a, b in PHRASE:
        out = re.sub(r"\b" + re.escape(a) + r"\b", lambda m: match_case(m.group(0), b), out, flags=re.I)
    out = _WORD_PAT.sub(lambda m: match_case(m.group(0), WORD[m.group(0).lower()])
                        if m.group(0).lower() in WORD else m.group(0), out)
    for a, b in PAIRS:
        out = out.replace(a, b)
    # Restore iteratively: a "quoted span" can CONTAIN a `backticked` span, so one
    # pass leaves the inner placeholder sitting in the text it just restored. That
    # bug shipped for exactly one run and turned `add a "card" to `file`` into
    # `add a  0  to  1 ` in the --diff preview. Loop until nothing is left.
    for _ in range(10):
        if "\x00" not in out:
            break
        out = re.sub(r"\x00(\d+)\x00", lambda m: spans[int(m.group(1))], out)
    return out

def strip_citations(text, md=False):
    """Blank out `backticked` spans (and, in markdown, "quoted" ones) before gating.
    A doc that documents a defect necessarily contains the defect; without this the
    archive of the September 5 sweep reports itself on every run, forever."""
    text = re.sub(r"`[^`\n]*`", " ", text)
    if md:
        text = re.sub(r'"[^"\n]{2,160}"', " ", text)
    return text

def gate_accented(text):
    """Anything that could be voseo and is not classified fails the run."""
    bad = collections.Counter()
    for m in SUSPECT.finditer(text):
        w = m.group(0).lower()
        if len(w) < 2 or w in ALLOW or w in WORD:
            continue
        stem = w[:-2] if w[-2:] in ("ás", "és", "ís") else w[:-1]
        if stem.endswith(("ar", "er", "ir")) and len(stem) > 3:
            continue          # future tense: already tuteo
        bad[w] += 1
    return bad

# STRICT clitic gate: a word is only suspicious if what remains after removing the
# clitic is itself a tuteo imperative this map knows. That is why it does not fire
# on `datetime`, `dirname`, `affiliate` or `tornozelo`.
_STEMS = set(v for v in IMPER.values() if v.isalpha())
_CLITICS = ("te", "lo", "la", "los", "las", "le", "les", "me", "nos")
_STRICT = set(st + cl for st in _STEMS for cl in _CLITICS)

def gate_clitic(text, wide=False):
    """Voseo writes `quedate`/`revisalo` with no accent, so gate 1 cannot see them.

    Default (strict) only reports stem+clitic combinations built from verbs already
    in the map — quiet enough to run over the whole repo. `--wide` falls back to a
    raw suffix scan, which is noisy (every English -ate/-ite word trips it) but is
    how `alineate`, `arrugala`, `plegate` and `deslizalos` were found in the first
    place. Use --wide once on a surface you have never swept, then strict forever.
    """
    bad = collections.Counter()
    for m in CLITIC_PAT.finditer(text.lower()):
        w = m.group(0)
        if w in CLITIC or w in CLITIC_OK or len(w) < 6:
            continue
        if not wide and w not in _STRICT:
            continue
        bad[w] += 1
    return bad

REVIEW_PAT = re.compile(r"\b(?:" + "|".join(sorted(IMPER_REVIEW, key=len, reverse=True)) + r")\b", re.I | re.U)

def gate_homograph(text):
    """Forms that are EITHER a voseo imperative OR a first-person preterite.
    Returns (form, line) pairs so the reader can decide from context."""
    out = []
    for i, line in enumerate(text.split("\n"), 1):
        for m in REVIEW_PAT.finditer(line):
            out.append((m.group(0), i, line.strip()[:160]))
    return out

# A FOURTH blind spot, found in the blog: `cargálas`. Voseo + clitic is normally
# written WITHOUT an accent (`cargalas`), but writers slip and leave the imperative's
# accent in place. The result ends in `-as`, so gate 1 (which keys on a final accent)
# cannot see it, and gate 2's stem match runs on unaccented letters, so it cannot
# either. This gate looks for an accent INSIDE a word that ends in a clitic.
ACC_CLITIC = re.compile(r"\b[a-zñáéíóú]*[áéí](?:te|lo|la|los|las|le|les|me|nos)\b", re.I | re.U)
ACC_OK = {"cuáles", "cuál", "árboles"}

def gate_accented_clitic(text):
    bad = collections.Counter()
    for m in ACC_CLITIC.finditer(text):
        w = m.group(0).lower()
        if w in ACC_OK or w in CLITIC:
            continue
        bad[w] += 1
    return bad

CITE = re.compile(r'"[^"\n]{2,160}"')

def gate_citation(text):
    """Markdown only. A quoted span holding a voseo form is EITHER a record of copy
    that was corrected (leave it — the old wording is the evidence) OR a stale copy
    of copy that has since been fixed (correct it, same session, per the repo's
    one-home-per-figure rule). The script cannot tell those apart. It reports."""
    out = []
    for i, line in enumerate(text.split("\n"), 1):
        if "~~" in line:
            continue
        for m in CITE.finditer(line):
            q = m.group(0)
            if _WORD_PAT.search(q):
                out.append((i, q[:140]))
    return out

PREP_TU = re.compile(r"\b(a|de|en|con|para|por|hacia|sobre|entre|hasta|desde|sin|contra|tras|ante|bajo)\s+tú\b", re.I)

def gate_prep(text):
    """POST-CONDITION, not a detector. After a preposition Spanish takes `ti`, never
    `tú` — so a hit here means a `<prep> vos` pair is missing from PHRASE and the
    conversion has produced ungrammatical Spanish. `por vos` -> `por tú` shipped in
    the blog diff for exactly this reason. This gate makes that class impossible to
    miss instead of relying on someone spotting it in a 99-line diff."""
    return [(m.group(0), text[:m.start()].count("\n") + 1) for m in PREP_TU.finditer(text)]

def gate_unaccented(text):
    bad = collections.Counter()
    for m in UNACC_PAT.finditer(text):
        w = m.group(0).lower()
        if w in UNACC_AMBIG:
            continue
        bad[w] += 1
    return bad

EXTS = ("njk", "html", "js", "json", "py", "md", "txt", "gs")
SKIP_DIRS = {"node_modules", ".git", "__pycache__", "_site", "en", "pt"}
# NOTE: site/assets/js holds the tool ENGINES (activation-tool.js, strength-tool.js,
# box-breathing.js) and every Spanish string they render. Excluding it, as an
# earlier version of this script did, hides an entire class of user-facing copy.

def walk(targets):
    out = []
    for t in targets:
        p = os.path.join(ROOT, t)
        if os.path.isfile(p):
            out.append(p); continue
        for d, dn, fn in os.walk(p):
            dn[:] = [x for x in dn if x not in SKIP_DIRS]
            for f in fn:
                if f.rsplit(".", 1)[-1] in EXTS:
                    out.append(os.path.join(d, f))
    return sorted(set(out))

def exempt(rel):
    return rel in EXEMPT or rel.startswith(EXEMPT_PREFIX)

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    write = "--write" in sys.argv
    wide  = "--wide" in sys.argv
    show = "--diff" in sys.argv or write
    targets = args or ["site", "automation"]
    dirty = 0
    for f in walk(targets):
        rel = os.path.relpath(f, ROOT)
        if exempt(rel):
            continue
        src = io.open(f, encoding="utf-8").read()
        md = rel.endswith(".md")
        new = convert(src, md)
        prose = strip_citations(new, md)
        hits = (gate_accented(prose) + gate_clitic(prose, wide)
                + gate_unaccented(prose) + gate_accented_clitic(prose))
        review = gate_homograph(prose)
        cites = gate_citation(new) if md else []
        preps = gate_prep(new)
        changed = [(i + 1, a, b) for i, (a, b) in
                   enumerate(zip(src.split("\n"), new.split("\n"))) if a != b]
        if changed or hits or review or cites or preps:
            dirty += 1
            print("\n##### %s  (%d lines would change)" % (rel, len(changed)))
            if show:
                for n, a, b in changed:
                    print("-%d: %s" % (n, a.strip()))
                    print("+%d: %s" % (n, b.strip()))
            if hits:
                print("   UNCLASSIFIED (decide by hand, then add to the map): %s" % dict(hits))
            for frag, ln in preps:
                print("   BAD GRAMMAR line %-5d %r — after a preposition it is `ti`, not `tú`." % (ln, frag))
                print("              ^ a `<preposition> vos` pair is missing from PHRASE. Add it, do not hand-patch.")
            for ln, q in cites:
                print("   CITATION   line %-5d %s" % (ln, q))
                print("              ^ a record of corrected copy (leave), or a stale copy of copy already fixed (correct it)?")
            for form, ln, line in review:
                print("   HOMOGRAPH  %-10s line %-5d %s" % (form, ln, line))
                print("              ^ voseo imperative, or Iván's own first-person preterite? Decide, edit by hand.")
        if write and changed and not hits and not review and not cites and not preps:
            io.open(f, "w", encoding="utf-8").write(new)
            print("   WRITTEN")
    print("\n%d file(s) need attention." % dirty if dirty else "\nClean.")
    return 1 if dirty else 0

if __name__ == "__main__":
    sys.exit(main())
