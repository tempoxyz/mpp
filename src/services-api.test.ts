import { afterEach, describe, expect, it, vi } from "vitest";
import { MPP_PROXY_MANIFEST_URL } from "./mpp-proxy-catalog";

describe("services API", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("serves proxy endpoints from the live manifest", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      Response.json({
        services: [
          {
            id: "openai",
            domain: "openai.mpp.tempo.xyz",
            manifest: {
              name: "Live OpenAI",
              description: "Live description",
              categories: ["ai"],
              methods: {
                tempo: { intents: ["charge"], assets: ["0xasset"] },
              },
              endpoints: [
                {
                  method: "POST",
                  path: "/v1/responses",
                  payment: {
                    intent: "charge",
                    method: "tempo",
                    amount: "123",
                    currency: "0xasset",
                  },
                },
              ],
            },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./pages/_api/api/services");
    const response = await GET(
      new Request("https://mpp.dev/api/services?ids=openai"),
    );
    const body = (await response.json()) as {
      services: Array<{ name: string; endpoints?: unknown }>;
    };

    expect(fetchMock.mock.calls[0]?.[0]).toBe(MPP_PROXY_MANIFEST_URL);
    expect(body.services).toEqual([
      expect.objectContaining({ name: "Live OpenAI" }),
    ]);
  });

  it("falls back to the checked-in catalog when the manifest is unavailable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 503 })),
    );

    const { GET } = await import("./pages/_api/api/services");
    const response = await GET(
      new Request("https://mpp.dev/api/services?ids=openai"),
    );
    const body = (await response.json()) as { services: Array<{ id: string }> };

    expect(body.services).toEqual([expect.objectContaining({ id: "openai" })]);
  });

  it("exposes the first-party Tempo API alongside live proxy services", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ services: [] })),
    );

    const { GET } = await import("./pages/_api/api/services");
    const response = await GET(
      new Request("https://mpp.dev/api/services?ids=tempo-api"),
    );

    expect(await response.json()).toEqual({
      services: [
        expect.objectContaining({
          categories: ["blockchain", "data"],
          id: "tempo-api",
          name: "Tempo API",
          serviceUrl: "https://api.tempo.xyz",
        }),
      ],
    });

    const catalogResponse = await GET(
      new Request("https://mpp.dev/api/services"),
    );
    const catalog = (await catalogResponse.json()) as {
      services: Array<{
        id: string;
        description: string;
        endpoints: unknown[];
      }>;
    };
    const api = catalog.services.find((service) => service.id === "tempo-api");
    expect(api?.endpoints).toHaveLength(48);
    for (const query of ["api.tempo.xyz", "TIP-20 balances", "Moderato"]) {
      expect(api?.description).toEqual(expect.stringContaining(query));
    }
  });

  it("does not restore removed proxy services when the manifest is unavailable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 503 })),
    );

    const { GET } = await import("./pages/_api/api/services");
    const response = await GET(
      new Request(
        "https://mpp.dev/api/services?ids=aviationstack,flightapi,gemini,googlemaps,oxylabs,serpapi,spyfu",
      ),
    );

    expect(await response.json()).toEqual({ services: [] });
  });
});
