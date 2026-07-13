import { mppx } from "../../../mppx.server";

export async function GET(request: Request) {
  const result = await mppx.charge({
    amount: "0.01",
    description: "Random stock photo",
  })(request);

  if (result.status === 402) return result.challenge;

  let url: string;
  try {
    const res = await fetch("https://picsum.photos/1024/1024");
    if (!res.ok) throw new Error(`upstream responded ${res.status}`);
    url = res.url;
  } catch (error) {
    console.error("[photo] upstream fetch failed:", error);
    return Response.json(
      { error: "Failed to load photo from upstream" },
      { status: 502 },
    );
  }

  return result.withReceipt(Response.json({ url }));
}
