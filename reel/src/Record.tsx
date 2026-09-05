/**
 * The record: what the model concluded and why, in plain sight. The point is
 * that you can read it and argue with it — a taste model you can't inspect is
 * just a feed with better manners.
 */

import { labelFor, weightOf, type Profile } from "./taste";
import { LANGUAGE_NAMES } from "./tmdb";
import { Action, IconNo, Rule } from "./ui";

type Row = { key: string; label: string; weight: number; n: number; pos: number };

function rows(profile: Profile, family: string, labels: Record<string, string>, limit = 10): Row[] {
  return Object.entries(profile.feat)
    .filter(([k]) => k.startsWith(`${family}:`))
    .map(([key, f]) => ({ key, label: labelFor(key, labels), weight: weightOf(profile, key), n: f.n, pos: f.pos }))
    .filter((r) => r.n >= (family === "k" ? 2 : 1))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, limit);
}

/** A weight drawn as a rule either side of a centre line. Positive runs red. */
function Bar({ weight }: { weight: number }) {
  const pct = Math.min(100, (Math.abs(weight) / 3) * 100);
  const positive = weight >= 0;
  return (
    <div className="relative h-3 w-full" aria-hidden>
      <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: "var(--rule)" }} />
      <div
        className="absolute top-1/2 h-[3px] -translate-y-1/2"
        style={{
          background: positive ? "var(--red)" : "var(--ink-3)",
          left: positive ? "50%" : `${50 - pct / 2}%`,
          width: `${pct / 2}%`,
        }}
      />
    </div>
  );
}

function Table({ title, note, data }: { title: string; note: string; data: Row[] }) {
  if (!data.length) return null;
  return (
    <section className="pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-[1.6rem] leading-tight" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</h2>
        <p className="meta text-[0.68rem] uppercase tracking-[0.14em]" style={{ color: "var(--ink-3)" }}>{note}</p>
      </div>
      <div className="mt-4">
        <Rule />
      </div>
      <ul>
        {data.map((row) => (
          <li
            key={row.key}
            className="grid grid-cols-[1fr_88px] items-center gap-x-5 py-3 sm:grid-cols-[1fr_140px_88px]"
            style={{ borderBottom: "1px solid var(--rule)" }}
          >
            <span className="truncate text-[1.0625rem]">{row.label}</span>
            <div className="hidden sm:block"><Bar weight={row.weight} /></div>
            <span
              className="tnum text-right text-[0.72rem] tracking-[0.1em]"
              style={{ color: row.weight >= 0 ? "var(--red)" : "var(--ink-3)" }}
            >
              {row.weight >= 0 ? "+" : "−"}{Math.abs(row.weight).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Record({
  profile, genres, onReset,
}: {
  profile: Profile;
  genres: Record<number, string>;
  onReset: () => void;
}) {
  const labels: Record<string, string> = { ...profile.labels };
  for (const [id, name] of Object.entries(genres)) labels[`g:${id}`] = name;
  for (const [code, name] of Object.entries(LANGUAGE_NAMES)) labels[`l:${code}`] = name;

  const verdicts = Object.values(profile.verdicts);
  const loved = verdicts.filter((v) => v === "loved").length;
  const rejected = verdicts.filter((v) => v === "nope").length;

  if (!verdicts.length) {
    return (
      <section className="py-24">
        <h1 className="masthead text-[clamp(2rem,5.5vw,3.25rem)]">Nothing on file.</h1>
        <p className="mt-5 max-w-[54ch] text-[1.0625rem] leading-[1.62]" style={{ color: "var(--ink-2)" }}>
          Mark a few dozen titles on the ballot and this page fills with what the model concluded —
          every genre, language, decade and theme it thinks you lean toward, and by how much. You can
          read all of it, and disagree with it.
        </p>
      </section>
    );
  }

  return (
    <div className="pb-24">
      <header className="pt-10">
        <h1 className="masthead text-[clamp(2.25rem,7vw,4.25rem)]">The record</h1>
        <div className="mt-5"><Rule heavy red /></div>
        <p className="tnum py-3 text-[0.72rem] uppercase tracking-[0.13em]" style={{ color: "var(--ink-2)" }}>
          {verdicts.length} marked · {loved} yes · {rejected} no · {profile.watchlist.length} queued
        </p>
        <Rule />
        <p className="mt-6 max-w-[64ch] text-[1.0625rem] leading-[1.62]" style={{ color: "var(--ink-2)" }}>
          A weight is the average verdict a feature earned, pulled toward zero until there's enough
          evidence to trust it. Anything past <span className="tnum" style={{ color: "var(--red)" }}>+1.20</span> reliably
          shapes a programme; anything past <span className="tnum">−1.20</span> vetoes a title outright.
        </p>
      </header>

      <Table title="Genres" note="what you reach for" data={rows(profile, "g", labels)} />
      <Table title="Themes" note="drawn from how titles are tagged" data={rows(profile, "k", labels, 14)} />
      <Table title="Languages" note="where your taste lives" data={rows(profile, "l", labels, 8)} />
      <Table title="Decades" note="when" data={rows(profile, "d", labels, 8)} />

      <section className="pt-14">
        <Rule />
        <div className="flex flex-wrap items-center justify-between gap-4 pt-5">
          <p className="max-w-[46ch] text-[0.9375rem] leading-relaxed" style={{ color: "var(--ink-3)" }}>
            Clearing the ballot deletes every verdict, weight and queued title from this browser.
            There's no copy anywhere else.
          </p>
          <Action
            icon={IconNo}
            danger
            onClick={() => {
              if (confirm("Clear every mark and start the ballot again? This can't be undone.")) onReset();
            }}
          >
            Clear the ballot
          </Action>
        </div>
      </section>
    </div>
  );
}
