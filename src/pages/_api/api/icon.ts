import { list } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate",
};

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

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new Response("Missing id parameter", { status: 400 });

  const blob = await blobGet(id);
  if (blob) {
    return new Response(blob.body, {
      headers: { "Content-Type": blob.contentType, ...CACHE_HEADERS },
    });
  }

  return new Response("Not found", { status: 404 });
}
