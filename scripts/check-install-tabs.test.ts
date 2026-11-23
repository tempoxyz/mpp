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
    const opening = lines[i].match(/^(:{3,4})code-group$/);
    if (!opening) continue;

    const end = lines.indexOf(opening[1], i + 1);
    if (end === -1) continue;

    const group = lines.slice(i + 1, end);
    const isInstall = group.some((line) =>
      /^\$?\s*(?:npm install|npx|pnpm add|pnpm dlx|bun add|bunx)\b/.test(line),
    );
    if (!isInstall) continue;

    const found = new Set(
      group.flatMap((line) => {
        const tabMatch = line.match(/^```bash \[(npm|pnpm|bun)\]$/);
        return tabMatch ? [tabMatch[1]] : [];
      }),
    );

    const missing = REQUIRED_TABS.filter((t) => !found.has(t));
    if (missing.length > 0) {
      violations.push({ line: i + 1, missing });
    }
  }

  return violations;
}

describe("install code-groups must include npm, pnpm, and bun", () => {
  it("detects install groups with framework labels", () => {
    const content = `:::code-group
\`\`\`bash [Next.js]
$ npm install mppx
\`\`\`
\`\`\`bash [Hono]
$ npm install mppx hono
\`\`\`
:::`;

    expect(checkInstallTabs(content)).toEqual([
      { line: 1, missing: ["npm", "pnpm", "bun"] },
    ]);
  });

  it("accepts npm, pnpm, and bun install tabs", () => {
    const content = `:::code-group
\`\`\`bash [npm]
$ npm install mppx
\`\`\`
\`\`\`bash [pnpm]
$ pnpm add mppx
\`\`\`
\`\`\`bash [bun]
$ bun add mppx
\`\`\`
:::`;

    expect(checkInstallTabs(content)).toEqual([]);
  });

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
