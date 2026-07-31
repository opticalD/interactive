# Signal

A tech-news reader built around one idea: **pick three sources, not twelve**, and
read them in ten minutes.

Pulls Hacker News, TLDR, Lobsters, the CNCF/Kubernetes feeds, Last Week in AWS,
SRE Weekly, Import AI, Stratechery, Ars Technica and friends into a single
time-sorted river, grouped into four lanes — Daily skim, Infra & platform, AI,
and Depth.

## Why it's built this way

- **Starts with three sources.** Hacker News, TLDR and CNCF/KubeWeekly are on by
  default; the other sixteen sit switched off in the rail. The sources panel
  nudges you back down when the list grows past four.
- **Ten-minute skim.** A timer, a queue capped at 15 unread items, and no more
  than three per source so one busy feed can't crowd out the rest. When the
  timer runs out it tells you to stop.
- **Comments get equal billing.** On Hacker News and Lobsters the thread is
  often the better read, so it sits next to the headline with its score.
- **Pull, not push.** Everything lives in `localStorage` — read state, saved
  items, which sources are on. Nothing is sent anywhere. Export OPML to move the
  same list into Feedly, FreshRSS or NetNewsWire whenever you outgrow this.

Two sources — **DevOps'ish** and **The Batch** — publish no publicly reachable
feed. They're listed as email-only links rather than quietly dropped.

## Running it

```bash
npm install && npm run dev
```

Opens on port 5176.

## How feeds are fetched

Publishers don't send CORS headers, so the browser can't read their RSS
directly. `netlify/functions/feed.mjs` fetches it server-side with an allowlist
of exactly the hosts this app ships — it is not an open proxy. In dev, Vite runs
that same handler as middleware (see `vite.config.ts`), so there's one
implementation rather than two that can drift.

Hacker News is the exception: it goes straight to the Algolia API, which is
CORS-open and returns points and comment counts.

Adding a source means adding an entry to `src/sources.ts` **and** its hostname to
`ALLOWED_HOSTS` in the function.

## Stack

Vite + React + TypeScript + Tailwind v4 + Framer Motion. No API keys, no
accounts, no backend beyond the one proxy function.
