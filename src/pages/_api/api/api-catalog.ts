const API_CATALOG_PROFILE = "https://www.rfc-editor.org/info/rfc9727";
const CACHE_CONTROL = "public, max-age=300";

const apiCatalog = {
  linkset: [
    {
      anchor: "https://mpp.dev/.well-known/api-catalog",
      item: [
        {
          href: "https://mpp.dev/api/ping/paid",
          title: "Paid ping endpoint",
          type: "application/json",
        },
        {
          href: "https://mpp.dev/api/mcp",
          title: "MPP documentation MCP server",
          type: "text/event-stream",
        },
      ],
    },
    {
      anchor: "https://mpp.dev/api/ping/paid",
      "service-desc": [
        {
          href: "https://mpp.dev/api/openapi.json",
          title: "OpenAPI description",
          type: "application/json",
        },
      ],
      "service-doc": [
        {
          href: "https://mpp.dev/overview",
          title: "MPP overview",
          type: "text/html",
        },
        {
          href: "https://mpp.dev/quickstart/server",
          title: "Add payments to your API",
          type: "text/html",
        },
      ],
      "service-meta": [
        {
          href: "https://mpp.dev/.well-known/mcp.json",
          title: "MCP server card",
          type: "application/json",
        },
        {
          href: "https://mpp.dev/.well-known/agent-skills/index.json",
          title: "Agent Skills discovery index",
          type: "application/json",
        },
      ],
    },
    {
      anchor: "https://mpp.dev/api/mcp",
      "service-doc": [
        {
          href: "https://mpp.dev/guides/building-with-an-llm",
          title: "Build with an LLM",
          type: "text/html",
        },
      ],
      "service-meta": [
        {
          href: "https://mpp.dev/.well-known/mcp.json",
          title: "MCP server card",
          type: "application/json",
        },
      ],
    },
  ],
};

export function GET() {
  return new Response(JSON.stringify(apiCatalog, null, 2), {
    headers: getHeaders(),
  });
}

export function HEAD() {
  return new Response(null, { headers: getHeaders() });
}

function getHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": CACHE_CONTROL,
    "Content-Type": `application/linkset+json; profile="${API_CATALOG_PROFILE}"`,
    "X-Content-Type-Options": "nosniff",
  };
}
