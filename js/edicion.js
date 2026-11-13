/* =========================================================
   EDICIÓN DE LA WEB
   Decide qué «edición» de diseño se sirve y en qué fase está.
   - Una edición por temporada (cambia el look entero del sitio)
   - Cuatro fases dentro de la temporada
   Parámetros para probar sin esperar: ?edicion=2027&fase=2
   ========================================================= */
(function () {
  "use strict";

  var par = new URLSearchParams(window.location.search);
  var hoy = new Date();
  var año = hoy.getFullYear();
  var mes = hoy.getMonth() + 1; /* 1-12 */

  /* La temporada arranca en marzo: en enero y febrero seguimos con
     la edición del año anterior. */
  var temporada = mes < 3 ? año - 1 : año;
  if (par.get("edicion")) temporada = parseInt(par.get("edicion"), 10) || temporada;

  /* Fases: cuatro tramos de tres meses desde marzo. */
  var fase;
  if (mes >= 3 && mes <= 5) fase = 1;
  else if (mes >= 6 && mes <= 8) fase = 2;
  else if (mes >= 9 && mes <= 11) fase = 3;
  else fase = 4;
  if (par.get("fase")) fase = parseInt(par.get("fase"), 10) || fase;

  var root = document.documentElement;

  /* ---------- Formato de página ----------
     Cada temporada tiene un formato base y, a mitad de año (fase III),
     se sirve el alternativo: la página no solo cambia de color, se
     recoloca entera. Los formatos se definen en estilos/layout-*.css. */
  var FORMATO_TEMPORADA = { 2026: "a", 2027: "b", 2028: "a" };
  var ALTERNO = { a: "b", b: "a" };
  var base = FORMATO_TEMPORADA[temporada] || "a";
  var CAMBIO_A_MITAD = false; /* formato alternativo solo si se aprueba */
  var formato = par.get("layout") || (CAMBIO_A_MITAD && fase === 3 ? ALTERNO[base] || base : base);
  root.setAttribute("data-layout", formato);

  root.setAttribute("data-temporada", String(temporada));
  root.setAttribute("data-fase", String(fase));

  var NOMBRE_FASE = {
    1: "Fase I · ajuste",
    2: "Fase II · curvas",
    3: "Fase III · contraste",
    4: "Fase IV · aire",
  };

  window.AMF1_EDICION = {
    temporada: temporada,
    fase: fase,
    nombreFase: NOMBRE_FASE[fase],
    formato: formato,
  };

  /* Sello discreto en el pie para que se vea qué edición se está sirviendo */
  function sello() {
    var pie = document.querySelector(".site-footer .footer-grid");
    if (!pie || pie.querySelector(".edition-mark")) return;

    var marca = document.createElement("p");
    marca.className = "edition-mark";
    var raya = document.createElement("i");
    raya.setAttribute("aria-hidden", "true");
    marca.appendChild(raya);
    marca.appendChild(
      document.createTextNode(
        "Edición " + temporada + " · " + (NOMBRE_FASE[fase] || "Fase " + fase)
      )
    );
    pie.appendChild(marca);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sello);
  } else {
    sello();
  }
})();
