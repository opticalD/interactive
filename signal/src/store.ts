import { useCallback, useEffect, useState } from "react";
import { STARTER_IDS } from "./sources";

const KEY = "signal.v1";

type Persisted = {
  enabled: string[];
  read: string[];
  saved: string[];
  /** Set the first time the app runs, so "new since last visit" means something. */
  lastVisit: number;
  onboarded: boolean;
};

const DEFAULTS: Persisted = {
  enabled: STARTER_IDS,
  read: [],
  saved: [],
  lastVisit: Date.now(),
  onboarded: false,
};

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Persisted>) };
  } catch {
    return DEFAULTS;
  }
}

export function useStore() {
  const [state, setState] = useState<Persisted>(load);

  // The timestamp for "new since last visit" is frozen at mount, so items don't
  // stop being new while you're still looking at them.
  const [sessionStart] = useState(() => load().lastVisit);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, lastVisit: Date.now() }));
    } catch {
      // Private browsing or a full quota — the app still works, just forgetfully.
    }
  }, [state]);

  const toggleSource = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      enabled: s.enabled.includes(id)
        ? s.enabled.filter((x) => x !== id)
        : [...s.enabled, id],
    }));
  }, []);

  const setEnabled = useCallback((ids: string[]) => {
    setState((s) => ({ ...s, enabled: ids }));
  }, []);

  const markRead = useCallback((id: string) => {
    setState((s) =>
      s.read.includes(id) ? s : { ...s, read: [...s.read, id].slice(-2000) }
    );
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id],
    }));
  }, []);

  const dismissOnboarding = useCallback(() => {
    setState((s) => ({ ...s, onboarded: true }));
  }, []);

  const clearRead = useCallback(() => setState((s) => ({ ...s, read: [] })), []);

  return {
    enabled: state.enabled,
    read: state.read,
    saved: state.saved,
    onboarded: state.onboarded,
    sessionStart,
    toggleSource,
    setEnabled,
    markRead,
    toggleSaved,
    dismissOnboarding,
    clearRead,
  };
}
