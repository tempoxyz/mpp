import { createClient, http } from "viem";
import { tempoModerato } from "viem/chains";
import { Actions } from "viem/tempo";

const DEFAULT_CURRENCY = "0x20c0000000000000000000000000000000000000";

function getClient() {
  return createClient({
    chain: tempoModerato,
    transport: http(
      import.meta.env.RPC_URL ?? "https://rpc.moderato.tempo.xyz",
    ),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action: string; address: string };
    const { action, address } = body;

    if (action === "fund") {
      if (!address?.startsWith("0x")) {
        console.warn(`[wallet] invalid fund address: ${address || "<empty>"}`);
        return Response.json({ error: "Invalid address" }, { status: 400 });
      }

      const client = getClient();
      const hashes = await Actions.faucet.fund(client, {
        account: address as `0x${string}`,
      });

      return Response.json({ success: true, txHash: hashes[0] });
    }

    if (action === "balance") {
      if (!address?.startsWith("0x")) {
        console.warn(
          `[wallet] invalid balance address: ${address || "<empty>"}`,
        );
        return Response.json({ error: "Invalid address" }, { status: 400 });
      }

      const client = getClient();
      try {
        const balance = await Actions.token.getBalance(client, {
          account: address as `0x${string}`,
          token: DEFAULT_CURRENCY as `0x${string}`,
        });
        return Response.json({ balance: balance.toString() });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message?.includes("Uninitialized")
        ) {
          console.warn(
            `[wallet] returning zero balance for uninitialized account ${address}`,
          );
          return Response.json({ balance: "0" });
        }
        console.error(`[wallet] balance lookup failed for ${address}:`, error);
        throw error;
      }
    }

    console.warn(`[wallet] invalid action requested: ${action}`);
    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[wallet] request failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 },
    );
  }
}
