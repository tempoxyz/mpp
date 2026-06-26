import { afterEach, describe, expect, it, vi } from "vitest";
import { flushWorkerMetrics } from "../../../src/lib/worker-metrics.js";
import { healthMetrics } from "./health.js";
import type { WorkerEnv } from "./types.js";

const endpoint = "https://mpp.dev/mcp/services";

describe("public health check", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    silenceMetricFlush();
  });

  it("emits healthy metrics for representative MCP checks", async () => {
    vi.stubGlobal("fetch", vi.fn(healthyFetch));

    const metrics = await captureMetrics(() => healthMetrics(env()));

    expect(metricValue(metrics, "mpp_discovery_mcp_health_ok")).toBe(1);
    expect(metricValue(metrics, "mpp_discovery_mcp_catalog_services")).toBe(
      137,
    );
    expect(metricValue(metrics, "mpp_discovery_mcp_catalog_offers")).toBe(1200);
    expect(
      metricValue(metrics, "mpp_discovery_mcp_health_duration_ms"),
    ).toBeDefined();
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
    vi.spyOn(console, "error").mockImplementation(() => {});

    const metrics = await captureMetrics(() => healthMetrics(env()));

    expect(metricValue(metrics, "mpp_discovery_mcp_health_ok")).toBe(0);
    expect(
      metrics.find(
        (metric) =>
          metric.n === "mpp_discovery_mcp_health_check_ok" &&
          metric.tags.check === "get_card",
      )?.value,
    ).toBe(0);
  });

  it("keeps catalog gauges when catalog health thresholds fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo, init?: RequestInit) =>
        healthyFetch(input, init, { cacheAgeSeconds: 4 * 60 * 60 }),
      ),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    const metrics = await captureMetrics(() => healthMetrics(env()));

    expect(metricValue(metrics, "mpp_discovery_mcp_health_ok")).toBe(0);
    expect(
      metricValue(metrics, "mpp_discovery_mcp_catalog_cache_age_seconds"),
    ).toBe(4 * 60 * 60);
    expect(metricValue(metrics, "mpp_discovery_mcp_catalog_services")).toBe(
      137,
    );
    expect(metricValue(metrics, "mpp_discovery_mcp_catalog_offers")).toBe(1200);
  });
});

async function healthyFetch(
  input: RequestInfo,
  init?: RequestInit,
  catalogOverride: Partial<{
    serviceCount: number;
    offerCount: number;
    cacheAgeSeconds: number;
  }> = {},
): Promise<Response> {
  const catalog = {
    serviceCount: 137,
    offerCount: 1200,
    cacheAgeSeconds: 60,
    ...catalogOverride,
  };
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
        serviceCount: catalog.serviceCount,
        offerCount: catalog.offerCount,
        cacheAgeSeconds: catalog.cacheAgeSeconds,
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

function env(): WorkerEnv {
  return {
    PUBLIC_MCP_ENDPOINT: endpoint,
  } as WorkerEnv;
}

type MetricEntry = {
  n: string;
  value: number;
  tags: Record<string, string | number | boolean | null | undefined>;
};

async function captureMetrics(fn: () => Promise<void>): Promise<MetricEntry[]> {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  await fn();
  flushWorkerMetrics();
  return loggedMetrics(log);
}

function silenceMetricFlush(): void {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  flushWorkerMetrics();
  log.mockRestore();
}

function loggedMetrics(log: { mock: { calls: unknown[][] } }): MetricEntry[] {
  return log.mock.calls
    .map((call) => (typeof call[0] === "string" ? call[0] : ""))
    .filter((message) => message.startsWith("cwm-"))
    .flatMap((message) =>
      JSON.parse(message.slice("cwm-".length)).map(
        (entry: { n: string; v: number; tags: MetricEntry["tags"] }) => ({
          n: entry.n,
          tags: entry.tags,
          value: entry.v,
        }),
      ),
    );
}

function metricValue(metrics: MetricEntry[], name: string): number | undefined {
  return metrics.find((metric) => metric.n === name)?.value;
}
