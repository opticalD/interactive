import type { Source } from "../sources";

export type Item = {
  /** Stable across refreshes — used for read/save state. */
  id: string;
  sourceId: string;
  title: string;
  url: string;
  /** Plain-text excerpt, already stripped of markup. */
  summary: string;
  published: number;
  /** HN only: score and the link to the thread. */
  points?: number;
  comments?: number;
  discussUrl?: string;
};

export type FetchResult =
  | { ok: true; items: Item[] }
  | { ok: false; error: string };

const PROXY = "/api/feed?url=";

export async function fetchSource(source: Source): Promise<FetchResult> {
  try {
    if (source.kind === "hn") return { ok: true, items: await fetchHackerNews(source.id) };
    if (!source.feed) return { ok: true, items: [] };
    return { ok: true, items: await fetchRss(source) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "failed to load" };
  }
}

/**
 * Hacker News goes through the Algolia API rather than the proxy: it sends
 * permissive CORS headers, and it hands back points and comment counts, which
 * is the part of HN actually worth reading.
 */
async function fetchHackerNews(sourceId: string): Promise<Item[]> {
  const res = await fetch("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30");
  if (!res.ok) throw new Error(`Hacker News responded ${res.status}`);
  const data = await res.json();

  return (data.hits ?? []).map((hit: Record<string, never>): Item => {
    const id = String(hit.objectID);
    const discussUrl = `https://news.ycombinator.com/item?id=${id}`;
    return {
      id: `hn:${id}`,
      sourceId,
      title: String(hit.title ?? "Untitled"),
      // Ask HN and similar have no external link — point them at the thread.
      url: String(hit.url ?? discussUrl),
      summary: "",
      published: Number(hit.created_at_i ?? 0) * 1000,
      points: Number(hit.points ?? 0),
      comments: Number(hit.num_comments ?? 0),
      discussUrl,
    };
  });
}

async function fetchRss(source: Source): Promise<Item[]> {
  const res = await fetch(PROXY + encodeURIComponent(source.feed!));
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `feed responded ${res.status}`);
  }

  const xml = new DOMParser().parseFromString(await res.text(), "text/xml");
  if (xml.querySelector("parsererror")) throw new Error("feed is not valid XML");

  // RSS uses <item>, Atom uses <entry>. Everything else is the same shape.
  const nodes = Array.from(xml.querySelectorAll("item, entry"));
  if (nodes.length === 0) throw new Error("feed had no entries");

  return nodes.map((node, index) => {
    const title = text(node, "title") || "Untitled";
    const url = linkOf(node);
    const published = dateOf(node);
    // Link aggregators (Lobsters) point <comments> at the discussion thread.
    const discussUrl = text(node, "comments");
    return {
      id: `${source.id}:${text(node, "guid") || text(node, "id") || url || `${index}`}`,
      sourceId: source.id,
      title,
      url: url || source.site,
      summary: excerpt(
        text(node, "description") || text(node, "summary") || text(node, "content")
      ),
      published,
      ...(discussUrl ? { discussUrl } : {}),
    };
  });
}

function text(node: Element, tag: string): string {
  // Not querySelector: Atom <entry> and RSS <item> both nest tags we don't want
  // to reach into, and namespaced tags (content:encoded) break CSS selectors.
  const child = Array.from(node.children).find(
    (el) => el.localName === tag || el.nodeName === tag
  );
  return child?.textContent?.trim() ?? "";
}

function linkOf(node: Element): string {
  const plain = text(node, "link");
  if (plain) return plain;
  // Atom puts the URL in an attribute, and may list several rel types.
  const links = Array.from(node.children).filter((el) => el.localName === "link");
  const alternate = links.find((el) => (el.getAttribute("rel") ?? "alternate") === "alternate");
  return alternate?.getAttribute("href") ?? links[0]?.getAttribute("href") ?? "";
}

function dateOf(node: Element): number {
  const raw =
    text(node, "pubDate") ||
    text(node, "published") ||
    text(node, "updated") ||
    text(node, "date");
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

/** Feed descriptions are HTML. Render them as text so nothing gets injected. */
function excerpt(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const plain = (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  // Some feeds put only a "Comments" link in the description. A handful of
  // characters is never a useful excerpt — better to show nothing.
  if (plain.length < 25) return "";
  return plain.length > 260 ? `${plain.slice(0, 259).trimEnd()}…` : plain;
}

export function relativeTime(ts: number): string {
  const seconds = Math.round((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
