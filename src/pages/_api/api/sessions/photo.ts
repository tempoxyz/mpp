import { mppx } from "../../../../mppx.server";
import { resolvePicsumPhotoUrl } from "../../../../picsum-photo";

export async function GET(request: Request) {
  const result = await mppx.session({
    amount: "0.01",
    unitType: "photo",
  })(request);

  if (result.status === 402) return result.challenge;

  if (request.method === "POST") return result.withReceipt();

  const { url, warning } = await resolvePicsumPhotoUrl(200, "sessions/photo");
  return result.withReceipt(
    Response.json(warning ? { url, warning } : { url }),
  );
}

export const POST = GET;
