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

export function gauge(
  name: string,
  value: number,
  tags?: string[],
): MetricPoint {
  return { metric: `${METRIC_PREFIX}.${name}`, type: "gauge", value, tags };
}

export function count(name: string, value = 1, tags?: string[]): MetricPoint {
  return { metric: `${METRIC_PREFIX}.${name}`, type: "count", value, tags };
}

export function queueMetrics(
  ctx: ExecutionContext,
  env: WorkerEnv,
  metrics: MetricPoint[],
): void {
  if (!datadogEnabled(env) || metrics.length === 0) return;

  ctx.waitUntil(
    postMetrics(env, metrics).catch((error) => {
      console.error(
        JSON.stringify({
          message: "datadog.metrics_failed",
          error: errorMessage(error),
        }),
      );
    }),
  );
}

export async function postMetrics(
  env: WorkerEnv,
  metrics: MetricPoint[],
): Promise<void> {
  if (!datadogEnabled(env) || metrics.length === 0) return;

  if (!env.DATADOG_API_KEY) {
    console.warn(
      JSON.stringify({
        message: "datadog.metrics_skipped",
        reason: "missing_api_key",
      }),
    );
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const baseTags = [
    `service:${env.DATADOG_SERVICE || DEFAULT_SERVICE}`,
    `env:${env.DATADOG_ENV || DEFAULT_ENV}`,
  ];
  const response = await fetch(`${apiBase(env)}/api/v1/series`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "DD-API-KEY": env.DATADOG_API_KEY,
    },
    body: JSON.stringify({
      series: metrics.map((metric) => ({
        metric: metric.metric,
        type: metric.type,
        points: [[timestamp, metric.value]],
        tags: [...baseTags, ...(metric.tags ?? [])],
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

function apiBase(env: WorkerEnv): string {
  const site = env.DATADOG_SITE || DEFAULT_DATADOG_SITE;
  if (/^https?:\/\//i.test(site)) return site.replace(/\/+$/, "");
  if (site.startsWith("api.")) return `https://${site}`;
  return `https://api.${site}`;
}

function normalized(value: string | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
