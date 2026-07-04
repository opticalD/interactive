import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioEngine {
  analyser: AnalyserNode | null;
  playing: boolean;
  trackName: string | null;
  duration: number;
  currentTime: number;
  loadFile: (file: File) => Promise<void>;
  toggle: () => void;
  seek: (t: number) => void;
}

/**
 * Wraps an <audio> element into the Web Audio graph:
 *   MediaElementSource -> AnalyserNode -> destination
 * The AnalyserNode gives us real-time FFT data for the visualizer.
 */
export function useAudio(): AudioEngine {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const srcRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [playing, setPlaying] = useState(false);
  const [trackName, setTrackName] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // lazily build the graph on first user gesture
  const ensureGraph = useCallback(() => {
    if (ctxRef.current) return;
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.82;
    const src = ctx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(ctx.destination);

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration || 0));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => setPlaying(false));

    audioRef.current = audio;
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    srcRef.current = src;
    setAnalyser(analyser);
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      ensureGraph();
      const audio = audioRef.current!;
      await ctxRef.current!.resume();
      audio.src = URL.createObjectURL(file);
      setTrackName(file.name.replace(/\.[^.]+$/, ""));
      await audio.play();
      setPlaying(true);
    },
    [ensureGraph]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    if (audio.paused) {
      ctxRef.current?.resume();
      audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, []);

  const seek = useCallback((t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      ctxRef.current?.close();
    };
  }, []);

  return {
    analyser,
    playing,
    trackName,
    duration,
    currentTime,
    loadFile,
    toggle,
    seek,
  };
}
