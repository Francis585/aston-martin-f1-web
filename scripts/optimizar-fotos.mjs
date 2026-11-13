#!/usr/bin/env node
/* Recomprime las fotos que pesan demasiado. Sin dependencias: usa ffmpeg. */
import { readdirSync, statSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const carpeta = join(raiz, "imgs", "2026");
function aRutaNativa(p) {
  if (!p) return p;
  const m = p.match(/^\/([a-zA-Z])\/(.*)$/);
  return m ? m[1].toUpperCase() + ":\\" + m[2].replace(/\//g, "\\") : p;
}
const FF = aRutaNativa(process.env.FFMPEG || join(process.env.LOCALAPPDATA || "", "hermes", "tools", "ffmpeg-9.0.1-win32-x64", "bin", "ffmpeg.exe"));
const LIMITE = 180 * 1024;
let antes = 0, despues = 0, tocadas = 0;

for (const f of readdirSync(carpeta)) {
  if (!/\.webp$/i.test(f)) continue;
  const ruta = join(carpeta, f);
  const tam = statSync(ruta).size;
  if (tam <= LIMITE) continue;
  const tmp = ruta + ".tmp.webp";
  try {
    execFileSync(FF, ["-y", "-loglevel", "error", "-i", ruta, "-vf", "scale='min(1400,iw)':-2", "-quality", "70", tmp]);
    const nuevo = statSync(tmp).size;
    if (nuevo < tam) {
      renameSync(tmp, ruta);
      antes += tam; despues += nuevo; tocadas++;
      console.log(`${f}: ${Math.round(tam / 1024)} KB → ${Math.round(nuevo / 1024)} KB`);
    } else {
      execFileSync("rm", ["-f", tmp]);
    }
  } catch (e) {
    console.warn("fallo con", f, e.message);
  }
}
console.log(`\n${tocadas} fotos optimizadas. ${Math.round(antes / 1024)} KB → ${Math.round(despues / 1024)} KB`);
