# Aston Martin Aramco F1 Team

Sitio web de la escudería **Aston Martin Aramco Formula One Team**: historia, pilotos, monoplaza, temporadas, galería por circuito y noticias. HTML, CSS y JavaScript sin frameworks, con datos de F1 que se actualizan solos.

## Estructura

```
src/            index.html · noticias.html · registro.html
estilos/        index.css (sistema de diseño completo)
js/             index.js (interacciones, sin dependencias)
imgs/           fotografías del equipo y de las noticias
docs/           política de privacidad y términos
vercel.json     rewrites para servir /src como raíz
```

## Datos que se actualizan solos

`js/f1-data.js` es la fuente única de verdad: equipo, pilotos y una línea por
temporada. La temporada en curso se detecta con el año del sistema y sus datos
(posición, puntos y carreras) se sincronizan al cargar desde la API pública
[Jolpica F1](https://api.jolpi.ca/ergast/). Si la API no responde, se usan los
valores de respaldo del propio fichero.

La fila del año en curso se crea sola si no existe, así que la tabla nunca se
queda atrás al cambiar de año. Para conservar el chasis y los pilotos de una
temporada pasada, añádela a `seasons` con una línea.

## Noticias y circuitos automáticos

- `api/news.js` es una función serverless de Vercel que agrega los RSS de Marca,
  AS, Motorsport.com, Mundo Deportivo y Autobild, filtra por Aston Martin,
  Alonso, Stroll, Newey o AMR26 y devuelve los 12 titulares más recientes.
  Cachea 10 minutos en el CDN.
- El calendario de circuitos se genera desde la API de F1 y muestra el trazado
  de cada circuito desde `imgs/circuitos/{round}.webp`.
- `api/videos.js` lee el RSS del canal oficial de YouTube y devuelve los tres
  vídeos más recientes. Se cachea 30 minutos.
- Los datos de temporada (chasis, motor, jefe de equipo) se escriben una vez al
  año en `js/f1-data.js` y se pintan en toda la web con `data-chassis`,
  `data-power-unit` y `data-team-principal`.

## Qué incluye

- **Portada** con hero a pantalla completa, marquesina, escudería, timeline histórico, temporadas en pestañas, pilotos, ficha del AMR24, galería con lightbox y últimas noticias.
- **Noticias** con filtros por categoría y vídeos embebidos.
- **Alta de aficionado** con validación de formulario en cliente y mensajes de error propios.
- Diseño responsive (móvil, tablet, escritorio), navegación por teclado, `prefers-reduced-motion` y foco visible.
- Sin frameworks ni dependencias: HTML, CSS y JavaScript vanilla.

## Desarrollo local

```bash
python -m http.server 8765
# http://localhost:8765/src/index.html
```

## Despliegue

```bash
vercel --prod
```

Las rutas `/`, `/noticias.html` y `/registro.html` se reescriben a `src/` mediante `vercel.json`.

## Edición, tema de GP y rotación de fotos

La web se sirve en una **edición distinta cada temporada** y, dentro del año, en **cuatro fases**:

- `js/edicion.js` pone `data-temporada` (año) y `data-fase` (I-IV) en `<html>`. La temporada arranca en marzo; en enero y febrero se sigue sirviendo la edición del año anterior.
- `estilos/temporadas.css` define cada edición completa: tipografía, radios, paleta, forma de los botones. La 2026 es la actual; las 2027 y 2028 están preparadas para que el cambio de año no requiera diseñar de cero.
- Para verlas sin esperar: `?edicion=2027&fase=2`.

Encima de eso, `js/rotation.js` cambia el acento según el **GP activo** del calendario (`estilos/temas.css`): el detalle en puntos, enlaces y hovers cambia por región; las superficies grandes (banda, botones, cifras) se quedan siempre en el verde y el lima de la marca.

### Fotos: alta y caducidad

`fotos.json` es el registro: qué foto está en cada grupo (portada, coche, galería) y **cuándo se dio de alta**.

```bash
node scripts/nueva-foto.mjs            # da de alta las fotos nuevas y retira las caducadas
node scripts/nueva-foto.mjs --revisar  # informe de antigüedad
```

Reglas de vida útil (`vida` en el JSON): hasta 120 días la foto es fresca, hasta 240 sigue vigente, y a partir de 365 se retira de portada y de la ficha del coche. **La galería nunca se vacía**: las fotos viejas solo dejan de promocionarse. Si un grupo se quedaría sin material, se reutilizan las tres más recientes.

Para añadir fotos nuevas basta con dejar los `.webp` en `imgs/2026/` y ejecutar el script: se registran con la fecha de hoy y entran las primeras en la rotación.

## Créditos

Las imágenes y marcas pertenecen a sus respectivos propietarios. Proyecto académico sin ánimo de lucro.
