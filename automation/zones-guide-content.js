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
    sub: "Por qué existen tres sistemas de zonas, cómo se superponen, y cuál es el tuyo.",
    lede:
      "Si leíste que hay que <strong>evitar</strong> la zona 2, y también que hay que <strong>construir la base</strong> en zona 2, las dos cosas son ciertas. Están hablando de zonas distintas, de sistemas distintos, y nadie lo aclara. Esta guía las pone sobre el mismo eje — una sola vez — para que no vuelvas a dudar.",
  },

  /* ------------------------------------------------ page 2 · the thresholds */
  thresholds: {
    eyebrow: "Punto de partida",
    title: "No hay un umbral. Hay dos.",
    lede:
      "La herramienta que mapea la resistencia de un atleta es la <strong>curva de lactato</strong>, medida en un test incremental: el atleta sube la intensidad en escalones fijos y al final de cada uno se toma una gota de sangre. Se grafica la intensidad contra el lactato y aparece siempre la misma forma.",
    rows: [
      [
        "LT1 · Umbral aeróbico",
        "El primer punto donde el lactato se despega claramente de tu línea de base. Por debajo de LT1 el esfuerzo es sostenible durante horas: producís lactato y lo eliminás sin acumular nada.",
      ],
      [
        "LT2 · Umbral de lactato",
        "El punto <em>más alto</em> en el que producción y eliminación todavía se igualan. Un metro por encima, el lactato se acumula y el reloj empieza a correr. Vas a leer “umbral anaeróbico”: es el nombre viejo y es engañoso — ahí no pasás a un metabolismo anaeróbico, simplemente dejás de poder limpiar lo que producís.",
      ],
      [
        "Entrenar mueve la curva",
        "Un atleta entrenado no tiene otra curva: tiene <strong>la misma curva desplazada a la derecha</strong>. Sostiene más velocidad o más vatios antes de llegar a cada umbral. Buena parte del entrenamiento de resistencia es exactamente eso, y nada más que eso.",
      ],
    ],
    anchor: {
      title: "El ancla de toda la guía",
      body:
        "Ir al laboratorio es impráctico, así que estimamos <strong>LT2</strong> con un test de campo — es lo que llamamos tu FTP, tu ritmo de umbral o tu LTHR. A partir de acá, <strong>todos los porcentajes son sobre ese número</strong>, nunca sobre tu frecuencia cardíaca máxima. Tu umbral es el 100%.",
    },
  },

  /* --------------------------------------------------- page 3 · the stack */
  stack: {
    eyebrow: "El mapa",
    title: "Un solo eje, tres marcos",
    lede:
      "Los tres sistemas describen la misma fisiología; lo que cambia es en cuántos pedazos la cortan y para qué. Puestos sobre el mismo eje dejan de contradecirse.",
    notes: [
      [
        "LT2 está en el 100% por definición. LT1 cae cerca del 90%.",
        "El primero es aritmética: el 100% <em>es</em> tu umbral. El segundo es una aproximación honesta — LT1 aparece entre el 85% y el 95% del umbral según el atleta, su historia y su deporte. Por eso lo dibujamos como una franja y no como una línea, y por eso se testea en vez de calcularse.",
      ],
      [
        "El de 3 zonas describe. El de 7 prescribe.",
        "Seiler cortó en tres porque es donde la fisiología cambia de régimen, y sirve para hablar del <em>reparto</em> de una temporada. Siete zonas sirven para escribir la sesión del martes. No compiten: uno es el mapa, el otro es la ruta.",
      ],
      [
        "Zona X y Zona Y son nuestras, no son estándar.",
        "La X es la mitad rápida de la Zona 2 y la Y es el piso de la Zona 4. Las separamos porque a las dos las queremos evitar — y no se puede evitar una zona que no tiene nombre. Los motivos son opuestos: la X sobra, la Y no alcanza. Página 7.",
      ],
    ],
    foot:
      "El RPE y los tiempos sostenibles son órdenes de magnitud para un atleta entrenado, no promesas: dependen del deporte, del calor, del sueño y de en qué semana del bloque estés. Las bandas de zona salen de <strong>data/zones.csv</strong>, el mismo archivo que alimenta la calculadora.",
  },

  /* ------------------------------------------------ page 4 · the zone 2 problem */
  problem: {
    eyebrow: "La confusión",
    title: "Las dos “Zona 2” ni siquiera se tocan",
    lede:
      "Es la pregunta que más nos llega, y no es culpa de quien la hace: las dos frases circulan a la vez, las dos son correctas, y ninguna aclara de qué sistema está hablando.",
    quotes: [
      [
        "“Nunca entrenes en zona 2”",
        "Habla del modelo de <strong>3 zonas</strong>. Su Zona 2 es todo lo que hay entre LT1 y LT2, y es el <strong>agujero negro</strong>: demasiado duro para el beneficio de un rodaje suave, demasiado suave para el beneficio de una sesión dura. Fatiga alta, adaptación mediocre.",
      ],
      [
        "“Construí tu base en zona 2”",
        "Habla del modelo de <strong>5 o 7 zonas</strong> — el de tu reloj, el de TrainingPeaks, el nuestro. Su Zona 2 está entera <strong>por debajo de LT1</strong>: es el rodaje suave, el que sostenés horas, donde vive el 80% de tu volumen.",
      ],
    ],
    resolution: {
      title: "La traducción, en una línea",
      body:
        "El agujero negro del que habla el modelo de 3 zonas es, en el nuestro, <strong>tu Zona X más tu Zona 3</strong>. Tu Zona 2 está treinta puntos porcentuales más abajo y no aparece en esa conversación en ningún momento.",
    },
    rule: {
      title: "La regla corta, para no tener que pensarlo de nuevo",
      body:
        "Si el número viene con un “de 3” al lado o con el nombre de Seiler, es <strong>fisiología</strong> y su zona 2 es la que hay que evitar. Si viene de tu reloj, de tu plan o de esta calculadora, es <strong>prescripción</strong> y su zona 2 es donde tenés que estar.",
    },
  },

  /* ------------------------------------------------------- page 5 · tests */
  tests: {
    eyebrow: "Cómo se mide",
    title: "Encontrá tu umbral",
    lede:
      "Todo lo anterior necesita un número real. Estos son los tests que usamos, con la aritmética exacta que aplicamos a cada uno. Ninguno requiere laboratorio.",
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
        "Temprano, fresco, descansado, comido e hidratado. Circuito llano y sin interrupciones — un semáforo invalida el test. Banda pectoral obligatoria. Y <strong>“máximo sostenible” no es “máximo”</strong>: el esfuerzo tiene que llegar entero al final. Salir a muerte en el minuto 3 es la forma número uno de tener que repetirlo.",
    },
    calc: {
      title: "Ya tenés tu número. ¿Y las zonas?",
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
        "El RPE (escala 1 a 10) es la métrica más honesta que tenés, porque <strong>integra lo que ningún dispositivo mide</strong>: cuánto dormiste, cuánto estrés traés, qué comiste, cuánto calor hace. Sigue de cerca a tu intensidad relativa, aunque no es un lactómetro — la relación se corre con la duración, el calor y el estado de tus depósitos.",
      use:
        "<strong>Uso práctico.</strong> Una sesión de umbral tiene que sentirse alrededor de <strong>RPE 8</strong>. Si hoy tus vatios de siempre se sienten 10, la información válida es el 10: bajá la intensidad y mantené el objetivo fisiológico, no el número prescrito. Los atletas que entrenamos aprenden a hacer esa corrección solos, en el momento.",
      test:
        "<strong>En los tests</strong> es al revés: prescribimos esfuerzo, no ritmo, justamente para que nadie se ate a un número que quizá ya no es el suyo.",
    },
    tte: {
      title: "TTE — tiempo hasta el agotamiento",
      body:
        "El TTE es cuánto podés sostener tu umbral <em>hoy</em>. Dos atletas con el mismo FTP no son el mismo atleta: uno lo sostiene 25 minutos y el otro 55. En atletas entrenados suele caer entre <strong>30 y 70 minutos</strong>.",
      why:
        "Esto es lo que explica para qué existe la Zona 4. El objetivo del trabajo de umbral no es solamente subir el número — es <strong>estirar cuánto tiempo lo aguantás</strong>. Por eso una sesión de umbral se prescribe como tiempo acumulado en zona, y por eso ese tiempo crece de a poco a lo largo del bloque.",
    },
  },

  /* the talk test — one canonical RPE mapping, so the guide never gives two */
  talk: {
    title: "Cómo se siente cada RPE",
    lede:
      "La forma más barata de calibrar el RPE es la prueba del habla. No necesita batería y funciona en los tres deportes.",
    cols: ["RPE", "Cómo se siente", "Zona"],
    rows: [
      ["1–2", "Sostenés una conversación entera sin notarlo.", "1"],
      ["3–4", "Hablás en frases largas. Podrías seguir horas.", "2"],
      ["5", "Todavía hablás, pero ya elegís cuándo.", "X"],
      ["6–7", "Frases cortas. Cómodamente incómodo.", "3"],
      ["8", "Tres o cuatro palabras. Sostenible, pero contás los minutos.", "4"],
      ["9–10", "Ni una palabra.", "5"],
    ],
  },

  /* ---------------------------------------------- page 7 · what we do with it */
  practice: {
    eyebrow: "Nuestra metodología",
    title: "Qué hacemos con esto",
    lede:
      "Hasta acá es física del atleta y vale para cualquiera. Esto último es una decisión de entrenamiento, y es la nuestra.",
    rows: [
      [
        "Polarizado, con un medio deliberado",
        "Alrededor del <strong>80% del volumen suave y el 20% realmente duro</strong> — pero el reparto real que escribimos es <strong>80/15/5</strong> o <strong>70/25/5</strong> según lo que pida la carrera. Ese 15 o 25 del medio es intencional: es el trabajo de tempo y de umbral, que en nuestros planes es una sesión clave, no un accidente.",
      ],
      [
        "Por qué no hacemos 80/0/20",
        "Porque el “cero por ciento en el medio” es una simplificación de internet: incluso en los atletas de élite que originaron el modelo aparece entre un 5% y un 10% de trabajo moderado. Y porque acercándose a la carrera <strong>la pirámide gana</strong> — el trabajo se corre hacia el ritmo de competencia y la Zona 5 se guarda.",
      ],
      [
        "Zona X — sobra",
        "Es el techo de tu Zona 2. Cuesta bastante más fatiga y devuelve prácticamente el mismo estímulo aeróbico que ir más lento: pagás más y te llevás lo mismo. Casi nunca es una decisión — salís a rodar suave, te sentís bien, el ritmo se acomoda solo, y terminás la semana con la fatiga de una sesión que nunca hiciste. <strong>La excepción es el maratón y el Ironman</strong>: ahí es tu ritmo de carrera y se entrena a propósito.",
      ],
      [
        "Zona Y — no alcanza",
        "Es el piso de la Zona 4, y se evita por el motivo contrario. Tu umbral no es una línea fija: se mueve con la forma, el descanso y el calor. Entrenar exactamente al 100% no garantiza nada — si ese día tu umbral real está un poco más arriba, pagaste el costo sin comprar el beneficio. Para asegurarla hay que entrenar un poco por encima.",
      ],
    ],
    bridge: {
      title: "Y ahora, qué sesión hace crecer cada zona",
      body:
        "Esta guía es el mapa; la que sigue es la ruta. <strong>“Las sesiones que hacen crecer cada zona”</strong> tiene, para los tres deportes, qué sesión construye cada una de las siete y qué no hacer en cada una. Pedila en la calculadora.",
    },
  },

  /* ------------------------------------------------------------ page 8 · CTA */
  who: {
    body: [
      "Triaperformance es el proyecto de coaching de <strong>Iván Koch</strong>: triatlón y running construidos sobre datos, no sobre plantillas. Un solo servicio, la misma metodología para todos — la que acabás de leer — y atletas en toda América y Europa, del primer 10k al Ironman.",
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
    headline: "Ya entendés el mapa.<br>Ahora hay que caminar la ruta.",
    lead:
      "Saber dónde están tus umbrales no cambia nada por sí solo: lo que cambia el resultado es una semana bien repartida, sostenida durante meses, que se ajusta cuando la vida se mete en el medio. Tres formas de que eso pase.",
    perMonth: "/mes",
    allAccess: {
      tag: "Recomendado",
      name: "Membresía All-Access",
      body:
        "Todos los planes del catálogo, con estas zonas y estas sesiones ya secuenciadas semana a semana. Cambiás de plan las veces que quieras.",
      bullets: [
        "Los 328 planes: running, ciclismo, triatlón, HYROX",
        "TrainingPeaks Premium incluido",
        "Todas las guías y la biblioteca de herramientas",
        "Sin permanencia — cancelás cuando quieras",
      ],
      button: "Empezar con All-Access",
    },
    coaching: {
      tag: "Si querés que lo decidamos nosotros",
      name: "Coaching 1:1",
      body:
        "Un plan escrito para vos y revisado todas las semanas. Te testeamos, te calculamos las zonas, y ajustamos cuando hace falta. Es el servicio que describen las reseñas.",
      button: "Ver cómo funciona",
    },
    plans: {
      tag: "Una carrera puntual",
      name: "Plan de entrenamiento suelto",
      price: "desde US$ 19,99",
      body: "Un objetivo, un plan, pago único. Elegí por distancia, semanas y nivel.",
      button: "Ver los planes",
    },
    foot:
      "¿Dudas sobre cuál te sirve? Escribinos a <a href=\"mailto:coach@triaperformance.com\">coach@triaperformance.com</a> y te decimos con honestidad cuál corresponde — incluso si es ninguno.",
  },

  /* --------------------------------------------------------- figure labels */
  fig: {
    curve: {
      caption: "La curva de lactato y sus dos puntos de inflexión.",
      x: "Intensidad  ·  velocidad o potencia",
      y: "Lactato en sangre",
      lt1: "LT1",
      lt2: "LT2",
      base: "línea de base",
    },
    stack: {
      caption: "Los tres sistemas sobre el mismo eje: el porcentaje de tu umbral.",
      axis: "% de tu umbral  (FTP · ritmo de umbral · LTHR)",
      rows: {
        three: "3 zonas<br><span>Seiler</span>",
        seven: "7 zonas<br><span>el tuyo</span>",
        rpe: "RPE<br><span>1–10</span>",
        tte: "Tiempo<br><span>sostenible</span>",
        session: "Sesión<br><span>típica</span>",
      },
      three: ["Zona 1", "Zona 2", "Zona 3"],
      blackHole: "el agujero negro",
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
      caption: "Las dos “Zona 2”, sobre el mismo eje.",
      ours: "Zona 2<span>la tuya · tu reloj</span>",
      seiler: "Zona 2<span>la de Seiler</span>",
      oursNote: "Rodaje suave",
      seilerNote: "Zona X + Zona 3",
      note: "La tuya vive entera por debajo de LT1. La de Seiler empieza justo donde la tuya termina.",
    },
  },
};

module.exports = { es };
