/* =========================================================
   ESCAPARATE DEL COCHE (sección Monoplaza)
   - Inclinación con el cursor sobre el escenario 3D
   - Cambio automático de foto del coche cada 8 s, con fundido
   Las fotos salen de la panorámica más reciente del manifiesto:
   cuando entra material nuevo, el escaparate lo usa solo.
   ========================================================= */
(function () {
  "use strict";

  var card = document.getElementById("tecCard");
  var stage = card && card.querySelector(".tec-stage");
  var img = document.getElementById("tecImg");
  if (!card || !stage || !img) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = window.matchMedia("(hover: hover)").matches;

  /* --- inclinación 3D con el cursor --- */
  if (!reduce && fino) {
    var MAX = 8;
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      card.style.transform =
        "rotateY(" + ((px - 0.5) * MAX * 1.6).toFixed(2) + "deg)" +
        " rotateX(" + ((0.5 - py) * MAX * 1.2).toFixed(2) + "deg)";
    });
    card.addEventListener("pointerleave", function () {
      card.style.transform = "";
    });
  }

  if (reduce) return;

  /* --- rotación de fotos del coche --- */
  var fotos = [];
  var idx = 0;

  function pintar(fundido) {
    if (!fotos.length) return;
    var f = fotos[idx];
    var poner = function () {
      img.style.objectPosition = f.encuadre || "50% 60%";
      img.src = "../imgs/" + f.año + "/" + f.file + ".webp";
      img.onload = function () { img.style.opacity = "1"; };
      img.onerror = function () { img.style.opacity = "1"; };
    };
    if (!fundido) { poner(); return; }
    img.style.opacity = "0";
    setTimeout(poner, 420);
  }

  fetch("../fotos.json", { headers: { Accept: "application/json" } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (m) {
      if (!m || !m.grupos) return;
      var lista = (m.grupos.ficha && m.grupos.ficha.length ? m.grupos.ficha : m.grupos.panoramica || m.grupos.coche) || [];
      fotos = lista
        .filter(function (f) { return f && f.file; })
        .map(function (f) {
          return { file: f.file, año: f.temporada || new Date().getFullYear(), encuadre: f.encuadre };
        });
      window.__tec = fotos; /* visible para comprobar que carga */
      idx = 0;
      pintar(false); /* la más reciente entra ya, sin esperar al primer ciclo */
      if (fotos.length < 2) return;
      /* solo rota cuando la tarjeta está en pantalla */
      var visible = false;
      var stage = img.parentElement;
      if ("IntersectionObserver" in window && stage) {
        new IntersectionObserver(function (entradas) {
          visible = entradas[0].isIntersecting;
        }, { threshold: 0.25 }).observe(stage);
      } else {
        visible = true;
      }

      setInterval(function () {
        if (!visible) return;
        idx = (idx + 1) % fotos.length;
        pintar(true);
      }, 12000);
    })
    .catch(function () {});
})();
