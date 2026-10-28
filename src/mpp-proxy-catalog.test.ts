import { describe, expect, it } from "vitest";
import {
  mergeMppProxyCatalog,
  type ServicesCatalog,
  withMppProxyMetadata,
} from "./mpp-proxy-catalog";

const staticCatalog: ServicesCatalog = {
  version: 1,
  services: [
    {
      id: "openai",
      name: "Stale OpenAI",
      url: "https://api.openai.com",
      serviceUrl: "https://openai.mpp.tempo.xyz",
      description: "stale",
      categories: ["ai"],
      integration: "third-party",
      tags: ["llm"],
      methods: {},
      endpoints: [],
      provider: { name: "OpenAI", url: "https://openai.com" },
    },
    {
      id: "external",
      name: "External",
      url: "https://external.example",
      serviceUrl: "https://external.example",
      methods: {},
      endpoints: [],
    },
  ],
};

describe("MPP proxy catalog", () => {
  it("replaces stale proxy entries and discovers new services", () => {
    const result = mergeMppProxyCatalog(staticCatalog, {
      services: [
        service("openai", "OpenAI", "100"),
        service("new-provider", "New provider", "200"),
      ],
    });

    expect(result.services.map(({ id }) => id)).toEqual([
      "external",
      "openai",
      "new-provider",
    ]);
    expect(result.services.find(({ id }) => id === "openai")).toMatchObject({
      name: "OpenAI",
      url: "https://api.openai.com",
      tags: ["llm", "ai"],
      endpoints: [{ payment: { amount: "100", decimals: 6 } }],
    });
    expect(
      result.services.find(({ id }) => id === "new-provider"),
    ).toMatchObject({
      name: "New provider",
      serviceUrl: "https://new-provider.mpp.tempo.xyz",
      supportsMACH: true,
    });
    expect(
      result.services.find(({ id }) => id === "external"),
    ).not.toHaveProperty("supportsMACH");
    expect(JSON.stringify(result)).not.toContain("supportsCredits");
  });

  it("fills gaps in the manifest's docs from the catalog entry", () => {
    const catalog: ServicesCatalog = {
      ...staticCatalog,
      services: staticCatalog.services.map((entry) =>
        entry.id === "openai"
          ? {
              ...entry,
              docs: {
                homepage: "https://stale.example/docs",
                llmsTxt: "https://platform.openai.com/llms.txt",
              },
            }
          : entry,
      ),
    };
    const openai = service("openai", "OpenAI", "100");
    const result = mergeMppProxyCatalog(catalog, {
      services: [
        {
          ...openai,
          manifest: {
            ...openai.manifest,
            docs: { homepage: "https://platform.openai.com/docs" },
          },
        },
      ],
    });
    expect(result.services.find(({ id }) => id === "openai")?.docs).toEqual({
      homepage: "https://platform.openai.com/docs",
      llmsTxt: "https://platform.openai.com/llms.txt",
    });
  });

  it("keeps provider-specific categories as tags instead of rejecting the manifest", () => {
    const rox = service("rox", "Rox", "20000");
    rox.manifest.categories = ["sales", "prospecting", "enrichment", "data"];
    const result = mergeMppProxyCatalog(staticCatalog, { services: [rox] });
    expect(result.services.find(({ id }) => id === "rox")).toMatchObject({
      categories: ["data"],
      tags: ["sales", "prospecting", "enrichment", "data"],
      supportsMACH: true,
    });
  });

  it("rejects malformed categories", () => {
    const invalid = service("openai", "OpenAI", "100");
    expect(() =>
      mergeMppProxyCatalog(staticCatalog, {
        services: [
          { ...invalid, manifest: { ...invalid.manifest, categories: [null] } },
        ],
      }),
    ).toThrow("Invalid MPP proxy service");
  });

  it("rejects an empty manifest instead of deleting the last-good catalog", () => {
    expect(() => mergeMppProxyCatalog(staticCatalog, { services: [] })).toThrow(
      "must contain services",
    );
  });

  it("rejects a service whose domain does not match its id", () => {
    const invalid = service("openai", "OpenAI", "100");
    invalid.domain = "attacker.example";
    expect(() =>
      mergeMppProxyCatalog(staticCatalog, { services: [invalid] }),
    ).toThrow("Invalid MPP proxy service");
  });
});

function service(id: string, name: string, amount: string) {
  return {
    id,
    domain: `${id}.mpp.tempo.xyz`,
    manifest: {
      name,
      description: `${name} description`,
      categories: ["ai"],
      methods: { tempo: { intents: ["charge"], assets: ["0xasset"] } },
      endpoints: [
        {
          method: "POST",
          path: "/generate",
          payment: {
            intent: "charge",
            method: "tempo",
            amount,
            currency: "0xasset",
          },
        },
      ],
    },
  };
}

describe("withMppProxyMetadata", () => {
  it("lets the live manifest replace fields an earlier merge derived from a snapshot", () => {
    const snapshot = service("kling", "Kling", "100");
    snapshot.manifest = {
      ...snapshot.manifest,
      docs: { homepage: "https://old.example" },
    } as typeof snapshot.manifest;
    const built = mergeMppProxyCatalog(staticCatalog, { services: [snapshot] });
    expect(built.services.find((s) => s.id === "kling")?.url).toBe(
      "https://old.example",
    );

    const live = service("kling", "Kling", "100");
    live.manifest = {
      ...live.manifest,
      docs: { homepage: "https://new.example" },
    } as typeof live.manifest;
    const merged = mergeMppProxyCatalog(withMppProxyMetadata(built, []), {
      services: [live],
    });
    const kling = merged.services.find((s) => s.id === "kling");
    expect(kling?.url).toBe("https://new.example");
    expect(kling?.provider?.url).toBe("https://new.example");
    expect(merged.services.some((s) => s.id === "external")).toBe(true);
  });

  it("keeps curated metadata across merges", () => {
    const merged = mergeMppProxyCatalog(
      withMppProxyMetadata(staticCatalog, [
        {
          id: "openai",
          url: "https://api.openai.com",
          integration: "third-party",
          tags: ["llm"],
          provider: { name: "OpenAI", url: "https://openai.com" },
        },
      ]),
      { services: [service("openai", "OpenAI", "100")] },
    );
    const openai = merged.services.find((s) => s.id === "openai");
    expect(openai?.url).toBe("https://api.openai.com");
    expect(openai?.provider).toEqual({
      name: "OpenAI",
      url: "https://openai.com",
    });
    expect(openai?.description).toBe("OpenAI description");
  });
});
