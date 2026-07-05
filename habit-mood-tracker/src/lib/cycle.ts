import { differenceInCalendarDays, parseISO } from "date-fns";
import type { PeriodLog } from "./types";

export type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export const PHASE_META: Record<Phase, { label: string; color: string; blurb: string }> = {
  menstrual: { label: "Menstrual", color: "#ef4444", blurb: "Your period — rest and be kind to yourself." },
  follicular: { label: "Follicular", color: "#22c55e", blurb: "Energy usually rises after your period." },
  ovulatory: { label: "Ovulatory", color: "#eab308", blurb: "Peak fertility; often a high-energy window." },
  luteal: { label: "Luteal", color: "#a855f7", blurb: "Winding down — PMS symptoms can appear here." },
};

export interface CycleStats {
  avgCycleLength: number;
  avgPeriodLength: number;
  lastStart: string | null;
  dayOfCycle: number | null;
  phase: Phase | null;
  nextPredicted: string | null;
  daysUntilNext: number | null;
  fertileStartDay: number;
  fertileEndDay: number;
  ovulationDay: number;
  hasEnoughData: boolean;
}

const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;

/** Which phase a given day-of-cycle falls in. */
export function phaseForDay(day: number, cycleLength: number, periodLength: number): Phase {
  const ovulation = cycleLength - 14;
  if (day <= periodLength) return "menstrual";
  if (day >= ovulation - 1 && day <= ovulation + 1) return "ovulatory";
  if (day < ovulation - 1) return "follicular";
  return "luteal";
}

/** Compute cycle statistics from a list of period logs (newest first is fine). */
export function cycleStats(periods: PeriodLog[], today = new Date()): CycleStats {
  const sorted = [...periods].sort((a, b) => a.started_on.localeCompare(b.started_on));
  const starts = sorted.map((p) => p.started_on);

  // average cycle length from gaps between consecutive starts
  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    gaps.push(differenceInCalendarDays(parseISO(starts[i]), parseISO(starts[i - 1])));
  }
  const usableGaps = gaps.filter((g) => g >= 15 && g <= 60); // ignore outliers
  const avgCycleLength = usableGaps.length
    ? Math.round(usableGaps.reduce((a, b) => a + b, 0) / usableGaps.length)
    : DEFAULT_CYCLE;

  // average period length from logs that have an end date
  const lengths = sorted
    .filter((p) => p.ended_on)
    .map((p) => differenceInCalendarDays(parseISO(p.ended_on!), parseISO(p.started_on)) + 1)
    .filter((n) => n >= 1 && n <= 12);
  const avgPeriodLength = lengths.length
    ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
    : DEFAULT_PERIOD;

  const lastStart = starts.length ? starts[starts.length - 1] : null;
  const ovulationDay = avgCycleLength - 14;

  let dayOfCycle: number | null = null;
  let phase: Phase | null = null;
  let nextPredicted: string | null = null;
  let daysUntilNext: number | null = null;

  if (lastStart) {
    const since = differenceInCalendarDays(today, parseISO(lastStart));
    dayOfCycle = ((since % avgCycleLength) + avgCycleLength) % avgCycleLength + 1;
    phase = phaseForDay(dayOfCycle, avgCycleLength, avgPeriodLength);
    const next = new Date(parseISO(lastStart));
    // roll forward until the predicted start is in the future
    while (differenceInCalendarDays(next, today) <= 0) next.setDate(next.getDate() + avgCycleLength);
    nextPredicted = next.toISOString().slice(0, 10);
    daysUntilNext = differenceInCalendarDays(next, today);
  }

  return {
    avgCycleLength,
    avgPeriodLength,
    lastStart,
    dayOfCycle,
    phase,
    nextPredicted,
    daysUntilNext,
    fertileStartDay: ovulationDay - 4,
    fertileEndDay: ovulationDay + 1,
    ovulationDay,
    hasEnoughData: starts.length >= 2,
  };
}

/** Phase for a specific calendar date, given the period history (for mood×phase). */
export function phaseForDate(dateISO: string, periods: PeriodLog[]): Phase | null {
  if (periods.length === 0) return null;
  const stats = cycleStats(periods);
  // Find the most recent period start on or before this date — the cycle it's in.
  const sorted = [...periods].sort((a, b) => a.started_on.localeCompare(b.started_on));
  let base: string | null = null;
  for (const p of sorted) if (p.started_on <= dateISO) base = p.started_on;
  if (!base) return null;
  const since = differenceInCalendarDays(parseISO(dateISO), parseISO(base));
  const day = (since % stats.avgCycleLength) + 1;
  return phaseForDay(day, stats.avgCycleLength, stats.avgPeriodLength);
}
