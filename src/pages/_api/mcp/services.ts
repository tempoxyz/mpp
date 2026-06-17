const DEFAULT_WORKER_ORIGIN = "https://mpp-services-mcp.porto.workers.dev";
const WORKER_ORIGIN = (
  process.env.MPP_SERVICES_MCP_WORKER_ORIGIN || DEFAULT_WORKER_ORIGIN
).replace(/\/+$/, "");
const WORKER_PATH = "/mcp/services";

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(request: Request) {
  return proxyToWorker(request);
}

export async function POST(request: Request) {
  return proxyToWorker(request);
}

async function proxyToWorker(request: Request) {
  const requestUrl = new URL(request.url);
  const upstreamUrl = `${WORKER_ORIGIN}${WORKER_PATH}${requestUrl.search}`;
  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.delete("host");

  const init: RequestInit = {
    method: request.method,
    headers: upstreamHeaders,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(upstreamUrl, init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  for (const [key, value] of corsHeaders()) {
    responseHeaders.set(key, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

function corsHeaders() {
  return new Headers({
    "Access-Control-Allow-Headers": "content-type,mcp-protocol-version",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Origin": "*",
  });
}
