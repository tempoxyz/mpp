import { list } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export async function GET() {
  if (!BLOB_TOKEN) return Response.json({ transparent: [], lightBg: [] });
  try {
    const { blobs } = await list({
      prefix: "logos/_manifest.json",
      limit: 1,
      token: BLOB_TOKEN,
    });
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url);
      if (res.ok) {
        const data = await res.json();
        return Response.json(data, {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate",
          },
        });
      }
    }
  } catch (e) {
    console.error("[icon-manifest] error:", e);
  }
  return Response.json({ transparent: [], lightBg: [] });
}
