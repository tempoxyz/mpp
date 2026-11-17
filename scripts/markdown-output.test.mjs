import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
function audit(root, mode, env = {}) {
  const environment = { ...process.env, ...env };
  if (!env.VOCS_MARKDOWN_VALIDATION)
    delete environment.VOCS_MARKDOWN_VALIDATION;
  const result = spawnSync(
    command,
    [
      "exec",
      "vocs",
      "markdown-audit",
      root,
      "--json",
      ...(mode ? ["--validation", mode] : []),
    ],
    {
      encoding: "utf8",
      env: environment,
    },
  );
  if (result.error) throw result.error;
  return { status: result.status, report: JSON.parse(result.stdout) };
}

describe("generated Markdown", () => {
  it("resolves a component declaration through aliases and inline usage", () => {
    const result = audit("scripts/fixtures/markdown-renderers", "fail");
    expect(result.report.diagnostics).toEqual([]);
    expect(result.status).toBe(0);
  }, 30_000);

  it("renders every page through the configured Markdown pipeline", () => {
    const { status, report } = audit(".", "fail");
    expect(report.diagnostics).toEqual([]);
    expect(status).toBe(0);
  }, 120_000);

  it.each([
    ["warn", 0],
    ["fail", 1],
  ])(
    "%s reports the same unresolved component",
    (mode, status) => {
      const result = audit("scripts/fixtures/markdown-audit", mode);
      expect(result.status).toBe(status);
      expect(result.report).toMatchObject({
        validation: mode,
        validationSource: "cli",
      });
      expect(result.report.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "unhandled-component",
            component: "MissingMarkdown",
          }),
        ]),
      );
    },
    30_000,
  );

  it("honors the emergency override without hiding diagnostics", () => {
    const result = audit("scripts/fixtures/markdown-audit", undefined, {
      VOCS_MARKDOWN_VALIDATION: "warn",
    });
    expect(result.status).toBe(0);
    expect(result.report).toMatchObject({
      validation: "warn",
      validationSource: "environment",
    });
    expect(result.report.diagnostics.length).toBeGreaterThan(0);
  }, 30_000);
});
