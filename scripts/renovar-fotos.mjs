#!/usr/bin/env node
/* =========================================================
   RENOVACIÓN AUTOMÁTICA DE FOTOS
   Busca fotos nuevas de Aston Martin en Wikimedia Commons con licencia
   libre, descarga las que aún no están, las convierte a webp y las da de
   alta en fotos.json con la fecha de hoy. Después retira de portada y de
   la ficha del coche las que superan la vida útil (la galería las guarda).
   Uso: node scripts/renovar-fotos.mjs [maxNuevas]
   ========================================================= */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const rutaManifiesto = join(raiz, "fotos.json");
const carpeta = join(raiz, "imgs", "2026");
/* ruta del ffmpeg: admite rutas de Windows y del shell de git-bash (/c/...) */
function aRutaNativa(p) {
  if (!p) return p;
  const m = p.match(/^\/([a-zA-Z])\/(.*)$/);
  return m ? m[1].toUpperCase() + ":\\" + m[2].replace(/\//g, "\\") : p;
}
const FF = aRutaNativa(
  process.env.FFMPEG ||
    join(process.env.LOCALAPPDATA || "", "hermes", "tools", "ffmpeg-9.0.1-win32-x64", "bin", "ffmpeg.exe")
);
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "AstonMartinF1-Academico/1.0 (proyecto academico)";
const HOY = new Date().toISOString().slice(0, 10);
const MAX = Number(process.argv[2] || 4);

/* Busca por el GP más reciente además de lo genérico: en Commons las
   fotos de una carrera aparecen días o semanas después. */
const CALENDARIO = [
  ["Australia", "2026-03-08"], ["China", "2026-03-15"], ["Japón", "2026-03-29"],
  ["Bahrain", "2026-04-12"], ["Arabia", "2026-04-19"], ["Miami", "2026-05-03"],
  ["Canadá", "2026-05-24"], ["Mónaco", "2026-06-07"], ["España", "2026-06-14"],
  ["Austria", "2026-06-28"], ["Gran Bretaña", "2026-07-05"], ["Bélgica", "2026-07-19"],
  ["Hungría", "2026-07-26"], ["Países Bajos", "2026-08-23"], ["Italia", "2026-09-06"],
  ["Madrid", "2026-09-13"], ["Azerbaiyán", "2026-09-27"], ["Singapur", "2026-10-11"],
  ["Estados Unidos", "2026-10-25"], ["México", "2026-11-01"], ["Brasil", "2026-11-08"],
  ["Las Vegas", "2026-11-21"], ["Catar", "2026-11-29"], ["Abu Dabi", "2026-12-06"],
];

function gpsRecientes(n) {
  const hoy = Date.now();
  return CALENDARIO
    .filter(([, f]) => new Date(f + "T23:59:00") <= hoy)
    .slice(-n)
    .map(([nombre]) => nombre);
}

const BUSQUEDAS = [
  "Aston Martin AMR26",
  "Aston Martin F1 2026",
  "Fernando Alonso 2026",
  "Lance Stroll 2026",
  "Aston Martin Aramco 2026",
  ...gpsRecientes(2).flatMap((gp) => [
    "2026 " + gp + " Aston Martin",
    "2026 " + gp + " Grand Prix Aston",
  ]),
];
const LIC_OK = /^(CC0|Public domain|CC BY|CC BY-SA|CC BY 4\.0|CC BY-SA 4\.0)/i;

const manifiesto = JSON.parse(readFileSync(rutaManifiesto, "utf8"));
const vida = manifiesto.vida || { fresca_dias: 90, vigente_dias: 150, retirar_dias: 240 };
manifiesto.creditos = manifiesto.creditos || {};

const yaVistas = new Set(Object.values(manifiesto.creditos).map((c) => c.fuente));
const yaFicheros = new Set(Object.values(manifiesto.grupos).flat().map((f) => f.file));

const dias = (iso) => Math.floor((Date.now() - new Date(iso + "T12:00:00")) / 86400000);
const limpio = (t) => t.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function buscar(termino) {
  const qs = new URLSearchParams({
    action: "query", format: "json", generator: "search",
    gsrsearch: termino, gsrnamespace: "6", gsrlimit: "20",
    prop: "imageinfo", iiprop: "url|extmetadata|mime", iiurlwidth: "2000",
  });
  return fetch(API + "?" + qs, { headers: { "User-Agent": UA } })
    .then((r) => r.json())
    .then((d) => Object.values((d.query || {}).pages || {}))
    .catch(() => []);
}

function slug(titulo) {
  return titulo
    .replace(/^File:/, "")
    .replace(/\.[a-z]+$/i, "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/* huella perceptual: evita dar de alta fotos casi iguales a las que ya hay */
function ahash(fichero) {
  try {
    const bruto = execFileSync(FF, ["-v", "error", "-i", fichero, "-vf", "scale=16:16,format=gray", "-f", "rawvideo", "-"]);
    if (bruto.length < 256) return null;
    const vals = Array.from(bruto.slice(0, 256));
    const media = vals.reduce((a, b) => a + b, 0) / 256;
    let bits = 0n;
    vals.forEach((v, i) => { if (v > media) bits |= 1n << BigInt(i); });
    return bits;
  } catch {
    return null;
  }
}

function parecido(a, b) {
  if (a == null || b == null) return false;
  let x = a ^ b, n = 0;
  while (x) { n += Number(x & 1n); x >>= 1n; }
  return n <= 10;
}

function convertir(origen, destino) {
  execFileSync(FF, ["-y", "-loglevel", "error", "-i", origen, "-vf", "scale=1600:-2", "-quality", "80", destino]);
}

if (!existsSync(carpeta)) mkdirSync(carpeta, { recursive: true });

console.log("Buscando fotos nuevas…");
const candidatas = [];
for (const t of BUSQUEDAS) {
  const paginas = await buscar(t);
  for (const p of paginas) {
    const ii = (p.imageinfo || [])[0];
    if (!ii || !ii.thumburl) continue;
    if (!/^image\/(jpeg|png|webp)$/.test(ii.mime || "")) continue;
    const md = ii.extmetadata || {};
    const lic = (md.LicenseShortName || {}).value || "";
    if (!LIC_OK.test(lic)) continue;
    const fuente = "https://commons.wikimedia.org/wiki/" + p.title.replace(/ /g, "_");
    if (yaVistas.has(fuente)) continue;
    candidatas.push({
      titulo: p.title,
      url: ii.thumburl,
      lic,
      autor: limpio((md.Artist || {}).value || ""),
      fuente,
    });
  }
  if (candidatas.length >= MAX) break;
}

if (!candidatas.length) {
  console.log("No hay fotos nuevas con licencia libre. Nada que hacer.");
}

let altas = 0;
for (const c of candidatas.slice(0, MAX)) {
  let nombre = slug(c.titulo) || "amr26-" + Date.now();
  while (yaFicheros.has(nombre)) nombre += "-b";
  const tmp = join(carpeta, "_tmp-" + nombre + ".jpg");
  const destino = join(carpeta, nombre + ".webp");
  try {
    const r = await fetch(c.url, { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
    convertir(tmp, destino);
    /* si se parece demasiado a una foto que ya está en portada, se descarta */
    const huella = ahash(destino);
    const repetida = manifiesto.grupos.portada.some((f) => {
      const ruta = join(carpeta, f.file + ".webp");
      return existsSync(ruta) && parecido(huella, ahash(ruta));
    });
    if (repetida) {
      console.log("  · descartada por parecerse a otra:", nombre);
      continue;
    }

    const entrada = { file: nombre, alta: HOY, temporada: 2026 };
    for (const grupo of ["galeria", "coche", "portada"]) {
      if (!manifiesto.grupos[grupo].some((f) => f.file === nombre)) {
        manifiesto.grupos[grupo].unshift(entrada);
      }
    }
    /* si es una foto del coche, también entra en la banda ancha de Monoplaza:
       así el banner se renueva solo con material reciente */
    if (/amr|coche/i.test(nombre)) {
      manifiesto.grupos.panoramica = manifiesto.grupos.panoramica || [];
      if (!manifiesto.grupos.panoramica.some((f) => f.file === nombre)) {
        manifiesto.grupos.panoramica.unshift(entrada);
        manifiesto.grupos.panoramica = manifiesto.grupos.panoramica.slice(0, 3);
      }
    }

    /* si la foto es del coche, entra también en el escaparate de la ficha */
    if (/amr|coche|car/i.test(nombre)) {
      manifiesto.grupos.ficha = manifiesto.grupos.ficha || [];
      if (!manifiesto.grupos.ficha.some((f) => f.file === nombre)) {
        manifiesto.grupos.ficha.unshift(entrada);
        manifiesto.grupos.ficha = manifiesto.grupos.ficha.slice(0, 4);
      }
    }
    manifiesto.creditos[nombre] = { autor: c.autor, lic: c.lic, fuente: c.fuente };
    yaFicheros.add(nombre);
    altas++;
    console.log("  + alta:", nombre, "|", c.lic);
  } catch (e) {
    console.warn("  ! fallo con", c.titulo, "→", e.message);
  } finally {
    try { if (existsSync(tmp)) writeFileSync(tmp, ""); } catch {}
  }
}

/* retirada de las viejas en portada y coche, nunca en la galería */
let retiradas = 0;
for (const grupo of ["portada", "coche"]) {
  const antes = manifiesto.grupos[grupo].length;
  manifiesto.grupos[grupo] = manifiesto.grupos[grupo].filter((f) => dias(f.alta) <= vida.retirar_dias);
  retiradas += antes - manifiesto.grupos[grupo].length;
  if (manifiesto.grupos[grupo].length < 2) {
    manifiesto.grupos[grupo] = manifiesto.grupos.galeria
      .slice().sort((a, b) => new Date(b.alta) - new Date(a.alta)).slice(0, 3);
  }
}

/* la portada y la ficha se quedan solo con lo más reciente: las fotos
   que salen de la ventana no vuelven nunca (siguen en la galería) */
const RECORTE_PORTADA = 6;
manifiesto.grupos.portada = manifiesto.grupos.portada.slice(0, RECORTE_PORTADA);
manifiesto.grupos.coche = manifiesto.grupos.coche.slice(0, 8);
manifiesto.grupos.ficha = (manifiesto.grupos.ficha || []).slice(0, 4);

for (const grupo of Object.keys(manifiesto.grupos)) {
  manifiesto.grupos[grupo].sort((a, b) => new Date(b.alta) - new Date(a.alta));
}

writeFileSync(rutaManifiesto, JSON.stringify(manifiesto, null, 2) + "\n", "utf8");
console.log(`Listo: ${altas} altas, ${retiradas} retiradas. Portada: ${manifiesto.grupos.portada.length}, coche: ${manifiesto.grupos.coche.length}, galería: ${manifiesto.grupos.galeria.length}.`);
