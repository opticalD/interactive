import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error - plain .mjs Netlify function, no types
import feedHandler from "./netlify/functions/feed.mjs";

/**
 * In production `/api/feed` is redirected to the Netlify function. In dev there
 * is no Netlify runtime, so run the exact same handler as dev middleware —
 * one implementation, so the two environments can't drift apart.
 */
function feedProxy(): Plugin {
  return {
    name: "signal-feed-proxy",
    configureServer(server) {
      server.middlewares.use("/api/feed", async (req, res) => {
        const request = new Request(`http://localhost${req.originalUrl ?? req.url}`, {
          method: req.method,
        });
        const response: Response = await feedHandler(request);
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), feedProxy()],
  server: { port: 5176 },
});
