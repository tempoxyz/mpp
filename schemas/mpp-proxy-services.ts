import type { EndpointDef, ServiceDef } from "./services.ts";

/**
 * Catalog metadata for services the Tempo MPP proxy serves at
 * https://<id>.mpp.tempo.xyz. Their name, description, categories, payment
 * methods and endpoints come from the proxy's discovery manifest
 * (schemas/mpp-proxy.json, refreshed with `pnpm sync:mpp-proxy`); list a
 * proxy service here only to add what the manifest lacks. A manifest service
 * without an entry is still published, with defaults.
 */
export type MppProxyServiceDef = Pick<
  ServiceDef,
  | "id"
  | "url"
  | "icon"
  | "integration"
  | "tags"
  | "status"
  | "docs"
  | "provider"
> & {
  /** Health-probe fixtures by route ("METHOD /path"), for proxy routes that need a safe body. */
  healthChecks?: Record<string, NonNullable<EndpointDef["healthCheck"]>>;
};

// prettier-ignore
export const mppProxyServices: MppProxyServiceDef[] = [
  {
    id: "anthropic",
    url: "https://api.anthropic.com",
    integration: "third-party",
    tags: ["llm", "claude", "sonnet", "opus", "haiku", "chat"],
    docs: {
      homepage: "https://docs.anthropic.com",
      llmsTxt: "https://docs.anthropic.com/llms.txt",
      apiReference: "https://docs.anthropic.com/en/api",
    },
    provider: { name: "Anthropic", url: "https://anthropic.com" },
  },
  {
    id: "fal",
    url: "https://fal.run",
    integration: "third-party",
    tags: ["image", "video", "flux", "stable-diffusion", "grok", "generation"],
    docs: {
      homepage: "https://fal.ai/docs",
      llmsTxt: "https://fal.ai/docs/llms.txt",
    },
    provider: { name: "fal.ai", url: "https://fal.ai" },
  },
  {
    id: "firecrawl",
    url: "https://api.firecrawl.dev",
    healthChecks: {
      "POST /v1/search": {
        body: { query: "Machine Payments Protocol", limit: 1 },
      },
    },
    integration: "third-party",
    tags: ["scraping", "crawling", "extraction", "llm"],
    docs: {
      homepage: "https://docs.firecrawl.dev",
      llmsTxt: "https://docs.firecrawl.dev/llms.txt",
    },
    provider: { name: "Firecrawl", url: "https://firecrawl.dev" },
  },
  {
    id: "modal",
    url: "https://api.modal.com",
    integration: "third-party",
    tags: ["gpu", "serverless", "sandbox", "compute"],
    docs: {
      homepage: "https://modal.com/docs",
      llmsTxt: "https://modal.com/llms.txt",
    },
    provider: { name: "Modal", url: "https://modal.com" },
  },
  {
    id: "openai",
    url: "https://api.openai.com",
    icon: "https://mpp.tempo.xyz/icons/openai.svg",
    integration: "third-party",
    tags: ["llm", "gpt-4o", "dall-e", "whisper", "tts", "embeddings", "chat"],
    docs: {
      homepage: "https://platform.openai.com/docs",
      llmsTxt: "https://developers.openai.com/api/docs/llms.txt",
      apiReference: "https://platform.openai.com/docs/api-reference",
    },
    provider: { name: "OpenAI", url: "https://openai.com" },
  },
  {
    id: "openrouter",
    url: "https://openrouter.ai/api",
    integration: "third-party",
    tags: ["llm", "unified", "multi-model", "chat"],
    docs: {
      homepage: "https://openrouter.ai/docs",
      llmsTxt: "https://openrouter.ai/docs/llms.txt",
    },
    provider: { name: "OpenRouter", url: "https://openrouter.ai" },
  },
  {
    id: "rpc",
    url: "https://rpc.tempo.xyz",
    healthChecks: {
      "POST /": {
        body: { id: 1, jsonrpc: "2.0", method: "eth_chainId", params: [] },
      },
    },
    integration: "first-party",
    tags: ["rpc", "json-rpc", "evm", "tempo", "node"],
    docs: {
      homepage: "https://docs.tempo.xyz",
      llmsTxt: "https://docs.tempo.xyz/llms.txt",
    },
    provider: { name: "Tempo", url: "https://tempo.xyz" },
  },
  {
    id: "storage",
    url: "https://mpp.tempo.xyz/storage",
    integration: "first-party",
    tags: ["s3", "r2", "objects", "blobs", "files"],
    docs: { homepage: "https://developers.cloudflare.com/r2/" },
    provider: { name: "Tempo", url: "https://tempo.xyz" },
  },
  {
    id: "goflightlabs",
    url: "https://goflightlabs.com",
    integration: "third-party",
    tags: ["flights", "tracking", "prices", "airlines", "airports"],
    provider: { name: "GoFlightLabs", url: "https://goflightlabs.com" },
  },
  {
    id: "kicksdb",
    url: "https://api.kicks.dev",
    integration: "third-party",
    tags: ["sneakers", "streetwear", "prices", "stockx", "goat"],
    docs: {
      homepage: "https://kicks.dev",
      llmsTxt: "https://docs.kicks.dev/llms.txt",
      apiReference: "https://docs.kicks.dev",
    },
    provider: { name: "KicksDB", url: "https://kicks.dev" },
  },
  {
    id: "twocaptcha",
    url: "https://api.2captcha.com",
    integration: "third-party",
    tags: ["captcha", "automation", "solving"],
    docs: {
      homepage: "https://2captcha.com",
      apiReference: "https://2captcha.com/api-docs",
    },
    provider: { name: "2Captcha", url: "https://2captcha.com" },
  },
  {
    id: "assemblyai",
    url: "https://www.assemblyai.com",
    integration: "third-party",
    tags: ["transcription", "speech-to-text", "audio", "openrouter"],
    provider: { name: "AssemblyAI", url: "https://www.assemblyai.com" },
  },
  {
    id: "elevenlabs",
    url: "https://elevenlabs.io",
    integration: "third-party",
    tags: ["tts", "speech", "music", "audio", "openrouter"],
    provider: { name: "ElevenLabs", url: "https://elevenlabs.io" },
  },
  {
    id: "fish-audio",
    url: "https://fish.audio",
    integration: "third-party",
    tags: ["tts", "speech", "audio", "openrouter"],
    provider: { name: "Fish Audio", url: "https://fish.audio" },
  },
  {
    id: "heygen",
    url: "https://www.heygen.com",
    integration: "third-party",
    tags: ["tts", "speech", "avatar", "openrouter"],
    provider: { name: "HeyGen", url: "https://www.heygen.com" },
  },
  {
    id: "kling",
    url: "https://klingai.com",
    integration: "third-party",
    tags: ["video", "video-generation", "openrouter"],
    provider: { name: "Kling AI", url: "https://klingai.com" },
  },
  {
    id: "microsoft-ai",
    url: "https://microsoft.ai",
    integration: "third-party",
    tags: ["tts", "speech", "audio", "openrouter"],
    provider: { name: "Microsoft AI", url: "https://microsoft.ai" },
  },
];
