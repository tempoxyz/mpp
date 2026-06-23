import type { WorkerEnv } from "./types.js";

type MetricType = "count" | "gauge";

export type MetricPoint = {
  metric: string;
  value: number;
  type: MetricType;
  tags?: string[];
};

const DEFAULT_DATADOG_SITE = "us5.datadoghq.com";
const METRIC_PREFIX = "mpp.discovery_mcp";
const DEFAULT_SERVICE = "mpp-discovery-service-mcp";
const DEFAULT_ENV = "production";

export function metricName(name: string): string {
  return `${METRIC_PREFIX}.${name}`;
}

export function gauge(
  name: string,
  value: number,
  tags?: string[],
): MetricPoint {
  return { metric: metricName(name), type: "gauge", value, tags };
}

export function count(name: string, value = 1, tags?: string[]): MetricPoint {
  return { metric: metricName(name), type: "count", value, tags };
}

export class DatadogMetricsClient {
  constructor(private readonly env: WorkerEnv) {}

  queue(ctx: ExecutionContext, metrics: MetricPoint[]): void {
    if (!this.enabled || metrics.length === 0) return;

    ctx.waitUntil(
      this.send(metrics).catch((error) => {
        console.error(
          JSON.stringify({
            message: "datadog.metrics_failed",
            error: errorMessage(error),
          }),
        );
      }),
    );
  }

  async send(metrics: MetricPoint[]): Promise<void> {
    if (!this.enabled || metrics.length === 0) return;

    const apiKey = this.env.DATADOG_API_KEY;
    if (!apiKey) {
      console.warn(
        JSON.stringify({
          message: "datadog.metrics_skipped",
          reason: "missing_api_key",
        }),
      );
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const response = await fetch(`${this.apiBase}/api/v1/series`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "DD-API-KEY": apiKey,
      },
      body: JSON.stringify({
        series: metrics.map((metric) => ({
          metric: metric.metric,
          type: metric.type,
          points: [[timestamp, metric.value]],
          tags: [...this.baseTags, ...(metric.tags ?? [])],
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Datadog metrics API failed: ${response.status}`);
    }
  }

  get enabled(): boolean {
    const configured = normalized(this.env.DATADOG_ENABLED);
    if (configured === "true") return true;
    if (configured === "false") return false;
    return Boolean(this.env.DATADOG_API_KEY);
  }

  private get apiBase(): string {
    const site = this.env.DATADOG_SITE || DEFAULT_DATADOG_SITE;
    if (/^https?:\/\//i.test(site)) return site.replace(/\/+$/, "");
    if (site.startsWith("api.")) return `https://${site}`;
    return `https://api.${site}`;
  }

  private get baseTags(): string[] {
    return [
      `service:${this.env.DATADOG_SERVICE || DEFAULT_SERVICE}`,
      `env:${this.env.DATADOG_ENV || DEFAULT_ENV}`,
    ];
  }
}

function normalized(value: string | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
