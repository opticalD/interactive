export type Lane = "skim" | "infra" | "ai" | "depth";
export type Cadence = "daily" | "weekly" | "occasional";

export type Source = {
  id: string;
  name: string;
  /** One line on why this source earns its place. */
  why: string;
  lane: Lane;
  cadence: Cadence;
  /** Accent colour used for the source dot / chip. */
  hue: string;
  site: string;
  /** RSS/Atom endpoint. Absent means the source has no public feed. */
  feed?: string;
  /** Fetched through the Hacker News API rather than as RSS. */
  kind?: "hn";
  /** Part of the recommended "start with three" set. */
  starter?: boolean;
  /** No feed exists — you subscribe by email instead. */
  emailOnly?: boolean;
  /** Reading-time hint shown on the card, in minutes. */
  minutes?: number;
};

export const LANES: { id: Lane; label: string; blurb: string }[] = [
  { id: "skim", label: "Daily skim", blurb: "Ten minutes, every morning. Breadth, not depth." },
  { id: "infra", label: "Infra & platform", blurb: "Your lane — Kubernetes, cloud, SRE, releases." },
  { id: "ai", label: "AI", blurb: "Research-grounded rather than hype." },
  { id: "depth", label: "Depth", blurb: "Strategy, industry and long reads. Weekend fuel." },
];

export const SOURCES: Source[] = [
  // ── Daily skim ─────────────────────────────────────────────────────────
  {
    id: "hn",
    name: "Hacker News",
    why: "Best single signal for engineering news. The comments beat the article.",
    lane: "skim",
    cadence: "daily",
    hue: "#ff6600",
    site: "https://news.ycombinator.com",
    kind: "hn",
    starter: true,
    minutes: 5,
  },
  {
    id: "tldr-tech",
    name: "TLDR",
    why: "Five-minute daily digest of general tech, in plain language.",
    lane: "skim",
    cadence: "daily",
    hue: "#22d3ee",
    site: "https://tldr.tech",
    feed: "https://tldr.tech/api/rss/tech",
    starter: true,
    minutes: 5,
  },
  {
    id: "lobsters",
    name: "Lobsters",
    why: "Smaller than HN, higher signal-to-noise, more programming-focused.",
    lane: "skim",
    cadence: "daily",
    hue: "#a78bfa",
    site: "https://lobste.rs",
    feed: "https://lobste.rs/rss",
    minutes: 5,
  },
  {
    id: "tldr-ai",
    name: "TLDR AI",
    why: "The AI-only cut of TLDR, if the main edition is too broad.",
    lane: "skim",
    cadence: "daily",
    hue: "#38bdf8",
    site: "https://tldr.tech/ai",
    feed: "https://tldr.tech/api/rss/ai",
    minutes: 5,
  },

  // ── Infra & platform ───────────────────────────────────────────────────
  {
    id: "cncf",
    name: "CNCF / KubeWeekly",
    why: "The official cloud-native channel — project releases and writeups.",
    lane: "infra",
    cadence: "weekly",
    hue: "#3b82f6",
    site: "https://www.cncf.io/kubeweekly/",
    feed: "https://www.cncf.io/feed/",
    starter: true,
    minutes: 8,
  },
  {
    id: "k8s",
    name: "Kubernetes Blog",
    why: "Release notes and deep dives straight from the project.",
    lane: "infra",
    cadence: "weekly",
    hue: "#326ce5",
    site: "https://kubernetes.io/blog/",
    feed: "https://kubernetes.io/feed.xml",
    minutes: 8,
  },
  {
    id: "lwia",
    name: "Last Week in AWS",
    why: "Corey Quinn's cloud news, with actual opinions attached.",
    lane: "infra",
    cadence: "weekly",
    hue: "#f59e0b",
    site: "https://www.lastweekinaws.com",
    feed: "https://www.lastweekinaws.com/feed/",
    minutes: 7,
  },
  {
    id: "sreweekly",
    name: "SRE Weekly",
    why: "Reliability, incidents and postmortems, curated weekly.",
    lane: "infra",
    cadence: "weekly",
    hue: "#34d399",
    site: "https://sreweekly.com",
    feed: "https://sreweekly.com/feed/",
    minutes: 6,
  },
  {
    id: "awsblog",
    name: "AWS News Blog",
    why: "The primary source when you need the actual launch details.",
    lane: "infra",
    cadence: "daily",
    hue: "#ff9900",
    site: "https://aws.amazon.com/blogs/aws/",
    feed: "https://aws.amazon.com/blogs/aws/feed/",
    minutes: 6,
  },
  {
    id: "cloudflare",
    name: "Cloudflare Blog",
    why: "Consistently excellent writing on networking and edge internals.",
    lane: "infra",
    cadence: "weekly",
    hue: "#f6821f",
    site: "https://blog.cloudflare.com",
    feed: "https://blog.cloudflare.com/rss/",
    minutes: 10,
  },
  {
    id: "cloudnativenow",
    name: "Cloud Native Now",
    why: "Broader platform-engineering coverage around the CNCF ecosystem.",
    lane: "infra",
    cadence: "daily",
    hue: "#60a5fa",
    site: "https://cloudnativenow.com",
    feed: "https://cloudnativenow.com/feed/",
    minutes: 6,
  },
  {
    id: "githubblog",
    name: "GitHub Blog",
    why: "Platform, CI and developer-tooling changes you'll feel at work.",
    lane: "infra",
    cadence: "weekly",
    hue: "#c9d1d9",
    site: "https://github.blog",
    feed: "https://github.blog/feed/",
    minutes: 7,
  },
  {
    id: "devopsish",
    name: "DevOps'ish",
    why: "Chris Short's weekly DevOps roundup. No public feed — email only.",
    lane: "infra",
    cadence: "weekly",
    hue: "#94a3b8",
    site: "https://devopsish.com",
    emailOnly: true,
  },

  // ── AI ─────────────────────────────────────────────────────────────────
  {
    id: "importai",
    name: "Import AI",
    why: "Jack Clark's weekly read of the actual research, not the hype.",
    lane: "ai",
    cadence: "weekly",
    hue: "#f472b6",
    site: "https://importai.substack.com",
    feed: "https://importai.substack.com/feed",
    minutes: 12,
  },
  {
    id: "simonw",
    name: "Simon Willison",
    why: "The most practical running commentary on what LLMs can actually do.",
    lane: "ai",
    cadence: "daily",
    hue: "#fbbf24",
    site: "https://simonwillison.net",
    feed: "https://simonwillison.net/atom/everything/",
    minutes: 6,
  },
  {
    id: "thebatch",
    name: "The Batch",
    why: "Andrew Ng's weekly, research-grounded. No public feed — email only.",
    lane: "ai",
    cadence: "weekly",
    hue: "#a3e635",
    site: "https://www.deeplearning.ai/the-batch/",
    emailOnly: true,
  },

  // ── Depth ──────────────────────────────────────────────────────────────
  {
    id: "pragmatic",
    name: "The Pragmatic Engineer",
    why: "Gergely Orosz on how big companies actually build. Paid tier is worth it.",
    lane: "depth",
    cadence: "weekly",
    hue: "#fb7185",
    site: "https://blog.pragmaticengineer.com",
    feed: "https://blog.pragmaticengineer.com/rss/",
    minutes: 15,
  },
  {
    id: "stratechery",
    name: "Stratechery",
    why: "Ben Thompson on the business and strategy behind the tech.",
    lane: "depth",
    cadence: "daily",
    hue: "#818cf8",
    site: "https://stratechery.com",
    feed: "https://stratechery.com/feed/",
    minutes: 12,
  },
  {
    id: "verge",
    name: "The Verge",
    why: "Consumer tech and policy, faster than anyone else.",
    lane: "depth",
    cadence: "daily",
    hue: "#a855f7",
    site: "https://www.theverge.com",
    feed: "https://www.theverge.com/rss/index.xml",
    minutes: 4,
  },
  {
    id: "ars",
    name: "Ars Technica",
    why: "Where consumer and policy stories get the technical detail they need.",
    lane: "depth",
    cadence: "daily",
    hue: "#ff4e00",
    site: "https://arstechnica.com",
    feed: "https://feeds.arstechnica.com/arstechnica/index",
    minutes: 8,
  },
  {
    id: "atd",
    name: "All Things Distributed",
    why: "Werner Vogels on distributed systems architecture at scale.",
    lane: "depth",
    cadence: "occasional",
    hue: "#2dd4bf",
    site: "https://www.allthingsdistributed.com",
    feed: "https://www.allthingsdistributed.com/atom.xml",
    minutes: 12,
  },
];

export const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

/** The recommended starting set — three sources, not twelve. */
export const STARTER_IDS = SOURCES.filter((s) => s.starter).map((s) => s.id);

/** Hostnames the feed proxy is allowed to reach. Keep in sync with netlify/functions/feed.mjs. */
export const FEED_HOSTS = Array.from(
  new Set(
    SOURCES.filter((s) => s.feed).map((s) => new URL(s.feed!).hostname)
  )
).sort();
