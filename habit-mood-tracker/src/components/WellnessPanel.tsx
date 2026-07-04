import { useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import type { WellnessData } from "../hooks/useWellness";
import {
  SCHEDULES,
  WELLNESS_SUGGESTIONS,
  type WellnessItem,
  type WellnessKind,
} from "../lib/types";

const KIND_META: Record<WellnessKind, { title: string; emoji: string; accent: string; addLabel: string }> = {
  supplement: { title: "Supplements", emoji: "💊", accent: "#22c55e", addLabel: "supplement" },
  skincare: { title: "Skincare", emoji: "🧴", accent: "#ec4899", addLabel: "product" },
};

export function WellnessPanel({ data, today }: { data: WellnessData; today: string }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
        <span>🌿</span> Daily wellness routine
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        <WellnessColumn kind="supplement" data={data} today={today} />
        <WellnessColumn kind="skincare" data={data} today={today} />
      </div>
    </section>
  );
}

function WellnessColumn({
  kind,
  data,
  today,
}: {
  kind: WellnessKind;
  data: WellnessData;
  today: string;
}) {
  const meta = KIND_META[kind];
  const items = data.items.filter((i) => i.kind === kind);
  const doneToday = (id: string) => data.logs.some((l) => l.item_id === id && l.date === today);
  const doneCount = items.filter((i) => doneToday(i.id)).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const allDone = items.length > 0 && doneCount === items.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: `${meta.accent}1e` }}>
          {meta.emoji}
        </span>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white/90">{meta.title}</h3>
          <p className="text-xs text-white/45">
            {items.length ? `${doneCount} of ${items.length} done today` : "nothing added yet"}
          </p>
        </div>
        <ProgressRing pct={pct} color={meta.accent} done={allDone} />
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <WellnessItemRow
              key={item.id}
              item={item}
              done={doneToday(item.id)}
              onToggle={() => {
                data.toggleToday(item.id, today);
                if (!doneToday(item.id) && doneCount + 1 === items.length && items.length > 0) {
                  confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: [meta.accent, "#fff"] });
                }
              }}
              onUpdate={(patch) => data.updateItem(item.id, patch)}
              onDelete={() => data.deleteItem(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      <AddWellness kind={kind} data={data} />
    </div>
  );
}

function ProgressRing({ pct, color, done }: { pct: number; color: string; done: boolean }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg viewBox="0 0 40 40" className="h-11 w-11 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <motion.circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold" style={{ color: done ? color : "rgba(255,255,255,0.6)" }}>
        {done ? "✓" : `${pct}%`}
      </span>
    </div>
  );
}

function WellnessItemRow({
  item,
  done,
  onToggle,
  onUpdate,
  onDelete,
}: {
  item: WellnessItem;
  done: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<WellnessItem>) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border px-3 py-2.5 transition-colors"
      style={{
        borderColor: done ? `${item.color}66` : "rgba(255,255,255,0.08)",
        background: done ? `${item.color}14` : "rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Satisfying check control */}
        <motion.button
          onClick={onToggle}
          whileTap={{ scale: 0.82 }}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{
            background: done ? item.color : "rgba(255,255,255,0.05)",
            boxShadow: done ? `0 0 0 4px ${item.color}22` : "inset 0 0 0 2px rgba(255,255,255,0.15)",
          }}
          aria-label={done ? "Mark not done" : "Mark done"}
        >
          <AnimatePresence>
            {done && (
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                className="text-sm font-bold text-white"
              >
                ✓
              </motion.span>
            )}
          </AnimatePresence>
          {!done && <span className="text-base opacity-70">{item.emoji}</span>}
        </motion.button>

        <button onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center gap-2 text-left">
          <span className={`text-sm font-medium ${done ? "text-white/60 line-through" : "text-white/90"}`}>
            {item.name}
          </span>
          {item.schedule && (
            <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: `${item.color}22`, color: item.color }}>
              {item.schedule}
            </span>
          )}
          {item.dose && <span className="text-[11px] text-white/40">{item.dose}</span>}
        </button>

        <button onClick={() => setOpen((o) => !o)} className="shrink-0 text-xs text-white/30 hover:text-white/60">
          {open ? "▲" : "⋯"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
              <Field label="Dose / amount" value={item.dose ?? ""} placeholder="e.g. 1000 IU" onSave={(v) => onUpdate({ dose: v || null })} />
              <Field label="Brand" value={item.brand ?? ""} placeholder="e.g. Now Foods" onSave={(v) => onUpdate({ brand: v || null })} />
              <label className="text-xs text-white/50">
                When
                <select
                  value={item.schedule ?? ""}
                  onChange={(e) => onUpdate({ schedule: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white/85 outline-none focus:border-cyan-400"
                >
                  <option value="">—</option>
                  {SCHEDULES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="Notes" value={item.notes ?? ""} placeholder="why you take it…" onSave={(v) => onUpdate({ notes: v || null })} />
            </div>
            <button onClick={onDelete} className="mt-3 text-[11px] text-red-400/70 hover:text-red-400">
              Remove {item.name}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onSave,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
}) {
  return (
    <label className="text-xs text-white/50">
      {label}
      <input
        defaultValue={value}
        placeholder={placeholder}
        onBlur={(e) => e.target.value !== value && onSave(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white/85 outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function AddWellness({ kind, data }: { kind: WellnessKind; data: WellnessData }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const meta = KIND_META[kind];
  const existing = new Set(data.items.filter((i) => i.kind === kind).map((i) => i.name.toLowerCase()));
  const suggestions = WELLNESS_SUGGESTIONS[kind].filter((s) => !existing.has(s.name.toLowerCase()));

  const addCustom = async () => {
    if (!name.trim()) return;
    await data.addItem({ kind, name: name.trim(), emoji: meta.emoji, color: meta.accent });
    setName("");
    setAdding(false);
  };

  return (
    <div className="mt-4">
      {suggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {suggestions.slice(0, 6).map((s) => (
            <motion.button
              key={s.name}
              whileTap={{ scale: 0.94 }}
              onClick={() =>
                data.addItem({ kind, name: s.name, emoji: s.emoji, color: s.color, dose: s.dose, schedule: s.schedule })
              }
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70 transition-colors hover:border-white/25 hover:bg-white/10"
            >
              <span>{s.emoji}</span>
              {s.name}
              <span className="text-white/30">＋</span>
            </motion.button>
          ))}
        </div>
      )}

      {adding ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder={`Add a ${meta.addLabel}…`}
            className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
          />
          <button onClick={addCustom} className="rounded-lg bg-white/90 px-4 text-sm font-medium text-black hover:bg-white">
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-lg border border-dashed border-white/15 py-2 text-xs text-white/45 transition-colors hover:border-white/30 hover:text-white/70"
        >
          ＋ Add your own {meta.addLabel}
        </button>
      )}
    </div>
  );
}
