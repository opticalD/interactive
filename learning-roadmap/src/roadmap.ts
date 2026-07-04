// Curated DevOps / SRE learning roadmap. Item ids are stable slugs so your
// saved progress survives reordering. Edit freely — the UI is data-driven.

export interface Item {
  id: string;
  title: string;
  hint: string;
  level: "core" | "intermediate" | "advanced";
}

export interface Track {
  id: string;
  title: string;
  emoji: string;
  color: string;
  blurb: string;
  items: Item[];
}

export const ROADMAP: Track[] = [
  {
    id: "sre-foundations",
    title: "SRE Foundations",
    emoji: "🧭",
    color: "#22c55e",
    blurb: "Free, do first. This is the language reliability engineers speak — it reframes your whole resume.",
    items: [
      { id: "sre-book", title: "Read the Google SRE Book", hint: "Free online. The canonical text — chapters on SLOs, toil, on-call.", level: "core" },
      { id: "sli-slo", title: "SLIs, SLOs & error budgets", hint: "Define what 'reliable' means numerically and budget for failure.", level: "core" },
      { id: "toil", title: "Toil & its elimination", hint: "Measure manual, repetitive work; automate it away.", level: "core" },
      { id: "postmortems", title: "Blameless postmortems", hint: "Learn to write incident retros that fix systems, not blame people.", level: "core" },
      { id: "oncall", title: "On-call, runbooks & alerting hygiene", hint: "Actionable alerts, escalation, sustainable rotations.", level: "core" },
      { id: "capacity", title: "Capacity planning & load", hint: "Forecast demand; avoid over/under-provisioning.", level: "intermediate" },
    ],
  },
  {
    id: "certs",
    title: "Certifications",
    emoji: "📜",
    color: "#06b6d4",
    blurb: "Highest ROI for getting shortlisted. Do roughly in this order.",
    items: [
      { id: "cka", title: "CKA — Certified Kubernetes Administrator", hint: "THE credential for your role. Hands-on exam; you run K8s already.", level: "core" },
      { id: "terraform-assoc", title: "HashiCorp Terraform Associate", hint: "Fast, cheap, proves your IaC depth.", level: "core" },
      { id: "aws-saa", title: "AWS Solutions Architect / SysOps Associate", hint: "You list AWS but have no AWS cert — close that gap.", level: "intermediate" },
      { id: "az-104", title: "AZ-104 / AZ-400 (Azure)", hint: "Step up from AZ-900 toward Azure administration & DevOps.", level: "intermediate" },
      { id: "cks", title: "CKS — Certified Kubernetes Security", hint: "Advanced differentiator once CKA is done.", level: "advanced" },
    ],
  },
  {
    id: "kubernetes",
    title: "Kubernetes, deeper",
    emoji: "☸️",
    color: "#3b82f6",
    blurb: "Go beyond deploy/scale into the internals that separate operators from users.",
    items: [
      { id: "helm-kustomize", title: "Helm & Kustomize", hint: "Templating and overlay-based config management.", level: "core" },
      { id: "hpa-vpa", title: "Autoscaling — HPA, VPA, Cluster Autoscaler", hint: "Scale pods and nodes on real signals.", level: "intermediate" },
      { id: "ingress-gateway", title: "Ingress & Gateway API", hint: "Modern north-south traffic routing.", level: "intermediate" },
      { id: "operators", title: "Operators & CRDs", hint: "Extend K8s with custom controllers (great with Go).", level: "advanced" },
      { id: "service-mesh", title: "Service mesh — Istio / Linkerd", hint: "mTLS, traffic shaping, observability at the mesh layer.", level: "advanced" },
    ],
  },
  {
    id: "cicd-gitops",
    title: "CI/CD & GitOps",
    emoji: "🔁",
    color: "#a855f7",
    blurb: "You do GitOps — now name the tools and master progressive delivery.",
    items: [
      { id: "argocd", title: "ArgoCD (or Flux)", hint: "Declarative GitOps CD — the tool behind 'GitOps' on your resume.", level: "core" },
      { id: "gha-advanced", title: "Advanced GitHub Actions", hint: "Reusable workflows, matrix builds, OIDC to cloud, caching.", level: "intermediate" },
      { id: "progressive-delivery", title: "Progressive delivery", hint: "Canary & blue-green with Argo Rollouts / Flagger.", level: "intermediate" },
      { id: "pipeline-security", title: "Pipeline security (SAST/DAST/SCA)", hint: "Shift security left in CI.", level: "advanced" },
    ],
  },
  {
    id: "observability",
    title: "Observability",
    emoji: "📈",
    color: "#f59e0b",
    blurb: "You have Prometheus/Grafana — add tracing and make SLOs visible.",
    items: [
      { id: "prom-advanced", title: "Prometheus deep — PromQL, recording & alert rules", hint: "Author your own SLO-based alerts.", level: "core" },
      { id: "otel", title: "OpenTelemetry", hint: "Vendor-neutral metrics, logs & traces instrumentation.", level: "intermediate" },
      { id: "tracing", title: "Distributed tracing — Jaeger / Tempo", hint: "Follow a request across services.", level: "intermediate" },
      { id: "slo-dashboards", title: "SLO dashboards & error-budget burn", hint: "Grafana panels that show budget consumption.", level: "intermediate" },
      { id: "log-agg", title: "Log aggregation — Loki / ELK", hint: "Centralized, queryable logs.", level: "core" },
    ],
  },
  {
    id: "iac",
    title: "Infrastructure as Code",
    emoji: "🏗️",
    color: "#14b8a6",
    blurb: "Level up Terraform from writing configs to engineering reusable, tested modules.",
    items: [
      { id: "tf-modules", title: "Terraform modules & workspaces", hint: "Reusable, composable, environment-aware infra.", level: "core" },
      { id: "terratest", title: "Testing IaC — Terratest / terraform test", hint: "Automated validation of infrastructure.", level: "advanced" },
      { id: "tf-state", title: "Remote state & locking", hint: "Backends, state security, drift detection.", level: "intermediate" },
      { id: "packer", title: "Packer & golden images", hint: "Immutable, pre-baked machine images.", level: "intermediate" },
    ],
  },
  {
    id: "programming",
    title: "Programming",
    emoji: "💻",
    color: "#ec4899",
    blurb: "Go is the language of infra tooling. Deepen Python for automation.",
    items: [
      { id: "go-basics", title: "Go fundamentals", hint: "K8s, Terraform & Prometheus are all Go. Huge for SRE tooling.", level: "core" },
      { id: "go-tooling", title: "Build a CLI / controller in Go", hint: "Turn Go knowledge into a portfolio piece.", level: "advanced" },
      { id: "python-automation", title: "Python for automation & APIs", hint: "Scripting, boto3, API integrations, tooling.", level: "core" },
      { id: "bash-mastery", title: "Bash & shell mastery", hint: "Robust scripts, traps, set -euo pipefail.", level: "core" },
    ],
  },
  {
    id: "security",
    title: "Security & Policy",
    emoji: "🔐",
    color: "#ef4444",
    blurb: "DevSecOps signals recruiters love — and CKS territory.",
    items: [
      { id: "trivy", title: "Image & IaC scanning — Trivy", hint: "Catch CVEs and misconfig before deploy.", level: "core" },
      { id: "opa-kyverno", title: "Policy as code — OPA / Kyverno", hint: "Enforce guardrails on K8s resources.", level: "intermediate" },
      { id: "secrets", title: "Secrets — Vault / External Secrets", hint: "Stop hard-coding credentials.", level: "core" },
      { id: "supply-chain", title: "Supply-chain security — Sigstore / cosign / SBOM", hint: "Sign and verify artifacts.", level: "advanced" },
    ],
  },
  {
    id: "cloud",
    title: "Cloud depth",
    emoji: "☁️",
    color: "#0ea5e9",
    blurb: "Go beyond 'I use AWS/Azure' into the primitives.",
    items: [
      { id: "networking", title: "Cloud networking — VPC, subnets, LB, DNS", hint: "The foundation everything runs on.", level: "core" },
      { id: "iam", title: "IAM & least privilege", hint: "Roles, policies, OIDC federation.", level: "core" },
      { id: "managed-k8s", title: "Managed Kubernetes — EKS / AKS", hint: "Cloud-native cluster ops.", level: "intermediate" },
      { id: "finops", title: "Cost optimization / FinOps", hint: "Right-sizing, spot, budgets — a rare, valued skill.", level: "advanced" },
    ],
  },
  {
    id: "projects",
    title: "Portfolio projects",
    emoji: "🛠️",
    color: "#eab308",
    blurb: "Your biggest gap. Build these on GitHub and link them from your resume.",
    items: [
      { id: "proj-gitops", title: "End-to-end GitOps pipeline", hint: "Sample app → GitHub Actions → ArgoCD → K8s with Helm. Proves the whole loop.", level: "core" },
      { id: "proj-observability", title: "Observability-as-code stack", hint: "Prometheus + Grafana + Alertmanager + Loki with real SLO dashboards.", level: "core" },
      { id: "proj-tf-module", title: "Reusable Terraform module", hint: "Provisions a cloud environment, with automated tests.", level: "intermediate" },
      { id: "proj-go", title: "Go operator or CLI tool", hint: "e.g. a K8s controller or an ops automation CLI.", level: "advanced" },
      { id: "proj-homelab", title: "k3s homelab + writeup", hint: "A real cluster you run, documented as a blog post.", level: "intermediate" },
      { id: "proj-blog", title: "Write 2–3 technical blog posts", hint: "An incident you solved, a pipeline you built. Shows communication.", level: "core" },
      { id: "proj-oss", title: "Contribute to an OSS DevOps tool", hint: "Even docs or a small fix on a tool you use.", level: "advanced" },
    ],
  },
];

export const TOTAL_ITEMS = ROADMAP.reduce((n, t) => n + t.items.length, 0);
