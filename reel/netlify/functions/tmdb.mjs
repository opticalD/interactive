/**
 * TMDB proxy.
 *
 * The API key must never reach the browser, so every call is signed here. The
 * path allowlist keeps this from becoming an open proxy for someone else's
 * quota — only the read-only endpoints Reel actually uses can be reached.
 */

const ALLOWED_PATHS = [
  /^discover\/(movie|tv)$/,
  /^movie\/(now_playing|upcoming|popular|top_rated)$/,
  /^tv\/(airing_today|on_the_air|popular|top_rated)$/,
  /^trending\/(movie|tv|all)\/(day|week)$/,
  /^(movie|tv)\/\d+$/,
  /^(movie|tv)\/\d+\/watch\/providers$/,
  /^genre\/(movie|tv)\/list$/,
  /^search\/(movie|tv|multi)$/,
  /^configuration$/,
];

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const key = process.env.TMDB_KEY;
  if (!key) return json({ error: "TMDB_KEY is not set on the server" }, 500);

  const incoming = new URL(req.url);
  const path = incoming.searchParams.get("path");
  if (!path) return json({ error: "missing path parameter" }, 400);
  if (!ALLOWED_PATHS.some((re) => re.test(path))) {
    return json({ error: `path not allowed: ${path}` }, 403);
  }

  const target = new URL(`https://api.themoviedb.org/3/${path}`);
  for (const [name, value] of incoming.searchParams) {
    if (name !== "path" && name !== "api_key") target.searchParams.set(name, value);
  }
  target.searchParams.set("api_key", key);

  try {
    const upstream = await fetch(target, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    const body = await upstream.text();
    if (!upstream.ok) {
      // Surface TMDB's own wording — "Invalid API key" is worth reading.
      let reason = `tmdb responded ${upstream.status}`;
      try {
        reason = JSON.parse(body).status_message ?? reason;
      } catch {
        // Non-JSON upstream error; the status line is all we have.
      }
      return json({ error: reason }, 502);
    }
    return new Response(body, {
      status: 200,
      headers: {
        ...CORS,
        "content-type": "application/json; charset=utf-8",
        // Catalogue data is stable for hours; let the CDN absorb repeat swipes.
        "cache-control": "public, max-age=600, s-maxage=3600",
      },
    });
  } catch (err) {
    const reason = err?.name === "TimeoutError" ? "tmdb timed out" : "tmdb fetch failed";
    return json({ error: reason }, 504);
  }
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}
