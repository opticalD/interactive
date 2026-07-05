import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import type { CycleData } from "../hooks/useCycle";
import { cycleStats, moodByPhase, PHASE_META } from "../lib/cycle";
import { FLOW_OPTIONS, PERIOD_SYMPTOMS } from "../lib/types";

const today = () => format(new Date(), "yyyy-MM-dd");

interface MoodEntryLite {
  logged_at: string;
  valence: number;
}

export function CyclePanel({ data, entries }: { data: CycleData; entries: MoodEntryLite[] }) {
  if (!data.enabled) {
    return (
      <section>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <span className="text-3xl">🩸</span>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white/90">Cycle tracking</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                Log your period to see your current phase, predict your next one, and discover how
                your cycle affects your mood. Private and end-to-end encrypted. Opt in anytime.
              </p>
            </div>
            <button
              onClick={data.enable}
              className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-transform hover:scale-105"
            >
              Enable
            </button>
          </div>
        </div>
      </section>
    );
  }

  const stats = cycleStats(data.periods);
  const ongoing = data.periods.find((p) => !p.ended_on);
  const current = data.periods[0]; // newest
  const phaseMood = data.periods.length ? moodByPhase(entries, data.periods) : [];

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
        <span>🩸</span> Cycle
      </h2>
      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        {/* Phase + prediction */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
          {stats.phase ? (
            <div className="flex items-center gap-4">
              <PhaseRing day={stats.dayOfCycle!} length={stats.avgCycleLength} phaseColor={PHASE_META[stats.phase].color} />
              <div className="min-w-0">
                <div className="text-lg font-semibold" style={{ color: PHASE_META[stats.phase].color }}>
                  {PHASE_META[stats.phase].label} phase
                </div>
                <div className="text-xs text-white/50">Day {stats.dayOfCycle} of your cycle</div>
                <p className="mt-1 text-xs leading-relaxed text-white/45">{PHASE_META[stats.phase].blurb}</p>
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-white/45">Log your first period to begin.</p>
          )}

          {stats.nextPredicted && (
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
              <Stat label="Next period" value={stats.daysUntilNext === 0 ? "today" : `${stats.daysUntilNext}d`} sub={fmt(stats.nextPredicted)} />
              <Stat label="Avg cycle" value={`${stats.avgCycleLength}d`} sub={stats.hasEnoughData ? "from your logs" : "estimate"} />
              <Stat label="Avg period" value={`${stats.avgPeriodLength}d`} sub="length" />
            </div>
          )}

          <div className="mt-4">
            {ongoing ? (
              <button
                onClick={() => data.updatePeriod(ongoing.id, { ended_on: today() })}
                className="w-full rounded-lg border border-white/15 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Period ongoing since {fmt(ongoing.started_on)} · Mark ended today
              </button>
            ) : (
              <button
                onClick={() => data.startPeriod(today())}
                className="w-full rounded-lg bg-gradient-to-r from-rose-500 to-red-500 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
              >
                🩸 Log period started today
              </button>
            )}
          </div>
        </div>

        {/* Current period details + history */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
          {current ? (
            <>
              <h3 className="text-sm font-semibold text-white/80">
                {ongoing ? "This period" : "Last period"} · {fmt(current.started_on)}
              </h3>

              <div className="mt-3">
                <div className="mb-1.5 text-xs text-white/50">Flow</div>
                <div className="flex gap-2">
                  {FLOW_OPTIONS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => data.updatePeriod(current.id, { flow: current.flow === f.key ? null : f.key })}
                      className={`flex-1 rounded-lg border px-2 py-2 text-xs transition-colors ${
                        current.flow === f.key
                          ? "border-rose-400/60 bg-rose-400/15 text-rose-200"
                          : "border-white/10 text-white/55 hover:bg-white/5"
                      }`}
                    >
                      <div>{"●".repeat(f.dots)}</div>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 text-xs text-white/50">Symptoms</div>
                <div className="flex flex-wrap gap-1.5">
                  {PERIOD_SYMPTOMS.map((s) => {
                    const on = current.symptoms.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() =>
                          data.updatePeriod(current.id, {
                            symptoms: on ? current.symptoms.filter((x) => x !== s) : [...current.symptoms, s],
                          })
                        }
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          on ? "border-rose-400/60 bg-rose-400/15 text-rose-200" : "border-white/10 text-white/55 hover:bg-white/5"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {data.periods.length > 1 && (
                <div className="mt-4 border-t border-white/10 pt-3">
                  <div className="mb-1.5 text-xs text-white/50">Recent cycles</div>
                  <div className="space-y-1">
                    {data.periods.slice(0, 4).map((p, i) => {
                      const next = data.periods[i - 1];
                      const cycleLen = next
                        ? differenceInCalendarDays(parseISO(next.started_on), parseISO(p.started_on))
                        : null;
                      return (
                        <div key={p.id} className="flex items-center justify-between text-xs text-white/55">
                          <span>{fmt(p.started_on)}{p.ended_on ? `–${fmt(p.ended_on)}` : ""}</span>
                          <span className="flex items-center gap-2">
                            {cycleLen && <span className="text-white/35">{cycleLen}d cycle</span>}
                            <button onClick={() => data.deletePeriod(p.id)} className="text-red-400/50 hover:text-red-400">
                              ✕
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="py-6 text-center text-sm text-white/45">
              Tap “Log period started today” to record your first period.
            </p>
          )}
          <button onClick={data.disable} className="mt-4 text-[11px] text-white/30 hover:text-white/60">
            Turn off cycle tracking
          </button>
        </div>
      </div>

      {/* Mood across the cycle — shows here once there's enough data */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
        <h3 className="text-sm font-semibold tracking-wide text-white/80">Mood across your cycle</h3>
        {phaseMood.length >= 2 ? (
          <>
            <p className="mt-1 text-xs leading-relaxed text-white/45">
              Your average mood in each phase. Many people dip in the luteal phase (PMS) and lift
              around ovulation — see what's true for you.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {phaseMood.map(({ ph, avg, n }) => (
                <div
                  key={ph}
                  className="rounded-xl border border-white/10 bg-black/20 p-3 text-center"
                  style={{ boxShadow: `inset 0 -24px 34px -28px ${PHASE_META[ph].color}` }}
                >
                  <div className="text-lg font-semibold" style={{ color: PHASE_META[ph].color }}>
                    {avg! > 0 ? "+" : ""}
                    {avg}
                  </div>
                  <div className="text-xs text-white/70">{PHASE_META[ph].label}</div>
                  <div className="text-[10px] text-white/35">
                    {n} check-in{n === 1 ? "" : "s"}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-4">
            <span className="text-2xl opacity-70">🌙</span>
            <p className="text-xs leading-relaxed text-white/45">
              Keep logging your mood through your cycle to unlock this. Once you have check-ins in a
              couple of different phases, your average mood in each phase will appear right here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function PhaseRing({ day, length, phaseColor }: { day: number; length: number; phaseColor: string }) {
  const pct = Math.min(day / length, 1);
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 64 64" className="h-20 w-20 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
        <motion.circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={phaseColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c - c * pct }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white/90">{day}</span>
        <span className="text-[9px] text-white/40">of {length}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-white/85">{value}</div>
      <div className="text-[10px] text-white/50">{label}</div>
      <div className="text-[10px] text-white/30">{sub}</div>
    </div>
  );
}

function fmt(iso: string) {
  return format(new Date(iso + "T00:00:00"), "MMM d");
}
