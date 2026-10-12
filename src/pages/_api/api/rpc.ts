const rpcUrl = import.meta.env.RPC_URL ?? "https://rpc.moderato.tempo.xyz";

// Documentation helper: this proxy exists so examples can read chain state. It
// must never expose node administration or let anonymous callers submit
// transactions, so those namespaces are rejected before the request is sent.
const blockedMethodPrefixes = [
  "admin_",
  "debug_",
  "engine_",
  "miner_",
  "personal_",
  "txpool_",
  "erigon_",
];
const blockedMethods = new Set([
  "eth_sendrawtransaction",
  "eth_sendtransaction",
  "eth_sendrawtransactionsync",
  "eth_sign",
  "eth_signtransaction",
  "eth_signtypeddata",
  "eth_signtypeddata_v1",
  "eth_signtypeddata_v3",
  "eth_signtypeddata_v4",
  "eth_sendsignedtransaction",
]);
const maxRequestBytes = 1_000_000;

function getRpcUrlAndHeaders(): {
  url: string;
  headers: Record<string, string>;
} {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const parsed = new URL(rpcUrl);
  if (parsed.username) {
    headers.Authorization = `Basic ${btoa(`${parsed.username}:${parsed.password}`)}`;
    parsed.username = "";
    parsed.password = "";
  }
  return { url: parsed.toString().replace(/\/$/, ""), headers };
}

function isAllowedMethod(value: unknown) {
  if (typeof value !== "string" || value.length > 128) return false;
  const method = value.toLowerCase();
  if (blockedMethods.has(method)) return false;
  return !blockedMethodPrefixes.some((prefix) => method.startsWith(prefix));
}

function rpcError(id: unknown, code: number, message: string) {
  return Response.json(
    { jsonrpc: "2.0", error: { code, message }, id: id ?? null },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  try {
    const body = await readBoundedJson(request);
    if (body === undefined)
      return rpcError(
        null,
        -32600,
        "Request body is missing, too large, or not valid JSON",
      );

    const id =
      typeof body === "object" && body !== null && "id" in body
        ? (body as { id?: unknown }).id
        : null;

    if (Array.isArray(body))
      return rpcError(null, -32600, "Batch requests are not supported");

    const method =
      typeof body === "object" && body !== null && "method" in body
        ? (body as { method?: unknown }).method
        : undefined;
    if (!isAllowedMethod(method))
      return rpcError(id, -32601, "Method not allowed");

    const { url, headers } = getRpcUrlAndHeaders();
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error(
        `[rpc] upstream RPC error (${response.status}) method=${String(method)} id=${String(id)}`,
        result,
      );
    }
    return Response.json(result, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[rpc] proxy request failed:", error);
    return rpcError(null, -32603, "RPC proxy error");
  }
}

// Content-Length is caller controlled and may be missing, so the cap is also
// enforced while reading the stream.
async function readBoundedJson(request: Request): Promise<unknown> {
  const declared = Number.parseInt(
    request.headers.get("content-length") ?? "",
    10,
  );
  if (Number.isFinite(declared) && declared > maxRequestBytes) return undefined;
  if (!request.body) return undefined;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    size += value.byteLength;
    if (size > maxRequestBytes) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }

  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(buffer)) as unknown;
  } catch {
    return undefined;
  }
}
