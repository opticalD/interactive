import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error - plain .mjs Netlify function, no types
import tmdbHandler from "./netlify/functions/tmdb.mjs";

/**
 * In production `/api/tmdb` is redirected to the Netlify function. In dev there
 * is no Netlify runtime, so run the exact same handler as dev middleware —
 * one implementation, so the two environments can't drift apart.
 */
function tmdbProxy(env: Record<string, string>): Plugin {
  return {
    name: "reel-tmdb-proxy",
    configureServer(server) {
      // Assigning undefined here would set the literal string "undefined",
      // which reads as a real (but invalid) key downstream.
      if (!process.env.TMDB_KEY && env.TMDB_KEY) process.env.TMDB_KEY = env.TMDB_KEY;
      server.middlewares.use("/api/tmdb", async (req, res) => {
        const request = new Request(`http://localhost${req.originalUrl ?? req.url}`, {
          method: req.method,
        });
        const response: Response = await tmdbHandler(request);
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), tmdbProxy(loadEnv(mode, process.cwd(), ""))],
  server: { port: 5179 },
}));
