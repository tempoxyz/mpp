import {
  flushWorkerMetrics,
  workerMetrics,
} from "../../../src/lib/worker-metrics.js";
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

    return trackRequest(
      request,
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
      ctx.waitUntil(runScheduledHealthCheck(event, env));
      return;
    }

    ctx.waitUntil(runCatalogRefresh(event, env));
  },
} satisfies ExportedHandler<Env>;

async function trackRequest(
  request: Request,
  route: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  const startedAt = Date.now();
  try {
    const response = await handler();
    recordRequestMetrics(
      request,
      route,
      response.status,
      Date.now() - startedAt,
    );
    return response;
  } catch (error) {
    recordRequestMetrics(request, route, 500, Date.now() - startedAt, true);
    throw error;
  } finally {
    flushWorkerMetrics();
  }
}

function publicMcpEndpoint(url: URL, env: WorkerEnv): string {
  return env.PUBLIC_MCP_ENDPOINT || `${url.origin}/mcp/services`;
}

async function runScheduledHealthCheck(
  event: ScheduledController,
  env: WorkerEnv,
): Promise<void> {
  const startedAt = Date.now();
  await healthMetrics(env);
  flushWorkerMetrics();
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
    recordCatalogRefreshMetrics({
      ok: true,
      durationMs: Date.now() - startedAt,
      services: catalog.services.length,
      offers: countPaymentOffers(catalog.services),
    });
    flushWorkerMetrics();
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
    recordCatalogRefreshMetrics({
      ok: false,
      durationMs: Date.now() - startedAt,
    });
    flushWorkerMetrics();
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

function recordRequestMetrics(
  request: Request,
  route: string,
  status: number,
  durationMs: number,
  thrown = false,
): void {
  const tags = {
    method: request.method,
    route,
    status_class: statusClass(status),
  };
  workerMetrics.count("mpp_discovery_mcp_http_request_count", 1, tags);
  workerMetrics.histogram(
    "mpp_discovery_mcp_http_response_duration_ms",
    durationMs,
    tags,
  );
  if (thrown || status >= 500) {
    workerMetrics.count("mpp_discovery_mcp_http_error_count", 1, {
      ...tags,
      error_class: "server",
    });
  }
}

function recordCatalogRefreshMetrics({
  ok,
  durationMs,
  services,
  offers,
}: {
  ok: boolean;
  durationMs: number;
  services?: number;
  offers?: number;
}): void {
  workerMetrics.gauge("mpp_discovery_mcp_catalog_refresh_ok", ok ? 1 : 0, {});
  workerMetrics.histogram(
    "mpp_discovery_mcp_catalog_refresh_duration_ms",
    durationMs,
    {},
  );
  if (ok && services !== undefined && offers !== undefined) {
    workerMetrics.gauge("mpp_discovery_mcp_catalog_services", services, {
      endpoint: "source",
    });
    workerMetrics.gauge("mpp_discovery_mcp_catalog_offers", offers, {
      endpoint: "source",
    });
    workerMetrics.gauge("mpp_discovery_mcp_catalog_cache_age_seconds", 0, {
      endpoint: "source",
    });
  }
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
