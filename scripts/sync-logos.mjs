import { readFileSync } from "node:fs";
import { list, put } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const LOGODEV_PK = "pk_KHltsKRcTSKdi8m11WM62Q";

if (!BLOB_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN is required");
  process.exit(1);
}

const discovery = JSON.parse(
  readFileSync(new URL("../schemas/discovery.json", import.meta.url), "utf8"),
);
const services = discovery.services;

const DOMAIN_OVERRIDES = {
  stableemail: "stablestudio.dev",
  stableenrich: "stablestudio.dev",
  stablephone: "stablestudio.dev",
  stablesocial: "stablestudio.dev",
  stablestudio: "stablestudio.dev",
  stabletravel: "stablestudio.dev",
  stableupload: "stablestudio.dev",
};

function domainFor(service) {
  if (DOMAIN_OVERRIDES[service.id]) return DOMAIN_OVERRIDES[service.id];
  const raw = service.provider?.url ?? service.url;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

import { inflateSync } from "node:zlib";

function decodePngPixels(buf) {
  const bytes = new Uint8Array(buf);
  if (bytes.length < 26) return null;
  const colorType = bytes[25];
  const channels =
    colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1;
  const width =
    (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height =
    (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  const idatChunks = [];
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
      idatChunks.push(bytes.slice(offset + 8, offset + 8 + len));
    offset += 12 + len;
  }
  if (!idatChunks.length) return null;
  const raw = inflateSync(Buffer.concat(idatChunks.map((c) => Buffer.from(c))));
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
        const pa = Math.abs(p - a),
          pb = Math.abs(p - b),
          pc = Math.abs(p - c);
        val = (val + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      }
      pixels[outStart + x] = val;
    }
    pixels.copy(prev, 0, outStart, outStart + width * bpp);
  }
  return { pixels, width, height, channels };
}

function pngHasTransparency(buf) {
  const img = decodePngPixels(buf);
  if (!img || (img.channels !== 4 && img.channels !== 2)) return false;
  const { pixels, width, height, channels } = img;
  const inset = Math.floor(Math.min(width, height) * 0.15);
  const probes = [
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
}

function pngHasLightBg(buf) {
  const img = decodePngPixels(buf);
  if (!img) return false;
  const { pixels, width, height, channels } = img;
  const inset = Math.floor(Math.min(width, height) * 0.15);
  const idx = (inset * width + inset) * channels;
  const r = pixels[idx],
    g = pixels[idx + 1],
    b = pixels[idx + 2];
  return (r + g + b) / 3 > 180;
}

function letterSvg(name) {
  const letter = (name[0] ?? "?").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect fill="#2A2A2A" width="512" height="512" rx="64"/><text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,sans-serif" font-size="240" font-weight="600" fill="#E8E8EC">${letter}</text></svg>`;
}

async function fetchLogo(domain) {
  const token = LOGODEV_PK;
  const url = `https://img.logo.dev/${encodeURIComponent(domain)}?token=${token}&format=png&size=256&greyscale=true&theme=dark&fallback=monogram&retina=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 100) return null;
    return buf;
  } catch (e) {
    console.error(`  error fetching ${domain}:`, e.message);
    return null;
  }
}

console.log(`Syncing ${services.length} services...`);

const domainCache = new Map();
const transparentIds = [];
const lightBgIds = [];
let synced = 0;
let failed = 0;
let placeholders = 0;

for (const service of services) {
  const domain = domainFor(service);
  if (!domain) {
    const svg = letterSvg(service.name);
    await put(`logos/${service.id}.svg`, svg, {
      access: "public",
      contentType: "image/svg+xml",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: BLOB_TOKEN,
    });
    placeholders++;
    console.log(`  [placeholder] ${service.id} (no domain)`);
    continue;
  }

  let logoBuf;
  if (domainCache.has(domain)) {
    logoBuf = domainCache.get(domain);
  } else {
    logoBuf = await fetchLogo(domain);
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
    const label = hasAlpha
      ? "[transparent]"
      : pngHasLightBg(logoBuf)
        ? "[light-bg]"
        : "[dark-bg]";
    console.log(`  [synced] ${service.id} (${domain}) ${label}`);
  } else {
    const svg = letterSvg(service.name);
    await put(`logos/${service.id}.svg`, svg, {
      access: "public",
      contentType: "image/svg+xml",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: BLOB_TOKEN,
    });
    placeholders++;
    failed++;
    console.log(`  [failed] ${service.id} (${domain}) → placeholder`);
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

console.log("\nDone!", {
  synced,
  failed,
  placeholders,
  transparent: transparentIds.length,
  lightBg: lightBgIds.length,
});
