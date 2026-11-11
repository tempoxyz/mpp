import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { prerenderCode as identityCode } from "./src/identity/prerender-code.ts";
import { prerenderCode as sessionCode } from "./src/session/prerender-code.ts";

// One Worker for every playground: src/index.ts routes each one's API, and each page
// (identity/index.html, session/index.html) is static assets from the same origin.
// Runs the Worker in workerd with its Durable Objects and .dev.vars.
// PLAYGROUND_LOCAL=1 runs without a Cloudflare login: no Workers AI binding, so the
// playgrounds use their built-in haiku and story.
// Served at mpp.dev/playground: mpp.dev proxies each playground's path to this Worker.
export default defineConfig(({ command }) => ({
  base: "/playground/",
  // Both pages, in the client build only: the Worker's build has its own entry (src/index.ts).
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: {
            identity: fileURLToPath(
              new URL("identity/index.html", import.meta.url),
            ),
            session: fileURLToPath(
              new URL("session/index.html", import.meta.url),
            ),
          },
        },
      },
    },
  },
  plugins: [
    react(),
    identityCode(),
    sessionCode(),
    cloudflare(
      command === "serve" && process.env.PLAYGROUND_LOCAL
        ? {
            config: (config) => {
              delete (config as { ai?: unknown }).ai;
            },
          }
        : {},
    ),
  ],
  server: {
    port: 8790,
    allowedHosts: true,
    // Keep secrets off the dev server: Vite's defaults plus .dev.vars.
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", ".dev.vars*"] },
  },
}));
