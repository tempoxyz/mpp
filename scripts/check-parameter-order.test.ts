import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REFERENCES_DIR = join(import.meta.dirname, "../src/pages/sdk/typescript");

function findMdxFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...findMdxFiles(path));
    else if (entry.name.endsWith(".mdx")) files.push(path);
  }

  return files;
}

function checkParameterOrder(
  content: string,
): Array<{ actual: string[]; expected: string[]; line: number }> {
  const violations: Array<{
    actual: string[];
    expected: string[];
    line: number;
  }> = [];
  const lines = content.split("\n");
  let parameters: Array<{ line: number; name: string }> = [];
  let inCodeFence = false;
  let inParameters = false;

  const checkSection = () => {
    const actual = parameters.map(({ name }) => name);
    const expected = [...actual].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    );

    if (actual.join("\0") !== expected.join("\0")) {
      violations.push({
        actual,
        expected,
        line: parameters[0]?.line ?? 1,
      });
    }
    parameters = [];
  };

  for (const [index, line] of lines.entries()) {
    if (line.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    if (line.startsWith("## ")) {
      if (inParameters) checkSection();
      inParameters = line.trim() === "## Parameters";
      continue;
    }
    if (!inParameters) continue;

    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      const name = heading[1]
        .replaceAll("`", "")
        .replace(/\s+\([^)]*\)$/, "")
        .trim();
      parameters.push({ line: index + 1, name });
    }
  }

  if (inParameters) checkSection();
  return violations;
}

describe("TypeScript reference parameter headings", () => {
  it("finds out-of-order headings without reading code fences", () => {
    expect(
      checkParameterOrder(`## Parameters

### zebra

\`\`\`ts
### ignored
\`\`\`

### alpha (optional)`),
    ).toEqual([
      {
        actual: ["zebra", "alpha"],
        expected: ["alpha", "zebra"],
        line: 3,
      },
    ]);
  });

  for (const file of findMdxFiles(REFERENCES_DIR)) {
    const relative = file.slice(REFERENCES_DIR.length + 1);

    it(relative, () => {
      const violations = checkParameterOrder(readFileSync(file, "utf8"));
      const details = violations
        .map(
          ({ actual, expected, line }) =>
            `line ${line}: ${actual.join(", ")} (expected ${expected.join(", ")})`,
        )
        .join("\n");

      expect(
        violations,
        `Parameter headings must be alphabetized:\n${details}`,
      ).toHaveLength(0);
    });
  }
});
