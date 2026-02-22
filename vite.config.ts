import * as child_process from "node:child_process";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import Icons from "unplugin-icons/vite";
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
    stubRehypeMermaid(),
    Icons({ compiler: "jsx", jsx: "react" }),
    react(),
    vocs(),
  ],
});
