import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ItemCard } from "./components/ItemCard";
import { Onboarding } from "./components/Onboarding";
import { SkimBar } from "./components/SkimBar";
import { SourceRail } from "./components/SourceRail";
import { fetchSource, type Item } from "./lib/feed";
import { LANES, SOURCE_BY_ID, SOURCES, type Lane } from "./sources";
import { useStore } from "./store";

type View = Lane | "all" | "saved";
const SKIM_SECONDS = 10 * 60;
/** Cap per source in skim mode so one busy feed can't crowd out the rest. */
const SKIM_PER_SOURCE = 3;
const SKIM_TOTAL = 15;

const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "Everything" },
  ...LANES.map((l) => ({ id: l.id as View, label: l.label })),
  { id: "saved", label: "★ Saved" },
];

export default function App() {
  const store = useStore();
  const [items, setItems] = useState<Item[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("all");
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const [skimming, setSkimming] = useState(false);
  const [remaining, setRemaining] = useState(SKIM_SECONDS);
  const skimReadRef = useRef(0);
  const [skimRead, setSkimRead] = useState(0);

  const enabledKey = store.enabled.join(",");

  const load = useCallback(async () => {
    const active = SOURCES.filter((s) => store.enabled.includes(s.id) && !s.emailOnly);
    if (active.length === 0) {
      setItems([]);
      setErrors({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const results = await Promise.all(
      active.map(async (s) => [s.id, await fetchSource(s)] as const)
    );

    const collected: Item[] = [];
    const failures: Record<string, string> = {};
    for (const [id, result] of results) {
      if (result.ok) collected.push(...result.items);
      else failures[id] = result.error;
    }

    // One source going down shouldn't empty the page — keep what loaded and
    // surface the failures quietly in the rail.
    collected.sort((a, b) => b.published - a.published);
    setItems(collected);
    setErrors(failures);
    setLastFetched(Date.now());
    setLoading(false);
  }, [store.enabled]);

  useEffect(() => {
    void load();
    // load() is recreated whenever the enabled set changes; key on its contents
    // so toggling a source refetches exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKey]);

  useEffect(() => {
    if (!skimming || remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [skimming, remaining]);

  const readSet = useMemo(() => new Set(store.read), [store.read]);
  const savedSet = useMemo(() => new Set(store.saved), [store.saved]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of items) {
      if (readSet.has(item.id)) continue;
      map[item.sourceId] = (map[item.sourceId] ?? 0) + 1;
    }
    return map;
  }, [items, readSet]);

  const visible = useMemo(() => {
    let list = items;

    if (skimming) {
      // The skim queue: unread only, newest first, evenly spread across sources.
      const perSource: Record<string, number> = {};
      list = list
        .filter((i) => !readSet.has(i.id))
        .filter((i) => {
          const n = perSource[i.sourceId] ?? 0;
          if (n >= SKIM_PER_SOURCE) return false;
          perSource[i.sourceId] = n + 1;
          return true;
        })
        .slice(0, SKIM_TOTAL);
      return list;
    }

    if (view === "saved") list = list.filter((i) => savedSet.has(i.id));
    else if (view !== "all")
      list = list.filter((i) => SOURCE_BY_ID.get(i.sourceId)?.lane === view);

    if (unreadOnly) list = list.filter((i) => !readSet.has(i.id));

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          (SOURCE_BY_ID.get(i.sourceId)?.name.toLowerCase().includes(q) ?? false)
      );
    }

    return list;
  }, [items, view, query, unreadOnly, skimming, readSet, savedSet]);

  const unreadTotal = useMemo(
    () => items.filter((i) => !readSet.has(i.id)).length,
    [items, readSet]
  );

  const handleRead = useCallback(
    (id: string) => {
      if (!readSet.has(id)) {
        skimReadRef.current += 1;
        setSkimRead(skimReadRef.current);
      }
      store.markRead(id);
    },
    [readSet, store]
  );

  const startSkim = () => {
    skimReadRef.current = 0;
    setSkimRead(0);
    setRemaining(SKIM_SECONDS);
    setSkimming(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-white/95">
            Signal
            <span className="ml-2.5 align-middle text-[13px] font-normal tracking-normal text-white/40">
              your tech news, filtered
            </span>
          </h1>
          <p className="mt-1 text-[12px] text-white/40">
            {loading
              ? "Fetching…"
              : `${unreadTotal} unread across ${
                  store.enabled.filter((id) => !SOURCE_BY_ID.get(id)?.emailOnly).length
                } sources`}
            {lastFetched && !loading && (
              <> · updated {new Date(lastFetched).toLocaleTimeString()}</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headlines…"
            className="w-44 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] text-white/85 placeholder:text-white/30 focus:border-white/25 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setUnreadOnly((v) => !v)}
            aria-pressed={unreadOnly}
            className={`rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
              unreadOnly
                ? "border-sky-400/30 bg-sky-400/12 text-sky-200"
                : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
            }`}
          >
            Unread only
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] font-medium text-white/65 transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            {loading ? "…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={skimming ? () => setSkimming(false) : startSkim}
            className="rounded-md border border-sky-400/30 bg-sky-400/12 px-2.5 py-1.5 text-[12px] font-medium text-sky-200 transition-colors hover:bg-sky-400/20"
          >
            {skimming ? "End skim" : "10-min skim"}
          </button>
        </div>
      </header>

      <div className="grid gap-7 lg:grid-cols-[230px_1fr]">
        <SourceRail
          enabled={store.enabled}
          errors={errors}
          counts={counts}
          onToggle={store.toggleSource}
          onSetEnabled={store.setEnabled}
        />

        <main>
          {!store.onboarded && <Onboarding onDismiss={store.dismissOnboarding} />}

          <SkimBar
            active={skimming}
            remaining={remaining}
            total={SKIM_SECONDS}
            queued={visible.length}
            readThisSession={skimRead}
            onStop={() => setSkimming(false)}
          />

          {!skimming && (
            <nav className="mb-4 flex flex-wrap gap-1.5">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  aria-current={view === v.id}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    view === v.id
                      ? "bg-white/12 text-white/90"
                      : "text-white/45 hover:bg-white/6 hover:text-white/70"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </nav>
          )}

          {loading && items.length === 0 ? (
            <SkeletonList />
          ) : visible.length === 0 ? (
            <EmptyState
              view={view}
              skimming={skimming}
              hasSources={store.enabled.length > 0}
              filtered={items.length > 0}
            />
          ) : (
            <div className="space-y-2.5">
              {visible.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  read={readSet.has(item.id)}
                  saved={savedSet.has(item.id)}
                  isNew={item.published > store.sessionStart}
                  onRead={handleRead}
                  onSave={store.toggleSaved}
                />
              ))}
            </div>
          )}

          <footer className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/8 pt-4 text-[11px] text-white/30">
            <span>Pull, not push. Nothing leaves your browser.</span>
            <button
              type="button"
              onClick={store.clearRead}
              className="ml-auto rounded px-2 py-1 transition-colors hover:bg-white/6 hover:text-white/60"
            >
              Clear read history
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-white/8 bg-white/[0.03] p-4"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-2 w-24 rounded bg-white/8" />
          <div className="mt-3 h-3.5 w-3/4 rounded bg-white/10" />
          <div className="mt-2 h-2.5 w-1/2 rounded bg-white/6" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  view,
  skimming,
  hasSources,
  filtered,
}: {
  view: View;
  skimming: boolean;
  hasSources: boolean;
  filtered: boolean;
}) {
  const message = !hasSources
    ? "No sources switched on. Pick a few from the rail — three is plenty."
    : skimming
      ? "Nothing unread left. That's the whole idea — go build something."
      : view === "saved"
        ? "Nothing saved yet. Star an item to come back to it later."
        : filtered
          ? "Nothing matches that filter."
          : "No items from these sources yet.";

  return (
    <div className="rounded-xl border border-dashed border-white/10 px-5 py-12 text-center text-[13px] text-white/40">
      {message}
    </div>
  );
}
