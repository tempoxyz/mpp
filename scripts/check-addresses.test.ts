import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PaymentRequest } from "mppx";
import { describe, expect, it } from "vitest";

const DOCS_DIRS = ["../src/pages", "../skills"].map((dir) =>
  resolve(import.meta.dirname, dir),
);

/** Also match malformed TIP-20 literals so truncated addresses cannot bypass the allowlist. */
const ADDRESS_RE = /0x(?:20c[0-9a-f]*|[0-9a-f]{40})\b/gi;

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
    "0x20c0000000000000000000006a37DA5C996874BE", // OUSD
    "0x20c0000000000000000000000000000000000000", // pathUSD
    "0x20c0000000000000000000000000000000000001", // another TIP-20
    "0x20c000000000000000000000f37de3740ADec032", // MACH
    "0x20C000000000000000000000b9537d11c60E8b50", // USDC.e (Bridged USDC) on Tempo
    "0x0000000000000000000000000000000000000001", // native token
    "0x33b901018174DDabE4841042ab76ba85D4e24f25", // Mainnet payment channel
    "0x4d50500000000000000000000000000000000000", // TIP-1034 reserve precompile
    "0x9d136eEa063eDE5418A6BC7bEafF009bBb6CFa70", // Testnet payment channel (deprecated)
    "0xe1c4d3dce17bc111181ddf716f75bae49e61a336", // Testnet payment channel

    // Known Monad contract addresses
    "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", // USDC on Monad

    // Known Arbitrum contract addresses
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC on Arbitrum One

    // Placeholder/example addresses
    "0x1234567890abcdef1234567890abcdef12345678", // generic placeholder
    "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00", // Challenge.fromMethod example
  ].map((a) => a.toLowerCase()),
);

async function collectDocFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectDocFiles(full)));
    } else if (/\.mdx?$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function* decodedExamples(text: string): Generator<string> {
  yield text;
  for (const match of text.matchAll(/eyJ[A-Za-z0-9_-]+/g)) {
    const decoded = Buffer.from(match[0], "base64url").toString("utf-8");
    try {
      JSON.parse(decoded);
    } catch {
      continue; // Abbreviated serialized output isn't a complete JSON example.
    }
    yield* decodedExamples(decoded);
  }
}

describe("doc addresses", () => {
  it.each([
    "0x20c",
    "0x20c0",
    "0x20c000000000",
    "0x20C000000000",
  ])("rejects truncated TIP-20 literal %s", (address) => {
    const matches = [...`currency: '${address}'`.matchAll(ADDRESS_RE)];
    expect(matches.map((match) => match[0])).toEqual([address]);
    expect(ALLOWED_ADDRESSES.has(address.toLowerCase())).toBe(false);
  });

  it("uses complete, well-known currency addresses in docs and skills", async () => {
    const files = (await Promise.all(DOCS_DIRS.map(collectDocFiles))).flat();
    const violations: string[] = [];

    for (const filePath of files) {
      const content = await readFile(filePath, "utf-8");
      const rel = filePath.replace(
        `${resolve(import.meta.dirname, "..")}/`,
        "",
      );

      for (const [lineIdx, line] of content.split("\n").entries()) {
        for (const example of decodedExamples(line)) {
          for (const match of example.matchAll(ADDRESS_RE)) {
            if (!ALLOWED_ADDRESSES.has(match[0].toLowerCase())) {
              violations.push(`${rel}:${lineIdx + 1}  ${match[0]}`);
            }
          }
          if (
            /["']?currenc(?:y|ies)["']?\s*:\s*\[?["']0x(?:\.\.\.|…)/.test(
              example,
            )
          ) {
            violations.push(
              `${rel}:${lineIdx + 1}  Placeholder currency address`,
            );
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

it("keeps PaymentRequest serialization examples consistent", async () => {
  const coreDir = resolve(
    import.meta.dirname,
    "../src/pages/sdk/typescript/core",
  );
  const serialize = await readFile(
    resolve(coreDir, "PaymentRequest.serialize.mdx"),
    "utf-8",
  );
  const deserialize = await readFile(
    resolve(coreDir, "PaymentRequest.deserialize.mdx"),
    "utf-8",
  );
  function property(name: string): string {
    const match = serialize.match(new RegExp(`${name}: '([^']+)'`));
    if (!match) throw new Error(`Missing documented ${name}`);
    return match[1];
  }
  const request = PaymentRequest.from({
    amount: property("amount"),
    currency: property("currency"),
    recipient: property("recipient"),
  });
  const encoded = PaymentRequest.serialize(request);
  expect(serialize).toContain(`"${encoded}"`);
  expect(deserialize).toContain(`'${encoded}'`);
});
