// [!region imports]
import { Mpay, tempo } from "mpay/server";

// [!endregion imports]

// [!region mpay]
const mpay = Mpay.create({
	method: tempo(),
	realm: "example.com",
	secretKey: process.env.MPAY_SECRET_KEY!,
});
// [!endregion mpay]

// [!region handler]
export async function handler(request: Request) {
	const response = await mpay.charge({
		amount: "1000000",
		currency: "0x20c0000000000000000000000000000000000001",
		recipient: "0x742d35Cc6634c0532925a3b844bC9e7595F8fE00",
	})(request);

	if (response.status === 402) return response.challenge;

	return response.withReceipt(Response.json({ data: "..." }));
}
// [!endregion handler]
