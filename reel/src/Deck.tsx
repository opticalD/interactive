/**
 * The ballot. One title at a time, marked with a keystroke — the deck is
 * several hundred long, so the cost of a single verdict has to be near zero.
 */

import { useEffect, useRef, useState } from "react";
import { Action, IconNo, IconSeen, IconSkip, IconYes, Plate, Rule, Run } from "./ui";
import type { Title } from "./tmdb";
import type { Profile, Verdict } from "./taste";

const KEYS: Record<string, Verdict | "skip"> = {
  "1": "nope", "2": "meh", "3": "loved",
  ArrowLeft: "nope", ArrowDown: "meh", ArrowRight: "loved",
  " ": "skip", ArrowUp: "skip",
};

export default function Deck({
  deck, profile, onRate,
}: {
  deck: Title[];
  profile: Profile;
  onRate: (title: Title, verdict: Verdict) => void;
}) {
  const [cursor, setCursor] = useState(0);
  const [stamp, setStamp] = useState<{ id: number; verdict: Verdict } | null>(null);
  const stampId = useRef(0);

  // Resume where the ballot left off rather than re-asking about marked titles.
  const queue = deck.filter((t) => !profile.verdicts[t.key]);
  const current = queue[cursor];
  const marked = Object.keys(profile.verdicts).length;

  function mark(verdict: Verdict | "skip") {
    if (!current) return;
    if (verdict === "skip") {
      setCursor((c) => c + 1);
      return;
    }
    // The next slide is live immediately; the ink mark plays out over it.
    onRate(current, verdict);
    stampId.current += 1;
    setStamp({ id: stampId.current, verdict });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = KEYS[e.key];
      if (!action) return;
      e.preventDefault();
      mark(action);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!current) {
    return (
      <div className="py-24 text-center">
        <p className="masthead text-4xl">The ballot is spent.</p>
        <p className="mx-auto mt-4 max-w-[46ch] text-[1.0625rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
          You've marked {marked} titles. That's more than enough to set a programme — and the deck
          refills itself every few days with whatever the catalogue turns up next.
        </p>
      </div>
    );
  }

  return (
    <section className="pb-20">
      <style>{`
        @keyframes reel-stamp {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0 0 0); }
        }
        @keyframes reel-stamp-out { to { opacity: 0; } }
      `}</style>

      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-10 pb-4">
        <h1 className="masthead text-[clamp(2rem,5.5vw,3.25rem)]">The ballot</h1>
        <p className="tnum text-[0.72rem] uppercase tracking-[0.13em]" style={{ color: "var(--ink-2)" }}>
          {marked} marked · {queue.length} still in the deck
        </p>
      </header>
      <Rule heavy />

      {/* Progress reads as a measurement, not a widget. */}
      <div className="relative h-px w-full" style={{ background: "var(--rule)" }}>
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-500"
          style={{ width: `${(marked / (marked + queue.length)) * 100}%`, background: "var(--red)", transitionTimingFunction: "var(--ease-cut)" }}
        />
      </div>

      <div className="relative mt-10 grid gap-8 md:grid-cols-[minmax(0,300px)_1fr] md:gap-12">
        <Plate key={current.key} title={current} size="w500" className="w-full max-w-[300px]" />

        <div className="min-w-0">
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05]" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            {current.name}
          </h2>
          <div className="mt-3">
            <Run title={current} />
          </div>
          <Rule />
          <p
            className="mt-5 max-w-[62ch] text-[1.0625rem] leading-[1.62]"
            style={{ color: "var(--ink-2)" }}
          >
            {current.overview || "No synopsis on file. Judge it on the plate and the run."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Action icon={IconNo} onClick={() => mark("nope")} danger hint="Key 1">Not for me</Action>
            <Action icon={IconSeen} onClick={() => mark("meh")} hint="Key 2">Seen it, fine</Action>
            <Action icon={IconYes} onClick={() => mark("loved")} hint="Key 3">Loved it</Action>
            <Action icon={IconSkip} onClick={() => mark("skip")} hint="Space">Don't know it</Action>
          </div>

          <p className="meta mt-5 text-[0.68rem] uppercase tracking-[0.14em]" style={{ color: "var(--ink-3)" }}>
            Keys 1 · 2 · 3 to mark, space to pass
          </p>
        </div>

        {/* The one authored moment: a struck ink line, over an already-live slide. */}
        {stamp ? (
          <div
            key={stamp.id}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-[3px]"
            style={{
              background: stamp.verdict === "nope" ? "var(--ink-3)" : "var(--red)",
              animation:
                "reel-stamp 260ms var(--ease-cut) both, reel-stamp-out 220ms var(--ease-cut) 260ms both",
            }}
          />
        ) : null}
      </div>
    </section>
  );
}
