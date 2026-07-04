// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE to make the story yours. Everything the site
//  renders comes from here — no need to touch the components.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: "Your Name",
  tagline: "Software engineer · builder of delightful things",
  intro: "Scroll to walk through my story →",
  emoji: "👋",
  location: "Bengaluru, India",
  email: "you@example.com",
  links: [
    { label: "GitHub", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Résumé (PDF)", href: "#" },
  ],
};

export interface Chapter {
  year: string;
  title: string;
  body: string;
  emoji: string;
  accent: string; // hex
}

export const chapters: Chapter[] = [
  {
    year: "2019",
    title: "The first line of code",
    body: "Wrote my first 'Hello, World' and got hooked. Spent nights building tiny scripts that automated boring things.",
    emoji: "🌱",
    accent: "#22c55e",
  },
  {
    year: "2021",
    title: "Shipping for real users",
    body: "Joined my first team and shipped features that thousands of people actually used. Learned that code is 20% typing, 80% thinking.",
    emoji: "🚀",
    accent: "#06b6d4",
  },
  {
    year: "2023",
    title: "Going deep on the craft",
    body: "Fell in love with clean architecture, performance, and beautiful interfaces. Started mentoring and giving talks.",
    emoji: "⚙️",
    accent: "#a855f7",
  },
  {
    year: "2025",
    title: "Leading & building",
    body: "Now I design systems, lead projects end-to-end, and obsess over the details that make products feel alive.",
    emoji: "✨",
    accent: "#f59e0b",
  },
];

export const skills = [
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "PostgreSQL",
  "AWS",
  "Framer Motion",
  "Three.js",
  "Design systems",
  "System design",
];

export interface Project {
  name: string;
  blurb: string;
  tags: string[];
  href: string;
}

export const projects: Project[] = [
  {
    name: "Project Aurora",
    blurb: "A real-time collaboration canvas used by 10k+ teams.",
    tags: ["React", "WebSockets", "CRDT"],
    href: "#",
  },
  {
    name: "Nimbus CLI",
    blurb: "A developer tool that cut deploy times by 60%.",
    tags: ["Go", "DX", "OSS"],
    href: "#",
  },
  {
    name: "Palette",
    blurb: "An AI design assistant that generates accessible color systems.",
    tags: ["Python", "LLMs", "Design"],
    href: "#",
  },
];
