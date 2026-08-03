import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

describe("generated Markdown", () => {
  it("renders every page through the configured Markdown pipeline", () => {
    const output = execFileSync(
      command,
      ["exec", "vocs", "markdown-audit", "--json"],
      { encoding: "utf8" },
    );

    expect(JSON.parse(output)).toEqual({ components: [], errors: [] });
  }, 30_000);

  it("rejects components without Markdown output", () => {
    let failure;

    try {
      execFileSync(
        command,
        [
          "exec",
          "vocs",
          "markdown-audit",
          "scripts/fixtures/markdown-audit",
          "--json",
        ],
        { encoding: "utf8" },
      );
    } catch (error) {
      failure = error;
    }

    expect(failure).toMatchObject({ status: 1 });
    expect(JSON.parse(failure.stdout)).toEqual({
      components: [
        {
          count: 1,
          name: "MissingMarkdown",
          pages: [{ count: 1, path: "/" }],
          unsupportedUsages: 0,
        },
      ],
      errors: [],
    });
  }, 30_000);
});
