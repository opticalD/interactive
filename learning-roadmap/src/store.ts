import { useCallback, useEffect, useState } from "react";

export type Status = "todo" | "learning" | "help" | "done";

export interface ItemState {
  status: Status;
  note?: string;
}

export type Progress = Record<string, ItemState>;

const KEY = "ascend.progress.v1";

export const STATUS_META: Record<
  Status,
  { label: string; short: string; color: string; icon: string }
> = {
  todo: { label: "To-do", short: "To-do", color: "#64748b", icon: "○" },
  learning: { label: "Learning", short: "Learning", color: "#06b6d4", icon: "◐" },
  help: { label: "Need help", short: "Help", color: "#f59e0b", icon: "?" },
  done: { label: "Done", short: "Done", color: "#22c55e", icon: "✓" },
};

export const STATUS_ORDER: Status[] = ["todo", "learning", "help", "done"];

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    /* ignore */
  }
  return {};
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(progress));
  }, [progress]);

  const statusOf = useCallback(
    (id: string): Status => progress[id]?.status ?? "todo",
    [progress]
  );

  const setStatus = useCallback((id: string, status: Status) => {
    setProgress((p) => ({ ...p, [id]: { ...p[id], status } }));
  }, []);

  const setNote = useCallback((id: string, note: string) => {
    setProgress((p) => ({ ...p, [id]: { ...p[id], status: p[id]?.status ?? "todo", note } }));
  }, []);

  const reset = useCallback(() => {
    if (confirm("Reset all progress? This clears every status and note.")) setProgress({});
  }, []);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ascend-roadmap-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [progress]);

  const importJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setProgress(JSON.parse(String(reader.result)) as Progress);
      } catch {
        alert("That file couldn't be read as valid progress JSON.");
      }
    };
    reader.readAsText(file);
  }, []);

  return { progress, statusOf, setStatus, setNote, reset, exportJson, importJson };
}
