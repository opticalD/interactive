import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../auth/AuthProvider";
import { useCrypto } from "../auth/CryptoProvider";

export function UnlockScreen() {
  const { signOut } = useAuth();
  const { setup, recover, busy } = useCrypto();
  const [password, setPassword] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const { error } = await setup(password);
    if (error) {
      setErr(error);
      setShowRecovery(true); // offer recovery once a password fails
    }
  };

  const doRecover = async () => {
    setErr(null);
    if (!password) {
      setErr("Enter your current password above so we can re-secure your data.");
      return;
    }
    const error = await recover(recoveryKey, password);
    if (error) setErr(error);
  };

  return (
    <div className="flex min-h-full items-center justify-center px-5">
      <motion.div
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

        <form onSubmit={unlock}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your account password"
            required
            autoFocus
            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
          />
          {err && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {busy ? "Unlocking…" : "Unlock"}
          </button>
        </form>

        {!showRecovery && (
          <button
            onClick={() => setShowRecovery(true)}
            className="mt-3 w-full text-center text-xs text-white/40 hover:text-white/70"
          >
            Forgot your password? Recover with your recovery key
          </button>
        )}

        <AnimatePresence>
          {showRecovery && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-2 text-xs text-white/55">
                  Reset your password? Enter your <span className="font-medium">new</span> password
                  above and your recovery key below to restore and re-secure your data.
                </p>
                <input
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-…"
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 font-mono text-sm tracking-wider text-white outline-none focus:border-cyan-400"
                />
                <button
                  onClick={doRecover}
                  disabled={busy || !recoveryKey}
                  className="mt-3 w-full rounded-lg border border-cyan-400/40 bg-cyan-400/10 py-2.5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20 disabled:opacity-50"
                >
                  {busy ? "Recovering…" : "Recover with key"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={signOut}
          className="mt-4 w-full text-center text-xs text-white/40 hover:text-white/70"
        >
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
