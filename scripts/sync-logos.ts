/**
 * Syncs service logos from logo.dev → Vercel Blob.
 *
 * Usage: node scripts/sync-logos.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { put } from "@vercel/blob";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceEntry {
  id: string;
  name: string;
  url: string;
  provider?: { name?: string; url?: string };
}

interface Discovery {
  version: number;
  services: ServiceEntry[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!BLOB_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN is required");
  process.exit(1);
}

const LOGODEV_PK = process.env.LOGODEV_PUBLIC_KEY;
if (!LOGODEV_PK) {
  console.error("LOGODEV_PUBLIC_KEY is required");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
if (DRY_RUN) console.log("[dry-run] No uploads will be performed\n");

const DOMAIN_OVERRIDES: Record<string, string> = {
  stableemail: "stablestudio.dev",
  stableenrich: "stablestudio.dev",
  stablephone: "stablestudio.dev",
  stablesocial: "stablestudio.dev",
  stablestudio: "stablestudio.dev",
  stabletravel: "stablestudio.dev",
  stableupload: "stablestudio.dev",
};

// ---------------------------------------------------------------------------
// PNG pixel decoding (no external image libs)
// ---------------------------------------------------------------------------

function decodePngPixels(buf: ArrayBuffer) {
  const { inflateSync } = require("node:zlib") as typeof import("node:zlib");
  const bytes = new Uint8Array(buf);
  if (bytes.length < 26) return null;
  const colorType = bytes[25];
  const channels =
    colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
  const width =
    (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height =
    (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  const idatChunks: Buffer[] = [];
  let offset = 8;
  while (offset < bytes.length - 4) {
    const len =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    if (type === "IDAT")
      idatChunks.push(Buffer.from(bytes.slice(offset + 8, offset + 8 + len)));
    offset += 12 + len;
  }
  if (!idatChunks.length) return null;
  const raw = inflateSync(Buffer.concat(idatChunks));
  const bpp = channels;
  const stride = 1 + width * bpp;
  const pixels = Buffer.alloc(width * height * bpp);
  const prev = Buffer.alloc(width * bpp);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * stride];
    const rowStart = y * stride + 1;
    const outStart = y * width * bpp;
    for (let x = 0; x < width * bpp; x++) {
      const a = x >= bpp ? pixels[outStart + x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? (y > 0 ? prev[x - bpp] : 0) : 0;
      let val = raw[rowStart + x];
      if (filter === 1) val = (val + a) & 0xff;
      else if (filter === 2) val = (val + b) & 0xff;
      else if (filter === 3) val = (val + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        val = (val + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      }
      pixels[outStart + x] = val;
    }
    pixels.copy(prev, 0, outStart, outStart + width * bpp);
  }
  return { pixels, width, height, channels };
}

function pngHasTransparency(buf: ArrayBuffer): boolean {
  try {
    const img = decodePngPixels(buf);
    if (!img || (img.channels !== 4 && img.channels !== 2)) return false;
    const { pixels, width, height, channels } = img;
    const inset = Math.floor(Math.min(width, height) * 0.15);
    const probes: [number, number][] = [
      [inset, inset],
      [inset, width - 1 - inset],
      [height - 1 - inset, inset],
      [height - 1 - inset, width - 1 - inset],
    ];
    for (const [row, col] of probes) {
      const alphaIdx = (row * width + col) * channels + (channels - 1);
      if (pixels[alphaIdx] < 250) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function pngHasLightBg(buf: ArrayBuffer): boolean {
  try {
    const img = decodePngPixels(buf);
    if (!img) return false;
    const { pixels, width, height, channels } = img;
    const inset = Math.floor(Math.min(width, height) * 0.15);
    const idx = (inset * width + inset) * channels;
    const r = pixels[idx],
      g = pixels[idx + 1],
      b = pixels[idx + 2];
    return (r + g + b) / 3 > 180;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// SVG fallback
// ---------------------------------------------------------------------------

function letterSvg(name: string): string {
  const letter = (name[0] ?? "?").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect fill="#2A2A2A" width="512" height="512" rx="64"/><text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,sans-serif" font-size="240" font-weight="600" fill="#E8E8EC">${letter}</text></svg>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function domainFromUrl(raw: string): string | null {
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

function domainForService(svc: ServiceEntry): string | null {
  if (DOMAIN_OVERRIDES[svc.id]) return DOMAIN_OVERRIDES[svc.id];
  const raw = svc.provider?.url ?? svc.url;
  return domainFromUrl(raw);
}

function logoUrl(domain: string): string {
  return `https://img.logo.dev/${domain}?token=${LOGODEV_PK}&format=png&size=256&greyscale=true&theme=dark&fallback=monogram&retina=true`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const discoveryPath = resolve(
    import.meta.dirname,
    "../schemas/discovery.json",
  );
  const discovery: Discovery = JSON.parse(readFileSync(discoveryPath, "utf-8"));
  const services = discovery.services;

  // Domain → fetched ArrayBuffer cache (shared domains fetched once)
  const domainCache = new Map<string, ArrayBuffer | null>();

  let synced = 0;
  let failed = 0;
  let placeholders = 0;

  const transparentIds: string[] = [];
  const lightBgIds: string[] = [];

  for (const svc of services) {
    const domain = domainForService(svc);

    if (!domain) {
      // No domain – upload letter SVG fallback
      console.log(`[${svc.id}] no domain – using letter fallback`);
      const svg = letterSvg(svc.name);
      if (DRY_RUN) {
        console.log(`[dry-run] would upload logos/${svc.id}.svg`);
      } else {
        await put(`logos/${svc.id}.svg`, svg, {
          access: "public",
          contentType: "image/svg+xml",
          addRandomSuffix: false,
          allowOverwrite: true,
          token: BLOB_TOKEN,
        });
      }
      placeholders++;
      continue;
    }

    // Fetch logo (with domain-level caching)
    let logoBuf: ArrayBuffer | null;
    if (domainCache.has(domain)) {
      logoBuf = domainCache.get(domain) ?? null;
    } else {
      try {
        const res = await fetch(logoUrl(domain));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        logoBuf = await res.arrayBuffer();
        domainCache.set(domain, logoBuf);
      } catch (err) {
        console.warn(`[${svc.id}] fetch failed for ${domain}:`, err);
        domainCache.set(domain, null);
        logoBuf = null;
      }
    }

    if (!logoBuf) {
      // Fetch failed – upload letter SVG fallback
      console.log(`[${svc.id}] logo fetch failed – using letter fallback`);
      const svg = letterSvg(svc.name);
      if (DRY_RUN) {
        console.log(`[dry-run] would upload logos/${svc.id}.svg`);
      } else {
        await put(`logos/${svc.id}.svg`, svg, {
          access: "public",
          contentType: "image/svg+xml",
          addRandomSuffix: false,
          allowOverwrite: true,
          token: BLOB_TOKEN,
        });
      }
      placeholders++;
      failed++;
      continue;
    }

    // Analyze PNG
    if (pngHasTransparency(logoBuf)) transparentIds.push(svc.id);
    if (pngHasLightBg(logoBuf)) lightBgIds.push(svc.id);

    // Upload PNG to Vercel Blob
    if (DRY_RUN) {
      console.log(`[dry-run] would upload logos/${svc.id}.png`);
      console.log(`[${svc.id}] ✓ synced (${domain})`);
      synced++;
    } else {
      try {
        await put(`logos/${svc.id}.png`, Buffer.from(logoBuf), {
          access: "public",
          contentType: "image/png",
          addRandomSuffix: false,
          allowOverwrite: true,
          token: BLOB_TOKEN,
        });
        console.log(`[${svc.id}] ✓ synced (${domain})`);
        synced++;
      } catch (err) {
        console.error(`[${svc.id}] upload failed:`, err);
        failed++;
      }
    }
  }

  // Write manifest
  const manifest = { transparent: transparentIds, lightBg: lightBgIds };
  if (DRY_RUN) {
    console.log(`[dry-run] would upload logos/_manifest.json`);
  } else {
    await put(`logos/_manifest.json`, JSON.stringify(manifest, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: BLOB_TOKEN,
    });
  }

  // Summary
  console.log("\n--- sync-logos summary ---");
  console.log(`  total:        ${services.length}`);
  console.log(`  synced:       ${synced}`);
  console.log(`  failed:       ${failed}`);
  console.log(`  placeholders: ${placeholders}`);

  const summary = {
    total: services.length,
    synced,
    failed,
    placeholders,
    transparent: transparentIds.length,
    lightBg: lightBgIds.length,
    dryRun: DRY_RUN,
  };
  console.log(`\n${JSON.stringify(summary)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
