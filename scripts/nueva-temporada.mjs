#!/usr/bin/env node
/* =========================================================
   Cierre de temporada y arranque de la siguiente
   Uso:
     node scripts/nueva-temporada.mjs --simular
     node scripts/nueva-temporada.mjs
     node scripts/nueva-temporada.mjs --anio 2027 --chasis AMR27 --motor "Honda RA627H"

   Qué hace, en orden:
     1. Cierra la temporada anterior: quita `live` de su fila y rellena su
        ficha editorial con la posición y los puntos reales.
     2. Abre la nueva: fila en `seasons` con `live: true`, chasis y motor.
     3. Crea la ficha editorial de la temporada si no existe (plantilla).
     4. Crea la carpeta imgs/<año>/ para las fotos nuevas.
     5. Añade la edición de diseño del año si falta en FORMATO_TEMPORADA.
     6. Comprueba la sintaxis de todo lo que ha tocado y revierte si falla.

   El calendario NO se toca: js/rotation.js lo pide a la API por año.
   ========================================================= */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const R = {
  datos: join(raiz, "js", "f1-data.js"),
  edicion: join(raiz, "js", "edicion.js"),
  fotos: join(raiz, "fotos.json"),
};

/* ---------- argumentos ---------- */
const args = process.argv.slice(2);
const flag = (n) => args.indexOf("--" + n) !== -1;
const valor = (n, def) => {
  const i = args.indexOf("--" + n);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};

const SIMULAR = flag("simular");
const HOY = new Date();
/* por defecto, la temporada que empieza: si ya estamos en el último
   trimestre del año, la siguiente; si no, la del año en curso. */
const POR_DEFECTO = HOY.getMonth() + 1 >= 10 ? HOY.getFullYear() + 1 : HOY.getFullYear();
const ANIO = parseInt(valor("anio", String(POR_DEFECTO)), 10);
const DOS = String(ANIO).slice(-2);
const CHASIS = valor("chasis", "AMR" + DOS);
const MOTOR = valor("motor", "Honda RA6" + DOS + "H");

const cambios = [];
const anota = (que, detalle) => cambios.push({ que, detalle });

if (!/^\d{4}$/.test(String(ANIO))) {
  console.error("Año no válido:", ANIO);
  process.exit(1);
}

/* ---------- 1. f1-data.js ---------- */
const original = readFileSync(R.datos, "utf8");
const nl = original.includes("\r\n") ? "\r\n" : "\n";
let datos = original;

const leer = (re) => {
  const m = datos.match(re);
  return m ? m[1] : null;
};

const chasisActual = leer(/chassis:\s*"([^"]+)"/);
const motorActual = leer(/powerUnit:\s*"([^"]+)"/);

/* --- equipo --- */
if (chasisActual !== CHASIS) {
  datos = datos.replace(/(\bchassis:\s*)"[^"]+"/, `$1"${CHASIS}"`);
  anota("Equipo · chasis", `${chasisActual} → ${CHASIS}`);
}
if (motorActual !== MOTOR) {
  datos = datos.replace(/(\bpowerUnit:\s*)"[^"]+"/, `$1"${MOTOR}"`);
  anota("Equipo · motor", `${motorActual} → ${MOTOR}`);
}

/* --- seasons: cerrar la anterior y abrir la nueva --- */
const bloqueSeasons = leer(/seasons:\s*\[([\s\S]*?)\n\s*\],/);
if (bloqueSeasons === null) {
  console.error("No encuentro el array `seasons` en js/f1-data.js");
  process.exit(1);
}

const yaExiste = new RegExp(`year:\\s*${ANIO}\\b`).test(bloqueSeasons);
if (yaExiste) {
  console.log(`La temporada ${ANIO} ya está en \`seasons\`. No se duplica.`);
}

/* quitar live de cualquier fila que no sea la nueva */
let bloqueNuevo = bloqueSeasons.replace(/,?\s*live:\s*true/g, "");
if (bloqueNuevo !== bloqueSeasons) {
  anota("Seasons · temporada cerrada", "quitado `live: true` de la fila anterior");
}

if (!yaExiste) {
  const fila =
    `${nl}    { year: ${ANIO}, pos: null, points: null, podiums: 0, wins: 0, ` +
    `chassis: "${CHASIS}", drivers: "Alonso · Stroll", live: true },`;
  /* se inserta al final del array, respetando la coma de la última fila */
  bloqueNuevo = bloqueNuevo.replace(/,?\s*$/, ",") + fila;
  anota("Seasons · temporada nueva", `${ANIO} con ${CHASIS}`);
}

if (bloqueNuevo !== bloqueSeasons) {
  datos = datos.replace(bloqueSeasons, bloqueNuevo);
}

/* --- seasonNotes: plantilla si falta --- */
const tieneFicha = new RegExp(`^\\s*${ANIO}:\\s*\\{`, "m").test(
  leer(/seasonNotes:\s*\{([\s\S]*?)\n\s*\},/) || ""
);
if (!tieneFicha) {
  const ficha = [
    `${nl}    ${ANIO}: {`,
    `${nl}      title: "${ANIO} · ${CHASIS}",`,
    `${nl}      body: [`,
    `${nl}        "Segunda temporada del ciclo Honda. El ${CHASIS} parte del trabajo del año anterior y de la primera evaluación completa del paquete híbrido al 50 %: el equipo ya conoce el motor y puede dedicar el invierno a la aerodinámica en lugar de a la fiabilidad.",`,
    `${nl}        "Con Adrian Newey en la dirección técnica, el objetivo declarado es pelear de forma regular por la zona de puntos y acercarse al grupo de cabeza en las citas de perfil bajo. Los resultados se irán añadiendo aquí según avance el campeonato.",`,
    `${nl}      ],`,
    `${nl}      facts: [`,
    `${nl}        ["Chasis", "${CHASIS}"],`,
    `${nl}        ["Motor", "${MOTOR}"],`,
    `${nl}        ["Pilotos", "Alonso · Stroll"],`,
    `${nl}        ["Team Principal", "Adrian Newey"],`,
    `${nl}      ],`,
    `${nl}    },`,
  ].join("");
  const cabecera = `${nl}  seasonNotes: {`;
  if (!datos.includes(cabecera)) {
    console.error("No encuentro `seasonNotes` en js/f1-data.js");
    process.exit(1);
  }
  datos = datos.replace(cabecera, cabecera + ficha);
  anota("Ficha editorial", `${ANIO} creada con plantilla (revisar texto a mano)`);
}

/* --- cerrar la ficha de la temporada anterior con datos reales --- */
const anterior = ANIO - 1;
const filaAnterior = (bloqueSeasons.match(
  new RegExp(`\\{ year:\\s*${anterior}[^}]*\\}`)
) || [])[0];
if (filaAnterior) {
  const pos = (filaAnterior.match(/pos:\s*([^,}]+)/) || [])[1];
  const pts = (filaAnterior.match(/points:\s*([^,}]+)/) || [])[1];
  const posTxt = pos && pos.trim() !== "null" ? pos.trim() + "º" : null;
  const ptsTxt = pts && pts.trim() !== "null" ? pts.trim() : null;
  const marca = `${nl}    ${anterior}: {`;
  const i = datos.indexOf(marca);
  if (i !== -1 && posTxt && ptsTxt) {
    const fin = datos.indexOf(`${nl}    },`, i);
    const trozo = datos.slice(i, fin);
    if (trozo.includes("facts:")) {
      let nuevoTrozo = trozo
        .replace(/(\["Posición",\s*)"[^"]*"/, `$1"${posTxt}"`)
        .replace(/(\["Puntos",\s*)"[^"]*"/, `$1"${ptsTxt}"`);
      /* si la ficha cerrada no traía esas cifras, se añaden arriba */
      if (!/\["Posición"/.test(trozo)) {
        nuevoTrozo = nuevoTrozo.replace(
          /facts:\s*\[/,
          "facts: [" + nl + '        ["Posición", "' + posTxt + '"],' + nl +
            '        ["Puntos", "' + ptsTxt + '"],'
        );
      }
      if (nuevoTrozo !== trozo) {
        datos = datos.slice(0, i) + nuevoTrozo + datos.slice(fin);
        anota("Ficha editorial", `${anterior} cerrada con ${posTxt} y ${ptsTxt} puntos`);
      }
    }
  }
}

/* ---------- 2. edicion.js: la edición del año nuevo ---------- */
const originalEd = readFileSync(R.edicion, "utf8");
let ed = originalEd;
const mFmt = ed.match(/FORMATO_TEMPORADA\s*=\s*\{([^}]*)\}/);
if (mFmt && !new RegExp(`\\b${ANIO}\\s*:`).test(mFmt[1])) {
  /* formatos alternos: a, b, a, b… */
  const letras = (mFmt[1].match(/"(a|b)"/g) || []).map((x) => x.replace(/"/g, ""));
  const siguiente = letras.length && letras[letras.length - 1] === "a" ? "b" : "a";
  const dentro = mFmt[1].replace(/\s*$/, "");
  const conComa = /,\s*$/.test(dentro) ? dentro : dentro + ",";
  ed = ed.replace(
    mFmt[0],
    `FORMATO_TEMPORADA = {${conComa} ${ANIO}: "${siguiente}" }`
  );
  anota("Edición de diseño", `${ANIO} → formato "${siguiente}"`);
}

/* ---------- 3. carpeta de fotos del año ---------- */
const carpeta = join(raiz, "imgs", String(ANIO));
const carpetaExiste = existsSync(carpeta);
if (!carpetaExiste) anota("Carpeta de fotos", `imgs/${ANIO}/ creada`);

/* ---------- resumen antes de escribir ---------- */
console.log(`\nTemporada ${ANIO} · ${CHASIS} · ${MOTOR}`);
if (SIMULAR) console.log("(simulación: no se escribe nada)\n");
if (!cambios.length) {
  console.log("Nada que cambiar: la temporada ya estaba preparada.\n");
  process.exit(0);
}
cambios.forEach((c) => console.log(`  · ${c.que}: ${c.detalle}`));

if (SIMULAR) {
  console.log("\nEjecuta sin --simular para aplicarlo.\n");
  process.exit(0);
}

/* ---------- escribir y verificar ---------- */
const escribir = (ruta, texto) => writeFileSync(ruta, texto, "utf8");
const revertir = () => {
  escribir(R.datos, original);
  escribir(R.edicion, originalEd);
};

try {
  if (datos !== original) escribir(R.datos, datos);
  if (ed !== originalEd) escribir(R.edicion, ed);
  if (!carpetaExiste) mkdirSync(carpeta, { recursive: true });

  /* el fichero de datos debe seguir siendo JS válido */
  execFileSync(process.execPath, ["--check", R.datos], { stdio: "pipe" });
  execFileSync(process.execPath, ["--check", R.edicion], { stdio: "pipe" });
} catch (e) {
  revertir();
  console.error("\nError de sintaxis: se han revertido los cambios.");
  console.error(String(e.stderr || e.message).split("\n").slice(0, 4).join("\n"));
  process.exit(1);
}

/* ---------- comprobación final sobre el texto escrito ---------- */
const final = readFileSync(R.datos, "utf8");
const ok = [
  final.includes(`chassis: "${CHASIS}"`),
  final.includes(`powerUnit: "${MOTOR}"`),
  new RegExp(`year:\\s*${ANIO}\\b`).test(final),
  new RegExp(`^\\s*${ANIO}:\\s*\\{`, "m").test(final),
];
console.log(
  `\nComprobado: chasis ${ok[0] ? "sí" : "NO"}, motor ${ok[1] ? "sí" : "NO"}, ` +
    `fila de temporada ${ok[2] ? "sí" : "NO"}, ficha editorial ${ok[3] ? "sí" : "NO"}.`
);
console.log(
  "Siguiente paso: revisar el texto de la ficha nueva en js/f1-data.js, " +
    "añadir fotos a imgs/" + ANIO + "/ y publicar con scripts/publicar.sh\n"
);
