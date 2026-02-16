const RPC_URL = "https://rpc.moderato.tempo.xyz";

function getRpcHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const user = import.meta.env.VITE_RPC_AUTH_USER;
  const pass = import.meta.env.VITE_RPC_AUTH_PASS;
  if (user && pass) {
    headers.Authorization = `Basic ${btoa(`${user}:${pass}`)}`;
  }
  return headers;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: getRpcHeaders(),
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
