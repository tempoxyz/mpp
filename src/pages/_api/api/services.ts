import discovery from "../../../../schemas/discovery.json";
import {
  MPP_PROXY_MANIFEST_URL,
  mergeMppProxyCatalog,
  type ServicesCatalog,
} from "../../../mpp-proxy-catalog";

const CACHE_CONTROL =
  "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

const MANIFEST_CACHE_MS = 5 * 60_000;

let cachedCatalog: { catalog: ServicesCatalog; expiresAt: number } | undefined;

export async function GET(request: Request) {
  const catalog = await liveCatalog();
  const ids = new URL(request.url).searchParams
    .get("ids")
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids?.length) {
    const servicesById = new Map(
      catalog.services.map((service) => [service.id, service]),
    );
    const services = ids.flatMap((id) => {
      const service = servicesById.get(id);
      if (!service) return [];
      return [
        {
          categories: service.categories,
          description: service.description,
          id: service.id,
          name: service.name,
          serviceUrl: service.serviceUrl,
          url: service.url,
        },
      ];
    });

    return Response.json(
      { services },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  }

  return Response.json(catalog, {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}

async function liveCatalog(): Promise<ServicesCatalog> {
  if (cachedCatalog && Date.now() < cachedCatalog.expiresAt) {
    return cachedCatalog.catalog;
  }
  try {
    const response = await fetch(MPP_PROXY_MANIFEST_URL, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`MPP proxy manifest ${response.status}`);
    const catalog = mergeMppProxyCatalog(
      discovery as ServicesCatalog,
      await response.json(),
    );
    cachedCatalog = { catalog, expiresAt: Date.now() + MANIFEST_CACHE_MS };
    return catalog;
  } catch (error) {
    console.warn("Falling back to the checked-in MPP service catalog", error);
    return cachedCatalog?.catalog ?? (discovery as ServicesCatalog);
  }
}
