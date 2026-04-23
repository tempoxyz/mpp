const API_CATALOG_PROFILE = "https://www.rfc-editor.org/info/rfc9727";
const CACHE_CONTROL = "public, max-age=300";
const API_CATALOG_URL = "https://mpp.dev/.well-known/api-catalog";

const apiCatalog = {
  linkset: [
    {
      anchor: API_CATALOG_URL,
      item: [
        {
          href: "https://mpp.dev/api/mcp",
          title: "MPP documentation MCP server",
          type: "text/event-stream",
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
    Link: `<${API_CATALOG_URL}>; rel="api-catalog"; type="application/linkset+json"`,
    "X-Content-Type-Options": "nosniff",
  };
}
