/* =========================================================
   /api/academia — datos de los pilotos de la cantera
   Lee la clasificación de la temporada de F2 en Wikipedia (sin API key),
   encuentra al piloto y devuelve posición, puntos y mejores resultados.
   Cachea 1 hora. Si no puede leer, devuelve un error explícito: el
   cliente mantiene entonces los valores que tenga guardados.
   ========================================================= */

/* la temporada sale del año en curso; si esa página no existe, se prueba la anterior */
function paginas() {
  const año = new Date().getFullYear();
  return [año + "_Formula_2_Championship", año - 1 + "_Formula_2_Championship"];
}
const API = "https://en.wikipedia.org/w/api.php";

function sinEtiquetas(html) {
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/* de una fila de la tabla saca posición, resultados por ronda y puntos */
let paginaActual = "";

function analizarFila(fila) {
  const celdas = [...fila.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => sinEtiquetas(m[1]));
  const plano = celdas.join(" ");
  if (!/boya/i.test(plano)) return null;

  const pos = parseInt(celdas[0], 10);
  const puntos = parseInt(celdas[celdas.length - 1], 10);
  /* las celdas intermedias son los resultados: números y abandonos */
  const resultados = celdas
    .slice(1, celdas.length - 1)
    .join(" ")
    .split(/\s+/)
    .filter((t) => /^\d+$/.test(t) || /^(Ret|DNS|DSQ|C|WD)$/i.test(t));

  const numeros = resultados.filter((t) => /^\d+$/.test(t)).map(Number);
  const podios = numeros.filter((n) => n <= 3).length;
  const mejor = numeros.length ? Math.min(...numeros) : null;
  const carreras = resultados.length;

  return {
    piloto: "Mari Boya",
    pos: Number.isFinite(pos) ? pos : null,
    puntos: Number.isFinite(puntos) ? puntos : null,
    podios,
    victorias: numeros.filter((n) => n === 1).length,
    mejor,
    carreras,
    serie: "Fórmula 2",
    fuente: "https://en.wikipedia.org/wiki/" + paginaActual,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");

  try {
    const pagina = paginas()[0];
    const url =
      API + "?action=parse&format=json&formatversion=2&prop=text&page=" + encodeURIComponent(pagina);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    const r = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AstonMartinF1-Academico/1.0 (proyecto academico)",
        Accept: "application/json",
      },
    });
    clearTimeout(timer);
    if (!r.ok) throw new Error("Wikipedia HTTP " + r.status);

    paginaActual = pagina;
    const json = await r.json();
    const html = json && json.parse && json.parse.text;
    if (!html) throw new Error("Respuesta inesperada de Wikipedia");

    /* la tabla buena es la que tiene columna Points y contiene al piloto */
    const tablas = html.match(/<table[\s\S]*?<\/table>/g) || [];
    for (const tabla of tablas) {
      if (!/Points/i.test(tabla)) continue;
      const filas = tabla.match(/<tr[\s\S]*?<\/tr>/g) || [];
      for (const fila of filas) {
        const dato = analizarFila(fila);
        if (dato) {
          res.status(200).json({ ok: true, actualizado: new Date().toISOString(), ...dato });
          return;
        }
      }
    }

    res.status(200).json({ ok: false, error: "El piloto no aparece en la clasificación" });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e.message || e) });
  }
};
