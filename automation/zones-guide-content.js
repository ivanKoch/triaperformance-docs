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

  prices: { allAccess: "39,99", coaching: "149" },

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
        "Esto es lo que explica para qué existe la Zona 4. El objetivo del trabajo de umbral no es solamente subir el número — es <strong>estirar cuánto tiempo lo aguantas</strong>. Por eso una sesión de umbral se prescribe como tiempo acumulado en zona, y por eso ese tiempo crece de a poco a lo largo del bloque.",
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
      price: "desde US$ 19,99",
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

module.exports = { es };
