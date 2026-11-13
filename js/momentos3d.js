/* =========================================================
   MOMENTOS CON PROFUNDIDAD
   Inclinación 3D de cada tarjeta siguiendo el cursor, con el
   número y el texto despegados del plano. Sin librerías.
   ========================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = window.matchMedia("(hover: hover)").matches;
  if (reduce || !fino) return;

  var cont = document.getElementById("moments");
  if (!cont) return;
  cont.classList.add("tiene-3d");

  var MAX = 7;

  cont.addEventListener("pointermove", function (e) {
    var card = e.target.closest(".moment");
    if (!card) return;
    var r = card.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width;
    var py = (e.clientY - r.top) / r.height;
    card.style.transform =
      "perspective(900px) rotateY(" + ((px - 0.5) * MAX * 2).toFixed(2) + "deg)" +
      " rotateX(" + ((0.5 - py) * MAX * 1.6).toFixed(2) + "deg) translateZ(8px)";
    card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
    card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
  });

  cont.addEventListener("pointerout", function (e) {
    var card = e.target.closest(".moment");
    if (!card || card.contains(e.relatedTarget)) return;
    card.style.transform = "";
  });
})();
