import { motion } from "framer-motion";
import { profile } from "../content";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-20 sm:pt-28">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-cyan-500/25 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium uppercase tracking-[0.3em] text-white/40"
        >
          Projects
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-4 bg-gradient-to-r from-cyan-200 via-violet-200 to-amber-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl"
        >
          {profile.name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mx-auto mt-4 max-w-xl text-lg text-white/60"
        >
          {profile.tagline}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mx-auto mt-2 max-w-md text-sm text-white/40"
        >
          {profile.intro}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-2.5"
        >
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/60">
            📍 {profile.location}
          </span>
          <a
            href={`mailto:${profile.email}`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✉️ {profile.email}
          </a>
          {profile.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
