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
import { expandQuickstartPromptComponents } from "./src/quickstart-prompt-markdown.js";

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

// Stub the mermaid library to prevent Vocs's built-in Mermaid.client from
// bundling the full mermaid package (~2.5 MB of JS chunks). No page uses
// Vocs's ```mermaid code blocks — all diagrams use the custom
// MermaidDiagram component which renders pure SVG without mermaid.
function stubMermaid(): Plugin {
  return {
    name: "stub-mermaid",
    enforce: "pre",
    resolveId(id) {
      if (id === "mermaid") return "\0mermaid-stub";
    },
    load(id) {
      if (id === "\0mermaid-stub") {
        return `export default {
          initialize() {},
          async render() { return { svg: '<svg></svg>' } },
        }`;
      }
    },
  };
}

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

      const next = current.replace(
        /\s*<url>\s*<loc>[^<]*\/404<\/loc>\s*<lastmod>[^<]+<\/lastmod>\s*<\/url>/,
        "",
      );

      if (next !== current) await fs.writeFile(sitemapPath, next, "utf8");
    },
  };
}

// In dev, Vocs serves /llms.txt from middleware before static files. When a
// production build exists, serve that rewritten artifact so local AEO audits
// exercise the same sectioned llms.txt that ships.
function serveSectionedLlmsTxt(): Plugin {
  let outDir: string | undefined;
  return {
    name: "serve-sectioned-llms-txt",
    enforce: "pre",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir, "public");
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
        if (pathname !== "/llms.txt" && pathname !== "/llms-full.txt") {
          next();
          return;
        }

        const filePath = path.join(outDir ?? "", pathname.slice(1));
        const content = await fs.readFile(filePath, "utf8").catch((error) => {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
          throw error;
        });
        if (!content) {
          next();
          return;
        }

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(content);
      });
    },
  };
}

// Vocs emits a flat llms.txt. Group it into stable sections and trim long
// descriptions so the short index stays below the 5K-token agent budget.
function sectionLlmsTxt(): Plugin {
  let outDir: string | undefined;
  return {
    name: "section-llms-txt",
    enforce: "post",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir, "public");
    },
    async closeBundle() {
      if (!outDir) return;

      const llmsPath = path.join(outDir, "llms.txt");
      const current = await fs.readFile(llmsPath, "utf8").catch((error) => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      });
      if (!current || current.includes("\n## Quickstart\n")) return;

      const lines = current.split("\n");
      const firstEntry = lines.findIndex((line) => line.startsWith("- ["));
      if (firstEntry === -1) return;

      const intro = lines.slice(0, firstEntry);
      const entries = lines
        .slice(firstEntry)
        .filter((line) => line.trim())
        .map(trimLlmsEntry);
      const groups = new Map<string, string[]>();
      for (const entry of entries) {
        const group = llmsGroupForEntry(entry);
        groups.set(group, [...(groups.get(group) ?? []), entry]);
      }

      const orderedGroups = [
        "Quickstart",
        "Guides",
        "Protocol",
        "Payment methods",
        "SDKs",
        "Services and ecosystem",
        "Blog",
        "Other",
      ];

      const next = [
        ...intro,
        ...orderedGroups.flatMap((group) => {
          const items = groups.get(group);
          if (!items?.length) return [];
          return [`## ${group}`, "", ...items, ""];
        }),
      ].join("\n");

      if (next !== current) await fs.writeFile(llmsPath, next, "utf8");
    },
  };
}

// Vocs serializes unknown MDX components as JSX in generated Markdown and LLM
// artifacts. Expand quickstart prompt components into the prompt text agents
// consume, without changing how the interactive docs pages render.
function expandPromptComponents(): Plugin {
  let outDir: string | undefined;
  return {
    name: "expand-prompt-components",
    enforce: "post",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir, "public");
    },
    async closeBundle() {
      if (!outDir) return;

      for (const file of await agentFacingGeneratedFiles(outDir)) {
        const current = await fs.readFile(file, "utf8").catch((error) => {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
          throw error;
        });
        if (!current) continue;

        const next = expandQuickstartPromptComponents(current);
        if (next !== current) await fs.writeFile(file, next, "utf8");
      }
    },
  };
}

async function agentFacingGeneratedFiles(outDir: string): Promise<string[]> {
  return [
    path.join(outDir, "llms-full.txt"),
    path.join(outDir, "llms.txt"),
    ...(await generatedMarkdownFiles(path.join(outDir, "assets", "md"))),
  ];
}

async function generatedMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await fs
    .readdir(directory, { withFileTypes: true })
    .catch((error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    });

  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await generatedMarkdownFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(entryPath);
    }
  }
  return files;
}

// Keep each llms.txt row useful while preventing verbose frontmatter
// descriptions from pushing the whole index over the scanner's token limit.
function trimLlmsEntry(entry: string): string {
  const [link, description] = entry.split(": ", 2);
  if (!description || description.length <= 90) return entry;
  return `${link}: ${description.slice(0, 87).trimEnd()}...`;
}

// Map generated page paths into coarse documentation areas. These names are
// intentionally broad so new pages fall into predictable agent-facing sections.
function llmsGroupForEntry(entry: string): string {
  const pathMatch = entry.match(/\]\(([^)]+)\)/);
  const pagePath = pathMatch?.[1] ?? "";

  if (
    pagePath === "/index" ||
    pagePath.startsWith("/quickstart") ||
    pagePath === "/overview" ||
    pagePath === "/governance" ||
    pagePath === "/faq"
  )
    return "Quickstart";
  if (pagePath.startsWith("/guides")) return "Guides";
  if (pagePath.startsWith("/protocol") || pagePath.startsWith("/advanced"))
    return "Protocol";
  if (
    pagePath.startsWith("/payment-methods") ||
    pagePath.startsWith("/intents")
  )
    return "Payment methods";
  if (pagePath.startsWith("/sdk")) return "SDKs";
  if (
    pagePath.startsWith("/services") ||
    pagePath.startsWith("/use-cases") ||
    pagePath.startsWith("/extensions") ||
    pagePath.startsWith("/partner-integrations") ||
    pagePath === "/brand" ||
    pagePath === "/mpp-vs-x402"
  )
    return "Services and ecosystem";
  if (pagePath.startsWith("/blog")) return "Blog";
  return "Other";
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
      preloadFonts(),
      stubRehypeMermaid(),
      stubMermaid(),
      Icons({ compiler: "jsx", jsx: "react" }),
      react(),
      serveSectionedLlmsTxt(),
      vocs(),
      contentSignalsRobotsTxt(),
      pruneSitemap(),
      sectionLlmsTxt(),
      expandPromptComponents(),
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
      exclude: [...configDefaults.exclude, "e2e/**", "workers/**"],
    },
  };
});
