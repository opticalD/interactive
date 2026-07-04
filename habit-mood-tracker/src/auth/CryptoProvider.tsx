import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import {
  decryptJSON,
  deriveKey,
  encryptJSON,
  exportKey,
  generateDEK,
  generateRecoveryKey,
  importKey,
  normalizeRecoveryKey,
  randomSalt,
  unwrapDEK,
  wrapDEK,
} from "../lib/crypto";

const VERIFY_TOKEN = "bloom-e2e-v1";
const lsKey = (userId: string) => `bloom.k.${userId}`;

interface CryptoRow {
  salt: string | null;
  verifier: string | null;
  pw_salt: string | null;
  wrapped_dek_pw: string | null;
  recovery_salt: string | null;
  wrapped_dek_recovery: string | null;
}

interface SetupResult {
  error: string | null;
  /** A newly-generated recovery key to show the user once (signup / migration). */
  recoveryKey?: string;
}

interface CryptoCtx {
  ready: boolean;
  busy: boolean;
  /** True while a login is deriving the key — Gate shows a spinner (no unlock flash). */
  authenticating: boolean;
  beginAuth: () => void;
  endAuth: () => void;
  hasKey: boolean;
  /** Recovery key to surface once, right after it's created. */
  pendingRecoveryKey: string | null;
  acknowledgeRecoveryKey: () => void;
  /** Derive/unwrap the DEK from the password (login / signup / unlock). */
  setup: (password: string) => Promise<SetupResult>;
  /** Recover the DEK with the recovery key, then re-wrap it under `newPassword`. */
  recover: (recoveryKey: string, newPassword: string) => Promise<string | null>;
  encrypt: (value: unknown) => Promise<string>;
  decrypt: <T>(payload: string) => Promise<T>;
}

const Ctx = createContext<CryptoCtx>(null as unknown as CryptoCtx);
export const useCrypto = () => useContext(Ctx);

async function currentUserId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id;
}

/** Build a fresh envelope (wrapped DEK copies) for a DEK + password. */
async function buildEnvelope(dek: CryptoKey, password: string) {
  const pw_salt = randomSalt();
  const wrapped_dek_pw = await wrapDEK(dek, await deriveKey(password, pw_salt));
  const recoveryKey = generateRecoveryKey();
  const recovery_salt = randomSalt();
  const wrapped_dek_recovery = await wrapDEK(
    dek,
    await deriveKey(normalizeRecoveryKey(recoveryKey), recovery_salt)
  );
  return { pw_salt, wrapped_dek_pw, recovery_salt, wrapped_dek_recovery, recoveryKey };
}

export function CryptoProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [pendingRecoveryKey, setPendingRecoveryKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setReady(false);
      setKey(null);
      if (!userId) {
        setReady(true);
        return;
      }
      const cached = localStorage.getItem(lsKey(userId));
      if (cached) {
        try {
          const k = await importKey(cached);
          if (!cancelled) setKey(k);
        } catch {
          localStorage.removeItem(lsKey(userId));
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("bloom.k."))
          .forEach((k) => localStorage.removeItem(k));
        setKey(null);
        setPendingRecoveryKey(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const cacheDEK = async (uid: string, dek: CryptoKey) => {
    localStorage.setItem(lsKey(uid), await exportKey(dek));
    setKey(dek);
  };

  const setup = async (password: string): Promise<SetupResult> => {
    const uid = await currentUserId();
    if (!uid) return { error: "Not signed in." };
    setBusy(true);
    try {
      const { data } = await supabase
        .from("user_crypto")
        .select("salt,verifier,pw_salt,wrapped_dek_pw,recovery_salt,wrapped_dek_recovery")
        .eq("user_id", uid)
        .maybeSingle();
      const row = data as CryptoRow | null;

      // 1) New envelope scheme — unwrap the DEK with the password.
      if (row?.wrapped_dek_pw && row.pw_salt) {
        try {
          const kek = await deriveKey(password, row.pw_salt);
          const dek = await unwrapDEK(row.wrapped_dek_pw, kek);
          await cacheDEK(uid, dek);
          return { error: null };
        } catch {
          return { error: "That password can't unlock your encrypted data." };
        }
      }

      // 2) Legacy direct-key scheme — verify, then migrate to an envelope
      //    reusing the existing key as the DEK (no data re-encryption needed).
      if (row?.salt && row.verifier) {
        const oldKey = await deriveKey(password, row.salt);
        try {
          const token = await decryptJSON<string>(row.verifier, oldKey);
          if (token !== VERIFY_TOKEN) return { error: "That password can't unlock your encrypted data." };
        } catch {
          return { error: "That password can't unlock your encrypted data." };
        }
        const env = await buildEnvelope(oldKey, password);
        await supabase
          .from("user_crypto")
          .update({
            pw_salt: env.pw_salt,
            wrapped_dek_pw: env.wrapped_dek_pw,
            recovery_salt: env.recovery_salt,
            wrapped_dek_recovery: env.wrapped_dek_recovery,
          })
          .eq("user_id", uid);
        await cacheDEK(uid, oldKey);
        setPendingRecoveryKey(env.recoveryKey);
        return { error: null, recoveryKey: env.recoveryKey };
      }

      // 3) Brand-new account — generate a random DEK + envelope.
      const dek = await generateDEK();
      const env = await buildEnvelope(dek, password);
      const { error } = await supabase.from("user_crypto").insert({
        pw_salt: env.pw_salt,
        wrapped_dek_pw: env.wrapped_dek_pw,
        recovery_salt: env.recovery_salt,
        wrapped_dek_recovery: env.wrapped_dek_recovery,
      });
      if (error) return { error: "Couldn't set up encryption. Please try again." };
      await cacheDEK(uid, dek);
      setPendingRecoveryKey(env.recoveryKey);
      return { error: null, recoveryKey: env.recoveryKey };
    } finally {
      setBusy(false);
      setAuthenticating(false);
    }
  };

  const recover = async (recoveryKey: string, newPassword: string): Promise<string | null> => {
    const uid = await currentUserId();
    if (!uid) return "Not signed in.";
    setBusy(true);
    try {
      const { data } = await supabase
        .from("user_crypto")
        .select("recovery_salt,wrapped_dek_recovery")
        .eq("user_id", uid)
        .maybeSingle();
      const row = data as CryptoRow | null;
      if (!row?.wrapped_dek_recovery || !row.recovery_salt) return "No recovery key is set for this account.";

      let dek: CryptoKey;
      try {
        const rkek = await deriveKey(normalizeRecoveryKey(recoveryKey), row.recovery_salt);
        dek = await unwrapDEK(row.wrapped_dek_recovery, rkek);
      } catch {
        return "That recovery key isn't valid.";
      }

      // Re-wrap the recovered DEK under the current password.
      const pw_salt = randomSalt();
      const wrapped_dek_pw = await wrapDEK(dek, await deriveKey(newPassword, pw_salt));
      await supabase.from("user_crypto").update({ pw_salt, wrapped_dek_pw }).eq("user_id", uid);
      await cacheDEK(uid, dek);
      return null;
    } finally {
      setBusy(false);
      setAuthenticating(false);
    }
  };

  const value: CryptoCtx = {
    ready,
    busy,
    authenticating,
    beginAuth: () => setAuthenticating(true),
    endAuth: () => setAuthenticating(false),
    hasKey: !!key,
    pendingRecoveryKey,
    acknowledgeRecoveryKey: () => setPendingRecoveryKey(null),
    setup,
    recover,
    encrypt: (value2) => encryptJSON(value2, key!),
    decrypt: (payload) => decryptJSON(payload, key!),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
