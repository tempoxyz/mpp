import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");
const PAGES = resolve(ROOT, "src/pages");

/** Dated blog posts keep the networks they were written for. */
const EXCLUDED_DIRS = ["src/pages/blog"] as const;

/**
 * Code lines that must show mainnet, as `<file>:<line>`. Keep it empty: put
 * mainnet in a Go live note or a network reference table instead.
 */
const ALLOWLIST: readonly string[] = [];

const MAINNET_PATTERNS = [
  // chainId, allowedChainIds, expectedChainId, chain_id, ChainID, ...
  /(?:chain_?ids?)\s*[:=]\s*\[?\s*4217\b/i,
  /\beip155:4217\b/,
  /\bchain:\s*tempo\b(?!Moderato)/,
  /\bimport\s*\{[^}]*\btempo\b(?!Moderato)[^}]*\}\s*from\s*['"]viem\/chains['"]/,
  /\btestnet:\s*false\b/,
  /--network mainnet/,
  /https:\/\/rpc\.tempo\.xyz/,
  /\btempo as tempoMainnet\b/,
  // mppx resolves an unpinned request to mainnet; mpp.dev charges on testnet
  /\bmppx\b(?![.\w])(?=.*\bmpp\.dev\/)(?![^#]*--network[\s=]+testnet)/,
  // Paid requests to your own testnet server need the same pin
  /\bmppx\b(?![.\w/-])(?!\s+(?:validate|discover|account|sessions|sign|init)\b)(?=[^#]*(?:<your-server>|\blocalhost\b|\b127\.0\.0\.1\b))(?![^#]*--network[\s=]+testnet)/,
] as const;

async function listMdx(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    const rel = relative(ROOT, path);
    if (EXCLUDED_DIRS.some((excluded) => rel.startsWith(excluded))) continue;
    if (entry.isDirectory()) files.push(...(await listMdx(path)));
    else if (entry.name.endsWith(".mdx")) files.push(path);
  }
  return files;
}

describe("Tempo networks in docs examples", () => {
  it("keeps code examples on Tempo testnet (Moderato)", async () => {
    const violations: string[] = [];

    for (const path of await listMdx(PAGES)) {
      const file = relative(ROOT, path);
      const lines = (await readFile(path, "utf-8")).split("\n");
      let fence: string | undefined;

      for (const [index, line] of lines.entries()) {
        const trimmed = line.trim();
        const marker = trimmed.match(/^(`{3,}|~{3,})/)?.[1];
        if (marker) {
          if (!fence) fence = marker;
          else if (
            trimmed === marker &&
            marker[0] === fence[0] &&
            marker.length >= fence.length
          )
            fence = undefined;
          continue;
        }
        if (!fence) continue;

        const location = `${file}:${index + 1}`;
        if (ALLOWLIST.includes(location)) continue;
        for (const pattern of MAINNET_PATTERNS) {
          if (pattern.test(line)) violations.push(`${location}  ${trimmed}`);
        }
      }
    }

    expect(
      violations,
      `Code examples must use Tempo testnet (testnet: true, chainId 42431, tempoModerato, --network testnet); mention mainnet only in a Go live note or network reference table.\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});
