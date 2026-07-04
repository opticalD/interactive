import { useMemo } from "react";
import { format, subDays } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AppData } from "../types";

export function MoodTrend({ data }: { data: AppData }) {
  const series = useMemo(() => {
    const out: { day: string; mood: number | null }[] = [];
    for (let i = 29; i >= 0; i--) {
      const iso = format(subDays(new Date(), i), "yyyy-MM-dd");
      out.push({ day: format(subDays(new Date(), i), "MMM d"), mood: data.entries[iso]?.mood ?? null });
    }
    return out;
  }, [data]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-white/80">Mood trend · 30 days</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={series} margin={{ left: -20, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} interval={5} />
          <YAxis domain={[1, 5]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "#12121c",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              color: "#fff",
            }}
          />
          <Area
            type="monotone"
            dataKey="mood"
            stroke="#22d3ee"
            strokeWidth={2.5}
            fill="url(#moodFill)"
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HabitBars({ data }: { data: AppData }) {
  const series = useMemo(() => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const iso = format(subDays(new Date(), i), "yyyy-MM-dd");
      const e = data.entries[iso];
      if (!e) continue;
      for (const h of data.habits) if (e.habits[h.id]) counts[h.id] = (counts[h.id] ?? 0) + 1;
    }
    return data.habits.map((h) => ({ name: h.emoji, full: h.name, count: counts[h.id] ?? 0, color: h.color }));
  }, [data]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-white/80">Habit consistency · 30 days</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={series} margin={{ left: -20, right: 8, top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 16 }} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "#12121c",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              color: "#fff",
            }}
            formatter={(v, _n, p) => [`${v} days`, (p.payload as { full: string }).full]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {series.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
