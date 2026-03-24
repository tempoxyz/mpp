import { list } from "@vercel/blob";
import { logoDevUrl } from "../../../lib/logodev";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const LOGODEV_PK = process.env.LOGODEV_PUBLIC_KEY;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate",
};

function letterSvg(id: string): string {
  const letter = (id[0] ?? "?").toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect fill="#2A2A2A" width="512" height="512" rx="64"/><text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,sans-serif" font-size="240" font-weight="600" fill="#E8E8EC">${letter}</text></svg>`;
}

async function blobGet(
  id: string,
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
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
        if (res.ok) {
          const ct =
            res.headers.get("content-type") ??
            (ext === "svg" ? "image/svg+xml" : `image/${ext}`);
          return { data: await res.arrayBuffer(), contentType: ct };
        }
      }
    }
  } catch (e) {
    console.error(`[icon] blob read error for ${id}:`, e);
  }
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("Missing id parameter", { status: 400 });

  // 1. Vercel Blob (synced from logo.dev)
  const blob = await blobGet(id);
  if (blob) {
    return new Response(blob.data, {
      headers: { "Content-Type": blob.contentType, ...CACHE_HEADERS },
    });
  }

  // 2. Live logo.dev fallback
  if (LOGODEV_PK) {
    const domain = url.searchParams.get("domain");
    if (domain) {
      try {
        const res = await fetch(
          logoDevUrl(domain, { token: LOGODEV_PK }),
        );
        if (res.ok) {
          return new Response(await res.arrayBuffer(), {
            headers: { "Content-Type": "image/png", ...CACHE_HEADERS },
          });
        }
      } catch (e) {
        console.error(`[icon] logo.dev fallback error for ${domain}:`, e);
      }
    }
  }

  // 3. Letter SVG (guaranteed — never 404)
  return new Response(letterSvg(id), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate",
    },
  });
}
