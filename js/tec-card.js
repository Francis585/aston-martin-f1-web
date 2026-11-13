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

  function pintar() {
    if (fotos.length < 2) return;
    img.style.opacity = "0";
    setTimeout(function () {
      img.src = "../imgs/" + fotos[idx].año + "/" + fotos[idx].file + ".webp";
      img.onload = function () { img.style.opacity = "1"; };
      img.onerror = function () { img.style.opacity = "1"; };
    }, 420);
  }

  fetch("../fotos.json", { headers: { Accept: "application/json" } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (m) {
      if (!m || !m.grupos) return;
      var lista = (m.grupos.ficha && m.grupos.ficha.length ? m.grupos.ficha : m.grupos.panoramica || m.grupos.coche) || [];
      fotos = lista
        .filter(function (f) { return f && f.file; })
        .map(function (f) { return { file: f.file, año: f.temporada || new Date().getFullYear() }; });
      window.__tec = fotos; /* visible para comprobar que carga */
      if (fotos.length < 2) return;
      idx = 0;
      setInterval(function () {
        if (document.hidden) return;
        idx = (idx + 1) % fotos.length;
        pintar();
      }, 8000);
    })
    .catch(function () {});
})();
