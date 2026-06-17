import { Expires } from "mppx/server";
import { mppx } from "../../../../mppx.server";

export async function GET(request: Request) {
  const result = await mppx.charge({
    amount: "0.001",
    currency: import.meta.env.VITE_DEFAULT_CURRENCY!,
    expires: Expires.minutes(5),
    description: "Location lookup",
  })(request);

  if (result.status === 402) return result.challenge;

  return result.withReceipt(
    Response.json({
      location: {
        lat: 37.7749,
        lng: -122.4194,
        city: "San Francisco",
        region: "CA",
        country: "US",
      },
      cost: "$0.001",
    }),
  );
}
