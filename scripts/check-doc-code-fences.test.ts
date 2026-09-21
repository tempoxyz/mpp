import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import packageJson from "../package.json";

const PAGES_DIR = join(import.meta.dirname, "../src/pages");
const TYPESCRIPT_SDK_DIR = join(PAGES_DIR, "sdk/typescript");
const PACKAGE_MANAGER_LABELS = new Map([
  ["bun", /^\$ (?:bun|bunx)\b/m],
  ["npm", /^\$ (?:npm|npx)\b/m],
  ["pnpm", /^\$ pnpm\b/m],
]);

function findMdxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findMdxFiles(path);
    return entry.name.endsWith(".mdx") ? [path] : [];
  });
}

function checkBashFences(
  content: string,
): Array<{ label: string; line: number }> {
  const lines = content.split("\n");
  const violations: Array<{ label: string; line: number }> = [];

  for (const [index, line] of lines.entries()) {
    const match = line.match(/^```bash(?: \[([^\]]+)\])?$/);
    if (!match) continue;

    const label = match[1] ?? "";
    if (label === "test.sh") continue;

    const commandPattern = PACKAGE_MANAGER_LABELS.get(label);
    if (commandPattern) {
      const closingFence = lines.indexOf("```", index + 1);
      const block = lines.slice(index + 1, closingFence).join("\n");
      if (commandPattern.test(block)) continue;
    }

    violations.push({ label: label || "unlabeled", line: index + 1 });
  }

  return violations;
}

function packageName(specifier: string): string {
  if (!specifier.startsWith("@")) return specifier.split("/")[0];
  return specifier.split("/").slice(0, 2).join("/");
}

function checkUsageTwoslash(content: string): number[] {
  const installedPackages = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ]);
  const lines = content.split("\n");
  const violations: number[] = [];
  let inUsage = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.startsWith("## ")) inUsage = line === "## Usage";
    if (!inUsage || !/^```ts(?: |$)/.test(line)) continue;

    if (/^```ts twoslash(?: |$)/.test(line)) break;

    const closingFence = lines.indexOf("```", index + 1);
    const block = lines.slice(index + 1, closingFence).join("\n");
    const imports = [...block.matchAll(/from ['"]([^'"]+)['"]/g)].map(
      ([, specifier]) => specifier,
    );
    const canTypecheck =
      imports.length > 0 &&
      imports.every(
        (specifier) =>
          specifier.startsWith(".") ||
          specifier.startsWith("node:") ||
          installedPackages.has(packageName(specifier)),
      );
    if (canTypecheck) violations.push(index + 1);
    break;
  }

  return violations;
}

describe("documentation code fences", () => {
  it("detects invalid bash labels", () => {
    expect(checkBashFences("```bash [terminal]\n$ mppx --help\n```")).toEqual([
      { label: "terminal", line: 1 },
    ]);
    expect(checkBashFences("```bash [test.sh]\n$ mppx --help\n```")).toEqual(
      [],
    );
    expect(checkBashFences("```bash [npm]\n$ npm install mppx\n```")).toEqual(
      [],
    );
  });

  it("detects typecheckable Usage examples without twoslash", () => {
    expect(
      checkUsageTwoslash(
        "## Usage\n\n```ts [example.ts]\nimport { Hono } from 'hono'\n```",
      ),
    ).toEqual([3]);
    expect(
      checkUsageTwoslash(
        "## Usage\n\n```ts twoslash [example.ts]\nimport { Hono } from 'hono'\n```",
      ),
    ).toEqual([]);
  });

  for (const file of findMdxFiles(PAGES_DIR)) {
    const relative = file.slice(PAGES_DIR.length + 1);
    const violations = checkBashFences(readFileSync(file, "utf8"));

    it(`${relative} uses standard bash fence labels`, () => {
      expect(
        violations,
        violations
          .map(({ label, line }) => `line ${line}: [${label}]`)
          .join("\n"),
      ).toHaveLength(0);
    });
  }

  for (const file of findMdxFiles(TYPESCRIPT_SDK_DIR)) {
    const relative = file.slice(TYPESCRIPT_SDK_DIR.length + 1);
    const violations = checkUsageTwoslash(readFileSync(file, "utf8"));

    it(`${relative} typechecks self-contained Usage examples`, () => {
      expect(
        violations,
        violations.map((line) => `line ${line}: add twoslash`).join("\n"),
      ).toHaveLength(0);
    });
  }
});
