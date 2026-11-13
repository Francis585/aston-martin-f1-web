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
2. **og:image + sitemap.xml + robots.txt**: hoy el enlace no genera tarjeta al compartirlo.
3. **Pasada de móvil** (390 px) sección por sección.
4. **Rendimiento**: comprimir el pool de portada, `srcset`, carga diferida de la galería.
5. **Vídeos de adelantamientos**: los momentos llevan ahora un enlace «Buscar vídeo» a YouTube.
   Si se pasan IDs concretos, se sustituyen por el reproductor en el modal.
6. **Revisar el cierre de temporada**: `scripts/nueva-temporada.mjs` no existe todavía;
   la edición 2027 ya está escrita en `estilos/temporadas.css`.

## Aviso importante de despliegue

Vercel bloquea despliegues si el **autor del commit** no tiene permiso en el proyecto.
El repo local ya está configurado como `Francis585 <115222598+Francis585@users.noreply.github.com>`.
Si se commitea con otro autor, el deploy sale `BLOCKED`.
