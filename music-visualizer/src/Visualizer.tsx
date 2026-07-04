import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  hue: number;
}

/**
 * Renders a radial frequency spectrum with a pulsing core and
 * bass-triggered particle bursts. Reads live FFT data from the AnalyserNode.
 */
export function Visualizer({ analyser, playing }: { analyser: AnalyserNode | null; playing: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const freq = analyser ? new Uint8Array(analyser.frequencyBinCount) : new Uint8Array(1024);
    let rotation = 0;

    const render = () => {
      rafRef.current = requestAnimationFrame(render);

      // trailing fade instead of full clear -> motion blur
      ctx.fillStyle = "rgba(5,5,10,0.22)";
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      if (analyser) analyser.getByteFrequencyData(freq);

      // bass energy from the lowest bins
      let bass = 0;
      for (let i = 0; i < 24; i++) bass += freq[i];
      bass /= 24 * 255; // 0..1

      const baseRadius = Math.min(w, h) * 0.16 + bass * 60;

      // pulsing core
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
      coreGrad.addColorStop(0, `hsla(${190 + bass * 80}, 90%, 65%, ${0.6 + bass * 0.4})`);
      coreGrad.addColorStop(1, "rgba(5,5,10,0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      // radial spectrum bars
      const bars = 128;
      rotation += 0.0015 + bass * 0.02;
      for (let i = 0; i < bars; i++) {
        const v = freq[Math.floor((i / bars) * (freq.length * 0.6))] / 255;
        const angle = (i / bars) * Math.PI * 2 + rotation;
        const len = 8 + v * Math.min(w, h) * 0.28;
        const r1 = baseRadius + 6;
        const r2 = r1 + len;
        const hue = 190 + (i / bars) * 160 + bass * 40;
        ctx.strokeStyle = `hsla(${hue}, 85%, ${45 + v * 30}%, ${0.35 + v * 0.65})`;
        ctx.lineWidth = 2 + v * 3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
        ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
        ctx.stroke();
      }

      // spawn particles on strong bass hits
      if (bass > 0.55 && particles.current.length < 400) {
        const count = Math.floor(bass * 10);
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const speed = 1.5 + bass * 5;
          particles.current.push({
            x: cx + Math.cos(a) * baseRadius,
            y: cy + Math.sin(a) * baseRadius,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            life: 1,
            hue: 190 + Math.random() * 160,
          });
        }
      }

      // update + draw particles
      particles.current = particles.current.filter((p) => p.life > 0);
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life -= 0.012;
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2 * p.life + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ opacity: playing || analyser ? 1 : 0.5, transition: "opacity 0.6s" }}
    />
  );
}
