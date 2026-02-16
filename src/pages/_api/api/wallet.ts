const RPC_URL = "https://rpc.moderato.tempo.xyz";
const DEFAULT_CURRENCY = "0x20c0000000000000000000000000000000000000";

function getRpcHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	const user = process.env.RPC_AUTH_USER;
	const pass = process.env.RPC_AUTH_PASS;
	if (user && pass) {
		headers.Authorization = `Basic ${btoa(`${user}:${pass}`)}`;
	}
	return headers;
}

interface RpcResult {
	result?: string;
	error?: { message?: string };
}

async function rpcCall(method: string, params: unknown[]): Promise<RpcResult> {
	const response = await fetch(RPC_URL, {
		method: "POST",
		headers: getRpcHeaders(),
		body: JSON.stringify({
			jsonrpc: "2.0",
			method,
			params,
			id: 1,
		}),
	});
	return response.json() as Promise<RpcResult>;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { action: string; address: string };
		const { action, address } = body;

		if (action === "fund") {
			if (!address || !address.startsWith("0x")) {
				return Response.json({ error: "Invalid address" }, { status: 400 });
			}

			const result = await rpcCall("tempo_fundAddress", [address]);

			if (result.error) {
				console.error("[Wallet API] Faucet error:", result.error);
				return Response.json({ error: result.error.message }, { status: 500 });
			}

			return Response.json({ success: true, txHash: result.result });
		}

		if (action === "balance") {
			if (!address || !address.startsWith("0x")) {
				return Response.json({ error: "Invalid address" }, { status: 400 });
			}

			const result = await rpcCall("eth_call", [
				{
					to: DEFAULT_CURRENCY,
					data: `0x70a08231000000000000000000000000${address.slice(2)}`,
				},
				"latest",
			]);

			if (result.error) {
				if (result.error.message?.includes("Uninitialized")) {
					return Response.json({ balance: "0" });
				}
				return Response.json({ error: result.error.message }, { status: 500 });
			}

			const balance = BigInt(result.result || "0x0");
			return Response.json({ balance: balance.toString() });
		}

		return Response.json({ error: "Invalid action" }, { status: 400 });
	} catch (error) {
		return Response.json(
			{ error: error instanceof Error ? error.message : "Request failed" },
			{ status: 500 },
		);
	}
}
