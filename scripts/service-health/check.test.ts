import { Challenge } from "mppx";
import { describe, expect, it, vi } from "vitest";
import { type ServiceDef, services } from "../../schemas/services.ts";
import { checkServices, type HealthCheck } from "./check.ts";
import {
  checkMpp,
  checkUrls,
  classifyMpp,
  classifyUrl,
  endpointUrl,
  type MppProbe,
  mppProbes,
  serviceUrls,
} from "./checks.ts";
import { checkProbe, type Result } from "./http.ts";
import { type Issue, syncIssue } from "./issues.ts";
import { renderReport, summarizeServices } from "./report.ts";

const service: ServiceDef = {
  categories: [],
  description: "Example",
  endpoints: [],
  id: "example",
  integration: "third-party",
  intent: "charge",
  name: "Example",
  payments: [{ currency: "usd", decimals: 2, method: "tempo" }],
  realm: "example.com",
  serviceUrl: "https://example.com/proxy",
  tags: [],
  url: "https://example.com",
};
const probe: MppProbe = {
  method: "GET",
  payment: { intent: "charge", methods: ["tempo"] },
  service: "example",
  target: "GET /search",
  url: "https://example.com/search",
};
const header = (method = "tempo", intent = "charge") =>
  Challenge.serialize({
    id: "test",
    intent,
    method,
    realm: "example.com",
    request: { amount: "1", currency: "usd" },
  });
const result: Result = {
  attempts: 2,
  outcome: "fail",
  reason: "Endpoint unavailable",
  service: "example",
  status: 404,
  target: "GET /search",
  url: probe.url,
};

describe("planning", () => {
  it("plans the complete catalog without making requests", () => {
    expect(services.flatMap(mppProbes)).toHaveLength(
      services.reduce((count, item) => count + item.endpoints.length, 0),
    );
  });
  it("preserves proxy prefixes and query parameters", () => {
    expect(endpointUrl(service.serviceUrl, "/search?q=mpp")).toBe(
      "https://example.com/proxy/search?q=mpp",
    );
  });
  it.each([
    "//evil.com",
    "/../escape",
    "/%2e%2e/escape",
    "/\\evil.com",
    "https://evil.com",
  ])("rejects escaping paths: %s", (path) => {
    expect(() => endpointUrl(service.serviceUrl, path)).toThrow();
  });
  it("deduplicates links, skips unsafe requests and accepts explicit fixtures", () => {
    const fixture: ServiceDef = {
      ...service,
      docs: { homepage: service.url },
      endpoints: [
        { route: "GET /search", desc: "Search", amount: "1" },
        { route: "GET /free", desc: "Free", amount: "0" },
        { route: "GET /item/:id", desc: "Item" },
        { route: "POST /search", desc: "Search", dynamic: true },
        { route: "DELETE /item/1", desc: "Delete", healthCheck: {} },
        {
          route: "POST /query",
          desc: "Query",
          healthCheck: { body: { query: "mpp" } },
        },
        {
          route: "GET /item/{id}",
          desc: "Item",
          healthCheck: { path: "/item/fixture" },
        },
      ],
    };
    const planned = mppProbes(fixture);
    expect(serviceUrls(fixture)).toHaveLength(2);
    expect(planned.map((item) => Boolean(item.skip))).toEqual([
      false,
      false,
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(planned[0].payment?.intent).toBe("charge");
    expect(planned[1].payment).toBeUndefined();
    expect(planned[5].body).toBe('{"query":"mpp"}');
    expect(planned[6].url).toBe("https://example.com/proxy/item/fixture");
  });
  it.each([
    "deprecated",
    "maintenance",
  ] as const)("skips inactive services: %s", (status) => {
    expect(
      mppProbes({
        ...service,
        status,
        endpoints: [{ route: "GET /", desc: "Root" }],
      }).every((item) => item.skip),
    ).toBe(true);
  });
});

describe("probe exclusions", () => {
  it("excludes side-effectful GET routes even when their paths are concrete", () => {
    const planned = mppProbes({
      ...service,
      endpoints: [
        { route: "GET /purchase", desc: "Purchase", healthCheck: false },
      ],
    });
    expect(planned[0].skip).toBe(
      "Endpoint explicitly excluded from health probes",
    );
  });
  it("excludes the catalog's card, payout, and purchase routes", () => {
    for (const id of ["laso-finance", "prospect-butcher"]) {
      const entry = services.find((service) => service.id === id)!;
      expect(mppProbes(entry).filter((probe) => !probe.skip)).toEqual([]);
    }
  });
});

describe("classification", () => {
  it.each([
    { request: {} },
    { request: { amount: "1", currency: "usd" }, expires: "invalid" },
    { request: { amount: "-1", currency: "usd" } },
    { request: { amount: "1", currency: "" } },
    {
      request: { amount: "1", currency: "usd" },
      expires: "2000-01-01T00:00:00.000Z",
    },
  ])("rejects expired or incomplete charge offers %#", (overrides) => {
    const challenge = Challenge.serialize({
      id: "test",
      intent: "charge",
      method: "tempo",
      realm: "example.com",
      ...overrides,
    });
    expect(
      classifyMpp(
        probe,
        new Response(null, {
          status: 402,
          headers: { "WWW-Authenticate": challenge },
        }),
      ).outcome,
    ).toBe("fail");
  });
  it("accepts a usable offer when another matching offer has expired", () => {
    const expired = Challenge.serialize({
      id: "old",
      intent: "charge",
      method: "tempo",
      realm: "example.com",
      request: { amount: "1", currency: "usd" },
      expires: "2000-01-01T00:00:00.000Z",
    });
    expect(
      classifyMpp(
        probe,
        new Response(null, {
          status: 402,
          headers: { "WWW-Authenticate": `${expired}, ${header()}` },
        }),
      ).outcome,
    ).toBe("pass");
  });
  it.each([
    [404, "fail"],
    [410, "fail"],
    [503, "inconclusive"],
    [400, "inconclusive"],
    [401, "inconclusive"],
    [403, "inconclusive"],
    [405, "inconclusive"],
    [422, "inconclusive"],
    [429, "inconclusive"],
    [301, "inconclusive"],
    [200, "inconclusive"],
  ])("classifies paid endpoint HTTP %i as %s", (status, outcome) => {
    expect(
      classifyMpp(probe, new Response(null, { status: Number(status) }))
        .outcome,
    ).toBe(outcome);
  });
  it("accepts a matching offer among multiple Challenges", () => {
    expect(
      classifyMpp(
        probe,
        new Response(null, {
          status: 402,
          headers: { "WWW-Authenticate": `${header("stripe")}, ${header()}` },
        }),
      ).outcome,
    ).toBe("pass");
  });
  it.each([
    undefined,
    "Payment broken",
    "Bearer realm=example",
    header("stripe"),
    header("tempo", "session"),
  ])("rejects missing, malformed or mismatched Challenges", (value) => {
    expect(
      classifyMpp(
        probe,
        new Response(null, {
          status: 402,
          headers: value ? { "WWW-Authenticate": value } : {},
        }),
      ).outcome,
    ).toBe("fail");
  });
  it("distinguishes link failures and free endpoint success", () => {
    expect(
      classifyMpp({ ...probe, payment: undefined }, new Response()).outcome,
    ).toBe("pass");
    expect(classifyUrl(new Response(null, { status: 404 })).reason).toContain(
      "does not establish endpoint health",
    );
    expect(classifyUrl(new Response(null, { status: 402 })).outcome).toBe(
      "inconclusive",
    );
  });
});

describe("execution", () => {
  it("propagates evaluator bugs and still cleans up the response", async () => {
    const cancel = vi.fn();
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(new ReadableStream({ cancel })));
    await expect(
      checkProbe(
        probe,
        () => {
          throw new Error("Broken evaluator");
        },
        { fetch: request },
      ),
    ).rejects.toThrow("Broken evaluator");
    expect(cancel).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledOnce();
  });
  it("does not retry server errors, cancels bodies and never pays", async () => {
    const cancel = vi.fn();
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(new ReadableStream({ cancel }), { status: 503 }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 402,
          headers: { "WWW-Authenticate": header() },
        }),
      );
    expect(
      await checkProbe(probe, (response) => classifyMpp(probe, response), {
        fetch: request,
      }),
    ).toMatchObject({
      attempts: 1,
      outcome: "inconclusive",
    });
    expect(cancel).toHaveBeenCalledOnce();
    expect(request.mock.calls[0][1]).toMatchObject({
      method: "GET",
      redirect: "manual",
    });
    expect(
      new Headers(request.mock.calls[0][1]?.headers).has("Authorization"),
    ).toBe(false);
  });
  it("makes one network attempt and excludes raw errors", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("secret"));
    const actual = await checkProbe(
      probe,
      (response) => classifyMpp(probe, response),
      { fetch: request },
    );
    expect(actual).toMatchObject({ attempts: 1, outcome: "inconclusive" });
    expect(JSON.stringify(actual)).not.toContain("secret");
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("aborts requests at the configured timeout", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockImplementation(
        async (_url, init) =>
          new Promise((_resolve, reject) =>
            init?.signal?.addEventListener("abort", () =>
              reject(new Error("timeout")),
            ),
          ),
      );
    expect(
      await checkProbe(probe, (response) => classifyMpp(probe, response), {
        fetch: request,
        timeoutMs: 5,
      }),
    ).toMatchObject({ attempts: 1, outcome: "inconclusive" });
  });
  it("does not request skipped endpoints", async () => {
    const request = vi.fn<typeof fetch>();
    expect(
      await checkProbe({ ...probe, skip: "Needs fixture" }, classifyUrl, {
        fetch: request,
      }),
    ).toMatchObject({ attempts: 0, outcome: "skipped" });
    expect(request).not.toHaveBeenCalled();
  });
  it("limits parallel requests to four and returns deterministic ordering", async () => {
    let active = 0;
    let max = 0;
    const request = vi.fn<typeof fetch>().mockImplementation(async () => {
      max = Math.max(max, ++active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
      return new Response();
    });
    const results = await checkServices(
      Array.from({ length: 6 }, (_, i) => ({ ...service, id: String(6 - i) })),
      [checkUrls, checkMpp],
      { fetch: request },
    );
    expect(max).toBeLessThanOrEqual(4);
    expect(max).toBeGreaterThan(0);
    expect(results).toHaveLength(12);
    expect(results[0].service).toBe("1");
  });
});

describe("reporting", () => {
  it("does not count link checks as endpoint coverage", () => {
    const results: Result[] = [
      { ...result, service: "link-only", target: "link", outcome: "pass" },
      { ...result, service: "skipped-only", outcome: "skipped", attempts: 0 },
      { ...result, service: "blocked", outcome: "inconclusive" },
      { ...result, service: "verified", outcome: "pass" },
    ];
    expect(summarizeServices(results)).toEqual([
      {
        service: "link-only",
        endpoints: 0,
        attempted: 0,
        passed: 0,
        failed: 0,
        inconclusive: 0,
        skipped: 0,
      },
      {
        service: "skipped-only",
        endpoints: 1,
        attempted: 0,
        passed: 0,
        failed: 0,
        inconclusive: 0,
        skipped: 1,
      },
      {
        service: "blocked",
        endpoints: 1,
        attempted: 1,
        passed: 0,
        failed: 0,
        inconclusive: 1,
        skipped: 0,
      },
      {
        service: "verified",
        endpoints: 1,
        attempted: 1,
        passed: 1,
        failed: 0,
        inconclusive: 0,
        skipped: 0,
      },
    ]);
    const report = renderReport(results, "today", "run");
    expect(report).toContain(
      "2/4 services have an attempted endpoint probe; 1/4 have at least one passing endpoint probe",
    );
    expect(report).toContain(
      "2 services have no attempted endpoint probes: link-only, skipped-only.",
    );
  });

  it("renders findings as a bounded Markdown table with escaped cells", () => {
    const body = renderReport(
      [
        {
          ...result,
          service: "provider|name",
          target: "GET /a\n|b",
          reason: "@team <tag> `text`",
        },
      ],
      "today",
      "run",
    );
    expect(body).toContain(
      "| Service | Endpoint or link | HTTP | Finding | URL |",
    );
    expect(body).toContain("| provider&#124;name | GET /a&#124;b |");
    expect(body).toContain("＠team tag text");
    expect(body).not.toContain("@team");
    expect(
      body.split("\n").filter((line) => line.startsWith("|")),
    ).toHaveLength(3);
  });

  it("bounds reports and puts failures before gaps", () => {
    const results: Result[] = Array.from({ length: 200 }, () => ({
      ...result,
      outcome: "fail" as const,
    }));
    results.push({
      ...result,
      service: "@someone <script>",
    });
    const body = renderReport(
      results,
      "2026-10-01",
      "https://github.com/example/run",
    );
    expect(body).toContain("Showing 100 of 201");
    expect(body).not.toContain("@someone");
    expect(body).not.toContain("<script>");
    expect(body.length).toBeLessThan(60000);
    expect(body).toContain("201 failed");
  });
  const issue: Issue = {
    number: 1,
    body: "<!-- mpp-service-health -->",
    state: "open",
    user: { login: "github-actions[bot]" },
  };
  it.each([
    [[], [result], "create", undefined],
    [[issue], [result], "update", "open"],
    [[issue], [{ ...result, outcome: "inconclusive" }], "update", "open"],
    [[issue], [{ ...result, outcome: "skipped" }], "update", "open"],
    [[issue], [], "update", "open"],
    [
      [{ ...issue, state: "closed" }],
      [{ ...result, outcome: "inconclusive" }],
      "update",
      "closed",
    ],
    [[{ ...issue, state: "closed" }], [result], "update", "open"],
    [[issue], [{ ...result, outcome: "pass" }], "update", "closed"],
    [[], [{ ...result, outcome: "pass" }], "none", undefined],
    [
      [],
      [
        {
          ...result,
          outcome: "skipped",
          reason: "Service status: maintenance",
        },
      ],
      "none",
      undefined,
    ],
    [[{ ...issue, user: { login: "human" } }], [result], "create", undefined],
    [[{ ...issue, pull_request: {} }], [result], "create", undefined],
    [[], [{ ...result, outcome: "inconclusive" }], "none", undefined],
  ] as const)("maintains tracking issue lifecycle %#", async (issues, results, action, state) => {
    const client = {
      create: vi.fn(),
      list: async () => [...issues],
      update: vi.fn(),
    };
    await syncIssue(client, [...results], "report");
    if (action === "create")
      expect(client.create).toHaveBeenCalledWith("report");
    else expect(client.create).not.toHaveBeenCalled();
    if (action === "update")
      expect(client.update).toHaveBeenCalledWith(1, "report", state);
    else expect(client.update).not.toHaveBeenCalled();
  });
  it("propagates publication errors", async () => {
    await expect(
      syncIssue(
        {
          list: async () => [],
          create: async () => {
            throw new Error("API failure");
          },
          update: vi.fn(),
        },
        [result],
        "report",
      ),
    ).rejects.toThrow("API failure");
  });
});

describe("pipeline harness", () => {
  it("composes independent plugins in order and flattens their findings", async () => {
    const order: string[] = [];
    const metadata: HealthCheck = async (service) => {
      order.push(`${service.id}:metadata`);
      return [{ ...result, service: service.id, target: "metadata" }];
    };
    const empty: HealthCheck = async (service) => {
      order.push(`${service.id}:empty`);
      return [];
    };
    const network = vi.fn<typeof fetch>();
    const results = await checkServices(
      [service],
      [metadata, empty, metadata],
      { fetch: network },
    );
    expect(order).toEqual([
      "example:metadata",
      "example:empty",
      "example:metadata",
    ]);
    expect(results).toHaveLength(2);
    expect(results.every((item) => item.target === "metadata")).toBe(true);
    expect(network).not.toHaveBeenCalled();
  });
  it("allows selecting URL checks without probing endpoints", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response());
    const results = await checkServices(
      [
        {
          ...service,
          endpoints: [{ route: "GET /paid", desc: "Paid", amount: "1" }],
        },
      ],
      [checkUrls],
      { fetch: request },
    );
    expect(results).toHaveLength(2);
    expect(results.every((item) => item.target === "link")).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("gives custom plugins the shared request helper", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response());
    const custom: HealthCheck = async (service, { probe }) => [
      await probe(
        {
          method: "GET",
          service: service.id,
          target: "custom",
          url: service.url,
        },
        () => ({ outcome: "pass", reason: "Custom validation" }),
      ),
    ];
    expect(
      await checkServices([service], [custom], { fetch: request }),
    ).toMatchObject([
      { target: "custom", reason: "Custom validation", attempts: 1 },
    ]);
    expect(request).toHaveBeenCalledOnce();
  });
  it("supports empty catalogs and pipelines", async () => {
    const plugin = vi.fn<HealthCheck>();
    expect(await checkServices([], [plugin])).toEqual([]);
    expect(await checkServices([service], [])).toEqual([]);
    expect(plugin).not.toHaveBeenCalled();
  });
  it.each([
    0,
    -1,
    1.5,
    Infinity,
  ])("rejects invalid concurrency: %s", async (concurrency) => {
    await expect(checkServices([service], [], { concurrency })).rejects.toThrow(
      "Concurrency must be a positive integer",
    );
  });
  it("propagates plugin errors instead of publishing a partial report", async () => {
    const broken: HealthCheck = async () => {
      throw new Error("Invalid configuration");
    };
    await expect(checkServices([service], [broken])).rejects.toThrow(
      "Invalid configuration",
    );
  });
});
