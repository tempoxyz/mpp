import { mppx } from "../../../mppx.server";

export async function GET(request: Request) {
  const result = await mppx.charge({
    amount: "0.01",
    description: "Random stock photo",
  })(request);

  if (result.status === 402) return result.challenge;

  const res = await fetch("https://picsum.photos/1024/1024");
  const url = res.url;

  return result.withReceipt(Response.json({ url }));
}
