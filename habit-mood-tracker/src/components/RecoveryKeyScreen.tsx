import { useState } from "react";
import { motion } from "framer-motion";
import { useCrypto } from "../auth/CryptoProvider";

export function RecoveryKeyScreen() {
  const { pendingRecoveryKey, acknowledgeRecoveryKey } = useCrypto();
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const recoveryKey = pendingRecoveryKey ?? "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked; the key is still visible to copy manually */
    }
  };

  const download = () => {
    const blob = new Blob(
      [
        `Bloom recovery key\n\n${recoveryKey}\n\n` +
          `Keep this safe. If you forget your password, this key is the ONLY way to ` +
          `recover your encrypted mood entries. Anyone with it can unlock your data.\n`,
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bloom-recovery-key.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-full items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
      >
        <div className="mb-4 text-center">
          <div className="text-3xl">🔑</div>
          <h1 className="mt-2 text-xl font-semibold text-white/90">Save your recovery key</h1>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Your entries are encrypted with your password. If you ever forget it, this key is the{" "}
            <span className="font-semibold text-white/80">only</span> way to get your data back —
            we can't reset it for you.
          </p>
        </div>

        <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] p-4 text-center">
          <div className="select-all font-mono text-lg tracking-wider text-cyan-100">
            {recoveryKey}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={copy}
            className="flex-1 rounded-lg border border-white/15 py-2 text-sm text-white/80 transition-colors hover:bg-white/5"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
          <button
            onClick={download}
            className="flex-1 rounded-lg border border-white/15 py-2 text-sm text-white/80 transition-colors hover:bg-white/5"
          >
            Download .txt
          </button>
        </div>

        <label className="mt-5 flex items-start gap-2 text-xs text-white/60">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-cyan-400"
          />
          I've saved my recovery key somewhere safe. I understand it can't be recovered if lost.
        </label>

        <button
          onClick={acknowledgeRecoveryKey}
          disabled={!confirmed}
          className="mt-4 w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-40"
        >
          Continue to Bloom
        </button>
      </motion.div>
    </div>
  );
}
