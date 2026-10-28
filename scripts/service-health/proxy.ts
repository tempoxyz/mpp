import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  type EndpointDef,
  type Intent,
  MPP_REALM,
  type MppProxyServiceDef,
  mppProxyServices,
  type ServiceDef,
  TEMPO_PAYMENT,
} from "../../schemas/services.ts";
import { buildCatalog } from "../generate-discovery.ts";

type CatalogEndpoint = {
  method: string;
  path: string;
  description: string;
  payment: { intent?: string; amount?: string } | null;
};

/**
 * Health-check entries for the MPP proxy services, built from the same merged catalog the site
 * publishes (schemas/mpp-proxy.json plus mppProxyServices), so every proxy route is probed with
 * the price and intent the proxy advertises.
 */
export function mppProxyHealthServices(
  metadata: MppProxyServiceDef[] = mppProxyServices,
  manifest: unknown = JSON.parse(
    readFileSync(
      resolve(import.meta.dirname, "../../schemas/mpp-proxy.json"),
      "utf8",
    ),
  ),
): ServiceDef[] {
  const fixtures = new Map(
    metadata.map((meta) => [meta.id, meta.healthChecks ?? {}]),
  );
  return buildCatalog([], metadata, manifest).map((entry) => {
    const service = entry as Record<string, unknown> & {
      endpoints: CatalogEndpoint[];
    };
    const id = String(service.id);
    const endpoints: EndpointDef[] = service.endpoints.map((endpoint) => {
      const route = `${endpoint.method} ${endpoint.path}`;
      const fixture = fixtures.get(id)?.[route];
      const amount = endpoint.payment?.amount;
      return {
        route,
        desc: endpoint.description,
        ...(endpoint.payment
          ? amount
            ? { amount }
            : { dynamic: true as const }
          : {}),
        ...(endpoint.payment?.intent
          ? { intent: endpoint.payment.intent as Intent }
          : {}),
        ...(fixture === undefined ? {} : { healthCheck: fixture }),
      };
    });
    return {
      id,
      name: String(service.name),
      url: String(service.url),
      serviceUrl: String(service.serviceUrl),
      description: String(service.description),
      categories: service.categories as ServiceDef["categories"],
      integration: service.integration as ServiceDef["integration"],
      tags: service.tags as string[],
      status: service.status as ServiceDef["status"],
      docs: service.docs as ServiceDef["docs"],
      provider: service.provider as ServiceDef["provider"],
      realm: MPP_REALM,
      intent: "charge",
      payments: [TEMPO_PAYMENT],
      endpoints,
    };
  });
}
