/* =========================================================
   /api/registros?token=XXX — exportación CSV de las altas
   Protegido con la variable de entorno ADMIN_TOKEN.
   ========================================================= */

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

function csvCell(value) {
  const s = value == null ? "" : String(value);
  return '"' + s.replace(/"/g, '""') + '"';
}

module.exports = async function handler(req, res) {
  const token = process.env.ADMIN_TOKEN;
  const provided =
    (req.query && req.query.token) ||
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "");

  if (!token || provided !== token) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(401).json({ ok: false, error: "No autorizado" });
  }

  try {
    const result = await sql(
      `SELECT id, nombre, apellidos, dni, nacimiento, direccion, ciudad, cp,
              pais, email, sexo, aficion, foto_nombre, creado_en
         FROM aston_registros
        ORDER BY creado_en DESC`
    );

    const cols = [
      "id",
      "nombre",
      "apellidos",
      "dni",
      "nacimiento",
      "direccion",
      "ciudad",
      "cp",
      "pais",
      "email",
      "sexo",
      "aficion",
      "foto_nombre",
      "creado_en",
    ];

    const lines = [cols.join(",")];
    (result.rows || []).forEach((row) => {
      lines.push(cols.map((c) => csvCell(row[c])).join(","));
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="altas-aston-martin.csv"'
    );
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send("\uFEFF" + lines.join("\r\n"));
  } catch (err) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(500).json({ ok: false, error: "Error al exportar" });
  }
};
