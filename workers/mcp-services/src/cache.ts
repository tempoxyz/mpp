import type { ServicesResponse } from "./types.js";

const CACHE_KEY = "mpp:services:v1";
const CACHE_MAX_AGE_MS = 60 * 60 * 1000;
const DEFAULT_SERVICES_URL = "https://mpp.dev/api/services";

export type CachedCatalog = ServicesResponse & {
  fetchedAt: string;
  sourceUrl: string;
};

export type CatalogSnapshot = CachedCatalog & {
  cacheStatus: "fresh" | "stale" | "refreshed";
  refreshError?: string;
};

export async function getCatalog(
  env: Env,
  ctx?: ExecutionContext,
): Promise<CatalogSnapshot> {
  const cached = await readCachedCatalog(env);
  if (cached && isFresh(cached)) {
    return { ...cached, cacheStatus: "fresh" };
  }

  if (cached) {
    if (ctx) {
      ctx.waitUntil(
        refreshCatalog(env).catch((error) => {
          log("catalog.background_refresh_failed", {
            error: errorMessage(error),
          });
        }),
      );
    }
    return { ...cached, cacheStatus: "stale" };
  }

  return refreshCatalog(env);
}

export async function refreshCatalog(env: Env): Promise<CatalogSnapshot> {
  const sourceUrl = env.MPP_SERVICES_URL || DEFAULT_SERVICES_URL;
  const catalog = await fetchCatalog(sourceUrl);
  const cached: CachedCatalog = {
    ...catalog,
    sourceUrl,
    fetchedAt: new Date().toISOString(),
  };
  await env.MPP_CATALOG_CACHE.put(CACHE_KEY, JSON.stringify(cached));
  return { ...cached, cacheStatus: "refreshed" };
}

async function readCachedCatalog(env: Env): Promise<CachedCatalog | undefined> {
  const cached = await env.MPP_CATALOG_CACHE.get(CACHE_KEY, "json");
  if (isCachedCatalog(cached)) return cached;
  return undefined;
}

async function fetchCatalog(sourceUrl: string): Promise<ServicesResponse> {
  const response = await fetch(sourceUrl, {
    headers: { accept: "application/json" },
    cf: { cacheTtl: 60 },
  });
  if (!response.ok) {
    throw new Error(`MPP services fetch failed: ${response.status}`);
  }
  const body = await response.json();
  if (!isServicesResponse(body)) {
    throw new Error("MPP services response did not match expected shape");
  }
  return body;
}

function isFresh(cached: CachedCatalog): boolean {
  const fetchedAt = Date.parse(cached.fetchedAt);
  return (
    Number.isFinite(fetchedAt) && Date.now() - fetchedAt < CACHE_MAX_AGE_MS
  );
}

function isCachedCatalog(value: unknown): value is CachedCatalog {
  return (
    isServicesResponse(value) &&
    typeof value === "object" &&
    value !== null &&
    typeof (value as { fetchedAt?: unknown }).fetchedAt === "string" &&
    typeof (value as { sourceUrl?: unknown }).sourceUrl === "string"
  );
}

function isServicesResponse(value: unknown): value is ServicesResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { version?: unknown }).version === "number" &&
    Array.isArray((value as { services?: unknown }).services)
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function log(message: string, fields: Record<string, unknown>): void {
  console.warn(JSON.stringify({ message, ...fields }));
}
