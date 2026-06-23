import {
  type DatadogMetric,
  metricName,
  sendDatadogMetrics,
} from "./datadog.js";
import type { WorkerEnv } from "./types.js";

type McpRequestSummary = {
  method?: string;
  tool?: string;
};

const KNOWN_TOOLS = new Set([
  "list_services",
  "search_services",
  "search_offers",
  "recommend_services",
  "get_usage_recipe",
  "get_facets",
  "get_services_by_recipient",
  "get_catalog_status",
  "get_service",
  "get_offers",
  "get_openapi",
]);

export async function withRequestMetrics(
  request: Request,
  env: WorkerEnv,
  ctx: ExecutionContext,
  route: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  const startedAt = Date.now();
  const mcpSummaryPromise =
    route === "mcp" ? summarizeMcpRequest(request) : Promise.resolve(undefined);
  let response: Response;
  try {
    response = await handler();
  } catch (error) {
    queueRequestMetrics(
      env,
      ctx,
      mcpSummaryPromise,
      request,
      route,
      500,
      Date.now() - startedAt,
      true,
    );
    throw error;
  }

  queueRequestMetrics(
    env,
    ctx,
    mcpSummaryPromise,
    request,
    route,
    response.status,
    Date.now() - startedAt,
    false,
  );
  return response;
}

function queueRequestMetrics(
  env: WorkerEnv,
  ctx: ExecutionContext,
  summaryPromise: Promise<McpRequestSummary | undefined>,
  request: Request,
  route: string,
  status: number,
  durationMs: number,
  thrown: boolean,
): void {
  ctx.waitUntil(
    summaryPromise
      .then((summary) =>
        sendDatadogMetrics(
          env,
          requestMetrics(request, route, status, durationMs, summary, thrown),
        ),
      )
      .catch((error) => {
        console.error(
          JSON.stringify({
            message: "datadog.request_metrics_failed",
            error: errorMessage(error),
          }),
        );
      }),
  );
}

function requestMetrics(
  request: Request,
  route: string,
  status: number,
  durationMs: number,
  summary: McpRequestSummary | undefined,
  thrown: boolean,
): DatadogMetric[] {
  const tags = [
    `route:${route}`,
    `method:${request.method}`,
    `status_class:${statusClass(status)}`,
  ];
  const metrics: DatadogMetric[] = [
    {
      metric: metricName("http.request.count"),
      type: "count",
      value: 1,
      tags,
    },
    {
      metric: metricName("http.response.duration_ms"),
      type: "gauge",
      value: durationMs,
      tags,
    },
  ];

  if (summary?.method) {
    const mcpTags = [
      `mcp_method:${summary.method}`,
      ...(summary.tool ? [`tool:${summary.tool}`] : []),
      `status:${thrown || status >= 500 ? "server_error" : "ok"}`,
    ];
    metrics.push(
      {
        metric: metricName("mcp.request.count"),
        type: "count",
        value: 1,
        tags: mcpTags,
      },
      {
        metric: metricName("mcp.response.duration_ms"),
        type: "gauge",
        value: durationMs,
        tags: mcpTags,
      },
    );
    if (thrown || status >= 500) {
      metrics.push({
        metric: metricName("mcp.error.count"),
        type: "count",
        value: 1,
        tags: [...mcpTags, "error_class:server"],
      });
    }
  }

  return metrics;
}

async function summarizeMcpRequest(
  request: Request,
): Promise<McpRequestSummary | undefined> {
  try {
    const body = await request.clone().json();
    const message = Array.isArray(body) ? body[0] : body;
    if (typeof message !== "object" || message === null) return undefined;
    const method = valueAsString((message as { method?: unknown }).method);
    const params = (message as { params?: unknown }).params;
    if (
      method !== "tools/call" ||
      typeof params !== "object" ||
      params === null
    ) {
      return method ? { method } : undefined;
    }
    const rawTool = valueAsString((params as { name?: unknown }).name);
    const tool = rawTool && KNOWN_TOOLS.has(rawTool) ? rawTool : "unknown";
    return { method, tool };
  } catch {
    return undefined;
  }
}

function valueAsString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function statusClass(status: number): string {
  if (status >= 500) return "5xx";
  if (status >= 400) return "4xx";
  if (status >= 300) return "3xx";
  if (status >= 200) return "2xx";
  return "other";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
