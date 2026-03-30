import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const PAGES_DIR = resolve(import.meta.dirname, "../src/pages");

/** Matches `0x` followed by exactly 40 hex characters (word-bounded on the right). */
const ADDRESS_RE = /0x[0-9a-fA-F]{40}\b/g;

/** Well-known addresses that are allowed in documentation. */
const ALLOWED_ADDRESSES: ReadonlySet<string> = new Set(
  [
    // Foundry test accounts (test test test ... junk)
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account 0
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account 1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account 2
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account 3
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Account 4
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", // Account 5
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9", // Account 6
    "0x14dC79964da2C08dA15Fd60A894349546AA96595", // Account 7
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f", // Account 8
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720", // Account 9

    // Known Tempo contract addresses
    "0x20c0000000000000000000000000000000000000", // pathUSD
    "0x20c0000000000000000000000000000000000001", // another TIP-20
    "0x20C000000000000000000000b9537d11c60E8b50", // USDC.e (Bridged USDC) on Tempo
    "0x0000000000000000000000000000000000000001", // native token
    "0x33b901018174DDabE4841042ab76ba85D4e24f25", // Mainnet payment channel
    "0x9d136eEa063eDE5418A6BC7bEafF009bBb6CFa70", // Testnet payment channel (deprecated)
    "0xe1c4d3dce17bc111181ddf716f75bae49e61a336", // Testnet payment channel

    // Placeholder/example addresses
    "0x1234567890abcdef1234567890abcdef12345678", // generic placeholder
    "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00", // Challenge.fromMethod example
  ].map((a) => a.toLowerCase()),
);

async function collectMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMdxFiles(full)));
    } else if (entry.name.endsWith(".mdx")) {
      files.push(full);
    }
  }
  return files;
}

describe("doc addresses", () => {
  it("only uses well-known addresses in .mdx files", async () => {
    const files = await collectMdxFiles(PAGES_DIR);
    const violations: string[] = [];

    for (const filePath of files) {
      const content = await readFile(filePath, "utf-8");
      const rel = filePath.replace(
        `${resolve(import.meta.dirname, "..")}/`,
        "",
      );

      for (const [lineIdx, line] of content.split("\n").entries()) {
        for (const match of line.matchAll(ADDRESS_RE)) {
          if (!ALLOWED_ADDRESSES.has(match[0].toLowerCase())) {
            violations.push(`${rel}:${lineIdx + 1}  ${match[0]}`);
          }
        }
      }
    }

    expect(
      violations,
      `Unknown addresses found:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });
});
