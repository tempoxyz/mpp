// Renders the page's first state into dist's index.html, so it paints before any JavaScript
// runs; main.tsx then renders over it. Runs after vite build (see package.json).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

import { prerenderCode } from "../vite.config.ts";

// The first state is a new visitor's: no stored test wallet.
globalThis.localStorage ??= {
  getItem: () => null,
  removeItem: () => {},
  setItem: () => {},
};

const root = new URL("..", import.meta.url).pathname;
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
  // Fetch the code panes' highlighter with the page rather than after main.tsx runs.
  const codeView = readdirSync(
    join(root, "dist/client/playground/identity/assets"),
  ).find((name) => /^CodeView-.*\.js$/.test(name));
  if (!codeView) throw new Error("dist has no CodeView chunk to preload");
  writeFileSync(
    file,
    html
      .replace(
        "</head>",
        () =>
          '<link rel="modulepreload" crossorigin href="/playground/identity/assets/' +
          codeView +
          '">\n</head>',
      )
      .replace(css[0], () => `<style>${style}</style>`)
      .replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`),
  );
  console.log(`prerendered ${markup.length} bytes into ${file}`);
} finally {
  await vite.close();
}
