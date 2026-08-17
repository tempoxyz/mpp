import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE_ROOT = resolve(ROOT, "src");

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return [".mdx", ".ts", ".tsx"].includes(extname(entry.name))
        ? [path]
        : [];
    }),
  );
  return files.flat();
}

describe("agent setup documentation", () => {
  it("shows the canonical prompt before manual setup and alternatives", async () => {
    const page = await readFile(
      resolve(SOURCE_ROOT, "pages/quickstart/agent.mdx"),
      "utf8",
    );
    const prompt = page.indexOf("<AgentSetupPrompt />");
    const manualSetup = page.indexOf("## Manual setup");
    const alternatives = page.indexOf("## Other MPP clients and integrations");

    expect(prompt).toBeGreaterThan(-1);
    expect(manualSetup).toBeGreaterThan(prompt);
    expect(alternatives).toBeGreaterThan(manualSetup);
  });

  it("does not publish retired Tempo CLI commands", async () => {
    const violations: string[] = [];

    for (const file of await sourceFiles(SOURCE_ROOT)) {
      const content = await readFile(file, "utf8");
      for (const command of ["tempo add wallet", "tempo run"]) {
        if (content.includes(command))
          violations.push(`${relative(ROOT, file)}: ${command}`);
      }
    }

    expect(violations, violations.join("\n")).toHaveLength(0);
  });
});
