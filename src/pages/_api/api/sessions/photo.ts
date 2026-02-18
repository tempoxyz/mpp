import { mppx } from "../../../../mppx.server";

export async function GET(request: Request) {
  const result = await mppx.session({
    amount: "0.01",
    unitType: "photo",
  })(request);

  if (result.status === 402) return result.challenge;

  const res = await fetch("https://picsum.photos/200/200");
  const url = res.url;

  return result.withReceipt(Response.json({ url }));
}
