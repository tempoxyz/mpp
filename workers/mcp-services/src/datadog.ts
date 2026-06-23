import type { WorkerEnv } from "./types.js";

type MetricType = "count" | "gauge";

export type DatadogMetric = {
  metric: string;
  value: number;
  type: MetricType;
  tags?: string[];
};

const DEFAULT_DATADOG_SITE = "us5.datadoghq.com";
const METRIC_PREFIX = "mpp.discovery_mcp";

export function metricName(name: string): string {
  return `${METRIC_PREFIX}.${name}`;
}

export function emitDatadogMetrics(
  env: WorkerEnv,
  ctx: ExecutionContext,
  metrics: DatadogMetric[],
): void {
  if (metrics.length === 0 || !datadogEnabled(env)) return;

  ctx.waitUntil(
    sendDatadogMetrics(env, metrics).catch((error) => {
      console.error(
        JSON.stringify({
          message: "datadog.metrics_failed",
          error: errorMessage(error),
        }),
      );
    }),
  );
}

export async function sendDatadogMetrics(
  env: WorkerEnv,
  metrics: DatadogMetric[],
): Promise<void> {
  if (metrics.length === 0 || !datadogEnabled(env)) return;

  const apiKey = env.DATADOG_API_KEY;
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
  const tags = baseTags(env);
  const response = await fetch(`${datadogApiBase(env)}/api/v1/series`, {
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
        tags: [...tags, ...(metric.tags ?? [])],
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Datadog metrics API failed: ${response.status}`);
  }
}

export function datadogEnabled(env: WorkerEnv): boolean {
  const configured = normalized(env.DATADOG_ENABLED);
  if (configured === "true") return true;
  if (configured === "false") return false;
  return Boolean(env.DATADOG_API_KEY);
}

function datadogApiBase(env: WorkerEnv): string {
  const site = env.DATADOG_SITE || DEFAULT_DATADOG_SITE;
  if (/^https?:\/\//i.test(site)) return site.replace(/\/+$/, "");
  if (site.startsWith("api.")) return `https://${site}`;
  return `https://api.${site}`;
}

function baseTags(env: WorkerEnv): string[] {
  return [
    `service:${env.DATADOG_SERVICE || "mpp-discovery-service-mcp"}`,
    `env:${env.DATADOG_ENV || "production"}`,
  ];
}

function normalized(value: string | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
