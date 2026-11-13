#!/usr/bin/env node
/* =========================================================
   Alta y revisión de fotos
   Uso:
     node scripts/nueva-foto.mjs            → da de alta las fotos nuevas
     node scripts/nueva-foto.mjs --revisar  → informe de antigüedad
   Lee y escribe imgs/fotos.json. Sin dependencias.
   ========================================================= */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const rutaManifiesto = join(raiz, "fotos.json");
const manifiesto = JSON.parse(readFileSync(rutaManifiesto, "utf8"));
const vida = manifiesto.vida || { fresca_dias: 120, vigente_dias: 240, retirar_dias: 365 };
const HOY = new Date();

const dias = (iso) => Math.floor((HOY - new Date(iso + "T12:00:00")) / 86400000);
const iso = (d) => d.toISOString().slice(0, 10);

/* --- 1. Fotos existentes en disco, por temporada --- */
const carpetas = readdirSync(join(raiz, "imgs")).filter((d) => {
  const p = join(raiz, "imgs", d);
  return statSync(p).isDirectory() && /^\d{4}$/.test(d);
});

const enDisco = [];
for (const carpeta of carpetas) {
  for (const f of readdirSync(join(raiz, "imgs", carpeta))) {
    if (!/\.webp$/i.test(f)) continue;
    const alta = iso(statSync(join(raiz, "imgs", carpeta, f)).mtime);
    enDisco.push({ file: f.replace(/\.webp$/i, ""), carpeta, alta });
  }
}

const yaRegistradas = new Set(
  Object.values(manifiesto.grupos).flat().map((x) => x.file)
);

/* --- 2. Informe de antigüedad --- */
const informe = [];
for (const [grupo, lista] of Object.entries(manifiesto.grupos)) {
  for (const foto of lista) {
    const d = dias(foto.alta);
    let estado = "fresca";
    if (d > vida.retirar_dias) estado = "caducada";
    else if (d > vida.vigente_dias) estado = "a retirar";
    else if (d > vida.fresca_dias) estado = "vigente";
    informe.push({ grupo, file: foto.file, alta: foto.alta, dias: d, estado });
  }
}

const porEstado = informe.reduce((acc, f) => ((acc[f.estado] = (acc[f.estado] || 0) + 1), acc), {});
const nuevas = enDisco.filter((f) => !yaRegistradas.has(f.file));

console.log("Fotos en disco:", enDisco.length, "| registradas:", yaRegistradas.size);
console.log("Estados:", porEstado);
if (nuevas.length) console.log("Sin registrar:", nuevas.map((n) => n.file).join(", "));

/* --- 3. Alta de fotos nuevas --- */
let altas = 0;
for (const n of nuevas) {
  const esRetrato = /-card$|-retrato$/i.test(n.file) || /logo|favicon/i.test(n.file);
  const entrada = { file: n.file, alta: n.alta, temporada: Number(n.carpeta) };
  if (!manifiesto.grupos.galeria.some((x) => x.file === n.file)) manifiesto.grupos.galeria.unshift(entrada);
  if (!esRetrato) {
    if (!manifiesto.grupos.portada.some((x) => x.file === n.file)) manifiesto.grupos.portada.unshift(entrada);
    if (!manifiesto.grupos.coche.some((x) => x.file === n.file)) manifiesto.grupos.coche.unshift(entrada);
    /* panorámicas del coche (sin piloto): solo por nombre */
    if (/amr|coche|panor/i.test(n.file)) {
      manifiesto.grupos.panoramica = manifiesto.grupos.panoramica || [];
      if (!manifiesto.grupos.panoramica.some((x) => x.file === n.file)) manifiesto.grupos.panoramica.unshift(entrada);
    }
  }
  altas++;
  console.log("  + alta:", n.file, "(" + n.alta + ")" + (esRetrato ? " solo galería" : ""));
}

/* --- 4. Retirada de portada y coche (nunca de la galería) --- */
let retiradas = 0;
for (const grupo of ["portada", "coche"]) {
  const antes = manifiesto.grupos[grupo].length;
  manifiesto.grupos[grupo] = manifiesto.grupos[grupo].filter((f) => {
    const fuera = dias(f.alta) > vida.retirar_dias;
    if (fuera) console.log("  - retirada de", grupo + ":", f.file, "(" + dias(f.alta) + " días)");
    return !fuera;
  });
  retiradas += antes - manifiesto.grupos[grupo].length;
}

/* Nunca dejar un grupo vacío: si todo es viejo, se conserva lo más nuevo */
for (const grupo of ["portada", "coche"]) {
  if (!manifiesto.grupos[grupo].length) {
    const respaldo = manifiesto.grupos.galeria
      .slice()
      .sort((a, b) => new Date(b.alta) - new Date(a.alta))
      .slice(0, 3);
    manifiesto.grupos[grupo] = respaldo;
    console.log("  !", grupo, "vacío: se reutilizan las", respaldo.length, "más recientes");
  }
}

/* El más nuevo primero, que es el orden en que rota la web */
for (const grupo of ["portada", "coche", "panoramica", "galeria"]) {
  manifiesto.grupos[grupo].sort((a, b) => new Date(b.alta) - new Date(a.alta));
}

writeFileSync(rutaManifiesto, JSON.stringify(manifiesto, null, 2) + "\n", "utf8");
console.log(
  `\nResumen: ${altas} altas, ${retiradas} retiradas. Portada: ${manifiesto.grupos.portada.length}, coche: ${manifiesto.grupos.coche.length}, galería: ${manifiesto.grupos.galeria.length}.`
);
