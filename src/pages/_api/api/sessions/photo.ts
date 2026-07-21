import { mppx } from "../../../../mppx.server";

export async function GET(request: Request) {
  const result = await mppx.session({
    amount: "0.01",
    unitType: "photo",
  })(request);

  if (result.status === 402) return result.challenge;

  if (request.method === "POST") return result.withReceipt();

  let url: string;
  try {
    const res = await fetch("https://picsum.photos/200/200");
    if (!res.ok) throw new Error(`upstream responded ${res.status}`);
    url = res.url;
  } catch (error) {
    console.error("[sessions/photo] upstream fetch failed:", error);
    return Response.json(
      { error: "Failed to load photo from upstream" },
      { status: 502 },
    );
  }

  return result.withReceipt(Response.json({ url }));
}

export const POST = GET;
