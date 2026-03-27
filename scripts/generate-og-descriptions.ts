import * as fs from "node:fs";
import * as path from "node:path";

const PAGES_DIR = path.resolve(import.meta.dirname, "../src/pages");
const OUTPUT_PATH = path.resolve(
  import.meta.dirname,
  "../src/generated/og-descriptions.json",
);

function extractOgDescription(content: string): string | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = match[1];
  const descMatch = fm.match(/^imageDescription:\s*"(.+)"\s*$/m);
  return descMatch ? descMatch[1] : null;
}

function filePathToRoute(filePath: string): string {
  let route = path.relative(PAGES_DIR, filePath);
  route = route.replace(/\.mdx?$/, "");
  route = route.replace(/\/index$/, "");
  return `/${route}`;
}

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith("_")) continue;
      results.push(...walk(full));
    } else if (entry.name.endsWith(".mdx")) {
      results.push(full);
    }
  }
  return results;
}

const descriptions: Record<string, string> = {};

for (const file of walk(PAGES_DIR).sort()) {
  const content = fs.readFileSync(file, "utf-8");
  const desc = extractOgDescription(content);
  if (desc) {
    descriptions[filePathToRoute(file)] = desc;
  }
}

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(descriptions, null, 2)}\n`);

console.log(
  `OG descriptions: ${Object.keys(descriptions).length} pages → ${OUTPUT_PATH}`,
);
