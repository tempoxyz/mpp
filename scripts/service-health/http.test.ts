import { describe, expect, it, vi } from "vitest";
import { services } from "../../schemas/services.ts";
import { checkServices } from "./check.ts";
import { checkUrls } from "./checks.ts";
import { createProbeRunner, type Probe, requestKey } from "./http.ts";
import { renderReport } from "./report.ts";

const probe: Probe = {
  method: "GET",
  service: "test",
  target: "link",
  url: "https://example.com",
  followRedirects: true,
};
const evaluate = () => ({ outcome: "pass" as const, reason: "Validated" });

describe("deduplication", () => {
  it("shares concurrent requests but evaluates each check independently", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response());
    const run = createProbeRunner({ fetch });
    const results = await Promise.all([
      run(probe, evaluate),
      run({ ...probe, service: "other" }, () => ({
        outcome: "fail",
        reason: "Different check",
      })),
    ]);
    expect(fetch).toHaveBeenCalledOnce();
    expect(results.map((r) => r.outcome)).toEqual(["pass", "fail"]);
    expect(results[1].service).toBe("other");
  });
  it("does not repeat a failed request", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValue(new Error("offline"));
    const run = createProbeRunner({ fetch });
    const results = await Promise.all([
      run(probe, evaluate),
      run(probe, evaluate),
    ]);
    expect(fetch).toHaveBeenCalledOnce();
    expect(results.every((r) => r.outcome === "inconclusive")).toBe(true);
  });
  it("distinguishes methods and bodies but ignores URL fragments", () => {
    expect(requestKey("https://EXAMPLE.com/#one")).toBe(
      requestKey("https://example.com/#two"),
    );
    expect(requestKey(probe.url, "POST", "{}")).not.toBe(requestKey(probe.url));
    expect(requestKey(probe.url, "POST", "{}")).not.toBe(
      requestKey(probe.url, "POST", '{"q":"MPP"}'),
    );
  });
});

describe("redirects", () => {
  it("follows HTTPS redirects and shares the final destination with other checks", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: "/docs" } }),
      )
      .mockResolvedValueOnce(new Response());
    const run = createProbeRunner({ fetch });
    expect(await run(probe, evaluate)).toMatchObject({
      outcome: "pass",
      finalUrl: "https://example.com/docs",
    });
    await run({ ...probe, url: "https://example.com/docs" }, evaluate);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it.each([
    "http://example.com",
    "https://localhost/",
    "https://127.0.0.1/",
    "https://[::1]/",
    "https://[::ffff:127.0.0.1]/",
    "https://host.internal/",
    "https://user:pass@example.com/",
    "https://example.com/",
  ])("does not follow unsafe or cyclic redirects: %s", async (location) => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(
        new Response(null, { status: 302, headers: { location } }),
      );
    const run = createProbeRunner({ fetch });
    expect((await run(probe, evaluate)).outcome).toBe("inconclusive");
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("stops after three redirects", async () => {
    let n = 0;
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: `/step-${++n}` },
        }),
    );
    expect((await createProbeRunner({ fetch })(probe, evaluate)).outcome).toBe(
      "inconclusive",
    );
    expect(fetch).toHaveBeenCalledTimes(4);
  });
  it("never follows a POST redirect", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(null, {
        status: 307,
        headers: { location: "/elsewhere" },
      }),
    );
    await createProbeRunner({ fetch })(
      { ...probe, method: "POST", body: "{}" },
      () => ({ outcome: "inconclusive", reason: "Redirect" }),
    );
    expect(fetch).toHaveBeenCalledOnce();
  });
});

describe("actionability", () => {
  it("distinguishes base-URL connectivity from broken documented links", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(new Response(null, { status: 404 }));
    const service = {
      ...services[0],
      url: "https://example.com",
      serviceUrl: "https://example.com/api",
      provider: undefined,
      docs: { homepage: "https://example.com/docs" },
    };
    const results = await checkServices([service], [checkUrls], { fetch });
    expect(
      results.filter((r) => r.outcome === "fail").map((r) => r.url),
    ).toEqual(["https://example.com/docs"]);
    expect(results.filter((r) => r.outcome === "pass")).toHaveLength(2);
  });
  it("keeps coverage gaps out of actionable issue findings", () => {
    const report = renderReport(
      [
        {
          service: "fixture-needed",
          target: "POST /search",
          url: probe.url,
          outcome: "skipped",
          attempts: 0,
          reason: "Needs fixture",
        },
      ],
      "today",
      "run",
    );
    expect(report).toContain("1 skipped");
    expect(report).toContain("no attempted endpoint probes: fixture-needed.");
    expect(report).not.toContain(
      "| Service | Endpoint or link | HTTP | Finding | URL |",
    );
  });
});

describe("unpaid POST probes", () => {
  it.each([
    200, 302, 307, 400, 402, 500,
  ])("stops after status %i without credentials or fulfillment", async (status) => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(null, {
        status,
        headers: {
          location: "https://example.com/next",
          "www-authenticate": 'Payment realm="test"',
        },
      }),
    );
    const run = createProbeRunner({ fetch });
    await run({ ...probe, method: "POST", body: "{}" }, evaluate);
    expect(fetch).toHaveBeenCalledOnce();
    const init = fetch.mock.calls[0][1]!;
    expect(init.credentials).toBe("omit");
    expect(init.redirect).toBe("manual");
    expect(init.body).toBe("{}");
    expect([...new Headers(init.headers).keys()].sort()).toEqual([
      "content-type",
      "user-agent",
    ]);
  });
});
