import { useEffect, useState } from "react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { CryptoProvider, useCrypto } from "./auth/CryptoProvider";
import { useData } from "./hooks/useData";
import { AuthScreen } from "./components/AuthScreen";
import { UnlockScreen } from "./components/UnlockScreen";
import { RecoveryKeyScreen } from "./components/RecoveryKeyScreen";
import { InfoButton } from "./components/InfoButton";
import { Onboarding, onboardingKey } from "./components/Onboarding";
import { CheckInPanel } from "./components/CheckInPanel";
import { HabitsPanel } from "./components/HabitsPanel";
import { Analytics } from "./components/Analytics";
import { WellnessPanel } from "./components/WellnessPanel";
import { useWellness } from "./hooks/useWellness";

function Dashboard() {
  const { session, signOut } = useAuth();
  const user = session!.user;
  const data = useData(user.id);
  const wellness = useWellness(user.id);
  const today = format(new Date(), "yyyy-MM-dd");
  const name = (user.user_metadata?.display_name as string) || user.email?.split("@")[0] || "there";

  // Show the guided tour once per account (first time on this device).
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(onboardingKey(user.id))) setShowTour(true);
  }, [user.id]);
  const finishTour = () => {
    localStorage.setItem(onboardingKey(user.id), "1");
    setShowTour(false);
  };

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
          <button
            onClick={() => setShowTour(true)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
          >
            🧭 Tour
          </button>
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
          <Analytics data={data} wellness={wellness} />
        </div>
      )}

      {!data.loading && (
        <div className="mt-6">
          <WellnessPanel data={wellness} today={today} />
        </div>
      )}

      <footer className="mt-10 text-center text-xs text-white/30">
        Valence–arousal circumplex model · your data is private to your account · React · Supabase · Recharts
      </footer>

      <AnimatePresence>
        {showTour && <Onboarding name={name} onDone={finishTour} />}
      </AnimatePresence>
    </div>
  );
}

function Gate() {
  const { session, loading } = useAuth();
  const crypto = useCrypto();
  const Loading = <div className="py-24 text-center text-sm text-white/40">Loading…</div>;

  if (loading || (session && !crypto.ready) || crypto.authenticating) return Loading;
  if (!session) return <AuthScreen />;
  if (!crypto.hasKey) return <UnlockScreen />; // stays mounted through its own unlock attempts
  if (crypto.pendingRecoveryKey) return <RecoveryKeyScreen />;
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <CryptoProvider>
        <div className="min-h-full">
          <Gate />
        </div>
      </CryptoProvider>
    </AuthProvider>
  );
}
