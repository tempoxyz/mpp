import * as z from "zod";
import rawSchema from "../../schemas/discovery.schema.json";

// ---------------------------------------------------------------------------
// Zod schema built from the canonical JSON Schema (single source of truth)
// ---------------------------------------------------------------------------

export const DiscoverySchema = z.fromJSONSchema(
  rawSchema as Parameters<typeof z.fromJSONSchema>[0],
);

// ---------------------------------------------------------------------------
// TS interfaces for compile-time use (mirrors the JSON Schema structure)
// ---------------------------------------------------------------------------

export type Category =
  | "ai"
  | "blockchain"
  | "compute"
  | "data"
  | "media"
  | "search"
  | "social"
  | "storage"
  | "web";

export interface EndpointPayment {
  intent: string;
  method: string;
  amount?: string;
  currency?: string;
  decimals?: number;
  recipient?: string;
  unitType?: string;
  description?: string;
}

export interface Endpoint {
  method: string;
  path: string;
  description?: string;
  payment?: EndpointPayment | null;
  docs?: string;
}

export interface Service {
  id: string;
  name: string;
  url: string;
  serviceUrl?: string;
  description?: string;
  icon?: string;
  category?: Category;
  categories?: Category[];
  integration?: "first-party" | "third-party";
  tags?: string[];
  status?: "active" | "beta" | "deprecated" | "maintenance";
  docs?: {
    homepage?: string;
    llmsTxt?: string;
    openapi?: string;
    apiReference?: string;
  };
  methods: Record<string, { intents: string[]; assets?: string[] }>;
  endpoints: Endpoint[];
  provider?: { name?: string; url?: string; icon?: string };
}

// ---------------------------------------------------------------------------
// Registry data — validated against the Zod schema at module load
// ---------------------------------------------------------------------------

const USDC = "0x20c000000000000000000000b9537d11c60e8b50";
const RECIPIENT = "0xB48141c3Da5030deF992bDc686f0e9A8729206b6";

const data = {
  version: 1,
  services: [
    {
      id: "openrouter",
      name: "OpenRouter",
      url: "https://openrouter.payments.tempo.xyz",
      serviceUrl: "https://openrouter.ai",
      description:
        "100+ LLM models (Claude, GPT-4o, Gemini, Llama, and more) through a unified API.",
      category: "ai",
      integration: "third-party",
      tags: ["llm", "claude", "gpt-4o", "gemini", "llama", "chat", "router"],
      status: "active",
      docs: {
        homepage: "https://openrouter.ai/docs",
        apiReference: "https://openrouter.ai/docs/api-reference",
      },
      methods: {
        tempo: { intents: ["session"], assets: [USDC] },
      },
      provider: { name: "OpenRouter", url: "https://openrouter.ai" },
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/chat/completions",
          description: "Chat completions across 100+ models.",
          payment: {
            intent: "session",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            unitType: "request",
            description: "Price varies by model",
          },
        },
      ],
    },
    {
      id: "anthropic",
      name: "Anthropic",
      url: "https://anthropic.payments.tempo.xyz",
      serviceUrl: "https://api.anthropic.com",
      description:
        "Claude chat completions (Sonnet, Opus, Haiku) via native and OpenAI-compatible APIs.",
      category: "ai",
      integration: "third-party",
      tags: ["llm", "claude", "sonnet", "opus", "haiku", "chat"],
      status: "active",
      methods: {
        tempo: { intents: ["session"], assets: [USDC] },
      },
      provider: { name: "Anthropic", url: "https://anthropic.com" },
      endpoints: [
        {
          method: "POST",
          path: "/v1/messages",
          description: "Create Claude messages.",
          payment: {
            intent: "session",
            method: "tempo",
            amount: "500",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            unitType: "request",
          },
        },
        {
          method: "POST",
          path: "/v1/chat/completions",
          description: "OpenAI-compatible chat completions.",
          payment: {
            intent: "session",
            method: "tempo",
            amount: "500",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            unitType: "request",
          },
        },
      ],
    },
    {
      id: "openai",
      name: "OpenAI",
      url: "https://openai.payments.tempo.xyz",
      serviceUrl: "https://api.openai.com",
      description:
        "Chat completions, embeddings, image generation, and audio with model-tier pricing.",
      category: "ai",
      categories: ["ai", "media"],
      integration: "third-party",
      tags: [
        "llm",
        "gpt-4o",
        "dall-e",
        "whisper",
        "tts",
        "embeddings",
        "chat",
      ],
      status: "active",
      docs: {
        homepage: "https://platform.openai.com/docs",
        llmsTxt: "https://developers.openai.com/api/docs/llms.txt",
        apiReference: "https://platform.openai.com/docs/api-reference",
      },
      methods: {
        tempo: { intents: ["charge", "session"], assets: [USDC] },
      },
      provider: { name: "OpenAI", url: "https://openai.com" },
      endpoints: [
        {
          method: "POST",
          path: "/v1/responses",
          description: "Create model responses (streaming supported).",
          payment: {
            intent: "session",
            method: "tempo",
            amount: "500",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            unitType: "request",
            description: "Model response — price varies by model",
          },
          docs: "https://platform.openai.com/docs/api-reference/responses",
        },
        {
          method: "POST",
          path: "/v1/chat/completions",
          description: "Chat completions with GPT models.",
          payment: {
            intent: "session",
            method: "tempo",
            amount: "500",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            unitType: "request",
            description: "Chat completion — price varies by model",
          },
          docs: "https://platform.openai.com/docs/api-reference/chat",
        },
        {
          method: "POST",
          path: "/v1/embeddings",
          description: "Create text embeddings.",
          payment: {
            intent: "charge",
            method: "tempo",
            amount: "100",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            description: "Create embeddings",
          },
          docs: "https://platform.openai.com/docs/api-reference/embeddings",
        },
        {
          method: "POST",
          path: "/v1/images/generations",
          description: "Generate images with DALL-E.",
          payment: {
            intent: "charge",
            method: "tempo",
            amount: "50000",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            description: "Generate images with DALL-E",
          },
          docs: "https://platform.openai.com/docs/api-reference/images",
        },
      ],
    },
    {
      id: "fal",
      name: "fal.ai",
      url: "https://fal.payments.tempo.xyz",
      serviceUrl: "https://fal.ai",
      description: "Image generation, video, and audio models.",
      category: "ai",
      categories: ["ai", "media"],
      integration: "third-party",
      tags: ["image", "video", "audio", "diffusion", "generation"],
      status: "active",
      docs: { homepage: "https://fal.ai/docs" },
      methods: {
        tempo: { intents: ["charge"], assets: [USDC] },
      },
      provider: { name: "fal.ai", url: "https://fal.ai" },
      endpoints: [
        {
          method: "POST",
          path: "/v1/image/generations",
          description: "Generate images from text prompts.",
          payment: {
            intent: "charge",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            description: "Price varies by model and resolution",
          },
        },
      ],
    },
    {
      id: "elevenlabs",
      name: "ElevenLabs",
      url: "https://elevenlabs.payments.tempo.xyz",
      serviceUrl: "https://api.elevenlabs.io",
      description: "Text-to-speech and voice cloning.",
      category: "ai",
      categories: ["ai", "media"],
      integration: "third-party",
      tags: ["tts", "voice", "speech", "audio", "cloning"],
      status: "active",
      docs: { homepage: "https://elevenlabs.io/docs" },
      methods: {
        tempo: { intents: ["charge"], assets: [USDC] },
      },
      provider: { name: "ElevenLabs", url: "https://elevenlabs.io" },
      endpoints: [
        {
          method: "POST",
          path: "/v1/text-to-speech/:voice_id",
          description: "Convert text to speech with a specific voice.",
          payment: {
            intent: "charge",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            description: "Price varies by voice and length",
          },
        },
      ],
    },
    {
      id: "firecrawl",
      name: "Firecrawl",
      url: "https://firecrawl.payments.tempo.xyz",
      serviceUrl: "https://api.firecrawl.dev",
      description: "Web scraping and crawling.",
      category: "web",
      integration: "third-party",
      tags: ["scraping", "crawling", "html", "markdown", "web"],
      status: "active",
      docs: { homepage: "https://docs.firecrawl.dev" },
      methods: {
        tempo: { intents: ["charge"], assets: [USDC] },
      },
      provider: { name: "Firecrawl", url: "https://firecrawl.dev" },
      endpoints: [
        {
          method: "POST",
          path: "/v1/scrape",
          description: "Scrape a single URL.",
          payment: {
            intent: "charge",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
          },
        },
        {
          method: "POST",
          path: "/v1/crawl",
          description: "Crawl a website from a starting URL.",
          payment: {
            intent: "charge",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
          },
        },
      ],
    },
    {
      id: "browserbase",
      name: "Browserbase",
      url: "https://browserbase.payments.tempo.xyz",
      serviceUrl: "https://www.browserbase.com",
      description: "Headless browser automation.",
      category: "web",
      integration: "third-party",
      tags: ["browser", "headless", "automation", "puppeteer", "playwright"],
      status: "active",
      docs: { homepage: "https://docs.browserbase.com" },
      methods: {
        tempo: { intents: ["session"], assets: [USDC] },
      },
      provider: { name: "Browserbase", url: "https://browserbase.com" },
      endpoints: [
        {
          method: "POST",
          path: "/v1/sessions",
          description: "Create a browser session.",
          payment: {
            intent: "session",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
          },
        },
      ],
    },
    {
      id: "exa",
      name: "Exa",
      url: "https://exa.payments.tempo.xyz",
      serviceUrl: "https://api.exa.ai",
      description: "AI-native search engine.",
      category: "search",
      integration: "third-party",
      tags: ["search", "ai", "semantic", "web"],
      status: "active",
      docs: { homepage: "https://docs.exa.ai" },
      methods: {
        tempo: { intents: ["charge"], assets: [USDC] },
      },
      provider: { name: "Exa", url: "https://exa.ai" },
      endpoints: [
        {
          method: "POST",
          path: "/search",
          description: "Search the web with AI-powered results.",
          payment: {
            intent: "charge",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
          },
        },
        {
          method: "POST",
          path: "/contents",
          description: "Get page contents for search results.",
          payment: {
            intent: "charge",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
          },
        },
      ],
    },
    {
      id: "codex",
      name: "Codex",
      url: "https://codex.payments.tempo.xyz",
      serviceUrl: "https://graph.codex.io",
      description: "Blockchain data indexing.",
      category: "data",
      integration: "third-party",
      tags: ["blockchain", "indexing", "graphql", "tokens", "defi"],
      status: "active",
      docs: { homepage: "https://docs.codex.io" },
      methods: {
        tempo: { intents: ["charge"], assets: [USDC] },
      },
      provider: { name: "Codex", url: "https://codex.so" },
      endpoints: [
        {
          method: "POST",
          path: "/graphql",
          description: "Query blockchain data via GraphQL.",
          payment: {
            intent: "charge",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
          },
        },
      ],
    },
    {
      id: "alchemy",
      name: "Alchemy",
      url: "https://alchemy.payments.tempo.xyz",
      serviceUrl: "https://www.alchemy.com",
      description: "Multi-chain node access.",
      category: "blockchain",
      integration: "third-party",
      tags: ["rpc", "node", "evm", "multi-chain", "ethereum"],
      status: "active",
      docs: { homepage: "https://docs.alchemy.com" },
      methods: {
        tempo: { intents: ["session"], assets: [USDC] },
      },
      provider: { name: "Alchemy", url: "https://alchemy.com" },
      endpoints: [
        {
          method: "POST",
          path: "/",
          description: "JSON-RPC calls across multiple chains.",
          payment: {
            intent: "session",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            unitType: "request",
          },
        },
      ],
    },
    {
      id: "rpc",
      name: "Tempo RPC",
      url: "https://rpc.payments.tempo.xyz",
      serviceUrl: "https://rpc.tempo.xyz",
      description:
        "Tempo blockchain JSON-RPC access (mainnet and testnet).",
      category: "blockchain",
      integration: "first-party",
      tags: ["rpc", "json-rpc", "evm", "tempo", "node"],
      status: "active",
      docs: { llmsTxt: "https://docs.tempo.xyz/llms.txt" },
      methods: {
        tempo: { intents: ["session"], assets: [USDC] },
      },
      provider: { name: "Tempo", url: "https://tempo.xyz" },
      endpoints: [
        {
          method: "POST",
          path: "/",
          description: "JSON-RPC calls.",
          payment: {
            intent: "session",
            method: "tempo",
            amount: "1000",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            unitType: "request",
            description: "JSON-RPC calls — $0.001 per call",
          },
        },
      ],
    },
    {
      id: "twilio",
      name: "Twilio",
      url: "https://twilio.payments.tempo.xyz",
      serviceUrl: "https://api.twilio.com",
      description: "SMS and MMS messaging.",
      category: "social",
      integration: "third-party",
      tags: ["sms", "mms", "messaging", "communications"],
      status: "active",
      docs: { homepage: "https://www.twilio.com/docs" },
      methods: {
        tempo: { intents: ["charge"], assets: [USDC] },
      },
      provider: { name: "Twilio", url: "https://twilio.com" },
      endpoints: [
        {
          method: "POST",
          path: "/2010-04-01/Accounts/:sid/Messages",
          description: "Send SMS or MMS messages.",
          payment: {
            intent: "charge",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
          },
        },
      ],
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      url: "https://twitter.payments.tempo.xyz",
      serviceUrl: "https://api.x.com",
      description: "Posts, users, and search.",
      category: "social",
      integration: "third-party",
      tags: ["social", "twitter", "posts", "search", "users"],
      status: "active",
      docs: {
        homepage: "https://developer.x.com/en/docs",
        apiReference: "https://developer.x.com/en/docs/x-api",
      },
      methods: {
        tempo: { intents: ["charge"], assets: [USDC] },
      },
      provider: { name: "X Corp", url: "https://x.com" },
      endpoints: [
        {
          method: "GET",
          path: "/2/tweets",
          description: "Look up tweets by ID.",
          payment: {
            intent: "charge",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
          },
        },
        {
          method: "GET",
          path: "/2/users",
          description: "Look up users by ID or username.",
          payment: {
            intent: "charge",
            method: "tempo",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
          },
        },
      ],
    },
    {
      id: "storage",
      name: "Object Storage",
      url: "https://storage.payments.tempo.xyz",
      description:
        "S3/R2-compatible object storage with dynamic per-size pricing.",
      category: "storage",
      integration: "first-party",
      tags: ["s3", "r2", "objects", "blobs", "files"],
      status: "active",
      methods: {
        tempo: { intents: ["charge", "session"], assets: [USDC] },
      },
      endpoints: [
        {
          method: "GET",
          path: "/:bucket/:key",
          description: "Download an object.",
          payment: {
            intent: "session",
            method: "tempo",
            amount: "100",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            unitType: "request",
          },
        },
        {
          method: "PUT",
          path: "/:bucket/:key",
          description: "Upload an object.",
          payment: {
            intent: "charge",
            method: "tempo",
            amount: "1000",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            description: "Upload object — price scales with size",
          },
        },
        {
          method: "DELETE",
          path: "/:bucket/:key",
          description: "Delete an object.",
          payment: {
            intent: "charge",
            method: "tempo",
            amount: "100",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            description: "Delete object",
          },
        },
        {
          method: "GET",
          path: "/:bucket",
          description: "List objects in a bucket.",
          payment: {
            intent: "charge",
            method: "tempo",
            amount: "100",
            currency: USDC,
            decimals: 6,
            recipient: RECIPIENT,
            description: "List objects in bucket",
          },
        },
      ],
    },
  ] satisfies Service[],
};

DiscoverySchema.parse(data);

export const registry = data;
export const services: Service[] = data.services;
