// woz-proxy-worker.js — Cloudflare Worker
// Piepklein proxy'tje dat het WOZ-waardeloket server-side ophaalt en er een CORS-header op zet,
// zodat je frontend op GitHub Pages de WOZ-waarde kan opvragen.
//
// Deploy (gratis, ~5 min):
//   1. Ga naar https://dash.cloudflare.com  -> Workers & Pages -> Create -> Worker
//   2. Vervang de standaardcode door dit bestand, klik Deploy
//   3. Je krijgt een URL als: https://woz-proxy.<jouw-subdomein>.workers.dev
//   4. In je frontend roep je aan: `${WOZ_PROXY}/${nummeraanduidingId}`
//
// (Alternatief lokaal deployen: `npm i -g wrangler`, `wrangler deploy`.)

const UPSTREAM = "https://www.wozwaardeloket.nl/wozwaardeloket-api/v1/wozwaarde/nummeraanduiding/";

// Zet dit op je eigen site-origin voor productie; "*" is prima voor een demo/MVP.
const ALLOW_ORIGIN = "*";

const CORS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    // pad = /{nummeraanduidingId}
    const id = url.pathname.replace(/^\/+/, "").trim();

    if (!/^[0-9]{16}$/.test(id)) {
      return json({ error: "Ongeldig nummeraanduiding-id (verwacht 16 cijfers)." }, 400);
    }

    try {
      const upstream = await fetch(UPSTREAM + id, {
        headers: { "Accept": "application/json", "User-Agent": "acquisitie-radar-mvp" },
      });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
      });
    } catch (e) {
      return json({ error: "Upstream WOZ-fout", detail: String(e) }, 502);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });
}
