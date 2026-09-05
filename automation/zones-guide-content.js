/**
 * zones-guide-content.js — every word of "Los dos umbrales y el problema de la
 * Zona 2" (zonas-de-entrenamiento.pdf), keyed by language.
 *
 * Home doc: lead-magnet-zonas-de-entrenamiento.md
 * Builder:  automation/build-zones-guide-pdf.js  (template only — no copy here
 *           belongs in that file, and no percentage belongs in this one).
 *
 * ⚠️ NO ZONE PERCENTAGE GOES IN THIS FILE. data/zones.csv owns every band and
 * the builder reads it at render time. That rule is the whole reason this
 * rebuild happened: the 2024 HubSpot-era version of this PDF was a fifth
 * hand-typed copy of the zone model and it had drifted.
 *
 * Prices are copies of triaperformance-pricing-and-positioning.md.
 * The CTA block is deliberately identical in shape to the sessions guide.
 */

const es = {
  filename: "zonas-de-entrenamiento.pdf",
  footerTitle: "Los dos umbrales y el problema de la “Zona 2”",

  prices: { allAccess: "39.99", coaching: "149" },

  links: {
    allAccess: "https://checkout.trainingpeaks.com/product/188df02f-d71f-4b5b-8d43-abd4edb446f3",
    coaching: "https://triaperformance.com/#coaching",
    plans: "https://triaperformance.com/planes/running/",
    calculator: "https://triaperformance.com/calculadora-de-zonas/",
    sessions: "https://triaperformance.com/assets/guias/sesiones-por-zona.pdf",
  },

  labels: {
    nextStep: "El siguiente paso",
    whoWeAre: "Quiénes somos",
    figure: "Figura",
  },

  cover: {
    kicker: "Guía Triaperformance",
    title: "Los dos umbrales<br>y el problema de la “Zona 2”",
    sub: "Cómo se relacionan la fisiología del lactato, los sistemas de zonas y las intensidades que entrenas.",
    lede:
      "“Umbral” son dos puntos, no uno. Y “Zona 2” no significa lo mismo en el modelo de 3 zonas que en el de 5 o el de 7. Esta guía pone la fisiología y los sistemas sobre un mismo eje — el porcentaje de tu umbral — y muestra dónde encaja cada cosa.",
  },

  /* ------------------------------------------------ page 2 · the thresholds */
  thresholds: {
    eyebrow: "Punto de partida",
    title: "No hay un umbral. Hay dos.",
    lede:
      "En la medida en que aumenta la intensidad — medida en frecuencia cardíaca, potencia o velocidad — aumenta el lactato en sangre. Ese aumento no es lineal: tiene <strong>dos puntos de inflexión</strong>, y a esos dos puntos los llamamos umbrales.",
    rows: [
      [
        "LT1 · Umbral aeróbico",
        "El primer punto de inflexión. Por debajo de LT1 el lactato se mantiene cerca de tu línea de base: producción y eliminación van al mismo ritmo y no se acumula nada. Es el esfuerzo que se sostiene durante horas.",
      ],
      [
        "Entre LT1 y LT2",
        "El lactato ya sube de forma clara: la eliminación no alcanza a igualar la producción y empieza a acumularse, pero lo hace despacio y el esfuerzo se sostiene bastante tiempo. En esta franja viven el ritmo de maratón y el de larga distancia.",
      ],
      [
        "LT2 · Umbral anaeróbico",
        "El segundo punto de inflexión. Por encima de LT2 la acumulación se vuelve exponencial: el lactato sube rápido, la fatiga aparece pronto y el tiempo que puedes sostener el esfuerzo se mide en minutos.",
      ],
      [
        "Entrenar mueve la curva",
        "Un atleta entrenado no tiene otra curva: tiene <strong>la misma curva desplazada a la derecha</strong>. Sostiene más velocidad o más vatios antes de llegar a cada umbral. Buena parte del entrenamiento de resistencia es exactamente eso.",
      ],
    ],
    anchor: {
      title: "Del laboratorio al campo",
      body:
        "Para medir LT1 y LT2 de forma exacta, la prueba se hace en laboratorio. Como eso es impráctico, usamos protocolos de campo que estiman el <strong>umbral anaeróbico (LT2)</strong> — tu FTP, tu ritmo de umbral, tu LTHR — y calculan las zonas a partir de ahí. Cuando decimos <em>umbral</em> a secas hablamos de LT2, y ese número es el <strong>100%</strong>.",
    },
  },

  /* --------------------------------------------------- page 3 · the stack */
  stack: {
    eyebrow: "El mapa",
    title: "Múltiples sistemas, una fisiología",
    lede:
      "Existen múltiples sistemas para determinar zonas de entrenamiento y prescribir intensidad, y eso es lo que confunde a muchos de mis atletas. La fisiología es una; los sistemas de zonas se superponen sobre ella.",
    notes: [
      [
        "Dónde caen los dos umbrales",
        "LT2 está en el 100%: es el número que estimas en el test y sobre el que se calcula todo lo demás. LT1 cae alrededor del <strong>90%</strong>, con un rango real del 85% al 95% según el atleta, su historia y su deporte — por eso está dibujado como una franja y no como una línea.",
      ],
      [
        "Tres zonas describen, siete prescriben",
        "El modelo de 3 zonas corta donde la fisiología cambia de régimen, y sirve para hablar del <em>reparto</em> de una temporada. Las siete sirven para escribir la sesión del martes. Uno es el mapa, el otro es la ruta.",
      ],
      [
        "De dónde salen la Zona X y la Zona Y",
        "Del sistema de 7 zonas de <em>80/20 Running</em>, de Matt Fitzgerald. A las cinco habituales les agrega dos franjas de transición: la <strong>X</strong>, en la mitad alta de la Zona 2, y la <strong>Y</strong>, justo alrededor del umbral. Separarlas permite prescribirlas — o dejarlas fuera — a propósito. Página 7.",
      ],
    ],
    foot:
      "El RPE y los tiempos sostenibles son órdenes de magnitud para un atleta entrenado: varían con el deporte, el calor, el sueño y la semana del bloque. Las bandas de zona son las mismas que usa la calculadora.",
  },

  /* ------------------------------------------------ page 4 · the zone 2 problem */
  problem: {
    eyebrow: "Los nombres",
    title: "“Zona 2” no significa lo mismo en cada sistema",
    lede:
      "Es la superposición que más preguntas genera. Los dos usos son correctos dentro de su propio modelo, y casi nunca se aclara cuál se está usando.",
    quotes: [
      [
        "En el modelo de 3 zonas",
        "La Zona 2 es toda la franja <strong>entre LT1 y LT2</strong>: la intensidad moderada. Ahí viven el ritmo de maratón, el de medio Ironman y el trabajo de tempo.",
      ],
      [
        "En el modelo de 5 y 7 zonas",
        "La Zona 2 está entera <strong>por debajo de LT1</strong>: es el rodaje suave, el que sostienes durante horas, donde vive el 80% de tu volumen.",
      ],
    ],
    resolution: {
      title: "La traducción",
      body:
        "La Zona 2 del modelo de 3 zonas equivale a <strong>la Zona X más la Zona 3</strong> del modelo de siete. La Zona 2 del modelo de siete está por debajo de las dos, y no participa de esa conversación.",
    },
    rule: {
      title: "Cómo saber de cuál te están hablando",
      body:
        "Si el sistema tiene tres zonas, su Zona 2 es la franja entre umbrales. Si tiene cinco o siete — tu reloj, tu plan, la calculadora —, su Zona 2 es el rodaje suave.",
    },
  },

  /* ------------------------------------------------------- page 5 · tests */
  tests: {
    eyebrow: "Cómo se mide",
    title: "Encuentra tu umbral",
    lede:
      "Todo lo anterior necesita un número real. Estos son los protocolos que usamos, con la aritmética exacta de cada uno. Ninguno requiere laboratorio.",
    cols: ["Deporte", "Protocolo", "Cómo se calcula"],
    rows: [
      ["Running", "30' a máximo sostenible", "Ritmo de umbral = promedio de los 30'.<br>LTHR = FC promedio de los últimos 20'."],
      ["Ciclismo · potenciómetro", "1 × 20' en subida larga", "FTP = 95% de la potencia promedio."],
      ["Ciclismo · subida corta", "2 × 8'", "FTP = 90% del promedio de ambos bloques."],
      ["Ciclismo · indoor", "Test de rampa", "El más simple para empezar. Sobreestima un poco."],
      ["Ciclismo · sin potenciómetro", "30' a máximo sostenible", "LTHR = FC promedio de los últimos 20'."],
      ["Natación", "400 m + 200 m", "CSS (velocidad crítica) por calculadora."],
    ],
    hygiene: {
      title: "Las reglas que deciden si el test sirve",
      body:
        "Temprano, fresco, descansado, comido e hidratado. Circuito llano y sin interrupciones — un semáforo invalida el test. Banda pectoral obligatoria. Y <strong>“máximo sostenible” no es “máximo”</strong>: el esfuerzo tiene que llegar entero al final.",
    },
    calc: {
      title: "Ya tienes tu número. ¿Y las zonas?",
      body:
        "La calculadora las arma gratis en los tres deportes, con las siete zonas y las tres métricas: <strong>triaperformance.com/calculadora-de-zonas</strong>",
    },
  },

  /* -------------------------------------------------- page 6 · RPE and TTE */
  rpe: {
    eyebrow: "Las dos métricas sin batería",
    title: "RPE y tiempo sostenible",
    rpe: {
      title: "RPE — el esfuerzo percibido",
      body:
        "El RPE (escala 1 a 10) <strong>integra lo que ningún dispositivo mide</strong>: cuánto dormiste, cuánto estrés traes, qué comiste, cuánto calor hace. Sigue de cerca a tu intensidad relativa, con la salvedad de que la relación se corre con la duración, el calor y el estado de tus depósitos.",
      use:
        "<strong>Uso práctico.</strong> Una sesión de umbral se siente alrededor de <strong>RPE 8</strong>. Si un día tus vatios de siempre se sienten 10, el 10 es el dato válido: baja la intensidad y mantén el objetivo fisiológico, no el número prescrito. Es la corrección que los atletas aprenden a hacer solos, en el momento.",
      test:
        "<strong>En los tests</strong> prescribimos esfuerzo y no ritmo, para que el resultado sea el del día y no el del test anterior.",
    },
    tte: {
      title: "TTE — tiempo hasta el agotamiento",
      body:
        "El TTE es cuánto puedes sostener tu umbral <em>hoy</em>. Dos atletas con el mismo FTP no son el mismo atleta: uno lo sostiene 25 minutos y el otro 55. En atletas entrenados suele caer entre <strong>30 y 70 minutos</strong>.",
      why:
        "Esto es lo que explica para qué existe la Zona 4. El objetivo del trabajo de umbral no es solamente subir el número — es <strong>estirar cuánto tiempo lo aguantas</strong>. Por eso una sesión de umbral se prescribe como tiempo acumulado en zona, y por eso ese tiempo crece poco a poco a lo largo del bloque.",
    },
  },

  /* the talk test — one canonical RPE mapping, so the guide never gives two */
  talk: {
    title: "Cómo se siente cada RPE",
    lede:
      "La forma más barata de calibrar el RPE es la prueba del habla. No necesita batería y funciona en los tres deportes.",
    cols: ["RPE", "Cómo se siente", "Zona"],
    rows: [
      ["1–2", "Sostienes una conversación entera sin notarlo.", "1"],
      ["3–4", "Hablas en frases largas. Podrías seguir horas.", "2"],
      ["5", "Todavía hablas, pero ya eliges cuándo.", "X"],
      ["6–7", "Frases cortas. Cómodamente incómodo.", "3"],
      ["8", "Tres o cuatro palabras. Sostenible, pero cuentas los minutos.", "4"],
      ["9–10", "Ni una palabra.", "5"],
    ],
  },

  /* ---------------------------------------------- page 7 · what we do with it */
  practice: {
    eyebrow: "Nuestra metodología",
    title: "Cómo lo usamos",
    lede:
      "La fisiología de las páginas anteriores vale para cualquier atleta. Cómo se reparte el volumen entre esas zonas ya es una decisión de entrenamiento.",
    rows: [
      [
        "El reparto",
        "Alrededor del <strong>80% del volumen suave y el 20% duro</strong>. El reparto exacto que escribimos es <strong>80/15/5</strong> o <strong>70/25/5</strong> según lo que pida la carrera, y se vuelve piramidal a medida que la carrera se acerca: el trabajo se corre hacia el ritmo de competencia y la Zona 5 se reserva.",
      ],
      [
        "La franja intermedia se prescribe, no se improvisa",
        "Entre LT1 y LT2 hay entrenamiento de mucho valor: es el ritmo de maratón, de medio Ironman y de Ironman, y es donde vive el trabajo de tempo. Bien dosificada, es una de las sesiones clave de la semana. Lo que cuesta caro es llegar ahí sin haberlo planificado — sales a rodar suave, te sientes bien, el ritmo se acomoda solo, y terminas la semana con la fatiga de una sesión de calidad que no estaba en el plan.",
      ],
      [
        "Zona X — el ritmo de maratón",
        "Es la mitad alta de la Zona 2. En un bloque de maratón o de larga distancia es contenido central y se entrena a propósito. Fuera de esos bloques la dejamos afuera: acumula bastante más fatiga que la Zona 2 baja y devuelve un estímulo aeróbico parecido.",
      ],
      [
        "Zona Y — la franja del umbral",
        "Es la banda que rodea al umbral, entre el 100 y el 102%. Se entrena cuando es exactamente tu ritmo de competencia. Para buscar adaptaciones de umbral prescribimos desde el 102% hacia arriba: el umbral se mueve con la forma, el descanso y el calor, y entrenar justo sobre la línea deja la sesión corta los días en que ese número está más alto.",
      ],
    ],
    bridge: {
      title: "Y ahora, qué sesión hace crecer cada zona",
      body:
        "Esta guía es el mapa; la que sigue es la ruta. <strong>“Las sesiones que hacen crecer cada zona”</strong> tiene, para los tres deportes, qué sesión construye cada una de las siete y qué no hacer en cada una. Pídela en la calculadora.",
    },
  },

  /* ------------------------------------------------------------ page 8 · CTA */
  who: {
    body: [
      "Triaperformance es el proyecto de coaching de <strong>Iván Koch</strong>: triatlón y running construidos sobre datos, no sobre plantillas. Un solo servicio, la misma metodología para todos — la que acabas de leer — y atletas en toda América y Europa, del primer 10k al Ironman.",
    ],
    stats: [
      ["46", "reseñas · todas 5 estrellas"],
      ["328", "planes publicados"],
      ["3", "idiomas"],
    ],
  },

  quotes: [
    ["Todos los lunes me escribe para saber cómo viene mi semana, me da feedback.", "Sergio Toro", "Chile"],
    ["Me llevó de cero experiencia en triatlón a mi objetivo de hacer un Ironman 70.3.", "Humberto Rodríguez", "México"],
  ],

  cta: {
    headline: "El mapa está.<br>Falta la ruta.",
    lead:
      "Conocer tus umbrales es el punto de partida. Lo que cambia el resultado es una semana bien repartida, sostenida durante meses, que se ajusta cuando la vida se mete en el medio. Tres formas de que eso pase.",
    perMonth: "/mes",
    allAccess: {
      tag: "Recomendado",
      name: "Membresía All-Access",
      body:
        "Todos los planes del catálogo, con estas zonas y estas sesiones ya secuenciadas semana a semana. Cambias de plan las veces que quieras.",
      bullets: [
        "Los 328 planes: running, ciclismo, triatlón, HYROX",
        "TrainingPeaks Premium incluido",
        "Todas las guías y la biblioteca de herramientas",
        "Sin permanencia — cancelas cuando quieras",
      ],
      button: "Empezar con All-Access",
    },
    coaching: {
      tag: "Si quieres que lo decidamos nosotros",
      name: "Coaching 1:1",
      body:
        "Un plan escrito para ti y revisado todas las semanas. Te testeamos, te calculamos las zonas, y ajustamos cuando hace falta. Es el servicio que describen las reseñas.",
      button: "Ver cómo funciona",
    },
    plans: {
      tag: "Una carrera puntual",
      name: "Plan de entrenamiento suelto",
      price: "desde US$ 19.99",
      body: "Un objetivo, un plan, pago único. Elige por distancia, semanas y nivel.",
      button: "Ver los planes",
    },
    foot:
      "¿Dudas sobre cuál te sirve? Escríbenos a <a href=\"mailto:coach@triaperformance.com\">coach@triaperformance.com</a> y te decimos con honestidad cuál corresponde — incluso si es ninguno.",
  },

  /* --------------------------------------------------------- figure labels */
  fig: {
    curve: {
      caption: "La curva de lactato y sus dos umbrales.",
      x: "Intensidad  ·  velocidad o potencia",
      y: "Lactato en sangre",
      lt1: "LT1",
      lt2: "LT2",
      base: "línea de base",
    },
    stack: {
      caption: "Los sistemas sobre un mismo eje: el porcentaje de tu umbral.",
      axis: "% de tu umbral  (FTP · ritmo de umbral · LTHR)",
      rows: {
        three: "3 zonas<br><span>fisiológico</span>",
        seven: "7 zonas<br><span>80/20 Running</span>",
        rpe: "RPE<br><span>1–10</span>",
        tte: "Tiempo<br><span>sostenible</span>",
        session: "Sesión<br><span>típica</span>",
      },
      three: ["Zona 1", "Zona 2", "Zona 3"],
      /* Segments are declared as LISTS OF ZONE IDS, never as percentages — the
         builder resolves each list's floor and ceiling from data/zones.csv, so
         if a band moves there it moves here in the same build. Merged pairs
         (e.g. Y+4) exist because Zone Y is 2 percentage points wide and no
         label fits inside it at A4. */
      rpeSegs: [
        [["1"], "1–2"], [["2"], "3–4"], [["X"], "5"],
        [["3"], "6–7"], [["Y", "4"], "8"], [["5"], "9–10"],
      ],
      tteSegs: [
        [["1", "2"], "todo el día"], [["X"], "~2,5 h"], [["3"], "~1 h"],
        [["Y", "4"], "20–60′"], [["5"], "3–8′"],
      ],
      sessionSegs: [
        [["1"], "Recuperación"], [["2"], "Rodaje suave"], [["X"], "Maratón"],
        [["3"], "Tempo"], [["Y", "4"], "Umbral"], [["5"], "VO2máx"],
      ],
    },
    overlap: {
      caption: "La misma etiqueta, dos franjas distintas.",
      ours: "Zona 2<span>modelo de 5 y 7</span>",
      seiler: "Zona 2<span>modelo de 3</span>",
      oursNote: "Rodaje suave",
      seilerNote: "Zona X + Zona 3",
      note: "Una empieza justo donde la otra termina.",
    },
  },
};
/* ============================================================== ENGLISH === */

const en = {
  filename: "training-zones.pdf",
  footerTitle: "The two thresholds and the “Zone 2” problem",

  prices: { allAccess: "39.99", coaching: "149" },

  links: {
    allAccess: "https://checkout.trainingpeaks.com/product/7127a1e4-f736-45b7-b98d-1bbe468d950a",
    coaching: "https://triaperformance.com/en/#coaching",
    plans: "https://triaperformance.com/en/plans/",
    calculator: "https://triaperformance.com/en/training-zones-calculator/",
    sessions: "https://triaperformance.com/assets/guias/training-zone-sessions.pdf",
  },

  labels: { nextStep: "The next step", whoWeAre: "Who we are", figure: "Figure" },

  cover: {
    kicker: "Triaperformance Guide",
    title: "The two thresholds<br>and the “Zone 2” problem",
    sub: "How lactate physiology, zone systems and the intensities you train relate to one another.",
    lede:
      "“Threshold” is two points, not one. And “Zone 2” does not mean the same thing in the 3-zone model as it does in the 5- or 7-zone one. This guide puts the physiology and the systems on a single axis — the percentage of your threshold — and shows where each piece fits.",
  },

  thresholds: {
    eyebrow: "Starting point",
    title: "There isn’t one threshold. There are two.",
    lede:
      "As intensity rises — measured in heart rate, power or speed — blood lactate rises with it. That rise is not linear: it has <strong>two inflection points</strong>, and those two points are what we call thresholds.",
    rows: [
      [
        "LT1 · Aerobic threshold",
        "The first inflection point. Below LT1, lactate stays close to your baseline: production and clearance run at the same rate and nothing accumulates. This is the effort you can hold for hours.",
      ],
      [
        "Between LT1 and LT2",
        "Lactate is now clearly rising: clearance no longer keeps up with production, so it starts to accumulate. But it does so slowly, and the effort holds for a good while. This band is where marathon pace and long-course race pace live.",
      ],
      [
        "LT2 · Anaerobic threshold",
        "The second inflection point. Above LT2 the accumulation turns exponential: lactate climbs fast, fatigue arrives early, and the time you can hold the effort is measured in minutes.",
      ],
      [
        "Training moves the curve",
        "A trained athlete does not have a different curve — they have <strong>the same curve shifted to the right</strong>. They hold more speed or more watts before reaching each threshold. A large part of endurance training is exactly that.",
      ],
    ],
    anchor: {
      title: "From the lab to the field",
      body:
        "Measuring LT1 and LT2 exactly requires a lab test. Since that is impractical, we use field protocols that estimate the <strong>anaerobic threshold (LT2)</strong> — your FTP, your threshold pace, your LTHR — and calculate the zones from there. When we say <em>threshold</em> on its own we mean LT2, and that number is <strong>100%</strong>.",
    },
  },

  stack: {
    eyebrow: "The map",
    title: "Many systems, one physiology",
    lede:
      "There are many systems for setting training zones and prescribing intensity, and that is what confuses a lot of my athletes. The physiology is one thing; the zone systems are laid over it.",
    notes: [
      [
        "Where the two thresholds fall",
        "LT2 sits at 100%: it is the number you estimate in the test, and everything else is calculated from it. LT1 falls around <strong>90%</strong>, with a real range of 85% to 95% depending on the athlete, their history and their sport — which is why it is drawn as a band rather than a line.",
      ],
      [
        "Three zones describe, seven prescribe",
        "The 3-zone model cuts where the physiology changes regime, and it is what you use to talk about the <em>distribution</em> of a season. Seven zones are what you use to write Tuesday’s session. One is the map, the other is the route.",
      ],
      [
        "Where Zone X and Zone Y come from",
        "From the seven-zone system in <em>80/20 Running</em>, by Matt Fitzgerald. It adds two transition bands to the usual five: <strong>X</strong>, in the upper half of Zone 2, and <strong>Y</strong>, right around threshold. Separating them is what makes it possible to prescribe either one — or leave it out — on purpose. Page 7.",
      ],
    ],
    foot:
      "RPE and sustainable times are orders of magnitude for a trained athlete: they vary with the sport, the heat, your sleep and the week of the block. The zone bands are the same ones the calculator uses.",
  },

  problem: {
    eyebrow: "The names",
    title: "“Zone 2” doesn’t mean the same thing in every system",
    lede:
      "It is the overlap that generates the most questions. Both uses are correct inside their own model, and it is almost never stated which one is being used.",
    quotes: [
      [
        "In the 3-zone model",
        "Zone 2 is the whole band <strong>between LT1 and LT2</strong>: moderate intensity. Marathon pace, half-Ironman pace and tempo work all live there.",
      ],
      [
        "In the 5- and 7-zone models",
        "Zone 2 sits entirely <strong>below LT1</strong>: it is the easy run, the one you hold for hours, where 80% of your volume lives.",
      ],
    ],
    resolution: {
      title: "The translation",
      body:
        "Zone 2 in the 3-zone model is the same thing as <strong>Zone X plus Zone 3</strong> in the seven-zone one. Zone 2 in the seven-zone model sits below both, and takes no part in that conversation.",
    },
    rule: {
      title: "How to tell which one you are being given",
      body:
        "If the system has three zones, its Zone 2 is the band between thresholds. If it has five or seven — your watch, your plan, the calculator — its Zone 2 is the easy run.",
    },
  },

  tests: {
    eyebrow: "How it is measured",
    title: "Find your threshold",
    lede:
      "Everything above needs a real number. These are the protocols we use, with the exact arithmetic for each one. None of them requires a lab.",
    cols: ["Sport", "Protocol", "How it is calculated"],
    rows: [
      ["Running", "30' at maximum sustainable effort", "Threshold pace = the 30' average.<br>LTHR = average HR of the last 20'."],
      ["Cycling · power meter", "1 × 20' on a long climb", "FTP = 95% of average power."],
      ["Cycling · short climb", "2 × 8'", "FTP = 90% of the average of both blocks."],
      ["Cycling · indoor", "Ramp test", "Simplest place to start. Overestimates slightly."],
      ["Cycling · no power meter", "30' at maximum sustainable effort", "LTHR = average HR of the last 20'."],
      ["Swimming", "400 m + 200 m", "CSS (critical swim speed) via calculator."],
    ],
    hygiene: {
      title: "The rules that decide whether the test is worth anything",
      body:
        "Early, cool, rested, fed and hydrated. Flat, uninterrupted route — one traffic light invalidates the test. Chest strap required. And <strong>“maximum sustainable” is not “maximum”</strong>: the effort has to reach the end intact.",
    },
    calc: {
      title: "You have your number. What about the zones?",
      body:
        "The calculator builds them free, for all three sports, with all seven zones and all three metrics: <strong>triaperformance.com/en/training-zones-calculator</strong>",
    },
  },

  rpe: {
    eyebrow: "The two metrics that need no battery",
    title: "RPE and sustainable time",
    rpe: {
      title: "RPE — perceived effort",
      body:
        "RPE (a 1 to 10 scale) <strong>integrates what no device measures</strong>: how much you slept, how much stress you are carrying, what you ate, how hot it is. It tracks your relative intensity closely, with the caveat that the relationship shifts with duration, heat and the state of your glycogen stores.",
      use:
        "<strong>In practice.</strong> A threshold session should feel around <strong>RPE 8</strong>. If one day your usual watts feel like a 10, the 10 is the valid data point: bring the intensity down and hold the physiological target, not the prescribed number. It is the correction our athletes learn to make on their own, in the moment.",
      test:
        "<strong>In tests</strong> we prescribe effort rather than pace, so the result is today’s and not the previous test’s.",
    },
    tte: {
      title: "TTE — time to exhaustion",
      body:
        "TTE is how long you can hold your threshold <em>today</em>. Two athletes with the same FTP are not the same athlete: one holds it for 25 minutes, the other for 55. In trained athletes it usually falls between <strong>30 and 70 minutes</strong>.",
      why:
        "This is what explains why Zone 4 exists. The goal of threshold work is not only to raise the number — it is to <strong>stretch how long you can hold it</strong>. That is why a threshold session is prescribed as accumulated time in zone, and why that time grows gradually across the block.",
    },
  },

  talk: {
    title: "What each RPE feels like",
    lede:
      "The cheapest way to calibrate RPE is the talk test. It needs no battery and it works in all three sports.",
    cols: ["RPE", "What it feels like", "Zone"],
    rows: [
      ["1–2", "You hold a whole conversation without noticing.", "1"],
      ["3–4", "You speak in long sentences. You could go for hours.", "2"],
      ["5", "You still talk, but you pick your moments.", "X"],
      ["6–7", "Short sentences. Comfortably uncomfortable.", "3"],
      ["8", "Three or four words. Sustainable, but you are counting the minutes.", "4"],
      ["9–10", "Not a word.", "5"],
    ],
  },

  practice: {
    eyebrow: "Our methodology",
    title: "How we use it",
    lede:
      "The physiology in the previous pages holds for any athlete. How the volume gets distributed across those zones is a training decision.",
    rows: [
      [
        "The distribution",
        "Around <strong>80% of the volume easy and 20% hard</strong>. The exact split we write is <strong>80/15/5</strong> or <strong>70/25/5</strong> depending on what the race demands, and it turns pyramidal as the race approaches: the work shifts toward race pace and Zone 5 is held back.",
      ],
      [
        "The middle band is prescribed, not improvised",
        "There is high-value training between LT1 and LT2: it is marathon pace, half-Ironman and Ironman pace, and it is where tempo work lives. Dosed well, it is one of the key sessions of the week. What costs you is arriving there without having planned it — you head out for an easy run, you feel good, the pace settles by itself, and you finish the week with the fatigue of a quality session that was never in the plan.",
      ],
      [
        "Zone X — marathon pace",
        "The upper half of Zone 2. In a marathon or long-course block it is central content and it is trained on purpose. Outside those blocks we leave it out: it accumulates considerably more fatigue than low Zone 2 and returns a similar aerobic stimulus.",
      ],
      [
        "Zone Y — the band around threshold",
        "The band surrounding threshold, between 100 and 102%. It is trained when it is exactly your race pace. To chase threshold adaptations we prescribe from 102% upward: threshold moves with fitness, rest and heat, and training right on the line leaves the session short on the days that number sits higher.",
      ],
    ],
    bridge: {
      title: "And now, which session grows each zone",
      body:
        "This guide is the map; the next one is the route. <strong>“The sessions that grow each zone”</strong> covers, for all three sports, which session builds each of the seven and what not to do in each. Request it from the calculator.",
    },
  },

  who: {
    body: [
      "Triaperformance is <strong>Iván Koch’s</strong> coaching practice: triathlon and running training built on data, not on templates. One service, the same methodology for everyone — the one you have just read — and athletes across the Americas and Europe, from a first 10k to Ironman.",
    ],
    stats: [["46", "reviews · all 5 stars"], ["328", "published plans"], ["3", "languages"]],
  },

  quotes: [
    ["He provides insight into my Training Peaks data, helping me understand what the numbers mean.", "Sylmarie Arizmendi", "Puerto Rico"],
    ["Always on top of my training and available to make any adjustments I needed.", "Giles Carmichael", "United Kingdom"],
  ],

  cta: {
    headline: "The map is there.<br>The route is what’s missing.",
    lead:
      "Knowing where your thresholds are is the starting point. What changes the outcome is a well-distributed week, held for months, that adjusts when life gets in the way. Three ways to make that happen.",
    perMonth: "/month",
    allAccess: {
      tag: "Recommended",
      name: "All-Access Membership",
      body:
        "Every training plan in the catalogue, with these zones and these sessions already sequenced week by week. Switch plans as often as you like.",
      bullets: [
        "All 328 plans: running, cycling, triathlon, HYROX",
        "TrainingPeaks Premium included",
        "Every guide and the full tools library",
        "No lock-in — cancel whenever you want",
      ],
      button: "Start with All-Access",
    },
    coaching: {
      tag: "If you’d rather we decided",
      name: "1:1 Coaching",
      body:
        "A plan written for you and reviewed every week. We test you, calculate your zones, and adjust when it’s needed. It’s the service the reviews describe.",
      button: "See how it works",
    },
    plans: {
      tag: "One specific race",
      name: "Single training plan",
      price: "from US$ 19.99",
      body: "One goal, one plan, one payment. Choose by distance, weeks and level.",
      button: "Browse the plans",
    },
    foot:
      "Not sure which one fits? Email us at <a href=\"mailto:coach@triaperformance.com\">coach@triaperformance.com</a> and we’ll tell you honestly which one applies — including if it’s none of them.",
  },

  fig: {
    curve: {
      caption: "The lactate curve and its two thresholds.",
      x: "Intensity  ·  speed or power",
      y: "Blood lactate",
      lt1: "LT1",
      lt2: "LT2",
      base: "baseline",
    },
    stack: {
      caption: "The systems on a single axis: the percentage of your threshold.",
      axis: "% of your threshold  (FTP · threshold pace · LTHR)",
      rows: {
        three: "3 zones<br><span>physiological</span>",
        seven: "7 zones<br><span>80/20 Running</span>",
        rpe: "RPE<br><span>1–10</span>",
        tte: "Sustainable<br><span>time</span>",
        session: "Typical<br><span>session</span>",
      },
      three: ["Zone 1", "Zone 2", "Zone 3"],
      rpeSegs: [
        [["1"], "1–2"], [["2"], "3–4"], [["X"], "5"],
        [["3"], "6–7"], [["Y", "4"], "8"], [["5"], "9–10"],
      ],
      tteSegs: [
        [["1", "2"], "all day"], [["X"], "~2.5 h"], [["3"], "~1 h"],
        [["Y", "4"], "20–60′"], [["5"], "3–8′"],
      ],
      sessionSegs: [
        [["1"], "Recovery"], [["2"], "Easy"], [["X"], "Marathon"],
        [["3"], "Tempo"], [["Y", "4"], "Threshold"], [["5"], "VO2max"],
      ],
    },
    overlap: {
      ours: "Zone 2<span>5- and 7-zone</span>",
      seiler: "Zone 2<span>3-zone</span>",
      oursNote: "Easy running",
      seilerNote: "Zone X + Zone 3",
      note: "One begins exactly where the other ends.",
      caption: "The same label, two different bands.",
    },
  },
};

/* =========================================================== PORTUGUESE === */

const pt = {
  filename: "zonas-de-treino.pdf",
  footerTitle: "Os dois limiares e o problema da “Zona 2”",

  prices: { allAccess: "29,99", coaching: "149" },

  links: {
    allAccess: "https://checkout.trainingpeaks.com/product/938a0833-d337-4a9f-a33a-34199d662d4a",
    coaching: "https://triaperformance.com/pt/#coaching",
    plans: "https://triaperformance.com/pt/planos/",
    calculator: "https://triaperformance.com/pt/calculadora-de-zonas/",
    sessions: "https://triaperformance.com/assets/guias/sessoes-por-zona.pdf",
  },

  labels: { nextStep: "O próximo passo", whoWeAre: "Quem somos", figure: "Figura" },

  cover: {
    kicker: "Guia Triaperformance",
    title: "Os dois limiares<br>e o problema da “Zona 2”",
    sub: "Como se relacionam a fisiologia do lactato, os sistemas de zonas e as intensidades que você treina.",
    lede:
      "“Limiar” são dois pontos, não um. E “Zona 2” não significa a mesma coisa no modelo de 3 zonas e no de 5 ou 7. Este guia coloca a fisiologia e os sistemas sobre um mesmo eixo — a porcentagem do seu limiar — e mostra onde cada coisa se encaixa.",
  },

  thresholds: {
    eyebrow: "Ponto de partida",
    title: "Não existe um limiar. Existem dois.",
    lede:
      "À medida que a intensidade aumenta — medida em frequência cardíaca, potência ou velocidade — o lactato no sangue aumenta junto. Esse aumento não é linear: tem <strong>dois pontos de inflexão</strong>, e é a esses dois pontos que chamamos limiares.",
    rows: [
      [
        "LT1 · Limiar aeróbio",
        "O primeiro ponto de inflexão. Abaixo do LT1 o lactato se mantém perto da sua linha de base: produção e remoção acontecem no mesmo ritmo e nada se acumula. É o esforço que se sustenta por horas.",
      ],
      [
        "Entre o LT1 e o LT2",
        "O lactato já sobe de forma clara: a remoção não consegue igualar a produção e ele começa a se acumular. Mas isso acontece devagar, e o esforço se sustenta por bastante tempo. Nessa faixa vivem o ritmo de maratona e o de longa distância.",
      ],
      [
        "LT2 · Limiar anaeróbio",
        "O segundo ponto de inflexão. Acima do LT2 o acúmulo se torna exponencial: o lactato sobe rápido, a fadiga chega cedo e o tempo que você consegue sustentar o esforço é medido em minutos.",
      ],
      [
        "Treinar move a curva",
        "Um atleta treinado não tem outra curva: tem <strong>a mesma curva deslocada para a direita</strong>. Sustenta mais velocidade ou mais watts antes de chegar a cada limiar. Boa parte do treinamento de resistência é exatamente isso.",
      ],
    ],
    anchor: {
      title: "Do laboratório para o campo",
      body:
        "Para medir LT1 e LT2 com exatidão, o teste é feito em laboratório. Como isso é impraticável, usamos protocolos de campo que estimam o <strong>limiar anaeróbio (LT2)</strong> — o seu FTP, o seu ritmo de limiar, o seu LTHR — e calculam as zonas a partir daí. Quando dizemos <em>limiar</em> sozinho, estamos falando do LT2, e esse número é o <strong>100%</strong>.",
    },
  },

  stack: {
    eyebrow: "O mapa",
    title: "Vários sistemas, uma fisiologia",
    lede:
      "Existem vários sistemas para definir zonas de treino e prescrever intensidade, e é isso que confunde muitos dos meus atletas. A fisiologia é uma só; os sistemas de zonas se sobrepõem a ela.",
    notes: [
      [
        "Onde caem os dois limiares",
        "O LT2 está em 100%: é o número que você estima no teste e sobre o qual todo o resto é calculado. O LT1 cai em torno de <strong>90%</strong>, com uma faixa real de 85% a 95% conforme o atleta, o histórico e o esporte — por isso está desenhado como uma faixa e não como uma linha.",
      ],
      [
        "Três zonas descrevem, sete prescrevem",
        "O modelo de 3 zonas corta onde a fisiologia muda de regime, e serve para falar da <em>distribuição</em> de uma temporada. As sete servem para escrever a sessão de terça. Um é o mapa, o outro é a rota.",
      ],
      [
        "De onde vêm a Zona X e a Zona Y",
        "Do sistema de 7 zonas de <em>80/20 Running</em>, de Matt Fitzgerald. Às cinco habituais ele acrescenta duas faixas de transição: a <strong>X</strong>, na metade alta da Zona 2, e a <strong>Y</strong>, bem em torno do limiar. Separá-las é o que permite prescrevê-las — ou deixá-las de fora — de propósito. Página 7.",
      ],
    ],
    foot:
      "A PSE e os tempos sustentáveis são ordens de grandeza para um atleta treinado: variam com o esporte, o calor, o sono e a semana do bloco. As faixas de zona são as mesmas que a calculadora usa.",
  },

  problem: {
    eyebrow: "Os nomes",
    title: "“Zona 2” não significa a mesma coisa em cada sistema",
    lede:
      "É a sobreposição que mais gera perguntas. Os dois usos estão corretos dentro do próprio modelo, e quase nunca se esclarece qual deles está sendo usado.",
    quotes: [
      [
        "No modelo de 3 zonas",
        "A Zona 2 é toda a faixa <strong>entre o LT1 e o LT2</strong>: a intensidade moderada. É ali que vivem o ritmo de maratona, o de meio Ironman e o trabalho de tempo.",
      ],
      [
        "Nos modelos de 5 e 7 zonas",
        "A Zona 2 está inteira <strong>abaixo do LT1</strong>: é a rodagem leve, aquela que você sustenta por horas, onde vive 80% do seu volume.",
      ],
    ],
    resolution: {
      title: "A tradução",
      body:
        "A Zona 2 do modelo de 3 zonas equivale à <strong>Zona X mais a Zona 3</strong> do modelo de sete. A Zona 2 do modelo de sete está abaixo das duas, e não participa dessa conversa.",
    },
    rule: {
      title: "Como saber de qual estão falando",
      body:
        "Se o sistema tem três zonas, a Zona 2 dele é a faixa entre os limiares. Se tem cinco ou sete — o seu relógio, o seu plano, a calculadora —, a Zona 2 dele é a rodagem leve.",
    },
  },

  tests: {
    eyebrow: "Como se mede",
    title: "Encontre o seu limiar",
    lede:
      "Tudo o que veio antes precisa de um número real. Estes são os protocolos que usamos, com a aritmética exata de cada um. Nenhum exige laboratório.",
    cols: ["Esporte", "Protocolo", "Como se calcula"],
    rows: [
      ["Corrida", "30' no máximo sustentável", "Ritmo de limiar = média dos 30'.<br>LTHR = FC média dos últimos 20'."],
      ["Ciclismo · medidor de potência", "1 × 20' em subida longa", "FTP = 95% da potência média."],
      ["Ciclismo · subida curta", "2 × 8'", "FTP = 90% da média dos dois blocos."],
      ["Ciclismo · indoor", "Teste de rampa", "O mais simples para começar. Superestima um pouco."],
      ["Ciclismo · sem potência", "30' no máximo sustentável", "LTHR = FC média dos últimos 20'."],
      ["Natação", "400 m + 200 m", "CSS (velocidade crítica) pela calculadora."],
    ],
    hygiene: {
      title: "As regras que decidem se o teste serve",
      body:
        "Cedo, fresco, descansado, alimentado e hidratado. Percurso plano e sem interrupções — um semáforo invalida o teste. Cinta peitoral obrigatória. E <strong>“máximo sustentável” não é “máximo”</strong>: o esforço precisa chegar inteiro ao fim.",
    },
    calc: {
      title: "Já tem o seu número. E as zonas?",
      body:
        "A calculadora monta tudo de graça, nos três esportes, com as sete zonas e as três métricas: <strong>triaperformance.com/pt/calculadora-de-zonas</strong>",
    },
  },

  rpe: {
    eyebrow: "As duas métricas sem bateria",
    title: "PSE e tempo sustentável",
    rpe: {
      title: "PSE — o esforço percebido",
      body:
        "A PSE (escala de 1 a 10) <strong>integra o que nenhum dispositivo mede</strong>: quanto você dormiu, quanto estresse está carregando, o que comeu, quanto calor está fazendo. Acompanha de perto a sua intensidade relativa, com a ressalva de que a relação muda com a duração, o calor e o estado dos seus estoques.",
      use:
        "<strong>Uso prático.</strong> Uma sessão de limiar se sente em torno de <strong>PSE 8</strong>. Se num dia os seus watts de sempre parecem 10, o 10 é o dado válido: reduza a intensidade e mantenha o objetivo fisiológico, não o número prescrito. É a correção que os atletas aprendem a fazer sozinhos, na hora.",
      test:
        "<strong>Nos testes</strong> prescrevemos esforço e não ritmo, para que o resultado seja o do dia e não o do teste anterior.",
    },
    tte: {
      title: "TTE — tempo até a exaustão",
      body:
        "O TTE é quanto tempo você consegue sustentar o seu limiar <em>hoje</em>. Dois atletas com o mesmo FTP não são o mesmo atleta: um sustenta 25 minutos e o outro, 55. Em atletas treinados costuma ficar entre <strong>30 e 70 minutos</strong>.",
      why:
        "É isso que explica por que a Zona 4 existe. O objetivo do trabalho de limiar não é só subir o número — é <strong>esticar por quanto tempo você aguenta</strong>. Por isso uma sessão de limiar é prescrita como tempo acumulado na zona, e por isso esse tempo cresce aos poucos ao longo do bloco.",
    },
  },

  talk: {
    title: "Como se sente cada PSE",
    lede:
      "A forma mais barata de calibrar a PSE é o teste da fala. Não precisa de bateria e funciona nos três esportes.",
    cols: ["PSE", "Como se sente", "Zona"],
    rows: [
      ["1–2", "Você mantém uma conversa inteira sem notar.", "1"],
      ["3–4", "Você fala em frases longas. Poderia seguir por horas.", "2"],
      ["5", "Ainda fala, mas já escolhe a hora.", "X"],
      ["6–7", "Frases curtas. Confortavelmente desconfortável.", "3"],
      ["8", "Três ou quatro palavras. Sustentável, mas você conta os minutos.", "4"],
      ["9–10", "Nem uma palavra.", "5"],
    ],
  },

  practice: {
    eyebrow: "Nossa metodologia",
    title: "Como usamos isso",
    lede:
      "A fisiologia das páginas anteriores vale para qualquer atleta. Como o volume se distribui entre essas zonas já é uma decisão de treino.",
    rows: [
      [
        "A distribuição",
        "Cerca de <strong>80% do volume leve e 20% forte</strong>. A distribuição exata que escrevemos é <strong>80/15/5</strong> ou <strong>70/25/5</strong> conforme o que a prova exige, e vira piramidal à medida que a prova se aproxima: o trabalho se desloca para o ritmo de competição e a Zona 5 fica reservada.",
      ],
      [
        "A faixa intermediária se prescreve, não se improvisa",
        "Entre o LT1 e o LT2 existe treino de muito valor: é o ritmo de maratona, de meio Ironman e de Ironman, e é onde vive o trabalho de tempo. Bem dosada, é uma das sessões chave da semana. O que sai caro é chegar ali sem ter planejado — você sai para uma rodagem leve, se sente bem, o ritmo se acomoda sozinho, e termina a semana com a fadiga de uma sessão de qualidade que não estava no plano.",
      ],
      [
        "Zona X — o ritmo de maratona",
        "É a metade alta da Zona 2. Num bloco de maratona ou de longa distância é conteúdo central e se treina de propósito. Fora desses blocos deixamos de fora: acumula bem mais fadiga que a Zona 2 baixa e devolve um estímulo aeróbico parecido.",
      ],
      [
        "Zona Y — a faixa do limiar",
        "É a faixa que cerca o limiar, entre 100 e 102%. Treina-se quando é exatamente o seu ritmo de competição. Para buscar adaptações de limiar prescrevemos de 102% para cima: o limiar se move com a forma, o descanso e o calor, e treinar em cima da linha deixa a sessão curta nos dias em que esse número está mais alto.",
      ],
    ],
    bridge: {
      title: "E agora, qual sessão faz cada zona crescer",
      body:
        "Este guia é o mapa; o próximo é a rota. <strong>“As sessões que fazem cada zona crescer”</strong> traz, para os três esportes, qual sessão constrói cada uma das sete e o que não fazer em cada uma. Peça na calculadora.",
    },
  },

  who: {
    body: [
      "Triaperformance é o projeto de coaching do <strong>Iván Koch</strong>: triatlo e corrida construídos sobre dados, não sobre modelos prontos. Um único serviço, a mesma metodologia para todos — a que você acabou de ler — e atletas em toda a América e na Europa, do primeiro 10k ao Ironman.",
    ],
    stats: [["46", "avaliações · todas 5 estrelas"], ["328", "planos publicados"], ["3", "idiomas"]],
  },

  /* Translated from the original Spanish reviews. The shipped PT sessions guide
     still carries them untranslated — logged in the home doc. */
  quotes: [
    ["Toda segunda-feira ele me escreve para saber como está a minha semana, me dá feedback.", "Sergio Toro", "Chile"],
    ["Ele me levou de absolutamente zero experiência em triatlo ao meu objetivo de fazer um Ironman 70.3.", "Humberto Rodríguez", "México"],
  ],

  cta: {
    headline: "O mapa está aí.<br>Falta a rota.",
    lead:
      "Conhecer os seus limiares é o ponto de partida. O que muda o resultado é uma semana bem distribuída, sustentada por meses, que se ajusta quando a vida entra no meio. Três formas de fazer isso acontecer.",
    perMonth: "/mês",
    allAccess: {
      tag: "Recomendado",
      name: "Assinatura All-Access",
      body:
        "Todos os planos de treino do catálogo, com estas zonas e estas sessões já sequenciadas semana a semana. Troque de plano quantas vezes quiser.",
      bullets: [
        "Os 328 planos: corrida, ciclismo, triatlo, HYROX",
        "TrainingPeaks Premium incluído",
        "Todos os guias e a biblioteca de ferramentas",
        "Sem fidelidade — cancele quando quiser",
      ],
      button: "Começar com o All-Access",
    },
    coaching: {
      tag: "Se preferir que a gente decida",
      name: "Coaching 1:1",
      body:
        "Um plano escrito para você e revisado toda semana. Testamos você, calculamos as suas zonas e ajustamos quando é preciso. É o serviço que as avaliações descrevem.",
      button: "Ver como funciona",
    },
    plans: {
      tag: "Uma prova específica",
      name: "Plano de treino avulso",
      price: "a partir de US$ 19,99",
      body: "Um objetivo, um plano, pagamento único. Escolha por distância, semanas e nível.",
      button: "Ver os planos",
    },
    foot:
      "Na dúvida sobre qual serve para você? Escreva para <a href=\"mailto:coach@triaperformance.com\">coach@triaperformance.com</a> e dizemos com honestidade qual corresponde — inclusive se for nenhum.",
  },

  fig: {
    curve: {
      caption: "A curva de lactato e os seus dois limiares.",
      x: "Intensidade  ·  velocidade ou potência",
      y: "Lactato no sangue",
      lt1: "LT1",
      lt2: "LT2",
      base: "linha de base",
    },
    stack: {
      caption: "Os sistemas sobre um mesmo eixo: a porcentagem do seu limiar.",
      axis: "% do seu limiar  (FTP · ritmo de limiar · LTHR)",
      rows: {
        three: "3 zonas<br><span>fisiológico</span>",
        seven: "7 zonas<br><span>80/20 Running</span>",
        rpe: "PSE<br><span>1–10</span>",
        tte: "Tempo<br><span>sustentável</span>",
        session: "Sessão<br><span>típica</span>",
      },
      three: ["Zona 1", "Zona 2", "Zona 3"],
      rpeSegs: [
        [["1"], "1–2"], [["2"], "3–4"], [["X"], "5"],
        [["3"], "6–7"], [["Y", "4"], "8"], [["5"], "9–10"],
      ],
      tteSegs: [
        [["1", "2"], "o dia todo"], [["X"], "~2,5 h"], [["3"], "~1 h"],
        [["Y", "4"], "20–60′"], [["5"], "3–8′"],
      ],
      sessionSegs: [
        [["1"], "Recuperação"], [["2"], "Rodagem leve"], [["X"], "Maratona"],
        [["3"], "Tempo"], [["Y", "4"], "Limiar"], [["5"], "VO2máx"],
      ],
    },
    overlap: {
      ours: "Zona 2<span>modelos de 5 e 7</span>",
      seiler: "Zona 2<span>modelo de 3</span>",
      oursNote: "Rodagem leve",
      seilerNote: "Zona X + Zona 3",
      note: "Uma começa exatamente onde a outra termina.",
      caption: "O mesmo rótulo, duas faixas diferentes.",
    },
  },
};

module.exports = { es, en, pt };
