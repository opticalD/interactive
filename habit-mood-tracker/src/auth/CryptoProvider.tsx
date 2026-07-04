import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import {
  decryptJSON as decJSON,
  deriveKey,
  encryptJSON as encJSON,
  exportKey,
  importKey,
  randomSalt,
} from "../lib/crypto";

const VERIFY_TOKEN = "bloom-e2e-v1";
const lsKey = (userId: string) => `bloom.k.${userId}`;

interface CryptoCtx {
  ready: boolean; // finished checking for a cached key
  busy: boolean; // deriving a key right now
  hasKey: boolean;
  /** Derive + cache the key from the password (called at login/signup/unlock). */
  setup: (password: string) => Promise<string | null>;
  encrypt: (value: unknown) => Promise<string>;
  decrypt: <T>(payload: string) => Promise<T>;
}

const Ctx = createContext<CryptoCtx>(null as unknown as CryptoCtx);
export const useCrypto = () => useContext(Ctx);

export function CryptoProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  // Restore a cached key (localStorage, per user) when the session changes.
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

  // Clear cached keys on sign-out.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("bloom.k."))
          .forEach((k) => localStorage.removeItem(k));
        setKey(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const setup = async (password: string): Promise<string | null> => {
    // Read the current user fresh — setup is often called right after login,
    // before this provider has re-rendered with the new session.
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) return "Not signed in.";
    setBusy(true);
    try {
      const { data: existing } = await supabase
        .from("user_crypto")
        .select("salt,verifier")
        .eq("user_id", uid)
        .maybeSingle();

      const salt = existing?.salt ?? randomSalt();
      const k = await deriveKey(password, salt);

      if (existing) {
        // Confirm this password matches the one the data was encrypted with.
        try {
          const token = await decJSON<string>(existing.verifier, k);
          if (token !== VERIFY_TOKEN) return "That password can't unlock your encrypted data.";
        } catch {
          return "That password can't unlock your encrypted data.";
        }
      } else {
        const verifier = await encJSON(VERIFY_TOKEN, k);
        const { error } = await supabase.from("user_crypto").insert({ salt, verifier });
        if (error) return "Couldn't set up encryption. Please try again.";
      }

      localStorage.setItem(lsKey(uid), await exportKey(k));
      setKey(k);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const value: CryptoCtx = {
    ready,
    busy,
    hasKey: !!key,
    setup,
    encrypt: (value) => encJSON(value, key!),
    decrypt: (payload) => decJSON(payload, key!),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
