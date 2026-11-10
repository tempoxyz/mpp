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
 * The code panes, highlighted and diffed at build time for every tier: Shiki and a diff renderer
 * would be most of the page's JavaScript and keep the panes plain for seconds on a first visit.
 * virtual:code holds each pane's lines (src/app/code.ts), virtual:code-theme.css the colors
 * they use. What the visitor types fills slots in string tokens (code.ts, fill).
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
    const { fill, paneKey, slots, theme } = (await import(
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
        {
          lang: "typescript",
          theme,
        },
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
        return { key, line: index.get(key)! };
      });
    };
    // A unified line diff (longest common subsequence), deletions before additions.
    const diff = (
      old: ReturnType<typeof tokenize>,
      now: ReturnType<typeof tokenize>,
    ) => {
      const same = (i: number, j: number) => old[i]!.key === now[j]!.key;
      const lcs = Array.from({ length: old.length + 1 }, () =>
        new Array<number>(now.length + 1).fill(0),
      );
      for (let i = old.length - 1; i >= 0; i--)
        for (let j = now.length - 1; j >= 0; j--)
          lcs[i]![j] = same(i, j)
            ? lcs[i + 1]![j + 1]! + 1
            : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
      const out: PaneLine[] = [];
      let [i, j] = [0, 0];
      while (i < old.length || j < now.length) {
        if (i < old.length && j < now.length && same(i, j)) {
          out.push(now[j]!.line);
          i++;
          j++;
        } else if (
          i < old.length &&
          (j === now.length || lcs[i + 1]![j]! >= lcs[i]![j + 1]!)
        )
          out.push([old[i++]!.line, -1]);
        else out.push([now[j++]!.line, 1]);
      }
      return out;
    };
    const tiers = ["anonymous", "email", "apiKey", "link"] as const;
    const panes: Record<string, PaneLine[]> = {};
    const clientBase = tokenize(samples.usage("anonymous"));
    const serverBase = tokenize(samples.serverUsage("anonymous"));
    for (const tier of tiers) {
      panes[paneKey("server.ts", tier, false)] = diff(
        serverBase,
        tokenize(samples.serverUsage(tier)),
      );
      for (const topic of [false, true]) {
        const source = samples.usage(
          tier,
          slots.email,
          slots.apiKey,
          topic ? slots.topic : "",
        );
        panes[paneKey("client.ts", tier, topic)] = diff(
          clientBase,
          tokenize(source),
        );
        // Filling the slots must give exactly what usage() writes, quoting included.
        const values = {
          apiKey: 'k"\\ey',
          email: 'a"b@c.d',
          topic: topic ? 'to"pic' : "",
        };
        for (const v of [
          values,
          { apiKey: "", email: "", topic: values.topic },
        ])
          if (
            fill(source, v) !== samples.usage(tier, v.email, v.apiKey, v.topic)
          )
            throw new Error(`code.ts fill() disagrees with usage("${tier}")`);
      }
    }
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
