// A playground's code panes, highlighted at build time (vite.config.ts uses it).
import type { Plugin } from "vite";

/**
 * Highlights `panes()` at build time: Shiki would be most of the page's JavaScript.
 * virtual:<name>-code holds each pane's lines (code.ts), virtual:<name>-code-theme.css the
 * colors they use.
 */
export function prerenderCode(
  name: string,
  panes: () => Promise<Record<string, string>>,
): Plugin {
  const ids = {
    code: `virtual:${name}-code`,
    css: `virtual:${name}-code-theme.css`,
  };
  const cssId = `/@prerender-code/${name}-code-theme.css`;
  let built: Promise<{ code: string; css: string }> | undefined;
  const build = async () => {
    const { getSharedHighlighter } = await import("@pierre/diffs");
    const { theme } = (await import(
      new URL("./code.ts", import.meta.url).href
    )) as typeof import("./code.js");
    type Token = import("./code.js").Token;
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
    const sources = await panes();
    const tokenized = Object.fromEntries(
      Object.entries(sources).map(([pane, source]) => [pane, tokenize(source)]),
    );
    return {
      code: `export default ${JSON.stringify({ lines, panes: tokenized })};`,
      css: colors.map((color, i) => `.t${i}{color:${color}}`).join("\n"),
    };
  };
  return {
    name: `prerender-${name}-code`,
    resolveId: (source) =>
      source === ids.code
        ? `\0${ids.code}`
        : source === ids.css
          ? cssId
          : undefined,
    async load(id) {
      if (id !== `\0${ids.code}` && id !== cssId) return;
      built ??= build();
      const { code, css } = await built;
      return id === cssId ? css : code;
    },
  };
}
