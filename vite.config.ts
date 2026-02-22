import * as child_process from "node:child_process";
import react from "@vitejs/plugin-react";
import Icons from "unplugin-icons/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { vocs } from "vocs/vite";

const commitSha = child_process
  .execSync("git rev-parse --short HEAD")
  .toString()
  .trim();
const commitTimestamp = child_process
  .execSync("git log -1 --format=%cI")
  .toString()
  .trim();

// Preload only the fonts needed above the fold to avoid competing for
// bandwidth with other critical resources. Geist-Regular covers body text
// and Geist-Medium covers h1–h3 headings (font-weight 450–500). The remaining
// fonts (GeistMono, GeistPixel-Square, Geist-Bold) load lazily via
// font-display: swap in _root.css when code blocks or diagrams scroll into view.
function preloadFonts(): Plugin {
  return {
    name: "preload-fonts",
    transformIndexHtml() {
      return [
        {
          tag: "link",
          attrs: {
            rel: "preload",
            as: "font",
            type: "font/woff2",
            href: "/fonts/Geist-Regular.woff2",
            crossorigin: "anonymous",
          },
          injectTo: "head",
        },
        {
          tag: "link",
          attrs: {
            rel: "preload",
            as: "font",
            type: "font/woff2",
            href: "/fonts/Geist-Medium.woff2",
            crossorigin: "anonymous",
          },
          injectTo: "head",
        },
      ];
    },
  };
}

function stubRehypeMermaid(): Plugin {
  return {
    name: "stub-rehype-mermaid",
    enforce: "pre",
    resolveId(id) {
      if (id === "rehype-mermaid") return "\0rehype-mermaid-stub";
    },
    load(id) {
      if (id === "\0rehype-mermaid-stub") {
        return "export default function rehypeMermaid() { return (tree) => tree }";
      }
    },
  };
}

export default defineConfig({
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha),
    __COMMIT_TIMESTAMP__: JSON.stringify(commitTimestamp),
  },
  optimizeDeps: {
    include: ["@braintree/sanitize-url", "dayjs"],
  },
  plugins: [
    preloadFonts(),
    stubRehypeMermaid(),
    Icons({ compiler: "jsx", jsx: "react" }),
    react(),
    vocs(),
  ],
});
