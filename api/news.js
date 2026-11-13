/* =========================================================
   /api/news — titulares de F1 filtrados por Aston Martin
   Agrega varios RSS, filtra por palabras clave y cachea 10 min.
   Sin dependencias: solo fetch + expresiones regulares.
   ========================================================= */

const FEEDS = [
  { name: "Marca", url: "https://www.marca.com/rss/motor/formula1.xml" },
  { name: "AS", url: "https://as.com/rss/motor/formula_1.xml" },
  { name: "Motorsport.com", url: "https://es.motorsport.com/rss/f1/news/" },
  { name: "Mundo Deportivo", url: "https://www.mundodeportivo.com/rss/motor/f1" },
  { name: "Autobild", url: "https://www.autobild.es/rss/motor" },
];

const KEYWORDS = [
  "aston martin",
  "astonmartin",
  "alonso",
  "stroll",
  "amr26",
  "amr25",
  "newey",
  "silverstone",
  "cowell",
  "cardile",
];

const CATS = [
  { cat: "alonso", words: ["alonso", "asturiano", "bicampeón"] },
  { cat: "stroll", words: ["stroll", "canadiense"] },
  { cat: "coche", words: ["amr26", "amr25", "monoplaza", "honda", "motor", "aerodinámica", "newley", "newey"] },
];

function decode(str) {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    /* entidades primero, para que &lt;b&gt; se convierta en <b> y luego se limpie */
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shorten(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

function pick(block, tag) {
  const m = block.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">", "i"));
  return m ? decode(m[1]) : "";
}

function categorize(text) {
  const t = text.toLowerCase();
  for (const c of CATS) {
    if (c.words.some((w) => t.includes(w))) return c.cat;
  }
  return "equipo";
}

async function loadFeed(feed) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AstonMartinF1Academic/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

    return blocks
      .map((block) => {
        const title = pick(block, "title");
        const link = pick(block, "link");
        const date = pick(block, "pubDate") || pick(block, "dc:date");
        const desc = shorten(pick(block, "description"), 200);
        return { title, link, date, desc, source: feed.name };
      })
      .filter((n) => n.title && n.link);
  } catch (e) {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  const results = await Promise.all(FEEDS.map(loadFeed));
  const all = results.flat();

  const seen = new Set();
  const filtered = all
    .filter((n) => {
      const text = (n.title + " " + n.desc).toLowerCase();
      return KEYWORDS.some((k) => text.includes(k));
    })
    .filter((n) => {
      const key = n.title.toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, "").slice(0, 70);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((n) => ({
      ...n,
      cat: categorize(n.title + " " + n.desc),
      time: Date.parse(n.date) || 0,
    }))
    .sort((a, b) => b.time - a.time)
    .slice(0, 12)
    .map((n) => ({
      title: n.title,
      link: n.link,
      desc: n.desc,
      source: n.source,
      cat: n.cat,
      date: n.time ? new Date(n.time).toISOString() : null,
    }));

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
  res.status(200).json({
    updated: new Date().toISOString(),
    count: filtered.length,
    sources: FEEDS.map((f) => f.name),
    items: filtered,
  });
};
