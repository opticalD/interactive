import { useState } from "react";
import { format } from "date-fns";
import type { HealthData } from "../hooks/useHealth";
import { SYMPTOM_OPTIONS, type HealthEvent, type Medicine } from "../lib/types";

const today = () => format(new Date(), "yyyy-MM-dd");

const blank = (): Omit<HealthEvent, "id"> => ({
  started_on: today(),
  ended_on: null,
  condition: "",
  severity: 3,
  symptoms: [],
  medicines: [],
  notes: null,
});

export function HealthPanel({ data }: { data: HealthData }) {
  const [editing, setEditing] = useState<null | { id?: string; draft: Omit<HealthEvent, "id"> }>(null);

  const ongoing = data.events.filter((e) => !e.ended_on).length;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
          <span>🤒</span> Illness &amp; medicine
        </h2>
        {!editing && (
          <button
            onClick={() => setEditing({ draft: blank() })}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white/90"
          >
            ＋ Log illness
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
        {editing ? (
          <HealthForm
            initial={editing.draft}
            onCancel={() => setEditing(null)}
            onSave={async (d) => {
              if (editing.id) await data.updateEvent(editing.id, d);
              else await data.addEvent(d);
              setEditing(null);
            }}
          />
        ) : data.events.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">
            Feeling unwell? Log an illness and the medicines you're taking — it's private, encrypted,
            and helps you spot how it affects your mood.
          </p>
        ) : (
          <div className="space-y-3">
            {ongoing > 0 && (
              <p className="text-xs text-amber-300/80">
                🩹 {ongoing} ongoing — get well soon.
              </p>
            )}
            {data.events.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                onEdit={() => setEditing({ id: e.id, draft: { ...e } })}
                onRecover={() => data.updateEvent(e.id, { ...e, ended_on: today() })}
                onDelete={() => data.deleteEvent(e.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EventRow({
  event,
  onEdit,
  onRecover,
  onDelete,
}: {
  event: HealthEvent;
  onEdit: () => void;
  onRecover: () => void;
  onDelete: () => void;
}) {
  const ongoing = !event.ended_on;
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{
        borderColor: ongoing ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.08)",
        background: ongoing ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white/90">{event.condition || "Illness"}</span>
            <span className="flex gap-0.5" title={`Severity ${event.severity}/5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: n <= event.severity ? "#ef4444" : "rgba(255,255,255,0.15)" }}
                />
              ))}
            </span>
            {ongoing ? (
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] text-amber-300">
                ongoing
              </span>
            ) : (
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] text-emerald-300">
                recovered
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-white/45">
            {fmt(event.started_on)}
            {event.ended_on ? ` – ${fmt(event.ended_on)}` : " – now"}
          </div>
          {event.symptoms.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {event.symptoms.map((s) => (
                <span key={s} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                  {s}
                </span>
              ))}
            </div>
          )}
          {event.medicines.length > 0 && (
            <div className="mt-2 text-xs text-white/60">
              💊 {event.medicines.map((m) => m.name + (m.dose ? ` (${m.dose})` : "")).join(", ")}
            </div>
          )}
          {event.notes && <p className="mt-1.5 text-xs italic text-white/45">“{event.notes}”</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 text-xs">
          {ongoing && (
            <button onClick={onRecover} className="text-emerald-300/80 hover:text-emerald-300">
              Mark recovered
            </button>
          )}
          <button onClick={onEdit} className="text-white/40 hover:text-white/70">
            Edit
          </button>
          <button onClick={onDelete} className="text-red-400/60 hover:text-red-400">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function fmt(iso: string) {
  return format(new Date(iso + "T00:00:00"), "MMM d");
}

function HealthForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<HealthEvent, "id">;
  onSave: (d: Omit<HealthEvent, "id">) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState(initial);
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((p) => ({ ...p, [k]: v }));

  const toggleSymptom = (s: string) =>
    set("symptoms", d.symptoms.includes(s) ? d.symptoms.filter((x) => x !== s) : [...d.symptoms, s]);

  const setMed = (i: number, patch: Partial<Medicine>) =>
    set("medicines", d.medicines.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  return (
    <div className="space-y-4">
      <input
        value={d.condition}
        onChange={(e) => set("condition", e.target.value)}
        placeholder="What is it? e.g. Cold, Flu, Migraine"
        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
      />

      <div className="flex items-center gap-3">
        <span className="text-xs text-white/50">Severity</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => set("severity", n)}
              className="h-6 w-6 rounded-full text-xs"
              style={{
                background: n <= d.severity ? "#ef4444" : "rgba(255,255,255,0.08)",
                color: n <= d.severity ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-xs text-white/50">Symptoms</div>
        <div className="flex flex-wrap gap-1.5">
          {SYMPTOM_OPTIONS.map((s) => {
            const on = d.symptoms.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  on ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200" : "border-white/10 text-white/55 hover:bg-white/5"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-xs text-white/50">Medicines</div>
        <div className="space-y-2">
          {d.medicines.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={m.name}
                onChange={(e) => setMed(i, { name: e.target.value })}
                placeholder="Medicine"
                className="flex-1 rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
              />
              <input
                value={m.dose ?? ""}
                onChange={(e) => setMed(i, { dose: e.target.value })}
                placeholder="Dose / freq"
                className="w-28 rounded-lg border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => set("medicines", d.medicines.filter((_, idx) => idx !== i))}
                className="px-1 text-red-400/70 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => set("medicines", [...d.medicines, { name: "", dose: "" }])}
            className="text-xs text-white/45 hover:text-white/70"
          >
            ＋ Add medicine
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-xs text-white/50">
          Started
          <input
            type="date"
            value={d.started_on}
            max={today()}
            onChange={(e) => set("started_on", e.target.value)}
            className="ml-2 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm text-white outline-none focus:border-cyan-400"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-white/50">
          <input
            type="checkbox"
            checked={!!d.ended_on}
            onChange={(e) => set("ended_on", e.target.checked ? today() : null)}
            className="accent-emerald-400"
          />
          Recovered
        </label>
        {d.ended_on && (
          <input
            type="date"
            value={d.ended_on}
            min={d.started_on}
            max={today()}
            onChange={(e) => set("ended_on", e.target.value)}
            className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-sm text-white outline-none focus:border-cyan-400"
          />
        )}
      </div>

      <textarea
        value={d.notes ?? ""}
        onChange={(e) => set("notes", e.target.value || null)}
        placeholder="Notes — how you're feeling, what the doctor said…"
        rows={2}
        className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-cyan-400"
      />

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white">
          Cancel
        </button>
        <button
          onClick={() => onSave(d)}
          disabled={!d.condition.trim()}
          className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-black hover:scale-105 disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}
