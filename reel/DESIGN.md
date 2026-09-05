# Design

<!-- impeccable:design-schema 1 -->

## Visual World

**The repertory programme.** The monthly folded sheet a rep cinema prints and stacks in its foyer:
one page, a dense ruled grid, one film per night, and beside each a short paragraph arguing for it.
Cream stock, black and red ink, condensed display type, hairline rules doing all the dividing.

The world was chosen because it is the product's mechanism already made physical — a small, dated
batch where every entry carries its reason. It is warm by default, which is the defence against the
"cold and clinical" failure the user named. Nothing here is a card grid, because a programme is a
list you read top to bottom, and browsing rows of posters is the thing this product exists to end.

Anti-references, deliberately excluded: the dark streaming poster-wall (rows, hover-scale, red
accent) and its opposite, the airy white minimal grid with pill buttons.

## Palette

Ink on paper, two settings of the same press. Light is the printed programme; dark is the same
programme run on black stock, which is what you are actually holding at 9pm with the TV on.

| Token | Light (paper) | Dark (black stock) | Use |
|---|---|---|---|
| `--paper` | `#F2EDE3` | `#0E0D0C` | Ground |
| `--paper-2` | `#E8E1D3` | `#1A1816` | Inset panels, the deck's slide mount |
| `--ink` | `#141210` | `#F2EDE3` | Primary text |
| `--ink-2` | `#57504A` | `#A79E92` | Meta, secondary — tinted from the paper hue, never grey |
| `--ink-3` | `#8A8177` | `#6E665C` | Rules, disabled |
| `--rule` | `#C9C0AE` | `#312D28` | Hairlines |
| `--red` | `#B3241E` | `#E0483C` | The second ink: dates, the lead pick, marks of emphasis |
| `--red-wash` | `#B3241E14` | `#E0483C1F` | Selected row |

Red is the *second ink* of a two-colour print run, so it is rationed: the week number, the lead
entry's rule, active nav, destructive/decisive marks. It never fills a large area.

## Typography

Two self-hosted variable families, both from `@fontsource-variable`.

- **Bodoni Moda** — display and reading. A didone carries the printed-programme voice, and its
  variable optical size means the same family sets a 76px masthead and a 17px paragraph correctly.
  `font-optical-sizing: auto` is required; without it the small sizes go spindly.
- **Archivo** — every piece of metadata, label, control and number. Grotesque, set small, in caps
  with `+0.12em` tracking for labels. Its tabular figures carry runtimes, years and ratings.

Scale: masthead `clamp(2.75rem, 9vw, 5.5rem)` with `-0.03em` tracking; entry titles
`clamp(1.5rem, 3.4vw, 2.35rem)`; reading paragraph `1.0625rem/1.6` at a 66ch measure; labels
`0.6875rem` caps. Two Archivo weights only (400, 600) and two Bodoni weights (400, 700).

## Composition

A single measure, 1120px, centred, with a ruled masthead above and entries stacked beneath it. Each
entry is a four-part label grid inherited from the challenger round: **date · title/director ·
metadata run · argument**, divided by 1px rules, never by cards. Nothing nests. On narrow screens
the date column becomes a line above the title and the grid collapses to one column; the rules stay,
because the rules are the design.

## Motion

One authored moment: an entry commits with a **hard cut**, the way a slide changes — no fade, no
travel. Rating a title in the deck advances instantly on keypress; the outgoing slide is gone in
90ms and the next is already at rest. Everything else is stillness. Ease is
`cubic-bezier(.16,1,.3,1)`; every animation is skipped under `prefers-reduced-motion`.

## Browser surfaces

Themed, not defaulted: text selection is `--red-wash` with `--ink`; the caret is `--red`;
scrollbars are `--rule` on `--paper`; the focus ring is a 2px `--red` outline with a 3px offset;
all numerals in metadata use `font-variant-numeric: tabular-nums`.

## Voice

Dry, curatorial, second person, opinionated. It states what the model observed and what it
concluded, in that order, and it is willing to be blunt: *"You've said yes to eleven horror films
and turned down every musical. Here is the one you missed."* Reasons are generated from real
verdict counts — the programme never invents criticism it cannot support.

## Iconography

Authored SVG at a 1.5px stroke on a 24px grid. No emoji, no unicode glyphs standing in for icons.
