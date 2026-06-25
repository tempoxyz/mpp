import { afterEach, describe, expect, it, vi } from "vitest";
import { flushWorkerMetrics, workerMetrics } from "./worker-metrics.js";

type MetricEntry = {
  n: string;
  v: number;
  tags: Record<string, string | number | boolean | null | undefined>;
};

describe("workerMetrics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    silenceMetricFlush();
  });

  it("emits Tempo worker metrics as cwm log entries with service tags", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    workerMetrics.gauge("mpp_discovery_mcp_health_ok", 1, {
      endpoint: "public",
    });
    flushWorkerMetrics();

    expect(loggedMetrics(log)).toEqual([
      expect.objectContaining({
        n: "mpp_discovery_mcp_health_ok",
        v: 1,
        tags: {
          component: "discovery_mcp",
          endpoint: "public",
          repository: "mpp",
          service: "mpp-discovery-service-mcp",
        },
      }),
    ]);
  });
});

function silenceMetricFlush(): void {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  flushWorkerMetrics();
  log.mockRestore();
}

function loggedMetrics(log: { mock: { calls: unknown[][] } }): MetricEntry[] {
  return log.mock.calls
    .map((call) => (typeof call[0] === "string" ? call[0] : ""))
    .filter((message) => message.startsWith("cwm-"))
    .flatMap((message) => JSON.parse(message.slice("cwm-".length)));
}
