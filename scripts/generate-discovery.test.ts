import { beforeAll, describe, expect, it } from "vitest";
import {
  MPP_REALM,
  type ServiceDef,
  TEMPO_PAYMENT,
  TEMPO_RECIPIENT,
  USDC,
} from "../schemas/services.ts";
import {
  buildEndpointDocs,
  buildPayment,
  parseRoute,
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
    payment: TEMPO_PAYMENT,
    endpoints: [{ route: "GET /foo", desc: "test" }],
    ...overrides,
  };
}

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
      recipient: TEMPO_RECIPIENT,
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
      recipient: TEMPO_RECIPIENT,
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
    payment: TEMPO_PAYMENT,
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
});
