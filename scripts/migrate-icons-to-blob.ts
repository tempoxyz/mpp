import * as fs from "node:fs";
import * as path from "node:path";
import { put } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN is required. Set it in your env.");
  process.exit(1);
}

const iconsDir = path.resolve(import.meta.dirname, "../public/icons");

async function migrate() {
  const files = fs
    .readdirSync(iconsDir)
    .filter((f) => f.endsWith(".svg"))
    .sort();

  console.log(`Found ${files.length} SVGs to migrate.\n`);

  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const svg = fs.readFileSync(path.join(iconsDir, file), "utf-8");
    try {
      const { url } = await put(`icons/${file}`, svg, {
        access: "public",
        allowOverwrite: true,
        contentType: "image/svg+xml",
        addRandomSuffix: false,
        token: BLOB_TOKEN,
      });
      console.log(`  ✓ ${file} → ${url}`);
      uploaded++;
    } catch (e) {
      console.error(`  ✗ ${file}:`, e);
      failed++;
    }
  }

  console.log(`\nDone. ${uploaded} uploaded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

migrate();
