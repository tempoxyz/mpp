import { list, put } from "@vercel/blob";
import discovery from "../../../../../schemas/discovery.json";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const LOGODEV_PK =
  process.env.LOGODEV_PUBLIC_KEY ?? "pk_KHltsKRcTSKdi8m11WM62Q";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface ServiceEntry {
  id: string;
  name: string;
  url: string;
  provider?: { name?: string; url?: string };
}

const DOMAIN_OVERRIDES: Record<string, string> = {
  stableemail: "stablestudio.dev",
  stableenrich: "stablestudio.dev",
  stablephone: "stablestudio.dev",
  stablesocial: "stablestudio.dev",
  stablestudio: "stablestudio.dev",
  stabletravel: "stablestudio.dev",
  stableupload: "stablestudio.dev",
};

function domainFor(service: ServiceEntry): string | null {
  if (DOMAIN_OVERRIDES[service.id]) return DOMAIN_OVERRIDES[service.id];
  const raw = service.provider?.url ?? service.url;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

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

function letterSvg(name: string): string {
  const letter = (name[0] ?? "?").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect fill="#2A2A2A" width="512" height="512" rx="64"/><text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,sans-serif" font-size="240" font-weight="600" fill="#E8E8EC">${letter}</text></svg>`;
}

async function fetchLogoFromLogoDev(
  domain: string,
): Promise<ArrayBuffer | null> {
  const token = LOGODEV_PK;
  if (!token) return null;
  try {
    const url = `https://img.logo.dev/${encodeURIComponent(domain)}?token=${token}&format=png&size=256&greyscale=true&theme=dark&fallback=monogram&retina=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 100) return null;
    return buf;
  } catch (e) {
    console.error(`[sync-logos] logo.dev error for ${domain}:`, e);
    return null;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!BLOB_TOKEN) {
    return new Response("BLOB_READ_WRITE_TOKEN not configured", {
      status: 500,
    });
  }

  const services = (discovery as unknown as { services: ServiceEntry[] })
    .services;

  const { blobs: existingBlobs } = await list({
    prefix: "logos/",
    limit: 10000,
    token: BLOB_TOKEN,
  });

  const blobMap = new Map<string, Date>();
  for (const blob of existingBlobs) {
    const match = blob.pathname.match(/^logos\/(.+)\.(webp|svg|png)$/);
    if (match) blobMap.set(match[1], new Date(blob.uploadedAt));
  }

  const now = Date.now();
  const domainCache = new Map<string, ArrayBuffer | null>();
  const transparentIds: string[] = [];
  const lightBgIds: string[] = [];
  let synced = 0;
  let skipped = 0;
  let failed = 0;
  let placeholders = 0;

  for (const service of services) {
    const uploadedAt = blobMap.get(service.id);
    if (uploadedAt && now - uploadedAt.getTime() < SEVEN_DAYS_MS) {
      skipped++;
      continue;
    }

    const domain = domainFor(service);
    if (!domain) {
      if (!uploadedAt) {
        const svg = letterSvg(service.name);
        await put(`logos/${service.id}.svg`, svg, {
          access: "public",
          contentType: "image/svg+xml",
          addRandomSuffix: false,
          allowOverwrite: true,
          token: BLOB_TOKEN,
        });
        placeholders++;
      }
      continue;
    }

    let logoBuf: ArrayBuffer | null;
    if (domainCache.has(domain)) {
      logoBuf = domainCache.get(domain)!;
    } else {
      logoBuf = await fetchLogoFromLogoDev(domain);
      domainCache.set(domain, logoBuf);
    }

    if (logoBuf) {
      const hasAlpha = pngHasTransparency(logoBuf);
      if (hasAlpha) transparentIds.push(service.id);
      else if (pngHasLightBg(logoBuf)) lightBgIds.push(service.id);
      await put(`logos/${service.id}.png`, logoBuf, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: false,
        allowOverwrite: true,
        token: BLOB_TOKEN,
      });
      synced++;
    } else {
      if (!uploadedAt) {
        const svg = letterSvg(service.name);
        await put(`logos/${service.id}.svg`, svg, {
          access: "public",
          contentType: "image/svg+xml",
          addRandomSuffix: false,
          allowOverwrite: true,
          token: BLOB_TOKEN,
        });
        placeholders++;
      }
      failed++;
    }
  }

  await put(
    "logos/_manifest.json",
    JSON.stringify({ transparent: transparentIds, lightBg: lightBgIds }),
    {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: BLOB_TOKEN,
    },
  );

  const summary = {
    total: services.length,
    synced,
    skipped,
    failed,
    placeholders,
    transparent: transparentIds.length,
  };
  console.log("[sync-logos]", summary);
  return Response.json(summary);
}
