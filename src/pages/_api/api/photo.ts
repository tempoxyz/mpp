import { mppx } from "../../../mppx.server";
import { resolvePicsumPhotoUrl } from "../../../picsum-photo";

export async function GET(request: Request) {
  const result = await mppx.charge({
    amount: "0.01",
    description: "Random stock photo",
  })(request);

  if (result.status === 402) return result.challenge;

  const { url, warning } = await resolvePicsumPhotoUrl(1024, "photo");
  return result.withReceipt(
    Response.json(warning ? { url, warning } : { url }),
  );
}
