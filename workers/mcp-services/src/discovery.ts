import type {
  Category,
  Endpoint,
  EndpointPayment,
  Integration,
  Service,
  Status,
} from "./types.js";

export type ServiceSummary = {
  id: string;
  name: string;
  url: string;
  categories: Category[];
  integration?: Integration;
  status: Status;
  description?: string;
};

export type SearchServicesArgs = {
  query?: string;
  category?: Category;
  method?: string;
  integration?: Integration;
  status?: Status;
};

export type Offer = {
  method: string;
  path: string;
  description?: string;
  docs?: string;
  payment: EndpointPayment;
};

export function listServiceSummaries(services: Service[]): ServiceSummary[] {
  return services.map((service) => ({
    id: service.id,
    name: service.name,
    url: service.url,
    categories: service.categories ?? [],
    ...(service.integration ? { integration: service.integration } : {}),
    status: service.status ?? "active",
    ...(service.description ? { description: service.description } : {}),
  }));
}

export function searchServices(
  services: Service[],
  filters: SearchServicesArgs,
): ServiceSummary[] {
  return listServiceSummaries(
    services.filter((service) => serviceMatches(service, filters)),
  );
}

export function findService(
  services: Service[],
  idOrName: string,
): Service | undefined {
  const wanted = normalize(idOrName);
  if (!wanted) return undefined;
  return (
    services.find((service) => normalize(service.id) === wanted) ??
    services.find((service) => normalize(service.name) === wanted)
  );
}

export function offersForService(service: Service, route?: string): Offer[] {
  return service.endpoints
    .filter((endpoint): endpoint is Endpoint & { payment: EndpointPayment } =>
      Boolean(endpoint.payment),
    )
    .filter((endpoint) => endpointMatchesRoute(endpoint, route))
    .map((endpoint) => ({
      method: endpoint.method,
      path: endpoint.path,
      ...(endpoint.description ? { description: endpoint.description } : {}),
      ...(endpoint.docs ? { docs: endpoint.docs } : {}),
      payment: endpoint.payment,
    }));
}

export function registryOpenApiView(service: Service) {
  return {
    source: "registry",
    service: {
      id: service.id,
      name: service.name,
      url: service.url,
      ...(service.serviceUrl ? { serviceUrl: service.serviceUrl } : {}),
      ...(service.description ? { description: service.description } : {}),
      ...(service.docs ? { docs: service.docs } : {}),
    },
    endpoints: service.endpoints.map((endpoint) => ({
      method: endpoint.method,
      path: endpoint.path,
      ...(endpoint.description ? { description: endpoint.description } : {}),
      ...(endpoint.payment !== undefined ? { payment: endpoint.payment } : {}),
      ...(endpoint.docs ? { docs: endpoint.docs } : {}),
    })),
  };
}

function serviceMatches(
  service: Service,
  filters: SearchServicesArgs,
): boolean {
  if (filters.query && !queryMatches(service, filters.query)) return false;
  if (
    filters.category &&
    !(service.categories ?? []).includes(filters.category)
  ) {
    return false;
  }
  if (filters.integration && service.integration !== filters.integration) {
    return false;
  }
  if (filters.status && (service.status ?? "active") !== filters.status) {
    return false;
  }
  if (filters.method && !serviceHasMethod(service, filters.method)) {
    return false;
  }
  return true;
}

function queryMatches(service: Service, query: string): boolean {
  const needle = normalize(query);
  if (!needle) return true;
  const haystack = normalize(
    [service.name, service.description, ...(service.tags ?? [])]
      .filter(Boolean)
      .join(" "),
  );
  return haystack.includes(needle);
}

function serviceHasMethod(service: Service, method: string): boolean {
  const wanted = normalize(method);
  if (!wanted) return true;
  if (
    Object.keys(service.methods ?? {}).some((key) => normalize(key) === wanted)
  ) {
    return true;
  }
  return service.endpoints.some(
    (endpoint) => normalize(endpoint.payment?.method ?? "") === wanted,
  );
}

function endpointMatchesRoute(endpoint: Endpoint, route?: string): boolean {
  const wanted = normalize(route ?? "");
  if (!wanted) return true;
  const fullRoute = normalize(`${endpoint.method} ${endpoint.path}`);
  return (
    fullRoute.includes(wanted) || normalize(endpoint.path).includes(wanted)
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
