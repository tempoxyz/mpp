import { afterEach, describe, expect, it, vi } from "vitest";
import { DatadogMetricsClient, gauge } from "./datadog.js";
import type { WorkerEnv } from "./types.js";

describe("datadog metrics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts metrics to the configured Datadog site", async () => {
    const requests: Request[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        requests.push(new Request(input, init));
        return new Response("{}", { status: 202 });
      }),
    );

    await new DatadogMetricsClient(env()).send([
      gauge("health.ok", 1, ["check:initialize"]),
    ]);

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe("https://api.us5.datadoghq.com/api/v1/series");
    expect(requests[0].headers.get("DD-API-KEY")).toBe("dd-key");
    const body = (await requests[0].json()) as {
      series: Array<{
        metric: string;
        points: [[number, number]];
        tags: string[];
      }>;
    };
    expect(body.series[0]).toEqual(
      expect.objectContaining({
        metric: "mpp.discovery_mcp.health.ok",
        points: [[expect.any(Number), 1]],
        tags: [
          "service:mpp-discovery-service-mcp",
          "env:production",
          "check:initialize",
        ],
      }),
    );
  });

  it("skips posting when disabled", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    await new DatadogMetricsClient({
      ...env(),
      DATADOG_ENABLED: "false",
    }).send([gauge("health.ok", 1)]);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires explicit enablement or an API key", () => {
    expect(new DatadogMetricsClient({} as WorkerEnv).enabled).toBe(false);
    expect(
      new DatadogMetricsClient({ DATADOG_ENABLED: "true" } as WorkerEnv)
        .enabled,
    ).toBe(true);
    expect(
      new DatadogMetricsClient({ DATADOG_API_KEY: "key" } as WorkerEnv).enabled,
    ).toBe(true);
  });
});

function env(): WorkerEnv {
  return {
    DATADOG_API_KEY: "dd-key",
    DATADOG_ENABLED: "true",
    DATADOG_ENV: "production",
    DATADOG_SERVICE: "mpp-discovery-service-mcp",
    DATADOG_SITE: "us5.datadoghq.com",
  } as WorkerEnv;
}
