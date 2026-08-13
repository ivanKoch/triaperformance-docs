#!/usr/bin/env node
/**
 * build-lead-magnet-pdf.js — renders "Las sesiones que hacen crecer cada zona"
 * to a branded PDF.
 *
 * Content source: lead-magnet-sesiones-por-zona.md (the home doc). The session
 * text lives in the DATA block below rather than being parsed out of the
 * markdown — parsing prose to rebuild prose is fragile, and this file is the
 * thing that actually ships. If the two disagree, the markdown is the doc and
 * this is the artefact; fix both in the same session.
 *
 * Zone percentages are copies of data/zones.csv (see the standing rule in the
 * home doc). Prices are copies of triaperformance-pricing-and-positioning.md.
 *
 * Usage:  node automation/build-lead-magnet-pdf.js [outfile.pdf]
 * Needs:  npx playwright install chromium
 */

const path = require("path");
const OUT = process.argv[2] || path.join(__dirname, "..", "site", "assets", "guias", "sesiones-por-zona.pdf");

/* ------------------------------------------------------------------ data */

const PRICES = { allAccess: "39,99", coaching: "149" };            // USD/mes
const LINKS = {
  allAccess: "https://checkout.trainingpeaks.com/product/188df02f-d71f-4b5b-8d43-abd4edb446f3",
  coaching: "https://triaperformance.com/#coaching",
  plans: "https://triaperformance.com/planes/running/",
  calculator: "https://triaperformance.com/calculadora-de-zonas/",
};

const INTRO = {
  title: "Las sesiones que hacen crecer cada zona",
  sub: "Natación, ciclismo y running",
  kicker: "Ya tenés tus zonas. Esto es qué hacer con ellas.",
  lede:
    "Tener los números es la mitad. La otra mitad es saber qué sesión construye cada zona — " +
    "cómo se arma una Zona 2 que no sea solo trotar despacio, la sesión a ritmo de maratón que " +
    "justifica la Zona X, y cómo es una serie de umbral de verdad.",
  body: [
    ["El modelo", "Polarizado 80/20: cerca del 80% del volumen se mantiene suave y el 20% es realmente intenso. Hasta ahí, cinco zonas alcanzarían. Las otras dos existen por un motivo distinto."],
    ["La X y la Y no son zonas nuevas",
      "Son <strong>pedazos que les recortamos a la Zona 2 y a la Zona 4</strong>. Les dimos nombre propio porque a las dos las queremos evitar — y no se pueden evitar zonas que no tienen nombre. Lo interesante es que las evitamos por razones exactamente opuestas."],
    ["Zona X — la parte rápida de la Zona 2",
      "La Zona X es el techo de tu Zona 2. Sale bastante más cara en fatiga y te devuelve prácticamente el mismo estímulo aeróbico que si hubieras ido más lento: pagás más y te llevás lo mismo.<br><br>" +
      "Es el error más común del entrenamiento de resistencia, y casi nunca es una decisión. Salís a hacer un rodaje suave, te sentís bien, el ritmo se acomoda solo unos segundos, y terminás la semana con la fatiga de una sesión de calidad que nunca hiciste — y sin piernas para la que sí tenías programada.<br><br>" +
      "<strong>La excepción es el maratón y el Ironman:</strong> ahí la Zona X es tu ritmo de competición, y hay que entrenarla a propósito."],
    ["Zona Y — el piso de la Zona 4",
      "La Zona Y también se evita, pero la intuición es la contraria: no es que sobre, es que <strong>no alcanza</strong>.<br><br>" +
      "Tu umbral no es una línea fija. Se mueve con la forma, el descanso, el calor y el día. Por eso entrenar justo al 100% de tu número no te garantiza nada: si ese día tu umbral real está un poco más arriba, la sesión te quedó corta y las adaptaciones no llegaron. Pagaste el costo de una sesión de umbral sin comprar el beneficio.<br><br>" +
      "Para asegurarlas hay que entrenar un poco por encima: <strong>desde el 102%</strong>, que es justamente el piso de la Zona 4. La Zona Y es esa franja de duda entre el 100 y el 102 — se entrena sólo cuando es tu ritmo exacto de competición."],
    ["Todos los porcentajes son sobre tu umbral", "No sobre tu frecuencia cardíaca máxima. Y no coinciden entre métricas: el ritmo, el pulso y la potencia se comportan distinto en los extremos. Por eso cada deporte tiene su propia tabla."],
  ],
};

const sport = (o) => o;

const SPORTS = [
  sport({
    key: "running",
    label: "Running",
    metric: "Métrica principal: potencia &gt; ritmo &gt; frecuencia cardíaca",
    metricNote:
      "El pulso reacciona con retraso al esfuerzo, así que es el respaldo, no la señal principal, " +
      "cuando hay una métrica mejor disponible. La excepción son los días fáciles, donde la FC funciona bien como techo.",
    cols: ["% FC (LTHR)", "% ritmo"],
    zones: [
      { id: "1", name: "Recuperación", bands: ["72–81%", "60–76%"], purpose: "Circulación, movilidad, días off activos",
        que: "La intensidad más baja. Se siente casi incómodamente lento y requiere retenerte a propósito.",
        adapta: "Facilita el flujo sanguíneo a los músculos dañados y acelera la limpieza de desechos metabólicos sin introducir estrés nuevo que a su vez haya que recuperar.",
        sesiones: [["Trote regenerativo", "20 a 40 minutos muy suaves, el día después de una sesión dura."],
                   ["Calentamiento y vuelta a la calma", "10 a 15 minutos antes y después de cualquier sesión de calidad."]],
        no: "No mires el reloj buscando un ritmo digno. Si te preocupa que el ritmo parezca lento —o lo que se vea en Strava— vas a empujar a Z2 o ZX y el día pierde su función.",
        cuanto: "~20–25% del tiempo semanal" },
      { id: "2", name: "Aeróbico base", bands: ["81–90%", "76–87%"], purpose: "Donde vive el 80% de tu volumen",
        que: "Tu ritmo de rodaje natural. Tenés que poder sostener una conversación completa sin que se te corte la respiración.",
        adapta: "Desarrollo mitocondrial, más capilares, mejor uso de la grasa como combustible, resistencia a la fatiga. Es la zona que construye el motor.",
        sesiones: [["Tirada larga", "90 a 120+ minutos continuos."],
                   ["Rodaje base", "45 a 60 minutos, mantenimiento aeróbico entre semana."],
                   ["Rodaje con progresión", "60 minutos: 15' en Z1 y el resto en Z2, terminando en la mitad alta de la zona sin cruzarla."]],
        no: "No aceleres en las subidas ni cierres con un sprint hasta casa. Eso dispara el pulso y te mete en el agujero negro de la intensidad moderada.",
        cuanto: "~55–60% del tiempo semanal" },
      { id: "X", name: "Aeróbico alto", bands: ["90–95%", "87–93%"], purpose: "Ritmo de maratón", special: true,
        que: "Ritmo de maratón. Suma bastante más fatiga que la Z2 sin sumar mucho más beneficio aeróbico. Se prescribe a propósito o no se pisa.",
        adapta: "Resistencia específica a la fatiga al ritmo de competición larga, y economía a esa velocidad exacta.",
        cond: "Solo en bloque de maratón o Ironman",
        sesiones: [["Larga con calidad", "45–60 minutos en Z2, después 40–50 minutos en Zona X, 10' de vuelta a la calma."],
                   ["Bloques fraccionados", "3 x 20 minutos en Zona X con 5' en Z1 entre bloques, dentro de una tirada larga."]],
        no: "No caigas acá por accidente en un día fácil. Si no estás preparando una distancia larga, evitala.",
        cuanto: "0% fuera de bloque; dentro, 5–10% y sale del presupuesto intenso" },
      { id: "3", name: "Tempo", bands: ["95–100%", "93–100%"], purpose: "Extensivo de umbral. Sesión clave",
        que: "Cómodamente duro. Para la mayoría cae cerca del ritmo de medio maratón; el ritmo que sostendrías una hora entera está en el borde superior de la zona, no en el medio.",
        adapta: "Aumenta la capacidad de reciclar lactato —lo que sube el umbral— y mejora la resistencia a velocidades submáximas. Es una de las dos sesiones clave de la semana.",
        sesiones: [["Tempo continuo", "15' Z1 + 20 a 30 minutos sostenidos en Z3 + 10' Z1."],
                   ["Intervalos cruise", "4 x 8 minutos en Z3 con 2 minutos en Z1."],
                   ["Tempo fraccionado largo", "3 x 15 minutos en Z3 con 3 minutos en Z1. Sesión avanzada: 45 minutos de trabajo."]],
        no: "Convertir el tempo en carrera. Si te vas a Z4, perdés el propósito metabólico y llegás fatigado a la sesión siguiente.",
        cuanto: "~5–10%" },
      { id: "Y", name: "Umbral bajo", bands: ["100–102%", "100–102%"], purpose: "La franja justo alrededor del umbral", special: true,
        que: "La franja finísima justo alrededor del umbral. Demasiado exigente para sostenerla como un tempo, y demasiado suave para dar las adaptaciones de VO2máx.",
        donde: "Es territorio de <strong>15k</strong>, y son los <strong>últimos 3 kilómetros de un medio maratón</strong> — cuando ya no queda nada que administrar y el ritmo sube solo.",
        adapta: "Tolerancia a trabajar exactamente en el umbral, y familiaridad con ese ritmo si es tu ritmo de competición.",
        cond: "Solo si competís a este ritmo",
        sesiones: [["Simulacro de carrera", "3 x 10 minutos en Zona Y con 3' de recuperación."],
                   ["Medio maratón por el final", "30 minutos continuos en Z3 y, sin pausa, 10 minutos en Zona Y. Entrena lo que decide un medio: cerrar por encima del umbral con 18 kilómetros en las piernas."],
                   ["Bloques cortos", "5 x 5 minutos en Zona Y con 90 segundos suaves."]],
        no: "Programarla de rutina. Si no estás preparando una distancia que se corre exactamente a este ritmo, la Z3 y la Z4 hacen el mismo trabajo mejor repartido.",
        cuanto: "Residual fuera de bloques de competición" },
      { id: "4", name: "Umbral alto", bands: ["102–105%", "102–115%"], purpose: "Intensivo de umbral. La otra sesión clave",
        que: "Intervalos por encima del umbral, más largos que una serie de VO2máx y más cortos que un tempo. La Z3 acumula volumen a umbral; la Z4 acumula intensidad justo por encima.",
        adapta: "Sube el umbral por arriba en lugar de por abajo: mejora la capacidad de tolerar y reciclar lactato a velocidades que no podrías sostener media hora.",
        sesiones: [["Series largas de umbral", "5 x 6 minutos en Z4 con 2 minutos en Z1."],
                   ["Series medias", "8 x 3 minutos en Z4 con 90 segundos en Z1."],
                   ["Bloques dobles", "2 x 12 minutos en la parte baja de la Z4 con 3 minutos en Z1."]],
        no: "No la corras a ritmo de 5k. La Z4 por ritmo llega hasta el 115%, pero estas sesiones viven en la mitad baja de esa franja: si arrancás demasiado rápido la sesión se convierte en VO2máx a medias y no cumple ninguna de las dos funciones.",
        cuanto: "~5–8%" },
      { id: "5", name: "VO2máx", bands: ["105–120%", "115–140%"], purpose: "Series cortas, poco volumen, alto costo",
        que: "Series cortas, poco volumen, alto costo. Ritmo de 3k a 5k en la parte baja de la zona; por encima, trabajo neuromuscular puro.",
        adapta: "Aumenta el VO2máx, mejora el volumen sistólico y optimiza la economía de carrera de forma marcada.",
        sesiones: [["Series clásicas de VO2máx", "6 x 800 metros con 2 a 3 minutos de recuperación."],
                   ["Intervalos por tiempo", "5 x 3 minutos con 2 a 3 minutos de recuperación."],
                   ["Series cortas", "10 a 12 x 400 metros con 90 segundos a 2 minutos."]],
        extra: ["Trabajo neuromuscular", "8 a 10 x 15 segundos en cuesta a tope, bajando caminando, con 2 a 3 minutos entre repeticiones. <strong>No se prescribe por zona sino por duración y esfuerzo máximo</strong> — el esfuerzo termina antes de que el pulso llegue a ningún lado. Van al final de un rodaje suave, en dosis muy chicas."],
        no: "Recortar los descansos por falso heroísmo. Si acortás la recuperación vas a llegar a la serie 5 tan cansado que el ritmo se cae a Z3. Tenés que poder repetir el mismo ritmo en la última serie que en la primera.",
        cuanto: "~2–5%, incluyendo el trabajo neuromuscular" },
    ],
  }),

  sport({
    key: "ciclismo",
    label: "Ciclismo",
    metric: "Métrica principal: potencia (FTP)",
    metricNote:
      "La potencia manda siempre. La FC va detrás con varios minutos de retraso y en intervalos cortos no sirve para pautar nada. " +
      "Sí sirve para una cosa que la potencia no te dice: el desacople. Si a las tres horas seguís en Z2 de vatios pero el pulso se fue a Z3, tu Zona 2 metabólica se terminó por hoy.",
    cols: ["% FTP", "% FC (LTHR)"],
    zones: [
      { id: "1", name: "Recuperación", bands: ["50–70%", "72–81%"], purpose: "Circulación, días off activos",
        que: "El paseo de café. Las piernas giran sin resistencia.",
        adapta: "Circulación para limpiar desechos metabólicos sin reclutar fibra rápida ni sumar fatiga central.",
        sesiones: [["Rodillo regenerativo", "30 a 45 minutos a cadencia alta (90+ rpm) sin resistencia."],
                   ["Calentamiento y vuelta a la calma", "15 minutos suaves antes y después de un bloque de intervalos."]],
        no: "Empujar en los repechos. En la calle, la tentación de pararte en los pedales te manda a Z3 o Z4 en segundos. Si salís afuera, plato chico y piñón grande; si estás en rodillo, modo ERG.",
        cuanto: "~20–25%" },
      { id: "2", name: "Aeróbico base", bands: ["70–83%", "81–90%"], purpose: "Donde vive el 80% de tu volumen",
        que: "Tu ritmo de endurance. La zona que construye el motor.",
        adapta: "Biogénesis mitocondrial, densidad capilar y oxidación de grasas.",
        sesiones: [["Salida larga", "2 a 4+ horas estables en la mitad de la Z2."],
                   ["Rodaje de semana", "60 a 90 minutos estables."]],
        no: "Ser reactivo al terreno. El error más caro del ciclismo es el índice de variabilidad alto: bajar a cero vatios y subir cada repecho en Z4. Pedaleá también en las bajadas para sostener la tensión muscular dentro de la zona.",
        cuanto: "~55–60%" },
      { id: "X", name: "Aeróbico alto", bands: ["83–91%", "90–95%"], purpose: "Ritmo de 70.3 e Ironman", special: true,
        que: "Lo que en ciclismo se llama sweet spot. Mucho estrés muscular periférico por vatio. Es el ritmo de un 70.3 y de un Ironman.",
        adapta: "Resistencia específica a la fatiga y eficiencia biomecánica en posición aerodinámica.",
        cond: "Específico de 70.3 / Ironman",
        sesiones: [["Intervalos largos de carrera", "4 x 20 minutos en ZX con 5' suaves. Sesión avanzada: son 80 minutos en zona."],
                   ["Simulación de 70.3", "2 horas con 3 bloques de 30 minutos en ZX."]],
        no: "Convertir la salida grupal del fin de semana en esto. Esas salidas suelen ser una fiesta ininterrumpida de Zona X: queman mucho y te hacen poco más rápido.",
        cuanto: "0% fuera de bloque de 70.3/IM" },
      { id: "3", name: "Tempo", bands: ["91–100%", "95–100%"], purpose: "Extensivo de umbral. Sesión clave",
        que: "Justo por debajo del ácido. Cuesta hablar, la respiración es profunda y rítmica. Una de las dos sesiones clave de la semana.",
        adapta: "Sube el FTP, mejora el aclaramiento de lactato y la tolerancia al esfuerzo sostenido.",
        sesiones: [["Los 2 x 20", "2 x 20 minutos al 95–100% del FTP con 5' de recuperación. La sesión de umbral más probada que existe en ciclismo."],
                   ["Criss-cross", "3 x 15 minutos alternando 2 minutos en la parte baja de la Z3 y 1 minuto en la parte alta."],
                   ["Intervalos de umbral base", "4 x 10 minutos al 95% del FTP con 3' de recuperación."]],
        no: "Pasarte de vatios en los primeros tres minutos. El lactato que generás ahí no lo vas a poder reciclar, y la sesión se convierte en una agonía anaeróbica que no entrena lo que venías a entrenar.",
        cuanto: "~5–10%" },
      { id: "Y", name: "Umbral bajo", bands: ["100–102%", "100–102%"], purpose: "La franja justo alrededor del FTP", special: true,
        que: "La franja exacta alrededor del FTP. Es el ritmo de una contrarreloj de 40 km y el de la bici de un triatlón olímpico.",
        adapta: "Familiaridad con el ritmo de competición y tolerancia a sostenerlo sin pasarse.",
        cond: "Solo si competís a este ritmo",
        sesiones: [["Potencia de olímpico", "2 x 20 minutos al 100–102% del FTP con 5 a 10 minutos de recuperación."],
                   ["Bloques de contrarreloj", "3 x 12 minutos en Zona Y con 4' suaves."]],
        no: "Vivir acá. Un par de vatios por encima del FTP durante 20 minutos es sostenible; cinco no lo son, y la diferencia no la vas a sentir hasta el minuto 15.",
        cuanto: "Residual fuera de bloques de competición" },
      { id: "4", name: "Umbral alto", bands: ["102–110%", "102–105%"], purpose: "Intensivo de umbral. La otra sesión clave",
        que: "Intervalos por encima del FTP, más largos que una serie de VO2máx y más cortos que un tempo.",
        adapta: "Sube el umbral por arriba: mejora la capacidad de tolerar y reciclar lactato a vatios que no sostendrías media hora.",
        sesiones: [["Series largas", "5 x 6 minutos al 105–108% del FTP con 3' en Z1."],
                   ["Over-unders", "4 x 9 minutos alternando 2 minutos al 105% y 1 minuto al 95%."],
                   ["Series medias", "8 x 3 minutos en Z4 con 90 segundos suaves."]],
        no: "Hacer trampa con la cadencia. Si terminás moviendo los vatios a 60 rpm estás haciendo pesas arriba de la bici en lugar de estresar el sistema cardiovascular. Sostené 90–100 rpm.",
        cuanto: "~5–8%" },
      { id: "5", name: "VO2máx", bands: ["110–150%", "105–120%"], purpose: "Series cortas, poco volumen, alto costo",
        que: "Series cortas, poco volumen, alto costo. Dolor agudo y respiración descontrolada.",
        adapta: "Expande el techo aeróbico, fuerza de pedaleo y reclutamiento máximo de fibras.",
        sesiones: [["VO2 clásico", "5 x 3 minutos al 115% del FTP con 3 minutos muy suaves."],
                   ["Micro-intervalos 30/30", "3 bloques de 10 x (30 segundos al 115–120% / 30 segundos suaves), con 5' entre bloques."],
                   ["Series de 5", "4 x 5 minutos al 110–113% con 5' de recuperación."]],
        extra: ["Trabajo neuromuscular", "8 x 20 segundos a máximo esfuerzo, bien por encima del 150% del FTP, con recuperación completa de 3 minutos o más. <strong>No se prescribe por zona sino por esfuerzo y duración</strong> — se mide después, mirando los picos de potencia."],
        no: "Recortar los descansos. Si llegás a la serie 4 sin poder repetir los vatios de la primera, dejaste de hacer VO2máx y estás acumulando fatiga por deporte.",
        cuanto: "~2–5%, incluyendo el trabajo neuromuscular" },
    ],
  }),

  sport({
    key: "natacion",
    label: "Natación",
    metric: "Métrica principal: ritmo sobre tu velocidad crítica (CSS)",
    metricNote:
      "El agua neutraliza la frecuencia cardíaca: es imprecisa y encima no la podés mirar mientras nadás. " +
      "Todo se pauta con el ritmo sobre tu velocidad crítica y el reloj de pared.",
    cols: ["% de tu CSS", "Si tu CSS es 1:30/100m"],
    callout: ["Por qué esto va en porcentajes y no en “CSS + 5 segundos”",
      "Los segundos por 100 no son transferibles entre nadadores. La Zona 2 son <strong>+7 a +14 segundos</strong> sobre el CSS si nadás 1:15, y <strong>+12 a +23 segundos</strong> si nadás 2:00. Un mismo “+5 segundos” es Zona 2 para uno y Zona 3 para el otro. La calculadora hace esa cuenta con tu número; la tabla es la que no cambia."],
    zones: [
      { id: "1", name: "Recuperación y técnica", bands: ["75–84%", "1:47 – 2:00"], purpose: "Técnica, aflojes, calentamiento",
        que: "Nado muy lento y consciente. El día que no venís a entrenar el motor, venís a entrenar la mano.",
        adapta: "Sensibilidad con el agua y corrección técnica.",
        sesiones: [["Bloque de técnica", "8 x 50 metros de ejercicios (punto ciego, un solo brazo, puños cerrados) con muchísimo descanso."],
                   ["Calentamiento y afloje", "200 a 400 metros suaves al principio y al final de cada sesión."]],
        no: "Contener la respiración o nadar tenso. Tiene que ser un masaje líquido.",
        cuanto: "~20–25%" },
      { id: "2", name: "Aeróbico base", bands: ["84–91%", "1:39 – 1:47"], purpose: "Donde vive el 80% de tu volumen",
        que: "Ritmo continuo y fluido, claramente más lento que tu CSS. <strong>Es la zona que más gente nada demasiado rápido</strong>, porque en la pileta el ritmo cómodo se parece bastante al de umbral.",
        adapta: "Resistencia muscular del tren superior, eficiencia mecánica, base aeróbica.",
        sesiones: [["Fraccionado largo", "3 x 400 metros en Z2 con 20 a 30 segundos de descanso."],
                   ["Endurance pull", "1000 metros continuos con pull-buoy, para aislar la brazada."],
                   ["Escalera aeróbica", "400 / 300 / 200 / 100 en Z2 con 20 segundos, repetido dos veces."]],
        no: "Picarte con el del carril de al lado. Es el error número uno de las piletas y convierte todo tu volumen aeróbico en Zona 3.",
        cuanto: "~55–60%" },
      { id: "X", name: "Aeróbico alto", bands: ["91–96%", "1:34 – 1:39"], purpose: "Aguas abiertas y ritmo de 70.3", special: true,
        que: "Ritmo de aguas abiertas y de la natación de un 70.3. Un poco por debajo del CSS, sostenible mucho tiempo, y con el mismo problema que en los otros deportes: acumula fatiga sin dar lo que da el umbral.",
        adapta: "Resistencia específica al ritmo de competición larga y ritmo constante sin referencias de pared.",
        cond: "Específico de aguas abiertas / 70.3",
        sesiones: [["Bloques largos", "4 x 300 metros en ZX con 20 segundos de descanso."],
                   ["Simulación de tramo", "2 x 600 metros continuos en ZX con 45 segundos."]],
        no: "Usar esta zona como si fuera la Z2 porque se siente cómoda. Se prescribe a propósito o no se nada.",
        cuanto: "0% fuera de bloque de aguas abiertas o 70.3" },
      { id: "3", name: "Tempo", bands: ["96–100%", "1:30 – 1:34"], purpose: "Extensivo de umbral. Sesión clave",
        que: "Tu ritmo de umbral. Requiere concentración alta: tenés que convertirte en un metrónomo.",
        adapta: "Eleva el umbral de lactato en hombros y dorsales, y asienta el ritmo de competición.",
        sesiones: [["La serie de CSS", "10 x 100 metros clavados en tu ritmo CSS con 10 a 15 segundos de descanso. El descanso corto es el estímulo."],
                   ["Tirada a ritmo", "4 x 200 metros en Z3 con 20 segundos."],
                   ["Bloques largos de umbral", "3 x 300 metros en Z3 con 30 segundos."]],
        no: "Estirar los descansos en la pared. El estímulo depende de que sean cortos: si descansás un minuto entre 100 y 100, la serie deja de ser de umbral.",
        cuanto: "~5–10%" },
      { id: "Y", name: "Umbral bajo", bands: ["100–102%", "1:28 – 1:30"], purpose: "La franja justo alrededor del CSS", special: true,
        que: "La franja finísima justo por encima del CSS. En natación es el ritmo con el que cerrás una prueba de 1500 metros.",
        adapta: "Familiaridad con el ritmo de cierre de competición.",
        cond: "Solo si competís a este ritmo",
        sesiones: [["Cierre de 1500", "6 x 150 metros en Zona Y con 30 segundos de descanso."],
                   ["Simulacro", "3 x 400 metros: los primeros 300 en Z3 y los últimos 100 en Zona Y, sin cambiar la técnica."]],
        no: "Confundirla con la Z4. Son dos segundos por 100 de diferencia y la sensación es muy parecida los primeros 200 metros; la diferencia aparece en el metro 600.",
        cuanto: "Residual" },
      { id: "4", name: "Umbral alto", bands: ["102–106%", "1:25 – 1:28"], purpose: "Intensivo de umbral",
        que: "Claramente por encima del CSS. El agua se pone pesada y quema el tríceps.",
        adapta: "Potencia de brazada y tolerancia a nadar rápido con la técnica todavía armada.",
        sesiones: [["Series cortas", "15 x 50 metros en Z4 con 20 a 30 segundos."],
                   ["Pirámide invertida", "200 / 150 / 100 / 50, acelerando a medida que se acorta, con 30 segundos entre repeticiones."],
                   ["Series de 100", "8 x 100 metros en Z4 con 30 segundos."]],
        no: "Desarmar la técnica. En el agua, más fuerza bruta sin técnica es más arrastre, no más velocidad. Si sentís que estás apaleando el agua, bajá a Z3.",
        cuanto: "~5–8%" },
      { id: "5", name: "VO2máx y velocidad", bands: ["106–140%", "1:04 – 1:25"], purpose: "Series cortas, alto costo",
        que: "Tu ritmo máximo de 100 y 200 metros, y por encima, velocidad pura.",
        adapta: "Reclutamiento neuromuscular máximo y agarre explosivo del agua.",
        sesiones: [["Series de VO2", "8 x 100 metros fuertes con 45 segundos a 1 minuto de descanso."],
                   ["Piques", "8 x 25 metros a máxima velocidad, saliendo cada 1:30."],
                   ["Sprints con salida", "6 x 50 metros máximos con 2 minutos de descanso completo."]],
        no: "Nadar los piques cansado al final de la sesión. La velocidad se entrena descansado; si no, estás entrenando otra cosa con el nombre equivocado.",
        cuanto: "~2–5%" },
    ],
  }),
];

const BRICK = {
  title: "La transición (el brick)",
  body:
    "En triatlón las zonas se ven afectadas por la fatiga acumulada, y ahí la regla de métricas cambia. " +
    "Correr en “Zona 2” apenas bajado de la bici ignora que el costo fisiológico de la bici ya te subió el pulso: " +
    "el ritmo que ayer era fácil, hoy es metabólicamente caro.",
  punch:
    "En un brick, <strong>la FC manda sobre el ritmo</strong> — es la única de las dos que sabe lo que pasó en las tres horas anteriores. " +
    "Si el pulso se te va a Z3, frená el ritmo aunque el reloj diga que vas suave. Es la única situación de toda esta guía donde el pulso gana.",
};

const QUOTES = [
  ["Todos los lunes me escribe para saber cómo viene mi semana, me da feedback.", "Sergio Toro", "Chile"],
  ["Me llevó de absolutamente cero experiencia en triatlón a mi objetivo de hacer un Ironman 70.3.", "Humberto Rodríguez", "México"],
];

/* -------------------------------------------------------------- template */

const esc = (s) => String(s);

function zoneBlock(z, cols) {
  return `
  <section class="zone${z.special ? " zone--special" : ""}">
    <div class="zone-head">
      <div class="zone-id">${z.id}</div>
      <div class="zone-title">
        <h3>${z.name}</h3>
        <p class="zone-purpose">${z.purpose}</p>
      </div>
      <div class="zone-bands">
        ${z.bands.map((b, i) => `<div class="band"><span class="band-l">${cols[i]}</span><span class="band-v">${b}</span></div>`).join("")}
      </div>
    </div>
    <p class="zone-what">${z.que}</p>
    ${z.donde ? `<p class="zone-where">${z.donde}</p>` : ""}
    <p class="zone-adapt"><span class="lbl">Qué adapta</span>${z.adapta}</p>
    <div class="sessions">
      <div class="sessions-h">Sesiones${z.cond ? ` <span class="cond">— ${z.cond}</span>` : ""}</div>
      <ol>
        ${z.sesiones.map(([n, d]) => `<li><strong>${n}</strong> — ${d}</li>`).join("")}
      </ol>
      ${z.extra ? `<p class="extra"><strong>${z.extra[0]}.</strong> ${z.extra[1]}</p>` : ""}
    </div>
    <p class="dont"><span class="lbl">Qué no hacer</span>${z.no}</p>
    <p class="howmuch">${z.cuanto}</p>
  </section>`;
}

function sportSection(s) {
  return `
<div class="sport-cover">
  <span class="eyebrow">Deporte</span>
  <h2>${s.label}</h2>
  <p class="metric">${s.metric}</p>
  <p class="metric-note">${s.metricNote}</p>
  <table class="ztable">
    <thead><tr><th>Zona</th>${s.cols.map((c) => `<th>${c}</th>`).join("")}<th>Para qué sirve</th></tr></thead>
    <tbody>
      ${s.zones.map((z) => `<tr${z.special ? ' class="special"' : ""}>
        <td class="z"><strong>${z.id}</strong> · ${z.name}</td>
        ${z.bands.map((b) => `<td class="num">${b}</td>`).join("")}
        <td class="pu">${z.purpose}</td></tr>`).join("")}
    </tbody>
  </table>
  ${s.callout ? `<div class="callout"><div class="callout-t">${s.callout[0]}</div><p>${s.callout[1]}</p></div>` : ""}
</div>
${s.zones.map((z) => zoneBlock(z, s.cols)).join("")}`;
}

const HTML = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><style>
  :root{
    --blue:#004aad; --blue-deep:#003a89; --ink:#1e2019; --white:#fff;
    --wash:#edf3fb; --slate:#565a52; --mist:#e4e6e1;
  }
  @page { size: A4; margin: 16mm 15mm 18mm; }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--ink);
       font-size:10.5pt;line-height:1.55;-webkit-font-smoothing:antialiased}
  strong{font-weight:700}
  .lbl{display:block;font-size:7.5pt;font-weight:700;text-transform:uppercase;
       letter-spacing:.09em;color:var(--blue);margin-bottom:2px}

  /* ---------- cover ----------
     White, not a blue slab. Two reasons: brand-guidelines §6 names High North as
     the reference — white-dominant, typography and whitespace doing the work —
     and a full-bleed colour panel does not survive Chromium's print margin box,
     so the blue version rendered as an inset rectangle with an uneven gutter. */
  .cover{height:255mm;page-break-after:always;display:flex;flex-direction:column}
  .cover .wordmark{font-size:14pt;font-weight:700;letter-spacing:-0.01em;color:var(--blue)}
  .cover .cover-body{margin-top:auto}
  .cover .kicker{font-size:8.5pt;font-weight:700;text-transform:uppercase;
                 letter-spacing:.13em;color:var(--blue);display:block;margin-bottom:5mm}
  .cover h1{font-size:33pt;font-weight:700;letter-spacing:-0.02em;line-height:1.04;margin-bottom:4mm}
  .cover .sub{font-size:13pt;color:var(--slate);margin-bottom:10mm}
  .zonestrip{display:flex;gap:2mm;margin-bottom:10mm}
  .zonestrip div{flex:1;text-align:center;padding:3mm 0;border:1px solid var(--mist);
                 border-radius:3px;font-size:10pt;font-weight:700;color:var(--slate)}
  .zonestrip div.hl{background:var(--wash);border-color:var(--blue);color:var(--blue)}
  .cover .lede{font-size:10.5pt;line-height:1.6;color:var(--slate);max-width:125mm;
               border-top:1px solid var(--mist);padding-top:6mm}
  .cover .foot{margin-top:auto;font-size:8.5pt;color:var(--slate);
               border-top:1px solid var(--mist);padding-top:4mm}

  /* ---------- intro ---------- */
  /* Must hold one page, callout included — see the note on .cta. The first
     build after the X/Y explanation was expanded pushed the calculator callout
     alone onto page 3. Spacing here is tuned to fit; re-check after adding copy. */
  .intro{page-break-after:always}
  h2.sec{font-size:20pt;font-weight:700;letter-spacing:-0.02em;margin-bottom:4mm}
  .intro .row{margin-bottom:3.4mm;padding-bottom:3.4mm;border-bottom:1px solid var(--mist)}
  .intro .row:last-child{border-bottom:0;padding-bottom:0}
  .intro .row h4{font-size:10.5pt;font-weight:700;margin-bottom:1.2mm}
  .intro .row p{color:var(--slate);font-size:10pt;line-height:1.5}
  .intro .row p br{line-height:0.7}

  /* ---------- sport ---------- */
  .sport-cover{page-break-before:always;padding-top:2mm}
  .eyebrow{display:block;font-size:8pt;font-weight:700;text-transform:uppercase;
           letter-spacing:.12em;color:var(--blue);margin-bottom:2mm}
  .sport-cover h2{font-size:28pt;font-weight:700;letter-spacing:-0.02em;line-height:1.05}
  .metric{font-size:11pt;font-weight:700;margin:2mm 0 2mm}
  .metric-note{color:var(--slate);max-width:150mm;margin-bottom:7mm}

  table.ztable{width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:6mm}
  table.ztable th{text-align:left;font-size:7.5pt;text-transform:uppercase;letter-spacing:.06em;
                  color:var(--slate);font-weight:700;padding:0 3mm 2mm 0;border-bottom:1px solid var(--mist)}
  table.ztable td{padding:2.4mm 3mm 2.4mm 0;border-bottom:1px solid var(--mist);vertical-align:top}
  table.ztable td.num{white-space:nowrap;color:var(--ink);font-variant-numeric:tabular-nums}
  table.ztable td.pu{color:var(--slate);font-size:8.5pt}
  table.ztable tr.special td{background:var(--wash)}
  table.ztable th:last-child,table.ztable td:last-child{padding-right:2mm}

  .callout{background:var(--wash);border-left:2px solid var(--blue);border-radius:0 4px 4px 0;
           padding:4mm 5mm;margin-bottom:4mm}
  .callout-t{font-weight:700;font-size:9.5pt;margin-bottom:1.5mm}
  .callout p{font-size:9pt;color:var(--slate)}

  /* ---------- zone block ---------- */
  .zone{page-break-inside:avoid;border-top:1px solid var(--mist);padding:5mm 0 4mm}
  .zone-head{display:flex;align-items:flex-start;gap:4mm;margin-bottom:3mm}
  .zone-id{flex:0 0 9mm;height:9mm;border-radius:50%;background:var(--blue);color:#fff;
           font-weight:700;font-size:11pt;display:flex;align-items:center;justify-content:center}
  .zone--special .zone-id{background:var(--blue-deep)}
  .zone-title{flex:1}
  .zone-title h3{font-size:14pt;font-weight:700;letter-spacing:-0.01em;line-height:1.15}
  .zone-purpose{font-size:8.5pt;color:var(--slate)}
  .zone-bands{display:flex;gap:5mm;text-align:right}
  .band-l{display:block;font-size:7pt;text-transform:uppercase;letter-spacing:.07em;color:var(--slate)}
  .band-v{display:block;font-size:11pt;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums}
  .zone-what{margin-bottom:2mm}
  .zone-where{background:var(--wash);padding:2.5mm 4mm;border-radius:4px;margin-bottom:2.5mm;font-size:9.5pt}
  .zone-adapt{color:var(--slate);font-size:9.5pt;margin-bottom:3mm}
  .sessions{border-left:2px solid var(--blue);padding-left:5mm;margin-bottom:3mm}
  .sessions-h{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.09em;
              color:var(--blue);margin-bottom:1.5mm}
  .sessions-h .cond{color:var(--slate);letter-spacing:.04em}
  .sessions ol{margin-left:4.5mm}
  .sessions li{margin-bottom:1.5mm;font-size:9.5pt}
  .extra{font-size:9pt;color:var(--slate);margin-top:2mm}
  .dont{color:var(--slate);font-size:9.5pt;margin-bottom:2mm}
  .howmuch{font-size:8.5pt;color:var(--slate);border-top:1px solid var(--mist);padding-top:1.5mm}

  /* ---------- brick + CTA ---------- */
  .brick{page-break-before:always;padding-top:2mm}
  .brick .punch{background:var(--wash);border-left:2px solid var(--blue);padding:4mm 5mm;
                border-radius:0 4px 4px 0;margin-top:3mm}
  .who{margin-top:9mm;border-top:1px solid var(--mist);padding-top:6mm}
  .who p{color:var(--slate);margin-bottom:3mm;max-width:155mm}
  .stats{display:flex;gap:9mm;margin:5mm 0}
  .stat .v{font-size:20pt;font-weight:700;color:var(--blue);line-height:1}
  .stat .k{font-size:8pt;text-transform:uppercase;letter-spacing:.08em;color:var(--slate);margin-top:1mm}
  .quotes{display:flex;gap:7mm;margin-top:4mm}
  .quote{flex:1}
  .quote p{font-size:9.5pt;color:var(--ink);margin-bottom:1.5mm}
  .quote .who-q{font-size:8pt;color:var(--slate)}

  /* The whole CTA must land on one page — a closing offer that spills an orphan
     line onto page 17 reads as a mistake at exactly the moment it is asking for
     money. Kept tight deliberately; if a line is added here, re-check the fit. */
  .cta{page-break-before:always;page-break-inside:avoid;padding-top:0}
  .cta h2{font-size:21pt;font-weight:700;letter-spacing:-0.02em;line-height:1.06;margin-bottom:2.5mm}
  .cta .lead{color:var(--slate);max-width:150mm;margin-bottom:5mm;font-size:10pt}
  .offer{border:1px solid var(--mist);border-radius:6px;padding:5mm;margin-bottom:3.5mm}
  .offer--primary{border:1.5px solid var(--blue);background:var(--wash)}
  .offer .tag{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.09em;
              color:var(--blue);margin-bottom:1.5mm}
  .offer h3{font-size:15pt;font-weight:700;margin-bottom:1mm}
  .offer .price{font-size:15pt;font-weight:700;color:var(--blue);white-space:nowrap}
  .offer-top{display:flex;justify-content:space-between;align-items:baseline;gap:6mm}
  .offer p{font-size:9.5pt;color:var(--slate);margin:1.5mm 0 2.5mm;max-width:140mm}
  .offer ul{margin:0 0 2.5mm 4.5mm;font-size:9.5pt}
  .offer li{margin-bottom:0.6mm}
  .btn{display:inline-block;background:var(--blue);color:#fff;text-decoration:none;
       font-weight:700;font-size:9.5pt;padding:2.8mm 6mm;border-radius:4px}
  .btn--ghost{background:transparent;color:var(--ink);border:1.5px solid var(--ink)}
  .cta-foot{margin-top:4mm;border-top:1px solid var(--mist);padding-top:3mm;
            font-size:8.5pt;color:var(--slate)}
  .cta-foot a{color:var(--blue)}
</style></head><body>

<div class="cover">
  <div class="wordmark">Triaperformance</div>
  <div class="cover-body">
    <span class="kicker">${INTRO.kicker}</span>
    <h1>${INTRO.title}</h1>
    <div class="sub">${INTRO.sub}</div>
    <div class="zonestrip">
      ${["1", "2", "X", "3", "Y", "4", "5"].map((z) => `<div${z === "X" || z === "Y" ? ' class="hl"' : ""}>${z}</div>`).join("")}
    </div>
    <div class="lede">${INTRO.lede}</div>
  </div>
  <div class="foot">Iván Koch · triaperformance.com</div>
</div>

<div class="intro">
  <h2 class="sec">Cómo leer los números</h2>
  ${INTRO.body.map(([h, p]) => `<div class="row"><h4>${h}</h4><p>${p}</p></div>`).join("")}
  <div class="callout" style="margin-top:4mm">
    <div class="callout-t">¿Todavía no tenés tus zonas?</div>
    <p>La calculadora te las da gratis a partir de tu test, en los tres deportes:
       <strong>triaperformance.com/calculadora-de-zonas</strong></p>
  </div>
</div>

${SPORTS.map(sportSection).join("")}

<div class="brick">
  <span class="eyebrow">Bonus</span>
  <h2 class="sec">${BRICK.title}</h2>
  <p>${BRICK.body}</p>
  <div class="punch">${BRICK.punch}</div>

  <div class="who">
    <h2 class="sec">Quiénes somos</h2>
    <p>Triaperformance es el proyecto de coaching de <strong>Iván Koch</strong>: entrenamiento de triatlón y running
       construido sobre datos, no sobre plantillas. Un solo servicio, la misma metodología para todos —
       la que acabás de leer— y una revisión semanal de lo que hiciste y de lo que viene.</p>
    <p>Trabajamos en remoto con atletas en toda América y Europa, desde el primer 10k hasta Ironman.</p>
    <div class="stats">
      <div class="stat"><div class="v">45</div><div class="k">reseñas · todas 5 estrellas</div></div>
      <div class="stat"><div class="v">328</div><div class="k">planes publicados</div></div>
      <div class="stat"><div class="v">3</div><div class="k">idiomas</div></div>
    </div>
    <div class="quotes">
      ${QUOTES.map(([q, n, c]) => `<div class="quote"><p>“${q}”</p><div class="who-q">${n} · ${c}</div></div>`).join("")}
    </div>
  </div>
</div>

<div class="cta">
  <span class="eyebrow">El siguiente paso</span>
  <h2>Ya sabés qué sesión hace crecer cada zona.<br>Ahora hay que ordenarlas en una semana.</h2>
  <p class="lead">Estas sesiones funcionan cuando están secuenciadas: dos de calidad por semana, el resto suave,
     y una progresión que cambia según en qué mes de tu preparación estés. Tres formas de que eso pase.</p>

  <div class="offer offer--primary">
    <div class="offer-top">
      <div><div class="tag">Recomendado</div><h3>Membresía All-Access</h3></div>
      <div class="price">US$ ${PRICES.allAccess}<span style="font-size:9pt;font-weight:400;color:var(--slate)">/mes</span></div>
    </div>
    <p>Todos los planes de entrenamiento del catálogo, con estas zonas y estas sesiones ya secuenciadas
       semana a semana. Cambiás de plan las veces que quieras.</p>
    <ul>
      <li>Los 328 planes: running, ciclismo, triatlón, HYROX</li>
      <li>TrainingPeaks Premium incluido</li>
      <li>Todas las guías y la biblioteca de herramientas</li>
      <li>Sin permanencia — cancelás cuando quieras</li>
    </ul>
    <a class="btn" href="${LINKS.allAccess}">Empezar con All-Access</a>
  </div>

  <div class="offer">
    <div class="offer-top">
      <div><div class="tag">Si querés que lo decidamos nosotros</div><h3>Coaching 1:1</h3></div>
      <div class="price">US$ ${PRICES.coaching}<span style="font-size:9pt;font-weight:400;color:var(--slate)">/mes</span></div>
    </div>
    <p>Un plan escrito para vos y revisado todas las semanas. Ajustes cuando la vida se mete en el medio,
       análisis de tus sesiones y WhatsApp directo. Es el servicio que describen las 45 reseñas.</p>
    <a class="btn btn--ghost" href="${LINKS.coaching}">Ver cómo funciona</a>
  </div>

  <div class="offer">
    <div class="offer-top">
      <div><div class="tag">Una carrera puntual</div><h3>Plan de entrenamiento suelto</h3></div>
      <div class="price">desde US$ 19,99</div>
    </div>
    <p>Un objetivo, un plan, pago único. Elegí por distancia, semanas y nivel.</p>
    <a class="btn btn--ghost" href="${LINKS.plans}">Ver los planes</a>
  </div>

  <div class="cta-foot">
    ¿Dudas sobre cuál te sirve? Escribinos a <a href="mailto:coach@triaperformance.com">coach@triaperformance.com</a>
    y te decimos con honestidad cuál corresponde — incluso si es ninguno.
  </div>
</div>

</body></html>`;

/* ----------------------------------------------------------------- build */

(async () => {
  let chromium;
  try { ({ chromium } = require("playwright")); }
  catch (e) { console.error("playwright missing — npm i -D playwright && npx playwright install chromium"); process.exit(2); }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(HTML, { waitUntil: "networkidle" });
  await page.pdf({
    path: OUT,
    format: "A4",
    printBackground: true,
    margin: { top: "16mm", right: "15mm", bottom: "18mm", left: "15mm" },
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate:
      `<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:7pt;color:#565a52;
        padding:0 15mm;display:flex;justify-content:space-between;">
        <span>Triaperformance · Las sesiones que hacen crecer cada zona</span>
        <span class="pageNumber"></span></div>`,
  });
  await browser.close();
  console.log("PDF written:", OUT);
})();
