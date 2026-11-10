// Renders the page's first state into dist's index.html, so it paints before any JavaScript
// runs; main.tsx then renders over it. Runs after vite build (see package.json).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

import { prerenderCode } from "../vite.config.ts";

// The first state is a new visitor's: no stored test wallet. Replaced outright, since Node 25+
// defines a localStorage of its own that throws without --localstorage-file.
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, removeItem: () => {}, setItem: () => {} },
});

// fileURLToPath, not .pathname: a checkout path with spaces or non-ASCII characters stays intact.
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  base: "/playground/identity/",
  configFile: false,
  logLevel: "error",
  plugins: [react(), prerenderCode()],
  root,
  server: { middlewareMode: true },
});
try {
  const { App } = await vite.ssrLoadModule("/src/app/App.tsx");
  const markup = renderToString(createElement(App));
  const file = join(root, "dist/client/playground/identity/index.html");
  const html = readFileSync(file, "utf8");
  if (!html.includes('<div id="root"></div>'))
    throw new Error("index.html has no empty #root to fill");
  // Inline the stylesheet too, so the page paints as soon as its HTML arrives.
  const css =
    /<link rel="stylesheet" crossorigin href="\/playground\/identity\/(assets\/[^"]+\.css)">/.exec(
      html,
    );
  if (!css) throw new Error("index.html has no stylesheet to inline");
  const style = readFileSync(
    join(root, "dist/client/playground/identity", css[1]),
    "utf8",
  );
  writeFileSync(
    file,
    html
      // The fonts as early as the page itself, so text paints in them rather than swapping.
      .replace(
        '<meta charset="UTF-8" />',
        (meta) =>
          meta +
          ["Geist-Variable", "GeistMono-Variable"]
            .map(
              (font) =>
                '<link rel="preload" as="font" type="font/woff2" crossorigin href="/playground/identity/fonts/' +
                font +
                '.woff2">',
            )
            .join("") +
          // The Worker's config (prices, limits) with the page, not after the wallet chunks:
          // Buy waits on it. Same request as App.tsx's fetch, so the browser reuses it.
          '<link rel="preload" as="fetch" crossorigin href="/playground/identity/api/config">',
      )
      // Inline, and keep a link that never applies (media="not all"): Vite's loader for lazy
      // chunks checks for it, and would otherwise add the stylesheet again, which re-fetches
      // the fonts and reflows the page a second or two in.
      .replace(
        css[0],
        () =>
          `<style>${style}</style>${css[0].replace(">", ' media="not all">')}`,
      )
      .replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`),
  );
  console.log(`prerendered ${markup.length} bytes into ${file}`);
} finally {
  await vite.close();
}
