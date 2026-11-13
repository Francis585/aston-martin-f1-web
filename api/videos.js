/* =========================================================
   /api/videos — últimos vídeos del canal oficial de Aston Martin
   Lee el RSS de YouTube (sin API key) y devuelve los 3 más recientes.
   ========================================================= */

const CHANNEL_ID = "UC8pLH6_Dz4QwKYE-dtcaxeg"; // Aston Martin Aramco Formula One™ Team
const FEED = "https://www.youtube.com/feeds/videos.xml?channel_id=" + CHANNEL_ID;

function decode(str) {
  return String(str)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(FEED, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AstonMartinF1Academic/1.0)",
        Accept: "application/atom+xml, application/xml, text/xml, */*",
      },
    });
    clearTimeout(timer);

    if (!response.ok) throw new Error("HTTP " + response.status);

    const xml = await response.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

    const items = entries
      .map((entry) => {
        const id = (entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
        const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
        const published = (entry.match(/<published>([^<]+)<\/published>/) || [])[1];
        return {
          id: id || "",
          title: decode(title || ""),
          published: published || null,
        };
      })
      .filter((v) => v.id)
      .slice(0, 3);

    return res.status(200).json({
      updated: new Date().toISOString(),
      channel: "Aston Martin Aramco Formula One Team",
      count: items.length,
      items,
    });
  } catch (err) {
    return res.status(200).json({
      updated: new Date().toISOString(),
      count: 0,
      items: [],
      error: "No se pudo leer el canal",
    });
  }
};
