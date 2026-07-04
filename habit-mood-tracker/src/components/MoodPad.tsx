import { useRef } from "react";
import { classify } from "../lib/moods";

interface Props {
  valence: number; // -100..100
  arousal: number; // -100..100
  onChange: (valence: number, arousal: number) => void;
  size?: number;
}

/**
 * Interactive circumplex pad. X axis = valence (unpleasant -> pleasant),
 * Y axis = arousal (calm -> energized). Click or drag to place your mood.
 */
export function MoodPad({ valence, arousal, onChange, size = 260 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const q = classify(valence, arousal);

  const update = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 2 - 1; // -1..1
    const y = ((clientY - r.top) / r.height) * 2 - 1;
    const v = Math.max(-100, Math.min(100, Math.round(x * 100)));
    const a = Math.max(-100, Math.min(100, Math.round(-y * 100))); // invert: up = high arousal
    onChange(v, a);
  };

  const px = ((valence + 100) / 200) * size;
  const py = ((100 - arousal) / 200) * size;

  return (
    <div className="flex flex-col items-center">
      <div
        ref={ref}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          update(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => dragging.current && update(e.clientX, e.clientY)}
        onPointerUp={() => (dragging.current = false)}
        className="relative cursor-crosshair touch-none rounded-2xl border border-white/10"
        style={{
          width: size,
          height: size,
          background:
            "radial-gradient(120% 120% at 50% 0%, rgba(245,158,11,0.14), transparent 55%)," +
            "radial-gradient(120% 120% at 100% 100%, rgba(34,197,94,0.14), transparent 55%)," +
            "radial-gradient(120% 120% at 0% 100%, rgba(59,130,246,0.14), transparent 55%)," +
            "radial-gradient(120% 120% at 0% 0%, rgba(239,68,68,0.14), transparent 55%)," +
            "rgba(255,255,255,0.02)",
        }}
      >
        {/* axes */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />

        {/* axis labels */}
        <span className="absolute left-1/2 top-1.5 -translate-x-1/2 text-[10px] text-white/40">
          energized ↑
        </span>
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] text-white/40">
          ↓ calm
        </span>
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-white/40">
          unpleasant
        </span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-white/40">
          pleasant
        </span>

        {/* handle */}
        <div
          className="pointer-events-none absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xl shadow-lg transition-[background] duration-200"
          style={{
            left: px,
            top: py,
            background: `${q.color}`,
            boxShadow: `0 0 0 6px ${q.color}33, 0 8px 20px -6px ${q.color}`,
          }}
        >
          {q.emoji}
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className="text-lg font-semibold" style={{ color: q.color }}>
          {q.label}
        </span>
        <span className="ml-2 text-xs text-white/40">
          valence {valence > 0 ? "+" : ""}
          {valence} · arousal {arousal > 0 ? "+" : ""}
          {arousal}
        </span>
      </div>
    </div>
  );
}
