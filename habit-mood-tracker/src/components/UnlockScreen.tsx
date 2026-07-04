import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthProvider";
import { useCrypto } from "../auth/CryptoProvider";

export function UnlockScreen() {
  const { signOut } = useAuth();
  const { setup, busy } = useCrypto();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const error = await setup(password);
    if (error) setErr(error);
  };

  return (
    <div className="flex min-h-full items-center justify-center px-5">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
      >
        <div className="mb-5 text-center">
          <div className="text-3xl">🔒</div>
          <h1 className="mt-2 text-xl font-semibold text-white/90">Unlock your entries</h1>
          <p className="mt-1 text-xs text-white/50">
            Your mood details are end-to-end encrypted. Enter your password to decrypt them on this
            device.
          </p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your account password"
          required
          autoFocus
          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
        />
        {err && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {busy ? "Unlocking…" : "Unlock"}
        </button>
        <button
          type="button"
          onClick={signOut}
          className="mt-3 w-full text-center text-xs text-white/40 hover:text-white/70"
        >
          Sign out
        </button>
      </motion.form>
    </div>
  );
}
