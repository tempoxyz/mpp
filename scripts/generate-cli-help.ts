import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const OUTPUT_PATH = path.resolve(
  import.meta.dirname,
  "../src/snippets/cli-help.txt",
);

const output = execSync("pnpm mppx --help", {
  cwd: path.resolve(import.meta.dirname, ".."),
  encoding: "utf-8",
  stdio: ["pipe", "pipe", "pipe"],
});

fs.writeFileSync(OUTPUT_PATH, output.trimEnd());

console.log(`CLI help output written to ${OUTPUT_PATH}`);
