/**
 * Generates schemas/discovery.json (full) and schemas/discovery.example.json (slim)
 * from schemas/services.ts.
 *
 * Usage: node scripts/generate-discovery.ts
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  type EndpointDef,
  HTTP_METHODS,
  type HttpMethod,
  type ServiceDef,
  services,
} from "../schemas/services.ts";

const SCHEMAS_DIR = resolve(import.meta.dirname, "../schemas");
const OUTPUT_FULL = resolve(SCHEMAS_DIR, "discovery.json");
const OUTPUT_EXAMPLE = resolve(SCHEMAS_DIR, "discovery.example.json");

/** Services included in the slim example (covers fixed, dynamic, free, and mixed intents) */
const EXAMPLE_IDS = new Set(["exa", "openrouter", "storage"]);

const SERVICE_ID_RE = /^[a-z0-9-]+$/;
const NUMERIC_RE = /^\d+$/;

const VALID_METHODS: ReadonlySet<string> = new Set<string>(HTTP_METHODS);

export function parseRoute(route: string): {
  method: HttpMethod;
  path: string;
} {
  const spaceIdx = route.indexOf(" ");
  if (spaceIdx === -1) {
    throw new Error(`Invalid route "${route}": expected "METHOD /path"`);
  }
  const method = route.slice(0, spaceIdx);
  const path = route.slice(spaceIdx + 1);
  if (!VALID_METHODS.has(method)) {
    throw new Error(
      `Invalid HTTP method "${method}" in route "${route}". Valid: ${HTTP_METHODS.join(", ")}`,
    );
  }
  if (!path.startsWith("/")) {
    throw new Error(
      `Invalid path "${path}" in route "${route}": must start with "/"`,
    );
  }
  return { method: method as HttpMethod, path };
}

export function buildEndpointDocs(
  docsBase: string | undefined,
  method: string,
  path: string,
  explicit: string | false | undefined,
): string | undefined {
  if (explicit === false) return undefined;
  if (typeof explicit === "string") return explicit;
  if (!docsBase) return undefined;
  return `${docsBase}?topic=${encodeURIComponent(`${method} ${path}`)}`;
}

// Return types are Record<string, unknown> (not typed interfaces) because the
// output is immediately serialized to JSON. The JSON schema is the contract;
// adding mirror interfaces here would be redundant maintenance.
export function buildPayment(
  ep: EndpointDef,
  svc: ServiceDef,
): Record<string, unknown> | null {
  if (!ep.amount && !ep.dynamic) return null;

  const base: Record<string, unknown> = {
    intent: ep.intent ?? svc.intent,
    method: svc.payment.method,
    currency: svc.payment.currency,
    decimals: svc.payment.decimals,
    recipient: svc.payment.recipient,
    description: ep.desc,
  };

  if (ep.dynamic) {
    return { ...base, dynamic: true };
  }

  const payment: Record<string, unknown> = { ...base, amount: ep.amount };
  if (ep.unitType) payment.unitType = ep.unitType;
  return payment;
}

export function validateServices(svcs: ServiceDef[]): void {
  const seenIds = new Set<string>();
  for (const svc of svcs) {
    // Unique service IDs
    if (seenIds.has(svc.id)) {
      throw new Error(`Duplicate service ID: "${svc.id}"`);
    }
    seenIds.add(svc.id);

    // ID must match schema pattern (lowercase alphanumeric + hyphens)
    if (!SERVICE_ID_RE.test(svc.id)) {
      throw new Error(
        `Invalid service ID "${svc.id}": must match ${SERVICE_ID_RE}`,
      );
    }

    // Must have at least one endpoint
    if (svc.endpoints.length === 0) {
      throw new Error(`Service "${svc.id}" has no endpoints`);
    }

    // Validate each endpoint
    const seenRoutes = new Set<string>();
    for (const ep of svc.endpoints) {
      // Unique routes within a service
      if (seenRoutes.has(ep.route)) {
        throw new Error(
          `Duplicate endpoint route "${ep.route}" in service "${svc.id}"`,
        );
      }
      seenRoutes.add(ep.route);

      // Route must parse cleanly (valid method + path)
      parseRoute(ep.route);

      // amount and dynamic are mutually exclusive
      if (ep.amount && ep.dynamic) {
        throw new Error(
          `Endpoint "${ep.route}" in service "${svc.id}" has both amount and dynamic`,
        );
      }

      // amount must be a numeric string (base units)
      if (ep.amount !== undefined && !NUMERIC_RE.test(ep.amount)) {
        throw new Error(
          `Invalid amount "${ep.amount}" for "${ep.route}" in service "${svc.id}": must be a numeric string`,
        );
      }
    }

    // url must look like a URL
    if (!svc.url.startsWith("https://")) {
      throw new Error(`Service "${svc.id}" url must start with https://`);
    }

    // serviceUrl must look like a URL
    if (!svc.serviceUrl.startsWith("https://")) {
      throw new Error(
        `Service "${svc.id}" serviceUrl must start with https://`,
      );
    }
  }
}

export function buildService(svc: ServiceDef): Record<string, unknown> {
  // Collect intents from paid endpoints
  const intents = new Set<string>();
  for (const ep of svc.endpoints) {
    if (ep.amount || ep.dynamic) {
      intents.add(ep.intent ?? svc.intent);
    }
  }
  if (intents.size === 0) intents.add(svc.intent);

  const entry: Record<string, unknown> = {
    id: svc.id,
    name: svc.name,
    url: svc.url,
    serviceUrl: svc.serviceUrl,
    description: svc.description,
  };
  if (svc.icon) entry.icon = svc.icon;
  entry.categories = svc.categories;
  entry.integration = svc.integration;
  entry.tags = svc.tags;
  entry.status = svc.status ?? "active";
  if (svc.docs) entry.docs = svc.docs;
  entry.methods = {
    [svc.payment.method]: {
      intents: [...intents].sort(),
      assets: [svc.payment.currency],
    },
  };
  entry.realm = svc.realm;
  if (svc.provider) entry.provider = svc.provider;

  entry.endpoints = svc.endpoints.map((ep) => {
    const { method, path: routePath } = parseRoute(ep.route);

    const endpoint: Record<string, unknown> = {
      method,
      path: routePath,
      description: ep.desc,
      payment: buildPayment(ep, svc),
    };

    const docs = buildEndpointDocs(svc.docsBase, method, routePath, ep.docs);
    if (docs) endpoint.docs = docs;

    return endpoint;
  });

  return entry;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function generate(): void {
  validateServices(services);

  const allBuilt = services.map(buildService);

  // Full registry (checked in, used by API)
  writeJson(OUTPUT_FULL, { version: 1, services: allBuilt });

  // Slim example (checked in, used by schema tests)
  const exampleServices = allBuilt.filter((s) =>
    EXAMPLE_IDS.has(s.id as string),
  );
  writeJson(OUTPUT_EXAMPLE, { version: 1, services: exampleServices });

  // Summary
  let totalEps = 0;
  let paidEps = 0;
  let dynamicEps = 0;
  let freeEps = 0;
  for (const svc of services) {
    for (const ep of svc.endpoints) {
      totalEps++;
      if (!ep.amount && !ep.dynamic) freeEps++;
      else if (ep.dynamic) dynamicEps++;
      else paidEps++;
    }
  }
  console.log(
    `Generated ${OUTPUT_FULL} (${services.length} services, ${totalEps} endpoints)`,
  );
  console.log(
    `Generated ${OUTPUT_EXAMPLE} (${exampleServices.length} services)`,
  );
  console.log(`  ${paidEps} paid, ${dynamicEps} dynamic, ${freeEps} free`);
}

generate();
