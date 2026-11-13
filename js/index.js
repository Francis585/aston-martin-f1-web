/* =========================================================
   ASTON MARTIN F1 TEAM — interacciones
   ========================================================= */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Header, progreso y botón subir ---------- */
  const header = $("#siteHeader");
  const progress = $("#scrollProgress");
  const toTop = $("#toTop");

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle("is-scrolled", y > 24);
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 1b. Parallax suave ---------- */
  const heroImg = $(".hero-media img");
  const splitImgs = $$(".split-media img");
  let ticking = false;

  function parallax() {
    const y = window.scrollY;

    if (heroImg && y < window.innerHeight * 1.3) {
      heroImg.style.transform =
        "scale(1.08) translate3d(0," + y * 0.16 + "px,0)";
    }

    splitImgs.forEach((img) => {
      const rect = img.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.05;
      img.style.transform = "translate3d(0," + offset + "px,0) scale(1.06)";
    });

    ticking = false;
  }

  if (!reduceMotion && (heroImg || splitImgs.length)) {
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(parallax);
      },
      { passive: true }
    );
    parallax();
  }

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- 2. Menú móvil ---------- */
  const navToggle = $("#navToggle");
  const navLinks = $("#navLinks");

  function closeNav() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menú");
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });

    $$("a", navLinks).forEach((a) => a.addEventListener("click", closeNav));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- 3. Reveal al hacer scroll ---------- */
  const revealItems = $$(".reveal");

  if (revealItems.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const siblings = Array.from(el.parentElement.children).filter((n) =>
              n.classList.contains("reveal")
            );
            const index = Math.max(0, siblings.indexOf(el));
            el.style.transitionDelay = Math.min(index * 70, 350) + "ms";
            el.classList.add("is-visible");
            io.unobserve(el);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );

      revealItems.forEach((el) => io.observe(el));
    }
  }

  /* ---------- 4. Contadores ---------- */
  const counters = $$("[data-count]");

  function animateCounter(el) {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (!Number.isFinite(target)) return;

    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }

    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (counters.length && "IntersectionObserver" in window) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          co.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => co.observe(el));
  } else {
    counters.forEach((el) => {
      el.textContent = el.dataset.count + (el.dataset.suffix || "");
    });
  }

  /* ---------- 4b. Datos de temporadas y sincronización ---------- */
  const DATA = window.F1_DATA;
  const currentYear = new Date().getFullYear();

  $$("[data-year]").forEach((el) => {
    el.textContent = currentYear;
  });

  /* Datos de temporada: se cambian una vez al año en js/f1-data.js */
  if (DATA && DATA.team) {
    const bind = (attr, value) => {
      if (!value) return;
      $$("[" + attr + "]").forEach((el) => {
        el.textContent = value;
      });
    };
    bind("data-chassis", DATA.team.chassis);
    bind("data-power-unit", DATA.team.powerUnit);
    bind("data-team-principal", DATA.team.teamPrincipal);
    bind("data-technical-chief", DATA.team.technicalChief);
  }

  /* Devuelve la temporada del año actual, creándola si aún no existe.
     Así la tabla gana una fila nueva sola cada 1 de enero. */
  function getLiveSeason() {
    let season = DATA.seasons.find((s) => s.year === currentYear);
    if (!season) {
      season = {
        year: currentYear,
        pos: null,
        points: null,
        podiums: null,
        wins: null,
        chassis: "—",
        drivers: "—",
      };
      DATA.seasons.push(season);
    }
    return season;
  }

  function renderSeasons() {
    const body = $("#seasonsBody");
    if (!body || !DATA) return;

    const VISIBLE = 4;
    const rows = DATA.seasons.slice().sort((a, b) => b.year - a.year);

    body.innerHTML = rows
      .map(
        (s, i) =>
          "<tr" +
          (s.year === currentYear ? ' class="is-live"' : "") +
          (i >= VISIBLE ? ' data-extra="1"' : "") +
          "><td>" +
          s.year +
          (s.year === currentYear ? ' <span class="row-live">en curso</span>' : "") +
          "</td><td>" +
          s.drivers +
          "</td><td>" +
          s.chassis +
          "</td><td>" +
          (s.pos != null ? s.pos + "º" : "—") +
          "</td><td>" +
          (s.podiums != null ? s.podiums : "—") +
          "</td><td>" +
          (s.points != null ? s.points : "—") +
          "</td></tr>"
      )
      .join("");

    const btn = $("#seasonsMore");
    if (!btn) return;

    const extra = rows.length - VISIBLE;
    if (extra > 0) {
      btn.hidden = false;
      btn.textContent = "Ver todas las temporadas (" + rows.length + ")";
      btn.setAttribute("aria-expanded", "false");
      body.classList.remove("is-expanded");
    } else {
      btn.hidden = true;
    }
  }

  function paintLive(season, round) {
    const set = (key, value) => {
      $$('[data-live="' + key + '"]').forEach((el) => {
        el.textContent = value;
      });
    };

    set("pos", season.pos != null ? "P" + season.pos : "—");
    set("points", season.points != null ? season.points : "—");
    set("round", round != null ? round : "—");
    set("podiums", season.podiums != null ? season.podiums : "—");
    set("best", season.best != null ? "P" + season.best : "—");
    set("wins", season.wins != null ? season.wins : "—");
  }

  /* Resultados completos de la temporada en UNA sola petición.
     Devuelve, por ronda: mejor puesto de Aston Martin, puntos, ganador
     y posiciones de Alonso y Stroll. Se cachea 2 h en sessionStorage. */
  async function fetchSeasonResults(year) {
    const key = "astonSeasonResults_" + year + "_v4";

    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const o = JSON.parse(raw);
        if (o && Date.now() - o.t < 7200000) return o.d;
      }
    } catch (e) {
      /* almacenamiento no disponible */
    }

    /* La API pagina los resultados de 100 en 100: hay que recorrer
       todas las páginas y fusionar las carreras por ronda. */
    let offset = 0;
    let total = Infinity;
    const rawRaces = [];

    while (offset < total && offset < 2000) {
      const res = await fetch(
        "https://api.jolpi.ca/ergast/f1/" +
          year +
          "/results.json?limit=100&offset=" +
          offset,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("HTTP " + res.status);

      const json = await res.json();
      const md = json && json.MRData;
      if (!md || !md.RaceTable) break;

      total = Number(md.total) || 0;
      rawRaces.push.apply(rawRaces, md.RaceTable.Races || []);
      offset += 100;
    }

    /* Una carrera puede quedar partida entre dos páginas. */
    const merged = new Map();
    rawRaces.forEach((race) => {
      const key = Number(race.round);
      if (!merged.has(key)) {
        merged.set(key, { round: key, raceName: race.raceName, Results: [] });
      }
      merged.get(key).Results.push.apply(
        merged.get(key).Results,
        race.Results || []
      );
    });

    const races = Array.from(merged.values());

    let podiums = 0;
    let wins = 0;
    const byRound = {};

    races.forEach((race) => {
      const round = Number(race.round);
      const results = race.Results || [];

      const aston = results.filter(
        (r) => r.Constructor && r.Constructor.constructorId === "aston_martin"
      );
      const valid = aston
        .map((r) => Number(r.position))
        .filter((n) => Number.isFinite(n) && n > 0);

      valid.forEach((p) => {
        if (p >= 1 && p <= 3) podiums += 1;
        if (p === 1) wins += 1;
      });

      const fullName = (r) => r.Driver.givenName + " " + r.Driver.familyName;

      const winner = results.find((r) => Number(r.position) === 1);
      const alo = results.find((r) => r.Driver && r.Driver.driverId === "alonso");
      const str = results.find((r) => r.Driver && r.Driver.driverId === "stroll");

      const podium = results
        .filter((r) => {
          const p = Number(r.position);
          return p >= 1 && p <= 3;
        })
        .sort((a, b) => Number(a.position) - Number(b.position))
        .map((r) => ({
          pos: Number(r.position),
          name: fullName(r),
          team: r.Constructor ? r.Constructor.name : "",
        }));

      const fastest = results.find(
        (r) => r.FastestLap && r.FastestLap.rank === "1"
      );

      const detail = (r) =>
        r
          ? {
              pos: Number(r.position) || null,
              grid: Number(r.grid) || null,
              points: parseFloat(r.points) || 0,
              status: r.status || "",
              laps: Number(r.laps) || null,
              fastest: !!(r.FastestLap && r.FastestLap.rank === "1"),
            }
          : null;

      byRound[round] = {
        best: valid.length ? Math.min.apply(null, valid) : null,
        pts: aston.reduce((a, r) => a + (parseFloat(r.points) || 0), 0),
        winner: winner ? fullName(winner) : "",
        winnerTeam: winner && winner.Constructor ? winner.Constructor.name : "",
        alo: alo ? Number(alo.position) : null,
        str: str ? Number(str.position) : null,
        podium: podium,
        fastest: fastest
          ? {
              name: fullName(fastest),
              time: fastest.FastestLap.Time
                ? fastest.FastestLap.Time.time
                : "",
              lap: fastest.FastestLap.lap || "",
            }
          : null,
        aloDetail: detail(alo),
        strDetail: detail(str),
        laps: results.length ? Number(results[0].laps) || null : null,
      };
    });

    const out = { podiums, wins, byRound };

    try {
      sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: out }));
    } catch (e) {
      /* cuota llena o modo privado */
    }

    return out;
  }

  async function syncLiveSeason() {
    if (!DATA) return;
    const live = getLiveSeason();
    const syncEl = $("#liveSync");

    paintLive(live, DATA.fallback.round);

    try {
      const res = await fetch(
        "https://api.jolpi.ca/ergast/f1/" + currentYear + "/constructorstandings.json",
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("HTTP " + res.status);

      const json = await res.json();
      const list =
        json &&
        json.MRData &&
        json.MRData.StandingsTable &&
        json.MRData.StandingsTable.StandingsLists &&
        json.MRData.StandingsTable.StandingsLists[0];

      if (!list) throw new Error("sin datos");

      const row = list.ConstructorStandings.find(
        (x) => x.Constructor.constructorId === "aston_martin"
      );
      if (!row) throw new Error("sin fila");

      live.pos = Number(row.position);
      live.points = Number(row.points);
      live.wins = Number(row.wins);
      live.round = Number(list.round);

      try {
        const extra = await fetchSeasonResults(currentYear);
        live.podiums = extra.podiums;
        live.wins = extra.wins;
        resultsByRound = extra.byRound || {};
        paintDriverHover();
        if (racesCache.length) renderLastRace(racesCache);

        /* Mejor puesto del equipo en toda la temporada */
        const bests = Object.keys(resultsByRound)
          .map((k) => resultsByRound[k].best)
          .filter((n) => n != null);
        if (bests.length) live.best = Math.min.apply(null, bests);

        if (racesCache.length) renderCircuitGallery(racesCache);
      } catch (e) {
        /* si falla, se mantiene el valor del fichero de datos */
      }

      paintLive(live, list.round);
      renderSeasons();

      if (syncEl) {
        syncEl.textContent =
          "Sincronizado · " + new Date().toLocaleDateString("es-ES");
      }
    } catch (err) {
      paintLive(live, DATA.fallback.round);
      if (syncEl) syncEl.textContent = "Datos locales · API no disponible";
    }
  }

  /* Pestañas y paneles de temporada generados desde js/f1-data.js.
     Al añadir un año nuevo a `seasons` (y su ficha a `seasonNotes`),
     la pestaña aparece sola sin tocar el HTML. */
  function renderSeasonTabs() {
    const tabsEl = $("#seasonTabs");
    const panelsEl = $("#seasonPanels");
    if (!tabsEl || !panelsEl || !DATA) return;

    const years = DATA.seasons.slice().sort((a, b) => b.year - a.year);

    tabsEl.innerHTML = years
      .map((s) => {
        const active = s.year === currentYear;
        return (
          '<button class="tab' +
          (active ? " is-active" : "") +
          '" role="tab" aria-selected="' +
          active +
          '" aria-controls="t' +
          s.year +
          '" id="tab' +
          s.year +
          '">' +
          s.year +
          "</button>"
        );
      })
      .join("");

    panelsEl.innerHTML = years
      .map((s) => {
        const note = (DATA.seasonNotes && DATA.seasonNotes[s.year]) || {};
        const active = s.year === currentYear;

        const title =
          note.title ||
          s.year + " · " + (s.chassis === "—" ? "nueva temporada" : s.chassis);

        const body = (note.body || [])
          .map((p) => "<p>" + escapeHtml(p) + "</p>")
          .join("");

        const facts = (
          note.facts || [
            ["Posición", s.pos != null ? s.pos + "º" : "—"],
            ["Puntos", s.points != null ? s.points : "—"],
            ["Podios", s.podiums != null ? s.podiums : "—"],
            ["Chasis", s.chassis],
          ]
        )
          .map(
            (f) =>
              "<li><span>" +
              escapeHtml(f[0]) +
              "</span><strong>" +
              escapeHtml(f[1]) +
              "</strong></li>"
          )
          .join("");

        return (
          '<article class="tab-panel' +
          (active ? " is-active" : "") +
          '" id="t' +
          s.year +
          '" role="tabpanel" aria-labelledby="tab' +
          s.year +
          '"' +
          (active ? "" : " hidden") +
          '><div class="panel-grid"><div><h3>' +
          escapeHtml(title) +
          "</h3>" +
          body +
          '</div><ul class="panel-facts">' +
          facts +
          "</ul></div></article>"
        );
      })
      .join("");

  }

  /* ---------- 4c. Calendario de circuitos ---------- */
  const calendarEl = $("#calendar");
  let racesCache = [];
  let resultsByRound = {};

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  async function renderCalendar() {
    if (!calendarEl) return;

    try {
      const res = await fetch(
        "https://api.jolpi.ca/ergast/f1/" + currentYear + ".json",
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("HTTP " + res.status);

      const json = await res.json();
      const races =
        (json && json.MRData && json.MRData.RaceTable && json.MRData.RaceTable.Races) ||
        [];

      if (!races.length) throw new Error("sin carreras");

      racesCache = races;
      renderNextRace(races);
      renderLastRace(races);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const nextRace = races.find(
        (r) => new Date(r.date + "T00:00:00") >= today
      );

      /* Horario del fin de semana, convertido a la zona horaria del visitante */
      function sessionLine(label, s) {
        if (!s || !s.date) return "";
        const iso = s.date + "T" + (s.time || "00:00:00Z");
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        const day = d.toLocaleDateString("es-ES", {
          weekday: "short",
          day: "2-digit",
        });
        const time = d.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return (
          "<em><span>" +
          day +
          "</span> " +
          time +
          " · " +
          label +
          "</em>"
        );
      }

      function schedulePanel(r) {
        const lines = [
          sessionLine("FP1", r.FirstPractice),
          sessionLine("FP2", r.SecondPractice),
          sessionLine("FP3", r.ThirdPractice),
          sessionLine("Clasificación", r.Qualifying),
          sessionLine("Sprint", r.Sprint),
          sessionLine("Carrera", { date: r.date, time: r.time }),
        ].filter(Boolean);

        if (!lines.length) return "";

        return (
          '<span class="cal-sched"><strong>Horario · tu hora</strong>' +
          lines.join("") +
          "</span>"
        );
      }

      calendarEl.innerHTML = races
        .map((r) => {
          const date = new Date(r.date + "T00:00:00");
          const isNext = nextRace && r.round === nextRace.round;
          const isDone = date < today;
          const badge = isNext ? "Próximo" : isDone ? "Disputado" : "";

          return (
            '<article class="cal-card' +
            (isNext ? " is-next" : "") +
            (isDone && !isNext ? " is-done" : "") +
            '" tabindex="0">' +
            (badge ? '<span class="cal-badge">' + badge + "</span>" : "") +
            '<span class="cal-map"><img src="../imgs/circuitos/' +
            String(r.round).padStart(2, "0") +
            '.webp" alt="Trazado de ' +
            r.Circuit.circuitName +
            '" loading="lazy" onerror="this.parentNode.style.display=\'none\'"></span>' +
            schedulePanel(r) +
            '<span class="cal-round">R' +
            String(r.round).padStart(2, "0") +
            " · " +
            formatDate(r.date) +
            "</span>" +
            '<span class="cal-country">' +
            r.Circuit.Location.country +
            "</span>" +
            "<h3>" +
            r.Circuit.circuitName +
            "</h3>" +
            '<span class="cal-date">' +
            r.Circuit.Location.locality +
            "</span>" +
            "</article>"
          );
        })
        .join("");

      renderCircuitGallery(races);

      if (nextRace) {
        const idx = races.indexOf(nextRace);
        const card = calendarEl.children[idx];
        if (card) {
          calendarEl.scrollLeft = Math.max(
            0,
            card.offsetLeft -
              calendarEl.clientWidth / 2 +
              card.offsetWidth / 2
          );
        }
      }
    } catch (err) {
      calendarEl.innerHTML =
        '<p class="cal-loading">Calendario no disponible en este momento.</p>';
    }
  }

  /* ---------- 4c-bis. Galería por circuito ---------- */
  const circuitGallery = $("#circuitGallery");

  if (circuitGallery) {
    /* Si no hay foto del GP, se cae al trazado del circuito */
    circuitGallery.addEventListener(
      "error",
      (e) => {
        const img = e.target;
        if (!img || img.tagName !== "IMG" || img.dataset.fallbackDone) return;
        img.dataset.fallbackDone = "1";
        img.src = img.dataset.map;
        img.classList.add("is-map");
        const item = img.closest(".g-item");
        if (item) item.dataset.full = img.src;
      },
      true
    );
  }

  function renderCircuitGallery(races) {
    if (!circuitGallery) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const done = races.filter(
      (r) => new Date(r.date + "T00:00:00") < today
    );

    if (!done.length) {
      circuitGallery.innerHTML =
        '<p class="cal-loading">Aún no hay Grandes Premios disputados.</p>';
      return;
    }

    circuitGallery.innerHTML = done
      .map((r) => {
        const n = String(r.round).padStart(2, "0");
        const loc = r.Circuit.Location;
        const info = resultsByRound[Number(r.round)] || {};
        const date = formatDate(r.date);

        /* Datos que se muestran en el lightbox al hacer clic */
        const result = info.best
          ? "P" +
            info.best +
            " · " +
            (info.pts != null ? info.pts + " pts" : "sin puntos")
          : "Sin datos";

        const drivers = [
          info.alo ? "Alonso P" + info.alo : null,
          info.str ? "Stroll P" + info.str : null,
        ]
          .filter(Boolean)
          .join(" · ");

        const winner = info.winner
          ? info.winner + (info.winnerTeam ? " · " + info.winnerTeam : "")
          : "";

        return (
          '<button class="g-item g-circuit" data-full="../imgs/circuitos/fotos/' +
          n +
          '.webp" data-round="R' +
          n +
          '" data-title="' +
          escapeHtml(r.raceName) +
          '" data-circuit="' +
          escapeHtml(r.Circuit.circuitName) +
          '" data-date="' +
          escapeHtml(date) +
          '" data-winner="' +
          escapeHtml(winner) +
          '" data-result="' +
          escapeHtml(result) +
          '" data-drivers="' +
          escapeHtml(drivers) +
          '">' +
          '<img src="../imgs/circuitos/fotos/' +
          n +
          '.webp" data-map="../imgs/circuitos/' +
          n +
          '.webp" alt="' +
          escapeHtml(r.raceName + " · " + loc.locality) +
          '" loading="lazy" />' +
          '<span class="g-round">R' +
          n +
          "</span>" +
          '<span class="g-mini"><strong>' +
          escapeHtml(r.raceName) +
          "</strong><em>" +
          escapeHtml(date) +
          (info.best ? " · Aston Martin P" + info.best : "") +
          "</em></span></button>"
        );
      })
      .join("");
  }

  /* En móvil no hay hover: tocar la tarjeta abre el horario. */
  if (calendarEl) {
    calendarEl.addEventListener("click", (e) => {
      const card = e.target.closest(".cal-card");
      if (!card) return;
      const open = card.classList.contains("is-open");
      $$(".cal-card.is-open", calendarEl).forEach((c) =>
        c.classList.remove("is-open")
      );
      if (!open) card.classList.add("is-open");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      $$(".cal-card.is-open", calendarEl).forEach((c) =>
        c.classList.remove("is-open")
      );
    });
  }

  const calPrev = $("#calPrev");
  const calNext = $("#calNext");

  if (calPrev && calNext && calendarEl) {
    const step = () => Math.max(260, calendarEl.clientWidth * 0.7);
    /* scroll-snap cancela el desplazamiento suave: se usa salto directo */
    calPrev.addEventListener("click", () => {
      calendarEl.scrollBy({ left: -step(), behavior: "auto" });
    });
    calNext.addEventListener("click", () => {
      calendarEl.scrollBy({ left: step(), behavior: "auto" });
    });
  }

  /* ---------- 3c. Carrusel de historia ---------- */
  const tlRail = $(".timeline");
  const tlPrev = $("#tlPrev");
  const tlNext = $("#tlNext");

  if (tlRail && tlPrev && tlNext) {
    const tlStep = () => Math.max(320, tlRail.clientWidth * 0.8);
    tlPrev.addEventListener("click", () => {
      tlRail.scrollBy({ left: -tlStep(), behavior: "auto" });
    });
    tlNext.addEventListener("click", () => {
      tlRail.scrollBy({ left: tlStep(), behavior: "auto" });
    });
  }

  const seasonsMore = $("#seasonsMore");
  if (seasonsMore) {
    seasonsMore.addEventListener("click", () => {
      const body = $("#seasonsBody");
      if (!body) return;
      const open = body.classList.toggle("is-expanded");
      seasonsMore.setAttribute("aria-expanded", String(open));
      seasonsMore.textContent = open
        ? "Ver menos"
        : "Ver todas las temporadas (" + body.querySelectorAll("tr").length + ")";
    });
  }

  renderSeasons();
  renderSeasonTabs();
  renderPointsChart();
  renderStandings();
  syncLiveSeason();
  renderCalendar();

  /* ---------- 4d. Titulares en directo ---------- */
  const liveNews = $("#liveNews");

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function timeAgo(iso) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.round(diff / 60000);
    if (min < 1) return "ahora mismo";
    if (min < 60) return "hace " + min + " min";
    const h = Math.round(min / 60);
    if (h < 24) return "hace " + h + " h";
    const d = Math.round(h / 24);
    return "hace " + d + (d === 1 ? " día" : " días");
  }

  async function renderLiveNews() {
    if (!liveNews) return;

    try {
      const res = await fetch("/api/news", { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      if (!data.items || !data.items.length) throw new Error("sin noticias");

      liveNews.innerHTML = data.items
        .map(
          (n) =>
            '<article class="news-card live-card" data-cat="' +
            escapeHtml(n.cat) +
            '">' +
            '<div class="news-body">' +
            '<span class="news-tag">' +
            escapeHtml(n.source) +
            "</span>" +
            '<h3><a href="' +
            escapeHtml(n.link) +
            '" target="_blank" rel="noopener">' +
            escapeHtml(n.title) +
            "</a></h3>" +
            '<p class="news-meta">' +
            escapeHtml(n.cat) +
            " · " +
            timeAgo(n.date) +
            "</p>" +
            (n.desc ? "<p>" + escapeHtml(n.desc) + "</p>" : "") +
            "</div></article>"
        )
        .join("");

      const sync = $("#newsSync");
      if (sync) sync.textContent = "Actualizado " + timeAgo(data.updated);
    } catch (err) {
      const section = $("#titulares");
      if (section) section.hidden = true;
    }
  }

  renderLiveNews();

  /* ---------- 4f. Últimas noticias de la portada ----------
     Sustituye las tres tarjetas fijas por las tres más recientes del
     agregador, así la home nunca enseña titulares viejos. */
  async function renderHomeNews() {
    const grid = $("#noticias .news-grid");
    if (!grid) return;

    try {
      const res = await fetch("/api/news", { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!data.items || !data.items.length) return;

      let fotos = [];
      try {
        const fr = await fetch("../fotos.json");
        if (fr.ok) {
          const fj = await fr.json();
          fotos = ((fj.grupos && fj.grupos.portada) || []).map((f) => f.file);
        }
      } catch (e) {}

      const top = data.items.slice(0, 3);
      grid.innerHTML = top
        .map((n, i) => {
          const foto = fotos.length ? fotos[i % fotos.length] : "amr26";
          return (
            '<a class="news-card" href="' + escapeHtml(n.link) + '" target="_blank" rel="noopener">' +
              '<div class="news-media">' +
                '<img src="../imgs/' + foto.año + "/" + foto.file + '.webp" alt="" loading="lazy" />' +
              "</div>" +
              '<div class="news-body">' +
                '<span class="news-tag">' + escapeHtml(n.source) + "</span>" +
                "<h3>" + escapeHtml(n.title) + "</h3>" +
                '<p class="news-meta">' + escapeHtml(n.cat) + " · " + timeAgo(n.date) + "</p>" +
              "</div>" +
            "</a>"
          );
        })
        .join("");
    } catch (e) {
      /* si falla se quedan las tarjetas que hay en el HTML */
    }
  }

  renderHomeNews();

  /* ---------- 4e. Vídeos del canal oficial ---------- */
  const videoGrid = $("#videoGrid");

  async function renderVideos() {
    if (!videoGrid) return;

    try {
      const res = await fetch("/api/videos", { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      if (!data.items || !data.items.length) throw new Error("sin vídeos");

      videoGrid.innerHTML = data.items
        .map(
          (v) =>
            '<div class="video-card">' +
            '<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/' +
            encodeURIComponent(v.id) +
            '?rel=0&modestbranding=1" title="' +
            escapeHtml(v.title) +
            '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' +
            "<h3>" +
            escapeHtml(v.title) +
            "</h3>" +
            '<p class="video-date">' +
            timeAgo(v.published) +
            "</p></div>"
        )
        .join("");
    } catch (err) {
      /* se queda el fallback estático */
    }
  }

  renderVideos();

  /* ---------- 5. Pestañas de temporadas ---------- */
  const tabs = $$(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const panelId = tab.getAttribute("aria-controls");
      const panel = document.getElementById(panelId);
      if (!panel) return;

      tabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");

      $$(".tab-panel").forEach((p) => {
        p.classList.remove("is-active");
        p.hidden = true;
      });
      panel.hidden = false;
      panel.classList.add("is-active");
    });

    tab.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(tab);
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) {
        e.preventDefault();
        next.focus();
        next.click();
      }
    });
  });

  /* ---------- 6. Lightbox de galería ---------- */
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbClose = $("#lbClose");
  let lastFocus = null;

  function openLightbox(src, alt, data) {
    if (!lightbox || !lbImg) return;
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = alt || "";

    const d = data || {};
    const lbRound = $("#lbRound");
    const lbTitle = $("#lbTitle");
    const lbMeta = $("#lbMeta");
    const lbFacts = $("#lbFacts");

    if (lbRound) lbRound.textContent = d.round || "";
    if (lbTitle) lbTitle.textContent = d.title || alt || "";
    if (lbMeta)
      lbMeta.textContent = [d.date, d.circuit].filter(Boolean).join(" · ");

    if (lbFacts) {
      lbFacts.innerHTML = "";

      const driverLine = (det) => {
        if (!det) return "";
        const parts = [];
        if (det.pos) parts.push("P" + det.pos);
        else if (det.status && det.status !== "Finished") parts.push(det.status);
        if (det.grid) parts.push("salió P" + det.grid);
        parts.push(det.points + " pts");
        return parts.join(" · ");
      };

      const podiumLine = (d.podium || [])
        .map((p) => p.pos + "º " + p.name)
        .join(" · ");

      const fastestLine = d.fastest
        ? d.fastest.name +
          (d.fastest.time ? " · " + d.fastest.time : "") +
          (d.fastest.lap ? " (vuelta " + d.fastest.lap + ")" : "")
        : "";

      const astonLine = d.best
        ? "P" + d.best + " · " + (d.pts != null ? d.pts + " pts" : "")
        : d.result || "";

      [
        ["Ganador", d.winner ? d.winner + (d.winnerTeam ? " · " + d.winnerTeam : "") : ""],
        ["Podio", podiumLine],
        ["Vuelta rápida", fastestLine],
        ["Aston Martin", astonLine],
        ["Alonso", driverLine(d.aloDetail)],
        ["Stroll", driverLine(d.strDetail)],
        ["Vueltas", d.laps ? String(d.laps) : ""],
      ]
        .filter((row) => row[1])
        .forEach((row) => {
          const wrap = document.createElement("div");
          const dt = document.createElement("dt");
          const dd = document.createElement("dd");
          dt.textContent = row[0];
          dd.textContent = row[1];
          wrap.appendChild(dt);
          wrap.appendChild(dd);
          lbFacts.appendChild(wrap);
        });
    }

    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lbImg.removeAttribute("src");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  /* Delegado: la galería de circuitos se genera después de cargar */
  document.addEventListener("click", (e) => {
    const item = e.target.closest(".g-item");
    if (!item) return;
    const img = $("img", item);
    const roundNum = Number((item.dataset.round || "").replace("R", ""));
    const rich = resultsByRound[roundNum] || {};

    openLightbox(
      item.dataset.full || (img ? img.src : ""),
      img ? img.alt : "",
      Object.assign({}, item.dataset, rich)
    );
  });

  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  /* ---------- 7. Modal de vídeo ---------- */
  const videoModal = $("#videoModal");
  const videoFrame = $("#videoFrame");
  const videoClose = $("#videoClose");

  function openVideo(id) {
    if (!videoModal || !videoFrame) return;
    lastFocus = document.activeElement;
    videoFrame.src =
      "https://www.youtube-nocookie.com/embed/" +
      id +
      "?autoplay=1&rel=0&modestbranding=1";
    videoModal.hidden = false;
    document.body.style.overflow = "hidden";
    if (videoClose) videoClose.focus();
  }

  function closeVideo() {
    if (!videoModal) return;
    videoModal.hidden = true;
    videoFrame.src = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  $$("[data-video]").forEach((btn) => {
    btn.addEventListener("click", () => openVideo(btn.dataset.video));
  });

  if (videoClose) videoClose.addEventListener("click", closeVideo);
  if (videoModal) {
    videoModal.addEventListener("click", (e) => {
      if (e.target === videoModal) closeVideo();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (lightbox && !lightbox.hidden) closeLightbox();
    if (videoModal && !videoModal.hidden) closeVideo();
  });

  /* ---------- 8. Contador de última actualización ---------- */
  const contador = document.getElementById("ultima-actualización");
  if (contador) {
    let segundos = 0;
    setInterval(() => {
      segundos += 1;
      const txt =
        segundos < 60
          ? segundos + " segundos"
          : Math.floor(segundos / 60) + " minutos";
      contador.textContent = "Última actualización: hace " + txt;
    }, 1000);
  }

  /* ---------- 9. Validación del formulario ---------- */
  const form = document.querySelector("form[data-validate]");
  if (form) {
    const messages = {
      nombre: "Escribe tu nombre.",
      apellidos: "Escribe tus apellidos.",
      dni: "El DNI debe tener 8 números y una letra (ej. 12345678Z).",
      dir: "Formato: C/ Calle 12 3ºA.",
      ciudad: "Indica tu ciudad.",
      cp: "El código postal debe tener 5 cifras.",
      pais: "Indica tu país.",
      email: "Introduce un correo válido.",
      contraseña: "La contraseña no cumple el formato indicado.",
    };

    function setError(field, message) {
      const wrapper = field.closest(".field");
      if (!wrapper) return;
      wrapper.classList.toggle("has-error", Boolean(message));
      let hint = wrapper.querySelector(".field-error");
      if (!hint) {
        hint = document.createElement("p");
        hint.className = "field-error";
        wrapper.appendChild(hint);
      }
      hint.textContent = message || "";
    }

    const submitBtn = $("#submitBtn");
    const formMessage = $("#formMessage");
    const originalBtn = submitBtn ? submitBtn.innerHTML : "";

    function showMessage(text, type) {
      if (!formMessage) return;
      formMessage.hidden = false;
      formMessage.textContent = text;
      formMessage.className = "form-message is-" + type;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      let firstInvalid = null;

      $$("input[required], input[pattern]", form).forEach((field) => {
        const valid = field.checkValidity();
        setError(field, valid ? "" : messages[field.id] || "Revisa este campo.");
        if (!valid && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "center",
        });
        return;
      }

      const sexo = form.querySelector('input[name="sexo"]:checked');
      const foto = form.querySelector("#foto_perfil");

      const payload = {
        nombre: form.nombre.value,
        apellidos: form.apellidos.value,
        dni: form.dni.value,
        nacimiento: form.nacimiento.value,
        direccion: form.dir.value,
        ciudad: form.ciudad.value,
        cp: form.cp.value,
        pais: form.pais.value,
        email: form.email.value,
        sexo: sexo ? sexo.value : "",
        aficion: form.aficiones.value,
        foto: foto && foto.files.length ? foto.files[0].name : "",
        website: form.website.value,
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando…";
      }

      try {
        const res = await fetch("/api/registro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (data.fields) {
            Object.keys(data.fields).forEach((key) => {
              const field = document.getElementById(key);
              if (field) setError(field, data.fields[key]);
            });
          }
          showMessage(data.error || "No se pudo completar el alta.", "error");
          return;
        }

        showMessage(
          data.message || "Alta completada. Bienvenido al equipo.",
          "ok"
        );
        form.reset();
        $$(".field.has-error", form).forEach((f) => f.classList.remove("has-error"));
      } catch (err) {
        showMessage(
          "No se pudo conectar con el servidor. Inténtalo de nuevo.",
          "error"
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtn;
        }
      }
    });

    $$("input", form).forEach((field) => {
      field.addEventListener("input", () => {
        if (field.checkValidity()) setError(field, "");
      });
    });
  }

  /* ---------- 9b. Filtro de noticias ---------- */
  const filters = $$(".filter");
  const newsCards = $$("#newsGrid .news-card");
  const emptyState = $("#emptyState");

  if (filters.length && newsCards.length) {
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.filter;
        let visible = 0;

        filters.forEach((f) => f.classList.remove("is-active"));
        btn.classList.add("is-active");

        newsCards.forEach((card) => {
          const show = cat === "all" || card.dataset.cat === cat;
          card.classList.toggle("is-hidden", !show);
          if (show) visible += 1;
        });

        if (emptyState) emptyState.hidden = visible > 0;
      });
    });
  }

  /* ---------- 9b. Pilotos sincronizados con la API ---------- */
  const driverRows = {};

  function paintDriverHover() {
    $$("[data-driver]").forEach((card) => {
      const id = card.dataset.driver;
      const row = driverRows[id];
      const hover = $("[data-hover]", card);
      if (!row || !hover) return;

      const set = (sel, val) => {
        const el = $(sel, hover);
        if (el) el.textContent = val;
      };

      const key = id === "alonso" ? "aloDetail" : "strDetail";
      let podiums = 0;
      let poles = 0;
      let fastest = 0;
      let retirements = 0;
      let races = 0;
      let best = null;

      Object.keys(resultsByRound).forEach((r) => {
        const d = resultsByRound[r] && resultsByRound[r][key];
        if (!d) return;
        races++;
        if (d.pos) {
          if (d.pos <= 3) podiums++;
          if (best === null || d.pos < best) best = d.pos;
        }
        if (d.grid === 1) poles++;
        if (d.fastest) fastest++;
        const finished =
          /^(Finished|Lapped)/.test(d.status || "") || /^\+/.test(d.status || "");
        if (d.status && !finished) retirements++;
      });

      set("[data-h-pos]", row.pos + "º");
      set("[data-h-pts]", row.pts);
      set("[data-h-pod]", podiums);
      set("[data-h-win]", row.wins);
      set("[data-h-pole]", poles);
      set("[data-h-fast]", fastest);
      set("[data-h-best]", best ? "P" + best : "—");
      set("[data-h-ret]", retirements);
    });
  }

  async function syncDrivers() {
    const cards = $$("[data-driver]");
    if (!cards.length) return;

    const year =
      (window.F1_DATA && F1_DATA.live && F1_DATA.live.season) ||
      new Date().getFullYear();

    try {
      const res = await fetch(
        "https://api.jolpi.ca/ergast/f1/" + year + "/driverstandings.json?limit=100"
      );
      if (!res.ok) return;
      const data = await res.json();
      const list =
        (data.MRData.StandingsTable.StandingsLists[0] || {}).DriverStandings || [];

      cards.forEach((card) => {
        const row = list.find((d) => d.Driver.driverId === card.dataset.driver);
        if (!row) return;

        const h3 = $("h3", card);
        if (h3) h3.textContent = row.Driver.givenName + " " + row.Driver.familyName;

        const num = $(".driver-num", card);
        if (num && row.Driver.permanentNumber) {
          num.textContent = row.Driver.permanentNumber;
        }

        const season = $("[data-season]", card);
        if (season) {
          const wins = Number(row.wins) || 0;
          season.textContent =
            "Mundial " + row.position + "º · " + row.points + " pts" +
            (wins ? " · " + wins + (wins > 1 ? " victorias" : " victoria") : "");
        }

        driverRows[card.dataset.driver] = {
          pos: row.position,
          pts: row.points,
          wins: Number(row.wins) || 0,
        };
      });

      paintDriverHover();
    } catch (e) {
      /* Si la API falla se mantienen los datos escritos en el HTML */
    }
  }

  syncDrivers();

  /* ---------- 9c. Próximo GP, último GP, gráfico y clasificación ---------- */
  let countdownTimer = null;

  function raceDate(r) {
    const time = r.time || "14:00:00Z";
    return new Date(r.date + "T" + time);
  }

  function fmtDate(d) {
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function renderNextRace(races) {
    const nameEl = $("[data-next-name]");
    const metaEl = $("[data-next-meta]");
    const cd = $("[data-countdown]");
    if (!nameEl || !races.length) return;

    const now = new Date();
    const next = races.find((r) => raceDate(r) > now);

    if (!next) {
      nameEl.textContent = "Temporada finalizada";
      if (metaEl) metaEl.textContent = "No quedan carreras en el calendario.";
      if (cd) cd.hidden = true;
      return;
    }

    nameEl.textContent = next.raceName;
    if (metaEl) {
      const c = next.Circuit || {};
      const loc = c.Location
        ? c.Location.locality + ", " + c.Location.country
        : "";
      metaEl.innerHTML =
        (c.circuitName
          ? '<span class="race-circuit">' + c.circuitName + "</span>"
          : "") +
        '<span class="race-loc">' +
        (loc ? loc + " · " : "") +
        fmtDate(raceDate(next)) +
        "</span>";
    }

    if (!cd) return;
    cd.hidden = false;

    const target = raceDate(next).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        cd.querySelectorAll("strong").forEach((s) => (s.textContent = "00"));
        if (countdownTimer) clearInterval(countdownTimer);
        return;
      }
      const s = Math.floor(diff / 1000);
      const set = (k, v) => {
        const el = cd.querySelector('[data-cd="' + k + '"]');
        if (el) el.textContent = String(v).padStart(2, "0");
      };
      set("d", Math.floor(s / 86400));
      set("h", Math.floor((s % 86400) / 3600));
      set("m", Math.floor((s % 3600) / 60));
      set("s", s % 60);
    };

    tick();
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(tick, 1000);
  }

  function renderLastRace(races) {
    const nameEl = $("[data-last-name]");
    const metaEl = $("[data-last-meta]");
    const listEl = $("[data-last-podium]");
    if (!nameEl || !races.length) return;

    const now = new Date();
    const done = races.filter((r) => raceDate(r) <= now);
    if (!done.length) {
      nameEl.textContent = "Sin carreras disputadas";
      if (metaEl) metaEl.textContent = "La temporada aún no ha empezado.";
      if (listEl) listEl.innerHTML = "";
      return;
    }

    const last = done[done.length - 1];
    const info = resultsByRound[Number(last.round)] || {};

    nameEl.textContent = last.raceName;
    if (metaEl) {
      const c = last.Circuit || {};
      const loc = c.Location
        ? c.Location.locality + ", " + c.Location.country
        : "";
      metaEl.innerHTML =
        (c.circuitName
          ? '<span class="race-circuit">' + c.circuitName + "</span>"
          : "") +
        '<span class="race-loc">' +
        (loc ? loc + " · " : "") +
        fmtDate(raceDate(last)) +
        "</span>";
    }

    if (!listEl) return;
    const rows = [];

    (info.podium || []).forEach((p) => {
      rows.push(
        '<li><span class="rp-pos">' + p.pos + "º</span>" +
          '<span class="rp-name">' + p.name + "</span>" +
          '<span class="rp-team">' + (p.team || "") + "</span></li>"
      );
    });

    if (info.best) {
      rows.push(
        '<li class="is-aston"><span class="rp-pos">P' + info.best + "</span>" +
          '<span class="rp-name">Aston Martin</span>' +
          '<span class="rp-team">' + (info.pts != null ? info.pts + " pts" : "") + "</span></li>"
      );
    }

    listEl.innerHTML = rows.length
      ? rows.join("")
      : '<li><span class="rp-name">Resultados en camino…</span></li>';
  }

  function renderPointsChart() {
    const el = $("#pointsChart");
    if (!el || !DATA) return;

    const rows = DATA.seasons
      .slice()
      .sort((a, b) => a.year - b.year)
      .filter((s) => s.points != null);

    if (!rows.length) return;

    const max = Math.max.apply(null, rows.map((s) => s.points)) || 1;

    el.innerHTML = rows
      .map((s) => {
        const h = Math.max(2, Math.round((s.points / max) * 100));
        return (
          '<div class="chart-col' + (s.year === currentYear ? " is-live" : "") + '">' +
          '<span class="chart-val">' + s.points + "</span>" +
          '<div class="chart-bar" style="height:' + h + '%"></div>' +
          '<span class="chart-year">' + s.year + "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  async function renderStandings() {
    const el = $("#standingsList");
    if (!el) return;

    try {
      const res = await fetch(
        "https://api.jolpi.ca/ergast/f1/" + currentYear + "/constructorstandings.json?limit=20",
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      const list =
        (json.MRData.StandingsTable.StandingsLists[0] || {}).ConstructorStandings || [];

      if (!list.length) throw new Error("sin datos");

      el.innerHTML = list
        .map((row) => {
          const isAston = row.Constructor.constructorId === "aston_martin";
          return (
            '<li' + (isAston ? ' class="is-aston"' : "") + ">" +
            '<span class="st-pos">' + row.position + "</span>" +
            '<span class="st-name">' + row.Constructor.name + "</span>" +
            '<span class="st-pts">' + row.points + "</span>" +
            "</li>"
          );
        })
        .join("");
    } catch (e) {
      el.innerHTML = '<li class="standings-loading">No se pudo cargar la clasificación.</li>';
    }
  }

  /* ---------- 9b. Mejores momentos de la escudería ---------- */
  const momentsEl = $("#moments");
  const momPrev = $("#momPrev");
  const momNext = $("#momNext");

  if (momPrev && momNext && momentsEl) {
    const momStep = () => Math.max(320, momentsEl.clientWidth * 0.7);
    momPrev.addEventListener("click", () =>
      momentsEl.scrollBy({ left: -momStep(), behavior: "auto" })
    );
    momNext.addEventListener("click", () =>
      momentsEl.scrollBy({ left: momStep(), behavior: "auto" })
    );
  }

  /* Títulos editoriales de los momentos concretos. Si falta uno, se usa
     un título genérico generado con el nombre de la carrera. */
  const MOMENT_TITLES = {
    "2021-6": "El primer podio de la nueva era",
    "2023-6": "Mónaco, el podio más esperado",
    "2023-13": "Podio y vuelta rápida",
    "2023-20": "El año cerró en el cajón",
    "2023-18": "De fondo a la zona de puntos",
    "2023-21": "Catorce posiciones en una noche",
    "2025-15": "Remontada desde el fondo",
    "2026-7": "La nueva era también remonta",
    "2024-5": "La vuelta más rápida del equipo",
    "2024-11": "La vuelta más rápida del equipo",
  };

  async function renderMoments() {
    if (!momentsEl) return;

    const years = [2021, 2022, 2023, 2024, 2025, 2026];
    const rows = [];

    /* Caché de una hora: son seis peticiones y la API limita el ritmo. */
    const CACHE_KEY = "astonMoments_v1";
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const o = JSON.parse(cached);
        if (o && Date.now() - o.t < 3600000 && o.rows && o.rows.length) {
          rows.push.apply(rows, o.rows);
        }
      }
    } catch (e) {
      /* almacenamiento no disponible */
    }

    if (!rows.length) {
      /* Una petición por año, con reintento: si una falla, no se pierde el año. */
      for (let i = 0; i < years.length; i++) {
        const year = years[i];
        const url =
          "https://api.jolpi.ca/ergast/f1/" +
          year +
          "/constructors/aston_martin/results.json?limit=2000";

        let json = null;
        for (let attempt = 0; attempt < 3 && !json; attempt++) {
          try {
            const res = await fetch(url, { headers: { Accept: "application/json" } });
            if (res.ok) json = await res.json();
            else await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          } catch (err) {
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          }
        }

        const races =
          (json && json.MRData && json.MRData.RaceTable && json.MRData.RaceTable.Races) ||
          [];

        races.forEach((rc) => {
          (rc.Results || []).forEach((r) => {
            if (!r.Constructor || r.Constructor.constructorId !== "aston_martin") {
              return;
            }
            rows.push({
              year: year,
              round: Number(rc.round),
              race: rc.raceName,
              date: rc.date,
              driver: r.Driver.familyName,
              grid: Number(r.grid),
              pos: Number(r.position),
              points: Number(r.points) || 0,
              fl: r.FastestLap && r.FastestLap.rank === "1",
              flTime:
                r.FastestLap && r.FastestLap.Time ? r.FastestLap.Time.time : "",
            });
          });
        });
      }

      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), rows: rows }));
      } catch (e) {
        /* cuota llena */
      }
    }

    if (!rows.length) {
      momentsEl.innerHTML =
        '<p class="cal-loading">No se pudieron cargar los momentos.</p>';
      return;
    }

    const podiums = rows
      .filter((r) => r.pos >= 1 && r.pos <= 3)
      .sort((a, b) => a.date.localeCompare(b.date));

    /* Cuatro podios que cuentan la historia: el primero y los tres mejores. */
    const wanted = ["2021-6", "2023-6", "2023-13", "2023-20"];
    const byKey = new Map(podiums.map((r) => [r.year + "-" + r.round, r]));
    const chosen = wanted.map((k) => byKey.get(k)).filter(Boolean);
    podiums.forEach((r) => {
      if (chosen.length < 4 && chosen.indexOf(r) === -1) chosen.push(r);
    });

    const comebacks = rows
      .filter(
        (r) => r.grid > 0 && r.pos > 0 && r.pos <= 20 && r.grid - r.pos >= 8
      )
      .sort((a, b) => b.grid - b.pos - (a.grid - a.pos))
      .slice(0, 3);

    const usedKeys = new Set(chosen.map((r) => r.year + "-" + r.round));

    const fastest = rows
      .filter((r) => r.fl && !usedKeys.has(r.year + "-" + r.round))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 1);

    const cards = [];
    const add = (type, r, stat, text) => {
      cards.push({
        type: type,
        year: r.year,
        race: r.race,
        date: r.date,
        stat: stat,
        title: MOMENT_TITLES[r.year + "-" + r.round] || r.race,
        text: text,
      });
    };

    chosen.forEach((r) => {
      let text = "Salió " + r.grid + "º y cruzó la meta en " + r.pos + "º.";
      if (r.fl) text += " Además firmó la vuelta rápida.";
      add("Podio", r, "P" + r.pos, text);
    });

    comebacks.forEach((r) => {
      const gain = r.grid - r.pos;
      add(
        "Remontada",
        r,
        "+" + gain,
        "De " + r.grid + "º a " + r.pos + "º: " + gain + " posiciones ganadas."
      );
    });

    fastest.forEach((r) => {
      add(
        "Vuelta rápida",
        r,
        r.flTime,
        "La vuelta más rápida de la carrera, firmada en " + r.race + "."
      );
    });

    /* Mejor temporada: la de más podios (y puntos como desempate). */
    const byYear = {};
    rows.forEach((r) => {
      if (!byYear[r.year]) byYear[r.year] = { year: r.year, podiums: 0, points: 0 };
      if (r.pos >= 1 && r.pos <= 3) byYear[r.year].podiums++;
      byYear[r.year].points += r.points;
    });
    const best = Object.values(byYear)
      .filter((y) => y.podiums > 0)
      .sort((a, b) => b.podiums - a.podiums || b.points - a.points)[0];

    if (best) {
      cards.push({
        type: "Temporada",
        year: best.year,
        race: "",
        date: best.year + "-12-31",
        stat: String(best.podiums),
        title: "La mejor temporada de la era moderna",
        text:
          best.podiums +
          " podios y " +
          best.points +
          " puntos en el campeonato de constructores.",
      });
    }

    cards.sort((a, b) => a.date.localeCompare(b.date));

    momentsEl.innerHTML = cards
      .map((c) => {
        const short = c.race.replace(" Grand Prix", "");
        return (
          '<article class="moment' +
          (c.type === "Podio" ? " is-aston" : "") +
          '">' +
          '<span class="moment-type">' +
          c.type +
          "</span>" +
          '<span class="moment-year">' +
          c.year +
          (short ? " · " + short : "") +
          "</span>" +
          '<span class="moment-stat">' +
          c.stat +
          "</span>" +
          '<h3 class="moment-title">' +
          c.title +
          "</h3>" +
          '<p class="moment-text">' +
          c.text +
          "</p>" +
          '<a class="moment-search" href="https://www.youtube.com/results?search_query=' +
          encodeURIComponent("Aston Martin F1 " + c.year + " " + short + " adelantamiento") +
          '" target="_blank" rel="noopener">' +
          '<span class="play"></span> Buscar vídeo</a>' +
          "</article>"
        );
      })
      .join("");

    $$("[data-video]", momentsEl).forEach((btn) => {
      btn.addEventListener("click", () => openVideo(btn.dataset.video));
    });
  }

  renderMoments();

  /* ---------- 9c. Navegación interna sin # en la URL ---------- */
  const cleanUrl = () => {
    if (location.hash) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  };

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    cleanUrl();
    closeNav();
  });

  /* Si se entra con un enlace tipo /#historia, se respeta el salto
     pero se limpia la barra de direcciones. */

  /* Enlaces antiguos (/#historia): el navegador salta y la URL queda
     limpia cuando termina el desplazamiento. */
  let hashTries = 0;
  const hashWatch = window.setInterval(() => {
    if (location.hash) {
      window.clearInterval(hashWatch);
      window.setTimeout(cleanUrl, 1200);
    } else if (++hashTries > 40) {
      window.clearInterval(hashWatch);
    }
  }, 150);

  /* ---------- 10. Enlace activo y hash sincronizados con el scroll ---------- */
  const sections = $$("main section[id]");
  const navAnchors = $$('.nav-links a[href^="#"]');

  if (sections.length && navAnchors.length) {
    const updateActive = () => {
      const probe = window.scrollY + window.innerHeight * 0.35;
      let current = null;

      sections.forEach((s) => {
        const top = s.getBoundingClientRect().top + window.scrollY;
        if (top <= probe) current = s;
      });

      const id = current ? current.id : "";
      const hash = id && id !== "inicio" ? "#" + id : "";

      navAnchors.forEach((a) => {
        a.classList.toggle("is-current", hash !== "" && a.getAttribute("href") === hash);
      });

    };

    let lastRun = 0;
    window.addEventListener(
      "scroll",
      () => {
        const now = Date.now();
        if (now - lastRun < 80) return;
        lastRun = now;
        updateActive();
      },
      { passive: true }
    );
    window.addEventListener("resize", updateActive, { passive: true });
    updateActive();
  }

  /* ---------- 22. Cantera: tarjetas generadas desde f1-data.js ----------
     Añadir un piloto a DATA.academy[] crea su tarjeta automáticamente.
     Si un dato de temporada es null se muestra «—», nunca se inventa. */
  function renderAcademia() {
    const cont = $("#academia");
    if (!cont || !DATA || !Array.isArray(DATA.academy) || !DATA.academy.length) return;

    const v = (x) => (x === null || x === undefined || x === "" ? "—" : x);
    const fila = (etiqueta, valor, clave) =>
      "<div><dt>" + etiqueta + "</dt><dd" +
      (clave ? ' data-k="' + clave + '"' : "") + ">" + v(valor) + "</dd></div>";

    cont.innerHTML = DATA.academy
      .map((d) => {
        const t = d.temporada || {};
        const año = t.año || d.debut || "";
        const foto = "../imgs/" + (d.fotoTemporada || año) + "/" + d.foto + ".webp";
        const pendiente = [t.pos, t.puntos, t.podios, t.poles, t.victorias].every(
          (x) => x === null || x === undefined
        );

        return (
          '<article class="academy' + (pendiente ? " is-pending" : "") + '">' +
            '<div class="academy-media" tabindex="0" role="group" aria-label="Datos rápidos de ' + d.nombre + '">' +
              '<img src="' + foto + '" alt="' + d.nombre + ', piloto de la Aston Martin Aramco Driver Academy" loading="lazy" />' +
              '<span class="academy-tag">Academia</span>' +
              '<div class="academy-hover" aria-hidden="true">' +
                '<p class="ah-name">' + d.nombre + "</p>" +
                '<ul class="ah-stats">' +
                  "<li><strong>" + v(t.pos) + '</strong><span>Mundial</span></li>' +
                  "<li><strong>" + v(t.puntos) + "</strong><span>Puntos</span></li>" +
                  "<li><strong>" + v(t.podios) + "</strong><span>Podios</span></li>" +
                  "<li><strong>" + v(t.victorias) + "</strong><span>Victorias</span></li>" +
                "</ul>" +
              "</div>" +
            "</div>" +
            '<div class="academy-body">' +
              '<p class="eyebrow"><span class="dot"></span> Cantera</p>' +
              "<h3>" + d.nombre + "</h3>" +
              '<p class="academy-role">' + (d.rol || "") + "</p>" +
              '<div class="academy-season">' +
                '<p class="as-title">Temporada ' + v(año) + " · " + (d.serie || "") + " con " + (d.equipo || "") + "</p>" +
                '<dl class="as-grid">' +
                  fila("Mundial", t.pos, "pos") +
                  fila("Puntos", t.puntos, "puntos") +
                  fila("Podios", t.podios, "podios") +
                  fila("Victorias", t.victorias, "victorias") +
                  fila("Mejor", t.mejor ? "P" + t.mejor : null, "mejor") +
                  fila("Carreras", t.carreras, "carreras") +
                  '<div><dt>Debut</dt><dd>' + v(d.debut) + "</dd></div>" +
                  '<div><dt>Equipo</dt><dd>' + v(d.equipo) + "</dd></div>" +
                "</dl>" +
                '<p class="as-note">' +
                (pendiente
                  ? "Cifras pendientes de confirmar tras la última cita de " + (d.serie || "la serie") + "."
                  : "Datos sincronizados con la clasificación de " + (d.serie || "la serie") + ".") +
                "</p>" +
              "</div>" +
              '<p class="academy-bio">' + (d.bio || "") + "</p>" +
              '<ul class="driver-stats">' +
                "<li><strong>" + v(d.debut) + "</strong><span>Debut</span></li>" +
                "<li><strong>" + v(d.equipo) + "</strong><span>Equipo</span></li>" +
                "<li><strong>" + v(d.edad) + "</strong><span>Años</span></li>" +
                "<li><strong>" + v(d.pais) + "</strong><span>País</span></li>" +
              "</ul>" +
            "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  /* ---------- Cantera: datos en vivo ---------- */
  function sincronizarAcademia() {
    const cont = $("#academia");
    if (!cont) return;
    fetch("/api/academia", { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !d.ok) return;
        const card = cont.querySelector(".academy");
        if (!card) return;
        const set = (k, val) => {
          const el = card.querySelector('[data-k="' + k + '"]');
          if (el && val !== null && val !== undefined && val !== "") el.textContent = val;
        };
        set("pos", d.pos != null ? d.pos + "º" : null);
        set("puntos", d.puntos);
        set("podios", d.podios);
        set("victorias", d.victorias);
        set("mejor", d.mejor ? "P" + d.mejor : null);
        set("carreras", d.carreras);
        const hover = card.querySelector(".ah-stats");
        if (hover) {
          const lis = hover.querySelectorAll("strong");
          if (lis[0] && d.pos != null) lis[0].textContent = d.pos + "º";
          if (lis[1] && d.puntos != null) lis[1].textContent = d.puntos;
          if (lis[2] && d.podios != null) lis[2].textContent = d.podios;
          if (lis[3] && d.victorias != null) lis[3].textContent = d.victorias;
        }
        const nota = card.querySelector(".as-note");
        if (nota) nota.textContent = "Clasificación de Fórmula 2 sincronizada automáticamente.";
        card.classList.remove("is-pending");
      })
      .catch(() => {});
  }

  renderAcademia();
  sincronizarAcademia();



})();
