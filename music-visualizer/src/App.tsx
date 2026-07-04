import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { parseYouTubeId, useAudio } from "./useAudio";
import { Visualizer } from "./Visualizer";

function fmt(t: number) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function App() {
  const audio = useAudio();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [ytId, setYtId] = useState<string | null>(null);

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith("audio")) audio.loadFile(file);
  };

  const openLink = () => {
    const id = parseYouTubeId(url);
    if (id) {
      setYtId(id);
      // capture THIS tab's audio so the embedded video drives the visualizer
      audio.startTabAudio(true);
    } else if (/open\.spotify\.com|spotify:/.test(url)) {
      window.open(url, "_blank");
      audio.startTabAudio(false); // user picks the Spotify tab
    } else {
      window.open(url, "_blank");
      audio.startTabAudio(false);
    }
    setUrlOpen(false);
  };

  const idle = audio.mode === "idle";

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onFiles(e.dataTransfer.files);
      }}
    >
      <Visualizer analyser={audio.analyser} playing={audio.playing} />

      {/* Title */}
      <div className="pointer-events-none absolute left-0 top-0 p-8">
        <h1 className="bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          Pulse
        </h1>
        <p className="mt-1 text-sm text-white/40">a web-audio music visualizer</p>
      </div>

      {/* Embedded YouTube player (audio captured via tab share) */}
      <AnimatePresence>
        {ytId && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute right-6 top-6 z-20 overflow-hidden rounded-xl border border-white/15 shadow-2xl"
          >
            <iframe
              width="280"
              height="158"
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
              title="YouTube player"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      <AnimatePresence>
        {idle && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute left-1/2 top-1/2 w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-dashed p-8 text-center backdrop-blur transition-colors ${
              dragging ? "border-cyan-400 bg-cyan-400/10" : "border-white/15 bg-white/[0.02]"
            }`}
          >
            <div className="text-5xl">🎧</div>
            <div className="mt-4 text-lg font-medium text-white/85">Pick a sound source</div>
            <p className="mx-auto mt-1 max-w-sm text-xs text-white/40">
              Drop an audio file, use your mic, or share a tab playing YouTube / Spotify — Pulse
              visualizes the real audio.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SourceButton icon="📁" label="Audio file" onClick={() => inputRef.current?.click()} />
              <SourceButton icon="🎤" label="Microphone" onClick={audio.startMic} />
              <SourceButton
                icon="🖥️"
                label="Share a tab"
                sub="YouTube / Spotify"
                onClick={() => audio.startTabAudio(false)}
              />
              <SourceButton icon="▶️" label="YouTube link" onClick={() => setUrlOpen(true)} />
            </div>

            {audio.error && (
              <p className="mt-5 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {audio.error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* YouTube URL prompt */}
      <AnimatePresence>
        {urlOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setUrlOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[min(480px,92vw)] rounded-2xl border border-white/10 bg-[#12121c] p-6"
            >
              <h3 className="text-lg font-medium text-white/90">Paste a YouTube link</h3>
              <p className="mt-1 text-xs text-white/50">
                It plays here and Pulse captures this tab's audio to react in real time. Your browser
                will ask you to confirm sharing — keep “tab audio” ticked.
              </p>
              <input
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && openLink()}
                placeholder="https://www.youtube.com/watch?v=…"
                className="mt-4 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setUrlOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={openLink}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:scale-105"
                >
                  Visualize
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transport / status bar */}
      <AnimatePresence>
        {!idle && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute bottom-0 left-1/2 w-[min(680px,92vw)] -translate-x-1/2 rounded-t-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              {audio.mode === "file" ? (
                <button
                  onClick={audio.toggle}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
                >
                  {audio.playing ? "❚❚" : "▶"}
                </button>
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-400" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white/90">
                  {audio.trackName}
                  {audio.mode !== "file" && (
                    <span className="ml-2 text-xs text-cyan-300/70">● live</span>
                  )}
                </div>
                {audio.mode === "file" ? (
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
                    <span>{fmt(audio.currentTime)}</span>
                    <input
                      type="range"
                      min={0}
                      max={audio.duration || 0}
                      step={0.1}
                      value={audio.currentTime}
                      onChange={(e) => audio.seek(Number(e.target.value))}
                      className="h-1 flex-1 cursor-pointer accent-cyan-400"
                    />
                    <span>{fmt(audio.duration)}</span>
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-white/40">
                    Reacting to live audio — adjust volume at the source.
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  audio.stop();
                  setYtId(null);
                }}
                className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                Change source
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}

function SourceButton({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: string;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-cyan-400/50 hover:bg-cyan-400/5"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-white/85">{label}</span>
      {sub && <span className="text-[10px] text-white/40">{sub}</span>}
    </motion.button>
  );
}
