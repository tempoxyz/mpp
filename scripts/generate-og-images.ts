import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const OUT_DIR = resolve(process.env.HOME!, "Desktop/og-images");
const BASE = process.env.OG_BASE_URL || "http://localhost:5199";
const PAGES_DIR = resolve(import.meta.dirname!, "../src/pages");

interface Route {
  path: string;
  title: string;
  category: string;
  description: string;
}

function extractDescription(pagePath: string): string {
  // Try to find the MDX file for this route
  const candidates = [
    join(PAGES_DIR, `${pagePath}.mdx`),
    join(PAGES_DIR, `${pagePath}/index.mdx`),
    join(PAGES_DIR, `${pagePath}.md`),
  ];

  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf-8");

    // Vocs convention: # Title [Description in brackets]
    const bracketMatch = content.match(/^#\s+[^[\n]+\[([^\]]+)\]/m);
    if (bracketMatch) return bracketMatch[1].trim();

    // Frontmatter description
    const fmMatch = content.match(
      /^---[\s\S]*?description:\s*["']?([^\n"']+)/m,
    );
    if (fmMatch) return fmMatch[1].trim();

    // First real paragraph (skip imports, headings, empty lines, components)
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("#")) continue;
      if (trimmed.startsWith("import ")) continue;
      if (trimmed.startsWith("---")) continue;
      if (trimmed.startsWith("<")) continue;
      if (trimmed.startsWith(":::")) continue;
      if (trimmed.startsWith("```")) continue;
      if (trimmed.startsWith("-")) continue;
      // Found a paragraph
      return trimmed.length > 120 ? trimmed.slice(0, 117) + "..." : trimmed;
    }
  }
  return "";
}

function extractRoutes(): Route[] {
  const configSrc = readFileSync(
    resolve(import.meta.dirname!, "../vocs.config.ts"),
    "utf-8",
  );
  const routes: Route[] = [];
  const seen = new Set<string>();

  const sidebarMatch = configSrc.match(
    /sidebar:\s*\{[\s\S]*?\n\s*\},\s*\n\s*socials:/,
  );
  if (!sidebarMatch) {
    console.error("Could not find sidebar config");
    process.exit(1);
  }
  const sidebar = sidebarMatch[0];

  const topSections = [
    "Introduction",
    "Quick Start",
    "Guides",
    "Protocol",
    "Payment Methods & Intents",
    "SDKs",
    "Resources",
  ];

  // Find ALL link items (including inside collapsed groups)
  const linkPattern = /\{\s*text:\s*"([^"]+)",\s*link:\s*"(\/[^"]+)"\s*\}/g;
  for (const match of sidebar.matchAll(linkPattern)) {
    const title = match[1];
    const path = match[2];
    if (seen.has(path)) continue;
    seen.add(path);

    const pos = match.index!;
    let category = "";
    let bestPos = -1;
    for (const sec of topSections) {
      const secIdx = sidebar.lastIndexOf(`text: "${sec}"`, pos);
      if (secIdx !== -1 && secIdx > bestPos) {
        bestPos = secIdx;
        category = sec;
      }
    }

    const ogDescs: Record<string, string> = JSON.parse(
      readFileSync(
        resolve(import.meta.dirname!, "og-descriptions.json"),
        "utf-8",
      ),
    );
    const description = ogDescs[path] || extractDescription(path);
    routes.push({ path, title, category, description });
  }

  routes.push({
    path: "/services",
    title: "Services",
    category: "Services",
    description: "",
  });

  return routes;
}

async function main() {
  const routes = extractRoutes();
  console.log(`Found ${routes.length} unique routes\n`);

  mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  let fail = 0;

  for (const route of routes) {
    const params = new URLSearchParams({
      title: route.title,
      description: route.description,
      path: route.path,
    });
    const url = `${BASE}/api/og?${params}`;
    const filename =
      route.path.replace(/\//g, "_").replace(/^_/, "") || "index";

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        console.log(
          `  FAIL ${route.path} -> ${res.status}: ${text.slice(0, 80)}`,
        );
        fail++;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const { writeFileSync } = await import("node:fs");
      writeFileSync(resolve(OUT_DIR, `${filename}.png`), buf);
      const desc = route.description
        ? ` | "${route.description.slice(0, 40)}..."`
        : "";
      console.log(
        `  OK   [${route.category}] ${route.path} -> ${filename}.png (title: "${route.title}"${desc})`,
      );
      ok++;
    } catch (e: any) {
      console.log(`  FAIL ${route.path} -> ${e.message}`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed -> ${OUT_DIR}`);
}

main().catch(console.error);
