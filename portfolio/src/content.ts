export const profile = {
  name: "Shubhranshu Pattanaik",
  tagline: "DevOps engineer who builds pretty, interactive side-projects",
  intro: "A collection of things I built to learn, tinker, and have fun.",
  location: "Bengaluru, India",
  email: "shubpatt@gmail.com",
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/shubhranshu-pattanaik-12ty/" },
    { label: "GitHub", href: "https://github.com/opticalD" },
    { label: "Résumé site", href: "https://my-story-resume.netlify.app" },
  ],
};

export interface Project {
  slug: string;
  emoji: string;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  tags: string[];
  accent: string; // primary
  accent2: string; // secondary, for gradient
  live?: string;
  github: string;
  kind: "web" | "ios";
}

export const projects: Project[] = [
  {
    slug: "bloom",
    emoji: "🌸",
    name: "Bloom",
    tagline: "Science-backed mood, habit & wellness tracker",
    description:
      "A multi-user mood and habit tracker built on a real psychology model — the valence–arousal circumplex — instead of a simple 1–5 scale. Every sensitive entry is end-to-end encrypted, so not even the account owner can read it.",
    highlights: [
      "Valence–arousal mood pad + customizable factors, habits & tags",
      "End-to-end encryption (envelope + recovery key) — admin can't read entries",
      "Correlations & insights: what actually lifts or drags your mood",
      "Supplements/skincare routine, illness log, and an opt-in cycle tracker",
    ],
    tags: ["React", "TypeScript", "Supabase", "Web Crypto", "Framer Motion"],
    accent: "#22d3ee",
    accent2: "#a78bfa",
    live: "https://bloom-habit-tracker.netlify.app",
    github: "https://github.com/opticalD/bloom-mood-tracker",
    kind: "web",
  },
  {
    slug: "bloom-ios",
    emoji: "📱",
    name: "Bloom — iOS",
    tagline: "The native iOS shell for Bloom",
    description:
      "A real, installable iOS app for Bloom, built with Capacitor around the same web app — so it reuses the exact working code and encryption with zero data-compatibility risk.",
    highlights: [
      "Native WKWebView shell — same account, same encrypted data as the web app",
      "Custom app icon & dark launch splash",
      "Runs on-device via Xcode; ready for TestFlight/App Store",
    ],
    tags: ["Capacitor", "Xcode", "Swift toolchain"],
    accent: "#f0abfc",
    accent2: "#22d3ee",
    github: "https://github.com/opticalD/bloom-ios",
    kind: "ios",
  },
  {
    slug: "pulse",
    emoji: "🎧",
    name: "Pulse",
    tagline: "A music visualizer that reacts to real audio",
    description:
      "A Web-Audio-powered visualizer — radial spectrum bars and bass-reactive particles — driven by a local file, your microphone, shared tab audio, or an embedded YouTube video.",
    highlights: [
      "Real-time FFT analysis → animated canvas spectrum + particles",
      "Four sound sources: file, mic, tab/system-audio share, YouTube embed",
      "No fake visuals — everything reacts to genuine captured audio",
    ],
    tags: ["Web Audio API", "Canvas", "React"],
    accent: "#22d3ee",
    accent2: "#e879f9",
    live: "https://pulse-music-visualizer.netlify.app",
    github: "https://github.com/opticalD/pulse-music-visualizer",
    kind: "web",
  },
  {
    slug: "my-story",
    emoji: "✨",
    name: "My Story",
    tagline: "A scroll-driven interactive résumé",
    description:
      "My résumé, reimagined as a narrative — a parallax hero, an animated career timeline, and a categorized toolbox, all driven from a single content file.",
    highlights: [
      "Parallax hero + scroll-progress bar",
      "Animated experience timeline and skills grid",
      "Fully data-driven — content and code are cleanly separated",
    ],
    tags: ["React", "Framer Motion", "Tailwind CSS"],
    accent: "#22d3ee",
    accent2: "#fbbf24",
    live: "https://my-story-resume.netlify.app",
    github: "https://github.com/opticalD/my-story-resume",
    kind: "web",
  },
  {
    slug: "ascend",
    emoji: "🧗",
    name: "Ascend",
    tagline: "An interactive DevOps/SRE learning roadmap",
    description:
      "A personal curriculum tracker covering 48 topics across 10 tracks — certifications, Kubernetes, GitOps, observability and more — so I can mark what I've learned and flag what I'm stuck on.",
    highlights: [
      "Mark each topic To-do / Learning / Need help / Done, with notes",
      "Per-track and overall progress, search, and status filters",
      "Local-first with JSON export/import for backups",
    ],
    tags: ["React", "Framer Motion", "localStorage"],
    accent: "#34d399",
    accent2: "#22d3ee",
    live: "https://ascend-devops-roadmap.netlify.app",
    github: "https://github.com/opticalD/ascend-devops-roadmap",
    kind: "web",
  },
];
