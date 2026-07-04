import { useMemo } from "react";
import { format, parseISO, subDays } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { motion } from "framer-motion";
import { classify, valenceColor } from "../lib/moods";
import { mean, pearson } from "../lib/stats";
import type { TrackerData } from "../hooks/useData";

function dayKey(iso: string) {
  return format(parseISO(iso), "yyyy-MM-dd");
}

export function Analytics({ data }: { data: TrackerData }) {
  const { entries, factors, habits, logs } = data;

  const stats = useMemo(() => {
    const valences = entries.map((e) => e.valence);
    // check-in streak: consecutive days (from today/yesterday back) with an entry
    const days = new Set(entries.map((e) => dayKey(e.logged_at)));
    let streak = 0;
    for (let i = 0; i < 400; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      if (days.has(d)) streak++;
      else if (i === 0) continue;
      else break;
    }
    return {
      count: entries.length,
      avgValence: valences.length ? Math.round(mean(valences)) : 0,
      streak,
      days: days.size,
    };
  }, [entries]);

  const scatter = useMemo(
    () =>
      entries.map((e) => ({
        x: e.valence,
        y: e.arousal,
        z: 1,
        color: classify(e.valence, e.arousal).color,
      })),
    [entries]
  );

  const trend = useMemo(() => {
    const byDay = new Map<string, number[]>();
    for (const e of entries) {
      const k = dayKey(e.logged_at);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k)!.push(e.valence);
    }
    const out: { day: string; valence: number | null }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const vals = byDay.get(d);
      out.push({ day: format(subDays(new Date(), i), "MMM d"), valence: vals ? Math.round(mean(vals)) : null });
    }
    return out;
  }, [entries]);

  const correlations = useMemo(() => {
    return factors
      .map((f) => {
        const xs: number[] = [];
        const ys: number[] = [];
        for (const e of entries) {
          const v = e.factors?.[f.key];
          if (typeof v === "number") {
            xs.push(v);
            ys.push(e.valence);
          }
        }
        const r = pearson(xs, ys);
        return { f, r, n: xs.length };
      })
      .filter((c) => c.r !== null)
      .sort((a, b) => Math.abs(b.r!) - Math.abs(a.r!));
  }, [entries, factors]);

  const habitBars = useMemo(() => {
    const counts: Record<string, number> = {};
    const cutoff = format(subDays(new Date(), 30), "yyyy-MM-dd");
    for (const l of logs) if (l.date >= cutoff) counts[l.habit_id] = (counts[l.habit_id] ?? 0) + 1;
    return habits.map((h) => ({ h, count: counts[h.id] ?? 0 }));
  }, [logs, habits]);

  const heatmap = useMemo(() => {
    const byDay = new Map<string, number[]>();
    for (const e of entries) {
      const k = dayKey(e.logged_at);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k)!.push(e.valence);
    }
    const cols: { date: string; v: number | null }[][] = [];
    for (let w = 13; w >= 0; w--) {
      const col: { date: string; v: number | null }[] = [];
      for (let d = 6; d >= 0; d--) {
        const date = format(subDays(new Date(), w * 7 + d), "yyyy-MM-dd");
        const vals = byDay.get(date);
        col.push({ date, v: vals ? mean(vals) : null });
      }
      cols.push(col);
    }
    return cols;
  }, [entries]);

  const cards = [
    { label: "Check-ins", value: `${stats.count}`, tint: "#06b6d4" },
    { label: "Avg valence", value: `${stats.avgValence > 0 ? "+" : ""}${stats.avgValence}`, tint: "#22c55e" },
    { label: "Day streak", value: `${stats.streak}🔥`, tint: "#f59e0b" },
    { label: "Days tracked", value: `${stats.days}`, tint: "#a855f7" },
  ];

  const empty = entries.length === 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            style={{ boxShadow: `inset 0 -28px 40px -30px ${c.tint}55` }}
          >
            <div className="text-2xl font-semibold" style={{ color: c.tint }}>
              {c.value}
            </div>
            <div className="mt-1 text-xs text-white/50">{c.label}</div>
          </motion.div>
        ))}
      </div>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/40">
          Log a few moments and your mood map, trends, and correlations will appear here.
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Circumplex scatter */}
            <Panel title="Mood map (valence × arousal)">
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart margin={{ left: -20, right: 10, top: 6, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[-100, 100]}
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                    label={{ value: "valence →", position: "insideBottom", fill: "rgba(255,255,255,0.3)", fontSize: 10, dy: 12 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[-100, 100]}
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                  />
                  <ZAxis dataKey="z" range={[60, 60]} />
                  <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                  <Scatter data={scatter}>
                    {scatter.map((s, i) => (
                      <Cell key={i} fill={s.color} fillOpacity={0.75} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </Panel>

            {/* Valence trend */}
            <Panel title="Mood trend · 30 days">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trend} margin={{ left: -20, right: 8, top: 6 }}>
                  <defs>
                    <linearGradient id="vfill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} interval={5} />
                  <YAxis domain={[-100, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                  <Tooltip contentStyle={tooltip} />
                  <Area type="monotone" dataKey="valence" stroke="#22d3ee" strokeWidth={2.5} fill="url(#vfill)" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          {/* Mood drivers */}
          <Panel title="What lifts and lowers your mood">
            <p className="-mt-1 mb-4 text-xs leading-relaxed text-white/45">
              Patterns Bloom noticed between your factors and how pleasant your days feel. These are
              associations, not proof of cause — and they get sharper the more you log.
            </p>
            {correlations.length === 0 ? (
              <p className="text-xs text-white/40">
                Log a handful of check-ins and your mood drivers will appear here.
              </p>
            ) : (
              (() => {
                const lifts = correlations.filter((c) => (c.r ?? 0) >= 0.1);
                const weighs = correlations.filter((c) => (c.r ?? 0) <= -0.1);
                const neutral = correlations.filter((c) => Math.abs(c.r ?? 0) < 0.1);
                return (
                  <div className="space-y-5">
                    {lifts.length > 0 && (
                      <CorrelationGroup title="Lifts your mood" emoji="☀️" tint="#22c55e" items={lifts} />
                    )}
                    {weighs.length > 0 && (
                      <CorrelationGroup title="Weighs on your mood" emoji="🌧️" tint="#ef4444" items={weighs} />
                    )}
                    {neutral.length > 0 && (
                      <p className="text-[11px] text-white/35">
                        No clear link yet: {neutral.map((c) => c.f.label).join(", ")}.
                      </p>
                    )}
                  </div>
                );
              })()
            )}
          </Panel>

          <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
            {/* Heatmap */}
            <Panel title="Valence heatmap · 14 weeks">
              <div className="flex gap-[3px] overflow-x-auto pb-1">
                {heatmap.map((col, ci) => (
                  <div key={ci} className="flex flex-col gap-[3px]">
                    {col.map((cell) => (
                      <div
                        key={cell.date}
                        title={`${cell.date}${cell.v != null ? ` · valence ${Math.round(cell.v)}` : " · no entry"}`}
                        className="h-3.5 w-3.5 rounded-[3px]"
                        style={{ background: cell.v != null ? valenceColor(cell.v) : "rgba(255,255,255,0.05)" }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </Panel>

            {/* Habit consistency */}
            <Panel title="Habit consistency · 30 days">
              <div className="space-y-2.5">
                {habitBars.map(({ h, count }) => (
                  <div key={h.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-white/70">
                        {h.emoji} {h.name}
                      </span>
                      <span className="text-white/40">{count}d</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(count / 30) * 100}%`, background: h.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

const tooltip = {
  background: "#12121c",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  color: "#fff",
} as const;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-white/80">{title}</h3>
      {children}
    </div>
  );
}

interface Corr {
  f: { id: string; emoji: string; label: string };
  r: number | null;
  n: number;
}

/** How much to trust a correlation, based on how many check-ins fed it. */
function reliability(n: number): { text: string; color: string } {
  if (n < 8) return { text: "Early hint — keep logging", color: "#eab308" };
  if (n < 20) return { text: "Emerging pattern", color: "#06b6d4" };
  return { text: "Reliable pattern", color: "#22c55e" };
}

function CorrelationGroup({
  title,
  emoji,
  tint,
  items,
}: {
  title: string;
  emoji: string;
  tint: string;
  items: Corr[];
}) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: tint }}>
        <span>{emoji}</span> {title}
      </h4>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <CorrelationCard key={it.f.id} {...it} />
        ))}
      </div>
    </div>
  );
}

function CorrelationCard({ f, r, n }: Corr) {
  const rr = r ?? 0;
  const positive = rr >= 0;
  const color = positive ? "#22c55e" : "#ef4444";
  const factor = f.label.toLowerCase();
  const sentence = positive
    ? `On days with more ${factor}, you tend to feel better.`
    : `On days with more ${factor}, you tend to feel worse.`;
  const rel = reliability(n);

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-white/85">
          <span>{f.emoji}</span> {f.label}
        </span>
        <span
          className="text-xs font-medium tabular-nums text-white/30"
          title="Correlation score, −1 to +1 (how strongly this moves with your mood)"
        >
          {positive ? "+" : ""}
          {rr.toFixed(2)}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-white/65">{sentence}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(Math.abs(rr) * 100, 100)}%`, background: color }}
        />
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/45">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: rel.color }} />
        {rel.text} · {n} check-ins
      </p>
    </div>
  );
}
