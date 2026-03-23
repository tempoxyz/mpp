import { describe, expect, it } from "vitest";
import {
  getLabels,
  labelsFromPaths,
  labelsFromTokens,
  matchesGlob,
} from "./label-pr.js";

describe("matchesGlob", () => {
  it("matches exact file", () => {
    expect(matchesGlob("schemas/services.ts", "schemas/services.ts")).toBe(
      true,
    );
  });

  it("matches wildcard extension", () => {
    expect(matchesGlob("schemas/discovery.json", "schemas/discovery.*")).toBe(
      true,
    );
    expect(
      matchesGlob("schemas/discovery.example.json", "schemas/discovery.*"),
    ).toBe(true);
  });

  it("matches single-level glob", () => {
    expect(matchesGlob("scripts/sync-logos.ts", "scripts/*")).toBe(true);
    expect(matchesGlob("scripts/nested/file.ts", "scripts/*")).toBe(false);
  });

  it("matches globstar", () => {
    expect(matchesGlob("src/pages/sdk/python/index.mdx", "src/pages/**")).toBe(
      true,
    );
    expect(
      matchesGlob(
        "src/pages/sdk/typescript/client/Fetch.from.mdx",
        "src/pages/sdk/**",
      ),
    ).toBe(true);
    expect(matchesGlob("src/components/Terminal.tsx", "src/pages/**")).toBe(
      false,
    );
  });

  it("matches globstar prefix", () => {
    expect(matchesGlob("src/pages/llms.txt", "**/llms*")).toBe(true);
    expect(matchesGlob("llms-full.txt", "**/llms*")).toBe(true);
  });

  it("rejects non-matching paths", () => {
    expect(matchesGlob("README.md", "schemas/services.ts")).toBe(false);
  });
});

describe("labelsFromPaths", () => {
  it("labels service directory changes", () => {
    const labels = labelsFromPaths(["schemas/services.ts"]);
    expect(labels).toContain("service-directory");
  });

  it("labels discovery file changes", () => {
    const labels = labelsFromPaths(["schemas/discovery.json"]);
    expect(labels).toContain("service-directory");
  });

  it("labels docs changes", () => {
    const labels = labelsFromPaths(["src/pages/overview.mdx"]);
    expect(labels).toContain("docs");
  });

  it("labels sdk-docs as both docs and sdk-docs", () => {
    const labels = labelsFromPaths([
      "src/pages/sdk/typescript/client/Fetch.from.mdx",
    ]);
    expect(labels).toContain("docs");
    expect(labels).toContain("sdk-docs");
  });

  it("labels infra changes", () => {
    const labels = labelsFromPaths([".github/workflows/ci.yml"]);
    expect(labels).toContain("infra");
  });

  it("labels component changes", () => {
    const labels = labelsFromPaths(["src/components/Terminal.tsx"]);
    expect(labels).toContain("components");
  });

  it("labels config changes", () => {
    const labels = labelsFromPaths(["biome.json"]);
    expect(labels).toContain("config");
  });

  it("labels llms changes", () => {
    const labels = labelsFromPaths(["src/pages/llms.txt"]);
    expect(labels).toContain("llms");
  });

  it("returns multiple labels for mixed changes", () => {
    const labels = labelsFromPaths([
      "schemas/services.ts",
      ".github/workflows/ci.yml",
    ]);
    expect(labels).toContain("service-directory");
    expect(labels).toContain("infra");
  });

  it("returns empty for unmatched files", () => {
    const labels = labelsFromPaths(["README.md", "LICENSE-MIT"]);
    expect(labels).toEqual([]);
  });
});

describe("labelsFromTokens", () => {
  it("matches [service] token in title", () => {
    const labels = labelsFromTokens("[service] Add new API", "");
    expect(labels).toContain("service-directory");
  });

  it("matches documentation token in body", () => {
    const labels = labelsFromTokens("Update guide", "Fix documentation typo");
    expect(labels).toContain("docs");
  });

  it("is case-insensitive", () => {
    const labels = labelsFromTokens("[DOCS] Fix heading", "");
    expect(labels).toContain("docs");
  });

  it("returns empty when no tokens match", () => {
    const labels = labelsFromTokens("Fix typo", "Small change");
    expect(labels).toEqual([]);
  });
});

describe("getLabels", () => {
  it("uses path labels when files match", () => {
    const labels = getLabels(["schemas/services.ts"], "[docs] something", "");
    expect(labels).toContain("service-directory");
    expect(labels).not.toContain("docs");
  });

  it("falls back to tokens when no path matches", () => {
    const labels = getLabels(["README.md"], "[docs] Fix readme", "");
    expect(labels).toContain("docs");
  });

  it("returns empty when nothing matches", () => {
    const labels = getLabels(["README.md"], "Fix typo", "Minor edit");
    expect(labels).toEqual([]);
  });
});
