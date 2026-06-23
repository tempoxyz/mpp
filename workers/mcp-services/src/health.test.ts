import { afterEach, describe, expect, it, vi } from "vitest";
import { McpHealthChecker } from "./health.js";

const endpoint = "https://mpp.dev/mcp/services";

describe("public health check", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("emits healthy metrics for representative MCP checks", async () => {
    vi.stubGlobal("fetch", vi.fn(healthyFetch));

    const metrics = await new McpHealthChecker(endpoint).metrics();

    expect(metricValue(metrics, "mpp.discovery_mcp.health.ok")).toBe(1);
    expect(metricValue(metrics, "mpp.discovery_mcp.catalog.services")).toBe(
      137,
    );
    expect(metricValue(metrics, "mpp.discovery_mcp.catalog.offers")).toBe(1200);
    expect(metricValue(metrics, "mpp.discovery_mcp.tools.advertised")).toBe(11);
  });

  it("emits unhealthy metrics when a public check fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const request = new Request(input, init);
        if (request.method === "GET") {
          return new Response("missing", { status: 503 });
        }
        return healthyFetch(input, init);
      }),
    );

    const metrics = await new McpHealthChecker(endpoint).metrics();

    expect(metricValue(metrics, "mpp.discovery_mcp.health.ok")).toBe(0);
    expect(metricValue(metrics, "mpp.discovery_mcp.health.failure.count")).toBe(
      1,
    );
    expect(
      metrics.find(
        (metric) =>
          metric.metric === "mpp.discovery_mcp.health.check.ok" &&
          metric.tags?.includes("check:get_card"),
      )?.value,
    ).toBe(0);
  });
});

async function healthyFetch(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const request = new Request(input, init);
  if (request.url !== endpoint)
    throw new Error(`unexpected url ${request.url}`);

  if (request.method === "GET") {
    return Response.json({
      serverInfo: { name: "mpp-services-mcp" },
      transport: { endpoint },
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
        { name: "search_offers" },
        { name: "recommend_services" },
        { name: "get_usage_recipe" },
        { name: "get_facets" },
        { name: "get_services_by_recipient" },
        { name: "get_catalog_status" },
        { name: "get_service" },
        { name: "get_offers" },
        { name: "get_openapi" },
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

function metricValue(
  metrics: Array<{ metric: string; value: number }>,
  name: string,
) {
  return metrics.find((metric) => metric.metric === name)?.value;
}
