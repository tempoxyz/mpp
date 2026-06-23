import { getCatalog } from "./cache.js";
import {
  countPaymentOffers,
  findService,
  getFacets,
  listServiceSummaries,
  type OfferSearchResult,
  offersForService,
  registryOpenApiView,
  type SearchOffersArgs,
  type SearchServicesArgs,
  searchOffers,
  searchServices,
  servicesByRecipient,
} from "./discovery.js";
import {
  CATEGORIES,
  INTEGRATIONS,
  type Service,
  STATUSES,
  type WorkerEnv,
} from "./types.js";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_VERSION = "1.0.0";
const ADVISORY =
  "Discovery is advisory; the runtime 402 Challenge is authoritative.";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const DEFAULT_RECOMMENDATION_LIMIT = 5;
const MAX_RECOMMENDATION_LIMIT = 20;
const OPENAPI_FETCH_TIMEOUT_MS = 3000;
const MAX_OPENAPI_RAW_BYTES = 256 * 1024;
const MAX_OPENAPI_FETCH_BYTES = 1024 * 1024;
const MAX_OPENAPI_REDIRECTS = 3;
const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "patch",
  "head",
  "options",
  "trace",
] as const;
const TASK_STOP_WORDS = new Set([
  "about",
  "agent",
  "agents",
  "and",
  "api",
  "apis",
  "can",
  "find",
  "for",
  "from",
  "get",
  "need",
  "paid",
  "service",
  "services",
  "that",
  "the",
  "tool",
  "tools",
  "use",
  "using",
  "want",
  "with",
]);

const INITIALIZE_INSTRUCTIONS = [
  "Use this read-only MCP server to discover MPP paid API services and payment terms from https://mpp.dev/api/services.",
  "Call list_services for a catalog overview, search_services to filter providers, search_offers to find payable endpoints, recommend_services to rank services for an agent task, get_usage_recipe to turn a chosen service into next MCP and HTTP steps, get_facets to inspect valid filters, get_services_by_recipient to map a payment recipient to services, get_catalog_status to inspect freshness, get_service for a full service record, get_offers for endpoint payment offers, and get_openapi for a service OpenAPI document or registry-derived endpoint view.",
  ADVISORY,
  "This server does not register services, execute payments, authorize requests, or replace runtime 402 Challenge validation.",
].join(" ");

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
};

type ToolCallParams = {
  name?: unknown;
  arguments?: unknown;
};

type JsonRpcResponsePayload =
  | { jsonrpc: "2.0"; id: JsonRpcId; result: unknown }
  | { jsonrpc: "2.0"; id: JsonRpcId; error: { code: number; message: string } };

type Pagination = {
  limit: number;
  offset: number;
};

type OpenApiSource =
  | "docs.openapi"
  | "well-known"
  | "apiReference"
  | "registry";

type OpenApiCandidate = {
  source: Exclude<OpenApiSource, "registry">;
  url: string;
};

type OpenApiRequestOptions = {
  raw: boolean;
};

type JsonObject = Record<string, unknown>;

type OpenApiDocument = JsonObject & {
  openapi?: unknown;
  info?: unknown;
  paths?: unknown;
};

type FetchedOpenApi = {
  source: Exclude<OpenApiSource, "registry">;
  url: string;
  contentType: string;
  bytes: number;
  document: OpenApiDocument;
};

export async function handleMcp(
  request: Request,
  env: WorkerEnv,
  ctx: ExecutionContext,
): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(jsonRpcError(null, -32700, "Parse error"));
  }

  if (Array.isArray(payload)) {
    const responses: JsonRpcResponsePayload[] = [];
    for (const item of payload) {
      const response = await handleMessage(asRequest(item), env, ctx);
      if (response) responses.push(response);
    }
    if (responses.length === 0) return emptyAcceptedResponse();
    return jsonResponse(responses);
  }

  const response = await handleMessage(asRequest(payload), env, ctx);
  if (!response) return emptyAcceptedResponse();
  return jsonResponse(response);
}

export function serverCard(endpoint: string) {
  return {
    $schema:
      "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
    version: "1.0",
    protocolVersion: PROTOCOL_VERSION,
    serverInfo: serverInfo(),
    description:
      "Read-only MCP server exposing the MPP service discovery catalog and payment terms as advisory MCP tools.",
    documentationUrl:
      "https://docs.tempo.xyz/guide/machine-payments/discover-services",
    iconUrl: "https://mpp.dev/favicon.svg",
    transport: {
      type: "streamable-http",
      endpoint,
    },
    capabilities: {
      tools: {},
    },
    authentication: {
      required: false,
      schemes: [],
    },
    instructions: INITIALIZE_INSTRUCTIONS,
    tools: "dynamic",
  };
}

export function jsonHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("content-type", "application/json");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET,HEAD,POST,OPTIONS");
  headers.set(
    "access-control-allow-headers",
    "content-type,mcp-protocol-version",
  );
  headers.set("mcp-protocol-version", PROTOCOL_VERSION);
  return headers;
}

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: jsonHeaders() });
}

async function handleMessage(
  request: JsonRpcRequest | undefined,
  env: WorkerEnv,
  ctx: ExecutionContext,
): Promise<JsonRpcResponsePayload | undefined> {
  if (request?.jsonrpc !== "2.0" || typeof request.method !== "string") {
    return jsonRpcError(request?.id ?? null, -32600, "Invalid Request");
  }

  switch (request.method) {
    case "initialize":
      return jsonRpcResult(
        request.id ?? null,
        initializeResult(request.params),
      );
    case "notifications/initialized":
      return undefined;
    case "ping":
      return jsonRpcResult(request.id ?? null, {});
    case "tools/list":
      return jsonRpcResult(request.id ?? null, { tools: toolSchemas() });
    case "tools/call":
      return jsonRpcResult(
        request.id ?? null,
        await handleToolCall(toolCallParams(request.params), env, ctx),
      );
    case "resources/list":
      return jsonRpcResult(request.id ?? null, { resources: [] });
    case "resources/templates/list":
      return jsonRpcResult(request.id ?? null, { resourceTemplates: [] });
    case "prompts/list":
      return jsonRpcResult(request.id ?? null, { prompts: [] });
    default:
      return jsonRpcError(
        request.id ?? null,
        -32601,
        `Method not found: ${request.method}`,
      );
  }
}

async function handleToolCall(
  params: ToolCallParams,
  env: WorkerEnv,
  ctx: ExecutionContext,
) {
  const name = typeof params.name === "string" ? params.name : "";
  const args = objectArgs(params.arguments);

  try {
    const catalog = await getCatalog(env, ctx);
    const meta = {
      advisory: ADVISORY,
      catalogVersion: catalog.version,
      cacheStatus: catalog.cacheStatus,
      fetchedAt: catalog.fetchedAt,
      sourceUrl: catalog.sourceUrl,
    };

    if (name === "list_services") {
      const pagination = paginationArgs(args);
      const services = listServiceSummaries(catalog.services);
      const page = paginate(services, pagination);
      return toolResult(
        {
          ...meta,
          appliedFilters: {},
          total: services.length,
          returned: page.length,
          offset: pagination.offset,
          limit: pagination.limit,
          services: page,
        },
        `Returned ${page.length} of ${services.length} MPP services. ${ADVISORY}`,
      );
    }

    if (name === "search_services") {
      const filters = searchArgs(args);
      const pagination = paginationArgs(args);
      const services = searchServices(catalog.services, filters);
      const page = paginate(services, pagination);
      return toolResult(
        {
          ...meta,
          appliedFilters: filters,
          total: services.length,
          returned: page.length,
          offset: pagination.offset,
          limit: pagination.limit,
          services: page,
        },
        `Returned ${page.length} of ${services.length} MPP services. ${ADVISORY}`,
      );
    }

    if (name === "search_offers") {
      const filters = searchOfferArgs(args);
      const pagination = paginationArgs(args);
      const offers = searchOffers(catalog.services, filters);
      const page = paginate(offers, pagination);
      return toolResult(
        {
          ...meta,
          appliedFilters: filters,
          searchMethod: searchMethod(filters),
          partialResults: pagination.offset + page.length < offers.length,
          total: offers.length,
          returned: page.length,
          offset: pagination.offset,
          limit: pagination.limit,
          offers: page,
        },
        `Returned ${page.length} of ${offers.length} MPP payment offers. ${ADVISORY}`,
      );
    }

    if (name === "recommend_services") {
      const { task, filters, limit } = recommendArgs(args);
      const offers = searchOffers(catalog.services, filters);
      const recommendations = rankServiceRecommendations(
        catalog.services,
        task,
        offers,
        filters,
      );
      const page = recommendations.slice(0, limit);
      return toolResult(
        {
          ...meta,
          appliedFilters: { task, constraints: filters },
          searchMethod: "task_recommendation",
          total: recommendations.length,
          returned: page.length,
          limit,
          recommendations: page,
        },
        `Recommended ${page.length} of ${recommendations.length} MPP services for "${task}". ${ADVISORY}`,
      );
    }

    if (name === "get_usage_recipe") {
      const serviceName = requiredString(args, "service");
      const route = optionalString(args, "route");
      const service = requireService(catalog.services, serviceName);
      const offers = offersForService(service, route);
      return toolResult(
        {
          ...meta,
          appliedFilters: { service: serviceName, ...(route ? { route } : {}) },
          service: serviceRef(service),
          ...(route ? { route } : {}),
          baseUrl: service.serviceUrl ?? service.url,
          docs: service.docs ?? {},
          count: offers.length,
          offers,
          endpointCandidates: offers.map((offer) =>
            usageEndpointCandidate(service, offer),
          ),
          recipe: usageRecipe(
            service,
            route,
            env.PUBLIC_MCP_ENDPOINT ?? "https://mpp.dev/mcp/services",
          ),
        },
        `Returned usage recipe for ${service.id} with ${offers.length} payable endpoint candidates. ${ADVISORY}`,
      );
    }

    if (name === "get_facets") {
      const facets = getFacets(catalog.services);
      return toolResult(
        {
          ...meta,
          serviceCount: catalog.services.length,
          offerCount: countPaymentOffers(catalog.services),
          facets,
        },
        `Returned MPP catalog facets for ${catalog.services.length} services. ${ADVISORY}`,
      );
    }

    if (name === "get_services_by_recipient") {
      const recipient = requiredString(args, "recipient");
      const pagination = paginationArgs(args);
      const services = servicesByRecipient(catalog.services, recipient);
      const page = paginate(services, pagination);
      return toolResult(
        {
          ...meta,
          appliedFilters: { recipient },
          total: services.length,
          returned: page.length,
          offset: pagination.offset,
          limit: pagination.limit,
          services: page,
        },
        `Returned ${page.length} of ${services.length} services with payment offers for recipient ${recipient}. ${ADVISORY}`,
      );
    }

    if (name === "get_catalog_status") {
      return toolResult(
        {
          ...meta,
          serviceCount: catalog.services.length,
          offerCount: countPaymentOffers(catalog.services),
          cacheAgeSeconds: cacheAgeSeconds(catalog.fetchedAt),
          lastSuccessfulRefreshAt: catalog.fetchedAt,
          ...(catalog.refreshError
            ? { refreshError: catalog.refreshError }
            : {}),
        },
        `Catalog has ${catalog.services.length} services and ${countPaymentOffers(catalog.services)} payment offers. ${ADVISORY}`,
      );
    }

    if (name === "get_service") {
      const idOrName = requiredString(args, "id_or_name");
      const service = requireService(catalog.services, idOrName);
      return toolResult(
        {
          ...meta,
          appliedFilters: { id_or_name: idOrName },
          count: 1,
          service,
        },
        `Returned service ${service.id}. ${ADVISORY}`,
      );
    }

    if (name === "get_offers") {
      const serviceName = requiredString(args, "service");
      const service = requireService(catalog.services, serviceName);
      const route = optionalString(args, "route");
      const offers = offersForService(service, route);
      return toolResult(
        {
          ...meta,
          appliedFilters: { service: serviceName, ...(route ? { route } : {}) },
          service: serviceRef(service),
          ...(route ? { route } : {}),
          count: offers.length,
          offers,
        },
        `Returned ${offers.length} payment offers for ${service.id}. ${ADVISORY}`,
      );
    }

    if (name === "get_openapi") {
      const serviceName = requiredString(args, "service");
      const raw = booleanArg(args, "raw", false);
      const service = requireService(catalog.services, serviceName);
      const openapi = await openApiFor(service, { raw });
      return toolResult(
        {
          ...meta,
          appliedFilters: { service: serviceName, ...(raw ? { raw } : {}) },
          service: serviceRef(service),
          count: 1,
          source: openapi.source,
          openapi,
        },
        `${openapi.source === "registry" ? "Returned registry endpoint view" : `Fetched ${openapi.source} OpenAPI candidate`} for ${service.id}. ${ADVISORY}`,
      );
    }

    return toolError(`Unknown tool: ${name || "(missing)"}`);
  } catch (error) {
    return toolError(errorMessage(error));
  }
}

async function openApiFor(service: Service, options: OpenApiRequestOptions) {
  for (const candidate of openApiCandidates(service)) {
    const fetched = await fetchOpenApiCandidate(candidate, options);
    if (fetched) return fetched;
  }

  return registryOpenApiView(service);
}

function openApiCandidates(service: Service): OpenApiCandidate[] {
  return [
    ...(service.docs?.openapi
      ? [{ source: "docs.openapi" as const, url: service.docs.openapi }]
      : []),
    { source: "well-known" as const, url: openApiConventionUrl(service.url) },
    ...(service.docs?.apiReference
      ? [{ source: "apiReference" as const, url: service.docs.apiReference }]
      : []),
  ];
}

function openApiConventionUrl(serviceUrl: string): string {
  return `${serviceUrl.replace(/\/+$/, "")}/openapi.json`;
}

async function fetchOpenApiCandidate(
  candidate: OpenApiCandidate,
  options: OpenApiRequestOptions,
) {
  let url = httpsUrl(candidate.url);
  if (!url) return undefined;

  for (
    let redirectCount = 0;
    redirectCount <= MAX_OPENAPI_REDIRECTS;
    redirectCount += 1
  ) {
    const response = await fetchOpenApiResponse(url);
    if (!response) return undefined;

    if (isRedirectStatus(response.status)) {
      if (redirectCount === MAX_OPENAPI_REDIRECTS) return undefined;
      const nextUrl = httpsRedirectUrl(response.headers.get("location"), url);
      if (!nextUrl) return undefined;
      url = nextUrl;
      continue;
    }

    if (response.status !== 200) return undefined;

    const contentType = response.headers.get("content-type") ?? "unknown";
    const body = await readTextWithLimit(response, MAX_OPENAPI_FETCH_BYTES);
    if (!body) return undefined;

    const document = parseOpenApiDocument(body.text);
    if (!document) return undefined;

    return formatOpenApiDocument(
      {
        source: candidate.source,
        url: url.toString(),
        contentType,
        bytes: body.bytes,
        document,
      },
      options,
    );
  }

  return undefined;
}

async function fetchOpenApiResponse(url: URL): Promise<Response | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    OPENAPI_FETCH_TIMEOUT_MS,
  );
  try {
    return await fetch(url.toString(), {
      headers: { accept: "application/json, */*" },
      redirect: "manual",
      cf: { cacheTtl: 300 },
      signal: controller.signal,
    });
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

function formatOpenApiDocument(
  fetched: FetchedOpenApi,
  options: OpenApiRequestOptions,
) {
  if (options.raw && fetched.bytes <= MAX_OPENAPI_RAW_BYTES) {
    return {
      source: fetched.source,
      url: fetched.url,
      sourceUrl: fetched.url,
      contentType: fetched.contentType,
      bytes: fetched.bytes,
      raw: true,
      summary: false,
      document: fetched.document,
    };
  }

  return {
    source: fetched.source,
    url: fetched.url,
    sourceUrl: fetched.url,
    contentType: fetched.contentType,
    bytes: fetched.bytes,
    raw: false,
    summary: true,
    ...summarizeOpenApiDocument(fetched.document),
    ...(options.raw && fetched.bytes > MAX_OPENAPI_RAW_BYTES
      ? {
          note: `Raw OpenAPI document is ${fetched.bytes} bytes, above the ${MAX_OPENAPI_RAW_BYTES} byte cap; returning summary instead.`,
        }
      : {}),
  };
}

function summarizeOpenApiDocument(document: OpenApiDocument) {
  return {
    ...(typeof document.openapi === "string"
      ? { openapiVersion: document.openapi }
      : {}),
    info: openApiInfo(document.info),
    ...(document["x-service-info"] !== undefined
      ? { "x-service-info": document["x-service-info"] }
      : {}),
    paths: summarizeOpenApiPaths(document.paths),
  };
}

function openApiInfo(value: unknown) {
  if (!isRecord(value)) return {};
  return {
    ...(typeof value.title === "string" ? { title: value.title } : {}),
    ...(typeof value.version === "string" ? { version: value.version } : {}),
  };
}

function summarizeOpenApiPaths(paths: unknown) {
  if (!isRecord(paths)) return [];

  const summaries: Array<Record<string, unknown>> = [];
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) continue;
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!isRecord(operation)) continue;
      const summary =
        typeof operation.summary === "string"
          ? operation.summary
          : typeof operation.description === "string"
            ? operation.description
            : undefined;
      const offers = operation["x-payment-info"] ?? pathItem["x-payment-info"];
      summaries.push({
        method: method.toUpperCase(),
        path,
        ...(summary ? { summary } : {}),
        ...(offers !== undefined ? { offers } : {}),
      });
    }
  }
  return summaries;
}

async function readTextWithLimit(
  response: Response,
  maxBytes: number,
): Promise<{ text: string; bytes: number } | undefined> {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number(contentLength);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      return undefined;
    }
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    const bytes = utf8Bytes(text);
    return bytes <= maxBytes ? { text, bytes } : undefined;
  }

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }
  chunks.push(decoder.decode());
  return { text: chunks.join(""), bytes };
}

function parseOpenApiDocument(text: string): OpenApiDocument | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (!isRecord(parsed)) return undefined;
  if (typeof parsed.openapi === "string" || isRecord(parsed.paths)) {
    return parsed as OpenApiDocument;
  }
  return undefined;
}

function httpsUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function httpsRedirectUrl(
  location: string | null,
  baseUrl: URL,
): URL | undefined {
  if (!location) return undefined;
  try {
    const url = new URL(location, baseUrl);
    return url.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function isRedirectStatus(status: number): boolean {
  return [301, 302, 303, 307, 308].includes(status);
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function initializeResult(params: unknown) {
  const requested =
    typeof params === "object" && params !== null
      ? (params as { protocolVersion?: unknown }).protocolVersion
      : undefined;
  const protocolVersion =
    typeof requested === "string" && requested.length > 0
      ? requested
      : PROTOCOL_VERSION;

  return {
    protocolVersion:
      protocolVersion === PROTOCOL_VERSION
        ? PROTOCOL_VERSION
        : PROTOCOL_VERSION,
    capabilities: {
      tools: {},
    },
    serverInfo: serverInfo(),
    instructions: INITIALIZE_INSTRUCTIONS,
  };
}

function serverInfo() {
  return {
    name: "mpp-services-mcp",
    title: "MPP Services MCP server",
    version: SERVER_VERSION,
  };
}

function rankServiceRecommendations(
  services: Service[],
  task: string,
  offers: OfferSearchResult[],
  filters: SearchOffersArgs,
) {
  const terms = taskTerms(task);
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const grouped = new Map<string, OfferSearchResult[]>();
  for (const offer of offers) {
    const group = grouped.get(offer.service.id);
    if (group) {
      group.push(offer);
    } else {
      grouped.set(offer.service.id, [offer]);
    }
  }

  const recommendations = [...grouped.entries()]
    .map(([serviceId, serviceOffers]) => {
      const service = serviceById.get(serviceId);
      if (!service) return undefined;
      const matchedTerms = matchedTaskTerms(service, serviceOffers, terms);
      const topOffers = serviceOffers.slice(0, 3);
      const score = recommendationScore(
        service,
        topOffers,
        terms,
        matchedTerms,
        filters,
      );
      return {
        service: serviceOffers[0].service,
        score,
        matchedTerms,
        reasons: recommendationReasons(
          service,
          topOffers,
          matchedTerms,
          filters,
        ),
        topOffers,
        nextActions: [
          `Call get_usage_recipe with {"service":"${service.id}"}.`,
          `Call get_openapi with {"service":"${service.id}"} if request or response schemas are needed.`,
          "Make the target HTTP request and treat the runtime 402 Challenge as authoritative before paying.",
        ],
      };
    })
    .filter(
      (recommendation): recommendation is NonNullable<typeof recommendation> =>
        Boolean(recommendation),
    );

  const hasTaskMatches = recommendations.some(
    (recommendation) => recommendation.matchedTerms.length > 0,
  );

  return recommendations
    .filter(
      (recommendation) =>
        !hasTaskMatches ||
        recommendation.matchedTerms.length > 0 ||
        Object.keys(filters).length > 0,
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.service.name.localeCompare(right.service.name),
    );
}

function recommendationScore(
  service: Service,
  offers: OfferSearchResult[],
  terms: string[],
  matchedTerms: string[],
  filters: SearchOffersArgs,
): number {
  let score = 0;
  score += matchedTerms.length * 35;
  if ((service.status ?? "active") === "active") score += 20;
  if (service.integration === "first-party") score += 12;
  if (service.docs?.openapi || service.docs?.apiReference) score += 8;
  if (offers.some((offer) => offer.rankingSignals.includes("fixed_price"))) {
    score += 6;
  }
  if (offers.some((offer) => offer.rankingSignals.includes("dynamic_price"))) {
    score += 3;
  }
  if (
    filters.category &&
    (service.categories ?? []).includes(filters.category)
  ) {
    score += 12;
  }
  if (filters.integration && service.integration === filters.integration) {
    score += 8;
  }
  if (filters.status && (service.status ?? "active") === filters.status) {
    score += 8;
  }
  const paymentMethod = filters.method;
  if (
    paymentMethod &&
    offers.some((offer) =>
      equalsIgnoreCase(offer.payment.method, paymentMethod),
    )
  ) {
    score += 8;
  }
  if (terms.some((term) => normalizedText(service.name).includes(term))) {
    score += 25;
  }
  if (
    terms.some((term) =>
      (service.tags ?? []).some((tag) => normalizedText(tag).includes(term)),
    )
  ) {
    score += 15;
  }
  return score;
}

function recommendationReasons(
  service: Service,
  offers: OfferSearchResult[],
  matchedTerms: string[],
  filters: SearchOffersArgs,
): string[] {
  return [
    matchedTerms.length
      ? `Matched task terms: ${matchedTerms.join(", ")}.`
      : "No direct task-term match; ranked by catalog quality and filters.",
    (service.status ?? "active") === "active"
      ? "Service is active."
      : undefined,
    service.integration === "first-party"
      ? "First-party integration."
      : undefined,
    service.docs?.openapi || service.docs?.apiReference
      ? "Has OpenAPI or API reference metadata."
      : undefined,
    offers.some((offer) => offer.rankingSignals.includes("fixed_price"))
      ? "Includes fixed-price payment offers."
      : undefined,
    offers.some((offer) => offer.rankingSignals.includes("dynamic_price"))
      ? "Includes dynamic pricing offers."
      : undefined,
    filters.category ? `Filtered to category ${filters.category}.` : undefined,
    filters.method
      ? `Filtered to payment method ${filters.method}.`
      : undefined,
  ].filter((reason): reason is string => Boolean(reason));
}

function matchedTaskTerms(
  service: Service,
  offers: OfferSearchResult[],
  terms: string[],
): string[] {
  if (terms.length === 0) return [];
  const text = normalizedText([
    service.id,
    service.name,
    service.description,
    ...(service.tags ?? []),
    ...(service.categories ?? []),
    service.provider?.name,
    ...offers.flatMap((offer) => [
      offer.method,
      offer.path,
      offer.description,
      offer.docs,
      offer.payment.intent,
      offer.payment.method,
      offer.payment.currency,
      offer.payment.recipient,
      offer.payment.unitType,
      offer.payment.description,
      offer.payment.amountHint,
    ]),
  ]);
  return terms.filter((term) => text.includes(term));
}

function taskTerms(task: string): string[] {
  const terms = normalizedText(task).match(/[a-z0-9]+/g) ?? [];
  return [
    ...new Set(
      terms.filter((term) => term.length > 2 && !TASK_STOP_WORDS.has(term)),
    ),
  ];
}

function usageEndpointCandidate(
  service: Service,
  offer: ReturnType<typeof offersForService>[number],
) {
  return {
    method: offer.method,
    path: offer.path,
    url: endpointUrl(service.serviceUrl ?? service.url, offer.path),
    ...(offer.description ? { description: offer.description } : {}),
    ...(offer.docs ? { docs: offer.docs } : {}),
    payment: offer.payment,
  };
}

function usageRecipe(
  service: Service,
  route: string | undefined,
  endpoint: string,
) {
  return {
    mcpServer: endpoint,
    mode: "read-only-discovery",
    paymentAuthority: ADVISORY,
    suggestedMcpCalls: [
      {
        tool: "get_service",
        arguments: { id_or_name: service.id },
      },
      {
        tool: "get_offers",
        arguments: { service: service.id, ...(route ? { route } : {}) },
      },
      {
        tool: "get_openapi",
        arguments: { service: service.id },
      },
    ],
    httpSteps: [
      "Choose a candidate endpoint and build the target API request from the service documentation or OpenAPI summary.",
      "Send the ordinary HTTP request to the target service.",
      "If the target service returns 402 Payment Required, parse the runtime Challenge and choose a compatible payment method.",
      "Fulfill the Challenge with the calling agent's payment client or wallet, then retry the target request with the resulting Credential.",
      "Validate the returned Receipt according to the payment method used by the target service.",
    ],
    warnings: [
      ADVISORY,
      "This MCP server does not proxy requests, execute payments, issue credentials, or validate receipts.",
    ],
  };
}

function endpointUrl(baseUrl: string, path: string): string {
  try {
    return new URL(
      path,
      baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
    ).toString();
  } catch {
    return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  }
}

function normalizedText(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined && item !== null)
      .map((item) => String(item))
      .join(" ")
      .trim()
      .toLowerCase();
  }
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function equalsIgnoreCase(left: string, right: string): boolean {
  return normalizedText(left) === normalizedText(right);
}

function toolSchemas() {
  const advisory = ` ${ADVISORY}`;
  return [
    {
      name: "list_services",
      description:
        "List MPP discovery catalog services with id, name, URL, categories, integration, status, and description." +
        advisory,
      inputSchema: {
        type: "object",
        properties: paginationInputProperties(),
        additionalProperties: false,
      },
      outputSchema: paginatedServicesOutputSchema(),
      execution: { taskSupport: "forbidden" },
    },
    {
      name: "search_services",
      description:
        "Search MPP services by simple substring query over name, description, and tags, plus exact filters for category, payment method, integration, and status." +
        advisory,
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Substring query." },
          category: {
            type: "string",
            enum: CATEGORIES,
            description: "Exact category filter.",
          },
          method: {
            type: "string",
            description: "Exact payment method filter, for example tempo.",
          },
          integration: {
            type: "string",
            enum: INTEGRATIONS,
            description: "Exact integration filter.",
          },
          status: {
            type: "string",
            enum: STATUSES,
            description: "Exact status filter.",
          },
          ...paginationInputProperties(),
        },
        additionalProperties: false,
      },
      outputSchema: paginatedServicesOutputSchema(),
      execution: { taskSupport: "forbidden" },
    },
    {
      name: "search_offers",
      description:
        "Search endpoint-level MPP payment offers by task, category, payment method, currency, max amount, unit type, dynamic pricing, recipient, integration, and status." +
        advisory,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Substring query over service, endpoint, and payment metadata.",
          },
          category: {
            type: "string",
            enum: CATEGORIES,
            description: "Exact service category filter.",
          },
          method: {
            type: "string",
            description: "Exact payment method filter, for example tempo.",
          },
          currency: {
            type: "string",
            description:
              "Exact payment currency filter, such as a token address or currency code.",
          },
          maxAmount: {
            type: "string",
            pattern: "^[0-9]+$",
            description:
              "Maximum fixed payment amount in base units. Dynamic or non-numeric offers are excluded when this is set.",
          },
          unitType: {
            type: "string",
            description: "Exact payment unit type filter.",
          },
          dynamic: {
            type: "boolean",
            description: "Filter dynamic pricing offers.",
          },
          recipient: {
            type: "string",
            description: "Exact payment recipient/payee filter.",
          },
          integration: {
            type: "string",
            enum: INTEGRATIONS,
            description: "Exact integration filter.",
          },
          status: {
            type: "string",
            enum: STATUSES,
            description: "Exact service status filter.",
          },
          ...paginationInputProperties(),
        },
        additionalProperties: false,
      },
      outputSchema: offerSearchOutputSchema(),
      execution: { taskSupport: "forbidden" },
    },
    {
      name: "recommend_services",
      description:
        "Rank MPP paid API services for an agent task using deterministic catalog metadata, optional exact constraints, and endpoint payment-offer signals." +
        advisory,
      inputSchema: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description:
              "Natural-language agent task, for example send email, search the web, run an LLM, or store a file.",
          },
          constraints: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: CATEGORIES,
                description: "Exact service category filter.",
              },
              method: {
                type: "string",
                description: "Exact payment method filter, for example tempo.",
              },
              currency: {
                type: "string",
                description:
                  "Exact payment currency filter, such as a token address or currency code.",
              },
              maxAmount: {
                type: "string",
                pattern: "^[0-9]+$",
                description:
                  "Maximum fixed payment amount in base units. Dynamic or non-numeric offers are excluded when this is set.",
              },
              unitType: {
                type: "string",
                description: "Exact payment unit type filter.",
              },
              dynamic: {
                type: "boolean",
                description: "Filter dynamic pricing offers.",
              },
              recipient: {
                type: "string",
                description: "Exact payment recipient/payee filter.",
              },
              integration: {
                type: "string",
                enum: INTEGRATIONS,
                description: "Exact integration filter.",
              },
              status: {
                type: "string",
                enum: STATUSES,
                description: "Exact status filter.",
              },
              limit: {
                type: "integer",
                minimum: 1,
                maximum: MAX_RECOMMENDATION_LIMIT,
                default: DEFAULT_RECOMMENDATION_LIMIT,
                description: `Maximum number of ranked services to return, up to ${MAX_RECOMMENDATION_LIMIT}.`,
              },
            },
            additionalProperties: false,
          },
        },
        required: ["task"],
        additionalProperties: false,
      },
      outputSchema: recommendationsOutputSchema(),
      execution: { taskSupport: "forbidden" },
    },
    {
      name: "get_usage_recipe",
      description:
        "Return a practical read-only recipe for using a discovered service: candidate payable endpoints, follow-up MCP calls, and the target HTTP/402 payment flow." +
        advisory,
      inputSchema: {
        type: "object",
        properties: {
          service: { type: "string", description: "Service id or name." },
          route: {
            type: "string",
            description:
              "Optional route filter such as POST /v1/messages. Exact METHOD /path matches are preferred; otherwise substring matching is used.",
          },
        },
        required: ["service"],
        additionalProperties: false,
      },
      outputSchema: usageRecipeOutputSchema(),
      execution: { taskSupport: "forbidden" },
    },
    {
      name: "get_facets",
      description:
        "Return valid filter values and counts for service categories, integrations, statuses, payment methods, currencies, unit types, intents, recipients, and dynamic pricing." +
        advisory,
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      outputSchema: facetsOutputSchema(),
      execution: { taskSupport: "forbidden" },
    },
    {
      name: "get_services_by_recipient",
      description:
        "Find services that publish payment offers for a recipient/payee address or identifier from discovery metadata." +
        advisory,
      inputSchema: {
        type: "object",
        properties: {
          recipient: {
            type: "string",
            description: "Payment recipient or payee identifier.",
          },
          ...paginationInputProperties(),
        },
        required: ["recipient"],
        additionalProperties: false,
      },
      outputSchema: recipientServicesOutputSchema(),
      execution: { taskSupport: "forbidden" },
    },
    {
      name: "get_catalog_status",
      description:
        "Return MPP catalog source, version, service count, offer count, cache status, cache age, and last successful refresh time." +
        advisory,
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      outputSchema: catalogStatusOutputSchema(),
      execution: { taskSupport: "forbidden" },
    },
    {
      name: "get_service",
      description: `Get the full MPP Service record by id or name.${advisory}`,
      inputSchema: {
        type: "object",
        properties: {
          id_or_name: {
            type: "string",
            description: "Service id or exact service name.",
          },
        },
        required: ["id_or_name"],
        additionalProperties: false,
      },
      outputSchema: serviceOutputSchema(),
      execution: { taskSupport: "forbidden" },
    },
    {
      name: "get_offers",
      description:
        "Return endpoint payment offers for a service, optionally filtered by exact route or route substring." +
        advisory,
      inputSchema: {
        type: "object",
        properties: {
          service: { type: "string", description: "Service id or name." },
          route: {
            type: "string",
            description:
              "Optional route filter such as POST /v1/messages. Exact METHOD /path matches are preferred; otherwise substring matching is used.",
          },
        },
        required: ["service"],
        additionalProperties: false,
      },
      outputSchema: offersOutputSchema(),
      execution: { taskSupport: "forbidden" },
    },
    {
      name: "get_openapi",
      description:
        "Fetch and summarize OpenAPI data using service.docs.openapi, service.url/openapi.json, service.docs.apiReference, then a registry-derived endpoint view; set raw true for the full document when it is under the raw byte cap." +
        advisory,
      inputSchema: {
        type: "object",
        properties: {
          service: { type: "string", description: "Service id or name." },
          raw: {
            type: "boolean",
            default: false,
            description: `Return the full fetched OpenAPI document when it is at or below ${MAX_OPENAPI_RAW_BYTES} bytes; larger documents return a summary with a note.`,
          },
        },
        required: ["service"],
        additionalProperties: false,
      },
      outputSchema: openApiOutputSchema(),
      execution: { taskSupport: "forbidden" },
    },
  ] as const;
}

function paginationInputProperties() {
  return {
    limit: {
      type: "integer",
      minimum: 1,
      maximum: MAX_LIMIT,
      default: DEFAULT_LIMIT,
      description: `Maximum number of services to return, up to ${MAX_LIMIT}.`,
    },
    offset: {
      type: "integer",
      minimum: 0,
      default: 0,
      description:
        "Number of matching services to skip before returning results.",
    },
  };
}

function paginatedServicesOutputSchema() {
  return oneOfSuccessOrError({
    type: "object",
    properties: {
      ...commonEnvelopeProperties(),
      appliedFilters: { type: "object", additionalProperties: true },
      total: { type: "integer", minimum: 0 },
      returned: { type: "integer", minimum: 0 },
      offset: { type: "integer", minimum: 0 },
      limit: { type: "integer", minimum: 1, maximum: MAX_LIMIT },
      services: {
        type: "array",
        items: serviceSummarySchema(),
      },
    },
    required: [
      "advisory",
      "catalogVersion",
      "cacheStatus",
      "fetchedAt",
      "sourceUrl",
      "appliedFilters",
      "total",
      "returned",
      "offset",
      "limit",
      "services",
    ],
    additionalProperties: false,
  });
}

function offerSearchOutputSchema() {
  return oneOfSuccessOrError({
    type: "object",
    properties: {
      ...commonEnvelopeProperties(),
      appliedFilters: { type: "object", additionalProperties: true },
      searchMethod: {
        type: "string",
        enum: ["all", "text", "filter", "recipient"],
      },
      partialResults: { type: "boolean" },
      total: { type: "integer", minimum: 0 },
      returned: { type: "integer", minimum: 0 },
      offset: { type: "integer", minimum: 0 },
      limit: { type: "integer", minimum: 1, maximum: MAX_LIMIT },
      offers: {
        type: "array",
        items: offerSearchResultSchema(),
      },
    },
    required: [
      "advisory",
      "catalogVersion",
      "cacheStatus",
      "fetchedAt",
      "sourceUrl",
      "appliedFilters",
      "searchMethod",
      "partialResults",
      "total",
      "returned",
      "offset",
      "limit",
      "offers",
    ],
    additionalProperties: false,
  });
}

function recommendationsOutputSchema() {
  return oneOfSuccessOrError({
    type: "object",
    properties: {
      ...commonEnvelopeProperties(),
      appliedFilters: { type: "object", additionalProperties: true },
      searchMethod: {
        type: "string",
        enum: ["task_recommendation"],
      },
      total: { type: "integer", minimum: 0 },
      returned: { type: "integer", minimum: 0 },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: MAX_RECOMMENDATION_LIMIT,
      },
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            service: serviceSummarySchema(),
            score: { type: "number" },
            matchedTerms: {
              type: "array",
              items: { type: "string" },
            },
            reasons: {
              type: "array",
              items: { type: "string" },
            },
            topOffers: {
              type: "array",
              items: offerSearchResultSchema(),
            },
            nextActions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "service",
            "score",
            "matchedTerms",
            "reasons",
            "topOffers",
            "nextActions",
          ],
          additionalProperties: false,
        },
      },
    },
    required: [
      "advisory",
      "catalogVersion",
      "cacheStatus",
      "fetchedAt",
      "sourceUrl",
      "appliedFilters",
      "searchMethod",
      "total",
      "returned",
      "limit",
      "recommendations",
    ],
    additionalProperties: false,
  });
}

function usageRecipeOutputSchema() {
  return oneOfSuccessOrError({
    type: "object",
    properties: {
      ...commonEnvelopeProperties(),
      appliedFilters: { type: "object", additionalProperties: true },
      service: serviceRefSchema(),
      route: { type: "string" },
      baseUrl: { type: "string" },
      docs: { type: "object", additionalProperties: true },
      count: { type: "integer", minimum: 0 },
      offers: {
        type: "array",
        items: offerSchema(),
      },
      endpointCandidates: {
        type: "array",
        items: {
          type: "object",
          properties: {
            method: { type: "string" },
            path: { type: "string" },
            url: { type: "string" },
            description: { type: "string" },
            docs: { type: "string" },
            payment: { type: "object", additionalProperties: true },
          },
          required: ["method", "path", "url", "payment"],
          additionalProperties: false,
        },
      },
      recipe: {
        type: "object",
        properties: {
          mcpServer: { type: "string" },
          mode: { type: "string", enum: ["read-only-discovery"] },
          paymentAuthority: { type: "string", const: ADVISORY },
          suggestedMcpCalls: {
            type: "array",
            items: { type: "object", additionalProperties: true },
          },
          httpSteps: {
            type: "array",
            items: { type: "string" },
          },
          warnings: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "mcpServer",
          "mode",
          "paymentAuthority",
          "suggestedMcpCalls",
          "httpSteps",
          "warnings",
        ],
        additionalProperties: false,
      },
    },
    required: [
      "advisory",
      "catalogVersion",
      "cacheStatus",
      "fetchedAt",
      "sourceUrl",
      "appliedFilters",
      "service",
      "baseUrl",
      "docs",
      "count",
      "offers",
      "endpointCandidates",
      "recipe",
    ],
    additionalProperties: false,
  });
}

function facetsOutputSchema() {
  return oneOfSuccessOrError({
    type: "object",
    properties: {
      ...commonEnvelopeProperties(),
      serviceCount: { type: "integer", minimum: 0 },
      offerCount: { type: "integer", minimum: 0 },
      facets: {
        type: "object",
        properties: {
          categories: facetValuesSchema(),
          integrations: facetValuesSchema(),
          statuses: facetValuesSchema(),
          paymentMethods: facetValuesSchema(),
          currencies: facetValuesSchema(),
          unitTypes: facetValuesSchema(),
          intents: facetValuesSchema(),
          recipients: facetValuesSchema(),
          dynamic: facetValuesSchema(),
        },
        required: [
          "categories",
          "integrations",
          "statuses",
          "paymentMethods",
          "currencies",
          "unitTypes",
          "intents",
          "recipients",
          "dynamic",
        ],
        additionalProperties: false,
      },
    },
    required: [
      "advisory",
      "catalogVersion",
      "cacheStatus",
      "fetchedAt",
      "sourceUrl",
      "serviceCount",
      "offerCount",
      "facets",
    ],
    additionalProperties: false,
  });
}

function recipientServicesOutputSchema() {
  return oneOfSuccessOrError({
    type: "object",
    properties: {
      ...commonEnvelopeProperties(),
      appliedFilters: { type: "object", additionalProperties: true },
      total: { type: "integer", minimum: 0 },
      returned: { type: "integer", minimum: 0 },
      offset: { type: "integer", minimum: 0 },
      limit: { type: "integer", minimum: 1, maximum: MAX_LIMIT },
      services: {
        type: "array",
        items: {
          type: "object",
          properties: {
            service: serviceSummarySchema(),
            count: { type: "integer", minimum: 0 },
            offers: {
              type: "array",
              items: offerSchema(),
            },
          },
          required: ["service", "count", "offers"],
          additionalProperties: false,
        },
      },
    },
    required: [
      "advisory",
      "catalogVersion",
      "cacheStatus",
      "fetchedAt",
      "sourceUrl",
      "appliedFilters",
      "total",
      "returned",
      "offset",
      "limit",
      "services",
    ],
    additionalProperties: false,
  });
}

function catalogStatusOutputSchema() {
  return oneOfSuccessOrError({
    type: "object",
    properties: {
      ...commonEnvelopeProperties(),
      serviceCount: { type: "integer", minimum: 0 },
      offerCount: { type: "integer", minimum: 0 },
      cacheAgeSeconds: { type: "integer", minimum: 0 },
      lastSuccessfulRefreshAt: { type: "string" },
      refreshError: { type: "string" },
    },
    required: [
      "advisory",
      "catalogVersion",
      "cacheStatus",
      "fetchedAt",
      "sourceUrl",
      "serviceCount",
      "offerCount",
      "cacheAgeSeconds",
      "lastSuccessfulRefreshAt",
    ],
    additionalProperties: false,
  });
}

function serviceOutputSchema() {
  return oneOfSuccessOrError({
    type: "object",
    properties: {
      ...commonEnvelopeProperties(),
      appliedFilters: { type: "object", additionalProperties: true },
      count: { type: "integer", const: 1 },
      service: serviceSchema(),
    },
    required: [
      "advisory",
      "catalogVersion",
      "cacheStatus",
      "fetchedAt",
      "sourceUrl",
      "appliedFilters",
      "count",
      "service",
    ],
    additionalProperties: false,
  });
}

function offersOutputSchema() {
  return oneOfSuccessOrError({
    type: "object",
    properties: {
      ...commonEnvelopeProperties(),
      appliedFilters: { type: "object", additionalProperties: true },
      service: serviceRefSchema(),
      route: { type: "string" },
      count: { type: "integer", minimum: 0 },
      offers: {
        type: "array",
        items: offerSchema(),
      },
    },
    required: [
      "advisory",
      "catalogVersion",
      "cacheStatus",
      "fetchedAt",
      "sourceUrl",
      "appliedFilters",
      "service",
      "count",
      "offers",
    ],
    additionalProperties: false,
  });
}

function openApiOutputSchema() {
  return oneOfSuccessOrError({
    type: "object",
    properties: {
      ...commonEnvelopeProperties(),
      appliedFilters: { type: "object", additionalProperties: true },
      service: serviceRefSchema(),
      count: { type: "integer", const: 1 },
      source: {
        type: "string",
        enum: ["docs.openapi", "well-known", "apiReference", "registry"],
      },
      openapi: {
        type: "object",
        properties: {
          source: {
            type: "string",
            enum: ["docs.openapi", "well-known", "apiReference", "registry"],
          },
          url: { type: "string" },
          sourceUrl: { type: "string" },
          contentType: { type: "string" },
          bytes: { type: "integer", minimum: 0 },
          raw: { type: "boolean" },
          summary: { type: "boolean" },
          openapiVersion: { type: "string" },
          info: { type: "object", additionalProperties: true },
          "x-service-info": {
            additionalProperties: true,
          },
          paths: {
            type: "array",
            items: {
              type: "object",
              properties: {
                method: { type: "string" },
                path: { type: "string" },
                summary: { type: "string" },
                offers: {},
              },
              required: ["method", "path"],
              additionalProperties: true,
            },
          },
          document: { type: "object", additionalProperties: true },
          note: { type: "string" },
        },
        additionalProperties: true,
      },
    },
    required: [
      "advisory",
      "catalogVersion",
      "cacheStatus",
      "fetchedAt",
      "sourceUrl",
      "appliedFilters",
      "service",
      "count",
      "source",
      "openapi",
    ],
    additionalProperties: false,
  });
}

function commonEnvelopeProperties() {
  return {
    advisory: { type: "string", const: ADVISORY },
    catalogVersion: { type: "integer" },
    cacheStatus: { type: "string", enum: ["fresh", "stale", "refreshed"] },
    fetchedAt: { type: "string" },
    sourceUrl: { type: "string" },
  };
}

function serviceSummarySchema() {
  return {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      url: { type: "string" },
      categories: {
        type: "array",
        items: { type: "string", enum: CATEGORIES },
      },
      integration: { type: "string", enum: INTEGRATIONS },
      status: { type: "string", enum: STATUSES },
      description: { type: "string" },
    },
    required: ["id", "name", "url", "categories", "status"],
    additionalProperties: false,
  };
}

function serviceSchema() {
  return {
    type: "object",
    required: ["id", "name", "url", "methods", "endpoints"],
    additionalProperties: true,
  };
}

function serviceRefSchema() {
  return {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      url: { type: "string" },
      serviceUrl: { type: "string" },
    },
    required: ["id", "name", "url"],
    additionalProperties: false,
  };
}

function offerSchema() {
  return {
    type: "object",
    properties: {
      method: { type: "string" },
      path: { type: "string" },
      description: { type: "string" },
      docs: { type: "string" },
      payment: { type: "object", additionalProperties: true },
    },
    required: ["method", "path", "payment"],
    additionalProperties: false,
  };
}

function offerSearchResultSchema() {
  return {
    type: "object",
    properties: {
      ...offerSchema().properties,
      service: serviceSummarySchema(),
      price: {
        type: "object",
        properties: {
          amount: { type: "string" },
          currency: { type: "string" },
          decimals: { type: "integer", minimum: 0 },
          display: { type: "string" },
          unitType: { type: "string" },
          dynamic: { type: "boolean" },
          amountHint: { type: "string" },
        },
        required: ["dynamic"],
        additionalProperties: false,
      },
      matchedOn: {
        type: "array",
        items: { type: "string" },
      },
      rankingSignals: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
      "method",
      "path",
      "payment",
      "service",
      "price",
      "matchedOn",
      "rankingSignals",
    ],
    additionalProperties: false,
  };
}

function facetValuesSchema() {
  return {
    type: "array",
    items: {
      type: "object",
      properties: {
        value: {},
        count: { type: "integer", minimum: 0 },
      },
      required: ["value", "count"],
      additionalProperties: false,
    },
  };
}

function oneOfSuccessOrError(successSchema: Record<string, unknown>) {
  return {
    type: "object",
    oneOf: [
      successSchema,
      {
        type: "object",
        properties: {
          success: { type: "boolean", const: false },
          error: { type: "string" },
          advisory: { type: "string", const: ADVISORY },
        },
        required: ["success", "error", "advisory"],
        additionalProperties: false,
      },
    ],
  };
}

function toolResult(structuredContent: unknown, text: string) {
  return {
    content: [{ type: "text", text }],
    structuredContent,
  };
}

function toolError(message: string) {
  return {
    content: [{ type: "text", text: `${message}. ${ADVISORY}` }],
    structuredContent: { success: false, error: message, advisory: ADVISORY },
    isError: true,
  };
}

function searchArgs(args: Record<string, unknown>): SearchServicesArgs {
  const query = optionalString(args, "query");
  const method = optionalString(args, "method");
  const category = optionalEnumArg(args, "category", CATEGORIES);
  const integration = optionalEnumArg(args, "integration", INTEGRATIONS);
  const status = optionalEnumArg(args, "status", STATUSES);

  return {
    ...(query ? { query } : {}),
    ...(category ? { category } : {}),
    ...(method ? { method } : {}),
    ...(integration ? { integration } : {}),
    ...(status ? { status } : {}),
  };
}

function searchOfferArgs(args: Record<string, unknown>): SearchOffersArgs {
  const query = optionalString(args, "query");
  const method = optionalString(args, "method");
  const currency = optionalString(args, "currency");
  const maxAmount = optionalAmountString(args, "maxAmount");
  const unitType = optionalString(args, "unitType");
  const recipient = optionalString(args, "recipient");
  const dynamic = optionalBoolean(args, "dynamic");
  const category = optionalEnumArg(args, "category", CATEGORIES);
  const integration = optionalEnumArg(args, "integration", INTEGRATIONS);
  const status = optionalEnumArg(args, "status", STATUSES);

  return {
    ...(query ? { query } : {}),
    ...(category ? { category } : {}),
    ...(method ? { method } : {}),
    ...(currency ? { currency } : {}),
    ...(maxAmount ? { maxAmount } : {}),
    ...(unitType ? { unitType } : {}),
    ...(dynamic !== undefined ? { dynamic } : {}),
    ...(recipient ? { recipient } : {}),
    ...(integration ? { integration } : {}),
    ...(status ? { status } : {}),
  };
}

function recommendArgs(args: Record<string, unknown>) {
  const task = requiredString(args, "task");
  const constraints = optionalObjectArg(args, "constraints");
  const limit = integerArg(
    constraints,
    "limit",
    DEFAULT_RECOMMENDATION_LIMIT,
    1,
    MAX_RECOMMENDATION_LIMIT,
  );
  return {
    task,
    filters: searchOfferArgs(constraints),
    limit,
  };
}

function searchMethod(filters: SearchOffersArgs): string {
  if (filters.recipient) return "recipient";
  if (filters.query) return "text";
  if (Object.keys(filters).length > 0) return "filter";
  return "all";
}

function paginationArgs(args: Record<string, unknown>): Pagination {
  return {
    limit: integerArg(args, "limit", DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: integerArg(args, "offset", 0, 0),
  };
}

function optionalBoolean(
  args: Record<string, unknown>,
  key: string,
): boolean | undefined {
  if (!(key in args)) return undefined;
  const value = args[key];
  if (typeof value !== "boolean") throw new Error(`${key} must be a boolean`);
  return value;
}

function booleanArg(
  args: Record<string, unknown>,
  key: string,
  defaultValue: boolean,
): boolean {
  if (!(key in args)) return defaultValue;
  const value = args[key];
  if (typeof value !== "boolean") throw new Error(`${key} must be a boolean`);
  return value;
}

function optionalObjectArg(
  args: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  if (!(key in args)) return {};
  const value = args[key];
  if (!isRecord(value)) throw new Error(`${key} must be an object`);
  return value;
}

function optionalAmountString(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  if (!(key in args)) return undefined;
  const value = args[key];
  const parsed =
    typeof value === "string"
      ? value.trim()
      : typeof value === "number" && Number.isInteger(value) && value >= 0
        ? String(value)
        : "";
  if (!parsed || !/^\d+$/.test(parsed)) {
    throw new Error(`${key} must be a non-negative integer string`);
  }
  return parsed;
}

function paginate<T>(items: T[], pagination: Pagination): T[] {
  return items.slice(pagination.offset, pagination.offset + pagination.limit);
}

function cacheAgeSeconds(fetchedAt: string): number {
  const timestamp = Date.parse(fetchedAt);
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
}

function requireService(services: Service[], idOrName: string): Service {
  const service = findService(services, idOrName);
  if (!service) throw new Error(`Unknown service: ${idOrName}`);
  return service;
}

function serviceRef(service: Service) {
  return {
    id: service.id,
    name: service.name,
    url: service.url,
    ...(service.serviceUrl ? { serviceUrl: service.serviceUrl } : {}),
  };
}

function requiredString(args: Record<string, unknown>, key: string): string {
  const value = optionalString(args, key);
  if (!value) throw new Error(`${key} must be a non-empty string`);
  return value;
}

function optionalString(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = args[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalEnumArg<const T extends readonly string[]>(
  args: Record<string, unknown>,
  key: string,
  values: T,
): T[number] | undefined {
  if (!(key in args)) return undefined;
  const value = args[key];
  if (typeof value !== "string" || !values.includes(value)) {
    throw new Error(
      `Invalid ${key}: ${String(value)}. Allowed values: ${values.join(", ")}`,
    );
  }
  return value as T[number];
}

function integerArg(
  args: Record<string, unknown>,
  key: string,
  defaultValue: number,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (!(key in args)) return defaultValue;
  const value = args[key];
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    const range =
      maximum === Number.MAX_SAFE_INTEGER
        ? `at least ${minimum}`
        : `between ${minimum} and ${maximum}`;
    throw new Error(`${key} must be an integer ${range}`);
  }
  return parsed;
}

function objectArgs(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toolCallParams(value: unknown): ToolCallParams {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as ToolCallParams;
  }
  return {};
}

function asRequest(value: unknown): JsonRpcRequest | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  return value as JsonRpcRequest;
}

function jsonRpcResult(id: JsonRpcId, result: unknown): JsonRpcResponsePayload {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(
  id: JsonRpcId,
  code: number,
  message: string,
): JsonRpcResponsePayload {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { headers: jsonHeaders() });
}

function emptyAcceptedResponse(): Response {
  return new Response(null, { status: 202, headers: jsonHeaders() });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
