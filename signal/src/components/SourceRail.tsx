import { useEffect, useState } from "react";
import { LANES, SOURCES, STARTER_IDS, type Lane } from "../sources";
import { downloadOpml } from "../lib/opml";

const DESKTOP = "(min-width: 1024px)";

type Props = {
  enabled: string[];
  errors: Record<string, string>;
  counts: Record<string, number>;
  onToggle: (id: string) => void;
  onSetEnabled: (ids: string[]) => void;
};

export function SourceRail({ enabled, errors, counts, onToggle, onSetEnabled }: Props) {
  const active = new Set(enabled);
  const feedCount = enabled.filter((id) => SOURCES.find((s) => s.id === id)?.feed || SOURCES.find((s) => s.id === id)?.kind).length;

  // The full rail is twenty rows tall. On a phone that buries the actual news,
  // so it starts collapsed there and stays open on a desktop layout.
  const [expanded, setExpanded] = useState(
    () => window.matchMedia(DESKTOP).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const sync = (e: MediaQueryListEvent) => setExpanded(e.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <aside className="flex flex-col gap-5">
      <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Sources
          </h2>
          <span className="text-xs tabular-nums text-white/40">{feedCount} on</span>
        </div>

        {/* The whole point of the advice: three sources you read beats twelve you don't. */}
        <p className="mt-2 text-[11px] leading-relaxed text-white/40">
          {feedCount <= 4
            ? "Good size. A list you actually finish is worth more than one you admire."
            : `${feedCount} feeds is a lot to sustain. Consider trimming back toward three.`}
        </p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onSetEnabled(STARTER_IDS)}
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            Reset to the starter 3
          </button>
          <button
            type="button"
            onClick={() => downloadOpml(enabled)}
            title="Export as OPML for Feedly, FreshRSS, NetNewsWire…"
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            OPML
          </button>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 w-full rounded-md px-2 py-1.5 text-[11px] font-medium text-white/50 transition-colors hover:bg-white/6 lg:hidden"
        >
          {expanded ? "Hide sources ▲" : "Choose sources ▼"}
        </button>
      </div>

      {expanded &&
        LANES.map((lane) => (
          <LaneGroup
            key={lane.id}
            lane={lane}
            active={active}
            errors={errors}
            counts={counts}
            onToggle={onToggle}
          />
        ))}
    </aside>
  );
}

function LaneGroup({
  lane,
  active,
  errors,
  counts,
  onToggle,
}: {
  lane: { id: Lane; label: string; blurb: string };
  active: Set<string>;
  errors: Record<string, string>;
  counts: Record<string, number>;
  onToggle: (id: string) => void;
}) {
  const sources = SOURCES.filter((s) => s.lane === lane.id);

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
        {lane.label}
      </h3>
      <p className="mt-1 mb-2.5 text-[11px] leading-relaxed text-white/35">{lane.blurb}</p>

      <ul className="space-y-1">
        {sources.map((source) => {
          const on = active.has(source.id);
          const error = errors[source.id];

          if (source.emailOnly) {
            return (
              <li key={source.id}>
                <a
                  href={source.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={source.why}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-white/35 transition-colors hover:bg-white/5 hover:text-white/60"
                >
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full border border-white/25"
                  />
                  <span className="truncate">{source.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-white/30">email ↗</span>
                </a>
              </li>
            );
          }

          return (
            <li key={source.id}>
              <button
                type="button"
                onClick={() => onToggle(source.id)}
                aria-pressed={on}
                title={source.why}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors ${
                  on ? "bg-white/8 text-white/90" : "text-white/45 hover:bg-white/5"
                }`}
              >
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full transition-all"
                  style={{
                    background: on ? source.hue : "transparent",
                    border: on ? "none" : "1px solid rgba(255,255,255,0.25)",
                  }}
                />
                <span className="truncate">{source.name}</span>
                <span className="ml-auto shrink-0 text-[10px] tabular-nums text-white/30">
                  {error ? (
                    <span className="text-rose-400/70" title={error}>
                      failed
                    </span>
                  ) : on ? (
                    (counts[source.id] ?? 0) || ""
                  ) : (
                    ""
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
