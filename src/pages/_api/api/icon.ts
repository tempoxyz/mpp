import { list } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate",
};

const FALLBACK_HEADERS = {
  "Content-Type": "image/svg+xml",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate",
};

function letterSvg(id: string): string {
  const letter = (id[0] ?? "?").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,sans-serif" font-size="240" font-weight="600" fill="currentColor">${letter}</text></svg>`;
}

async function blobGet(
  id: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
  if (!BLOB_TOKEN) return null;
  try {
    for (const ext of ["png", "svg"]) {
      const { blobs } = await list({
        prefix: `logos/${id}.${ext}`,
        limit: 1,
        token: BLOB_TOKEN,
      });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].url);
        if (res.ok && res.body) {
          const ct =
            res.headers.get("content-type") ??
            (ext === "svg" ? "image/svg+xml" : `image/${ext}`);
          return { body: res.body, contentType: ct };
        }
      }
    }
  } catch (e) {
    console.error(`[icon] blob read error for ${id}:`, e);
  }
  return null;
}

async function staticFallback(
  request: Request,
  id: string,
): Promise<Response | null> {
  try {
    const origin = new URL(request.url).origin;
    const res = await fetch(`${origin}/icons/${id}.svg`);
    if (res.ok) {
      console.info(`[icon] serving static fallback for ${id}`);
      return new Response(await res.text(), { headers: FALLBACK_HEADERS });
    }
  } catch {
    // static file not available
  }
  return null;
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new Response("Missing id parameter", { status: 400 });

  // 1. Vercel Blob (primary source)
  const blob = await blobGet(id);
  if (blob) {
    return new Response(blob.body, {
      headers: { "Content-Type": blob.contentType, ...CACHE_HEADERS },
    });
  }

  // 2. Static file fallback (public/icons/*.svg)
  if (!BLOB_TOKEN) {
    console.info(
      `[icon] BLOB_READ_WRITE_TOKEN not set, using static fallback for ${id}`,
    );
  } else {
    console.warn(`[icon] blob miss for ${id}, trying static fallback`);
  }
  const fallback = await staticFallback(request, id);
  if (fallback) return fallback;

  // 3. Letter SVG (guaranteed — never 404)
  console.warn(`[icon] no icon found for ${id}, generating letter fallback`);
  return new Response(letterSvg(id), { headers: FALLBACK_HEADERS });
}
