import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAudio } from "./useAudio";
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

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith("audio")) audio.loadFile(file);
  };

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

      {/* Empty state / dropzone */}
      <AnimatePresence>
        {!audio.trackName && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => inputRef.current?.click()}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-dashed px-12 py-10 text-center backdrop-blur transition-colors ${
              dragging ? "border-cyan-400 bg-cyan-400/10" : "border-white/15 bg-white/[0.02]"
            }`}
          >
            <div className="text-5xl">🎧</div>
            <div className="mt-4 text-lg font-medium text-white/85">Drop an audio file</div>
            <div className="mt-1 text-sm text-white/40">or click to browse · mp3, wav, flac…</div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Transport controls */}
      <AnimatePresence>
        {audio.trackName && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute bottom-0 left-1/2 w-[min(680px,90vw)] -translate-x-1/2 rounded-t-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center gap-4">
              <button
                onClick={audio.toggle}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
              >
                {audio.playing ? "❚❚" : "▶"}
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white/90">{audio.trackName}</div>
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
              </div>
              <button
                onClick={() => inputRef.current?.click()}
                className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                Change track
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
