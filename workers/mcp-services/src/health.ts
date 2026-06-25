import type {
  DatadogMetric,
  DatadogMetricsClient,
} from "../../../src/lib/datadog.js";
import type { WorkerEnv } from "./types.js";

type JsonObject = Record<string, unknown>;
type HealthResult = {
  name: string;
  ok: boolean;
  durationMs: number;
  error?: string;
  metrics?: DatadogMetric[];
};
type CheckFn = () => Promise<DatadogMetric[] | undefined>;

const DEFAULT_ENDPOINT = "https://mpp.dev/mcp/services";
const MAX_CACHE_AGE_SECONDS = 3 * 60 * 60;
const MIN_SERVICE_COUNT = 100;
const MIN_OFFER_COUNT = 1000;
const REQUIRED_TOOLS = [
  "list_services",
  "search_services",
  "get_catalog_status",
];

export async function healthMetrics(
  env: WorkerEnv,
  datadog: DatadogMetricsClient,
): Promise<DatadogMetric[]> {
  const endpoint = env.PUBLIC_MCP_ENDPOINT || DEFAULT_ENDPOINT;
  const checks = await runChecks(endpoint, datadog);
  const failures = checks.filter((check) => !check.ok);
  const metrics = [
    datadog.gauge("health.ok", failures.length === 0 ? 1 : 0, [
      "endpoint:public",
    ]),
    datadog.gauge("health.failure.count", failures.length, ["endpoint:public"]),
  ];

  for (const check of checks) {
    const tags = [`check:${check.name}`, "endpoint:public"];
    metrics.push(
      datadog.gauge("health.check.ok", check.ok ? 1 : 0, tags),
      datadog.gauge("health.check.duration_ms", check.durationMs, tags),
      ...(check.metrics ?? []),
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

async function runChecks(
  endpoint: string,
  datadog: DatadogMetricsClient,
): Promise<HealthResult[]> {
  const checks: Array<[string, CheckFn]> = [
    ["get_card", () => assertServerCard(endpoint)],
    ["head", () => assertHead(endpoint)],
    ["initialize", () => assertInitialize(endpoint)],
    ["tools_list", () => checkTools(endpoint, datadog)],
    ["get_catalog_status", () => checkCatalog(endpoint, datadog)],
    ["search_services", () => assertSearch(endpoint)],
  ];
  const results: HealthResult[] = [];
  for (const [name, fn] of checks) results.push(await measure(name, fn));
  return results;
}

async function measure(name: string, fn: CheckFn): Promise<HealthResult> {
  const startedAt = Date.now();
  try {
    const metrics = await fn();
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

async function assertServerCard(endpoint: string): Promise<undefined> {
  const card = await fetchJson(endpoint, {
    headers: { accept: "application/json" },
  });
  if (stringValue(object(card.serverInfo).name) !== "mpp-services-mcp") {
    throw new Error("server card name mismatch");
  }
  if (stringValue(object(card.transport).endpoint) !== endpoint) {
    throw new Error("server card endpoint mismatch");
  }
  if (!stringValue(card.instructions).includes("402")) {
    throw new Error("server card missing 402 instructions");
  }
  return undefined;
}

async function assertHead(endpoint: string): Promise<undefined> {
  const response = await fetch(endpoint, { method: "HEAD" });
  if (response.status !== 200) {
    throw new Error(`HEAD expected 200, received ${response.status}`);
  }
  return undefined;
}

async function assertInitialize(endpoint: string): Promise<undefined> {
  const result = await rpc(endpoint, "initialize");
  if (stringValue(object(result.serverInfo).name) !== "mpp-services-mcp") {
    throw new Error("initialize serverInfo mismatch");
  }
  if (!stringValue(result.instructions).includes("402")) {
    throw new Error("initialize missing 402 instructions");
  }
  return undefined;
}

async function checkTools(
  endpoint: string,
  datadog: DatadogMetricsClient,
): Promise<DatadogMetric[]> {
  const result = await rpc(endpoint, "tools/list");
  const tools = arrayValue(result.tools);
  const names = new Set(
    tools
      .map((tool) => object(tool).name)
      .filter((name): name is string => typeof name === "string"),
  );
  for (const tool of REQUIRED_TOOLS) {
    if (!names.has(tool)) throw new Error(`missing tool ${tool}`);
  }
  return [datadog.gauge("tools.advertised", tools.length)];
}

async function checkCatalog(
  endpoint: string,
  datadog: DatadogMetricsClient,
): Promise<DatadogMetric[]> {
  const content = object(
    (await callTool(endpoint, "get_catalog_status", {})).structuredContent,
  );
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
    datadog.gauge("catalog.services", serviceCount),
    datadog.gauge("catalog.offers", offerCount),
    datadog.gauge("catalog.cache_age_seconds", cacheAgeSeconds),
  ];
}

async function assertSearch(endpoint: string): Promise<undefined> {
  const content = object(
    (await callTool(endpoint, "search_services", { category: "ai", limit: 1 }))
      .structuredContent,
  );
  if (numberValue(content.total) <= 0 || numberValue(content.returned) <= 0) {
    throw new Error("expected at least one returned ai service");
  }
  return undefined;
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
  if (result.isError === true)
    throw new Error(`tool returned isError: ${name}`);
  return result;
}

async function rpc(
  endpoint: string,
  method: string,
  params: JsonObject = {},
): Promise<JsonObject> {
  const body = await fetchJson(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (body.error) {
    throw new Error(
      `json-rpc error: ${stringValue(object(body.error).message)}`,
    );
  }
  return object(body.result);
}

async function fetchJson(
  endpoint: string,
  init?: RequestInit,
): Promise<JsonObject> {
  const response = await fetch(endpoint, init);
  if (response.status !== 200) {
    throw new Error(`expected 200, received ${response.status}`);
  }
  return object(await response.json());
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
