# Interactive · three modern web apps

A trio of pretty, interactive web apps built with **Vite + React + TypeScript + Tailwind v4 + Framer Motion**. Each is self-contained and runs with no API keys.

| App | Folder | Highlights |
|-----|--------|-----------|
| 🌸 **Bloom** — Habit & Mood tracker | [`habit-mood-tracker/`](habit-mood-tracker) | Mood heatmap, animated Recharts, streak confetti, localStorage persistence |
| 🎧 **Pulse** — Music visualizer | [`music-visualizer/`](music-visualizer) | Web Audio API FFT → radial spectrum + bass-reactive particles |
| ✨ **My Story** — Interactive resume | [`interactive-resume/`](interactive-resume) | Scroll-driven narrative, parallax hero, animated timeline |

## Run any app locally

```bash
cd habit-mood-tracker   # or music-visualizer / interactive-resume
npm install
npm run dev
```

Dev ports: Bloom `5171`, Pulse `5172`, My Story `5173`.

## Build

```bash
npm run build      # outputs static site to dist/
```

Each app is a static SPA and can be deployed to any static host (Netlify, Vercel, GitHub Pages).
