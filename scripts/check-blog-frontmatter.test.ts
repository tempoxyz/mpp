import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const BLOG_DIR = join(import.meta.dirname, "../src/pages/blog");

const REQUIRED_FIELDS = [
  "layout",
  "outline",
  "showAskAi",
  "showFeedback",
  "showSearch",
  "description",
  "imageDescription",
] as const;

const EXPECTED_VALUES: Record<string, unknown> = {
  layout: "minimal",
  outline: false,
  showAskAi: false,
  showFeedback: false,
  showSearch: false,
};

/**
 * Parse YAML frontmatter from MDX content.
 * Returns null if no frontmatter block is found.
 */
function parseFrontmatter(
  content: string,
): Record<string, string | boolean> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fields: Record<string, string | boolean> = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (!kv) continue;
    const [, key, raw] = kv;
    // Strip surrounding quotes
    const value = raw.replace(/^"(.*)"$/, "$1");
    if (value === "true") fields[key] = true;
    else if (value === "false") fields[key] = false;
    else fields[key] = value;
  }
  return fields;
}

describe("blog post frontmatter", () => {
  const files = readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") && f !== "index.mdx")
    .map((f) => join(BLOG_DIR, f));

  it("found blog posts to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const name = file.slice(BLOG_DIR.length + 1);

    it(`${name} has valid frontmatter`, () => {
      const content = readFileSync(file, "utf-8");
      const fm = parseFrontmatter(content);
      expect(fm, "missing frontmatter block").not.toBeNull();

      const missing = REQUIRED_FIELDS.filter((f) => !(f in fm!));
      expect(missing, `missing fields: ${missing.join(", ")}`).toHaveLength(0);

      for (const [key, expected] of Object.entries(EXPECTED_VALUES)) {
        expect(fm![key], `${key} should be ${expected}`).toBe(expected);
      }

      expect(
        typeof fm!.description === "string" && fm!.description.length > 0,
        "description must be a non-empty string",
      ).toBe(true);

      expect(
        typeof fm!.imageDescription === "string" &&
          fm!.imageDescription.length > 0,
        "imageDescription must be a non-empty string",
      ).toBe(true);
    });
  }
});
