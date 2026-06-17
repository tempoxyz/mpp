import { afterEach, describe, expect, it, vi } from "vitest";
import type { CachedCatalog } from "./cache.js";
import { handleMcp, serverCard } from "./mcp.js";
import type { Service } from "./types.js";

const services: Service[] = [
  {
    id: "agentmail",
    name: "AgentMail",
    url: "https://mpp.api.agentmail.to",
    description: "Email inboxes for AI agents.",
    categories: ["ai", "social"],
    integration: "first-party",
    tags: ["email", "fax"],
    status: "active",
    methods: { tempo: { intents: ["charge"] } },
    endpoints: [
      { method: "GET", path: "/v0/inboxes", payment: null },
      {
        method: "POST",
        path: "/v0/inboxes",
        description: "Create inbox",
        payment: {
          intent: "charge",
          method: "tempo",
          amount: "2000000",
        },
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    url: "https://api.anthropic.com",
    description: "Claude chat completions.",
    categories: ["ai"],
    integration: "third-party",
    tags: ["llm", "claude"],
    status: "active",
    docs: { openapi: "https://example.com/openapi.json" },
    methods: { tempo: { intents: ["session"] } },
    endpoints: [
      {
        method: "POST",
        path: "/v1/messages",
        payment: {
          intent: "session",
          method: "tempo",
          dynamic: true,
        },
      },
    ],
  },
  {
    id: "legacy",
    name: "Legacy",
    url: "https://legacy.example.com",
    categories: ["data"],
    integration: "third-party",
    tags: ["archive"],
    status: "deprecated",
    methods: {},
    endpoints: [],
  },
];

describe("mcp handler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("advertises outputSchema for every tool", async () => {
    const body = await mcp("tools/list", {}, envWithCatalog());
    const tools = body.result.tools ?? [];
    expect(tools).toHaveLength(5);
    for (const tool of tools) {
      expect(tool.outputSchema).toEqual(
        expect.objectContaining({ type: "object" }),
      );
    }
    expect(
      tools.find((tool) => tool.name === "get_openapi")?.inputSchema,
    ).toEqual(
      expect.objectContaining({
        properties: expect.objectContaining({
          raw: expect.objectContaining({ type: "boolean" }),
        }),
      }),
    );
  });

  it("rejects invalid enum filters instead of silently dropping them", async () => {
    for (const args of [
      { category: "boguscat" },
      { integration: "bogusint" },
      { status: "bogusstatus" },
    ]) {
      const body = await callTool("search_services", args);
      expect(body.result.isError).toBe(true);
      expect(body.result.structuredContent).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining("Allowed values:"),
        }),
      );
    }
  });

  it("paginates list and search responses and echoes applied filters", async () => {
    const listBody = await callTool("list_services", { limit: 2, offset: 1 });
    expect(listBody.result.structuredContent).toEqual(
      expect.objectContaining({
        total: 3,
        returned: 2,
        offset: 1,
        limit: 2,
      }),
    );
    expect(listBody.result.structuredContent).not.toHaveProperty("count");
    expect(listBody.result.structuredContent).not.toHaveProperty("filters");
    expect(listBody.result.content[0]?.text).toContain("Returned 2 of 3");
    expect(listBody.result.structuredContent.services.map(serviceId)).toEqual([
      "anthropic",
      "legacy",
    ]);

    const searchBody = await callTool("search_services", {
      category: "ai",
      method: "tempo",
      limit: 1,
    });
    expect(searchBody.result.structuredContent).toEqual(
      expect.objectContaining({
        appliedFilters: { category: "ai", method: "tempo" },
        total: 2,
        returned: 1,
      }),
    );
    expect(searchBody.result.structuredContent).not.toHaveProperty("count");
    expect(searchBody.result.structuredContent).not.toHaveProperty("filters");
    expect(searchBody.result.content[0]?.text).toContain("Returned 1 of 2");
    expect(searchBody.result.structuredContent.services.map(serviceId)).toEqual(
      ["agentmail"],
    );
  });

  it("returns a summary by default from a valid OpenAPI candidate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        expect(String(input)).toBe("https://mpp.api.agentmail.to/openapi.json");
        return Response.json(
          openApiDocument({
            paths: {
              "/v0/inboxes": {
                get: { description: "List inboxes" },
                post: {
                  summary: "Create inbox",
                  "x-payment-info": {
                    offers: [{ method: "tempo", amount: "2000000" }],
                  },
                },
              },
            },
          }),
        );
      }),
    );

    const body = await callTool("get_openapi", { service: "agentmail" });
    expect(body.result.structuredContent).toEqual(
      expect.objectContaining({
        source: "well-known",
        openapi: expect.objectContaining({
          source: "well-known",
          url: "https://mpp.api.agentmail.to/openapi.json",
          raw: false,
          summary: true,
          openapiVersion: "3.1.0",
          info: { title: "AgentMail", version: "1.0.0" },
          "x-service-info": { name: "AgentMail" },
          paths: expect.arrayContaining([
            {
              method: "GET",
              path: "/v0/inboxes",
              summary: "List inboxes",
            },
            {
              method: "POST",
              path: "/v0/inboxes",
              summary: "Create inbox",
              offers: {
                offers: [{ method: "tempo", amount: "2000000" }],
              },
            },
          ]),
        }),
      }),
    );
    expect(body.result.structuredContent.openapi).not.toHaveProperty(
      "document",
    );
  });

  it("returns the raw OpenAPI document when requested and under the cap", async () => {
    const document = openApiDocument();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        expect(String(input)).toBe("https://example.com/openapi.json");
        return Response.json(document);
      }),
    );

    const body = await callTool("get_openapi", {
      service: "anthropic",
      raw: true,
    });
    expect(body.result.structuredContent.openapi).toEqual(
      expect.objectContaining({
        source: "docs.openapi",
        raw: true,
        summary: false,
        document,
      }),
    );
  });

  it("returns a summary with a note when raw OpenAPI exceeds the cap", async () => {
    const document = openApiDocument({
      paths: {
        "/large": {
          get: {
            summary: "Large operation",
            description: "x".repeat(270 * 1024),
          },
        },
      },
    });
    const bodyText = JSON.stringify(document);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(bodyText, {
            headers: {
              "content-type": "application/json",
              "content-length": String(bodyText.length),
            },
          }),
      ),
    );

    const body = await callTool("get_openapi", {
      service: "anthropic",
      raw: true,
    });
    expect(body.result.structuredContent.openapi).toEqual(
      expect.objectContaining({
        source: "docs.openapi",
        raw: false,
        summary: true,
        note: expect.stringContaining("returning summary"),
        paths: [{ method: "GET", path: "/large", summary: "Large operation" }],
      }),
    );
    expect(body.result.structuredContent.openapi).not.toHaveProperty(
      "document",
    );
  });

  it("rejects HTML and non-OpenAPI JSON candidates before registry fallback", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === "https://example.com/openapi.json") {
        return Response.json({ ok: true });
      }
      if (String(input) === "https://api.anthropic.com/openapi.json") {
        return new Response("<html>not an OpenAPI document</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        });
      }
      throw new Error(`Unexpected fetch ${String(input)}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const body = await callTool("get_openapi", { service: "anthropic" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body.result.structuredContent).toEqual(
      expect.objectContaining({
        source: "registry",
        openapi: expect.objectContaining({
          source: "registry",
          endpoints: expect.arrayContaining([
            expect.objectContaining({ path: "/v1/messages" }),
          ]),
        }),
      }),
    );
  });

  it("rejects non-HTTPS candidates and over-long redirect chains", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: "/next-openapi.json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const body = await mcp(
      "tools/call",
      { name: "get_openapi", arguments: { service: "http-only" } },
      envWithCatalogFor([
        {
          ...services[0],
          id: "http-only",
          name: "HTTP Only",
          url: "http://example.com",
          docs: { openapi: "http://example.com/openapi.json" },
        },
      ]),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "http://example.com/openapi.json",
    );
    expect(body.result.structuredContent.source).toBe("registry");

    const redirectBody = await callTool("get_openapi", {
      service: "agentmail",
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(redirectBody.result.structuredContent.source).toBe("registry");
  });

  it("falls back to the registry view when OpenAPI fetch candidates fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("missing", { status: 404 })),
    );

    const body = await callTool("get_openapi", { service: "agentmail" });
    expect(body.result.structuredContent).toEqual(
      expect.objectContaining({
        source: "registry",
        openapi: expect.objectContaining({
          source: "registry",
          endpoints: expect.arrayContaining([
            expect.objectContaining({ path: "/v0/inboxes" }),
          ]),
        }),
      }),
    );
  });

  it("uses the advanced discovery documentation URL in the server card", () => {
    expect(serverCard("https://mpp.dev/mcp/services")).toEqual(
      expect.objectContaining({
        documentationUrl: "https://mpp.dev/advanced/discovery",
        serverInfo: expect.objectContaining({ name: "mpp-services-mcp" }),
        transport: {
          type: "streamable-http",
          endpoint: "https://mpp.dev/mcp/services",
        },
      }),
    );
  });
});

async function callTool(name: string, args: Record<string, unknown>) {
  return mcp("tools/call", { name, arguments: args }, envWithCatalog());
}

async function mcp(method: string, params: Record<string, unknown>, env: Env) {
  const response = await handleMcp(
    new Request("https://example.com/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
    env,
    testContext(),
  );
  return response.json() as Promise<{
    result: {
      tools?: Array<{
        name?: string;
        inputSchema?: unknown;
        outputSchema?: unknown;
      }>;
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
      structuredContent: {
        count?: number;
        total?: number;
        returned?: number;
        offset?: number;
        limit?: number;
        source?: string;
        services: Array<{ id: string }>;
        openapi?: unknown;
      };
    };
  }>;
}

function envWithCatalog(): Env {
  return envWithCatalogFor(services);
}

function envWithCatalogFor(catalogServices: Service[]): Env {
  const catalog: CachedCatalog = {
    version: 1,
    services: catalogServices,
    fetchedAt: new Date().toISOString(),
    sourceUrl: "https://mpp.dev/api/services",
  };
  return {
    MPP_SERVICES_URL: "https://mpp.dev/api/services",
    MPP_CATALOG_CACHE: {
      async get() {
        return catalog;
      },
      async put() {},
    } as unknown as KVNamespace,
  } as Env;
}

function openApiDocument(overrides: Record<string, unknown> = {}) {
  return {
    openapi: "3.1.0",
    info: { title: "AgentMail", version: "1.0.0" },
    "x-service-info": { name: "AgentMail" },
    paths: {
      "/v0/inboxes": {
        post: { summary: "Create inbox" },
      },
    },
    ...overrides,
  };
}

function testContext(): ExecutionContext {
  return {
    waitUntil() {},
    passThroughOnException() {},
    props: {},
  } as unknown as ExecutionContext;
}

function serviceId(service: { id: string }): string {
  return service.id;
}
