import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// Runs the Worker (src/server.ts) in workerd with its Durable Object and .dev.vars,
// and serves the page (index.html, src/app) as static assets from the same origin.
// PLAYGROUND_LOCAL=1 runs without a Cloudflare login: no Workers AI binding, so the Worker
// uses ANTHROPIC_API_KEY or its built-in haiku.
// Served at mpp.dev/playground/identity: mpp.dev's Vercel app rewrites that path to this Worker.
export default defineConfig(({ command }) => ({
  base: "/playground/identity/",
  plugins: [
    react(),
    prerenderCode(),
    cloudflare(
      command === "serve" && process.env.PLAYGROUND_LOCAL
        ? {
            config: (config) => {
              delete (config as { ai?: unknown }).ai;
              config.assets = {
                ...config.assets,
                not_found_handling: "single-page-application",
              };
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

/**
 * The code panes' first state, highlighted at build time: the highlighter is the page's largest
 * download and loads as a chain of chunks, so on a first visit the panes would stay plain for
 * seconds. App.tsx shows these until it loads, while the code is still the anonymous sample.
 */
export function prerenderCode(): Plugin {
  const id = "virtual:prerendered-code";
  return {
    name: "prerender-code",
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    async load(source) {
      if (source !== `\0${id}`) return;
      const { preloadFile } = await import("@pierre/diffs/ssr");
      // By file URL: Vite's bundled config and Node (scripts/prerender-html.ts imports this file
      // directly) both load the .ts source from there.
      const { serverUsage, usage } = (await import(
        new URL("./src/app/samples.ts", import.meta.url).href
      )) as typeof import("./src/app/samples.js");
      const panes = {
        "client.ts": usage("anonymous", "", "haiku-demo-key", ""),
        "server.ts": serverUsage("anonymous"),
      };
      const out: Record<string, { html: string; source: string }> = {};
      for (const [name, contents] of Object.entries(panes)) {
        const { prerenderedHTML } = await preloadFile({
          file: { contents, name },
          options: { theme: "github-dark-dimmed" },
        });
        // Just the lines, each token's dark color inline: the page always uses the dark theme.
        const code =
          /<code[^>]*>([\s\S]*)<\/code>/.exec(prerenderedHTML)?.[1] ?? "";
        out[name] = {
          html: code.replace(
            /style="--diffs-token-dark:(#[0-9A-Fa-f]+)[^"]*"/g,
            'style="color:$1"',
          ),
          source: contents,
        };
      }
      return `export default ${JSON.stringify(out)};`;
    },
  };
}
