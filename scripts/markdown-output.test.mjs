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
});
