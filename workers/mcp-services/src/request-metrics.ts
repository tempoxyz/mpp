import {
  count,
  type DatadogMetricsClient,
  gauge,
  type MetricPoint,
} from "./datadog.js";

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

export class RequestMetricsRecorder {
  constructor(private readonly metrics: DatadogMetricsClient) {}

  async trace(
    request: Request,
    ctx: ExecutionContext,
    route: string,
    handler: () => Promise<Response>,
  ): Promise<Response> {
    const startedAt = Date.now();
    const summaryPromise =
      route === "mcp"
        ? summarizeMcpRequest(request)
        : Promise.resolve(undefined);

    try {
      const response = await handler();
      this.queue(ctx, {
        request,
        route,
        status: response.status,
        durationMs: Date.now() - startedAt,
        summaryPromise,
        thrown: false,
      });
      return response;
    } catch (error) {
      this.queue(ctx, {
        request,
        route,
        status: 500,
        durationMs: Date.now() - startedAt,
        summaryPromise,
        thrown: true,
      });
      throw error;
    }
  }

  private queue(ctx: ExecutionContext, sample: RequestMetricSample): void {
    ctx.waitUntil(
      sample.summaryPromise
        .then((summary) =>
          this.metrics.send(
            buildRequestMetrics({
              ...sample,
              summary,
            }),
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
}

type RequestMetricSample = {
  request: Request;
  route: string;
  status: number;
  durationMs: number;
  summaryPromise: Promise<McpRequestSummary | undefined>;
  thrown: boolean;
};

type ResolvedRequestMetricSample = Omit<
  RequestMetricSample,
  "summaryPromise"
> & {
  summary?: McpRequestSummary;
};

function buildRequestMetrics(
  sample: ResolvedRequestMetricSample,
): MetricPoint[] {
  const tags = [
    `route:${sample.route}`,
    `method:${sample.request.method}`,
    `status_class:${statusClass(sample.status)}`,
  ];
  const metrics = [
    count("http.request.count", 1, tags),
    gauge("http.response.duration_ms", sample.durationMs, tags),
  ];

  if (sample.summary?.method) {
    metrics.push(...mcpMetrics(sample));
  }

  return metrics;
}

function mcpMetrics(sample: ResolvedRequestMetricSample): MetricPoint[] {
  const status = sample.thrown || sample.status >= 500 ? "server_error" : "ok";
  const tags = [
    `mcp_method:${sample.summary?.method}`,
    ...(sample.summary?.tool ? [`tool:${sample.summary.tool}`] : []),
    `status:${status}`,
  ];
  return [
    count("mcp.request.count", 1, tags),
    gauge("mcp.response.duration_ms", sample.durationMs, tags),
    ...(status === "server_error"
      ? [count("mcp.error.count", 1, [...tags, "error_class:server"])]
      : []),
  ];
}

async function summarizeMcpRequest(
  request: Request,
): Promise<McpRequestSummary | undefined> {
  try {
    const body = await request.clone().json();
    const message = Array.isArray(body) ? body[0] : body;
    if (typeof message !== "object" || message === null) return undefined;
    const method = stringValue((message as { method?: unknown }).method);
    const params = (message as { params?: unknown }).params;
    if (
      method !== "tools/call" ||
      typeof params !== "object" ||
      params === null
    ) {
      return method ? { method } : undefined;
    }
    const rawTool = stringValue((params as { name?: unknown }).name);
    return {
      method,
      tool: rawTool && KNOWN_TOOLS.has(rawTool) ? rawTool : "unknown",
    };
  } catch {
    return undefined;
  }
}

function stringValue(value: unknown): string | undefined {
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
