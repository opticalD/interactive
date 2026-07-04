import { motion } from "framer-motion";
import { profile } from "./content";
import { ScrollProgress } from "./components/ScrollProgress";
import { Hero } from "./components/Hero";
import { Metrics } from "./components/Metrics";
import { Experience } from "./components/Experience";
import { StoryChapters } from "./components/StoryChapters";
import { Projects, Skills } from "./components/SkillsProjects";
import { Education } from "./components/Education";

export default function App() {
  return (
    <main className="relative">
      <ScrollProgress />
      <Hero />

      {/* Professional summary */}
      <section className="mx-auto max-w-3xl px-6 pt-6 pb-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-lg leading-relaxed text-white/70"
        >
          {profile.summary}
        </motion.p>
      </section>

      <Metrics />
      <Experience />
      <Skills />
      <StoryChapters />
      <Projects />
      <Education />

      {/* Contact / outro */}
      <section className="mx-auto max-w-3xl px-6 py-28 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-white/90 sm:text-4xl"
        >
          Let's build reliable systems together.
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
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </motion.div>
        <p className="mt-16 text-xs text-white/30">
          {profile.location} · {profile.phone} · built with React, Tailwind & Framer Motion
        </p>
      </section>
    </main>
  );
}
