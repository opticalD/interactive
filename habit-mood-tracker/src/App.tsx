import { format } from "date-fns";
import { motion } from "framer-motion";
import { useTracker } from "./store";
import { StatCards } from "./components/StatCards";
import { MoodHeatmap } from "./components/MoodHeatmap";
import { TodayPanel } from "./components/TodayPanel";
import { HabitBars, MoodTrend } from "./components/Charts";

export default function App() {
  const { data, today, setMood, toggleHabit, reset } = useTracker();

  return (
    <div className="mx-auto min-h-full max-w-6xl px-5 py-10">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-end justify-between"
      >
        <div>
          <h1 className="bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Bloom
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {format(new Date(), "EEEE, MMMM d")} · track your habits & mood
          </p>
        </div>
        <button
          onClick={reset}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
        >
          Reset demo data
        </button>
      </motion.header>

      <div className="mb-6">
        <StatCards data={data} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <TodayPanel data={data} today={today} onMood={setMood} onToggle={toggleHabit} />
        </div>
        <div className="space-y-6">
          <MoodHeatmap data={data} />
          <div className="grid gap-6 md:grid-cols-2">
            <MoodTrend data={data} />
            <HabitBars data={data} />
          </div>
        </div>
      </div>

      <footer className="mt-10 text-center text-xs text-white/30">
        Data is stored locally in your browser · built with React, Tailwind, Framer Motion & Recharts
      </footer>
    </div>
  );
}
