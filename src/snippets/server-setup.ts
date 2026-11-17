// [!region imports]
import { Mppx, tempo } from "mppx/server";
import { ousd } from "viem/tokens";

// [!endregion imports]

// [!region mppx]
const mppx = Mppx.create({ methods: [tempo.charge()] });
// [!endregion mppx]

// [!region handler]
export async function handler(request: Request) {
  const response = await mppx.charge({
    amount: "0.1",
    currency: ousd(4217).address, // OUSD on Tempo
    recipient: "0x742d35Cc6634c0532925a3b844bC9e7595F8fE00",
  })(request);

  if (response.status === 402) return response.challenge;

  return response.withReceipt(Response.json({ data: "..." }));
}
// [!endregion handler]
