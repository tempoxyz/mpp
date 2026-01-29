import type { MiddlewareHandler } from "hono";
import { Mpay, tempo } from "mpay/server";

/* 
This middleware provides a basic implementation of the payment middleware for examples.
*/ 

const PATHUSD = "0x20c0000000000000000000000000000000000000";
const RECIPIENT = "0xa726a1CD723409074DF9108A2187cfA19899aCF8";
const DEFAULT_SECRET_KEY = "please-change-secret-key-not-for-production";

const rpcUrl = process.env.MPP_RPC_URL ?? "https://rpc.moderato.tempo.xyz";
const chainId = Number(process.env.MPP_CHAIN_ID ?? "42431");

const payment = Mpay.create({
	method: tempo({
		rpcUrl,
		chainId,
	}),
	realm: "mpp.dev",
	secretKey: process.env.MPP_SECRET_KEY ?? DEFAULT_SECRET_KEY,
});

function createPaidPingHandler() {
	const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
	return payment.charge({
		request: {
			amount: "100000",
			currency: PATHUSD,
			recipient: RECIPIENT,
			expires,
		},
		description: "Ping endpoint access",
	});
}

export function middleware(): MiddlewareHandler {
	return async (context, next) => {
		const url = new URL(context.req.url);
		const method = context.req.method;

		if (method === "GET" && url.pathname === "/ping") {
			context.res = new Response("tm!", {
				headers: { "Content-Type": "text/plain" },
			});
			return;
		}

		if (method === "GET" && url.pathname === "/ping/paid") {
			const webRequest = new Request(context.req.url, {
				method: context.req.method,
				headers: context.req.raw.headers,
			});

			const result = await createPaidPingHandler()(webRequest);

			if (result.status === 402) {
				const challenge = result.challenge as Response;
				const body = await challenge.text();
				context.res = new Response(body, {
					status: 402,
					headers: challenge.headers,
				});
				return;
			}

			const response = result.withReceipt(
				new Response("tm! thanks for paying", {
					headers: { "Content-Type": "text/plain" },
				}),
			);
			context.res = new Response("tm! thanks for paying", {
				status: 200,
				headers: response.headers,
			});
			return;
		}

		return next();
	};
}

export default middleware;
