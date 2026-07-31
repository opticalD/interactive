import { motion } from "framer-motion";
import type { Item } from "../lib/feed";
import { relativeTime } from "../lib/feed";
import { SOURCE_BY_ID } from "../sources";

type Props = {
  item: Item;
  read: boolean;
  saved: boolean;
  isNew: boolean;
  onRead: (id: string) => void;
  onSave: (id: string) => void;
};

export function ItemCard({ item, read, saved, isNew, onRead, onSave }: Props) {
  const source = SOURCE_BY_ID.get(item.sourceId);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: read ? 0.45 : 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="group relative rounded-xl border border-white/8 bg-white/[0.03] p-4 transition-colors hover:border-white/16 hover:bg-white/[0.055]"
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-white/45">
        <span className="inline-flex items-center gap-1.5 font-medium text-white/70">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: source?.hue ?? "#94a3b8" }}
          />
          {source?.name ?? item.sourceId}
        </span>
        <span aria-hidden>·</span>
        <time dateTime={new Date(item.published).toISOString()}>
          {relativeTime(item.published)}
        </time>
        {isNew && !read && (
          <span className="rounded-full bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-300">
            NEW
          </span>
        )}
        {read && <span className="text-white/35">read</span>}
      </div>

      <h3 className="font-display text-[17px] leading-snug text-white/95">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onRead(item.id)}
          className="hover:underline decoration-white/30 underline-offset-4"
        >
          {item.title}
        </a>
      </h3>

      {item.summary && (
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/55">
          {item.summary}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-[11px]">
        {item.discussUrl && (
          // On the aggregators the thread is usually the better read, so it gets
          // equal billing with the article itself.
          <a
            href={item.discussUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onRead(item.id)}
            style={{ color: source?.hue ?? "#cbd5e1" }}
            className="rounded-md bg-white/6 px-2 py-1 font-medium transition-colors hover:bg-white/12"
          >
            {typeof item.comments === "number"
              ? `${item.comments} ${item.comments === 1 ? "comment" : "comments"}`
              : "Discuss"}
            {typeof item.points === "number" && (
              <span className="ml-1.5 opacity-60">▲ {item.points}</span>
            )}
          </a>
        )}

        <button
          type="button"
          onClick={() => onSave(item.id)}
          aria-pressed={saved}
          className={`rounded-md px-2 py-1 font-medium transition-colors ${
            saved
              ? "bg-amber-400/15 text-amber-300"
              : "text-white/40 hover:bg-white/8 hover:text-white/70"
          }`}
        >
          {saved ? "★ Saved" : "☆ Save"}
        </button>

        <button
          type="button"
          onClick={() => onRead(item.id)}
          className="ml-auto text-white/30 opacity-0 transition-opacity hover:text-white/70 focus-visible:opacity-100 group-hover:opacity-100"
        >
          {read ? "" : "mark read"}
        </button>
      </div>
    </motion.article>
  );
}
