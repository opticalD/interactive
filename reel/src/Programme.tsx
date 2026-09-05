/**
 * The programme. A ruled list, read top to bottom — deliberately not a grid of
 * posters, because browsing rows of posters is the problem this replaces.
 */

import { useEffect, useState } from "react";
import { poster as posterUrl } from "./tmdb";
import type { Providers } from "./tmdb";
import { withProviders, type Drop, type Pick } from "./store";
import { argument, SLOT_LABEL, weekRange } from "./copy";
import type { Profile } from "./taste";
import { Action, IconNo, IconQueue, IconSeen, Label, Plate, Rule, Run } from "./ui";

const REGIONS: Record<string, string> = {
  IN: "India", US: "United States", GB: "United Kingdom", AE: "UAE", AU: "Australia",
  CA: "Canada", DE: "Germany", FR: "France", JP: "Japan", SG: "Singapore",
};

export default function Programme({
  drop, profile, genres, onQueue, onWatched, onReject, onRegion,
}: {
  drop: Drop;
  profile: Profile;
  genres: Record<number, string>;
  onQueue: (p: Pick) => void;
  onWatched: (p: Pick) => void;
  onReject: (p: Pick) => void;
  onRegion: (region: string) => void;
}) {
  const [providers, setProviders] = useState<Record<string, Providers>>({});
  const [lead, ...rest] = drop.picks;

  useEffect(() => {
    let live = true;
    Promise.all(
      drop.picks.map(async (p) => {
        const found = await withProviders(p.title.kind, p.title.id);
        return [p.title.key, found] as const;
      })
    ).then((pairs) => {
      if (!live) return;
      const next: Record<string, Providers> = {};
      for (const [key, found] of pairs) if (found) next[key] = found;
      setProviders(next);
    });
    return () => {
      live = false;
    };
  }, [drop.week, drop.picks]);

  const number = String(Number(drop.week.split("-W")[1]));

  return (
    <section className="pb-24">
      <header className="pt-10">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h1 className="masthead text-[clamp(2.75rem,9vw,5.5rem)]">The programme</h1>
          <p className="tnum pb-2 text-[0.72rem] uppercase tracking-[0.13em]" style={{ color: "var(--ink-2)" }}>
            №&nbsp;{number} · {weekRange(drop.week)}
          </p>
        </div>
        <div className="mt-5">
          <Rule heavy red />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-3">
          <p className="tnum text-[0.72rem] uppercase tracking-[0.13em]" style={{ color: "var(--ink-2)" }}>
            {drop.picks.length} picks · set from {Object.keys(profile.verdicts).length} marks · fixed until Monday
          </p>
          <label className="meta flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em]" style={{ color: "var(--ink-3)" }}>
            Cinemas in
            <select
              value={drop.region}
              onChange={(e) => onRegion(e.target.value)}
              className="meta bg-transparent text-[0.68rem] uppercase tracking-[0.14em]"
              style={{ color: "var(--ink)", border: "1px solid var(--rule)", padding: "3px 6px" }}
            >
              {Object.entries(REGIONS).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        <Rule />
      </header>

      {lead ? (
        <Lead
          pick={lead}
          profile={profile}
          genres={genres}
          providers={providers[lead.title.key]}
          onQueue={onQueue}
          onWatched={onWatched}
          onReject={onReject}
        />
      ) : null}

      <ol>
        {rest.map((pick, i) => (
          <Entry
            key={pick.title.key}
            index={i + 2}
            pick={pick}
            profile={profile}
            genres={genres}
            providers={providers[pick.title.key]}
            onQueue={onQueue}
            onWatched={onWatched}
            onReject={onReject}
          />
        ))}
      </ol>
    </section>
  );
}

/** The lead entry gets the one reproduced still, the way a programme does. */
function Lead(props: EntryProps) {
  const { pick, profile, genres, providers } = props;
  const still = posterUrl(pick.title.backdrop, "w500");
  return (
    <article className="pt-10">
      {still ? (
        <div
          className="relative w-full overflow-hidden"
          style={{ border: "1px solid var(--rule)", aspectRatio: "21 / 9", background: "var(--paper-2)" }}
        >
          <img src={still} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="mt-6 grid gap-x-10 gap-y-4 md:grid-cols-[140px_1fr]">
        <div>
          <Label red>{SLOT_LABEL[pick.slot]}</Label>
        </div>
        <div className="min-w-0">
          <h2 className="text-[clamp(2rem,5vw,3.25rem)] leading-[1.02]" style={{ fontWeight: 700, letterSpacing: "-0.025em" }}>
            {pick.title.name}
          </h2>
          <div className="mt-3">
            <Run title={pick.title} extra={availability(providers)} />
          </div>
          <p className="mt-5 max-w-[60ch] text-[1.1875rem] leading-[1.58]">
            {argument(pick, profile, genres)}
          </p>
          <Actions {...props} />
        </div>
      </div>
      <div className="mt-8">
        <Rule />
      </div>
    </article>
  );
}

type EntryProps = {
  pick: Pick;
  profile: Profile;
  genres: Record<number, string>;
  providers?: Providers;
  onQueue: (p: Pick) => void;
  onWatched: (p: Pick) => void;
  onReject: (p: Pick) => void;
};

function Entry({ index, ...props }: EntryProps & { index: number }) {
  const { pick, profile, genres, providers } = props;
  return (
    <li className="group grid gap-x-10 gap-y-4 py-8 md:grid-cols-[140px_1fr_92px]" style={{ borderBottom: "1px solid var(--rule)" }}>
      <div className="flex items-baseline gap-3 md:block">
        <span className="tnum text-[0.72rem] tracking-[0.13em]" style={{ color: "var(--ink-3)" }}>
          {String(index).padStart(2, "0")}
        </span>
        <div className="md:mt-1">
          <Label>{SLOT_LABEL[pick.slot]}</Label>
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="text-[clamp(1.5rem,3.4vw,2.35rem)] leading-[1.06]" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          {pick.title.name}
        </h3>
        <div className="mt-2">
          <Run title={pick.title} extra={availability(providers)} />
        </div>
        <p className="mt-4 max-w-[66ch] text-[1.0625rem] leading-[1.6]" style={{ color: "var(--ink-2)" }}>
          {argument(pick, profile, genres)}
        </p>
        <Actions {...props} />
      </div>

      <div className="hidden md:block">
        <Plate title={pick.title} className="w-[92px]" />
      </div>
    </li>
  );
}

function Actions({ pick, profile, onQueue, onWatched, onReject }: EntryProps) {
  const queued = profile.watchlist.includes(pick.title.key);
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <Action icon={IconQueue} onClick={() => onQueue(pick)} active={queued}>
        {queued ? "In the queue" : "Add to queue"}
      </Action>
      <Action icon={IconSeen} onClick={() => onWatched(pick)}>Seen it</Action>
      <Action icon={IconNo} onClick={() => onReject(pick)} danger>Not for me</Action>
    </div>
  );
}

/**
 * Availability is a tag, never a filter — so this is the union of every region
 * TMDB reports, which arrives noisy: the same service appears as "Netflix",
 * "Netflix Standard with Ads" and "Netflix basic with Ads", alongside dozens of
 * regional resellers. Collapse the variants, then lead with services worth
 * naming rather than whichever one TMDB happened to list first.
 */
const MAJORS = [
  "Netflix", "Amazon Prime Video", "JioHotstar", "Disney Plus", "Apple TV+", "HBO Max", "Max",
  "MUBI", "Criterion Channel", "Hulu", "Paramount Plus", "Peacock", "Zee5", "SonyLIV",
  "Crunchyroll", "BBC iPlayer", "Channel 4", "Sun NXT", "Aha", "Manorama Max",
];

function tidyProvider(name: string): string {
  return name
    .replace(/\s+(Amazon|Apple TV|Roku)\s+Channel$/i, "")
    .replace(/\s+(Standard|Premium|Basic|Ad-Free)?\s*with\s+Ads$/i, "")
    .replace(/\s+(Standard|Premium|Basic)$/i, "")
    .trim();
}

function availability(providers?: Providers): string | undefined {
  if (!providers) return undefined;
  const tidied = [...new Set(providers.flatrate.map(tidyProvider))];
  const rank = (n: string) => {
    const i = MAJORS.findIndex((m) => n.toLowerCase() === m.toLowerCase());
    return i === -1 ? MAJORS.length : i;
  };
  const names = tidied.sort((a, b) => rank(a) - rank(b)).slice(0, 3);
  if (!names.length) return providers.rent.length ? "Rent or buy only" : "Not streaming anywhere";
  return names.join(" · ");
}
