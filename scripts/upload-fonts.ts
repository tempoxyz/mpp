import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { list, put } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN) {
  console.error("Set BLOB_READ_WRITE_TOKEN env var");
  process.exit(1);
}

const fontsDir = resolve(import.meta.dirname!, "../public/fonts");
const files = [
  "VTCDuBois-Regular.woff2",
  "VTCDuBois-Bold.woff2",
  "VTCDuBois-Regular.ttf",
  "VTCDuBois-Bold.ttf",
];

async function main() {
  for (const file of files) {
    const data = readFileSync(resolve(fontsDir, file));
    const ct = file.endsWith(".woff2") ? "font/woff2" : "font/ttf";
    const blob = await put(`fonts/${file}`, data, {
      access: "public",
      contentType: ct,
      addRandomSuffix: false,
      token: BLOB_TOKEN,
    });
    console.log(`${file} -> ${blob.url}`);
  }
  const { blobs } = await list({
    prefix: "fonts/",
    limit: 1,
    token: BLOB_TOKEN,
  });
  if (blobs[0])
    console.log("\nBlob base:", blobs[0].url.replace(/\/fonts\/.*$/, ""));
}

main().catch(console.error);
