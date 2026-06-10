import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");

const SESSION_DOCS = [
  "src/pages/payment-methods/tempo/session.mdx",
  "src/pages/sdk/typescript/client/Method.tempo.session-manager.mdx",
  "src/pages/sdk/typescript/server/Method.tempo.session.mdx",
] as const;

const TESTNET_EXAMPLE_PATTERNS = [
  /\bchainId:\s*42431\b/,
  /\btempoModerato\b/,
  /https:\/\/rpc\.moderato\.tempo\.xyz/,
] as const;

describe("Tempo chain IDs in Sessions docs", () => {
  it("keeps runnable Sessions examples on Tempo mainnet", async () => {
    const violations: string[] = [];

    for (const file of SESSION_DOCS) {
      const content = await readFile(resolve(ROOT, file), "utf-8");
      const lines = content.split("\n");

      for (const [index, line] of lines.entries()) {
        for (const pattern of TESTNET_EXAMPLE_PATTERNS) {
          if (pattern.test(line)) violations.push(`${file}:${index + 1}  ${line.trim()}`);
        }
      }
    }

    expect(
      violations,
      `Sessions runnable examples should use Tempo mainnet; keep Moderato references to prose or network reference tables.\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});
