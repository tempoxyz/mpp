const rpcUrl = import.meta.env.RPC_URL ?? "https://rpc.moderato.tempo.xyz";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, headers } = getRpcUrlAndHeaders();

    const response = await fetch(url, {
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
