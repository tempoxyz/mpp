import { env } from "cloudflare:workers";
import { Expires } from "mpay/server";
import { mpay } from "../../../../mpay.server";

// Location lookup API - $0.001 per request
export async function GET(request: Request) {
	const result = await mpay.charge({
		amount: "0.001",
		currency: env.DEFAULT_CURRENCY!,
		recipient: env.DEFAULT_RECIPIENT!,
		expires: Expires.minutes(5),
		description: "Location lookup",
	})(request);

	if (result.status === 402) return result.challenge;

	// Simulated location response
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
