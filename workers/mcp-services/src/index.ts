import {
  configureDatadogMetrics,
  type DatadogMetric,
  datadogMetrics,
} from "../../../src/lib/datadog.js";
import { refreshCatalog } from "./cache.js";
import { countPaymentOffers } from "./discovery.js";
import { healthMetrics } from "./health.js";
import { handleMcp, jsonHeaders, optionsResponse, serverCard } from "./mcp.js";
import type { WorkerEnv } from "./types.js";

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const publicEndpoint = publicMcpEndpoint(url, env);
    configureDatadogFromEnv(env);

    return trackRequest(
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
    configureDatadogFromEnv(env);

    if (event.cron === "* * * * *") {
      ctx.waitUntil(runScheduledHealthCheck(event, env));
      return;
    }

    ctx.waitUntil(runCatalogRefresh(event, env));
  },
} satisfies ExportedHandler<Env>;

async function trackRequest(
  request: Request,
  ctx: ExecutionContext,
  route: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  const datadog = datadogMetrics();
  const startedAt = Date.now();
  try {
    const response = await handler();
    datadog.queue(
      (promise) => ctx.waitUntil(promise),
      requestMetrics(request, route, response.status, Date.now() - startedAt),
    );
    return response;
  } catch (error) {
    datadog.queue(
      (promise) => ctx.waitUntil(promise),
      requestMetrics(request, route, 500, Date.now() - startedAt, true),
    );
    throw error;
  }
}

function configureDatadogFromEnv(env: WorkerEnv): void {
  configureDatadogMetrics({
    apiKey: env.DATADOG_API_KEY,
    component: "discovery_mcp",
    enabled: env.DATADOG_ENABLED,
    env: env.DATADOG_ENV,
    service: env.DATADOG_SERVICE,
    site: env.DATADOG_SITE,
  });
}

function publicMcpEndpoint(url: URL, env: WorkerEnv): string {
  return env.PUBLIC_MCP_ENDPOINT || `${url.origin}/mcp/services`;
}

async function runScheduledHealthCheck(
  event: ScheduledController,
  env: WorkerEnv,
): Promise<void> {
  const startedAt = Date.now();
  await datadogMetrics()
    .submit(await healthMetrics(env))
    .catch(logMetricsError);
  console.log(
    JSON.stringify({
      message: "mcp.health_complete",
      cron: event.cron,
      scheduledTime: new Date(event.scheduledTime).toISOString(),
      durationMs: Date.now() - startedAt,
    }),
  );
}

async function runCatalogRefresh(
  event: ScheduledController,
  env: WorkerEnv,
): Promise<void> {
  const startedAt = Date.now();
  try {
    const catalog = await refreshCatalog(env);
    await datadogMetrics()
      .submit(
        catalogRefreshMetrics({
          ok: true,
          durationMs: Date.now() - startedAt,
          services: catalog.services.length,
          offers: countPaymentOffers(catalog.services),
        }),
      )
      .catch(logMetricsError);
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
  } catch (error) {
    await datadogMetrics()
      .submit(
        catalogRefreshMetrics({
          ok: false,
          durationMs: Date.now() - startedAt,
        }),
      )
      .catch(logMetricsError);
    console.error(
      JSON.stringify({
        message: "catalog.refresh_failed",
        cron: event.cron,
        scheduledTime: new Date(event.scheduledTime).toISOString(),
        durationMs: Date.now() - startedAt,
        error: errorMessage(error),
      }),
    );
  }
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

function requestMetrics(
  request: Request,
  route: string,
  status: number,
  durationMs: number,
  thrown = false,
): DatadogMetric[] {
  const datadog = datadogMetrics();
  const tags = [
    `route:${route}`,
    `method:${request.method}`,
    `status_class:${statusClass(status)}`,
  ];
  return [
    datadog.count("http.request.count", 1, tags),
    datadog.gauge("http.response.duration_ms", durationMs, tags),
    ...(thrown || status >= 500
      ? [datadog.count("http.error.count", 1, [...tags, "error_class:server"])]
      : []),
  ];
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
}): DatadogMetric[] {
  const datadog = datadogMetrics();
  return [
    datadog.gauge("catalog.refresh.ok", ok ? 1 : 0),
    datadog.gauge("catalog.refresh.duration_ms", durationMs),
    ...(ok && services !== undefined && offers !== undefined
      ? [
          datadog.gauge("catalog.services", services),
          datadog.gauge("catalog.offers", offers),
          datadog.gauge("catalog.cache_age_seconds", 0),
        ]
      : []),
  ];
}

function statusClass(status: number): string {
  if (status >= 500) return "5xx";
  if (status >= 400) return "4xx";
  if (status >= 300) return "3xx";
  if (status >= 200) return "2xx";
  return "other";
}

function logMetricsError(error: unknown): void {
  console.error(
    JSON.stringify({
      message: "datadog.metrics_failed",
      error: errorMessage(error),
    }),
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
