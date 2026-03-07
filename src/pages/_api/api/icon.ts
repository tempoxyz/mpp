import { list, put } from "@vercel/blob";
import discovery from "../../../../schemas/discovery.json";

const LOGOLINK_KEY = process.env.BRANDDEV_LOGOLINK_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const SVG_HEADERS = {
  "Content-Type": "image/svg+xml",
  "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate",
};

const FALLBACK_HEADERS = {
  "Content-Type": "image/svg+xml",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate",
};

interface ServiceEntry {
  id: string;
  name: string;
  url: string;
  provider?: { name?: string; url?: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function domainFor(service: ServiceEntry): string | null {
  const raw = service.provider?.url ?? service.url;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

function styledSvg(logoDataUri: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs><filter id="mono"><feColorMatrix type="matrix" values="0 0 0 0 0.91 0 0 0 0 0.91 0 0 0 0 0.93 0 0 0 1 0"/></filter></defs><rect fill="#2A2A2A" width="512" height="512" rx="64"/><image href="${logoDataUri}" x="96" y="96" width="320" height="320" preserveAspectRatio="xMidYMid meet" filter="url(#mono)"/></svg>`;
}

function letterSvg(name: string): string {
  const letter = (name[0] ?? "?").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect fill="#2A2A2A" width="512" height="512" rx="64"/><text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,sans-serif" font-size="240" font-weight="600" fill="#E8E8EC">${letter}</text></svg>`;
}

// ---------------------------------------------------------------------------
// Vercel Blob helpers
// ---------------------------------------------------------------------------

async function blobGet(id: string): Promise<string | null> {
  if (!BLOB_TOKEN) return null;
  try {
    const { blobs } = await list({
      prefix: `icons/${id}.svg`,
      limit: 1,
      token: BLOB_TOKEN,
    });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url);
    return res.ok ? res.text() : null;
  } catch (e) {
    console.error(`[icon] blob read error for ${id}:`, e);
    return null;
  }
}

async function blobPut(id: string, svg: string): Promise<void> {
  if (!BLOB_TOKEN) return;
  try {
    await put(`icons/${id}.svg`, svg, {
      access: "public",
      contentType: "image/svg+xml",
      addRandomSuffix: false,
      token: BLOB_TOKEN,
    });
  } catch (e) {
    console.error(`[icon] blob write error for ${id}:`, e);
  }
}

// ---------------------------------------------------------------------------
// brand.dev Logo Link
// ---------------------------------------------------------------------------

async function fetchLogo(domain: string): Promise<string | null> {
  if (!LOGOLINK_KEY) return null;
  try {
    const res = await fetch(
      `https://logos.brand.dev/?publicClientId=${LOGOLINK_KEY}&domain=${domain}`,
    );
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "image/png";
    const buf = await res.arrayBuffer();
    return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
  } catch (e) {
    console.error(`[icon] brand.dev error for ${domain}:`, e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new Response("Missing id parameter", { status: 400 });

  // 1. Vercel Blob cache
  const cached = await blobGet(id);
  if (cached) return new Response(cached, { headers: SVG_HEADERS });

  // 2. Look up service → domain → brand.dev Logo Link
  const services = (discovery as unknown as { services: ServiceEntry[] })
    .services;
  const service = services.find((s) => s.id === id);

  if (service) {
    const domain = domainFor(service);
    if (domain) {
      const dataUri = await fetchLogo(domain);
      if (dataUri) {
        const svg = styledSvg(dataUri);
        await blobPut(id, svg);
        return new Response(svg, { headers: SVG_HEADERS });
      }
    }
  }

  // 3. Local dev fallback: try static /public/icons/ file
  if (!BLOB_TOKEN) {
    try {
      const origin = new URL(request.url).origin;
      const res = await fetch(`${origin}/icons/${id}.svg`);
      if (res.ok)
        return new Response(await res.text(), { headers: SVG_HEADERS });
    } catch {
      // static file not found, fall through to letter fallback
    }
  }

  // 4. Letter fallback (short CDN cache so brand.dev is retried later)
  return new Response(letterSvg(service?.name ?? id), {
    headers: FALLBACK_HEADERS,
  });
}
