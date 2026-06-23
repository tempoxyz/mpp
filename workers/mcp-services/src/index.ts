import { refreshCatalog } from "./cache.js";
import { emitDatadogMetrics, metricName } from "./datadog.js";
import { countPaymentOffers } from "./discovery.js";
import { runPublicHealthCheck } from "./health.js";
import { handleMcp, jsonHeaders, optionsResponse, serverCard } from "./mcp.js";
import { withRequestMetrics } from "./request-metrics.js";
import type { WorkerEnv } from "./types.js";

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const publicEndpoint = publicMcpEndpoint(url, env);

    return withRequestMetrics(
      request,
      env,
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
    if (event.cron === "* * * * *") {
      ctx.waitUntil(runScheduledHealthCheck(event, env, ctx));
      return;
    }

    const startedAt = Date.now();
    ctx.waitUntil(
      refreshCatalog(env)
        .then((catalog) => {
          emitDatadogMetrics(env, ctx, [
            {
              metric: metricName("catalog.refresh.ok"),
              type: "gauge",
              value: 1,
            },
            {
              metric: metricName("catalog.refresh.duration_ms"),
              type: "gauge",
              value: Date.now() - startedAt,
            },
            {
              metric: metricName("catalog.services"),
              type: "gauge",
              value: catalog.services.length,
            },
            {
              metric: metricName("catalog.offers"),
              type: "gauge",
              value: countPaymentOffers(catalog.services),
            },
            {
              metric: metricName("catalog.cache_age_seconds"),
              type: "gauge",
              value: 0,
            },
          ]);
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
          emitDatadogMetrics(env, ctx, [
            {
              metric: metricName("catalog.refresh.ok"),
              type: "gauge",
              value: 0,
            },
            {
              metric: metricName("catalog.refresh.duration_ms"),
              type: "gauge",
              value: Date.now() - startedAt,
            },
          ]);
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
  ctx: ExecutionContext,
): Promise<void> {
  const startedAt = Date.now();
  const metrics = await runPublicHealthCheck(env);
  emitDatadogMetrics(env, ctx, metrics);
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
