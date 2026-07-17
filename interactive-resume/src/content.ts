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
  phone: "+91 77354 06476",
  summary:
    "DevOps engineer with 3 years across platform engineering, DevOps and site reliability, currently at A.P. Moller — Maersk owning 50+ production backend services on Kubernetes. I turn operational toil into automation: GitOps-driven CI/CD, Infrastructure-as-Code, DevSecOps and SLI/SLO-driven observability — plus Azure FinOps cost optimization — that keep services fast, secure, visible and reliable.",
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/shubhranshu-pattanaik-12ty/" },
    { label: "GitHub", href: "https://github.com/opticalD" },
    { label: "Résumé (PDF)", href: "/Shubhranshu_Pattanaik_Resume.pdf" },
  ],
};

/** Headline numbers — the strongest signal for an SRE/DevOps story. */
export interface Metric {
  value: string;
  label: string;
  accent: string;
}

export const metrics: Metric[] = [
  { value: "50+", label: "Production services owned on Kubernetes", accent: "#06b6d4" },
  { value: "99.9%", label: "Deployment success rate", accent: "#22c55e" },
  { value: "−35%", label: "Mean Time to Resolution (MTTR)", accent: "#a855f7" },
  { value: "+50%", label: "Deployment & setup efficiency", accent: "#f59e0b" },
];

export interface Experience {
  company: string;
  title: string;
  period: string;
  location: string;
  accent: string;
  bullets: string[];
}

export const experience: Experience[] = [
  {
    company: "A.P. Moller — Maersk",
    title: "Software Engineer — DevOps / SRE (Backend Platforms & Reliability)",
    period: "Jul 2024 – Present",
    location: "Bengaluru, India",
    accent: "#06b6d4",
    bullets: [
      "Own and operate 50+ production backend services across 10+ Kubernetes clusters and Linux systems — deployments, scaling, pod-level debugging, config management and live incident resolution.",
      "Design zero-downtime CI/CD pipelines with GitHub Actions and YAML workflows, enforcing SonarQube quality gates and GitOps principles — sustaining a 99.9% deployment success rate.",
      "Provision environment-specific infrastructure with Terraform & Ansible (IaC) and automate deployment workflows, cutting setup time and improving deployment efficiency by 50%.",
      "Secure the software supply chain with DevSecOps: Trivy image scanning across Harbor & GHCR registries, plus HashiCorp Vault for container secrets management.",
      "Define and monitor strict SLIs/SLOs and build dashboards & alerting with Prometheus, Grafana and Loki, increasing visibility and reducing incident response time.",
      "Lead on-call rotations resolving production-critical incidents, improving Mean Time to Resolution (MTTR) by 35%.",
      "Drive Azure FinOps cost optimization — analysing utilization metrics (RAM, I/O, throughput) to rightsize and decommission resources.",
      "Maintain Oracle PL/SQL and SQL Server scripts & stored procedures for database provisioning across multiple projects.",
      "Partner with app teams on release management and post-incident reviews, embedding reliability early — contributing to a 25% drop in post-release incidents.",
    ],
  },
];

export interface SkillGroup {
  label: string;
  emoji: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  { label: "Languages", emoji: "💬", items: ["Python", "Java", "SQL", "Bash / Shell"] },
  { label: "Cloud", emoji: "☁️", items: ["AWS", "Microsoft Azure"] },
  { label: "Containers & Orchestration", emoji: "📦", items: ["Kubernetes", "Docker", "Helm"] },
  { label: "Infrastructure as Code", emoji: "🏗️", items: ["Terraform", "Ansible"] },
  {
    label: "CI/CD & GitOps",
    emoji: "🔁",
    items: ["GitHub Actions", "Jenkins", "GitOps", "YAML Pipelines", "SonarQube"],
  },
  {
    label: "Observability & SRE",
    emoji: "📈",
    items: ["Prometheus", "Grafana", "Loki", "Alertmanager", "SLI/SLO", "On-call"],
  },
  {
    label: "Security & DevSecOps",
    emoji: "🔐",
    items: ["Trivy", "HashiCorp Vault", "Harbor", "GHCR"],
  },
  {
    label: "FinOps",
    emoji: "💰",
    items: ["Azure rightsizing", "Cost governance", "Decommissioning"],
  },
  { label: "Databases", emoji: "🗄️", items: ["PostgreSQL", "MySQL", "SQL Server", "Oracle PL/SQL"] },
  { label: "Foundations", emoji: "🧠", items: ["Linux", "DSA", "OOP", "Operating Systems"] },
];

export interface Chapter {
  year: string;
  title: string;
  body: string;
  emoji: string;
  accent: string;
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
    body: "Went deep on cloud infrastructure and Infrastructure-as-Code — earned AZ-900 (Azure Fundamentals) and started automating everything I could with Terraform, Ansible and Bash.",
    emoji: "☁️",
    accent: "#06b6d4",
  },
  {
    year: "2024",
    title: "Joined A.P. Moller — Maersk",
    body: "Graduated and joined Maersk as a Software Engineer in DevOps/SRE — taking end-to-end ownership of production backend platforms and the pipelines that ship them.",
    emoji: "🚢",
    accent: "#a855f7",
  },
  {
    year: "Now",
    title: "Reliability at scale",
    body: "Operating 50+ production services across 10+ Kubernetes clusters, running zero-downtime GitOps CI/CD at a 99.9% success rate, securing the supply chain with DevSecOps, and cutting MTTR by 35%. Recognised with a Spot Award for backend platform reliability.",
    emoji: "⚡",
    accent: "#f59e0b",
  },
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
    blurb: "GitOps-driven pipelines (GitHub Actions + YAML) with SonarQube quality gates, sustaining a 99.9% deployment success rate.",
    tags: ["GitHub Actions", "GitOps", "SonarQube"],
    href: "#",
  },
  {
    name: "Infrastructure as Code",
    blurb: "Environment-specific infrastructure with Terraform & Ansible, cutting environment setup time by 50%.",
    tags: ["Terraform", "Ansible", "AWS / Azure"],
    href: "#",
  },
  {
    name: "Observability & SLOs",
    blurb: "SLI/SLO-driven dashboards and alerting with Prometheus, Grafana & Loki — plus on-call rotations that cut MTTR by 35%.",
    tags: ["Prometheus", "Grafana", "SLI/SLO"],
    href: "#",
  },
  {
    name: "DevSecOps supply chain",
    blurb: "Trivy image scanning across Harbor & GHCR and HashiCorp Vault secrets management, hardening containerized deployments.",
    tags: ["Trivy", "Vault", "Harbor / GHCR"],
    href: "#",
  },
  {
    name: "Azure FinOps",
    blurb: "Cost optimization from real utilization metrics (RAM, I/O, throughput) — rightsizing and decommissioning Azure resources.",
    tags: ["Azure", "FinOps", "Cost governance"],
    href: "#",
  },
];

export interface Education {
  degree: string;
  school: string;
  period: string;
  location: string;
}

export const education: Education = {
  degree: "B.Tech, Computer Science & Engineering",
  school: "Siksha 'O' Anusandhan (SOA) University",
  period: "Jul 2020 – Jun 2024",
  location: "Bhubaneswar, India",
};

export const certifications: string[] = ["AZ-900 — Microsoft Azure Fundamentals"];

export const achievements: string[] = [
  "Spot Award at A.P. Moller — Maersk for outstanding contributions to backend platform reliability & DevOps engineering.",
];
