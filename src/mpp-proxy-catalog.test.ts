import { describe, expect, it } from "vitest";
import {
  mergeMppProxyCatalog,
  type ServicesCatalog,
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
      tags: ["llm"],
      endpoints: [{ payment: { amount: "100", decimals: 6 } }],
    });
    expect(
      result.services.find(({ id }) => id === "new-provider"),
    ).toMatchObject({
      name: "New provider",
      serviceUrl: "https://new-provider.mpp.tempo.xyz",
      supportsCredits: true,
    });
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
