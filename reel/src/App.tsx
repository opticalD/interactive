import { useCallback, useEffect, useState } from "react";
import Deck from "./Deck";
import Programme from "./Programme";
import Record from "./Record";
import { IconArrow, IconStock, Rule, useDelayed } from "./ui";
import type { Title } from "./tmdb";
import { emptyProfile, isoWeek, rate, addKeywords, type Profile, type Verdict } from "./taste";
import { keywordsFor } from "./tmdb";
import {
  buildDrop, loadDeck, loadDrop, loadGenres, loadProfile, loadStock,
  saveDrop, saveProfile, saveStock, type Drop, type Pick,
} from "./store";

type Page = "programme" | "ballot" | "record";
type Stock = "cream" | "black" | null;

/** Below this, the model hasn't earned the right to set a programme. */
const MARKS_NEEDED = 12;

export default function App() {
  const [page, setPage] = useState<Page>("programme");
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [stock, setStock] = useState<Stock>(loadStock);
  const [genres, setGenres] = useState<Record<number, string>>({});
  const [deck, setDeck] = useState<Title[] | null>(null);
  const [drop, setDrop] = useState<Drop | null>(loadDrop);
  const [region, setRegion] = useState(() => loadDrop()?.region ?? "IN");
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const spinner = useDelayed(!deck && !error);

  const marks = Object.keys(profile.verdicts).length;
  const ready = marks >= MARKS_NEEDED;

  useEffect(() => saveProfile(profile), [profile]);
  useEffect(() => {
    if (stock) document.documentElement.setAttribute("data-stock", stock);
    else document.documentElement.removeAttribute("data-stock");
    saveStock(stock);
  }, [stock]);

  useEffect(() => {
    Promise.all([loadGenres(), loadDeck()])
      .then(([g, d]) => {
        setGenres(g);
        setDeck(d);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  // The programme is re-set on a new week, a region change, or once the ballot
  // has moved far enough that last week's reasoning no longer holds.
  useEffect(() => {
    if (!ready || !Object.keys(genres).length || building) return;
    const stale =
      !drop || drop.week !== isoWeek() || drop.region !== region || Math.abs(drop.marks - marks) >= 20;
    if (!stale) return;
    setBuilding(true);
    buildDrop(profile, genres, region)
      .then((fresh) => {
        setDrop(fresh);
        saveDrop(fresh);
        setProfile((p) => ({
          ...p,
          served: [...p.served, ...fresh.picks.map((x) => x.title.key)].slice(-160),
        }));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setBuilding(false));
  }, [ready, genres, region, marks, drop?.week, drop?.region]);

  const onRate = useCallback((title: Title, verdict: Verdict) => {
    setProfile((p) => rate(p, title, verdict));
    // Keywords land a moment later and sharpen the model in the background.
    keywordsFor(title.kind, title.id)
      .then((kws) => setProfile((p) => addKeywords(p, title.key, kws)))
      .catch(() => {});
  }, []);

  const onQueue = useCallback((pick: Pick) => {
    setProfile((p) => ({
      ...p,
      watchlist: p.watchlist.includes(pick.title.key)
        ? p.watchlist.filter((k) => k !== pick.title.key)
        : [...p.watchlist, pick.title.key],
    }));
  }, []);

  const onWatched = useCallback((pick: Pick) => {
    setProfile((p) => ({ ...p, watched: [...new Set([...p.watched, pick.title.key])] }));
  }, []);

  const onReject = useCallback((pick: Pick) => onRate(pick.title, "nope"), [onRate]);

  return (
    <div className="min-h-full">
      <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-8">
        <Masthead page={page} setPage={setPage} stock={stock} setStock={setStock} marks={marks} />

        {error ? (
          <Failure message={error} />
        ) : !deck ? (
          <Waiting show={spinner} />
        ) : page === "ballot" ? (
          <Deck deck={deck} profile={profile} onRate={onRate} />
        ) : page === "record" ? (
          <Record profile={profile} genres={genres} onReset={() => setProfile(emptyProfile())} />
        ) : !ready ? (
          <NotYet marks={marks} onStart={() => setPage("ballot")} />
        ) : !drop ? (
          <Waiting show label="Setting this week's programme" />
        ) : (
          <Programme
            drop={drop}
            profile={profile}
            genres={genres}
            onQueue={onQueue}
            onWatched={onWatched}
            onReject={onReject}
            onRegion={setRegion}
          />
        )}

        <footer className="pb-12">
          <Rule />
          <p className="meta pt-4 text-[0.68rem] uppercase tracking-[0.14em]" style={{ color: "var(--ink-3)" }}>
            Reel · catalogue data from TMDB · kept in this browser only
          </p>
        </footer>
      </div>
    </div>
  );
}

function Masthead({
  page, setPage, stock, setStock, marks,
}: {
  page: Page;
  setPage: (p: Page) => void;
  stock: Stock;
  setStock: (s: Stock) => void;
  marks: number;
}) {
  const tabs: { id: Page; label: string }[] = [
    { id: "programme", label: "Programme" },
    { id: "ballot", label: "Ballot" },
    { id: "record", label: "Record" },
  ];
  return (
    <header className="pt-7">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <button onClick={() => setPage("programme")} className="text-left">
          <span className="masthead text-[1.5rem] tracking-[-0.02em]">Reel</span>
        </button>

        <nav className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPage(tab.id)}
              aria-current={page === tab.id ? "page" : undefined}
              className="meta px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-150"
              style={{
                color: page === tab.id ? "var(--red)" : "var(--ink-2)",
                borderBottom: `2px solid ${page === tab.id ? "var(--red)" : "transparent"}`,
              }}
            >
              {tab.label}
              {tab.id === "ballot" && marks > 0 ? (
                <span className="tnum ml-2 text-[0.65rem]" style={{ color: "var(--ink-3)" }}>{marks}</span>
              ) : null}
            </button>
          ))}
          <button
            onClick={() => setStock(currentStock(stock) === "black" ? "cream" : "black")}
            title="Switch the stock this is printed on"
            aria-label="Switch between cream and black stock"
            className="ml-2 p-2 transition-colors duration-150"
            style={{ color: "var(--ink-3)" }}
          >
            <IconStock className="h-[1.05rem] w-[1.05rem]" />
          </button>
        </nav>
      </div>
      <div className="mt-5">
        <Rule />
      </div>
    </header>
  );
}

function currentStock(stock: Stock): "cream" | "black" {
  if (stock) return stock;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "black" : "cream";
}

function NotYet({ marks, onStart }: { marks: number; onStart: () => void }) {
  const left = MARKS_NEEDED - marks;
  return (
    <section className="py-20">
      <h1 className="masthead max-w-[16ch] text-[clamp(2.5rem,8vw,5rem)]">
        The programme isn't set yet.
      </h1>
      <div className="mt-8"><Rule heavy red /></div>
      <p className="mt-7 max-w-[58ch] text-[1.1875rem] leading-[1.58]" style={{ color: "var(--ink-2)" }}>
        {marks === 0
          ? "It's set from your ballot, and the ballot is empty. Mark a few dozen titles — a keystroke each, no accounts, nothing sent anywhere — and every week after that you get eight picks and the reasoning behind each one."
          : `${marks} marked so far. ${left} more and there's enough here to argue from.`}
      </p>
      <button
        onClick={onStart}
        className="meta mt-9 inline-flex items-center gap-3 px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-150"
        style={{ border: "1px solid var(--red)", color: "var(--red)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-wash)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        {marks === 0 ? "Open the ballot" : "Carry on marking"}
        <IconArrow className="h-4 w-4" />
      </button>
    </section>
  );
}

function Waiting({ show, label = "Pulling the catalogue" }: { show: boolean; label?: string }) {
  if (!show) return <div className="py-24" />;
  return (
    <section className="py-24">
      <p className="masthead text-[clamp(1.75rem,5vw,2.75rem)]">{label}…</p>
      <div className="mt-6 h-px w-full max-w-[280px] overflow-hidden" style={{ background: "var(--rule)" }}>
        <div style={{ height: "1px", background: "var(--red)", width: "40%", animation: "reel-wait 1.4s var(--ease-cut) infinite" }} />
      </div>
      <style>{`@keyframes reel-wait { 0% { transform: translateX(-100%); } 100% { transform: translateX(280%); } }`}</style>
    </section>
  );
}

function Failure({ message }: { message: string }) {
  const missingKey = message.toLowerCase().includes("tmdb_key");
  return (
    <section className="py-20">
      <h1 className="masthead max-w-[18ch] text-[clamp(2rem,6vw,3.5rem)]">
        {missingKey ? "No catalogue key on file." : "The catalogue didn't answer."}
      </h1>
      <div className="mt-7"><Rule heavy red /></div>
      {missingKey ? (
        <div className="mt-7 max-w-[62ch] text-[1.0625rem] leading-[1.62]" style={{ color: "var(--ink-2)" }}>
          <p>Reel reads from TMDB, which needs a free key. Two minutes:</p>
          <ol className="mt-5 space-y-3">
            <li className="flex gap-4">
              <span className="tnum shrink-0" style={{ color: "var(--red)" }}>01</span>
              <span>Sign up at themoviedb.org, then open Settings → API and copy the v3 <em>API Key</em>.</span>
            </li>
            <li className="flex gap-4">
              <span className="tnum shrink-0" style={{ color: "var(--red)" }}>02</span>
              <span>Put it in <code className="meta">reel/.env</code> as <code className="meta">TMDB_KEY=…</code></span>
            </li>
            <li className="flex gap-4">
              <span className="tnum shrink-0" style={{ color: "var(--red)" }}>03</span>
              <span>Restart the dev server. On Netlify, set the same variable in the site's environment.</span>
            </li>
          </ol>
        </div>
      ) : (
        <p className="mt-7 max-w-[58ch] text-[1.0625rem] leading-[1.62]" style={{ color: "var(--ink-2)" }}>
          {message}. Reload to try again — nothing you've marked is lost.
        </p>
      )}
    </section>
  );
}
