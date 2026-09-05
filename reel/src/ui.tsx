/** Shared marks: the rules, labels and drawn icons the programme is set with. */

import { useEffect, useState, type ReactNode } from "react";
import { poster as posterUrl, type Title } from "./tmdb";

/* Icons: authored SVG, 1.5px stroke on a 24px grid. */
type IconProps = { className?: string };
const svg = (children: ReactNode) => (p: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={p.className ?? "h-4 w-4"}
  >
    {children}
  </svg>
);

export const IconYes = svg(<path d="M4 12.5 9.5 18 20 6.5" />);
export const IconNo = svg(
  <>
    <path d="M5.5 5.5 18.5 18.5" />
    <path d="M18.5 5.5 5.5 18.5" />
  </>
);
export const IconSeen = svg(
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.75" />
  </>
);
export const IconQueue = svg(
  <>
    <path d="M6 3.5h12v17l-6-4.2-6 4.2Z" />
  </>
);
export const IconSkip = svg(
  <>
    <path d="M5 5.5v13l9-6.5Z" />
    <path d="M19 5.5v13" />
  </>
);
export const IconStock = svg(
  <>
    <circle cx="12" cy="12" r="8.25" />
    <path d="M12 3.75A8.25 8.25 0 0 1 12 20.25Z" fill="currentColor" stroke="none" />
  </>
);
export const IconArrow = svg(
  <>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </>
);

/** A hairline. The rules are the design, so they get their own component. */
export const Rule = ({ heavy = false, red = false }: { heavy?: boolean; red?: boolean }) => (
  <div
    className={`w-full ${heavy ? "h-[3px]" : "h-px"}`}
    style={{ background: red ? "var(--red)" : "var(--rule)" }}
  />
);

export const Label = ({ children, red = false }: { children: ReactNode; red?: boolean }) => (
  <span className="label" style={red ? { color: "var(--red)" } : undefined}>
    {children}
  </span>
);

/**
 * A control set as a ruled block, the way a programme sets its ticket boxes.
 * No pills, no shadows — a box, a rule, and a state.
 */
export function Action({
  children, onClick, icon: Icon, active = false, danger = false, hint,
}: {
  children: ReactNode;
  onClick: () => void;
  icon?: (p: { className?: string }) => JSX.Element;
  active?: boolean;
  danger?: boolean;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={hint}
      className="meta group inline-flex items-center gap-2 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-150"
      style={{
        border: `1px solid ${active ? "var(--red)" : "var(--rule)"}`,
        color: active || danger ? "var(--red)" : "var(--ink-2)",
        background: active ? "var(--red-wash)" : "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--ink)";
        if (!active && !danger) e.currentTarget.style.color = "var(--ink)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = active ? "var(--red)" : "var(--rule)";
        e.currentTarget.style.color = active || danger ? "var(--red)" : "var(--ink-2)";
      }}
    >
      {Icon ? <Icon className="h-[0.85rem] w-[0.85rem]" /> : null}
      {children}
    </button>
  );
}

/** Posters are reproductions on a page: a plate, a hairline, no rounding.
 *  No fade-in — the plate sits on paper stock, so there is nothing to fade
 *  from, and a cached image would never fire onLoad to end the fade anyway. */
export function Plate({ title, size = "w342", className = "" }: { title: Title; size?: "w342" | "w500"; className?: string }) {
  const src = posterUrl(title.poster, size);
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: "var(--paper-2)", border: "1px solid var(--rule)", aspectRatio: "2 / 3" }}
    >
      {src ? (
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="label flex h-full items-center justify-center p-3 text-center">No plate</div>
      )}
    </div>
  );
}

/** The metadata run: language · year · rating, set tabular in Archivo. */
export function Run({ title, extra }: { title: Title; extra?: string }) {
  const parts = [
    title.kind === "tv" ? "Series" : "Film",
    title.year ? String(title.year) : null,
    title.lang.toUpperCase(),
    title.votes > 40 ? `${title.rating.toFixed(1)} / 10` : null,
    extra ?? null,
  ].filter(Boolean) as string[];
  return (
    <p className="tnum text-[0.72rem] uppercase tracking-[0.13em]" style={{ color: "var(--ink-2)" }}>
      {parts.join("  ·  ")}
    </p>
  );
}

/** Delays a value so a spinner never flashes for a fetch that resolves fast. */
export function useDelayed(active: boolean, ms = 320) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) return setShow(false);
    const t = setTimeout(() => setShow(true), ms);
    return () => clearTimeout(t);
  }, [active, ms]);
  return show;
}
