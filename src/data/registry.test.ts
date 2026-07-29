import { afterEach, describe, expect, it, vi } from "vitest";

function createStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
  };
}

function service(id: string, name = id) {
  return {
    endpoints: [],
    id,
    methods: {},
    name,
    url: `https://${id}.example.com`,
  };
}

describe("service registry cache", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("deduplicates catalog requests and uses the static catalog", async () => {
    vi.stubGlobal("sessionStorage", createStorage());
    const fetchMock = vi.fn(async () =>
      Response.json({ services: [service("openai", "OpenAI (New)")] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchServices } = await import("./registry");
    const [first, second] = await Promise.all([
      fetchServices(),
      fetchServices(),
    ]);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/services/catalog.json");
    expect(first).toEqual(second);
    expect(first[0]?.name).toBe("OpenAI");
  });

  it("restores the catalog from session storage after a reload", async () => {
    const storage = createStorage();
    vi.stubGlobal("sessionStorage", storage);
    const fetchMock = vi.fn(async () =>
      Response.json({ services: [service("anthropic")] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const firstModule = await import("./registry");
    await firstModule.fetchServices();
    vi.resetModules();
    const secondModule = await import("./registry");
    const services = await secondModule.fetchServices();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(services).toEqual([service("anthropic")]);
  });

  it("caches and deduplicates featured service requests", async () => {
    vi.stubGlobal("sessionStorage", createStorage());
    const fetchMock = vi.fn(async () =>
      Response.json({ services: [service("parallel", "Parallel (New)")] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchFeaturedServices } = await import("./registry");
    const [first, second] = await Promise.all([
      fetchFeaturedServices(["parallel"]),
      fetchFeaturedServices(["parallel"]),
    ]);
    const third = await fetchFeaturedServices(["parallel"]);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/api/services?ids=parallel");
    expect(first).toEqual(second);
    expect(second).toEqual(third);
    expect(first[0]?.name).toBe("Parallel");
  });
});
