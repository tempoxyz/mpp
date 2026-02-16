import { Expires } from "mppx/server";
import { mppx } from "../../../../mppx.server";

export async function GET(request: Request) {
	const result = await mppx.charge({
		amount: "0.1",
		currency: process.env.DEFAULT_CURRENCY!,
		recipient: process.env.DEFAULT_RECIPIENT!,
		expires: Expires.minutes(5),
		description: "Ping endpoint access",
	})(request);

	if (result.status === 402) return result.challenge;

	return result.withReceipt(new Response("tm! thanks for paying"));
}
