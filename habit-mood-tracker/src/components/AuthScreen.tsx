import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { InfoButton } from "./InfoButton";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    if (mode === "in") {
      const error = await signIn(email, password);
      setBusy(false);
      if (error) setErr(error);
      return;
    }

    // Create the account. When email confirmation is OFF, signUp already
    // establishes a session — we do NOT call signIn again, because a second
    // auth would churn the token while the dashboard is loading and race the
    // first data fetch (seeded factors would come back empty until a refresh).
    const signUpErr = await signUp(email, password, name);
    if (signUpErr) {
      setBusy(false);
      setErr(signUpErr);
      return;
    }
    const { data } = await supabase.auth.getSession();
    setBusy(false);
    if (!data.session) {
      // Confirmation is on — no session yet.
      setMsg("Account created! Please confirm your email from your inbox, then sign in.");
    }
    // Otherwise the auth listener swaps in the dashboard automatically.
  };

  return (
    <div className="flex min-h-full items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Bloom
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Science-backed mood & habit tracking. Your data, your account.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
        >
          <div className="mb-2 flex rounded-lg bg-white/5 p-1 text-sm">
            {(["in", "up"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md py-1.5 transition-colors ${
                  mode === m ? "bg-white text-black" : "text-white/60"
                }`}
              >
                {m === "in" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {mode === "up" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
              required
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 chars)"
            required
            minLength={6}
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
          />

          {err && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</p>}
          {msg && (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{msg}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {busy ? "…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
        <div className="mt-4 flex flex-col items-center gap-3">
          <InfoButton label="New here? Learn the terms" />
          <p className="text-center text-xs text-white/30">
            Each account tracks its own private mood & habit history.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
