const DOC_DISCOVERY_LINK_VALUE = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/mcp.json>; rel="describedby"; type="application/json"',
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
  '</llms.txt>; rel="alternate"; type="text/plain"',
  '</llms-full.txt>; rel="alternate"; type="text/plain"',
].join(", ");

const OPENAPI_DISCOVERY_LINK_VALUE = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/mcp.json>; rel="describedby"; type="application/json"',
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
].join(", ");

const API_CATALOG_HEADERS = [
  header("Access-Control-Allow-Origin", "*"),
  header("Cache-Control", "public, max-age=300"),
  header(
    "Content-Type",
    'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
  ),
  header(
    "Link",
    '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  ),
  header("X-Content-Type-Options", "nosniff"),
];

const CACHE_HEADERS = [
  header("Cache-Control", "public, max-age=300"),
  header("X-Content-Type-Options", "nosniff"),
];

const DOC_SECTIONS = [
  "advanced",
  "guides",
  "overview",
  "payment-methods",
  "protocol",
  "quickstart",
  "sdk",
  "services",
  "tools",
  "use-cases",
];

const DISCOVERY_PAGE_SOURCES = [
  "/",
  ...DOC_SECTIONS.flatMap((section) => [`/${section}`, `/${section}/:path*`]),
];

export const config = {
  headers: [
    headerRule("/.well-known/api-catalog", API_CATALOG_HEADERS),
    headerRule("/.well-known/:path*", [
      header("Access-Control-Allow-Origin", "*"),
      ...CACHE_HEADERS,
    ]),
    headerRule("/robots.txt", CACHE_HEADERS),
    headerRule("/openapi.json", [header("Link", OPENAPI_DISCOVERY_LINK_VALUE)]),
    ...DISCOVERY_PAGE_SOURCES.map((source) =>
      headerRule(source, [header("Link", DOC_DISCOVERY_LINK_VALUE)]),
    ),
  ],
  redirects: [
    {
      source: "/openapi.json",
      destination: "/api/openapi.json",
      permanent: false,
    },
    {
      source: "/:path(.*)",
      has: [{ type: "host", value: "mpp.tempo.xyz" }],
      destination: "https://mpp.dev/:path",
      permanent: true,
    },
  ],
};

function header(key, value) {
  return { key, value };
}

function headerRule(source, headers) {
  return { source, headers };
}
