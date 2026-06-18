import { describe, expect, it } from "vitest";
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
