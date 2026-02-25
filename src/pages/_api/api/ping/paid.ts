import { Expires } from "mppx/server";
import { mppx } from "../../../../mppx.server";

export async function GET(request: Request) {
  const result = await mppx.charge({
    amount: "0.1",
    currency: import.meta.env.VITE_DEFAULT_CURRENCY!,
    expires: Expires.minutes(5),
    description: "Ping endpoint access",
  })(request);

  if (result.status === 402) return result.challenge;

  return result.withReceipt(new Response("tm! thanks for paying"));
}
