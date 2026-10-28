import { describe, expect, it } from "vitest";
import { mppProbes } from "./checks.ts";
import { mppProxyHealthServices } from "./proxy.ts";

describe("mppProxyHealthServices", () => {
  const services = mppProxyHealthServices();

  it("covers every proxy service in the snapshot", () => {
    expect(services.length).toBeGreaterThanOrEqual(19);
    expect(
      services.every((service) =>
        service.serviceUrl.endsWith(".mpp.tempo.xyz"),
      ),
    ).toBe(true);
  });

  it("keeps the safe POST fixtures for firecrawl and rpc", () => {
    const probes = services.flatMap(mppProbes);
    const search = probes.find(
      (probe) =>
        probe.service === "firecrawl" && probe.target === "POST /v1/search",
    );
    const rpc = probes.find(
      (probe) => probe.service === "rpc" && probe.target === "POST /",
    );
    expect(search?.skip).toBeUndefined();
    expect(search?.payment).toBeDefined();
    expect(JSON.parse(search?.body ?? "{}")).toMatchObject({
      query: "Machine Payments Protocol",
    });
    expect(rpc?.skip).toBeUndefined();
    expect(JSON.parse(rpc?.body ?? "{}")).toMatchObject({
      method: "eth_chainId",
    });
  });

  it("probes concrete paid GET routes without fixtures", () => {
    const probes = services.flatMap(mppProbes);
    const kicks = probes.find(
      (probe) =>
        probe.service === "kicksdb" &&
        probe.target === "GET /v3/stockx/products",
    );
    expect(kicks?.skip).toBeUndefined();
    expect(kicks?.payment).toBeDefined();
  });
});
