// The session playground's code panes, highlighted at build time (vite.config.ts uses it).
import type { Plugin } from "vite";

/**
 * The code panes, highlighted at build time: Shiki would be most of the page's JavaScript and
 * keep the panes plain for seconds on a first visit. virtual:session-code holds each pane's lines
 * (app/code.ts), virtual:session-code-theme.css the colors they use. The deposit the visitor picks
 * fills a slot in a string token (code.ts, fill).
 */
export function prerenderCode(): Plugin {
  const ids = {
    code: "virtual:session-code",
    css: "virtual:session-code-theme.css",
  };
  let built: Promise<{ code: string; css: string }> | undefined;
  const build = async () => {
    const { getSharedHighlighter } = await import("@pierre/diffs");
    // By file URL: Vite's bundled config and Node (scripts/prerender-html.ts imports this file
    // directly) both load the .ts source from there.
    const samples = (await import(
      new URL("./app/samples.ts", import.meta.url).href
    )) as typeof import("./app/samples.js");
    const { fill, slots, theme } = (await import(
      new URL("./app/code.ts", import.meta.url).href
    )) as typeof import("./app/code.js");
    type Token = import("./app/code.js").Token;
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
    const client = samples.source(samples.clientBlocks(slots.deposit));
    // Filling the slot must give exactly what clientBlocks() writes.
    for (const deposit of ["0.1", "0.25"])
      if (
        fill(client, { deposit }) !==
        samples.source(samples.clientBlocks(deposit))
      )
        throw new Error("code.ts fill() disagrees with clientBlocks()");
    const panes = {
      "client.ts": tokenize(client),
      "server.ts": tokenize(samples.source(samples.serverBlocks())),
    };
    return {
      code: `export default ${JSON.stringify({ lines, panes })};`,
      css: colors.map((color, i) => `.t${i}{color:${color}}`).join("\n"),
    };
  };
  return {
    name: "prerender-session-code",
    resolveId: (source) =>
      source === ids.code
        ? `\0${ids.code}`
        : source === ids.css
          ? "/@prerender-code/session-code-theme.css"
          : undefined,
    async load(id) {
      if (
        id !== `\0${ids.code}` &&
        id !== "/@prerender-code/session-code-theme.css"
      )
        return;
      built ??= build();
      const { code, css } = await built;
      return id === `\0${ids.code}` ? code : css;
    },
  };
}
