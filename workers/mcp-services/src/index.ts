import { refreshCatalog } from "./cache.js";
import { DatadogMetricsClient, gauge, type MetricPoint } from "./datadog.js";
import { countPaymentOffers } from "./discovery.js";
import { McpHealthChecker } from "./health.js";
import { handleMcp, jsonHeaders, optionsResponse, serverCard } from "./mcp.js";
import { RequestMetricsRecorder } from "./request-metrics.js";
import type { WorkerEnv } from "./types.js";

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const publicEndpoint = publicMcpEndpoint(url, env);
    const metrics = new DatadogMetricsClient(env);
    const requestMetrics = new RequestMetricsRecorder(metrics);

    return requestMetrics.trace(
      request,
      ctx,
      routeName(url.pathname, request.method),
      async () => {
        if (request.method === "OPTIONS") return optionsResponse();

        if (
          (url.pathname === "/mcp/services" ||
            url.pathname === "/mcp" ||
            url.pathname === "/") &&
          request.method === "POST"
        ) {
          return handleMcp(request, env, ctx);
        }

        if (url.pathname === "/" && request.method === "GET") {
          return Response.json(
            {
              name: "mpp-services-mcp",
              mcp: publicEndpoint,
              serverCard: publicEndpoint,
              description:
                "Read-only MCP server for the MPP service discovery catalog.",
            },
            { headers: jsonHeaders() },
          );
        }

        if (url.pathname === "/mcp/services" && request.method === "GET") {
          return Response.json(serverCard(publicEndpoint), {
            headers: jsonHeaders(),
          });
        }

        if (url.pathname === "/mcp/services" && request.method === "HEAD") {
          return new Response(null, { status: 200, headers: jsonHeaders() });
        }

        return Response.json(
          { error: "not found" },
          { status: 404, headers: jsonHeaders() },
        );
      },
    );
  },

  async scheduled(
    event: ScheduledController,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ) {
    const metrics = new DatadogMetricsClient(env);

    if (event.cron === "* * * * *") {
      ctx.waitUntil(runScheduledHealthCheck(event, env, metrics, ctx));
      return;
    }

    const startedAt = Date.now();
    ctx.waitUntil(
      refreshCatalog(env)
        .then((catalog) => {
          metrics.queue(
            ctx,
            catalogRefreshMetrics({
              ok: true,
              durationMs: Date.now() - startedAt,
              services: catalog.services.length,
              offers: countPaymentOffers(catalog.services),
            }),
          );
          console.log(
            JSON.stringify({
              message: "catalog.refresh_complete",
              cron: event.cron,
              scheduledTime: new Date(event.scheduledTime).toISOString(),
              durationMs: Date.now() - startedAt,
              version: catalog.version,
              services: catalog.services.length,
              fetchedAt: catalog.fetchedAt,
            }),
          );
        })
        .catch((error) => {
          metrics.queue(
            ctx,
            catalogRefreshMetrics({
              ok: false,
              durationMs: Date.now() - startedAt,
            }),
          );
          console.error(
            JSON.stringify({
              message: "catalog.refresh_failed",
              cron: event.cron,
              scheduledTime: new Date(event.scheduledTime).toISOString(),
              durationMs: Date.now() - startedAt,
              error: error instanceof Error ? error.message : String(error),
            }),
          );
        }),
    );
  },
} satisfies ExportedHandler<Env>;

function publicMcpEndpoint(url: URL, env: WorkerEnv): string {
  return env.PUBLIC_MCP_ENDPOINT || `${url.origin}/mcp/services`;
}

async function runScheduledHealthCheck(
  event: ScheduledController,
  env: WorkerEnv,
  metrics: DatadogMetricsClient,
  ctx: ExecutionContext,
): Promise<void> {
  const startedAt = Date.now();
  const healthMetrics = await McpHealthChecker.fromEnv(env).metrics();
  metrics.queue(ctx, healthMetrics);
  console.log(
    JSON.stringify({
      message: "mcp.health_complete",
      cron: event.cron,
      scheduledTime: new Date(event.scheduledTime).toISOString(),
      durationMs: Date.now() - startedAt,
    }),
  );
}

function routeName(pathname: string, method: string): string {
  if (method === "OPTIONS") return "options";
  if (
    method === "POST" &&
    (pathname === "/mcp/services" || pathname === "/mcp" || pathname === "/")
  ) {
    return "mcp";
  }
  if (pathname === "/mcp/services") return "mcp_services_card";
  if (pathname === "/") return "root";
  return "not_found";
}

function catalogRefreshMetrics({
  ok,
  durationMs,
  services,
  offers,
}: {
  ok: boolean;
  durationMs: number;
  services?: number;
  offers?: number;
}): MetricPoint[] {
  return [
    gauge("catalog.refresh.ok", ok ? 1 : 0),
    gauge("catalog.refresh.duration_ms", durationMs),
    ...(ok && services !== undefined && offers !== undefined
      ? [
          gauge("catalog.services", services),
          gauge("catalog.offers", offers),
          gauge("catalog.cache_age_seconds", 0),
        ]
      : []),
  ];
}
