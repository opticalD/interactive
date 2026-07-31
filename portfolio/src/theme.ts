import { useEffect, useSyncExternalStore } from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type Resolved = "light" | "dark";

const KEY = "portfolio.theme";

/* ── Adaptive colour ───────────────────────────────────────────────────────
 * The page doesn't own one fixed palette. It carries a neutral base and
 * borrows its accent from whichever project you're looking at, so the whole
 * surface shifts with the content instead of fighting it.
 */

export const BASE = {
  light: {
    bg: "#f4f1ec",
    bgTint: "#ffffff",
    ink: "#1a1a1f",
    inkSoft: "rgba(26,26,31,0.62)",
    inkFaint: "rgba(26,26,31,0.40)",
    glass: "rgba(255,255,255,0.55)",
    glassStrong: "rgba(255,255,255,0.78)",
    hairline: "rgba(26,26,31,0.10)",
    shadow: "0 1px 2px rgba(26,26,31,0.04), 0 12px 32px -12px rgba(26,26,31,0.16)",
  },
  dark: {
    bg: "#0f1117",
    bgTint: "#161a23",
    ink: "#f2f3f7",
    inkSoft: "rgba(242,243,247,0.66)",
    inkFaint: "rgba(242,243,247,0.42)",
    glass: "rgba(255,255,255,0.06)",
    glassStrong: "rgba(255,255,255,0.11)",
    hairline: "rgba(255,255,255,0.12)",
    shadow: "0 1px 2px rgba(0,0,0,0.3), 0 16px 40px -16px rgba(0,0,0,0.6)",
  },
} as const;

/** Scene lighting, gradient and fog per theme — the 3D half of the same palette. */
export const SCENE = {
  light: { top: "#fdfbf8", bottom: "#e3ddd3", fog: "#ece8e1", ambient: 1.1, key: 1.45 },
  // Dark needs more light than feels right on paper: the glass is transmissive,
  // so a dim key leaves the accent colours muddy rather than moody.
  dark: { top: "#1b1f2a", bottom: "#080a0f", fog: "#10131a", ambient: 0.95, key: 1.7 },
} as const;

/** Apply the resolved theme + the active accent as CSS variables. */
export function applyTheme(resolved: Resolved, accent: string) {
  const base = BASE[resolved];
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  for (const [k, v] of Object.entries(base)) {
    root.style.setProperty(`--${camelToKebab(k)}`, v);
  }
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-wash", withAlpha(accent, resolved === "light" ? 0.1 : 0.18));
  root.style.setProperty("--accent-edge", withAlpha(accent, resolved === "light" ? 0.34 : 0.45));
}

function camelToKebab(s: string) {
  return s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** #rrggbb → rgba(). Accents are authored as hex in content.ts. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/* ── Theme preference ─────────────────────────────────────────────────────*/

function subscribeSystem(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useSystemTheme(): Resolved {
  return useSyncExternalStore(
    subscribeSystem,
    () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    () => "light"
  );
}

/**
 * Light is the designed default rather than "whatever the OS says" — the
 * palette was built light-first and it's what a first-time visitor should see.
 * "System" is one click away and, once chosen, is remembered.
 */
export function loadThemeChoice(): ThemeChoice {
  const stored = localStorage.getItem(KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "light";
}

export function storeThemeChoice(choice: ThemeChoice) {
  localStorage.setItem(KEY, choice);
}

/* ── Reduced motion ───────────────────────────────────────────────────────
 * Consulted by every animated surface. Motion here is meant to explain where
 * things went; when the user asks for less, it goes away entirely rather than
 * merely getting faster.
 */

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/** Keep the browser UI (address bar, notch) in step with the theme. */
export function useMetaThemeColor(resolved: Resolved) {
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = BASE[resolved].bg;
  }, [resolved]);
}
