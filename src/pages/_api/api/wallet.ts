import { createClient, http, isAddress } from "viem";
import { tempoModerato } from "viem/chains";
import { Actions } from "viem/tempo";
import { pathusd } from "viem/tokens";
import { createCooldown } from "../../../lib/cooldown.js";

const DEFAULT_CURRENCY = pathusd(42431).address;

/** Funding cooldown per address. The demo funds a fresh address per run. */
const addressCooldown = createCooldown({ windowMs: 60 * 60_000 });
/** Funding cooldown per client IP. */
const ipCooldown = createCooldown({ windowMs: 30_000 });

function getClient() {
  return createClient({
    chain: tempoModerato,
    transport: http(
      import.meta.env.RPC_URL ?? "https://rpc.moderato.tempo.xyz",
    ),
  });
}

/**
 * Accepts only same-origin browser requests: the demo calls this route with
 * `fetch` from the site, so browsers always send `Origin` on its POSTs.
 */
function isSameOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  return (
    forwarded?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown"
  );
}

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    console.warn("[wallet] rejected cross-site request");
    return error("Forbidden", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Invalid request body", 400);
  }
  if (typeof body !== "object" || body === null)
    return error("Invalid request body", 400);

  const { action, address } = body as { action?: unknown; address?: unknown };
  if (action !== "fund" && action !== "balance") {
    console.warn("[wallet] invalid action requested");
    return error("Invalid action", 400);
  }
  if (typeof address !== "string" || !isAddress(address)) {
    console.warn(`[wallet] invalid ${action} address`);
    return error("Invalid address", 400);
  }

  if (action === "fund") {
    const ip = getClientIp(request);
    const key = address.toLowerCase();
    if (!ipCooldown.claim(ip)) return error("Too many requests", 429);
    if (!addressCooldown.claim(key)) {
      ipCooldown.release(ip);
      return error("Too many requests", 429);
    }

    try {
      const hashes = await Actions.faucet.fund(getClient(), {
        account: address,
      });
      return Response.json({ success: true, txHash: hashes[0] });
    } catch (err) {
      addressCooldown.release(key);
      ipCooldown.release(ip);
      console.error(`[wallet] fund failed for ${address}:`, err);
      return error("Funding failed", 500);
    }
  }

  try {
    const balance = await Actions.token.getBalance(getClient(), {
      account: address,
      token: DEFAULT_CURRENCY,
    });
    return Response.json({ balance: balance.toString() });
  } catch (err) {
    if (err instanceof Error && err.message?.includes("Uninitialized"))
      return Response.json({ balance: "0" });
    console.error(`[wallet] balance lookup failed for ${address}:`, err);
    return error("Balance lookup failed", 500);
  }
}
