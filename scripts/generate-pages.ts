import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const pagesDir = resolve(root, "src/pages");
const outputPath = resolve(root, "src/pages.gen.ts");

const require = createRequire(import.meta.url);
const vocsEntry = require.resolve("vocs");
const typegenPath = resolve(
  dirname(vocsEntry),
  "waku/internal/patches/vite-plugins/fs-router-typegen.js",
);

const { generateFsRouterTypes } = (await import(
  pathToFileURL(typegenPath).href
)) as {
  generateFsRouterTypes: (
    pagesDir: string,
  ) => Promise<string | null | undefined>;
};

if (!existsSync(pagesDir)) {
  throw new Error(`Pages directory not found: ${pagesDir}`);
}

const generated = await generateFsRouterTypes(pagesDir);
if (!generated) {
  throw new Error("Failed to generate src/pages.gen.ts");
}

const current = existsSync(outputPath)
  ? readFileSync(outputPath, "utf-8")
  : undefined;

if (current !== generated) {
  writeFileSync(outputPath, generated, "utf-8");
}

console.log("Generated src/pages.gen.ts");
