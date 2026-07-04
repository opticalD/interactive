import { STATUS_META, STATUS_ORDER, type Status } from "../store";

export function StatusControl({
  value,
  onChange,
}: {
  value: Status;
  onChange: (s: Status) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1 rounded-lg bg-black/30 p-1">
      {STATUS_ORDER.map((s) => {
        const meta = STATUS_META[s];
        const active = value === s;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            title={meta.label}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
            style={{
              background: active ? `${meta.color}22` : "transparent",
              color: active ? meta.color : "rgba(255,255,255,0.4)",
              boxShadow: active ? `inset 0 0 0 1px ${meta.color}66` : "none",
            }}
          >
            <span>{meta.icon}</span>
            <span className="hidden sm:inline">{meta.short}</span>
          </button>
        );
      })}
    </div>
  );
}
