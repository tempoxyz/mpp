import * as fs from "node:fs";
import * as path from "node:path";
import { get_encoding } from "tiktoken";

const ENCODING = "o200k_base";
const DEFAULT_THRESHOLD = 100_000;

export function countTokens(text: string): number {
  const enc = get_encoding(ENCODING);
  const count = enc.encode(text).length;
  enc.free();
  return count;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath =
    process.argv[2] ??
    path.resolve(import.meta.dirname, "../dist/public/llms-full.txt");
  const threshold = Number(process.env.TOKEN_THRESHOLD ?? DEFAULT_THRESHOLD);

  const text = fs.readFileSync(filePath, "utf-8");
  const count = countTokens(text);
  const overThreshold = count > threshold;

  console.log(`Tokens: ${count.toLocaleString()}`);
  console.log(`Threshold: ${threshold.toLocaleString()}`);
  console.log(`Status: ${overThreshold ? "Over" : "Under"}`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `token_count=${count}\nover_threshold=${overThreshold}\n`,
    );
  }
}
