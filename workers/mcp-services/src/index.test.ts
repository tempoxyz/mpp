import { afterEach, describe, expect, it, vi } from "vitest";
import type { CachedCatalog } from "./cache.js";
import worker from "./index.js";
import type { Service, WorkerEnv } from "./types.js";

const services: Service[] = [
  {
    id: "agentmail",
    name: "AgentMail",
    url: "https://mpp.api.agentmail.to",
    categories: ["ai"],
    integration: "first-party",
    tags: ["email"],
    status: "active",
    methods: { tempo: { intents: ["charge"] } },
    endpoints: [],
  },
];

describe("worker routes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serves the services MCP card from /mcp/services", async () => {
    const response = await worker.fetch(
      new Request("https://worker.example.com/mcp/services"),
      envWithCatalog(),
      testContext(),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        serverInfo: expect.objectContaining({ name: "mpp-services-mcp" }),
        transport: {
          type: "streamable-http",
          endpoint: "https://mpp.dev/mcp/services",
        },
      }),
    );
  });

  it("serves HEAD health checks from /mcp/services", async () => {
    const response = await worker.fetch(
      new Request("https://worker.example.com/mcp/services", {
        method: "HEAD",
      }),
      envWithCatalog(),
      testContext(),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-methods")).toContain(
      "HEAD",
    );
    expect(await response.text()).toBe("");
  });

  it("handles MCP JSON-RPC at /mcp/services", async () => {
    const response = await worker.fetch(
      new Request("https://worker.example.com/mcp/services", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {},
        }),
      }),
      envWithCatalog(),
      testContext(),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      result: { serverInfo: { name: string }; instructions: string };
    };
    expect(body.result.serverInfo.name).toBe("mpp-services-mcp");
    expect(body.result.instructions).toContain("runtime 402 Challenge");
  });

  it("keeps the docs MCP well-known path out of this Worker", async () => {
    const response = await worker.fetch(
      new Request("https://worker.example.com/.well-known/mcp.json"),
      envWithCatalog(),
      testContext(),
    );

    expect(response.status).toBe(404);
  });

  it("does not block MCP responses on Datadog request metrics", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Datadog unavailable");
      }),
    );

    const response = await worker.fetch(
      new Request("https://worker.example.com/mcp/services", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {},
        }),
      }),
      {
        ...envWithCatalog(),
        DATADOG_API_KEY: "dd-key",
        DATADOG_ENABLED: "true",
      },
      testContext(),
    );

    expect(response.status).toBe(200);
  });
});

describe("scheduled health", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("runs public health checks and posts Datadog metrics", async () => {
    const datadogBodies: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const request = new Request(input, init);
        if (request.url === "https://api.us5.datadoghq.com/api/v2/series") {
          datadogBodies.push(await request.json());
          return new Response("{}", { status: 202 });
        }
        return healthyPublicEndpoint(request);
      }),
    );

    const ctx = collectingContext();
    await worker.scheduled?.(scheduled("* * * * *"), datadogEnv(), ctx);
    await ctx.drain();

    expect(datadogBodies).toHaveLength(1);
    expect(JSON.stringify(datadogBodies[0])).toContain(
      "mpp.discovery_mcp.health.ok",
    );
  });
});

function envWithCatalog(): WorkerEnv {
  const catalog: CachedCatalog = {
    version: 1,
    services,
    fetchedAt: new Date().toISOString(),
    sourceUrl: "https://mpp.dev/api/services",
  };
  return {
    MPP_SERVICES_URL: "https://mpp.dev/api/services",
    PUBLIC_MCP_ENDPOINT: "https://mpp.dev/mcp/services",
    DATADOG_ENABLED: "false",
    MPP_CATALOG_CACHE: {
      async get() {
        return catalog;
      },
      async put() {},
    } as unknown as KVNamespace,
  } as WorkerEnv;
}

function testContext(): ExecutionContext {
  return {
    waitUntil() {},
    passThroughOnException() {},
    props: {},
  } as unknown as ExecutionContext;
}

function datadogEnv(): WorkerEnv {
  return {
    ...envWithCatalog(),
    DATADOG_API_KEY: "dd-key",
    DATADOG_ENABLED: "true",
    DATADOG_ENV: "production",
    DATADOG_SERVICE: "mpp-discovery-service-mcp",
    DATADOG_SITE: "us5.datadoghq.com",
  };
}

function collectingContext(): ExecutionContext & { drain(): Promise<void> } {
  const promises: Promise<unknown>[] = [];
  return {
    waitUntil(promise: Promise<unknown>) {
      promises.push(promise);
    },
    passThroughOnException() {},
    props: {},
    async drain() {
      for (let index = 0; index < promises.length; index += 1) {
        await promises[index];
      }
    },
  } as unknown as ExecutionContext & { drain(): Promise<void> };
}

function scheduled(cron: string): ScheduledController {
  return {
    cron,
    scheduledTime: Date.now(),
    noRetry() {},
  } as unknown as ScheduledController;
}

async function healthyPublicEndpoint(request: Request): Promise<Response> {
  if (request.url !== "https://mpp.dev/mcp/services") {
    throw new Error(`unexpected url ${request.url}`);
  }

  if (request.method === "GET") {
    return Response.json({
      serverInfo: { name: "mpp-services-mcp" },
      transport: { endpoint: "https://mpp.dev/mcp/services" },
      instructions: "Runtime 402 Challenges are authoritative.",
    });
  }

  if (request.method === "HEAD") {
    return new Response(null, { status: 200 });
  }

  const body = (await request.json()) as {
    method: string;
    params?: { name?: string };
  };
  if (body.method === "initialize") {
    return rpcResult({
      serverInfo: { name: "mpp-services-mcp" },
      instructions: "Runtime 402 Challenges are authoritative.",
    });
  }
  if (body.method === "tools/list") {
    return rpcResult({
      tools: [
        { name: "list_services" },
        { name: "search_services" },
        { name: "get_catalog_status" },
      ],
    });
  }
  if (
    body.method === "tools/call" &&
    body.params?.name === "get_catalog_status"
  ) {
    return rpcResult({
      structuredContent: {
        serviceCount: 137,
        offerCount: 1200,
        cacheAgeSeconds: 60,
      },
    });
  }
  if (body.method === "tools/call" && body.params?.name === "search_services") {
    return rpcResult({
      structuredContent: {
        total: 27,
        returned: 1,
      },
    });
  }
  return Response.json(
    { jsonrpc: "2.0", id: 1, error: { code: -32601, message: "missing" } },
    { status: 200 },
  );
}

function rpcResult(result: unknown): Response {
  return Response.json({ jsonrpc: "2.0", id: 1, result });
}
