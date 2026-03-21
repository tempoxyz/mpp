import { list, put } from "@vercel/blob";
import discovery from "../../../../../schemas/discovery.json";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const LOGODEV_SK = process.env.LOGODEV_SECRET_KEY;
const LOGODEV_PK =
  process.env.LOGODEV_PUBLIC_KEY ?? "pk_KHltsKRcTSKdi8m11WM62Q";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface ServiceEntry {
  id: string;
  name: string;
  url: string;
  provider?: { name?: string; url?: string };
}

function domainFor(service: ServiceEntry): string | null {
  const raw = service.provider?.url ?? service.url;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

function letterSvg(name: string): string {
  const letter = (name[0] ?? "?").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect fill="#2A2A2A" width="512" height="512" rx="64"/><text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,sans-serif" font-size="240" font-weight="600" fill="#E8E8EC">${letter}</text></svg>`;
}

async function fetchLogoFromLogoDev(
  domain: string,
): Promise<ArrayBuffer | null> {
  const token = LOGODEV_SK || LOGODEV_PK;
  if (!token) return null;
  try {
    const url = `https://img.logo.dev/${encodeURIComponent(domain)}?token=${token}&format=png&theme=dark&greyscale=true&retina=true`;
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
      await put(`logos/${service.id}.png`, logoBuf, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: false,
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
          token: BLOB_TOKEN,
        });
        placeholders++;
      }
      failed++;
    }
  }

  const summary = {
    total: services.length,
    synced,
    skipped,
    failed,
    placeholders,
  };
  console.log("[sync-logos]", summary);
  return Response.json(summary);
}
