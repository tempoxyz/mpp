import type { Category, Endpoint, Service } from "./data/registry";

export const MPP_PROXY_MANIFEST_URL = "https://mpp.tempo.xyz/.well-known/mpp";

type CatalogService = Service & Record<string, unknown>;

export type ServicesCatalog = {
  version: number;
  services: CatalogService[];
};

type ProxyManifest = {
  services: Array<{
    domain: string;
    id: string;
    manifest: {
      categories: string[];
      description: string;
      docs?: Service["docs"];
      endpoints: Endpoint[];
      methods: Service["methods"];
      name: string;
    };
  }>;
};

const CATEGORIES = new Set<Category>([
  "ai",
  "blockchain",
  "compute",
  "data",
  "media",
  "search",
  "social",
  "storage",
  "web",
]);
const SERVICE_ID = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** Replaces manually copied proxy entries with the proxy's canonical discovery manifest. */
export function mergeMppProxyCatalog(
  catalog: ServicesCatalog,
  value: unknown,
): ServicesCatalog {
  const manifest = parseProxyManifest(value);
  const metadata = new Map(
    catalog.services.map((service) => [service.id, service]),
  );
  const nonProxyServices = catalog.services.filter(
    (service) => !isTempoProxyService(service),
  );
  const proxyServices = manifest.services.map((entry) => {
    const existing = metadata.get(entry.id);
    const serviceUrl = `https://${entry.domain}`;
    const docs = entry.manifest.docs ?? existing?.docs;
    const endpoints = entry.manifest.endpoints.map((endpoint) => ({
      ...endpoint,
      payment: endpoint.payment
        ? {
            ...endpoint.payment,
            ...(endpoint.payment.method === "tempo" &&
            endpoint.payment.decimals === undefined
              ? { decimals: 6 }
              : {}),
          }
        : null,
    }));

    return {
      ...existing,
      id: entry.id,
      name: entry.manifest.name,
      url: existing?.url ?? docs?.homepage ?? serviceUrl,
      serviceUrl,
      description: entry.manifest.description,
      categories: entry.manifest.categories as Category[],
      integration: existing?.integration ?? "third-party",
      tags: existing?.tags ?? entry.manifest.categories,
      status: existing?.status ?? "active",
      docs,
      methods: entry.manifest.methods,
      realm: "mpp.tempo.xyz",
      endpoints,
      provider:
        existing?.provider ??
        ({
          name: entry.manifest.name,
          url: docs?.homepage ?? serviceUrl,
        } as const),
      supportsCredits: true,
    } satisfies CatalogService;
  });

  return { ...catalog, services: [...nonProxyServices, ...proxyServices] };
}

function isTempoProxyService(service: Service): boolean {
  if (!service.serviceUrl) return false;
  try {
    const hostname = new URL(service.serviceUrl).hostname;
    return hostname === "mpp.tempo.xyz" || hostname.endsWith(".mpp.tempo.xyz");
  } catch {
    return false;
  }
}

function parseProxyManifest(value: unknown): ProxyManifest {
  if (!value || typeof value !== "object") {
    throw new Error("MPP proxy manifest must be an object");
  }
  const services = (value as { services?: unknown }).services;
  if (!Array.isArray(services) || services.length === 0) {
    throw new Error("MPP proxy manifest must contain services");
  }
  const ids = new Set<string>();
  for (const entry of services) {
    if (!entry || typeof entry !== "object")
      throw new Error("Invalid MPP proxy service");
    const candidate = entry as Record<string, unknown>;
    const manifest = candidate.manifest as Record<string, unknown> | undefined;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.domain !== "string" ||
      !manifest ||
      typeof manifest.name !== "string" ||
      typeof manifest.description !== "string" ||
      !Array.isArray(manifest.categories) ||
      !Array.isArray(manifest.endpoints) ||
      !manifest.methods ||
      typeof manifest.methods !== "object"
    ) {
      throw new Error("Invalid MPP proxy service");
    }
    if (
      !SERVICE_ID.test(candidate.id) ||
      candidate.domain !== `${candidate.id}.mpp.tempo.xyz` ||
      ids.has(candidate.id) ||
      !manifest.categories.every(
        (category) =>
          typeof category === "string" && CATEGORIES.has(category as Category),
      ) ||
      !manifest.endpoints.every(
        (endpoint) =>
          endpoint !== null &&
          typeof endpoint === "object" &&
          typeof (endpoint as { method?: unknown }).method === "string" &&
          typeof (endpoint as { path?: unknown }).path === "string",
      )
    ) {
      throw new Error("Invalid MPP proxy service");
    }
    ids.add(candidate.id);
  }
  return value as ProxyManifest;
}
