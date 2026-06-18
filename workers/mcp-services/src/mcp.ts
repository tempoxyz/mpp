import { getCatalog } from "./cache.js";
import {
  countPaymentOffers,
  findService,
  getFacets,
  listServiceSummaries,
  offersForService,
  registryOpenApiView,
  type SearchOffersArgs,
  type SearchServicesArgs,
  searchOffers,
  searchServices,
  servicesByRecipient,
} from "./discovery.js";
import { CATEGORIES, INTEGRATIONS, type Service, STATUSES } from "./types.js";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_VERSION = "1.0.0";
const ADVISORY =
  "Discovery is advisory; the runtime 402 Challenge is authoritative.";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const OPENAPI_FETCH_TIMEOUT_MS = 3000;
const MAX_OPENAPI_RAW_BYTES = 256 * 1024;
const MAX_OPENAPI_FETCH_BYTES = 1024 * 1024;
const MAX_OPENAPI_REDIRECTS = 3;
const CODEMODE_HELPER = `type MppService = {
  id: string;
  name: string;
  url: string;
  categories?: string[];
  integration?: string;
  status?: string;
  endpoints: Array<{
    method: string;
    path: string;
    description?: string;
    payment?: {
      intent: string;
      method: string;
      amount?: string;
      currency?: string;
      decimals?: number;
      recipient?: string;
      unitType?: string;
      dynamic?: true;
      amountHint?: string;
    } | null;
  }>;
};

type ServicesResponse = { version: number; services: MppService[] };

const MPP_SERVICES_URL = "https://mpp.dev/api/services";

export async function fetchMppServices(): Promise<ServicesResponse> {
  const response = await fetch(MPP_SERVICES_URL, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("MPP catalog fetch failed: " + response.status);
  }
  return response.json() as Promise<ServicesResponse>;
}

export function findPaidOffers(
  catalog: ServicesResponse,
  filters: {
    query?: string;
    category?: string;
    method?: string;
    currency?: string;
    maxAmount?: bigint;
    recipient?: string;
  } = {},
) {
  const query = filters.query?.toLowerCase();
  return catalog.services.flatMap((service) =>
    service.endpoints
      .filter((endpoint) => endpoint.payment)
      .map((endpoint) => ({ service, endpoint, payment: endpoint.payment! }))
      .filter(({ service, endpoint, payment }) => {
        if (filters.category && !service.categories?.includes(filters.category)) return false;
        if (filters.method && payment.method !== filters.method) return false;
        if (filters.currency && payment.currency !== filters.currency) return false;
        if (filters.recipient && payment.recipient !== filters.recipient) return false;
        if (filters.maxAmount !== undefined) {
          if (payment.dynamic || !payment.amount) return false;
          if (BigInt(payment.amount) > filters.maxAmount) return false;
        }
        if (!query) return true;
        return [
          service.id,
          service.name,
          service.url,
          endpoint.method,
          endpoint.path,
          endpoint.description,
          payment.description,
          payment.unitType,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      }),
  );
}

// Discovery is advisory. Before paying, call the target endpoint and treat its
// runtime 402 Challenge as the authoritative payment terms.`;
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

const INITIALIZE_INSTRUCTIONS = [
  "Use this read-only MCP server to discover MPP paid API services and payment terms from https://mpp.dev/api/services.",
  "Call list_services for a catalog overview, search_services to filter providers, search_offers to find payable endpoints, get_facets to inspect valid filters, get_services_by_recipient to map a payment recipient to services, get_catalog_status to inspect freshness, get_service for a full service record, get_offers for endpoint payment offers, and get_openapi for a service OpenAPI document or registry-derived endpoint view.",
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
  env: Env,
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
    documentationUrl: "https://mpp.dev/advanced/discovery",
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
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
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
  env: Env,
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
  env: Env,
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

    if (name === "get_codemode") {
      return toolResult(
        {
          ...meta,
          language: "typescript",
          catalogEndpoint: "https://mpp.dev/api/services",
          module: CODEMODE_HELPER,
          usage: [
            "const catalog = await fetchMppServices()",
            "const offers = findPaidOffers(catalog, { query: 'email', method: 'tempo' })",
          ],
        },
        `Returned TypeScript Code Mode helper for the MPP services catalog. ${ADVISORY}`,
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
        "Return endpoint payment offers for a service, optionally filtered by route substring." +
        advisory,
      inputSchema: {
        type: "object",
        properties: {
          service: { type: "string", description: "Service id or name." },
          route: {
            type: "string",
            description: "Optional route substring such as POST /v1/messages.",
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
    {
      name: "get_codemode",
      description:
        "Return a compact TypeScript helper module for Code Mode agents to fetch and filter the MPP services catalog programmatically." +
        advisory,
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      outputSchema: codemodeOutputSchema(),
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

function codemodeOutputSchema() {
  return oneOfSuccessOrError({
    type: "object",
    properties: {
      ...commonEnvelopeProperties(),
      language: { type: "string", const: "typescript" },
      catalogEndpoint: { type: "string" },
      module: { type: "string" },
      usage: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
      "advisory",
      "catalogVersion",
      "cacheStatus",
      "fetchedAt",
      "sourceUrl",
      "language",
      "catalogEndpoint",
      "module",
      "usage",
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
