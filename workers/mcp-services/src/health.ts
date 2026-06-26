import { workerMetrics } from "../../../src/lib/worker-metrics.js";
import type { WorkerEnv } from "./types.js";

type JsonObject = Record<string, unknown>;
type HealthResult = {
  name: string;
  ok: boolean;
  durationMs: number;
  error?: string;
};
type CheckFn = () => Promise<void>;

const DEFAULT_ENDPOINT = "https://mpp.dev/mcp/services";
const HEALTH_FETCH_TIMEOUT_MS = 5000;
const MAX_CACHE_AGE_SECONDS = 3 * 60 * 60;
const MIN_SERVICE_COUNT = 100;
const MIN_OFFER_COUNT = 1000;
const REQUIRED_TOOLS = [
  "list_services",
  "search_services",
  "get_catalog_status",
];

export async function healthMetrics(env: WorkerEnv): Promise<void> {
  const startedAt = Date.now();
  const endpoint = env.PUBLIC_MCP_ENDPOINT || DEFAULT_ENDPOINT;
  const checks = await runChecks(endpoint);
  const failures = checks.filter((check) => !check.ok);
  workerMetrics.gauge(
    "mpp_discovery_mcp_health_ok",
    failures.length === 0 ? 1 : 0,
    { endpoint: "public" },
  );
  workerMetrics.histogram(
    "mpp_discovery_mcp_health_duration_ms",
    Date.now() - startedAt,
    { endpoint: "public" },
  );

  for (const check of checks) {
    const tags = { check: check.name, endpoint: "public" };
    workerMetrics.gauge(
      "mpp_discovery_mcp_health_check_ok",
      check.ok ? 1 : 0,
      tags,
    );
    workerMetrics.histogram(
      "mpp_discovery_mcp_health_check_duration_ms",
      check.durationMs,
      tags,
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
}

async function runChecks(endpoint: string): Promise<HealthResult[]> {
  const checks: Array<[string, CheckFn]> = [
    ["get_card", () => assertServerCard(endpoint)],
    ["head", () => assertHead(endpoint)],
    ["initialize", () => assertInitialize(endpoint)],
    ["tools_list", () => checkTools(endpoint)],
    ["get_catalog_status", () => checkCatalog(endpoint)],
    ["search_services", () => assertSearch(endpoint)],
  ];
  const results: HealthResult[] = [];
  for (const [name, fn] of checks) results.push(await measure(name, fn));
  return results;
}

async function measure(name: string, fn: CheckFn): Promise<HealthResult> {
  const startedAt = Date.now();
  try {
    await fn();
    return {
      name,
      ok: true,
      durationMs: Date.now() - startedAt,
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

async function assertServerCard(endpoint: string): Promise<void> {
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
}

async function assertHead(endpoint: string): Promise<void> {
  const response = await fetchWithTimeout(endpoint, { method: "HEAD" });
  if (response.status !== 200) {
    throw new Error(`HEAD expected 200, received ${response.status}`);
  }
}

async function assertInitialize(endpoint: string): Promise<void> {
  const result = await rpc(endpoint, "initialize");
  if (stringValue(object(result.serverInfo).name) !== "mpp-services-mcp") {
    throw new Error("initialize serverInfo mismatch");
  }
  if (!stringValue(result.instructions).includes("402")) {
    throw new Error("initialize missing 402 instructions");
  }
}

async function checkTools(endpoint: string): Promise<void> {
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
}

async function checkCatalog(endpoint: string): Promise<void> {
  const content = object(
    (await callTool(endpoint, "get_catalog_status", {})).structuredContent,
  );
  const serviceCount = numberValue(content.serviceCount);
  const offerCount = numberValue(content.offerCount);
  const cacheAgeSeconds = numberValue(content.cacheAgeSeconds);
  workerMetrics.gauge("mpp_discovery_mcp_catalog_services", serviceCount, {
    endpoint: "public",
  });
  workerMetrics.gauge("mpp_discovery_mcp_catalog_offers", offerCount, {
    endpoint: "public",
  });
  workerMetrics.gauge(
    "mpp_discovery_mcp_catalog_cache_age_seconds",
    cacheAgeSeconds,
    { endpoint: "public" },
  );

  if (serviceCount < MIN_SERVICE_COUNT) {
    throw new Error(`serviceCount below ${MIN_SERVICE_COUNT}`);
  }
  if (offerCount < MIN_OFFER_COUNT) {
    throw new Error(`offerCount below ${MIN_OFFER_COUNT}`);
  }
  if (cacheAgeSeconds > MAX_CACHE_AGE_SECONDS) {
    throw new Error(`cacheAgeSeconds above ${MAX_CACHE_AGE_SECONDS}`);
  }
}

async function assertSearch(endpoint: string): Promise<void> {
  const content = object(
    (await callTool(endpoint, "search_services", { category: "ai", limit: 1 }))
      .structuredContent,
  );
  if (numberValue(content.total) <= 0 || numberValue(content.returned) <= 0) {
    throw new Error("expected at least one returned ai service");
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
  const response = await fetchWithTimeout(endpoint, init);
  if (response.status !== 200) {
    throw new Error(`expected 200, received ${response.status}`);
  }
  return object(await response.json());
}

async function fetchWithTimeout(
  endpoint: string,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_FETCH_TIMEOUT_MS);
  try {
    return await fetch(endpoint, { ...init, signal: controller.signal });
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
