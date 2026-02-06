import { env } from "cloudflare:workers";
import { Expires } from "mpay/server";
import { mpay } from "../../../mpay.server";

export async function GET(request: Request) {
	const result = await mpay.charge({
		amount: "0.1",
		currency: env.DEFAULT_CURRENCY!,
		recipient: env.DEFAULT_RECIPIENT!,
		expires: Expires.minutes(5),
		description: "Ping endpoint access",
	})(request);

	if (result.status === 402) return result.challenge;

	return result.withReceipt(new Response("tm! thanks for paying"));
}
