/**
 * Builds small, static service logos for the services UI.
 *
 * Each service's logo comes from the first source that has it:
 *   1. a hand-curated `public/icons/<id>.svg`
 *   2. the logo.dev copy `scripts/sync-logos.ts` keeps in the public
 *      Vercel Blob store (`LOGO_BLOB_BASE_URL` overrides it)
 *
 * and is rasterized to a 96x96 WebP at `public/services/logos/<id>.<hash>.webp`:
 * a few KB instead of the original's tens to hundreds. The content hash in the
 * name lets browsers and the CDN cache it for a year.
 * `public/services/logos.json` maps each service id to its file;
 * services without one keep using `/api/icon`.
 *
 * Never fails the build: a logo it can't build falls back to `/api/icon`.
 *
 * Usage: node scripts/build-logos.ts
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export const LOGO_SIZE = 96;
const CONCURRENCY = 16;
const FETCH_TIMEOUT_MS = 10_000;

const ROOT = resolve(import.meta.dirname, "..");
const CATALOG = join(ROOT, "public/services/catalog.json");
const ICONS_DIR = join(ROOT, "public/icons");
const OUT_DIR = join(ROOT, "public/services/logos");
const INDEX = join(ROOT, "public/services/logos.json");

/** Public Vercel Blob store that `scripts/sync-logos.ts` uploads to. */
const LOGO_BLOB_BASE_URL =
  process.env.LOGO_BLOB_BASE_URL ??
  "https://wgfdjv2jfqz2dlpx.public.blob.vercel-storage.com";

async function fetchBytes(url: string): Promise<Buffer | null> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  }).catch(() => null);
  if (!res?.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function sourceFor(id: string): Promise<Buffer | null> {
  const curated = join(ICONS_DIR, `${id}.svg`);
  if (existsSync(curated)) return readFileSync(curated);
  // Same order as /api/icon: a synced logo, then sync's letter placeholder.
  for (const ext of ["png", "svg"]) {
    const bytes = await fetchBytes(
      `${LOGO_BLOB_BASE_URL}/logos/${encodeURIComponent(id)}.${ext}`,
    );
    if (bytes) return bytes;
  }
  return null;
}

/** Fits a logo into a transparent LOGO_SIZE square and encodes it as WebP. */
export async function rasterize(source: Buffer): Promise<Buffer> {
  return sharp(source, { density: 300 })
    .resize(LOGO_SIZE, LOGO_SIZE, {
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      fit: "contain",
    })
    .webp({ alphaQuality: 90, effort: 6, quality: 85 })
    .toBuffer();
}

async function mapLimit<T>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    }),
  );
}

async function main() {
  const { services } = JSON.parse(readFileSync(CATALOG, "utf8")) as {
    services: { id: string }[];
  };
  rmSync(OUT_DIR, { force: true, recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const index: Record<string, string> = {};
  const missing: string[] = [];
  let bytesIn = 0;
  let bytesOut = 0;

  await mapLimit(services, CONCURRENCY, async ({ id }) => {
    try {
      const source = await sourceFor(id);
      if (!source) {
        missing.push(id);
        return;
      }
      const webp = await rasterize(source);
      const hash = createHash("sha256").update(webp).digest("hex").slice(0, 10);
      const file = `${id}.${hash}.webp`;
      writeFileSync(join(OUT_DIR, file), webp);
      index[id] = `/services/logos/${file}`;
      bytesIn += source.length;
      bytesOut += webp.length;
    } catch (error) {
      console.warn(`[build-logos] ${id}: ${error}`);
      missing.push(id);
    }
  });

  const sorted = Object.fromEntries(
    Object.entries(index).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(INDEX, `${JSON.stringify(sorted)}\n`);

  const kb = (n: number) => `${Math.round(n / 1024)} KB`;
  console.log(
    `[build-logos] ${Object.keys(index).length}/${services.length} logos, ${kb(bytesIn)} -> ${kb(bytesOut)}`,
  );
  if (missing.length) {
    console.log(
      `[build-logos] using /api/icon for: ${missing.sort().join(", ")}`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main().catch((error) => {
    console.warn("[build-logos] skipped:", error);
  });
}
