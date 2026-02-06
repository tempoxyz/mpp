import { env } from "cloudflare:workers";

// RPC proxy endpoint for Tempo Moderato (testnet)
const RPC_URL = "https://rpc.moderato.tempo.xyz";

export async function POST(request: Request) {
	try {
		const body = await request.json();

		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		const authUser = env.RPC_AUTH_USER;
		const authPass = env.RPC_AUTH_PASS;
		if (authUser && authPass) {
			headers.Authorization = `Basic ${btoa(`${authUser}:${authPass}`)}`;
		}

		const response = await fetch(RPC_URL, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});

		const result = await response.json();
		return Response.json(result);
	} catch (error) {
		return Response.json(
			{
				jsonrpc: "2.0",
				error: {
					code: -32603,
					message: error instanceof Error ? error.message : "RPC proxy error",
				},
				id: null,
			},
			{ status: 500 },
		);
	}
}
