import { afterEach, describe, expect, it, vi } from "vitest";
import { DatadogMetricsClient } from "./datadog.js";

describe("DatadogMetricsClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts namespaced metrics through the Datadog API client", async () => {
    const requests: Request[] = [];
    const fetch = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        requests.push(new Request(input, init));
        return Response.json({ errors: [] }, { status: 202 });
      },
    );
    const datadog = new DatadogMetricsClient({
      apiKey: "dd-key",
      component: "discovery_mcp",
      enabled: "true",
      env: "production",
      fetch: fetch as typeof globalThis.fetch,
      service: "mpp-discovery-service-mcp",
      site: "us5.datadoghq.com",
    });

    await datadog.submit([datadog.gauge("health.ok", 1, ["check:initialize"])]);

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe("https://api.us5.datadoghq.com/api/v2/series");
    expect(requests[0].headers.get("DD-API-KEY")).toBe("dd-key");
    const body = (await requests[0].json()) as {
      series: Array<{
        metric: string;
        points: Array<{ timestamp: number; value: number }>;
        tags: string[];
        type: number;
      }>;
    };
    expect(body.series[0]).toEqual(
      expect.objectContaining({
        metric: "mpp.discovery_mcp.health.ok",
        points: [{ timestamp: expect.any(Number), value: 1 }],
        tags: [
          "repository:mpp",
          "env:production",
          "service:mpp-discovery-service-mcp",
          "component:discovery_mcp",
          "check:initialize",
        ],
        type: 3,
      }),
    );
  });

  it("skips posting when disabled", async () => {
    const fetch = vi.fn();
    const datadog = new DatadogMetricsClient({
      apiKey: "dd-key",
      enabled: "false",
      fetch: fetch as typeof globalThis.fetch,
    });

    await datadog.submit([datadog.gauge("health.ok", 1)]);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires explicit enablement or an API key", () => {
    expect(new DatadogMetricsClient({}).enabled).toBe(false);
    expect(new DatadogMetricsClient({ enabled: "true" }).enabled).toBe(true);
    expect(new DatadogMetricsClient({ apiKey: "key" }).enabled).toBe(true);
  });

  it("builds metric names from repository and component scopes", () => {
    const datadog = new DatadogMetricsClient({
      component: "discovery_mcp",
      repository: "mpp",
    });

    expect(datadog.metricName("health.ok")).toBe("mpp.discovery_mcp.health.ok");
  });
});
