import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  MPP_REALM,
  mppProxyServices,
  type ServiceDef,
  services,
  TEMPO_PAYMENT,
  USDC,
} from "../schemas/services.ts";
import {
  buildCatalog,
  buildEndpointDocs,
  buildPayment,
  buildService,
  parseRoute,
  readAgentSkills,
  readMppProxySnapshot,
  validateServices,
} from "./generate-discovery.ts";

// --- parseRoute ---

describe("parseRoute", () => {
  it("parses a standard route", () => {
    expect(parseRoute("GET /v1/foo")).toEqual({
      method: "GET",
      path: "/v1/foo",
    });
  });

  it("handles all valid HTTP methods", () => {
    for (const m of [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS",
    ]) {
      expect(parseRoute(`${m} /path`).method).toBe(m);
    }
  });

  it("preserves path params and nested paths", () => {
    expect(parseRoute("GET /v0/inboxes/:inboxId/threads/:threadId")).toEqual({
      method: "GET",
      path: "/v0/inboxes/:inboxId/threads/:threadId",
    });
  });

  it("handles root path", () => {
    expect(parseRoute("POST /")).toEqual({ method: "POST", path: "/" });
  });

  it("throws on missing space", () => {
    expect(() => parseRoute("/v1/foo")).toThrow('expected "METHOD /path"');
  });

  it("throws on invalid HTTP method", () => {
    expect(() => parseRoute("FETCH /v1/foo")).toThrow("Invalid HTTP method");
  });

  it("throws on path not starting with /", () => {
    expect(() => parseRoute("GET v1/foo")).toThrow('must start with "/"');
  });
});

// --- buildPayment ---

/** Minimal service for testing buildPayment */
function paymentSvc(overrides: Partial<ServiceDef> = {}): ServiceDef {
  return {
    id: "test",
    name: "Test",
    url: "https://api.test.com",
    serviceUrl: `https://${MPP_REALM}/test`,
    description: "Test service",
    categories: ["ai"],
    integration: "first-party",
    tags: [],
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [{ route: "GET /foo", desc: "test" }],
    ...overrides,
  };
}

describe("buildService", () => {
  it("advertises MACH for Tempo proxies without changing their payment offers", () => {
    const service = buildService(
      paymentSvc({
        endpoints: [{ route: "GET /foo", desc: "test", amount: "100" }],
      }),
    );
    expect(service).toMatchObject({
      supportsMACH: true,
      methods: { tempo: { intents: ["charge"], assets: [USDC] } },
      endpoints: [{ payment: { amount: "100", currency: USDC } }],
    });
    expect(service).not.toHaveProperty("supportsCredits");
  });

  it("does not infer MACH support from an external service accepting Tempo", () => {
    expect(
      buildService(paymentSvc({ realm: "external.example" })),
    ).not.toHaveProperty("supportsMACH");
  });
});

describe("buildPayment", () => {
  it("returns null for free endpoints", () => {
    expect(
      buildPayment({ route: "GET /foo", desc: "free" }, paymentSvc()),
    ).toBeNull();
  });

  it("builds fixed-price payment", () => {
    const result = buildPayment(
      { route: "GET /foo", desc: "test", amount: "5000" },
      paymentSvc(),
    );
    expect(result).toEqual({
      intent: "charge",
      method: "tempo",
      amount: "5000",
      currency: USDC,
      decimals: 6,
      description: "test",
    });
  });

  it("builds dynamic payment", () => {
    const result = buildPayment(
      { route: "POST /bar", desc: "dynamic test", dynamic: true },
      paymentSvc({ intent: "session" }),
    );
    expect(result).toEqual({
      intent: "session",
      method: "tempo",
      dynamic: true,
      currency: USDC,
      decimals: 6,
      description: "dynamic test",
    });
  });

  it("uses endpoint-level intent override", () => {
    const result = buildPayment(
      {
        route: "POST /bar",
        desc: "override",
        amount: "100",
        intent: "session",
      },
      paymentSvc(),
    );
    expect(result?.intent).toBe("session");
  });

  it("includes unitType when specified", () => {
    const result = buildPayment(
      {
        route: "POST /bar",
        desc: "with unit",
        amount: "100",
        unitType: "request",
      },
      paymentSvc(),
    );
    expect(result?.unitType).toBe("request");
  });
});

// --- buildEndpointDocs ---

describe("buildEndpointDocs", () => {
  it("returns undefined when explicit is false", () => {
    expect(
      buildEndpointDocs("https://docs.example.com", "GET", "/foo", false),
    ).toBeUndefined();
  });

  it("returns explicit string when provided", () => {
    expect(
      buildEndpointDocs(
        "https://docs.example.com",
        "GET",
        "/foo",
        "https://custom.docs/page",
      ),
    ).toBe("https://custom.docs/page");
  });

  it("auto-generates URL from docsBase", () => {
    expect(
      buildEndpointDocs(
        "https://docs.example.com/llms.txt",
        "GET",
        "/v1/foo",
        undefined,
      ),
    ).toBe("https://docs.example.com/llms.txt?topic=GET%20%2Fv1%2Ffoo");
  });

  it("returns undefined when no docsBase and no explicit", () => {
    expect(
      buildEndpointDocs(undefined, "GET", "/foo", undefined),
    ).toBeUndefined();
  });

  it("encodes special characters in path", () => {
    const result = buildEndpointDocs(
      "https://docs.example.com",
      "GET",
      "/v0/inboxes/:id",
      undefined,
    );
    expect(result).toContain("topic=GET%20%2Fv0%2Finboxes%2F%3Aid");
  });
});

// --- validateServices ---

/** Minimal valid service for testing validateServices edge cases */
function svc(overrides: Partial<ServiceDef> = {}): ServiceDef {
  return {
    id: "test",
    name: "Test",
    url: "https://api.test.com",
    serviceUrl: `https://${MPP_REALM}/test`,
    description: "Test service",
    categories: ["ai"],
    integration: "first-party",
    tags: [],
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [{ route: "GET /foo", desc: "test" }],
    ...overrides,
  };
}

describe("validateServices", () => {
  it("accepts valid services", () => {
    expect(() => validateServices([svc()])).not.toThrow();
  });

  it("rejects duplicate service IDs", () => {
    expect(() =>
      validateServices([svc({ id: "a" }), svc({ id: "a" })]),
    ).toThrow("Duplicate service ID");
  });

  it("rejects invalid service ID pattern", () => {
    expect(() => validateServices([svc({ id: "BAD ID" })])).toThrow(
      "must match",
    );
  });

  it("rejects empty endpoints", () => {
    expect(() => validateServices([svc({ endpoints: [] })])).toThrow(
      "no endpoints",
    );
  });

  it("rejects duplicate routes within a service", () => {
    expect(() =>
      validateServices([
        svc({
          endpoints: [
            { route: "GET /foo", desc: "a" },
            { route: "GET /foo", desc: "b" },
          ],
        }),
      ]),
    ).toThrow("Duplicate endpoint route");
  });

  it("rejects malformed routes", () => {
    expect(() =>
      validateServices([
        svc({ endpoints: [{ route: "/no-method", desc: "bad" }] }),
      ]),
    ).toThrow('expected "METHOD /path"');
  });

  it("rejects amount + dynamic together", () => {
    expect(() =>
      validateServices([
        svc({
          endpoints: [
            {
              route: "POST /bar",
              desc: "both",
              amount: "100",
              dynamic: true,
            },
          ],
        }),
      ]),
    ).toThrow("both amount and dynamic");
  });

  it("rejects non-numeric amount", () => {
    expect(() =>
      validateServices([
        svc({
          endpoints: [{ route: "POST /bar", desc: "bad", amount: "12.50" }],
        }),
      ]),
    ).toThrow("must be a numeric string");
  });

  it("rejects non-https url", () => {
    expect(() =>
      validateServices([svc({ url: "http://insecure.com" })]),
    ).toThrow("must start with https://");
  });

  it("rejects non-https serviceUrl", () => {
    expect(() =>
      validateServices([svc({ serviceUrl: "http://insecure.com" })]),
    ).toThrow("must start with https://");
  });
});

// --- Service registry integrity (runs validateServices on real data) ---

describe("service registry integrity", () => {
  let allServices: ServiceDef[];

  beforeAll(async () => {
    const mod = await import("../schemas/services.ts");
    allServices = mod.services;
  });

  it("passes all validation rules", () => {
    expect(() => validateServices(allServices)).not.toThrow();
  });

  it.each([
    "aviationstack",
    "flightapi",
    "gemini",
    "googlemaps",
    "oxylabs",
    "serpapi",
    "spyfu",
  ])("does not publish the removed proxy service %s", (serviceId) => {
    expect(
      allServices.find((service) => service.id === serviceId),
    ).toBeUndefined();
  });

  it("includes the current Parallel API endpoints and pricing", () => {
    const parallel = allServices.find((service) => service.id === "parallel");

    expect(parallel?.endpoints).toEqual([
      {
        route: "POST /api/responses",
        desc: "Answer questions with web citations",
        dynamic: true,
        amountHint: "$0.01 – $0.25 depending on research effort",
        unitType: "request",
        docs: "https://parallelmpp.dev/#responses",
      },
      {
        healthCheck: {
          body: { mode: "one-shot", query: "Machine Payments Protocol" },
        },
        route: "POST /api/search",
        desc: "Search the web",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /api/extract",
        desc: "Extract page content",
        amount: "10000",
        unitType: "url",
      },
      {
        route: "POST /api/task",
        desc: "Multi-hop web research task - price varies by processor",
        dynamic: true,
        amountHint: "$0.10 – $0.30",
      },
      {
        route: "GET /api/task/:runId",
        desc: "Poll a research task for results",
      },
    ]);
  });
});

// --- MPP proxy services ---

describe("buildCatalog", () => {
  const snapshot = readMppProxySnapshot() as {
    services: Array<{
      id: string;
      manifest: { endpoints: Array<{ method: string; path: string }> };
    }>;
  };
  const catalog = buildCatalog(services, mppProxyServices, snapshot);
  const byId = new Map(catalog.map((service) => [service.id, service]));

  it("publishes every service in the MPP proxy snapshot with its endpoints", () => {
    for (const entry of snapshot.services) {
      const service = byId.get(entry.id);
      expect(service?.serviceUrl).toBe(`https://${entry.id}.${MPP_REALM}`);
      expect(
        (service?.endpoints as Array<{ method: string; path: string }>).map(
          ({ method, path }) => `${method} ${path}`,
        ),
      ).toEqual(
        entry.manifest.endpoints.map(({ method, path }) => `${method} ${path}`),
      );
    }
    expect(catalog).toHaveLength(services.length + snapshot.services.length);
  });

  it("keeps catalog metadata the manifest lacks", () => {
    expect(byId.get("anthropic")).toMatchObject({
      url: "https://api.anthropic.com",
      integration: "third-party",
      docs: {
        apiReference: "https://docs.anthropic.com/en/api",
        llmsTxt: "https://docs.anthropic.com/llms.txt",
      },
      provider: { name: "Anthropic", url: "https://anthropic.com" },
    });
    expect(byId.get("rpc")).toMatchObject({ integration: "first-party" });
  });

  it("rejects proxy services listed with endpoints in services.ts", () => {
    const proxied = {
      ...services[0]!,
      id: "proxied",
      serviceUrl: `https://proxied.${MPP_REALM}`,
    };
    expect(() => buildCatalog([proxied], [], snapshot)).toThrow(
      "served by the MPP proxy",
    );
  });

  it("rejects metadata for a service the proxy no longer serves", () => {
    expect(() =>
      buildCatalog([], [{ ...mppProxyServices[0]!, id: "retired" }], snapshot),
    ).toThrow('lists "retired"');
  });

  it("rejects a services.ts ID that the proxy also uses", () => {
    expect(() =>
      buildCatalog([{ ...services[0]!, id: "openai" }], [], snapshot),
    ).toThrow('"openai" is used by both');
  });
});

// --- agent skills ---

describe("agent skills", () => {
  const publicDir = resolve(import.meta.dirname, "../public");
  const skills = readAgentSkills();
  const index = JSON.parse(
    readFileSync(
      resolve(publicDir, ".well-known/agent-skills/index.json"),
      "utf-8",
    ),
  ) as { skills: Array<{ name: string; url: string; digest: string }> };

  it("publishes every skill in skills/", () => {
    expect(skills.map((skill) => skill.name)).toContain("mppx");
    expect(index.skills.map((skill) => skill.name)).toEqual(
      skills.map((skill) => skill.name),
    );
  });

  it.each(skills)("serves skills/$name/SKILL.md unchanged", ({ name }) => {
    const canonical = readFileSync(
      resolve(import.meta.dirname, `../skills/${name}/SKILL.md`),
    );
    const served = readFileSync(
      resolve(publicDir, `.well-known/agent-skills/${name}/SKILL.md`),
    );
    expect(served.equals(canonical)).toBe(true);
  });

  it.each(skills)("indexes $name with the sha256 of the served bytes", ({
    name,
  }) => {
    const url = `/.well-known/agent-skills/${name}/SKILL.md`;
    const served = readFileSync(resolve(publicDir, `.${url}`));
    expect(index.skills.find((skill) => skill.name === name)).toMatchObject({
      url,
      digest: `sha256:${createHash("sha256").update(served).digest("hex")}`,
    });
  });
});
