import { type DatadogMetric, metricName } from "./datadog.js";
import type { WorkerEnv } from "./types.js";

type JsonObject = Record<string, unknown>;

type HealthCheckResult = {
  name: string;
  ok: boolean;
  durationMs: number;
  error?: string;
  metrics?: DatadogMetric[];
};

const REQUEST_TIMEOUT_MS = 10000;
const MAX_CACHE_AGE_SECONDS = 3 * 60 * 60;
const MIN_SERVICE_COUNT = 100;
const MIN_OFFER_COUNT = 1000;

export async function runPublicHealthCheck(
  env: WorkerEnv,
): Promise<DatadogMetric[]> {
  const endpoint = env.PUBLIC_MCP_ENDPOINT || "https://mpp.dev/mcp/services";
  const results = await sequentialChecks([
    () => checkGetCard(endpoint),
    () => checkHead(endpoint),
    () => checkInitialize(endpoint),
    () => checkToolsList(endpoint),
    () => checkCatalogStatus(endpoint),
    () => checkSearchServices(endpoint),
  ]);

  const failures = results.filter((result) => !result.ok);
  const metrics: DatadogMetric[] = [
    {
      metric: metricName("health.ok"),
      type: "gauge",
      value: failures.length === 0 ? 1 : 0,
      tags: ["endpoint:public"],
    },
    {
      metric: metricName("health.failure.count"),
      type: "gauge",
      value: failures.length,
      tags: ["endpoint:public"],
    },
  ];

  for (const result of results) {
    metrics.push(
      {
        metric: metricName("health.check.ok"),
        type: "gauge",
        value: result.ok ? 1 : 0,
        tags: [`check:${result.name}`, "endpoint:public"],
      },
      {
        metric: metricName("health.check.duration_ms"),
        type: "gauge",
        value: result.durationMs,
        tags: [`check:${result.name}`, "endpoint:public"],
      },
      ...(result.metrics ?? []),
    );
  }

  if (failures.length > 0) {
    console.error(
      JSON.stringify({
        message: "mcp.health_failed",
        endpoint,
        failures: failures.map((failure) => ({
          check: failure.name,
          error: failure.error,
        })),
      }),
    );
  }

  return metrics;
}

async function sequentialChecks(
  checks: Array<() => Promise<HealthCheckResult>>,
): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];
  for (const check of checks) {
    results.push(await check());
  }
  return results;
}

async function checkGetCard(endpoint: string): Promise<HealthCheckResult> {
  return measured("get_card", async () => {
    const response = await fetchWithTimeout(endpoint, {
      headers: { accept: "application/json" },
    });
    if (response.status !== 200) {
      throw new Error(`expected 200, received ${response.status}`);
    }

    const body = await response.json();
    const card = object(body);
    const transport = object(card.transport);
    const instructions = stringValue(card.instructions);
    if (stringValue(object(card.serverInfo).name) !== "mpp-services-mcp") {
      throw new Error("server card name mismatch");
    }
    if (stringValue(transport.endpoint) !== endpoint) {
      throw new Error("server card endpoint mismatch");
    }
    if (!instructions.includes("402")) {
      throw new Error("server card is missing payment authority instructions");
    }
  });
}

async function checkHead(endpoint: string): Promise<HealthCheckResult> {
  return measured("head", async () => {
    const response = await fetchWithTimeout(endpoint, { method: "HEAD" });
    if (response.status !== 200) {
      throw new Error(`expected 200, received ${response.status}`);
    }
  });
}

async function checkInitialize(endpoint: string): Promise<HealthCheckResult> {
  return measured("initialize", async () => {
    const result = await rpc(endpoint, "initialize", {});
    if (stringValue(object(result.serverInfo).name) !== "mpp-services-mcp") {
      throw new Error("initialize serverInfo mismatch");
    }
    if (!stringValue(result.instructions).includes("402")) {
      throw new Error("initialize instructions missing 402 authority text");
    }
  });
}

async function checkToolsList(endpoint: string): Promise<HealthCheckResult> {
  return measured("tools_list", async () => {
    const result = await rpc(endpoint, "tools/list", {});
    const tools = arrayValue(result.tools);
    const names = new Set(
      tools
        .map((tool) => object(tool).name)
        .filter((name): name is string => typeof name === "string"),
    );
    for (const required of [
      "list_services",
      "search_services",
      "get_catalog_status",
    ]) {
      if (!names.has(required)) throw new Error(`missing tool ${required}`);
    }
    return [
      {
        metric: metricName("tools.advertised"),
        type: "gauge",
        value: tools.length,
      },
    ];
  });
}

async function checkCatalogStatus(
  endpoint: string,
): Promise<HealthCheckResult> {
  return measured("get_catalog_status", async () => {
    const result = await callTool(endpoint, "get_catalog_status", {});
    const content = object(result.structuredContent);
    const serviceCount = numberValue(content.serviceCount);
    const offerCount = numberValue(content.offerCount);
    const cacheAgeSeconds = numberValue(content.cacheAgeSeconds);
    if (serviceCount < MIN_SERVICE_COUNT) {
      throw new Error(`serviceCount below ${MIN_SERVICE_COUNT}`);
    }
    if (offerCount < MIN_OFFER_COUNT) {
      throw new Error(`offerCount below ${MIN_OFFER_COUNT}`);
    }
    if (cacheAgeSeconds > MAX_CACHE_AGE_SECONDS) {
      throw new Error(`cacheAgeSeconds above ${MAX_CACHE_AGE_SECONDS}`);
    }
    return [
      {
        metric: metricName("catalog.services"),
        type: "gauge",
        value: serviceCount,
      },
      {
        metric: metricName("catalog.offers"),
        type: "gauge",
        value: offerCount,
      },
      {
        metric: metricName("catalog.cache_age_seconds"),
        type: "gauge",
        value: cacheAgeSeconds,
      },
    ];
  });
}

async function checkSearchServices(
  endpoint: string,
): Promise<HealthCheckResult> {
  return measured("search_services", async () => {
    const result = await callTool(endpoint, "search_services", {
      category: "ai",
      limit: 1,
    });
    const content = object(result.structuredContent);
    const total = numberValue(content.total);
    const returned = numberValue(content.returned);
    if (total <= 0) throw new Error("expected at least one ai service");
    if (returned <= 0) throw new Error("expected one returned ai service");
  });
}

async function measured(
  name: string,
  check: () => Promise<DatadogMetric[] | undefined>,
): Promise<HealthCheckResult> {
  const startedAt = Date.now();
  try {
    const metrics = await check();
    return {
      name,
      ok: true,
      durationMs: Date.now() - startedAt,
      ...(metrics ? { metrics } : {}),
    };
  } catch (error) {
    return {
      name,
      ok: false,
      durationMs: Date.now() - startedAt,
      error: errorMessage(error),
    };
  }
}

async function callTool(
  endpoint: string,
  name: string,
  args: JsonObject,
): Promise<JsonObject> {
  const result = await rpc(endpoint, "tools/call", {
    name,
    arguments: args,
  });
  if (result.isError === true) {
    throw new Error(`tool returned isError: ${name}`);
  }
  return result;
}

async function rpc(
  endpoint: string,
  method: string,
  params: JsonObject,
): Promise<JsonObject> {
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (response.status !== 200) {
    throw new Error(`expected 200, received ${response.status}`);
  }

  const body = object(await response.json());
  if (body.error) {
    throw new Error(
      `json-rpc error: ${stringValue(object(body.error).message)}`,
    );
  }
  return object(body.result);
}

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function object(value: unknown): JsonObject {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return {};
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
