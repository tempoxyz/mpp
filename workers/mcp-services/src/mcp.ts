import { getCatalog } from "./cache.js";
import {
  findService,
  listServiceSummaries,
  offersForService,
  registryOpenApiView,
  type SearchServicesArgs,
  searchServices,
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
  "Call list_services for a catalog overview, search_services to filter by query/category/payment method/integration/status, get_service for a full service record, get_offers for endpoint payment offers, and get_openapi for a service OpenAPI document or registry-derived endpoint view.",
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

function paginationArgs(args: Record<string, unknown>): Pagination {
  return {
    limit: integerArg(args, "limit", DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: integerArg(args, "offset", 0, 0),
  };
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

function paginate<T>(items: T[], pagination: Pagination): T[] {
  return items.slice(pagination.offset, pagination.offset + pagination.limit);
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
