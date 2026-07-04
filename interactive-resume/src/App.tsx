import { motion } from "framer-motion";
import { profile } from "./content";
import { ScrollProgress } from "./components/ScrollProgress";
import { Hero } from "./components/Hero";
import { Metrics } from "./components/Metrics";
import { StoryChapters } from "./components/StoryChapters";
import { Projects, Skills } from "./components/SkillsProjects";

export default function App() {
  return (
    <main className="relative">
      <ScrollProgress />
      <Hero />
      <Metrics />
      <StoryChapters />
      <Skills />
      <Projects />

      {/* Contact / outro */}
      <section className="mx-auto max-w-3xl px-6 py-28 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-white/90 sm:text-4xl"
        >
          Let's build something together.
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href={`mailto:${profile.email}`}
            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform hover:scale-105"
          >
            {profile.email}
          </a>
          {profile.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </motion.div>
        <p className="mt-16 text-xs text-white/30">
          {profile.location} · built with React, Tailwind & Framer Motion
        </p>
      </section>
    </main>
  );
}
