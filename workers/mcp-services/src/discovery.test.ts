import { describe, expect, it } from "vitest";
import {
  findService,
  listServiceSummaries,
  offersForService,
  registryOpenApiView,
  searchOffers,
  searchServices,
} from "./discovery.js";
import type { Service } from "./types.js";

const services: Service[] = [
  {
    id: "agentmail",
    name: "AgentMail",
    url: "https://mpp.api.agentmail.to",
    description: "Email inboxes for AI agents.",
    categories: ["ai", "social"],
    integration: "first-party",
    tags: ["email", "inboxes"],
    status: "active",
    methods: { tempo: { intents: ["charge"] } },
    endpoints: [
      { method: "GET", path: "/v0/inboxes", payment: null },
      {
        method: "POST",
        path: "/v0/inboxes",
        description: "Create inbox",
        payment: {
          intent: "charge",
          method: "tempo",
          amount: "2000000",
        },
      },
      {
        method: "POST",
        path: "/v0/inboxes/:inbox_id/messages/send",
        description: "Send message",
        payment: {
          intent: "charge",
          method: "tempo",
          amount: "10000",
        },
      },
    ],
  },
  {
    id: "anthropic",
    supportsMACH: true,
    name: "Anthropic",
    url: "https://api.anthropic.com",
    description: "Claude chat completions.",
    categories: ["ai"],
    integration: "third-party",
    tags: ["llm", "claude"],
    status: "active",
    docs: { openapi: "https://example.com/openapi.json" },
    methods: { tempo: { intents: ["session"] } },
    endpoints: [
      {
        method: "POST",
        path: "/v1/messages",
        payment: {
          intent: "session",
          method: "tempo",
          dynamic: true,
        },
      },
    ],
  },
  {
    id: "legacy",
    name: "Legacy",
    url: "https://legacy.example.com",
    categories: ["data"],
    integration: "third-party",
    tags: ["archive"],
    status: "deprecated",
    methods: {},
    endpoints: [],
  },
];

describe("discovery helpers", () => {
  it("lists compact service summaries", () => {
    expect(listServiceSummaries(services)).toEqual([
      expect.objectContaining({
        id: "agentmail",
        name: "AgentMail",
        categories: ["ai", "social"],
        status: "active",
      }),
      expect.objectContaining({ id: "anthropic", supportsMACH: true }),
      expect.objectContaining({ id: "legacy", status: "deprecated" }),
    ]);
    expect(listServiceSummaries(services)[0]).not.toHaveProperty(
      "supportsMACH",
    );
  });

  it("searches by query and exact filters", () => {
    expect(
      searchServices(services, {
        query: "claude",
        category: "ai",
        method: "tempo",
        integration: "third-party",
        status: "active",
      }).map((service) => service.id),
    ).toEqual(["anthropic"]);
  });

  it("finds services by id or exact name", () => {
    expect(findService(services, "agentmail")?.name).toBe("AgentMail");
    expect(findService(services, "Anthropic")?.id).toBe("anthropic");
  });

  it("returns only paid offers and supports route filtering", () => {
    const service = findService(services, "agentmail");
    if (!service) throw new Error("missing fixture");
    expect(offersForService(service)).toHaveLength(2);
    expect(offersForService(service, "POST /v0/inboxes")).toEqual([
      expect.objectContaining({
        method: "POST",
        path: "/v0/inboxes",
        payment: expect.objectContaining({ amount: "2000000" }),
      }),
    ]);
    expect(offersForService(service, "inboxes")).toHaveLength(2);
  });

  it("filters offers by any asset the offer's method accepts", () => {
    const ousd = "0x20c0000000000000000000006a37DA5C996874BE";
    const pathUsd = "0x20c0000000000000000000000000000000000000";
    const service: Service = {
      id: "tempo-api",
      name: "Tempo API",
      url: "https://api.tempo.xyz",
      categories: ["blockchain"],
      integration: "first-party",
      tags: [],
      status: "beta",
      methods: { tempo: { assets: [ousd, pathUsd], intents: ["session"] } },
      endpoints: [
        {
          method: "GET",
          path: "/v1/transfers",
          payment: {
            currency: ousd,
            dynamic: true,
            intent: "session",
            method: "tempo",
          },
        },
      ],
    };
    const ids = (currency: string) =>
      searchOffers([service, ...services], { currency }).map(
        (offer) => offer.service.id,
      );
    expect(ids(ousd)).toEqual(["tempo-api"]);
    expect(ids(pathUsd.toUpperCase().replace("0X", "0x"))).toEqual([
      "tempo-api",
    ]);
    expect(ids("0x20c000000000000000000000b9537d11c60e8b50")).toEqual([]);
  });

  it("builds a registry fallback view for services without openapi", () => {
    const service = findService(services, "agentmail");
    if (!service) throw new Error("missing fixture");
    expect(registryOpenApiView(service)).toEqual(
      expect.objectContaining({
        source: "registry",
        service: expect.objectContaining({ id: "agentmail" }),
        endpoints: expect.arrayContaining([
          expect.objectContaining({ path: "/v0/inboxes" }),
        ]),
      }),
    );
  });
});
