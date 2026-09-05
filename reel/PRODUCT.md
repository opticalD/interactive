# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React 18 + TypeScript + Tailwind v4 (`@tailwindcss/vite`, no config file) + Framer Motion,
deployed to Netlify with a Netlify Function proxy. Inherited from the six sibling apps in the
`interactive` monorepo (Bloom, Pulse, Signal, Ascend, My Story, The Box) — not a fresh decision.

## Users

A single private user: the owner, a DevOps/platform engineer in Bangalore who watches a lot and
wastes real time deciding what. He uses it in two distinct scenes, both of which must be first-class:

- **Phone, 9pm, TV already on.** Roughly 90 seconds of patience. One-handed. "What do I put on."
- **Desktop, deliberate browsing.** Reading about titles, building a queue for later, sitting with
  the weekly drop like a magazine.

There are no other users and no client. The product must nonetheless meet a standard he would be
willing to sell — that bar is a stated requirement, not an aspiration.

## Product Purpose

Turn "I don't know what to watch" into a decision. It learns taste from a long, deliberately broad
swipe deck, then serves a small, dated batch of recommendations once a week — new releases across
streaming and theatres included — with a stated reason for every pick. Success is putting something
on within a minute and not regretting it.

## Positioning

Streaming services recommend what keeps you on their service. Aggregators list what exists. Reel
narrows: a fixed number of picks per week, each carrying the evidence for why it was chosen, drawn
from the whole catalogue rather than one library. The mechanism is a transparent, editable taste
model the user can read and argue with — not an opaque feed.

## Operating Context

- Data comes from TMDB (free v3 key), proxied server-side; the key never reaches the browser.
- The weekly batch is keyed to the ISO week, so a week's picks are fixed and reopening the site
  during the week shows the same drop. This is deliberate: it makes the recommendation an event.
- Region is not used as a filter. Availability is shown as a tag on the card, spanning all regions
  TMDB reports; theatrical listings are the only region-scoped element.
- Onboarding is a swipe deck of several hundred titles spanning every major genre, six decades and
  roughly twenty film industries. It is expected to take about ten minutes, once.

## Capabilities and Constraints

- Taste model: verdicts (loved / meh / nope) over genre, original language, decade and TMDB
  keywords. Weights are means shrunk toward zero by evidence count; a strongly rejected feature
  vetoes a title outright. Pure functions, covered by `npm run check` (11 assertions).
- Storage is `localStorage` only. No accounts, no server state, no sync between devices.
- No email or push delivery. "Regular" means a dated weekly drop inside the site.
- Undecided: whether a Letterboxd/Trakt import is ever added; whether a second person ever uses it.

## Brand Commitments

Name: **Reel**. Sibling to Bloom, Pulse, Signal, Ascend and My Story — each a one-word name with a
distinct visual world rather than a shared template.

## Evidence on Hand

Real TMDB catalogue data — posters, backdrops, ratings, vote counts, keywords, provider listings.
No testimonials, customers, pricing, benchmarks or press exist, and none may be invented. The site
has no commercial claims to make; it is a private tool.

## Product Principles

1. **Narrowing is the product.** Any change that adds scrolling, rows or infinite choice attacks
   the reason this exists.
2. **Every pick shows its reasoning.** A recommendation without a stated "because" is noise.
3. **The model is the user's to argue with.** Taste is legible and editable, never a black box.
4. **A week is a unit.** Picks are dated and fixed; freshness comes on a schedule, not on refresh.
5. **Speed is craft.** Rating a title is one gesture; nothing waits on a spinner it could avoid.

## Accessibility & Inclusion

Keyboard operation for the swipe deck is required (rating by key, not drag-only). Motion must
respect `prefers-reduced-motion`. Contrast must hold over poster artwork, which is uncontrollable
imagery — text over stills always needs its own backing.
