import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGES_DIR = join(import.meta.dirname, "../src/pages");
const REQUIRED_TABS = ["npm", "pnpm", "bun"] as const;

/**
 * Recursively find all .mdx files under a directory.
 */
function findMdxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMdxFiles(fullPath));
    } else if (entry.name.endsWith(".mdx")) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Find install code-groups in MDX content and check they have all three tabs.
 * Returns an array of violations with line numbers and missing tabs.
 */
function checkInstallTabs(
  content: string,
): Array<{ line: number; missing: string[] }> {
  const lines = content.split("\n");
  const violations: Array<{ line: number; missing: string[] }> = [];

  for (let i = 0; i < lines.length; i++) {
    // Look for a bash [npm] block that contains an install command
    const line = lines[i];
    if (!/^```bash \[npm\]/.test(line)) continue;

    // Check the next line for an install command (npm install / npx)
    const cmdLine = lines[i + 1] ?? "";
    const isInstall =
      /^\$?\s*npm install\b/.test(cmdLine) || /^\$?\s*npx\b/.test(cmdLine);
    if (!isInstall) continue;

    // Scan the surrounding code-group for which tabs exist
    const found = new Set<string>(["npm"]);

    // Scan forward until ::: closing
    for (let j = i + 1; j < lines.length; j++) {
      if (/^:::$/.test(lines[j].trim())) break;
      const tabMatch = lines[j].match(/^```bash \[(npm|pnpm|bun)\]/);
      if (tabMatch) found.add(tabMatch[1]);
    }

    const missing = REQUIRED_TABS.filter((t) => !found.has(t));
    if (missing.length > 0) {
      violations.push({ line: i + 1, missing });
    }
  }

  return violations;
}

describe("install code-groups must include npm, pnpm, and bun", () => {
  const files = findMdxFiles(PAGES_DIR);

  for (const file of files) {
    const relative = file.slice(PAGES_DIR.length + 1);
    const content = readFileSync(file, "utf-8");
    const violations = checkInstallTabs(content);

    if (violations.length > 0) {
      it(`${relative}`, () => {
        const messages = violations.map(
          (v) =>
            `line ${v.line}: missing ${v.missing.map((t) => `[${t}]`).join(", ")} tab(s)`,
        );
        expect(violations).toHaveLength(0);
        // Show details on failure:
        expect.fail(`Install code-group missing tabs:\n${messages.join("\n")}`);
      });
    }
  }

  it("found mdx files to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });
});
