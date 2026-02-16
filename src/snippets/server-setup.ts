// [!region imports]
import { Mppx, tempo } from "mppx/server";

// [!endregion imports]

// [!region mppx]
const mppx = Mppx.create({ methods: [tempo.charge()] });
// [!endregion mppx]

// [!region handler]
export async function handler(request: Request) {
  const response = await mppx.charge({
    amount: "0.1",
    currency: "0x20c0000000000000000000000000000000000000",
    recipient: "0x742d35Cc6634c0532925a3b844bC9e7595F8fE00",
  })(request);

  if (response.status === 402) return response.challenge;

  return response.withReceipt(Response.json({ data: "..." }));
}
// [!endregion handler]
