/* =========================================================
   Datos de la escudería — fuente única de verdad
   Para añadir una temporada nueva basta con una línea más
   en `seasons`. La temporada en curso se rellena sola desde
   la API pública de F1 (Jolpica) al cargar la página.
   ========================================================= */
window.F1_DATA = {
  team: {
    name: "Aston Martin Aramco Formula One Team",
    base: "Silverstone, Reino Unido",
    chassis: "AMR26",
    powerUnit: "Honda RA626H",
    teamPrincipal: "Adrian Newey",
    technicalChief: "Enrico Cardile",
    chairman: "Lawrence Stroll",
    reserve: "Jak Crawford",
    firstEntry: 2018,
  },

  /* Cantera / Driver Academy. Cada entrada genera su propia tarjeta en la web;
     para añadir un piloto nuevo basta con añadir un objeto aquí.
     Las cifras de temporada se actualizan tras cada cita de su serie; si aún
     no hay dato se muestran como «—» en lugar de inventarlo. */


  /* Momentos que no salen de los resultados (peleas, adelantamientos) y que
     se añaden a mano. `video` es un enlace directo; si falta, la tarjeta
     no lleva botón (nunca se manda al usuario a buscar). */
  /* Vídeos concretos de hitos calculados: clave "año|Gran Premio".
     Solo material de la propia carrera, no análisis ni resúmenes de terceros. */
  momentosVideo: {
    /* 2021 — el primer podio de la era Aston Martin */
    "2021|Azerbaijan":
      "https://www.formula1.com/en/video/2021-azerbaijan-grand-prix-vettel-claims-first-podium-with-aston-martin-in-baku.1701828514483694822",
    /* 2023 — la temporada de los ocho podios */
    "2023|Monaco":
      "https://www.formula1.com/en/video/race-highlights-2023-monaco-grand-prix.1767154702935308839",
    "2023|Dutch":
      "https://www.formula1.com/en/video/the-car-was-alive-alonso-eyeing-win-in-2023-after-another-podium-at-zandvoort.1775402632265805193",
    "2023|United States":
      "https://www.formula1.com/en/video/race-highlights-2023-united-states-grand-prix.1780492142037138626",
    "2023|São Paulo":
      "https://www.formula1.com/en/video/2023-sao-paulo-grand-prix-alonso-just-beats-perez-to-the-line-after-thrilling-battle-for-p3.1781753269483100530",
    "2023|Las Vegas":
      "https://www.formula1.com/en/video/race-highlights-2023-las-vegas-grand-prix.1782983216069533007",
    /* tarjeta de temporada: la clave lleva el año y la carrera vacía */
    "2023|":
      "https://www.formula1.com/en/video/formula-1-2023-season-montage.1783825142320650642",
    /* 2024 y 2025 */
    "2024|Chinese":
      "https://www.formula1.com/en/video/dhl-fastest-lap-award-2024-chinese-grand-prix.1796946743815712140",
    "2025|Dutch":
      "https://www.formula1.com/en/video/race-highlights-2025-dutch-grand-prix.1841986858440849937",
  },

  momentosExtra: [
    {
      tipo: "Adelantamiento",
      año: 2026,
      gp: "Brasil",
      fecha: "2026-11-08",
      stat: "P13",
      titulo: "Alonso pasa a Hamilton por fuera",
      texto:
        "Vuelta 10 en Interlagos, con la pista húmeda: Alonso se empareja con el Ferrari de Hamilton y le gana la posición por el exterior de Ferradura. Una de las maniobras del año.",
      video: "https://www.formula1.com/en/video/2026-sao-paulo-grand-prix-alonso-passes-hamilton-on-the-outside-of-ferradura.1881313840534686693",
    },
    {
      tipo: "Adelantamiento",
      año: 2026,
      gp: "Brasil",
      fecha: "2026-11-08",
      stat: "P12",
      titulo: "Duelo con Albon en el mismo punto",
      texto:
        "Un par de curvas después, el Williams de Albon se lanzó al interior en el mismo sitio. Alonso aguantó y cerró la carrera con otro adelantamiento para el recuerdo.",
      video: "https://www.youtube.com/watch?v=lkb5kqDJYXk&t=284s",
    },
  ],

  academy: [
    {
      nombre: "Mari Boya",
      foto: "boya",
      fotoTemporada: 2026,
      pais: "ESP",
      edad: 22,
      debut: 2026,
      serie: "Fórmula 2",
      equipo: "PREMA",
      rol: "Primer piloto de la Aston Martin Aramco Driver Academy · Fórmula 2 con PREMA",
      bio: "Les (Lleida), 2004. El catalán se convirtió en el primer fichaje de la academia de jóvenes talentos del equipo y en 2026 debuta en Fórmula 2 con PREMA, con la librea verde de Aston Martin. Antes compitió en F3 peleando por el título y en abril de 2026 se subió por primera vez a un GT3, un Vantage de Comtoyou, junto a Lance Stroll y Roberto Merhi en Paul Ricard.",
      temporada: {
        año: 2026,
        pos: 20,
        puntos: 21,
        podios: 0,
        poles: null,
        victorias: 0,
        mejor: 6,
        carreras: 25,
      },
    },
  ],

  /* Histórico. La temporada del año en curso se detecta sola y se
     sincroniza por API; si no existe aquí, se crea automáticamente. */
  seasons: [
    { year: 2021, pos: 7, points: 77, podiums: 1, wins: 0, chassis: "AMR21", drivers: "Vettel · Stroll" },
    { year: 2022, pos: 7, points: 55, podiums: 0, wins: 0, chassis: "AMR22", drivers: "Vettel · Stroll" },
    { year: 2023, pos: 5, points: 280, podiums: 8, wins: 0, chassis: "AMR23", drivers: "Alonso · Stroll" },
    { year: 2024, pos: 5, points: 94, podiums: 0, wins: 0, chassis: "AMR24", drivers: "Alonso · Stroll" },
    { year: 2025, pos: 7, points: 89, podiums: 0, wins: 0, chassis: "AMR25", drivers: "Alonso · Stroll" },
    { year: 2026, pos: 10, points: 7, podiums: 0, wins: 0, chassis: "AMR26", drivers: "Alonso · Stroll", live: true },
  ],

  /* Ficha editorial de cada temporada. Las pestañas y sus paneles se
     generan a partir de aquí: al añadir un año nuevo, se añade su ficha
     y desaparece la necesidad de tocar el HTML. */
  seasonNotes: {
    2027: {
      title: "2027 · AMR27",
      body: [
        "Segunda temporada del ciclo Honda. El AMR27 no es una revolución: es la primera oportunidad real de afinar. Con la unidad de potencia RA627H ya rodada un año completo, el invierno se puede dedicar entero a la aerodinámica, que es donde el equipo se quedó corto en 2026.",
        "Adrian Newey firma su segundo coche en Silverstone con una idea distinta a la del primero: menos carga total y más eficiencia en recta, pensada para circuitos de perfil medio. El objetivo del equipo es instalarse en la zona de puntos de forma regular y dejar de depender de carreras caóticas para sumar.",
        "Los datos de esta ficha se actualizan solos con la API según avance el campeonato; el texto se revisa a mano al cerrar el año.",
      ],
      facts: [
        ["Chasis", "AMR27"],
        ["Motor", "Honda RA627H"],
        ["Pilotos", "Alonso · Stroll"],
        ["Team Principal", "Adrian Newey"],
        ["Reglamento", "Técnico 2026, segundo año"],
      ],
    },
    2026: {
      title: "2026 · AMR26",
      body: [
        "El año del reset. Aston Martin estrena el AMR26 con el motor Honda RA626H, la primera unidad de potencia de la marca japonesa bajo la nueva reglamentación: 50 % eléctrica y 50 % térmica, sin MGU-H y con combustible sostenible.",
        "Adrian Newey asume el rol de Team Principal y firma el primer coche diseñado íntegramente bajo su dirección en Silverstone. El objetivo es recortar la distancia con la zona media y construir la base del próximo ciclo.",
      ],
      facts: [
        ["Chasis", "AMR26"],
        ["Motor", "Honda RA626H"],
        ["Pilotos", "Alonso · Stroll"],
        ["Team Principal", "Adrian Newey"],
      ],
    },
    2025: {
      title: "2025 · AMR25",
      body: [
        "Año de transición. Newey se incorpora en marzo y centra su trabajo en el coche de 2026, mientras el equipo cae a séptimo con 89 puntos en una zona media muy apretada.",
        "Alonso no puntúa hasta Barcelona, pero encadena una segunda mitad de temporada sólida y termina en el top 10 de pilotos. Su quinto puesto en Hungría es el mejor resultado del año. Stroll arranca fuerte con un sexto en Australia.",
      ],
      facts: [
        ["Posición", "7º"],
        ["Puntos", "89"],
        ["Podios", "0"],
        ["Chasis", "AMR25"],
      ],
    },
    2024: {
      title: "2024 · AMR24",
      body: [
        "Quinto en constructores con 94 puntos, pero sin podios. Dan Fallows abandona la dirección técnica a mitad de temporada y el equipo entra en una fase de reorganización.",
        "Alonso suma 70 puntos por 24 de Stroll, con un quinto puesto en Arabia Saudí como mejor resultado. En septiembre llega el anuncio que lo cambia todo: Adrian Newey ficha por Aston Martin.",
      ],
      facts: [
        ["Posición", "5º"],
        ["Puntos", "94"],
        ["Podios", "0"],
        ["Chasis", "AMR24"],
      ],
    },
    2023: {
      title: "2023 · AMR23",
      body: [
        "El año del despegue. Aston Martin termina quinto con 280 puntos y Alonso sube al podio en cinco de las seis primeras carreras. Mónaco estuvo cerca, pero el desarrollo se estancó a mitad de temporada.",
        "Tras un tramo complicado, con dos abandonos de Alonso, el equipo renace en Brasil con un tercer puesto que recuerda su capacidad competitiva.",
      ],
      facts: [
        ["Posición", "5º"],
        ["Puntos", "280"],
        ["Podios", "8"],
        ["Chasis", "AMR23"],
      ],
    },
    2022: {
      title: "2022 · AMR22",
      body: [
        "Curso de reconstrucción: Mike Krack llega a la dirección del equipo, Dan Fallows desde Red Bull y Eric Blandin al frente de la aerodinámica. El AMR22 arranca lejos de los puntos.",
        "La evolución presentada en España cambia la temporada. El equipo cierra séptimo con 55 puntos y despide a Sebastian Vettel, que se retira.",
      ],
      facts: [
        ["Posición", "7º"],
        ["Puntos", "55"],
        ["Podios", "0"],
        ["Chasis", "AMR22"],
      ],
    },
    2021: {
      title: "2021 · AMR21",
      body: [
        "El regreso oficial de la marca no cumple las expectativas: el concepto de bajo rake sufre con el nuevo reglamento y el equipo se queda en la zona media.",
        "Aun así llegan momentos para el recuerdo: la quinta plaza de Vettel en Mónaco y su podio en Bakú. Stroll firma un sexto puesto en Qatar.",
      ],
      facts: [
        ["Posición", "7º"],
        ["Puntos", "77"],
        ["Podios", "1"],
        ["Chasis", "AMR21"],
      ],
    },
  },

  /* Valores de respaldo si la API no responde. */
  fallback: { pos: 10, points: 7, round: 19, podiums: 0, wins: 0 },
};
