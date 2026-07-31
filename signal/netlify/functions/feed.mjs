/**
 * Feed proxy.
 *
 * Browsers can't fetch most RSS feeds directly — the publishers don't send
 * CORS headers — so the fetch happens here instead. The allowlist keeps this
 * from being an open proxy: only the hosts Signal actually ships can be
 * reached. Keep it in sync with FEED_HOSTS in src/sources.ts.
 */

const ALLOWED_HOSTS = new Set([
  "aws.amazon.com",
  "blog.cloudflare.com",
  "blog.pragmaticengineer.com",
  "cloudnativenow.com",
  "feeds.arstechnica.com",
  "github.blog",
  "importai.substack.com",
  "kubernetes.io",
  "lobste.rs",
  "simonwillison.net",
  "sreweekly.com",
  "stratechery.com",
  "tldr.tech",
  "www.allthingsdistributed.com",
  "www.cncf.io",
  "www.lastweekinaws.com",
  "www.theverge.com",
]);

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const target = new URL(req.url).searchParams.get("url");
  if (!target) {
    return json({ error: "missing url parameter" }, 400);
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return json({ error: "malformed url" }, 400);
  }

  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return json({ error: `host not allowed: ${parsed.hostname}` }, 403);
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        // Several of these feeds 403 a bare fetch with no user agent.
        "user-agent": "Mozilla/5.0 (compatible; SignalReader/1.0; +https://github.com/opticalD)",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!upstream.ok) {
      return json({ error: `upstream responded ${upstream.status}` }, 502);
    }

    const body = await upstream.text();
    return new Response(body, {
      status: 200,
      headers: {
        ...CORS,
        "content-type": "text/xml; charset=utf-8",
        // Feeds don't change minute to minute; let the CDN absorb the load.
        "cache-control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (err) {
    const reason = err?.name === "TimeoutError" ? "upstream timed out" : "upstream fetch failed";
    return json({ error: reason }, 504);
  }
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}
