import * as child_process from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import react from "@vitejs/plugin-react";
import Icons from "unplugin-icons/vite";
import type { Plugin } from "vite";
import { defineConfig, loadEnv } from "vite";
import mkcert from "vite-plugin-mkcert";
import { configDefaults } from "vitest/config";
import { vocs } from "vocs/vite";
import { assertSitemapXml, pruneSitemapXml } from "./scripts/sitemap.js";
import { blogContent } from "./scripts/vite-blog.js";

const commitSha = child_process
  .execSync("git rev-parse --short HEAD")
  .toString()
  .trim();
const commitTimestamp = child_process
  .execSync("git log -1 --format=%cI")
  .toString()
  .trim();

const CONTENT_SIGNAL_DIRECTIVE =
  "Content-Signal: ai-train=no, search=yes, ai-input=no";

function contentSignalsRobotsTxt(): Plugin {
  return {
    name: "content-signals-robots-txt",
    enforce: "post",
    async writeBundle(options) {
      if (!options.dir?.endsWith("/public")) return;

      const robotsPath = path.join(options.dir, "robots.txt");
      const current = await fs.readFile(robotsPath, "utf8");
      const next = current.includes("Content-Signal:")
        ? current.replace(/^Content-Signal:.*$/m, CONTENT_SIGNAL_DIRECTIVE)
        : current.replace(
            /(User-agent: \*\nAllow: \/\n)/,
            `$1\n${CONTENT_SIGNAL_DIRECTIVE}\n`,
          );

      if (next !== current) await fs.writeFile(robotsPath, next, "utf8");
    },
  };
}

function pruneSitemap(): Plugin {
  return {
    name: "prune-sitemap",
    enforce: "post",
    async writeBundle(options) {
      if (!options.dir?.endsWith("/public")) return;

      const sitemapPath = path.join(options.dir, "sitemap.xml");
      const current = await fs.readFile(sitemapPath, "utf8").catch((error) => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      });
      if (!current) return;

      const next = pruneSitemapXml(current);
      assertSitemapXml(next);

      if (next !== current) await fs.writeFile(sitemapPath, next, "utf8");
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of Object.keys(env)) {
    if (!(key in process.env)) process.env[key] = env[key];
  }
  return {
    define: {
      __COMMIT_SHA__: JSON.stringify(commitSha),
      __COMMIT_TIMESTAMP__: JSON.stringify(commitTimestamp),
    },
    optimizeDeps: {
      include: ["@braintree/sanitize-url", "dayjs"],
    },
    plugins: [
      Icons({ compiler: "jsx", jsx: "react" }),
      react(),
      blogContent(),
      vocs(),
      contentSignalsRobotsTxt(),
      pruneSitemap(),
      ...(mode !== "production" && mode !== "test"
        ? [mkcert({ force: true, hosts: ["localhost"] })]
        : []),
    ],
    // Prevent the TypeScript compiler (used by twoslash) from being bundled into
    // the server output. TypeScript uses `__filename` which doesn't exist in ESM.
    environments: {
      rsc: {
        build: {
          rollupOptions: {
            external: ["typescript"],
          },
        },
      },
    },
    ssr: {
      external: ["typescript"],
    },
    test: {
      exclude: [
        ...configDefaults.exclude,
        "e2e/**",
        "integration/**",
        "workers/**",
      ],
    },
  };
});
