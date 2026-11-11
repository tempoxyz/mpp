// MPP Discovery Playground (mpp.dev/playground/discovery): five small paid APIs, each publishing
// an OpenAPI discovery document with x-payment-info, and a registry that lists them.
//
//   GET  /api/registry                 The services this registry knows, by base URL.
//   GET  /api/<service>/openapi.json   The service's discovery document: its paid operation,
//                                      request schema and payment offers.
//   POST /api/<service>/<path>         The paid operation: 400 for a body that doesn't match the
//                                      schema (before any charge), 402 with a charge Challenge,
//                                      and with a Credential, the result and a Receipt.
import { generate } from "mppx/discovery";

import * as Charge from "../shared/charge-server.js";
import { handlers } from "./handlers.js";
import { invalid, type Service, services } from "./services.js";

type Env = Charge.Env;

let app: ReturnType<typeof Charge.create> | undefined;
const documents = new Map<string, Record<string, unknown>>();

/** The path mpp.dev serves the playground under. */
const base = "/playground/discovery";

/** A service's base URL, as the registry lists it and its document's servers name it. */
const serviceUrl = (service: Service) => `${base}/api/${service.slug}`;

/** The paid handler for a service's one operation: its price and what it's for. */
function pay(mppx: ReturnType<typeof Charge.create>["mppx"], service: Service) {
  return mppx.charge({ amount: service.price, description: service.operation });
}

/** The service's discovery document, generated from the same handler that charges. */
function document(service: Service) {
  const cached = documents.get(service.slug);
  if (cached) return cached;
  const mppx = app!.mppx;
  const doc = generate(mppx, {
    info: { title: service.title, version: "1.0.0" },
    routes: [
      {
        handler: pay(mppx, service),
        method: "post",
        path: service.path,
        requestBody: {
          content: { "application/json": { schema: service.request } },
          required: true,
        },
        summary: service.operation,
      },
    ],
    serviceInfo: {
      categories: [...service.categories],
      docs: { homepage: "https://mpp.dev/playground/discovery" },
    },
  });
  // Where the paths live, and what a successful call returns.
  const operation = (doc.paths as Record<string, Record<string, any>>)[
    service.path
  ]!.post;
  operation.responses["200"] =
    service.response.contentType === "image/svg+xml"
      ? {
          content: { "image/svg+xml": { schema: { type: "string" } } },
          description: "Successful response",
        }
      : {
          content: { "application/json": { schema: service.response.schema } },
          description: "Successful response",
        };
  operation.responses["400"] = {
    description: "The body doesn't match the schema",
  };
  // What a reader looks for first: the price, then the request it pays for.
  const {
    requestBody,
    responses,
    summary,
    "x-payment-info": offers,
  } = operation;
  (doc.paths as Record<string, Record<string, unknown>>)[service.path]!.post = {
    summary,
    description: service.summary,
    "x-payment-info": offers,
    requestBody,
    responses,
  };
  const ordered = {
    openapi: doc.openapi,
    info: doc.info,
    "x-service-info": doc["x-service-info"],
    servers: [{ url: serviceUrl(service) }],
    paths: doc.paths,
  };
  documents.set(service.slug, ordered);
  return ordered;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === base)
      return Response.redirect(new URL(`${base}/`, url), 302);
    if (!url.pathname.startsWith(`${base}/`))
      return new Response("Not found", { status: 404 });
    const path = url.pathname.slice(base.length);
    app ??= Charge.create(env, "discovery");

    if (path === "/api/health") return Response.json({ status: "ok" });

    if (path === "/api/registry")
      return Response.json({
        services: services.map((service) => ({
          slug: service.slug,
          url: serviceUrl(service),
        })),
      });

    const service = services.find((s) => path.startsWith(`/api/${s.slug}/`));
    if (!service) return new Response("Not found", { status: 404 });
    const rest = path.slice(`/api/${service.slug}`.length);

    if (rest === "/openapi.json" && request.method === "GET")
      return Response.json(document(service), {
        headers: { "access-control-allow-origin": "*" },
      });

    if (rest === service.path && request.method === "POST") {
      // Checked before the 402, so a bad request is never charged.
      const body = await request
        .clone()
        .json()
        .catch(() => undefined);
      const problem = invalid(service.request, body);
      if (problem) return Response.json({ error: problem }, { status: 400 });

      const result = await pay(app.mppx, service)(request);
      if (result.status === 402) return result.challenge;

      const output = handlers[service.slug]!(body as Record<string, unknown>);
      return result.withReceipt(
        typeof output === "string"
          ? new Response(output, {
              headers: { "content-type": "image/svg+xml" },
            })
          : Response.json(output),
      );
    }

    return new Response("Not found", { status: 404 });
  },
};
