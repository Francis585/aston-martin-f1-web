# Pendientes — web Aston Martin F1

Estado al 13/11/2026. Deploy: https://astonmartin-f1-team.vercel.app
Repo: https://github.com/Francis585/aston-martin-f1-web (privado)

## Automatizado y funcionando

- **Fotos**: cron semanal (lunes 10:00) → `scripts/renovar-fotos.mjs`. Busca en Wikimedia Commons
  (incluye el GP más reciente), filtra licencias libres, descarta parecidas (hash perceptual),
  convierte a webp, da de alta, recorta la portada a las 6 más recientes y despliega verificando.
- **Portada**: rotación con ventana de 6 fotos; alterna Alonso → Stroll → coche.
- **Ficha del coche**: escaparate 3D con cambio de foto cada 8 s (grupo `ficha`).
- **Colores por GP**: solo de jueves a lunes de carrera; fuera, estilos de marca.
- **Calendario**: `js/rotation.js` lo pide a la API (jolpica) y mapea circuito → paleta;
  tabla local solo como respaldo.
- **Mari Boya**: `/api/academia` (clasificación F2 de Wikipedia, cache 1 h) + respaldo en `f1-data.js`.

## Cola para la próxima sesión

1. **Retratos en la portada** (pilotos + Adrian Newey): hay fotos CC en Commons.
   Añadir un grupo `retratos` y meter 1 de cada 4 slides, con `object-position` para caras.
2. **srcset** en la galería (las fotos ya están comprimidas a ~1,3 MB en total).

## Hecho (13/11/2026)

- **Vídeos de los momentos**: las 11 tarjetas llevan enlace directo a un clip oficial de F1.
  Nueve se añadieron hoy (2021 Bakú, 2023 Mónaco/Zandvoort/Austin/Interlagos/Las Vegas,
  montaje de 2023, vuelta rápida 2024 y remontada 2025). Ya no queda ningún «Buscar vídeo».
- **Cierre de temporada**: `scripts/nueva-temporada.mjs`. Cierra la ficha del año que acaba
  (con posición y puntos reales), abre la fila de la temporada nueva con su chasis y motor,
  crea la ficha editorial, la carpeta `imgs/<año>/` y la edición de diseño. Tiene `--simular`
  y revierte solo si el JS queda inválido.
- **Chasis 2027 y textos**: la ficha de 2027 (AMR27 · Honda RA627H) ya está escrita en
  `js/f1-data.js`; no se muestra hasta que exista su fila en `seasons`, que es lo que añade
  el script. Así no aparece un año futuro en la tabla antes de tiempo.

## Hecho después de la primera lista

- Noticias de la home conectadas a `/api/news`: siempre las tres más recientes.
- `og:image` 1200x630, `sitemap.xml`, `robots.txt` y `canonical`.
- Fotos optimizadas: 2,4 MB → 1,3 MB; la renovación ya descarga a 1400 px.
- Móvil auditado a 390 px: sin desbordes; tabla con scroll propio y enlaces del pie con más área táctil.
- HTML servido con `no-store` y assets versionados (`scripts/publicar.sh`).

## Aviso importante de despliegue

Vercel bloquea despliegues si el **autor del commit** no tiene permiso en el proyecto.
El repo local ya está configurado como `Francis585 <115222598+Francis585@users.noreply.github.com>`.
Si se commitea con otro autor, el deploy sale `BLOCKED`.
