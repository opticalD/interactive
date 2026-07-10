import { motion } from "framer-motion";
import { profile, projects } from "./content";
import { Hero } from "./components/Hero";
import { ProjectCard } from "./components/ProjectCard";

export default function App() {
  return (
    <main className="relative">
      <Hero />

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-4xl px-6 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8"
        >
          <h2 className="text-xl font-semibold text-white/90">Want to build something together?</h2>
          <p className="mt-2 text-sm text-white/50">
            Always happy to talk DevOps, side-projects, or anything in between.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${profile.email}`}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105"
            >
              {profile.email}
            </a>
            {profile.links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>
        </motion.div>
        <p className="mt-8 text-xs text-white/30">
          Built with React, TypeScript, Tailwind CSS &amp; Framer Motion.
        </p>
      </footer>
    </main>
  );
}
