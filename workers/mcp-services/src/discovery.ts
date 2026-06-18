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

export type SearchOffersArgs = SearchServicesArgs & {
  currency?: string;
  maxAmount?: string;
  unitType?: string;
  dynamic?: boolean;
  recipient?: string;
};

export type Offer = {
  method: string;
  path: string;
  description?: string;
  docs?: string;
  payment: EndpointPayment;
};

export type OfferSearchResult = Offer & {
  service: ServiceSummary;
  price?: {
    amount?: string;
    currency?: string;
    decimals?: number;
    display?: string;
    unitType?: string;
    dynamic: boolean;
    amountHint?: string;
  };
  matchedOn: string[];
  rankingSignals: string[];
};

export type FacetValue = {
  value: string | boolean;
  count: number;
};

export type CatalogFacets = {
  categories: FacetValue[];
  integrations: FacetValue[];
  statuses: FacetValue[];
  paymentMethods: FacetValue[];
  currencies: FacetValue[];
  unitTypes: FacetValue[];
  intents: FacetValue[];
  recipients: FacetValue[];
  dynamic: FacetValue[];
};

export type RecipientServiceMatch = {
  service: ServiceSummary;
  count: number;
  offers: Offer[];
};

export function listServiceSummaries(services: Service[]): ServiceSummary[] {
  return services.map(serviceSummary);
}

export function searchServices(
  services: Service[],
  filters: SearchServicesArgs,
): ServiceSummary[] {
  return listServiceSummaries(
    services.filter((service) => serviceMatches(service, filters)),
  );
}

export function searchOffers(
  services: Service[],
  filters: SearchOffersArgs,
): OfferSearchResult[] {
  const maxAmount = parseIntegerAmount(filters.maxAmount);

  return services
    .flatMap((service) =>
      offersForService(service).map((offer) =>
        offerSearchResult(service, offer, filters),
      ),
    )
    .filter((offer) => offerMatches(offer, filters, maxAmount))
    .sort((a, b) => offerScore(b, filters) - offerScore(a, filters));
}

export function servicesByRecipient(
  services: Service[],
  recipient: string,
): RecipientServiceMatch[] {
  const offers = searchOffers(services, { recipient });
  const grouped = new Map<string, RecipientServiceMatch>();

  for (const offer of offers) {
    const paymentOffer = {
      method: offer.method,
      path: offer.path,
      ...(offer.description ? { description: offer.description } : {}),
      ...(offer.docs ? { docs: offer.docs } : {}),
      payment: offer.payment,
    };
    const existing = grouped.get(offer.service.id);
    if (existing) {
      existing.count += 1;
      existing.offers.push(paymentOffer);
    } else {
      grouped.set(offer.service.id, {
        service: offer.service,
        count: 1,
        offers: [paymentOffer],
      });
    }
  }

  return [...grouped.values()];
}

export function getFacets(services: Service[]): CatalogFacets {
  const categories = new Map<string, number>();
  const integrations = new Map<string, number>();
  const statuses = new Map<string, number>();
  const paymentMethods = new Map<string, number>();
  const currencies = new Map<string, number>();
  const unitTypes = new Map<string, number>();
  const intents = new Map<string, number>();
  const recipients = new Map<string, number>();
  const dynamic = new Map<string, number>();

  for (const service of services) {
    for (const category of service.categories ?? []) {
      increment(categories, category);
    }
    if (service.integration) increment(integrations, service.integration);
    increment(statuses, service.status ?? "active");

    for (const offer of offersForService(service)) {
      increment(paymentMethods, offer.payment.method);
      increment(intents, offer.payment.intent);
      increment(dynamic, String(Boolean(offer.payment.dynamic)));
      if (offer.payment.currency) increment(currencies, offer.payment.currency);
      if (offer.payment.unitType) increment(unitTypes, offer.payment.unitType);
      if (offer.payment.recipient)
        increment(recipients, offer.payment.recipient);
    }
  }

  return {
    categories: sortedFacetValues(categories),
    integrations: sortedFacetValues(integrations),
    statuses: sortedFacetValues(statuses),
    paymentMethods: sortedFacetValues(paymentMethods),
    currencies: sortedFacetValues(currencies),
    unitTypes: sortedFacetValues(unitTypes),
    intents: sortedFacetValues(intents),
    recipients: sortedFacetValues(recipients),
    dynamic: sortedFacetValues(dynamic).map((facet) => ({
      value: facet.value === "true",
      count: facet.count,
    })),
  };
}

export function countPaymentOffers(services: Service[]): number {
  return services.reduce(
    (count, service) => count + offersForService(service).length,
    0,
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

function offerSearchResult(
  service: Service,
  offer: Offer,
  filters: SearchOffersArgs,
): OfferSearchResult {
  return {
    ...offer,
    service: serviceSummary(service),
    price: priceSummary(offer.payment),
    matchedOn: offerMatchedOn(service, offer, filters),
    rankingSignals: rankingSignals(service, offer.payment),
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

function offerMatches(
  offer: OfferSearchResult,
  filters: SearchOffersArgs,
  maxAmount?: bigint,
): boolean {
  if (
    filters.query &&
    !offerMatchedOnFields(offer.service, offer, filters.query).length
  ) {
    return false;
  }
  if (
    filters.category &&
    !offer.service.categories.includes(filters.category)
  ) {
    return false;
  }
  if (
    filters.integration &&
    offer.service.integration !== filters.integration
  ) {
    return false;
  }
  if (filters.status && offer.service.status !== filters.status) return false;
  if (
    filters.method &&
    !equalsNormalized(offer.payment.method, filters.method)
  ) {
    return false;
  }
  if (
    filters.currency &&
    !equalsNormalized(offer.payment.currency ?? "", filters.currency)
  ) {
    return false;
  }
  if (
    filters.unitType &&
    !equalsNormalized(offer.payment.unitType ?? "", filters.unitType)
  ) {
    return false;
  }
  if (
    filters.recipient &&
    !equalsNormalized(offer.payment.recipient ?? "", filters.recipient)
  ) {
    return false;
  }
  if (
    filters.dynamic !== undefined &&
    Boolean(offer.payment.dynamic) !== filters.dynamic
  ) {
    return false;
  }
  if (maxAmount !== undefined) {
    const offerAmount = parseIntegerAmount(offer.payment.amount);
    if (offerAmount === undefined || offerAmount > maxAmount) return false;
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

function offerMatchedOn(
  service: Service,
  offer: Offer,
  filters: SearchOffersArgs,
): string[] {
  const matched = new Set<string>();
  if (filters.query) {
    for (const field of offerMatchedOnFields(
      serviceSummary(service),
      offer,
      filters.query,
    )) {
      matched.add(field);
    }
  }
  if (
    filters.category &&
    (service.categories ?? []).includes(filters.category)
  ) {
    matched.add("service.categories");
  }
  if (filters.integration && service.integration === filters.integration) {
    matched.add("service.integration");
  }
  if (filters.status && (service.status ?? "active") === filters.status) {
    matched.add("service.status");
  }
  if (
    filters.method &&
    equalsNormalized(offer.payment.method, filters.method)
  ) {
    matched.add("payment.method");
  }
  if (
    filters.currency &&
    equalsNormalized(offer.payment.currency ?? "", filters.currency)
  ) {
    matched.add("payment.currency");
  }
  if (
    filters.unitType &&
    equalsNormalized(offer.payment.unitType ?? "", filters.unitType)
  ) {
    matched.add("payment.unitType");
  }
  if (
    filters.recipient &&
    equalsNormalized(offer.payment.recipient ?? "", filters.recipient)
  ) {
    matched.add("payment.recipient");
  }
  if (
    filters.dynamic !== undefined &&
    Boolean(offer.payment.dynamic) === filters.dynamic
  ) {
    matched.add("payment.dynamic");
  }
  if (filters.maxAmount && parseIntegerAmount(offer.payment.amount)) {
    matched.add("payment.amount");
  }
  return [...matched];
}

function offerMatchedOnFields(
  service: ServiceSummary,
  offer: Offer,
  query: string,
): string[] {
  const needle = normalize(query);
  if (!needle) return [];

  const fields: Array<[string, unknown]> = [
    ["service.id", service.id],
    ["service.name", service.name],
    ["service.description", service.description],
    ["endpoint.method", offer.method],
    ["endpoint.path", offer.path],
    ["endpoint.description", offer.description],
    ["endpoint.docs", offer.docs],
    ["payment.intent", offer.payment.intent],
    ["payment.method", offer.payment.method],
    ["payment.currency", offer.payment.currency],
    ["payment.recipient", offer.payment.recipient],
    ["payment.unitType", offer.payment.unitType],
    ["payment.description", offer.payment.description],
    ["payment.amountHint", offer.payment.amountHint],
  ];

  return fields
    .filter(([, value]) => typeof value === "string")
    .filter(([, value]) => normalize(value as string).includes(needle))
    .map(([field]) => field);
}

function priceSummary(payment: EndpointPayment): OfferSearchResult["price"] {
  return {
    ...(payment.amount ? { amount: payment.amount } : {}),
    ...(payment.currency ? { currency: payment.currency } : {}),
    ...(payment.decimals !== undefined ? { decimals: payment.decimals } : {}),
    ...(payment.amount && payment.currency
      ? {
          display: displayAmount(
            payment.amount,
            payment.decimals,
            payment.currency,
          ),
        }
      : {}),
    ...(payment.unitType ? { unitType: payment.unitType } : {}),
    dynamic: Boolean(payment.dynamic),
    ...(payment.amountHint ? { amountHint: payment.amountHint } : {}),
  };
}

function displayAmount(
  amount: string,
  decimals: number | undefined,
  currency: string,
): string | undefined {
  const parsed = parseIntegerAmount(amount);
  if (parsed === undefined) return undefined;
  const places = decimals ?? 0;
  if (places <= 0) return `${parsed.toString()} ${currency}`;

  const divisor = 10n ** BigInt(places);
  const whole = parsed / divisor;
  const fraction = (parsed % divisor).toString().padStart(places, "0");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return `${whole.toString()}${trimmedFraction ? `.${trimmedFraction}` : ""} ${currency}`;
}

function rankingSignals(service: Service, payment: EndpointPayment): string[] {
  return [
    (service.status ?? "active") === "active" ? "active" : undefined,
    service.integration === "first-party" ? "first_party" : undefined,
    service.docs?.openapi || service.docs?.apiReference
      ? "has_openapi"
      : undefined,
    payment.amount && !payment.dynamic ? "fixed_price" : undefined,
    payment.dynamic ? "dynamic_price" : undefined,
    "has_payment_offer",
  ].filter((signal): signal is string => Boolean(signal));
}

function offerScore(
  offer: OfferSearchResult,
  filters: SearchOffersArgs,
): number {
  let score = 0;
  if (offer.service.status === "active") score += 30;
  if (offer.service.integration === "first-party") score += 10;
  if (offer.rankingSignals.includes("has_openapi")) score += 5;
  if (offer.rankingSignals.includes("fixed_price")) score += 5;
  if (filters.query && offer.matchedOn.includes("service.name")) score += 40;
  if (filters.query && offer.matchedOn.includes("service.id")) score += 30;
  if (filters.query && offer.matchedOn.includes("endpoint.path")) score += 20;
  if (filters.query && offer.matchedOn.includes("payment.description")) {
    score += 10;
  }
  return score;
}

function serviceSummary(service: Service): ServiceSummary {
  return {
    id: service.id,
    name: service.name,
    url: service.url,
    categories: service.categories ?? [],
    ...(service.integration ? { integration: service.integration } : {}),
    status: service.status ?? "active",
    ...(service.description ? { description: service.description } : {}),
  };
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

function parseIntegerAmount(value: string | undefined): bigint | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

function equalsNormalized(left: string, right: string): boolean {
  return normalize(left) === normalize(right);
}

function increment(map: Map<string, number>, value: string): void {
  map.set(value, (map.get(value) ?? 0) + 1);
}

function sortedFacetValues(map: Map<string, number>): FacetValue[] {
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort(
      (a, b) =>
        b.count - a.count || String(a.value).localeCompare(String(b.value)),
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
