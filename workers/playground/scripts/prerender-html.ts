// Renders each page's first state into its dist index.html, so it paints before any
// JavaScript runs; main.tsx then renders over it. Runs after vite build (see package.json).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

import { prerenderCode as chargeCode } from "../src/charge/prerender-code.ts";
import { prerenderCode as discoveryCode } from "../src/discovery/prerender-code.ts";
import { prerenderCode as identityCode } from "../src/identity/prerender-code.ts";
import { prerenderCode as sessionCode } from "../src/session/prerender-code.ts";
import { prerenderCode as zonesCode } from "../src/zones/prerender-code.ts";

// The first state is a new visitor's: no stored test wallet. Replaced outright, since Node 25+
// defines a localStorage of its own that throws without --localstorage-file.
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: () => null,
    key: () => null,
    length: 0,
    removeItem: () => {},
    setItem: () => {},
  },
});

/** Each playground's page, and what it asks for before its JavaScript runs. */
const pages = [
  {
    name: "identity",
    // The Worker's config (prices, limits) with the page, not after the wallet chunks:
    // Buy waits on it. Same request as App.tsx's fetch, so the browser reuses it.
    preload:
      '<link rel="preload" as="fetch" crossorigin href="/playground/identity/api/config">',
  },
  { name: "session", preload: "" },
  { name: "charge", preload: "" },
  {
    name: "discovery",
    // The registry with the page: the directory waits on it.
    preload:
      '<link rel="preload" as="fetch" crossorigin href="/playground/discovery/api/registry">',
  },
  {
    name: "zones",
    // The Zone's config with the page: every button waits on it.
    preload:
      '<link rel="preload" as="fetch" crossorigin href="/playground/zones/api/config">',
  },
];

// fileURLToPath, not .pathname: a checkout path with spaces or non-ASCII characters stays intact.
const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist/client/playground");
const vite = await createServer({
  appType: "custom",
  base: "/playground/",
  configFile: false,
  logLevel: "error",
  plugins: [
    react(),
    identityCode(),
    sessionCode(),
    chargeCode(),
    discoveryCode(),
    zonesCode(),
  ],
  root,
  server: { middlewareMode: true },
});
try {
  for (const page of pages) {
    const { App } = await vite.ssrLoadModule(`/src/${page.name}/app/App.tsx`);
    const markup = renderToString(createElement(App));
    const file = join(dist, page.name, "index.html");
    let html = readFileSync(file, "utf8");
    if (!html.includes('<div id="root"></div>'))
      throw new Error(`${file} has no empty #root to fill`);
    // Inline the stylesheets too, so the page paints as soon as its HTML arrives.
    const links = [
      ...html.matchAll(
        /<link rel="stylesheet" crossorigin href="\/playground\/(assets\/[^"]+\.css)">/g,
      ),
    ];
    if (links.length === 0)
      throw new Error(`${file} has no stylesheet to inline`);
    for (const link of links) {
      const style = readFileSync(join(dist, link[1]!), "utf8");
      // Inline, and keep a link that never applies (media="not all"): Vite's loader for lazy
      // chunks checks for it, and would otherwise add the stylesheet again, which re-fetches
      // the fonts and reflows the page a second or two in.
      html = html.replace(
        link[0],
        () =>
          `<style>${style}</style>${link[0].replace(">", ' media="not all">')}`,
      );
    }
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
                  '<link rel="preload" as="font" type="font/woff2" crossorigin href="/playground/fonts/' +
                  font +
                  '.woff2">',
              )
              .join("") +
            page.preload,
        )
        .replace(
          '<div id="root"></div>',
          () => `<div id="root">${markup}</div>`,
        ),
    );
    console.log(`prerendered ${markup.length} bytes into ${file}`);
  }
} finally {
  await vite.close();
}
