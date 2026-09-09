/**
 * runner-week-content.js — all copy for "La semana de fuerza del corredor",
 * keyed by language. Template-only builder: automation/build-runner-week-pdf.js.
 *
 * Home doc: lead-magnet-semana-de-fuerza.md
 *
 * ⚠️ NOTHING IN THIS FILE IS A NEW COACHING DECISION. Every prescription here
 * is a copy of a decision that already has a home:
 *   - dose, "never before quality", the upper-back gap  → runner-core-brief.md
 *   - placement in the week, 2 gym sessions, the phases → methodology.md §13.1
 *   - what strength buys, the four errors, maintenance  → strength-guide-brief.md
 *   - traffic light + red flags                         → knee-strength-brief.md,
 *                                                         achilles-brief.md
 *   - "no soy médico"                                   → methodology.md §7, §11
 * If one of those moves, this file is a copy to be corrected in the same session.
 *
 * Prices are copies of triaperformance-pricing-and-positioning.md.
 *
 * THE ONE EXCEPTION, and it is flagged deliberately: the week grid in `s4` is an
 * ASSEMBLY of the placement rules, not a week Iván has written down anywhere. The
 * rules produce it; he has not signed it off. See the home doc §Open.
 *
 * `circuit` carries ids + names + roles. The builder asserts the ES names and
 * their order against data/members_exercises.csv (generated from the built page)
 * and asserts EN/PT carry the same ids in the same order — translation is checked
 * BY POSITION with Spanish as the control, per ai-infrastructure §44.
 */

/* The six circuit exercises, in page order. Warm-up (catcow, thread, birddog,
   bridgeMarch) and cool-down (hipflex, fig4) are deliberately not listed: this
   is "what you just trained", not a reprint of the routine. */
const CIRCUIT_IDS = ["deadbugPress", "sidePlankKnee", "plankReach", "slBridgeIso", "lungeRot", "slDeadlift"];

module.exports = {
  CIRCUIT_IDS,

  es: {
    filename: "semana-de-fuerza-del-corredor.pdf",
    docTitle: "La semana de fuerza del corredor — Triaperformance",

    cover: {
      kicker: "Guía · Triaperformance",
      h1: "La semana de fuerza del corredor",
      sub: "Dónde entran esas dos sesiones, y las tres cosas que la rutina no entrena.",
      lede: "Acabas de hacer core de corredor. Es una pieza, no el programa. Esta guía es el resto: cuántas veces por semana, en qué días, qué queda sin entrenar si esto es lo único que haces, y qué hacer cuando algo duele.",
      foot: "triaperformance.com · coach@triaperformance.com"
    },

    s1: {
      kicker: "01",
      h2: "Qué acabas de entrenar",
      intro: "Correr es una sucesión de saltos a una sola pierna. En cada aterrizaje el tronco tiene que absorber el impacto, evitar que la cadera libre se caiga y resistir la torsión que genera el braceo. Por eso el circuito es <em>anti</em>: anti-extensión, anti-flexión lateral, anti-rotación. Y termina de pie sobre una pierna, porque esa es la posición en la que correr realmente ocurre.",
      cols: ["Ejercicio", "Qué entrena"],
      note: "El core no crea movimiento. Lo impide. Por eso el fallo aquí no es la fatiga: es el momento en que la pelvis empieza a moverse. Cuando eso pasa, la serie se terminó, queden repeticiones o no."
    },

    s2: {
      kicker: "02",
      h2: "Y qué no",
      intro: "Tres cosas que un corredor necesita y que este circuito no toca. Las dos primeras están fuera a propósito, porque otra herramienta las hace mejor. La tercera está fuera por una decisión que tiene un costo, y prefiero decírtelo.",
      gaps: [
        {
          h: "El resorte del pie y el gemelo",
          body: "El tendón de Aquiles y el pie son el resorte real del corredor: almacenan y devuelven energía en cada zancada. Nada en este circuito los carga. Si vas a agregar una sola cosa a tu semana, que sea trabajo de gemelo y de pie.",
          tool: "Aquiles sin dolor",
          note: "rutina completa, en el Área de Miembros"
        },
        {
          h: "El seguimiento de la rótula bajo carga",
          body: "El dolor de rodilla del corredor casi nunca es un problema de rodilla. Un glúteo medio débil deja caer la pelvis en cada apoyo, la rodilla colapsa hacia dentro y el tendón rotuliano y la banda iliotibial lo pagan. Aquí entrenas la pelvis sin carga; esa es la mitad del trabajo.",
          tool: "Rodillas sin dolor",
          note: "rutina completa, en el Área de Miembros"
        },
        {
          h: "La espalda alta",
          body: "Esta falta es deliberada y quiero que sepas por qué. La rutina cambió el paracaidista en prono por el peso muerto a una pierna, porque el paracaidista sostiene extensión lumbar y de cadera al mismo tiempo — que es exactamente el defecto que el primer ejercicio del circuito existe para prevenir. El cambio vale la pena y tiene un costo: la resistencia escapular no se entrena en ningún punto de este circuito, y es lo que te mantiene alto y con el pecho abierto cuando se acumula la fatiga.",
          tool: null,
          note: "Si vas a cubrirlo, cúbrelo con una W en prono con las piernas apoyadas en el piso, o con remo. No con un superman completo: eso reintroduce justo lo que sacamos."
        }
      ]
    },

    s3: {
      kicker: "03",
      h2: "Cuántas veces, y en qué días",
      dose: [
        { k: "Frecuencia", v: "2 veces por semana" },
        { k: "Cuándo", v: "En días de rodaje fácil, o después de un rodaje fácil" },
        { k: "Nunca", v: "Antes de una sesión de calidad" }
      ],
      body: "Es una pregunta que aparece siempre: ¿sirve como activación antes de las series? No. Es lo bastante fatigante como para ensuciar la técnica de la sesión que viene, y para eso ya existe una rutina de activación específica, que es corta y no deja residuo. Esto es trabajo de soporte, no calentamiento.",
      callout: "Dos sesiones de core no son el programa. Son dos piezas dentro de una semana de carrera que sigue siendo lo que decide tu resultado."
    },

    s4: {
      kicker: "04",
      h2: "La semana completa",
      intro: "Cuatro reglas gobiernan dónde va la fuerza en una semana de carrera. No son negociables entre ellas: cuando chocan, gana la de arriba.",
      rules: [
        "Deja al menos 6 horas entre el gimnasio y la sesión de resistencia del mismo día, cuando se pueda.",
        "Nunca piernas pesadas el día antes de una sesión de calidad o del fondo.",
        "Apila el gimnasio sobre un día que ya es duro, en lugar de arruinar uno fácil.",
        "Dos sesiones de gimnasio por semana es la norma. Tres o cuatro solo durante una fase de fuerza máxima."
      ],
      gridTitle: "Una semana de cinco carreras, con las reglas aplicadas",
      days: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      rows: [
        { label: "Correr", cells: ["—", "Calidad", "Fácil", "Calidad", "Fácil", "—", "Fondo"] },
        { label: "Gimnasio", cells: ["—", "Después", "—", "Después", "—", "—", "—"] },
        { label: "Core", cells: ["—", "—", "Sí", "—", "Sí", "—", "—"] }
      ],
      caveat: "Esta es la semana que sale de esas reglas, no la única que existe. Si tienes cuatro días para correr en vez de cinco, lo primero que sale es un día fácil — no el gimnasio. Sacar el gimnasio es el error más común y está en la página siguiente.",
      constraint: "A cuatro, cinco o seis carreras por semana más gimnasio, la restricción que gobierna todo no es el tiempo. Es la fatiga."
    },

    s5: {
      kicker: "05",
      h2: "Para qué sirve la fuerza, y para qué no",
      buys: [
        { h: "Economía", body: "El mismo ritmo te cuesta menos oxígeno." },
        { h: "Resiliencia del tejido", body: "Tendón, hueso y músculo toleran más impacto antes de quejarse." },
        { h: "Durabilidad", body: "Llegas al kilómetro 32 con la técnica que tenías en el 10." }
      ],
      notWatts: "Lo que la fuerza <strong>no</strong> te da es más potencia aeróbica. Vas a leer lo contrario en muchos lados. Levantar pesas no sube tu VO2máx ni tu umbral: eso lo sube correr. La fuerza hace que el motor que ya tienes te dure más y te cueste menos.",
      phasesTitle: "Cómo se ordena un bloque de 12 semanas",
      phaseCols: ["Fase", "4 semanas", "Dosis"],
      phases: [
        { n: "1", h: "Tolerancia del tejido", d: "2 veces por semana · 6–10 repeticiones · RIR 3" },
        { n: "2", h: "Fuerza máxima", d: "3–5 series × 3–5 repeticiones · ≥85% · 3–5 min de descanso" },
        { n: "3", h: "Potencia", d: "2–5 repeticiones · 30–65% · máxima intención · para cuando cae la velocidad" }
      ],
      blockNote: "Cada fase de cuatro semanas son tres de carga y una fácil. Si tienes 50 años o más: dos de carga y una fácil, igual que en los bloques de resistencia.",
      noHyperTitle: "Sin fase de hipertrofia, a propósito",
      noHyper: "Casi todos los programas de fuerza abren con cuatro semanas de hipertrofia. Este no. La masa añadida es un costo directo en vatios por kilo y en economía de carrera, y el corredor está en una categoría de peso — solo que se la puso él mismo. Un bloque real de hipertrofia existe como decisión de temporada baja, tomada a propósito y asumiendo el costo. No como punto de partida.",
      maintTitle: "Mantenimiento",
      maint: "Una sesión por semana sostiene la fuerza durante semanas, siempre que la carga siga alta y baje el volumen. El error clásico de la semana de carrera es exactamente al revés: bajar el peso y mantener las series. Eso no mantiene nada y además te cuesta frescura."
    },

    s6: {
      kicker: "06",
      h2: "Cuatro errores",
      errors: [
        { h: "Empezar por hipertrofia", body: "Es el arranque por defecto de casi todo programa de gimnasio y es el equivocado para ti. Ganas masa que después tienes que cargar en cada zancada." },
        { h: "Piernas pesadas el día antes de la calidad", body: "La sesión de calidad es la que produce la adaptación de la semana. Llegar a ella con las piernas de ayer la convierte en una sesión mediocre y en fatiga que no compró nada." },
        { h: "Mantener bajando el peso", body: "En semana de carrera se baja el volumen y se mantiene la carga. Hacerlo al revés — mismo número de series con la mitad del peso — no mantiene la fuerza y sí te deja cansado." },
        { h: "Abandonar el gimnasio cuando sube el volumen de carrera", body: "Es el más común y el más caro. Justo cuando más kilómetros haces, más impacto absorbe el tejido y más lo necesita — y es exactamente el momento en que la mayoría deja de ir por falta de tiempo." }
      ]
    },

    s7: {
      kicker: "07",
      h2: "Si algo duele",
      rules: [
        { k: "Durante", v: "Molestia de 1 a 3 sobre 10 es aceptable. Por encima de 4, o si cambia tu forma de correr, para." },
        { k: "La prueba real", v: "La mañana siguiente. Igual o mejor que antes de entrenar. Si está peor, la dosis fue demasiado." },
        { k: "Si está peor", v: "Reduce el rango o la carga antes de reducir la frecuencia." }
      ],
      flagsTitle: "Cuándo esto no es tu rutina, es una consulta",
      flags: [
        "Hinchazón, calor o enrojecimiento en la zona.",
        "La rodilla se bloquea o se va.",
        "Dolor por la noche, en reposo.",
        "Dolor que empezó después de un impacto o de un giro.",
        "Un chasquido súbito con incapacidad de empujar o de ponerte de puntillas: eso es el mismo día, no la semana que viene."
      ],
      disclaimer: "No soy médico y no diagnostico. Cuando algo entra en esa lista, lo que corresponde es un profesional que pueda verte, no una rutina genérica. Lo que sí puedo hacer mientras tanto es redistribuir tu carga hacia lo que no te duele, que suele ser la diferencia entre parar seis semanas y no parar."
    },

    cta: {
      headline: "Ya sabes dónde va la fuerza en tu semana.<br>Falta que la semana esté escrita.",
      lead: "Estas piezas funcionan cuando están secuenciadas — dos sesiones de calidad, el resto suave, y una progresión que cambia según el mes de tu preparación. Dos formas de que eso pase.",
      perMonth: "/mes",
      allAccess: {
        tag: "Recomendado",
        name: "Membresía All-Access",
        body: "Todo el catálogo de planes con las semanas ya secuenciadas, más la biblioteca de herramientas: las rutinas de Aquiles y de rodillas que aparecen en esta guía, activación, movilidad, recuperación y las calculadoras.",
        bullets: [
          "Planes de running, ciclismo, triatlón y HYROX",
          "TrainingPeaks Premium incluido",
          "La biblioteca completa de herramientas y guías",
          "Sin permanencia — cancelas cuando quieras"
        ],
        button: "Empezar con All-Access"
      },
      coaching: {
        tag: "Si prefieres que lo decidamos juntos",
        name: "Coaching 1:1",
        body: "Un plan escrito para ti y revisado todas las semanas. Ajustes cuando la vida se mete en el medio, análisis de tus sesiones y WhatsApp directo.",
        button: "Ver cómo funciona"
      },
      foot: "¿Dudas sobre cuál te sirve? Escríbeme a <a href=\"mailto:coach@triaperformance.com\">coach@triaperformance.com</a> y te digo con honestidad cuál corresponde — incluso si es ninguno."
    },

    prices: { allAccess: "39,99", coaching: "149" },
    links: {
      allAccess: "https://triaperformance.com/all-access/",
      coaching: "https://triaperformance.com/#coaching",
      tool: "https://triaperformance.com/core-para-corredores/"
    },
    labels: { page: "Página", of: "de", tool: "Herramienta" },

    circuit: [
      { id: "deadbugPress",  name: "Dead bug con presión isométrica",       role: "Anti-extensión — que la lumbar no se despegue del piso cuando el brazo y la pierna se alejan." },
      { id: "sidePlankKnee", name: "Plancha lateral con rodilla al pecho",  role: "Anti-flexión lateral — el glúteo medio evitando que la cadera libre se caiga." },
      { id: "plankReach",    name: "Plancha alta con alcance al frente",    role: "Anti-rotación — el tronco resistiendo la torsión que genera el braceo." },
      { id: "slBridgeIso",   name: "Puente a una pierna isométrico",        role: "Cadena posterior — glúteo e isquiotibiales sosteniendo la cadera arriba sobre un apoyo." },
      { id: "lungeRot",      name: "Zancada inversa con rotación",          role: "Rotación e integración bípeda — el tórax girando mientras la pelvis se queda quieta." },
      { id: "slDeadlift",    name: "Peso muerto a una pierna",              role: "Apoyo unipodal — equilibrio, cadena posterior y anti-rotación de pie, que es como corres." }
    ]
  },

  en: {
    filename: "runner-strength-week.pdf",
    docTitle: "The runner’s strength week — Triaperformance",

    cover: {
      kicker: "Guide · Triaperformance",
      h1: "The runner’s strength week",
      sub: "Where those two sessions go, and the three things the routine doesn’t train.",
      lede: "You’ve just done runner core. It’s one piece, not the programme. This guide is the rest of it: how often, on which days, what goes untrained if this is all you do, and what to do when something hurts.",
      foot: "triaperformance.com · coach@triaperformance.com"
    },

    s1: {
      kicker: "01",
      h2: "What you just trained",
      intro: "Running is a series of hops on one leg. At every landing the trunk has to absorb the impact, stop the free hip dropping, and resist the twist your arm swing generates. That is why the circuit is <em>anti</em>: anti-extension, anti-lateral-flexion, anti-rotation. And it finishes standing on one leg, because that is the position running actually happens in.",
      cols: ["Exercise", "What it trains"],
      note: "The core doesn’t create movement. It prevents it. So failure here isn’t fatigue — it’s the moment the pelvis starts to move. When that happens the set is over, reps left or not."
    },

    s2: {
      kicker: "02",
      h2: "And what it doesn’t",
      intro: "Three things a runner needs that this circuit doesn’t touch. The first two are out on purpose, because another tool does them better. The third is out because of a decision that carries a cost, and I’d rather tell you.",
      gaps: [
        {
          h: "The foot and calf spring",
          body: "The Achilles tendon and the foot are the runner’s real spring: they store and return energy on every stride. Nothing in this circuit loads them. If you’re going to add one thing to your week, make it calf and foot work.",
          tool: "Achilles Without Pain",
          note: "full routine, in the Members Area"
        },
        {
          h: "Kneecap tracking under load",
          body: "Runner’s knee is almost never a knee problem. A weak glute medius lets the pelvis drop at every footfall, the knee collapses inward, and the patellar tendon and IT band pay for it. Here you train the pelvis unloaded — that’s half the job.",
          tool: "Knees Without Pain",
          note: "full routine, in the Members Area"
        },
        {
          h: "The upper back",
          body: "This gap is deliberate and I want you to know why. The routine swapped the prone superman for the single-leg deadlift, because the superman holds lumbar and hip extension at the same time — which is exactly the fault the first exercise in the circuit exists to prevent. The swap is worth it and it costs something: scapular endurance is trained nowhere in this circuit, and that is what keeps you tall and open-chested when the fatigue arrives.",
          tool: null,
          note: "If you’re going to cover it, cover it with a prone W with your legs on the floor, or with rows. Not with a full superman: that puts back exactly what we took out."
        }
      ]
    },

    s3: {
      kicker: "03",
      h2: "How often, and on which days",
      dose: [
        { k: "Frequency", v: "Twice a week" },
        { k: "When", v: "On easy running days, or after an easy run" },
        { k: "Never", v: "Before a quality session" }
      ],
      body: "The question always comes up: does it work as a warm-up before intervals? No. It’s fatiguing enough to dirty the technique of the session that follows, and there’s already a specific activation routine for that — short, and it leaves no residue. This is support work, not a warm-up.",
      callout: "Two core sessions are not the programme. They’re two pieces inside a running week that is still what decides your result."
    },

    s4: {
      kicker: "04",
      h2: "The full week",
      intro: "Four rules govern where strength goes in a running week. They aren’t negotiable against each other: when they clash, the one above wins.",
      rules: [
        "Leave at least 6 hours between the gym and the endurance session on the same day, where you can.",
        "Never heavy legs the day before a quality session or the long run.",
        "Stack the gym onto a day that’s already hard, rather than spoiling an easy one.",
        "Two gym sessions a week is the norm. Three or four only during a max-strength phase."
      ],
      gridTitle: "A five-run week with the rules applied",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      rows: [
        { label: "Run", cells: ["—", "Quality", "Easy", "Quality", "Easy", "—", "Long"] },
        { label: "Gym", cells: ["—", "After", "—", "After", "—", "—", "—"] },
        { label: "Core", cells: ["—", "—", "Yes", "—", "Yes", "—", "—"] }
      ],
      caveat: "This is the week those rules produce, not the only one there is. If you have four days to run instead of five, the first thing to go is an easy day — not the gym. Dropping the gym is the most common mistake and it’s on the next page.",
      constraint: "At four, five or six runs a week plus the gym, the constraint that governs everything isn’t time. It’s fatigue."
    },

    s5: {
      kicker: "05",
      h2: "What strength buys you, and what it doesn’t",
      buys: [
        { h: "Economy", body: "The same pace costs you less oxygen." },
        { h: "Tissue resilience", body: "Tendon, bone and muscle tolerate more impact before complaining." },
        { h: "Durability", body: "You reach kilometre 32 with the form you had at 10." }
      ],
      notWatts: "What strength does <strong>not</strong> give you is more aerobic power. You’ll read the opposite in plenty of places. Lifting doesn’t raise your VO2max or your threshold — running does. Strength makes the engine you already have last longer and cost less.",
      phasesTitle: "How a 12-week block is ordered",
      phaseCols: ["Phase", "4 weeks", "Dose"],
      phases: [
        { n: "1", h: "Tissue tolerance", d: "Twice a week · 6–10 reps · RIR 3" },
        { n: "2", h: "Max strength", d: "3–5 sets × 3–5 reps · ≥85% · 3–5 min rest" },
        { n: "3", h: "Power", d: "2–5 reps · 30–65% · maximal intent · stop when velocity drops" }
      ],
      blockNote: "Each four-week phase is three loading weeks and one easy. If you’re 50 or over: two loading and one easy, same as the endurance blocks.",
      noHyperTitle: "No hypertrophy phase, on purpose",
      noHyper: "Almost every strength programme opens with four weeks of hypertrophy. This one doesn’t. Added mass is a direct cost in watts per kilo and in running economy, and a runner is in a weight class — it’s just one they set themselves. A real hypertrophy block exists as an off-season decision, taken deliberately and accepting the cost. Not as a starting point.",
      maintTitle: "Maintenance",
      maint: "One session a week holds strength for weeks, as long as the load stays high and the volume drops. The classic race-week error is exactly the reverse: lighter weight, same number of sets. That maintains nothing and still costs you freshness."
    },

    s6: {
      kicker: "06",
      h2: "Four mistakes",
      errors: [
        { h: "Starting with hypertrophy", body: "It’s the default opening of almost every gym programme and it’s the wrong one for you. You gain mass you then have to carry on every stride." },
        { h: "Heavy legs the day before quality", body: "The quality session is what produces the week’s adaptation. Arriving at it on yesterday’s legs turns it into a mediocre session and into fatigue that bought nothing." },
        { h: "Maintaining by dropping the weight", body: "In race week you drop the volume and keep the load. Doing it the other way round — same number of sets at half the weight — maintains no strength and still leaves you tired." },
        { h: "Dropping the gym when running volume climbs", body: "The most common and the most expensive. Exactly when you’re running the most kilometres, the tissue absorbs the most impact and needs it most — and that is precisely when most people stop going, for lack of time." }
      ]
    },

    s7: {
      kicker: "07",
      h2: "If something hurts",
      rules: [
        { k: "During", v: "Discomfort of 1 to 3 out of 10 is acceptable. Above 4, or if it changes how you run, stop." },
        { k: "The real test", v: "The next morning. Same or better than before you trained. Worse means the dose was too much." },
        { k: "If it’s worse", v: "Reduce range or load before you reduce frequency." }
      ],
      flagsTitle: "When this isn’t your routine, it’s an appointment",
      flags: [
        "Swelling, heat or redness in the area.",
        "The knee locks or gives way.",
        "Pain at night, at rest.",
        "Pain that started after an impact or a twist.",
        "A sudden snap with an inability to push off or rise onto your toes — that’s the same day, not next week."
      ],
      disclaimer: "I’m not a doctor and I don’t diagnose. When something lands on that list, what it needs is a professional who can actually look at you, not a generic routine. What I can do in the meantime is redistribute your load towards what doesn’t hurt, which is usually the difference between six weeks off and none."
    },

    cta: {
      headline: "You know where strength goes in your week.<br>What’s missing is the week itself.",
      lead: "These pieces work when they’re sequenced — two quality sessions, the rest easy, and a progression that changes with the month of your build. Two ways to make that happen.",
      perMonth: "/mo",
      allAccess: {
        tag: "Recommended",
        name: "All-Access Membership",
        body: "The whole plan catalogue with the weeks already sequenced, plus the tools library: the Achilles and knee routines this guide points at, activation, mobility, recovery and the calculators.",
        bullets: [
          "Running, cycling, triathlon and HYROX plans",
          "TrainingPeaks Premium included",
          "The full library of tools and guides",
          "No commitment — cancel whenever you want"
        ],
        button: "Start with All-Access"
      },
      coaching: {
        tag: "If you’d rather we decide together",
        name: "1:1 Coaching",
        body: "A plan written for you and reviewed every week. Adjustments when life gets in the way, analysis of your sessions, and direct WhatsApp.",
        button: "See how it works"
      },
      foot: "Not sure which one fits? Write to me at <a href=\"mailto:coach@triaperformance.com\">coach@triaperformance.com</a> and I’ll tell you honestly which one applies — including if it’s neither."
    },

    prices: { allAccess: "39.99", coaching: "149" },
    links: {
      allAccess: "https://triaperformance.com/en/all-access/",
      coaching: "https://triaperformance.com/en/#coaching",
      tool: "https://triaperformance.com/en/runner-core/"
    },
    labels: { page: "Page", of: "of", tool: "Tool" },

    circuit: [
      { id: "deadbugPress",  name: "Dead bug with isometric press",     role: "Anti-extension — keeping the lower back on the floor as the arm and leg travel away." },
      { id: "sidePlankKnee", name: "Side plank with knee to chest",     role: "Anti-lateral-flexion — the glute medius stopping the free hip from dropping." },
      { id: "plankReach",    name: "High plank with forward reach",     role: "Anti-rotation — the trunk resisting the twist the arm swing generates." },
      { id: "slBridgeIso",   name: "Single-leg isometric bridge",       role: "Posterior chain — glute and hamstrings holding the hip up over one support." },
      { id: "lungeRot",      name: "Reverse lunge with rotation",       role: "Rotation and bipedal integration — the thorax turning while the pelvis stays still." },
      { id: "slDeadlift",    name: "Single-leg deadlift",               role: "Single-leg support — balance, posterior chain and anti-rotation standing up, which is how you run." }
    ]
  },

  pt: {
    filename: "semana-de-forca-do-corredor.pdf",
    docTitle: "A semana de força do corredor — Triaperformance",

    cover: {
      kicker: "Guia · Triaperformance",
      h1: "A semana de força do corredor",
      sub: "Onde entram essas duas sessões, e as três coisas que a rotina não treina.",
      lede: "Você acabou de fazer core do corredor. É uma peça, não o programa. Este guia é o resto: quantas vezes por semana, em quais dias, o que fica sem treinar se isso for tudo o que você faz, e o que fazer quando algo dói.",
      foot: "triaperformance.com · coach@triaperformance.com"
    },

    s1: {
      kicker: "01",
      h2: "O que você acabou de treinar",
      intro: "Correr é uma sucessão de saltos sobre uma perna só. A cada aterrissagem o tronco tem que absorver o impacto, impedir que o quadril livre caia e resistir à torção que o balanço dos braços gera. Por isso o circuito é <em>anti</em>: anti-extensão, anti-flexão lateral, anti-rotação. E termina de pé sobre uma perna, porque essa é a posição em que correr realmente acontece.",
      cols: ["Exercício", "O que treina"],
      note: "O core não cria movimento. Ele o impede. Por isso a falha aqui não é a fadiga: é o momento em que a pelve começa a se mover. Quando isso acontece, a série acabou, com repetições restantes ou não."
    },

    s2: {
      kicker: "02",
      h2: "E o que não treina",
      intro: "Três coisas que um corredor precisa e que este circuito não toca. As duas primeiras estão fora de propósito, porque outra ferramenta faz melhor. A terceira está fora por uma decisão que tem um custo, e prefiro te contar.",
      gaps: [
        {
          h: "A mola do pé e da panturrilha",
          body: "O tendão de Aquiles e o pé são a mola real do corredor: armazenam e devolvem energia a cada passada. Nada neste circuito os carrega. Se você for acrescentar uma única coisa à sua semana, que seja trabalho de panturrilha e de pé.",
          tool: "Aquiles sem dor",
          note: "rotina completa, na Área de Membros"
        },
        {
          h: "O rastreamento da patela sob carga",
          body: "A dor no joelho do corredor quase nunca é um problema de joelho. Um glúteo médio fraco deixa a pelve cair a cada apoio, o joelho colapsa para dentro e o tendão patelar e a banda iliotibial pagam a conta. Aqui você treina a pelve sem carga; essa é metade do trabalho.",
          tool: "Joelhos sem dor",
          note: "rotina completa, na Área de Membros"
        },
        {
          h: "A parte alta das costas",
          body: "Essa ausência é deliberada e quero que você saiba por quê. A rotina trocou o paraquedista em prono pelo levantamento terra unilateral, porque o paraquedista sustenta extensão lombar e de quadril ao mesmo tempo — que é exatamente o defeito que o primeiro exercício do circuito existe para prevenir. A troca vale a pena e tem um custo: a resistência escapular não é treinada em nenhum ponto deste circuito, e é ela que te mantém alto e com o peito aberto quando a fadiga chega.",
          tool: null,
          note: "Se for cobrir isso, cubra com um W em prono com as pernas apoiadas no chão, ou com remada. Não com um superman completo: isso reintroduz justamente o que tiramos."
        }
      ]
    },

    s3: {
      kicker: "03",
      h2: "Quantas vezes, e em quais dias",
      dose: [
        { k: "Frequência", v: "2 vezes por semana" },
        { k: "Quando", v: "Em dias de corrida leve, ou depois de uma corrida leve" },
        { k: "Nunca", v: "Antes de uma sessão de qualidade" }
      ],
      body: "É uma pergunta que sempre aparece: serve como ativação antes dos tiros? Não. É fatigante o suficiente para sujar a técnica da sessão seguinte, e para isso já existe uma rotina de ativação específica, que é curta e não deixa resíduo. Isto é trabalho de suporte, não aquecimento.",
      callout: "Duas sessões de core não são o programa. São duas peças dentro de uma semana de corrida que continua sendo o que decide o seu resultado."
    },

    s4: {
      kicker: "04",
      h2: "A semana completa",
      intro: "Quatro regras governam onde a força entra numa semana de corrida. Elas não são negociáveis entre si: quando se chocam, ganha a de cima.",
      rules: [
        "Deixe pelo menos 6 horas entre a academia e a sessão de resistência do mesmo dia, quando der.",
        "Nunca pernas pesadas no dia anterior a uma sessão de qualidade ou ao longão.",
        "Empilhe a academia sobre um dia que já é duro, em vez de estragar um leve.",
        "Duas sessões de academia por semana é a norma. Três ou quatro só durante uma fase de força máxima."
      ],
      gridTitle: "Uma semana de cinco corridas, com as regras aplicadas",
      days: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
      rows: [
        { label: "Correr", cells: ["—", "Qualidade", "Leve", "Qualidade", "Leve", "—", "Longão"] },
        { label: "Academia", cells: ["—", "Depois", "—", "Depois", "—", "—", "—"] },
        { label: "Core", cells: ["—", "—", "Sim", "—", "Sim", "—", "—"] }
      ],
      caveat: "Esta é a semana que sai dessas regras, não a única que existe. Se você tem quatro dias para correr em vez de cinco, a primeira coisa que sai é um dia leve — não a academia. Cortar a academia é o erro mais comum e está na página seguinte.",
      constraint: "Com quatro, cinco ou seis corridas por semana mais academia, a restrição que governa tudo não é o tempo. É a fadiga."
    },

    s5: {
      kicker: "05",
      h2: "Para que serve a força, e para que não serve",
      buys: [
        { h: "Economia", body: "O mesmo ritmo te custa menos oxigênio." },
        { h: "Resiliência do tecido", body: "Tendão, osso e músculo toleram mais impacto antes de reclamar." },
        { h: "Durabilidade", body: "Você chega ao quilômetro 32 com a técnica que tinha no 10." }
      ],
      notWatts: "O que a força <strong>não</strong> te dá é mais potência aeróbica. Você vai ler o contrário em muitos lugares. Levantar peso não sobe seu VO2máx nem seu limiar: isso quem sobe é correr. A força faz o motor que você já tem durar mais e custar menos.",
      phasesTitle: "Como se organiza um bloco de 12 semanas",
      phaseCols: ["Fase", "4 semanas", "Dose"],
      phases: [
        { n: "1", h: "Tolerância do tecido", d: "2 vezes por semana · 6–10 repetições · RIR 3" },
        { n: "2", h: "Força máxima", d: "3–5 séries × 3–5 repetições · ≥85% · 3–5 min de descanso" },
        { n: "3", h: "Potência", d: "2–5 repetições · 30–65% · máxima intenção · pare quando a velocidade cair" }
      ],
      blockNote: "Cada fase de quatro semanas são três de carga e uma leve. Se você tem 50 anos ou mais: duas de carga e uma leve, igual aos blocos de resistência.",
      noHyperTitle: "Sem fase de hipertrofia, de propósito",
      noHyper: "Quase todos os programas de força abrem com quatro semanas de hipertrofia. Este não. A massa acrescentada é um custo direto em watts por quilo e em economia de corrida, e o corredor está numa categoria de peso — só que ele mesmo se colocou nela. Um bloco real de hipertrofia existe como decisão de baixa temporada, tomada de propósito e assumindo o custo. Não como ponto de partida.",
      maintTitle: "Manutenção",
      maint: "Uma sessão por semana sustenta a força durante semanas, desde que a carga siga alta e o volume caia. O erro clássico da semana de prova é exatamente o contrário: baixar o peso e manter as séries. Isso não mantém nada e ainda te custa frescor."
    },

    s6: {
      kicker: "06",
      h2: "Quatro erros",
      errors: [
        { h: "Começar pela hipertrofia", body: "É a abertura padrão de quase todo programa de academia e é a errada para você. Você ganha massa que depois tem que carregar a cada passada." },
        { h: "Pernas pesadas no dia anterior à qualidade", body: "A sessão de qualidade é a que produz a adaptação da semana. Chegar nela com as pernas de ontem a transforma numa sessão medíocre e em fadiga que não comprou nada." },
        { h: "Manter baixando o peso", body: "Na semana de prova se baixa o volume e se mantém a carga. Fazer o contrário — mesmo número de séries com metade do peso — não mantém a força e ainda te deixa cansado." },
        { h: "Abandonar a academia quando o volume de corrida sobe", body: "O mais comum e o mais caro. Justamente quando você faz mais quilômetros, mais impacto o tecido absorve e mais ele precisa — e é exatamente o momento em que a maioria para de ir, por falta de tempo." }
      ]
    },

    s7: {
      kicker: "07",
      h2: "Se algo dói",
      rules: [
        { k: "Durante", v: "Desconforto de 1 a 3 em 10 é aceitável. Acima de 4, ou se mudar o seu jeito de correr, pare." },
        { k: "O teste real", v: "A manhã seguinte. Igual ou melhor que antes de treinar. Se estiver pior, a dose foi demais." },
        { k: "Se estiver pior", v: "Reduza a amplitude ou a carga antes de reduzir a frequência." }
      ],
      flagsTitle: "Quando isto não é a sua rotina, é uma consulta",
      flags: [
        "Inchaço, calor ou vermelhidão na região.",
        "O joelho trava ou falseia.",
        "Dor à noite, em repouso.",
        "Dor que começou depois de um impacto ou de uma torção.",
        "Um estalo súbito com incapacidade de empurrar ou de ficar na ponta dos pés: isso é no mesmo dia, não na semana que vem."
      ],
      disclaimer: "Não sou médico e não diagnostico. Quando algo entra nessa lista, o que cabe é um profissional que possa te examinar, não uma rotina genérica. O que eu posso fazer enquanto isso é redistribuir a sua carga para o que não dói, que costuma ser a diferença entre parar seis semanas e não parar."
    },

    cta: {
      headline: "Você já sabe onde a força entra na sua semana.<br>Falta a semana estar escrita.",
      lead: "Estas peças funcionam quando estão sequenciadas — duas sessões de qualidade, o resto leve, e uma progressão que muda conforme o mês da sua preparação. Duas formas de fazer isso acontecer.",
      perMonth: "/mês",
      allAccess: {
        tag: "Recomendado",
        name: "Assinatura All-Access",
        body: "Todo o catálogo de planos com as semanas já sequenciadas, mais a biblioteca de ferramentas: as rotinas de Aquiles e de joelhos que aparecem neste guia, ativação, mobilidade, recuperação e as calculadoras.",
        bullets: [
          "Planos de corrida, ciclismo, triatlo e HYROX",
          "TrainingPeaks Premium incluído",
          "A biblioteca completa de ferramentas e guias",
          "Sem fidelidade — você cancela quando quiser"
        ],
        button: "Começar com All-Access"
      },
      coaching: {
        tag: "Se preferir que a gente decida junto",
        name: "Treinamento 1:1",
        body: "Um plano escrito para você e revisado toda semana. Ajustes quando a vida entra no meio, análise das suas sessões e WhatsApp direto.",
        button: "Ver como funciona"
      },
      foot: "Em dúvida sobre qual serve para você? Me escreva em <a href=\"mailto:coach@triaperformance.com\">coach@triaperformance.com</a> e eu te digo com honestidade qual corresponde — inclusive se for nenhum."
    },

    prices: { allAccess: "29,99", coaching: "149" },
    links: {
      allAccess: "https://triaperformance.com/pt/all-access/",
      coaching: "https://triaperformance.com/pt/#coaching",
      tool: "https://triaperformance.com/pt/core-do-corredor/"
    },
    labels: { page: "Página", of: "de", tool: "Ferramenta" },

    circuit: [
      { id: "deadbugPress",  name: "Dead bug com pressão isométrica",       role: "Anti-extensão — que a lombar não descole do chão quando o braço e a perna se afastam." },
      { id: "sidePlankKnee", name: "Prancha lateral com joelho ao peito",   role: "Anti-flexão lateral — o glúteo médio impedindo que o quadril livre caia." },
      { id: "plankReach",    name: "Prancha alta com alcance à frente",     role: "Anti-rotação — o tronco resistindo à torção que o balanço dos braços gera." },
      { id: "slBridgeIso",   name: "Ponte unilateral isométrica",           role: "Cadeia posterior — glúteo e isquiotibiais sustentando o quadril em cima de um apoio." },
      { id: "lungeRot",      name: "Afundo reverso com rotação",            role: "Rotação e integração bípede — o tórax girando enquanto a pelve fica parada." },
      { id: "slDeadlift",    name: "Levantamento terra unilateral",         role: "Apoio unipodal — equilíbrio, cadeia posterior e anti-rotação de pé, que é como você corre." }
    ]
  }
};
