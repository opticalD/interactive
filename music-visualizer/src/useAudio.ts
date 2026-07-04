import { useCallback, useEffect, useRef, useState } from "react";

export type SourceMode = "idle" | "file" | "mic" | "tab";

export interface AudioEngine {
  analyser: AnalyserNode | null;
  mode: SourceMode;
  playing: boolean;
  trackName: string | null;
  duration: number;
  currentTime: number;
  error: string | null;
  loadFile: (file: File) => Promise<void>;
  startMic: () => Promise<void>;
  startTabAudio: (preferCurrentTab?: boolean) => Promise<void>;
  toggle: () => void;
  seek: (t: number) => void;
  stop: () => void;
}

/**
 * A shared Web Audio graph with a swappable source:
 *   <audio> file  ─┐
 *   microphone     ├─> AnalyserNode ──(file only)──> destination
 *   tab / system  ─┘
 *
 * The AnalyserNode is the FFT tap the visualizer reads. We deliberately do NOT
 * route mic/tab audio back to the speakers (the tab already plays its own sound,
 * and the mic would feed back), so only file playback is connected to output.
 */
export function useAudio(): AudioEngine {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [mode, setMode] = useState<SourceMode>("idle");
  const [playing, setPlaying] = useState(false);
  const [trackName, setTrackName] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      an.smoothingTimeConstant = 0.82;
      ctxRef.current = ctx;
      analyserRef.current = an;
      setAnalyser(an);
    }
    return { ctx: ctxRef.current!, an: analyserRef.current! };
  }, []);

  /** Tear down whatever source is currently feeding the analyser. */
  const teardownSource = useCallback(() => {
    try {
      sourceRef.current?.disconnect();
    } catch {
      /* noop */
    }
    sourceRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlaying(false);
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      setError(null);
      const { ctx, an } = ensureCtx();
      teardownSource();
      await ctx.resume();

      if (!audioRef.current) {
        const audio = new Audio();
        audio.addEventListener("loadedmetadata", () => setDuration(audio.duration || 0));
        audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
        audio.addEventListener("ended", () => setPlaying(false));
        audioRef.current = audio;
      }
      const audio = audioRef.current;
      audio.src = URL.createObjectURL(file);

      // MediaElementSource can only be created once per element; reuse it.
      let src = (audio as unknown as { _node?: MediaElementAudioSourceNode })._node;
      if (!src) {
        src = ctx.createMediaElementSource(audio);
        (audio as unknown as { _node?: MediaElementAudioSourceNode })._node = src;
      }
      src.connect(an);
      src.connect(ctx.destination); // hear the file
      sourceRef.current = src;

      setTrackName(file.name.replace(/\.[^.]+$/, ""));
      setMode("file");
      await audio.play();
      setPlaying(true);
    },
    [ensureCtx, teardownSource]
  );

  const startMic = useCallback(async () => {
    setError(null);
    try {
      const { ctx, an } = ensureCtx();
      teardownSource();
      await ctx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(an); // analyser only — no output, avoids feedback
      sourceRef.current = src;
      setTrackName("Microphone");
      setMode("mic");
      setPlaying(true);
    } catch {
      setError("Microphone access was blocked. Check the browser permission and try again.");
    }
  }, [ensureCtx, teardownSource]);

  const startTabAudio = useCallback(
    async (preferCurrentTab = false) => {
      setError(null);
      try {
        const { ctx, an } = ensureCtx();
        teardownSource();
        await ctx.resume();
        // video:true is required by Chrome to expose a tab, but we only keep audio.
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
          // @ts-expect-error non-standard but supported in Chromium
          preferCurrentTab,
        });
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          stream.getTracks().forEach((t) => t.stop());
          setError(
            'No audio was shared. Re-try and tick "Share tab audio" (or "Share system audio") in the picker.'
          );
          return;
        }
        stream.getVideoTracks().forEach((t) => t.stop()); // drop video, keep audio
        streamRef.current = stream;
        audioTracks[0].addEventListener("ended", () => {
          teardownSource();
          setMode("idle");
          setTrackName(null);
        });
        const src = ctx.createMediaStreamSource(new MediaStream(audioTracks));
        src.connect(an);
        sourceRef.current = src;
        setTrackName("Tab / system audio");
        setMode("tab");
        setPlaying(true);
      } catch {
        setError("Screen/tab audio sharing was cancelled or blocked.");
      }
    },
    [ensureCtx, teardownSource]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (mode !== "file" || !audio || !audio.src) return;
    if (audio.paused) {
      ctxRef.current?.resume();
      audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, [mode]);

  const seek = useCallback((t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
  }, []);

  const stop = useCallback(() => {
    teardownSource();
    setMode("idle");
    setTrackName(null);
  }, [teardownSource]);

  useEffect(() => {
    return () => {
      teardownSource();
      ctxRef.current?.close();
    };
  }, [teardownSource]);

  return {
    analyser,
    mode,
    playing,
    trackName,
    duration,
    currentTime,
    error,
    loadFile,
    startMic,
    startTabAudio,
    toggle,
    seek,
    stop,
  };
}

/** Extract a YouTube video id from common URL shapes. */
export function parseYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
