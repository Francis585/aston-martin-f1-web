/* =========================================================
   /api/registro — alta de aficionado
   Valida en servidor y guarda en Neon Postgres por HTTP.
   No guarda la contraseña ni el fichero: solo el nombre.
   ========================================================= */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const DNI_RE = /^[0-9]{8}[A-Za-z]$/;
const CP_RE = /^[0-9]{5}$/;

/* Límite por IP: 5 altas por minuto y 30 por hora.
   Es memoria de instancia (no compartida entre lambdas), suficiente
   para frenar scripts que martilleen el formulario. */
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 5;
const HOUR_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 30;
const hits = new Map();

function tooMany(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { start: now, count: 0, hourStart: now, hourCount: 0 };

  if (now - rec.start > WINDOW_MS) {
    rec.start = now;
    rec.count = 0;
  }
  if (now - rec.hourStart > HOUR_MS) {
    rec.hourStart = now;
    rec.hourCount = 0;
  }

  rec.count++;
  rec.hourCount++;
  hits.set(ip, rec);

  if (hits.size > 5000) hits.clear();

  return rec.count > MAX_PER_WINDOW || rec.hourCount > MAX_PER_HOUR;
}

function clean(value, max = 200) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

async function sql(query, params = []) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no configurada");

  const host = new URL(url).host;
  const res = await fetch("https://" + host + "/sql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": url,
    },
    body: JSON.stringify({ query, params }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error de base de datos");
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  const ip =
    String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim() || "desconocida";

  if (tooMany(ip)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({
      ok: false,
      error: "Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ ok: false, error: "JSON no válido" });
    }
  }
  body = body || {};

  /* Honeypot: los bots rellenan este campo oculto */
  if (clean(body.website)) {
    return res.status(200).json({ ok: true });
  }

  const data = {
    nombre: clean(body.nombre, 80),
    apellidos: clean(body.apellidos, 120),
    dni: clean(body.dni, 12).toUpperCase(),
    nacimiento: clean(body.nacimiento, 10) || null,
    direccion: clean(body.direccion, 200),
    ciudad: clean(body.ciudad, 80),
    cp: clean(body.cp, 5),
    pais: clean(body.pais, 80),
    email: clean(body.email, 160).toLowerCase(),
    sexo: clean(body.sexo, 1) || null,
    aficion: clean(body.aficion, 120) || null,
    foto: clean(body.foto, 160) || null,
  };

  const errors = {};
  if (data.nombre.length < 2) errors.nombre = "Nombre demasiado corto.";
  if (data.apellidos.length < 2) errors.apellidos = "Apellidos demasiado cortos.";
  if (!DNI_RE.test(data.dni)) errors.dni = "DNI no válido.";
  if (data.direccion.length < 5) errors.direccion = "Dirección no válida.";
  if (data.ciudad.length < 2) errors.ciudad = "Ciudad no válida.";
  if (!CP_RE.test(data.cp)) errors.cp = "Código postal no válido.";
  if (data.pais.length < 2) errors.pais = "País no válido.";
  if (!EMAIL_RE.test(data.email)) errors.email = "Email no válido.";
  if (data.sexo && !["H", "M", "X"].includes(data.sexo)) errors.sexo = "Valor no válido.";

  if (Object.keys(errors).length) {
    return res.status(422).json({ ok: false, error: "Revisa los campos", fields: errors });
  }

  try {
    const existing = await sql(
      "SELECT id FROM aston_registros WHERE email = $1 LIMIT 1",
      [data.email]
    );
    if (existing.rows && existing.rows.length) {
      return res.status(409).json({
        ok: false,
        error: "Ese email ya está registrado.",
        fields: { email: "Este email ya está dado de alta." },
      });
    }

    const result = await sql(
      `INSERT INTO aston_registros
        (nombre, apellidos, dni, nacimiento, direccion, ciudad, cp, pais, email, sexo, aficion, foto_nombre)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, creado_en`,
      [
        data.nombre,
        data.apellidos,
        data.dni,
        data.nacimiento,
        data.direccion,
        data.ciudad,
        data.cp,
        data.pais,
        data.email,
        data.sexo,
        data.aficion,
        data.foto,
      ]
    );

    return res.status(201).json({
      ok: true,
      id: result.rows[0].id,
      message: "Alta completada. Bienvenido al equipo.",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "No se pudo guardar el registro. Inténtalo más tarde.",
    });
  }
};
