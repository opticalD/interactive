import { format } from "date-fns";
import { motion } from "framer-motion";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { useData } from "./hooks/useData";
import { AuthScreen } from "./components/AuthScreen";
import { InfoButton } from "./components/InfoButton";
import { CheckInPanel } from "./components/CheckInPanel";
import { HabitsPanel } from "./components/HabitsPanel";
import { Analytics } from "./components/Analytics";

function Dashboard() {
  const { session, signOut } = useAuth();
  const user = session!.user;
  const data = useData(user.id);
  const today = format(new Date(), "yyyy-MM-dd");
  const name = (user.user_metadata?.display_name as string) || user.email?.split("@")[0] || "there";

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
            {format(new Date(), "EEEE, MMMM d")} · welcome back, {name}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <InfoButton />
          <button
            onClick={signOut}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
          >
            Sign out
          </button>
        </div>
      </motion.header>

      {data.loading ? (
        <div className="py-24 text-center text-sm text-white/40">Loading your data…</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.85fr)_1.4fr]">
          <div className="space-y-6">
            <CheckInPanel factors={data.factors} onSave={data.addEntry} />
            <HabitsPanel data={data} today={today} />
          </div>
          <Analytics data={data} />
        </div>
      )}

      <footer className="mt-10 text-center text-xs text-white/30">
        Valence–arousal circumplex model · your data is private to your account · React · Supabase · Recharts
      </footer>
    </div>
  );
}

function Gate() {
  const { session, loading } = useAuth();
  if (loading) return <div className="py-24 text-center text-sm text-white/40">Loading…</div>;
  return session ? <Dashboard /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-full">
        <Gate />
      </div>
    </AuthProvider>
  );
}
