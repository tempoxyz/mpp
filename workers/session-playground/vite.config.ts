import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// Runs the Worker (src/server.ts) in workerd with its Durable Object and .dev.vars,
// and serves the page (index.html, src/app) as static assets from the same origin.
// PLAYGROUND_LOCAL=1 runs without a Cloudflare login: no Workers AI binding, so the Worker
// streams its built-in story.
// Served at mpp.dev/playground/session: mpp.dev proxies that path to this Worker.
export default defineConfig(({ command }) => ({
  base: "/playground/session/",
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
    port: 8791,
    allowedHosts: true,
    // Keep secrets off the dev server: Vite's defaults plus .dev.vars.
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", ".dev.vars*"] },
  },
}));

/**
 * The code panes, highlighted at build time: Shiki would be most of the page's JavaScript and
 * keep the panes plain for seconds on a first visit. virtual:code holds each pane's lines
 * (src/app/code.ts), virtual:code-theme.css the colors they use. The deposit the visitor picks
 * fills a slot in a string token (code.ts, fill). Explained panes are diffed from paying per
 * request (samples.ts, chargeClient and chargeServer).
 */
export function prerenderCode(): Plugin {
  const ids = { code: "virtual:code", css: "virtual:code-theme.css" };
  let built: Promise<{ code: string; css: string }> | undefined;
  const build = async () => {
    const { getSharedHighlighter } = await import("@pierre/diffs");
    // By file URL: Vite's bundled config and Node (scripts/prerender-html.ts imports this file
    // directly) both load the .ts source from there.
    const samples = (await import(
      new URL("./src/app/samples.ts", import.meta.url).href
    )) as typeof import("./src/app/samples.js");
    const { fill, slots, theme } = (await import(
      new URL("./src/app/code.ts", import.meta.url).href
    )) as typeof import("./src/app/code.js");
    type Token = import("./src/app/code.js").Token;
    type PaneLine = import("./src/app/code.js").PaneLine;
    const highlighter = await getSharedHighlighter({
      langs: ["typescript"],
      themes: [theme],
    });
    const colors: string[] = [];
    const lines: Token[][] = [];
    const index = new Map<string, number>();
    // Highlights a source into deduplicated lines, merging runs of one color.
    const tokenize = (source: string) => {
      const { fg = "#adbac7", tokens } = highlighter.codeToTokens(
        source.replace(/\n$/, ""),
        { lang: "typescript", theme },
      );
      return tokens.map((line) => {
        const merged: { color: string; text: string }[] = [];
        for (const { color = fg, content } of line) {
          const last = merged.at(-1);
          // Whitespace has no visible color: it joins the token before it.
          if (last && (last.color === color || !content.trim()))
            last.text += content;
          else
            merged.push({ color: !content.trim() ? fg : color, text: content });
        }
        const out: Token[] = merged.map(({ color, text }) => {
          if (color.toLowerCase() === fg.toLowerCase()) return text;
          if (!colors.includes(color)) colors.push(color);
          return [text, colors.indexOf(color)];
        });
        const key = JSON.stringify(out);
        if (!index.has(key)) index.set(key, lines.push(out) - 1);
        return index.get(key)!;
      });
    };
    // A unified line diff (longest common subsequence), deletions before additions.
    const diff = (old: number[], now: number[]) => {
      const lcs = Array.from({ length: old.length + 1 }, () =>
        new Array<number>(now.length + 1).fill(0),
      );
      for (let i = old.length - 1; i >= 0; i--)
        for (let j = now.length - 1; j >= 0; j--)
          lcs[i]![j] =
            old[i] === now[j]
              ? lcs[i + 1]![j + 1]! + 1
              : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
      const out: PaneLine[] = [];
      let [i, j] = [0, 0];
      while (i < old.length || j < now.length) {
        if (i < old.length && j < now.length && old[i] === now[j]) {
          out.push(now[j]!);
          i++;
          j++;
        } else if (
          i < old.length &&
          (j === now.length || lcs[i + 1]![j]! >= lcs[i]![j + 1]!)
        )
          out.push([old[i++]!, -1]);
        else out.push([now[j++]!, 1]);
      }
      return out;
    };
    const client = samples.source(samples.clientBlocks(slots.deposit));
    // Filling the slot must give exactly what clientBlocks() writes.
    for (const deposit of ["0.1", "0.25"])
      if (
        fill(client, { deposit }) !==
        samples.source(samples.clientBlocks(deposit))
      )
        throw new Error("code.ts fill() disagrees with clientBlocks()");
    const server = tokenize(samples.source(samples.serverBlocks()));
    const clientLines = tokenize(client);
    const panes: Record<string, PaneLine[]> = {
      "client.ts": clientLines,
      "client.ts:explain": diff(tokenize(samples.chargeClient()), clientLines),
      "server.ts": server,
      "server.ts:explain": diff(tokenize(samples.chargeServer()), server),
    };
    return {
      code: `export default ${JSON.stringify({ lines, panes })};`,
      css: colors.map((color, i) => `.t${i}{color:${color}}`).join("\n"),
    };
  };
  return {
    name: "prerender-code",
    resolveId: (source) =>
      source === ids.code
        ? `\0${ids.code}`
        : source === ids.css
          ? "/@prerender-code/code-theme.css"
          : undefined,
    async load(id) {
      if (id !== `\0${ids.code}` && id !== "/@prerender-code/code-theme.css")
        return;
      built ??= build();
      const { code, css } = await built;
      return id === `\0${ids.code}` ? code : css;
    },
  };
}
