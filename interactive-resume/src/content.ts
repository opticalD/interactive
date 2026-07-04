// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE to make the story yours. Everything the site
//  renders comes from here — no need to touch the components.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: "Shubhranshu Pattanaik",
  tagline: "DevOps · Site Reliability · Platform Engineering",
  intro: "Scroll to walk through my story →",
  emoji: "⚡",
  location: "Bengaluru, India",
  email: "shubpatt@gmail.com",
  links: [
    { label: "LinkedIn", href: "https://linkedin.com/in/shubhranshu-pattanaik" },
    { label: "GitHub", href: "#" }, // ← add your personal GitHub URL
    { label: "Résumé (PDF)", href: "#" }, // ← host the PDF and link it
  ],
};

/** Headline numbers — the strongest signal for an SRE/DevOps story. */
export interface Metric {
  value: string;
  label: string;
  accent: string;
}

export const metrics: Metric[] = [
  { value: "15+", label: "Production services owned on Kubernetes", accent: "#06b6d4" },
  { value: "99.9%", label: "Deployment success rate", accent: "#22c55e" },
  { value: "−35%", label: "Mean Time to Resolution (MTTR)", accent: "#a855f7" },
  { value: "+50%", label: "Deployment & setup efficiency", accent: "#f59e0b" },
];

export interface Chapter {
  year: string;
  title: string;
  body: string;
  emoji: string;
  accent: string; // hex
}

export const chapters: Chapter[] = [
  {
    year: "2020",
    title: "Foundations in Computer Science",
    body: "Started B.Tech in Computer Science & Engineering at SOA University. Fell for Linux, data structures & algorithms, and how systems actually run under the hood.",
    emoji: "🎓",
    accent: "#22c55e",
  },
  {
    year: "2023",
    title: "Into the cloud",
    body: "Went deep on cloud infrastructure and Infrastructure-as-Code — earned AZ-900 (Azure Fundamentals) and started automating everything I could with Terraform, Ansible, and Bash.",
    emoji: "☁️",
    accent: "#06b6d4",
  },
  {
    year: "2024",
    title: "Joined A.P. Moller Maersk",
    body: "Graduated and joined Maersk as a Software Engineer in DevOps/SRE — taking end-to-end ownership of production backend platforms and the pipelines that ship them.",
    emoji: "🚢",
    accent: "#a855f7",
  },
  {
    year: "Now",
    title: "Reliability at scale",
    body: "Operating 15+ production services across Kubernetes clusters, running zero-downtime GitOps CI/CD at a 99.9% success rate, and cutting MTTR by 35%. Recognised with a Spot Award for backend platform reliability.",
    emoji: "⚡",
    accent: "#f59e0b",
  },
];

export const skills = [
  "Kubernetes",
  "Docker",
  "Helm",
  "Terraform",
  "Ansible",
  "AWS",
  "Azure",
  "GitHub Actions",
  "GitOps",
  "Jenkins",
  "Prometheus",
  "Grafana",
  "Loki",
  "Alertmanager",
  "Python",
  "Bash",
  "Linux",
  "PostgreSQL",
];

export interface Project {
  name: string;
  blurb: string;
  tags: string[];
  href: string;
}

export const projects: Project[] = [
  {
    name: "Zero-downtime CI/CD",
    blurb: "Designed GitOps-driven pipelines for critical server-side apps, sustaining a 99.9% deployment success rate with zero downtime.",
    tags: ["GitHub Actions", "GitOps", "Release Mgmt"],
    href: "#",
  },
  {
    name: "Infrastructure as Code",
    blurb: "Provisioned environment-specific infrastructure with Terraform & Ansible, cutting environment setup time by 50%.",
    tags: ["Terraform", "Ansible", "AWS / Azure"],
    href: "#",
  },
  {
    name: "Observability & incident response",
    blurb: "Built dashboards and alerting with Prometheus, Grafana & Loki — improving system visibility and reducing MTTR by 35%.",
    tags: ["Prometheus", "Grafana", "Loki"],
    href: "#",
  },
];
