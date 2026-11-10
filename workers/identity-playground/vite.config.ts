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
  const ids = ["virtual:prerendered-code", "virtual:prerendered-diffs"];
  let panes:
    | Promise<Record<string, { full: string; source: string }>>
    | undefined;
  // Highlights each pane's first file once, with the same options as CodeView.tsx.
  const render = async () => {
    const { preloadFile } = await import("@pierre/diffs/ssr");
    // By file URL: Vite's bundled config and Node (scripts/prerender-html.ts imports this file
    // directly) both load the .ts source from there.
    const { serverUsage, usage } = (await import(
      new URL("./src/app/samples.ts", import.meta.url).href
    )) as typeof import("./src/app/samples.js");
    const { codeOptions } = (await import(
      new URL("./src/app/codeOptions.ts", import.meta.url).href
    )) as typeof import("./src/app/codeOptions.js");
    const sources = {
      "client.ts": usage("anonymous", "", "haiku-demo-key", ""),
      "server.ts": serverUsage("anonymous"),
    };
    const out: Record<string, { full: string; source: string }> = {};
    for (const [name, contents] of Object.entries(sources)) {
      const { prerenderedHTML } = await preloadFile({
        file: { contents, name },
        options: codeOptions,
      });
      out[name] = { full: prerenderedHTML, source: contents };
    }
    return out;
  };
  return {
    name: "prerender-code",
    resolveId: (source) => (ids.includes(source) ? "\0" + source : undefined),
    async load(source) {
      const id = ids.find((id) => source === "\0" + id);
      if (!id) return;
      panes ??= render();
      const out: Record<string, { html: string; source: string }> = {};
      for (const [name, { full, source }] of Object.entries(await panes)) {
        out[name] = {
          // The diffs pane's own markup (for CodeView.tsx, in the highlighter's chunk), or for
          // the page's first paint just the lines, each token's dark color inline.
          html:
            id === "virtual:prerendered-diffs"
              ? full
              : (/<code[^>]*>([\s\S]*)<\/code>/.exec(full)?.[1] ?? "").replace(
                  /style="--diffs-token-dark:(#[0-9A-Fa-f]+)[^"]*"/g,
                  'style="color:$1"',
                ),
          source,
        };
      }
      return "export default " + JSON.stringify(out) + ";";
    },
  };
}
