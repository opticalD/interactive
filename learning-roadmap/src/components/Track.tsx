import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { StatusControl } from "./StatusControl";
import { STATUS_META, type Status } from "../store";
import type { Item, Track as TrackType } from "../roadmap";

const LEVEL_TINT: Record<Item["level"], string> = {
  core: "#22c55e",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
};

interface Props {
  track: TrackType;
  statusOf: (id: string) => Status;
  noteOf: (id: string) => string | undefined;
  onStatus: (id: string, s: Status) => void;
  onNote: (id: string, note: string) => void;
  filter: Status | "all";
  query: string;
  index: number;
}

export function Track({ track, statusOf, noteOf, onStatus, onNote, filter, query, index }: Props) {
  const [open, setOpen] = useState(true);

  const visibleItems = track.items.filter((it) => {
    const matchStatus = filter === "all" || statusOf(it.id) === filter;
    const q = query.trim().toLowerCase();
    const matchQuery = !q || it.title.toLowerCase().includes(q) || it.hint.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const done = track.items.filter((it) => statusOf(it.id) === "done").length;
  const pct = Math.round((done / track.items.length) * 100);

  if (visibleItems.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ background: `${track.color}1e` }}
        >
          {track.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white/90">{track.title}</h2>
            <span className="text-xs text-white/40">
              {done}/{track.items.length}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-white/45">{track.blurb}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: track.color }}
              animate={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 text-white/30">{open ? "▲" : "▼"}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-5 pb-5">
              {visibleItems.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  status={statusOf(it.id)}
                  note={noteOf(it.id)}
                  onStatus={(s) => onStatus(it.id, s)}
                  onNote={(n) => onNote(it.id, n)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function ItemRow({
  item,
  status,
  note,
  onStatus,
  onNote,
}: {
  item: Item;
  status: Status;
  note: string | undefined;
  onStatus: (s: Status) => void;
  onNote: (n: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const meta = STATUS_META[status];

  return (
    <div
      className="rounded-xl border px-4 py-3 transition-colors"
      style={{
        borderColor: status === "todo" ? "rgba(255,255,255,0.07)" : `${meta.color}55`,
        background: status === "todo" ? "rgba(255,255,255,0.02)" : `${meta.color}12`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/90">{item.title}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
              style={{ background: `${LEVEL_TINT[item.level]}22`, color: LEVEL_TINT[item.level] }}
            >
              {item.level}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-white/50">{item.hint}</p>
        </div>
        <StatusControl value={status} onChange={onStatus} />
      </div>

      <div className="mt-2 flex items-center gap-3 pl-0.5">
        <button
          onClick={() => setEditing((e) => !e)}
          className="text-[11px] text-white/40 transition-colors hover:text-white/70"
        >
          {note ? "✎ edit note" : "＋ add note"}
        </button>
        {note && !editing && <span className="truncate text-[11px] text-white/55">“{note}”</span>}
      </div>

      {editing && (
        <textarea
          autoFocus
          defaultValue={note}
          onBlur={(e) => {
            onNote(e.target.value);
            setEditing(false);
          }}
          placeholder="What do you need help with? Resources, questions, notes…"
          rows={2}
          className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/85 outline-none focus:border-cyan-400"
        />
      )}
    </div>
  );
}
