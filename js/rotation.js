/* =========================================================
   ROTACIÓN DE TEMPORADA
   - Tema de color según el Gran Premio activo del calendario
   - Foto de portada que cambia cada pocos segundos
   - Fotos del coche / piloto que se renuevan solas
   Todo es determinista (no hay aleatoriedad): mismo día, mismo
   aspecto, y cambia solo al avanzar el calendario.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TEMPORADA_FOTOS = new Date().getFullYear();
  var IMG = "../imgs/" + TEMPORADA_FOTOS + "/";
  /* cada foto sabe en qué carpeta vive: así el cambio de temporada es solo
     tener las imágenes nuevas en imgs/<año>/ */
  var CARPETAS = {};
  function rutaFoto(fichero) {
    var año = CARPETAS[fichero] || TEMPORADA_FOTOS;
    return "../imgs/" + año + "/" + fichero + ".webp";
  }

  /* ---------- 1. Calendario 2026 ----------
     r      = ronda
     start  = domingo de carrera (ISO)
     theme  = paleta (ver estilos/temas.css)
     fotos  = fotos propias de ese GP (si existen en /imgs/2026)  */
  var CAL = [
    { r: 1, gp: "Australia", lugar: "Melbourne", start: "2026-03-08", theme: "oceania", edicion: "Edición del Pacífico", fotos: ["alonso-australia", "stroll-australia"] },
    { r: 2, gp: "China", lugar: "Shanghái", start: "2026-03-15", theme: "asia", edicion: "Edición de Asia", fotos: ["stroll-china", "stroll-china-2"] },
    { r: 3, gp: "Japón", lugar: "Suzuka", start: "2026-03-29", theme: "asia", edicion: "Edición de Asia", fotos: ["alonso-japon", "alonso-japon-2"] },
    { r: 4, gp: "Bahréin", lugar: "Sakhir", start: "2026-04-12", theme: "oriente", edicion: "Edición del desierto" },
    { r: 5, gp: "Arabia Saudí", lugar: "Yeda", start: "2026-04-19", theme: "oriente", edicion: "Edición del desierto" },
    { r: 6, gp: "Miami", lugar: "Miami", start: "2026-05-03", theme: "america", edicion: "Edición americana" },
    { r: 7, gp: "Canadá", lugar: "Montreal", start: "2026-05-24", theme: "america", edicion: "Edición americana" },
    { r: 8, gp: "Mónaco", lugar: "Montecarlo", start: "2026-06-07", theme: "mediterraneo", edicion: "Edición mediterránea" },
    { r: 9, gp: "España", lugar: "Barcelona", start: "2026-06-14", theme: "mediterraneo", edicion: "Edición mediterránea" },
    { r: 10, gp: "Austria", lugar: "Spielberg", start: "2026-06-28", theme: "europa", edicion: "Edición de Europa" },
    { r: 11, gp: "Gran Bretaña", lugar: "Silverstone", start: "2026-07-05", theme: "europa", edicion: "Edición de Europa" },
    { r: 12, gp: "Bélgica", lugar: "Spa", start: "2026-07-19", theme: "europa", edicion: "Edición de Europa" },
    { r: 13, gp: "Hungría", lugar: "Hungaroring", start: "2026-07-26", theme: "mediterraneo", edicion: "Edición mediterránea" },
    { r: 14, gp: "Países Bajos", lugar: "Zandvoort", start: "2026-08-23", theme: "europa", edicion: "Edición de Europa" },
    { r: 15, gp: "Italia", lugar: "Monza", start: "2026-09-06", theme: "mediterraneo", edicion: "Edición mediterránea" },
    { r: 16, gp: "Madrid", lugar: "Madring", start: "2026-09-13", theme: "mediterraneo", edicion: "Edición mediterránea" },
    { r: 17, gp: "Azerbaiyán", lugar: "Bakú", start: "2026-09-27", theme: "oriente", edicion: "Edición del desierto" },
    { r: 18, gp: "Singapur", lugar: "Marina Bay", start: "2026-10-11", theme: "noche", edicion: "Edición nocturna" },
    { r: 19, gp: "Estados Unidos", lugar: "Austin", start: "2026-10-25", theme: "america", edicion: "Edición americana" },
    { r: 20, gp: "México", lugar: "Ciudad de México", start: "2026-11-01", theme: "america", edicion: "Edición americana" },
    { r: 21, gp: "Brasil", lugar: "Interlagos", start: "2026-11-08", theme: "america", edicion: "Edición americana" },
    { r: 22, gp: "Las Vegas", lugar: "Las Vegas", start: "2026-11-21", theme: "noche", edicion: "Edición nocturna" },
    { r: 23, gp: "Catar", lugar: "Lusail", start: "2026-11-29", theme: "noche", edicion: "Edición nocturna" },
    { r: 24, gp: "Abu Dabi", lugar: "Yas Marina", start: "2026-12-06", theme: "noche", edicion: "Edición nocturna" },
  ];

  /* Texto alternativo de cada foto (accesibilidad y SEO).
     Clave = nombre de fichero sin extensión dentro de /imgs/2026. */
  var ALT = {
    "alonso-japon": "Fernando Alonso con el Aston Martin AMR26 en el Gran Premio de Japón",
    "alonso-japon-2": "Alonso saliendo del box con el AMR26 en Suzuka",
    "alonso-australia": "Alonso con el AMR26 en el Gran Premio de Australia",
    "alonso": "Retrato de Fernando Alonso con el mono de Aston Martin 2026",
    "stroll-australia": "Lance Stroll con el Aston Martin AMR26 en Australia",
    "stroll-china": "Lance Stroll con el AMR26 en el Gran Premio de China",
    "stroll-china-2": "Stroll en pista durante el fin de semana de Shanghái",
    "stroll": "Retrato de Lance Stroll con el mono de Aston Martin 2026",
    "amr26": "Aston Martin AMR26, monoplaza de la temporada 2026",
    "boya": "Mari Boya, piloto de la Aston Martin Driver Academy",
  };

  function altDe(nombre, porDefecto) {
    return ALT[nombre] || porDefecto || "Aston Martin AMR26 en pista";
  }

  /* Pools de fotos para la portada y para la ficha del coche.
     Para enriquecer la rotación basta con añadir aquí un nombre
     de fichero que exista en /imgs/2026. */
  var PORTADA_GENERICA = ["alonso-japon", "alonso-australia", "stroll-australia", "amr26"];
  var COCHE = [
    "amr26",
    "alonso-japon",
    "stroll-china",
    "alonso-australia",
    "stroll-australia",
    "alonso-japon-2",
    "stroll-china-2",
  ];

  /* Paleta y etiqueta de cada circuito. Se usa sobre el calendario que
     devuelve la API, así que sirve para cualquier temporada. */
  var CIRCUITOS = {
    albert_park: { tema: "oceania", edicion: "Edición del Pacífico" },
    shanghai: { tema: "asia", edicion: "Edición de Asia" },
    suzuka: { tema: "asia", edicion: "Edición de Asia" },
    bahrain: { tema: "oriente", edicion: "Edición del desierto" },
    jeddah: { tema: "oriente", edicion: "Edición del desierto" },
    miami: { tema: "america", edicion: "Edición americana" },
    villeneuve: { tema: "america", edicion: "Edición americana" },
    monaco: { tema: "mediterraneo", edicion: "Edición mediterránea" },
    catalunya: { tema: "mediterraneo", edicion: "Edición mediterránea" },
    madring: { tema: "mediterraneo", edicion: "Edición mediterránea" },
    red_bull_ring: { tema: "europa", edicion: "Edición de Europa" },
    silverstone: { tema: "europa", edicion: "Edición de Europa" },
    spa: { tema: "europa", edicion: "Edición de Europa" },
    hungaroring: { tema: "mediterraneo", edicion: "Edición mediterránea" },
    zandvoort: { tema: "europa", edicion: "Edición de Europa" },
    monza: { tema: "mediterraneo", edicion: "Edición mediterránea" },
    baku: { tema: "oriente", edicion: "Edición del desierto" },
    marina_bay: { tema: "noche", edicion: "Edición nocturna" },
    americas: { tema: "america", edicion: "Edición americana" },
    rodriguez: { tema: "america", edicion: "Edición americana" },
    interlagos: { tema: "america", edicion: "Edición americana" },
    vegas: { tema: "noche", edicion: "Edición nocturna" },
    losail: { tema: "noche", edicion: "Edición nocturna" },
    yas_marina: { tema: "noche", edicion: "Edición nocturna" },
  };

  /* Si aparece un circuito nuevo, la paleta se decide por país. */
  var PAISES = {
    Australia: { tema: "oceania", edicion: "Edición del Pacífico" },
    China: { tema: "asia", edicion: "Edición de Asia" },
    Japan: { tema: "asia", edicion: "Edición de Asia" },
    Singapore: { tema: "noche", edicion: "Edición nocturna" },
    Bahrain: { tema: "oriente", edicion: "Edición del desierto" },
    "Saudi Arabia": { tema: "oriente", edicion: "Edición del desierto" },
    Azerbaijan: { tema: "oriente", edicion: "Edición del desierto" },
    Qatar: { tema: "noche", edicion: "Edición nocturna" },
    "United Arab Emirates": { tema: "noche", edicion: "Edición nocturna" },
    "United States": { tema: "america", edicion: "Edición americana" },
    Canada: { tema: "america", edicion: "Edición americana" },
    Mexico: { tema: "america", edicion: "Edición americana" },
    Brazil: { tema: "america", edicion: "Edición americana" },
    Spain: { tema: "mediterraneo", edicion: "Edición mediterránea" },
    Monaco: { tema: "mediterraneo", edicion: "Edición mediterránea" },
    Italy: { tema: "mediterraneo", edicion: "Edición mediterránea" },
    Hungary: { tema: "mediterraneo", edicion: "Edición mediterránea" },
    France: { tema: "europa", edicion: "Edición de Europa" },
    Germany: { tema: "europa", edicion: "Edición de Europa" },
    Austria: { tema: "europa", edicion: "Edición de Europa" },
    Belgium: { tema: "europa", edicion: "Edición de Europa" },
    Netherlands: { tema: "europa", edicion: "Edición de Europa" },
    "United Kingdom": { tema: "europa", edicion: "Edición de Europa" },
  };

  /* ---------- 2. GP activo y siguiente ---------- */
  function hoy() {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }

  function fecha(iso) {
    var p = iso.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0, 0);
  }

  function gpActivo(d) {
    var activo = null;
    var siguiente = null;
    for (var i = 0; i < CAL.length; i++) {
      var f = fecha(CAL[i].start);
      if (f <= d) activo = CAL[i];
      else if (!siguiente) siguiente = CAL[i];
    }
    if (!activo) activo = CAL[0];
    return { activo: activo, siguiente: siguiente };
  }

  var info = gpActivo(hoy());
  var gp = info.activo;

  /* Solo se viste de GP el fin de semana de carrera: del jueves previo
     al lunes siguiente. El resto del calendario la web vuelve a sus
     estilos originales de marca. */
  function enFinDeSemana(g) {
    if (!g) return false;
    var carrera = fecha(g.start);
    var desde = new Date(carrera);
    desde.setDate(desde.getDate() - 3);
    var hasta = new Date(carrera);
    hasta.setDate(hasta.getDate() + 1);
    hasta.setHours(23, 59, 0, 0);
    var ahora = new Date();
    return ahora >= desde && ahora <= hasta;
  }

  var enCarrera = enFinDeSemana(gp);

  /* ---------- 3. Tema ---------- */
  if (enCarrera && gp && gp.theme) root.setAttribute("data-theme", gp.theme);
  else root.removeAttribute("data-theme");

  function pintarChip() {
    if (!chipNombre || !chipEl) return;
    if (enCarrera) {
      chipNombre.textContent = "GP de " + (gp.gp === gp.lugar ? gp.gp : gp.gp + " · " + gp.lugar);
      if (chipEdicion) chipEdicion.textContent = gp.edicion || "";
      chipEl.classList.remove("is-between");
      if (chipCount) chipCount.style.display = "";
    } else {
      var sig = info.siguiente;
      if (sig) {
        var dias = Math.round((fecha(sig.start) - hoy()) / 86400000);
        chipNombre.textContent =
          "Próximo GP · " + (sig.gp === sig.lugar ? sig.gp : sig.gp + " · " + sig.lugar);
        if (chipEdicion) chipEdicion.textContent = dias <= 0 ? "esta semana" : "en " + dias + " días";
      } else {
        chipNombre.textContent = "Temporada " + gp.start.slice(0, 4) + " · finalizada";
        if (chipEdicion) chipEdicion.textContent = "balance completo";
      }
      chipEl.classList.add("is-between");
      if (chipCount) chipCount.style.display = "none";
    }
  }

  /* ---------- 3b. Calendario real desde la API ----------
     Si responde, sustituye el calendario local: así el chip, la paleta y
     el «próximo GP» funcionan también la temporada que viene. */
  (function cargarCalendario() {
    var añoActual = new Date().getFullYear();
    fetch("https://api.jolpi.ca/ergast/f1/" + añoActual + ".json", {
      headers: { Accept: "application/json" },
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var carreras = j && j.MRData && j.MRData.RaceTable && j.MRData.RaceTable.Races;
        if (!carreras || !carreras.length) return;

        var nuevo = carreras.map(function (r) {
          var cid = r.Circuit.circuitId;
          var mapa =
            CIRCUITOS[cid] ||
            PAISES[r.Circuit.Location.country] ||
            { tema: "europa", edicion: "Edición de Europa" };
          var nombre = r.raceName.replace(/ Grand Prix$/, "");
          var fotosGp = [];
          for (var i = 0; i < CAL.length; i++) {
            if (CAL[i].gp === nombre) { fotosGp = CAL[i].fotos || []; break; }
          }
          return {
            r: Number(r.round),
            gp: nombre,
            lugar: r.Circuit.Location.locality,
            start: r.date,
            theme: mapa.tema,
            edicion: mapa.edicion,
            fotos: fotosGp,
          };
        });

        if (!nuevo.length) return;
        CAL.length = 0;
        Array.prototype.push.apply(CAL, nuevo);

        info = gpActivo(hoy());
        gp = info.activo;
        enCarrera = enFinDeSemana(gp);
        if (enCarrera && gp.theme) root.setAttribute("data-theme", gp.theme);
        else root.removeAttribute("data-theme");
        pintarChip();
      })
      .catch(function () { /* se queda el calendario local */ });
  })();

  /* ---------- 4. Portada: rotación con fundido ---------- */
  var heroImg = document.querySelector(".hero-media img");
  var pool = (gp && gp.fotos && gp.fotos.length ? gp.fotos : PORTADA_GENERICA).slice();
  var poolIdx = 0;
  var chipCount = null;
  var chipNombre = null;
  var chipEdicion = null;
  var chipEl = null;

  function pintarContador() {
    if (chipCount) chipCount.textContent = poolIdx + 1 + " / " + pool.length;
  }

  function cambiarPortada() {
    /* si la portada está en vídeo, las fotos no rotan */
    if (document.body.classList.contains("con-video")) return;
    if (!heroImg || pool.length < 2) return;
    poolIdx = (poolIdx + 1) % pool.length;
    var nueva = rutaFoto(pool[poolIdx]);
    var pre = new Image();

    pre.onload = function () {
      if (reduce) {
        heroImg.src = nueva;
        heroImg.alt = altDe(pool[poolIdx]);
        pintarContador();
        return;
      }
      heroImg.classList.add("is-swapping");
      setTimeout(function () {
        heroImg.src = nueva;
        heroImg.alt = altDe(pool[poolIdx]);
        heroImg.classList.remove("is-swapping");
        pintarContador();
      }, 260);
    };
    pre.onerror = function () {
      /* si la foto no existe, se salta sin romper nada */
      pool.splice(poolIdx, 1);
      if (pool.length) cambiarPortada();
    };
    pre.src = nueva;
  }

  /* ---------- 5. Chip del GP activo en la portada ---------- */
  var heroContent = document.querySelector(".hero-content");
  if (heroContent && gp) {
    var chip = document.createElement("p");
    chip.className = "gp-chip hero-anim";
    chip.setAttribute("style", "--d: 0.55s");

    var dot = document.createElement("span");
    dot.className = "gp-dot";
    dot.setAttribute("aria-hidden", "true");

    var nombre = document.createElement("span");
    nombre.className = "gp-name";

    var sep = document.createElement("span");
    sep.className = "gp-sep";
    sep.textContent = "·";
    sep.setAttribute("aria-hidden", "true");

    var edicion = document.createElement("span");
    edicion.className = "gp-edition";

    chipCount = document.createElement("span");
    chipCount.className = "gp-count";
    chipCount.textContent = "1 / " + pool.length;

    /* En fin de semana de carrera: el GP y su edición.
       Fuera de él: cuánto queda para el siguiente. */
    chipNombre = nombre;
    chipEdicion = edicion;
    chipEl = chip;
    pintarChip();

    chip.appendChild(dot);
    chip.appendChild(nombre);
    chip.appendChild(sep);
    chip.appendChild(edicion);
    chip.appendChild(chipCount);

    var ancla = heroContent.querySelector(".hero-title");
    if (ancla && ancla.parentNode) ancla.parentNode.insertBefore(chip, ancla);
    else heroContent.appendChild(chip);
  }

  /* ---------- 6. Fotos del coche ----------
     La banda grande de Monoplaza es solo del coche: nunca un piloto.
     Si hay más de una panorámica, alterna; con una sola, se queda fija.
     La ficha técnica sí alterna entre fotos de pista (coche en acción). */
  var PANORAMICA = ["amr26"];
  var band = document.querySelector(".car-band img");
  var split = document.querySelector(".split-media:not(.split-media-tec) img");
  var carImgs = split ? [split] : [];
  var panIdx = 0;

  function pintarBand() {
    if (!band || PANORAMICA.length < 2) return;
    panIdx = (panIdx + 1) % PANORAMICA.length;
    var ruta = rutaFoto(PANORAMICA[panIdx]);
    var pre = new Image();
    pre.onload = function () {
      band.style.transition = "opacity 0.6s ease";
      band.style.opacity = "0";
      setTimeout(function () {
        band.src = ruta;
        band.alt = altDe(PANORAMICA[panIdx], band.alt);
        band.style.opacity = "1";
      }, 220);
    };
    pre.src = ruta;
  }

  /* arranque determinista por día, para que no sea siempre la misma */
  var dia = Math.floor(Date.now() / 86400000);
  /* la ficha técnica no repite la panorámica de la banda */
  function poolAccion() {
    var p = COCHE.filter(function (f) {
      return PANORAMICA.indexOf(f) === -1;
    });
    return p.length ? p : COCHE;
  }

  var ACCION = poolAccion();
  var carIdx = ACCION.indexOf(gp && gp.fotos && gp.fotos[0]) >= 0 ? 0 : dia % ACCION.length;

  function pintarCoche() {
    carImgs.forEach(function (img, n) {
      var idx = (carIdx + n * 3) % ACCION.length;
      var ruta = rutaFoto(ACCION[idx]);
      var pre = new Image();
      pre.onload = function () {
        img.style.transition = "opacity 0.6s ease";
        img.style.opacity = "0";
        setTimeout(function () {
          img.src = ruta;
          img.alt = altDe(ACCION[idx], img.alt);
          img.style.opacity = "1";
        }, 220);
      };
      pre.src = ruta;
    });
    carIdx = (carIdx + 1) % ACCION.length;
  }

  /* solo rota cuando la sección está a la vista */
  var visible = false;
  if (typeof IntersectionObserver === "function" && carImgs.length) {
    var io = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) visible = true;
        });
      },
      { threshold: 0.05 }
    );
    carImgs.forEach(function (img) {
      if (img.parentNode) io.observe(img.parentNode);
    });
  } else {
    visible = true;
  }

  /* ---------- 7. Arranque ----------
     Ritmo pausado y solo mientras la portada está a la vista: si el
     visitante baja, la rotación se detiene. */
  function portadaALaVista() {
    return window.scrollY < window.innerHeight * 0.9;
  }

  /* La rotación funciona siempre: si el sistema pide movimiento reducido,
     solo se quita el fundido, no el cambio de foto. */
  if (pool.length > 1) {
    setInterval(function () {
      if (portadaALaVista()) cambiarPortada();
    }, 10000);
  }
  if (band) {
    /* la lista de panorámicas llega con el manifiesto, así que se comprueba
       dentro del intervalo y no al arrancar */
    setInterval(function () {
      if (PANORAMICA.length > 1 && portadaALaVista()) pintarBand();
    }, 15000);
  }
  if (carImgs.length) {
    setInterval(function () {
      if (visible) pintarCoche();
    }, 26000);
  }

  /* ---------- 8. Ciclo de vida de las fotos (imgs/fotos.json) ----------
     Rota primero con el material reciente y va retirando de portada y
     ficha del coche las fotos que superan `vigente_dias`. La galería
     conserva el histórico: nada se borra, solo deja de promocionarse. */
  var VIDA_POR_DEFECTO = 240;
  var VETADAS = []; /* fotos excluidas a mano: rivales, encuadres malos… */

  function antiguedad(alta) {
    return (Date.now() - Date.parse(alta + "T12:00:00")) / 86400000;
  }

  /* Reparte las fotos por protagonista para que no salga siempre el
     mismo piloto: Alonso → Stroll → coche → Alonso… */
  function intercalar(lista) {
    var alonso = [], stroll = [], coche = [];
    lista.forEach(function (f) {
      if (/alonso/i.test(f)) alonso.push(f);
      else if (/stroll/i.test(f)) stroll.push(f);
      else coche.push(f);
    });
    var salida = [];
    while (alonso.length || stroll.length || coche.length) {
      if (alonso.length) salida.push(alonso.shift());
      if (stroll.length) salida.push(stroll.shift());
      if (coche.length) salida.push(coche.shift());
    }
    return salida;
  }

  function vigentes(lista, maxDias) {
    if (!lista || !lista.length) return [];
    lista = lista.filter(function (f) {
      return VETADAS.indexOf(f.file) === -1;
    });
    var orden = lista.slice().sort(function (a, b) {
      return Date.parse(b.alta) - Date.parse(a.alta);
    });
    var ok = orden.filter(function (f) {
      return antiguedad(f.alta) <= maxDias;
    });
    /* la rotación nunca se queda sin material */
    return ok.length >= 2 ? ok : orden.slice(0, Math.min(3, orden.length));
  }

  function aplicarManifiesto(m) {
    if (!m || !m.grupos) return;
    var maxDias = (m.vida && m.vida.vigente_dias) || VIDA_POR_DEFECTO;
    VETADAS = Array.isArray(m.vetadas) ? m.vetadas : [];
    Object.keys(m.grupos).forEach(function (g) {
      (m.grupos[g] || []).forEach(function (f) {
        if (f && f.file) CARPETAS[f.file] = f.temporada || TEMPORADA_FOTOS;
      });
    });

    /* solo las 6 más recientes: cuando llega material nuevo, las viejas
       salen del pool y no vuelven a aparecer */
    var p = intercalar(
      vigentes(m.grupos.portada, maxDias)
        .slice(0, 6)
        .map(function (f) {
          return f.file;
        })
    );
    var c = intercalar(vigentes(m.grupos.coche, maxDias).map(function (f) {
      return f.file;
    }));

    if (p.length) {
      pool.length = 0;
      Array.prototype.push.apply(pool, p);
      /* cada día empieza por una foto distinta: no siempre el mismo piloto */
      poolIdx = dia % pool.length;
      pintarContador();
    }
    if (c.length) {
      COCHE.length = 0;
      Array.prototype.push.apply(COCHE, c);
      carIdx = 0;
    }

    /* panorámicas del coche: manda la más reciente y no entra ningún piloto */
    var pan = vigentes(m.grupos.panoramica || [], 3650).map(function (f) {
      return f.file;
    });
    if (pan.length) {
      PANORAMICA.length = 0;
      Array.prototype.push.apply(PANORAMICA, pan);
      if (band) {
        band.src = rutaFoto(PANORAMICA[0]);
        band.alt = altDe(PANORAMICA[0], band.alt);
        panIdx = 0;
      }
    }

    /* recalculado con el manifiesto ya aplicado: la ficha técnica nunca
       puede repetir la panorámica que se ve en la banda grande */
    ACCION = poolAccion();
    carIdx = 0;
    if (carImgs.length) pintarCoche();
  }

  if (window.fetch) {
    fetch("../fotos.json", { headers: { Accept: "application/json" } })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(aplicarManifiesto)
      .catch(function () {
        /* sin manifiesto se usan los pools de reserva de arriba */
      });
  }

  /* expuesto para depurar desde la consola */
  window.AMF1_ROTACION = {
    gp: gp,
    siguiente: info.siguiente,
    tema: gp.theme,
    poolPortada: pool,
    probar: aplicarManifiesto, /* permite simular antigüedad desde la consola */
  };
})();
