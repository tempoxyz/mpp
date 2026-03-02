/**
 * MPP Service Registry
 *
 * Edit this file to add or modify services.
 * Run `node scripts/generate-discovery.ts` to regenerate discovery.json.
 */

// --- Shared constants ---
export const USDC = "0x20c000000000000000000000b9537d11c60e8b50";
export const TEMPO_RECIPIENT = "0xB48141c3Da5030deF992bDc686f0e9A8729206b6";
export const MPP_REALM = "mpp.tempo.xyz";

// --- Types ---
export const CATEGORIES = [
  "ai",
  "blockchain",
  "compute",
  "data",
  "media",
  "search",
  "social",
  "storage",
  "web",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const INTEGRATIONS = ["first-party", "third-party"] as const;
export type Integration = (typeof INTEGRATIONS)[number];

export const STATUSES = [
  "active",
  "beta",
  "deprecated",
  "maintenance",
] as const;
export type Status = (typeof STATUSES)[number];

export const INTENTS = ["charge", "session"] as const;
export type Intent = (typeof INTENTS)[number];

export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface PaymentDefaults {
  /** Payment method identifier (e.g. "tempo") */
  method: string;
  /** Currency identifier (e.g. TIP-20 token address for Tempo, ISO 4217 for fiat) */
  currency: string;
  /** Decimal places for the currency (e.g. 6 for USDC) */
  decimals: number;
  /** Payment recipient address or identifier */
  recipient: string;
}

/** Common payment defaults for Tempo USDC services */
export const TEMPO_PAYMENT: PaymentDefaults = {
  method: "tempo",
  currency: USDC,
  decimals: 6,
  recipient: TEMPO_RECIPIENT,
};

export interface EndpointDef {
  /** Route string: "METHOD /path" (without service slug prefix) */
  route: string;
  /** Description of what this endpoint does */
  desc: string;
  /** Price in base units. Omit for free or dynamic endpoints. */
  amount?: string;
  /** Dynamic pricing — price computed at runtime based on model/tokens/size */
  dynamic?: true;
  /** Override service-level default intent */
  intent?: Intent;
  /** Unit type (e.g., "request") */
  unitType?: string;
  /** Explicit docs URL override, or false to suppress auto-generated URL */
  docs?: string | false;
}

export interface ServiceDef {
  id: string;
  name: string;
  /** Upstream provider URL (e.g. "https://api.openai.com") */
  url: string;
  /** MPP service URL — where this service is accessed through the proxy (e.g. "https://openai.mpp.tempo.xyz") */
  serviceUrl: string;
  description: string;
  icon?: string;
  categories: Category[];
  integration: Integration;
  tags: string[];
  status?: Status;
  docs?: { homepage?: string; llmsTxt?: string; apiReference?: string };
  provider?: { name: string; url: string };
  /** Payment realm (typically the proxy host) */
  realm: string;
  /** Default payment intent for paid endpoints in this service */
  intent: Intent;
  /** Payment method, currency, decimals, and recipient for this service's paid endpoints */
  payment: PaymentDefaults;
  /** Base URL for auto-generating per-endpoint docs links */
  docsBase?: string;
  endpoints: EndpointDef[];
}

// prettier-ignore
export const services: ServiceDef[] = [
  // ── AgentMail ──────────────────────────────────────────────────────────
  {
    id: "agentmail",
    name: "AgentMail",
    url: "https://api.agentmail.to",
    serviceUrl: `https://agentmail.${MPP_REALM}`,
    description:
      "Email inboxes for AI agents — create, send, receive, and manage email programmatically.",
    categories: ["ai", "social"],
    integration: "third-party",
    tags: ["email", "inbox", "agents", "messaging"],
    docs: {
      homepage: "https://docs.agentmail.to",
      llmsTxt: "https://docs.agentmail.to/llms.txt",
    },
    provider: { name: "AgentMail", url: "https://agentmail.to" },
    realm: MPP_REALM,
    intent: "charge",
    payment: TEMPO_PAYMENT,
    docsBase: "https://docs.agentmail.to/llms.txt",
    endpoints: [
      { route: "GET /v0/inboxes", desc: "List inboxes", amount: "5000" },
      { route: "POST /v0/inboxes", desc: "Create an inbox", amount: "5000" },
      {
        route: "GET /v0/inboxes/:inboxId",
        desc: "Get inbox details",
        amount: "5000",
      },
      {
        route: "PATCH /v0/inboxes/:inboxId",
        desc: "Update an inbox",
        amount: "5000",
      },
      {
        route: "DELETE /v0/inboxes/:inboxId",
        desc: "Delete an inbox",
        amount: "5000",
      },
      {
        route: "GET /v0/inboxes/:inboxId/threads",
        desc: "List threads in inbox",
        amount: "5000",
      },
      {
        route: "GET /v0/inboxes/:inboxId/threads/:threadId",
        desc: "Get thread details",
        amount: "5000",
      },
      {
        route:
          "GET /v0/inboxes/:inboxId/threads/:threadId/attachments/:attachmentId",
        desc: "Get thread attachment",
        amount: "5000",
      },
      {
        route: "DELETE /v0/inboxes/:inboxId/threads/:threadId",
        desc: "Delete a thread",
        amount: "5000",
      },
      {
        route: "GET /v0/inboxes/:inboxId/messages",
        desc: "List messages in inbox",
        amount: "5000",
      },
      {
        route: "GET /v0/inboxes/:inboxId/messages/:messageId",
        desc: "Get message details",
        amount: "5000",
      },
      {
        route:
          "GET /v0/inboxes/:inboxId/messages/:messageId/attachments/:attachmentId",
        desc: "Get message attachment",
        amount: "5000",
      },
      {
        route: "GET /v0/inboxes/:inboxId/messages/:messageId/raw",
        desc: "Get raw message",
        amount: "5000",
      },
      {
        route: "POST /v0/inboxes/:inboxId/messages",
        desc: "Send a message",
        amount: "10000",
      },
      {
        route: "POST /v0/inboxes/:inboxId/messages/send",
        desc: "Send a message",
        amount: "10000",
      },
      {
        route: "POST /v0/inboxes/:inboxId/messages/:messageId/reply",
        desc: "Reply to a message",
        amount: "10000",
      },
      {
        route: "POST /v0/inboxes/:inboxId/messages/:messageId/reply-all",
        desc: "Reply all to a message",
        amount: "10000",
      },
      {
        route: "POST /v0/inboxes/:inboxId/messages/:messageId/forward",
        desc: "Forward a message",
        amount: "10000",
      },
      {
        route: "PATCH /v0/inboxes/:inboxId/messages/:messageId",
        desc: "Update a message",
        amount: "5000",
      },
      {
        route: "GET /v0/inboxes/:inboxId/drafts",
        desc: "List drafts in inbox",
        amount: "5000",
      },
      {
        route: "GET /v0/inboxes/:inboxId/drafts/:draftId",
        desc: "Get draft details",
        amount: "5000",
      },
      {
        route:
          "GET /v0/inboxes/:inboxId/drafts/:draftId/attachments/:attachmentId",
        desc: "Get draft attachment",
        amount: "5000",
      },
      {
        route: "POST /v0/inboxes/:inboxId/drafts",
        desc: "Create a draft",
        amount: "5000",
      },
      {
        route: "PATCH /v0/inboxes/:inboxId/drafts/:draftId",
        desc: "Update a draft",
        amount: "5000",
      },
      {
        route: "POST /v0/inboxes/:inboxId/drafts/:draftId/send",
        desc: "Send a draft",
        amount: "10000",
      },
      {
        route: "DELETE /v0/inboxes/:inboxId/drafts/:draftId",
        desc: "Delete a draft",
        amount: "5000",
      },
      {
        route: "GET /v0/inboxes/:inboxId/metrics",
        desc: "Get inbox metrics",
        amount: "5000",
      },
      {
        route: "GET /v0/threads",
        desc: "List threads across all inboxes",
        amount: "5000",
      },
      {
        route: "GET /v0/threads/:threadId",
        desc: "Get thread details",
        amount: "5000",
      },
      {
        route: "GET /v0/threads/:threadId/attachments/:attachmentId",
        desc: "Get thread attachment",
        amount: "5000",
      },
      {
        route: "GET /v0/drafts",
        desc: "List drafts across all inboxes",
        amount: "5000",
      },
      {
        route: "GET /v0/drafts/:draftId",
        desc: "Get draft details",
        amount: "5000",
      },
      {
        route: "GET /v0/drafts/:draftId/attachments/:attachmentId",
        desc: "Get draft attachment",
        amount: "5000",
      },
      { route: "GET /v0/domains", desc: "List domains", amount: "5000" },
      { route: "POST /v0/domains", desc: "Create a domain", amount: "10000" },
      {
        route: "GET /v0/domains/:domainId",
        desc: "Get domain details",
        amount: "5000",
      },
      {
        route: "GET /v0/domains/:domainId/zone-file",
        desc: "Get domain zone file",
        amount: "5000",
      },
      {
        route: "DELETE /v0/domains/:domainId",
        desc: "Delete a domain",
        amount: "10000",
      },
      {
        route: "POST /v0/domains/:domainId/verify",
        desc: "Verify a domain",
        amount: "10000",
      },
      { route: "GET /v0/webhooks", desc: "List webhooks", amount: "5000" },
      { route: "POST /v0/webhooks", desc: "Create a webhook", amount: "5000" },
      {
        route: "GET /v0/webhooks/:webhookId",
        desc: "Get webhook details",
        amount: "5000",
      },
      {
        route: "PATCH /v0/webhooks/:webhookId",
        desc: "Update a webhook",
        amount: "5000",
      },
      {
        route: "DELETE /v0/webhooks/:webhookId",
        desc: "Delete a webhook",
        amount: "5000",
      },
      { route: "GET /v0/metrics", desc: "List metrics", amount: "5000" },
      { route: "GET /v0/api-keys", desc: "List API keys", amount: "5000" },
      { route: "POST /v0/api-keys", desc: "Create an API key", amount: "5000" },
      {
        route: "DELETE /v0/api-keys/:keyId",
        desc: "Delete an API key",
        amount: "5000",
      },
      { route: "GET /v0/pods", desc: "List pods", amount: "5000" },
      { route: "POST /v0/pods", desc: "Create a pod", amount: "5000" },
      { route: "GET /v0/pods/:podId", desc: "Get pod details", amount: "5000" },
      { route: "DELETE /v0/pods/:podId", desc: "Delete a pod", amount: "5000" },
      {
        route: "GET /v0/pods/:podId/inboxes",
        desc: "List pod inboxes",
        amount: "5000",
      },
      {
        route: "POST /v0/pods/:podId/inboxes",
        desc: "Create pod inbox",
        amount: "5000",
      },
      {
        route: "GET /v0/pods/:podId/inboxes/:inboxId",
        desc: "Get pod inbox",
        amount: "5000",
      },
      {
        route: "DELETE /v0/pods/:podId/inboxes/:inboxId",
        desc: "Delete pod inbox",
        amount: "5000",
      },
      {
        route: "GET /v0/pods/:podId/threads",
        desc: "List pod threads",
        amount: "5000",
      },
      {
        route: "GET /v0/pods/:podId/threads/:threadId",
        desc: "Get pod thread",
        amount: "5000",
      },
      {
        route:
          "GET /v0/pods/:podId/threads/:threadId/attachments/:attachmentId",
        desc: "Get pod thread attachment",
        amount: "5000",
      },
      {
        route: "GET /v0/pods/:podId/drafts",
        desc: "List pod drafts",
        amount: "5000",
      },
      {
        route: "GET /v0/pods/:podId/drafts/:draftId",
        desc: "Get pod draft",
        amount: "5000",
      },
      {
        route: "GET /v0/pods/:podId/drafts/:draftId/attachments/:attachmentId",
        desc: "Get pod draft attachment",
        amount: "5000",
      },
      {
        route: "GET /v0/pods/:podId/domains",
        desc: "List pod domains",
        amount: "5000",
      },
      {
        route: "POST /v0/pods/:podId/domains",
        desc: "Create pod domain",
        amount: "10000",
      },
      {
        route: "DELETE /v0/pods/:podId/domains/:domainId",
        desc: "Delete pod domain",
        amount: "10000",
      },
      {
        route: "GET /v0/organizations",
        desc: "Get organization details",
        amount: "5000",
      },
    ],
  },

  // ── Alchemy ────────────────────────────────────────────────────────────
  {
    id: "alchemy",
    name: "Alchemy",
    url: "https://eth-mainnet.g.alchemy.com",
    serviceUrl: `https://alchemy.${MPP_REALM}`,
    description:
      "Blockchain data platform with JSON-RPC and NFT APIs across 80+ chains.",
    categories: ["blockchain", "data"],
    integration: "third-party",
    tags: ["rpc", "json-rpc", "nft", "evm", "multichain"],
    docs: {
      homepage: "https://www.alchemy.com/docs",
      llmsTxt: "https://www.alchemy.com/docs/llms.txt",
    },
    provider: { name: "Alchemy", url: "https://alchemy.com" },
    realm: MPP_REALM,
    intent: "charge",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/alchemy/llms.txt",
    endpoints: [
      {
        route: "POST /:network/v2",
        desc: "JSON-RPC call (eth_*, alchemy_*)",
        amount: "100",
      },
      {
        route: "GET /:network/nft/v3/:endpoint",
        desc: "NFT API v3",
        amount: "500",
      },
      {
        route: "POST /:network/nft/v3/:endpoint",
        desc: "NFT API v3",
        amount: "500",
      },
    ],
  },

  // ── Anthropic ──────────────────────────────────────────────────────────
  {
    id: "anthropic",
    name: "Anthropic",
    url: "https://api.anthropic.com",
    serviceUrl: `https://anthropic.${MPP_REALM}`,
    description:
      "Claude chat completions (Sonnet, Opus, Haiku) via native and OpenAI-compatible APIs.",
    categories: ["ai"],
    integration: "third-party",
    tags: ["llm", "claude", "sonnet", "opus", "haiku", "chat"],
    docs: {
      homepage: "https://docs.anthropic.com",
      llmsTxt: "https://docs.anthropic.com/llms.txt",
      apiReference: "https://docs.anthropic.com/en/api",
    },
    provider: { name: "Anthropic", url: "https://anthropic.com" },
    realm: MPP_REALM,
    intent: "session",
    payment: TEMPO_PAYMENT,
    endpoints: [
      {
        route: "POST /v1/messages",
        desc: "Create messages with Claude (Sonnet, Opus, Haiku) - price varies by model",
        dynamic: true,
      },
      {
        route: "POST /v1/chat/completions",
        desc: "OpenAI-compatible chat completions (auto-converted to Anthropic format)",
        dynamic: true,
      },
    ],
  },

  // ── Browserbase ────────────────────────────────────────────────────────
  {
    id: "browserbase",
    name: "Browserbase",
    url: "https://api.browserbase.com",
    serviceUrl: `https://browserbase.${MPP_REALM}`,
    description: "Headless browser sessions for web scraping and automation.",
    categories: ["web", "compute"],
    integration: "third-party",
    tags: ["browser", "scraping", "automation", "headless"],
    docs: {
      homepage: "https://docs.browserbase.com",
      llmsTxt: "https://docs.browserbase.com/llms.txt",
    },
    provider: { name: "Browserbase", url: "https://browserbase.com" },
    realm: MPP_REALM,
    intent: "charge",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/browserbase/llms.txt",
    endpoints: [
      {
        route: "POST /v1/sessions",
        desc: "Create a browser session",
        amount: "120000",
      },
      {
        route: "POST /v1/sessions/:id/extend",
        desc: "Add more time to session",
        amount: "120000",
      },
    ],
  },

  // ── Codex ──────────────────────────────────────────────────────────────
  {
    id: "codex",
    name: "Codex",
    url: "https://graph.codex.io",
    serviceUrl: `https://codex.${MPP_REALM}`,
    description:
      "GraphQL API for DeFi and blockchain data across 80+ networks.",
    categories: ["blockchain", "data"],
    integration: "third-party",
    tags: ["graphql", "defi", "tokens", "trades", "nft"],
    docs: {
      homepage: "https://docs.codex.io",
      llmsTxt: "https://docs.codex.io/llms.txt",
    },
    provider: { name: "Codex", url: "https://codex.io" },
    realm: MPP_REALM,
    intent: "charge",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/codex_io/llms.txt",
    endpoints: [
      {
        route: "POST /graphql",
        desc: "GraphQL query (token data, trades, liquidity, NFTs, wallets)",
        amount: "350",
      },
    ],
  },

  // ── DigitalOcean ───────────────────────────────────────────────────────
  {
    id: "digitalocean",
    name: "DigitalOcean",
    url: "https://api.digitalocean.com",
    serviceUrl: `https://digitalocean.${MPP_REALM}`,
    description:
      "Cloud infrastructure for 1-click deploy of hosted MPP Agents on DigitalOcean Droplets.",
    categories: ["compute"],
    integration: "third-party",
    tags: ["cloud", "droplets", "vps", "infrastructure"],
    docs: {
      homepage: "https://docs.digitalocean.com",
      llmsTxt: "https://docs.digitalocean.com/llms.txt",
    },
    provider: { name: "DigitalOcean", url: "https://digitalocean.com" },
    realm: MPP_REALM,
    intent: "session",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/digitalocean/llms.txt",
    endpoints: [
      { route: "POST /v2/droplets", desc: "Create a Droplet", dynamic: true },
      { route: "GET /v2/droplets", desc: "List all Droplets" },
      { route: "GET /v2/droplets/:id", desc: "Get Droplet details" },
      {
        route: "DELETE /v2/droplets/:id",
        desc: "Delete a Droplet",
        dynamic: true,
      },
      {
        route: "POST /v2/droplets/:id/actions",
        desc: "Run a Droplet action",
        dynamic: true,
      },
      { route: "POST /v2/account/keys", desc: "Add an SSH key", dynamic: true },
      { route: "GET /v2/account/keys", desc: "List all SSH keys" },
      { route: "GET /v2/account/keys/:id", desc: "Get SSH key details" },
      { route: "DELETE /v2/account/keys/:id", desc: "Delete an SSH key" },
      { route: "GET /v2/regions", desc: "List available regions" },
      { route: "GET /v2/sizes", desc: "List available Droplet sizes" },
      { route: "GET /v2/images", desc: "List available images" },
    ],
  },

  // ── ElevenLabs ─────────────────────────────────────────────────────────
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    url: "https://api.elevenlabs.io",
    serviceUrl: `https://elevenlabs.${MPP_REALM}`,
    description: "Text-to-speech, speech-to-text, and voice cloning.",
    categories: ["ai", "media"],
    integration: "third-party",
    tags: ["tts", "stt", "voice", "audio", "speech"],
    docs: {
      homepage: "https://elevenlabs.io/docs",
      llmsTxt: "https://elevenlabs.io/docs/llms.txt",
      apiReference: "https://elevenlabs.io/docs/api-reference",
    },
    provider: { name: "ElevenLabs", url: "https://elevenlabs.io" },
    realm: MPP_REALM,
    intent: "charge",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/elevenlabs_io/llms.txt",
    endpoints: [
      {
        route: "POST /v1/text-to-speech/:voiceId",
        desc: "Convert text to speech audio",
        amount: "30000",
      },
      {
        route: "POST /v1/text-to-speech/:voiceId/stream",
        desc: "Stream text-to-speech audio",
        amount: "30000",
      },
      {
        route: "POST /v1/speech-to-text",
        desc: "Transcribe audio to text (Scribe)",
        amount: "50000",
      },
      {
        route: "GET /v1/speech-to-text/transcripts/:transcriptionId",
        desc: "Get a transcript by ID",
      },
      { route: "GET /v1/voices", desc: "List available voices" },
    ],
  },

  // ── Exa ────────────────────────────────────────────────────────────────
  {
    id: "exa",
    name: "Exa",
    url: "https://api.exa.ai",
    serviceUrl: `https://exa.${MPP_REALM}`,
    description: "AI-powered web search, content retrieval, and answers.",
    categories: ["search", "ai"],
    integration: "third-party",
    tags: ["search", "web", "content", "ai-search"],
    docs: {
      homepage: "https://docs.exa.ai",
      llmsTxt: "https://docs.exa.ai/llms.txt",
    },
    provider: { name: "Exa", url: "https://exa.ai" },
    realm: MPP_REALM,
    intent: "charge",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/exa_ai/llms.txt",
    endpoints: [
      { route: "POST /search", desc: "Search the web", amount: "5000" },
      { route: "POST /contents", desc: "Get page contents", amount: "5000" },
      {
        route: "POST /findSimilar",
        desc: "Find similar pages",
        amount: "5000",
      },
      {
        route: "POST /answer",
        desc: "Get AI-powered answers",
        amount: "10000",
      },
    ],
  },

  // ── fal.ai ─────────────────────────────────────────────────────────────
  {
    id: "fal",
    name: "fal.ai",
    url: "https://fal.run",
    serviceUrl: `https://fal.${MPP_REALM}`,
    description:
      "Image, video, and audio generation with 600+ models (Flux, SD, Recraft, Grok).",
    categories: ["ai", "media"],
    integration: "third-party",
    tags: ["image", "video", "flux", "stable-diffusion", "grok", "generation"],
    docs: {
      homepage: "https://fal.ai/docs",
      llmsTxt: "https://fal.ai/docs/llms.txt",
    },
    provider: { name: "fal.ai", url: "https://fal.ai" },
    realm: MPP_REALM,
    intent: "charge",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/fal_ai/llms.txt",
    endpoints: [
      {
        route: "POST /fal-ai/flux/dev",
        desc: "FLUX.1 [dev] - High-quality text-to-image generation",
        amount: "25000",
      },
      {
        route: "POST /fal-ai/flux/schnell",
        desc: "FLUX.1 [schnell] - Fast text-to-image (1-4 steps)",
        amount: "3000",
      },
      {
        route: "POST /fal-ai/flux-pro/v1.1",
        desc: "FLUX1.1 [pro] - Professional-grade image generation",
        amount: "35000",
      },
      {
        route: "POST /fal-ai/flux-pro/v1.1-ultra",
        desc: "FLUX1.1 [pro] ultra - Up to 2K resolution with improved realism",
        amount: "60000",
      },
      {
        route: "POST /fal-ai/stable-diffusion-v35-large",
        desc: "Stable Diffusion 3.5 Large - MMDiT text-to-image",
        amount: "35000",
      },
      {
        route: "POST /fal-ai/fast-sdxl",
        desc: "Fast SDXL - Quick Stable Diffusion XL generation",
        amount: "3000",
      },
      {
        route: "POST /fal-ai/recraft-v3",
        desc: "Recraft V3 - SOTA text-to-image with long text and vector art",
        amount: "40000",
      },
      {
        route: "POST /xai/grok-imagine-image",
        desc: "Grok Imagine - xAI image generation",
        amount: "40000",
      },
      {
        route: "POST /xai/grok-imagine-image/edit",
        desc: "Grok Imagine Edit - xAI image editing",
        amount: "40000",
      },
      {
        route: "POST /fal-ai/stable-video",
        desc: "Stable Video Diffusion - Image-to-video generation",
        amount: "70000",
      },
      {
        route: "POST /fal-ai/minimax/video-01",
        desc: "MiniMax Video-01 - Text/image to video generation",
        amount: "70000",
      },
      {
        route: "POST /fal-ai/minimax/video-01-live",
        desc: "MiniMax Video-01 Live - Real-time video generation",
        amount: "70000",
      },
      {
        route: "POST /xai/grok-imagine-video/text-to-video",
        desc: "Grok Imagine Video - xAI text-to-video generation",
        amount: "300000",
      },
      {
        route: "POST /xai/grok-imagine-video/image-to-video",
        desc: "Grok Imagine Video - xAI image-to-video generation",
        amount: "300000",
      },
      {
        route: "POST /fal-ai/:model",
        desc: "fal.ai model generation",
        amount: "20000",
      },
      {
        route: "POST /fal-ai/:namespace/:model",
        desc: "fal.ai model generation (with namespace)",
        amount: "20000",
      },
    ],
  },

  // ── Firecrawl ──────────────────────────────────────────────────────────
  {
    id: "firecrawl",
    name: "Firecrawl",
    url: "https://api.firecrawl.dev",
    serviceUrl: `https://firecrawl.${MPP_REALM}`,
    description:
      "Web scraping, crawling, and structured data extraction for LLMs.",
    categories: ["web", "data"],
    integration: "third-party",
    tags: ["scraping", "crawling", "extraction", "llm"],
    docs: {
      homepage: "https://docs.firecrawl.dev",
      llmsTxt: "https://docs.firecrawl.dev/llms.txt",
    },
    provider: { name: "Firecrawl", url: "https://firecrawl.dev" },
    realm: MPP_REALM,
    intent: "charge",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/firecrawl_dev/llms.txt",
    endpoints: [
      { route: "POST /v1/scrape", desc: "Scrape a URL", amount: "2000" },
      { route: "POST /v1/crawl", desc: "Crawl a website", amount: "5000" },
      { route: "POST /v1/map", desc: "Map website URLs", amount: "2000" },
      { route: "POST /v1/search", desc: "Search the web", amount: "4000" },
      {
        route: "POST /v1/extract",
        desc: "Extract structured data",
        amount: "5000",
      },
    ],
  },

  // ── Google Gemini ──────────────────────────────────────────────────────
  {
    id: "gemini",
    name: "Google Gemini",
    url: "https://generativelanguage.googleapis.com",
    serviceUrl: `https://gemini.${MPP_REALM}`,
    description:
      "Gemini text generation, Veo video, and Nano Banana image generation with model-tier pricing.",
    categories: ["ai", "media"],
    integration: "third-party",
    tags: ["llm", "gemini", "veo", "imagen", "video", "multimodal"],
    docs: { homepage: "https://ai.google.dev/docs" },
    provider: { name: "Google", url: "https://ai.google.dev" },
    realm: MPP_REALM,
    intent: "session",
    payment: TEMPO_PAYMENT,
    endpoints: [
      {
        route: "POST /:version/models/*",
        desc: "Generate content (Gemini, Veo, Imagen, etc.) - price varies by model",
        amount: "500",
        unitType: "request",
      },
      {
        route: "GET /:version/operations/*",
        desc: "Poll async operation status",
        amount: "100",
        unitType: "request",
      },
      {
        route: "POST /:version/files",
        desc: "Upload file for multimodal input",
        amount: "1000",
        unitType: "request",
      },
      { route: "GET /:version/models", desc: "List available models (free)" },
      { route: "GET /:version/models/*", desc: "Get model details (free)" },
      { route: "GET /:version/files", desc: "List uploaded files (free)" },
      { route: "GET /:version/files/*", desc: "Get file details (free)" },
      {
        route: "DELETE /:version/files/*",
        desc: "Delete an uploaded file (free)",
      },
      {
        route: "GET /:version/cachedContents",
        desc: "List cached contents (free)",
      },
      {
        route: "GET /:version/cachedContents/*",
        desc: "Get cached content details (free)",
      },
    ],
  },

  // ── Modal ──────────────────────────────────────────────────────────────
  {
    id: "modal",
    name: "Modal",
    url: "https://api.modal.com",
    serviceUrl: `https://modal.${MPP_REALM}`,
    description:
      "Serverless GPU compute for sandboxed code execution and AI/ML workloads.",
    categories: ["compute"],
    integration: "third-party",
    tags: ["gpu", "serverless", "sandbox", "compute"],
    docs: {
      homepage: "https://modal.com/docs",
      llmsTxt: "https://modal.com/llms.txt",
    },
    provider: { name: "Modal", url: "https://modal.com" },
    realm: MPP_REALM,
    intent: "session",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/modal/llms.txt",
    endpoints: [
      {
        route: "POST /sandbox/create",
        desc: "Create a sandbox for code execution",
        dynamic: true,
      },
      { route: "POST /sandbox/exec", desc: "Execute command in sandbox" },
      { route: "POST /sandbox/status", desc: "Get sandbox status" },
      { route: "POST /sandbox/terminate", desc: "Terminate a sandbox" },
    ],
  },

  // ── OpenAI ─────────────────────────────────────────────────────────────
  {
    id: "openai",
    name: "OpenAI",
    url: "https://api.openai.com",
    serviceUrl: `https://openai.${MPP_REALM}`,
    description:
      "Chat completions, embeddings, image generation, and audio with model-tier pricing.",
    icon: "https://mpp.tempo.xyz/icons/openai.svg",
    categories: ["ai", "media"],
    integration: "third-party",
    tags: ["llm", "gpt-4o", "dall-e", "whisper", "tts", "embeddings", "chat"],
    docs: {
      homepage: "https://platform.openai.com/docs",
      llmsTxt: "https://developers.openai.com/api/docs/llms.txt",
      apiReference: "https://platform.openai.com/docs/api-reference",
    },
    provider: { name: "OpenAI", url: "https://openai.com" },
    realm: MPP_REALM,
    intent: "charge",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/platform_openai/llms.txt",
    endpoints: [
      {
        route: "POST /v1/responses",
        desc: "Responses API (Codex, GPT-4o, etc.) - price varies by model",
        dynamic: true,
        intent: "session",
      },
      {
        route: "POST /v1/chat/completions",
        desc: "Chat completions (GPT-4o, GPT-4, o1, etc.) - price varies by model",
        dynamic: true,
        intent: "session",
      },
      {
        route: "POST /v1/embeddings",
        desc: "Create embeddings",
        amount: "100",
      },
      {
        route: "POST /v1/images/generations",
        desc: "Generate images with DALL-E",
        amount: "50000",
      },
      {
        route: "POST /v1/audio/transcriptions",
        desc: "Transcribe audio with Whisper",
        amount: "10000",
      },
      {
        route: "POST /v1/audio/speech",
        desc: "Text-to-speech",
        amount: "20000",
      },
    ],
  },

  // ── OpenRouter ─────────────────────────────────────────────────────────
  {
    id: "openrouter",
    name: "OpenRouter",
    url: "https://openrouter.ai/api",
    serviceUrl: `https://openrouter.${MPP_REALM}`,
    description: "Unified API for 100+ LLMs with live per-model pricing.",
    categories: ["ai"],
    integration: "third-party",
    tags: ["llm", "unified", "multi-model", "chat"],
    docs: {
      homepage: "https://openrouter.ai/docs",
      llmsTxt: "https://openrouter.ai/docs/llms.txt",
    },
    provider: { name: "OpenRouter", url: "https://openrouter.ai" },
    realm: MPP_REALM,
    intent: "session",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/openrouter_ai/llms.txt",
    endpoints: [
      {
        route: "POST /v1/chat/completions",
        desc: "Chat completions (GPT-4, Claude, Llama, etc.) - price varies by model",
        dynamic: true,
      },
    ],
  },

  // ── Parallel ───────────────────────────────────────────────────────────
  {
    id: "parallel",
    name: "Parallel",
    url: "https://api.parallel.ai",
    serviceUrl: `https://parallel.${MPP_REALM}`,
    description:
      "Web search, page extraction, and web-grounded chat completions.",
    categories: ["search", "ai"],
    integration: "third-party",
    tags: ["search", "web", "extraction", "chat"],
    docs: { llmsTxt: "https://parallel.ai/llms.txt" },
    provider: { name: "Parallel", url: "https://parallel.ai" },
    realm: MPP_REALM,
    intent: "session",
    payment: TEMPO_PAYMENT,
    endpoints: [
      {
        route: "POST /v1beta/search",
        desc: "Search the web",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /v1beta/extract",
        desc: "Extract page content",
        amount: "1000",
        unitType: "request",
      },
      {
        route: "POST /chat/completions",
        desc: "Web-grounded chat completions - price varies by model",
        dynamic: true,
      },
    ],
  },

  // ── Tempo RPC ──────────────────────────────────────────────────────────
  {
    id: "rpc",
    name: "Tempo RPC",
    url: "https://rpc.tempo.xyz",
    serviceUrl: `https://rpc.${MPP_REALM}`,
    description: "Tempo blockchain JSON-RPC access (mainnet and testnet).",
    categories: ["blockchain"],
    integration: "first-party",
    tags: ["rpc", "json-rpc", "evm", "tempo", "node"],
    docs: {
      homepage: "https://docs.tempo.xyz",
      llmsTxt: "https://docs.tempo.xyz/llms.txt",
    },
    provider: { name: "Tempo", url: "https://tempo.xyz" },
    realm: MPP_REALM,
    intent: "session",
    payment: TEMPO_PAYMENT,
    endpoints: [
      {
        route: "POST /",
        desc: "JSON-RPC calls - $0.001 per call",
        amount: "1000",
        unitType: "request",
      },
    ],
  },

  // ── Object Storage ─────────────────────────────────────────────────────
  {
    id: "storage",
    name: "Object Storage",
    url: "https://mpp.tempo.xyz/storage",
    serviceUrl: `https://storage.${MPP_REALM}`,
    description:
      "S3/R2-compatible object storage with dynamic per-size pricing.",
    categories: ["storage"],
    integration: "first-party",
    tags: ["s3", "r2", "objects", "blobs", "files"],
    docs: { homepage: "https://developers.cloudflare.com/r2/" },
    provider: { name: "Tempo", url: "https://tempo.xyz" },
    realm: MPP_REALM,
    intent: "charge",
    payment: TEMPO_PAYMENT,
    endpoints: [
      {
        route: "GET /:key",
        desc: "Download object ($0.001 base + $0.01/MB)",
        dynamic: true,
        intent: "session",
      },
      {
        route: "PUT /:key",
        desc: "Upload object ($0.001 base + $0.01/MB, max 100MB)",
        dynamic: true,
        intent: "session",
      },
      { route: "DELETE /:key", desc: "Delete object", amount: "100" },
      { route: "GET /", desc: "List objects", amount: "100" },
      {
        route: "POST /:key",
        desc: "Initiate/complete multipart upload",
        amount: "100",
      },
    ],
  },

  // ── Twitter/X ──────────────────────────────────────────────────────────
  {
    id: "twitter",
    name: "Twitter/X",
    url: "https://api.x.com",
    serviceUrl: `https://twitter.${MPP_REALM}`,
    description: "X API v2 for tweets, users, and search.",
    categories: ["social", "data"],
    integration: "third-party",
    tags: ["twitter", "x", "tweets", "social", "search"],
    docs: { homepage: "https://developer.x.com/en/docs" },
    provider: { name: "X Corp", url: "https://x.com" },
    realm: MPP_REALM,
    intent: "charge",
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/x_x-api/llms.txt",
    endpoints: [
      { route: "GET /2/tweets", desc: "Look up tweets by ID", amount: "5000" },
      {
        route: "GET /2/tweets/:id",
        desc: "Look up a single tweet",
        amount: "5000",
      },
      { route: "POST /2/tweets", desc: "Create a new tweet", amount: "5000" },
      {
        route: "GET /2/users/:id",
        desc: "Look up a user by ID",
        amount: "5000",
      },
      {
        route: "GET /2/users/by/username/:username",
        desc: "Look up user by username",
        amount: "5000",
      },
      {
        route: "GET /2/tweets/search/recent",
        desc: "Search recent tweets",
        amount: "10000",
      },
      {
        route: "GET /2/users/:id/tweets",
        desc: "Get user tweet timeline",
        amount: "5000",
      },
    ],
  },

  // ── StableEmail ────────────────────────────────────────────────────────
  {
    id: "stableemail",
    name: "StableEmail",
    url: "https://stableemail.dev",
    serviceUrl: "https://stableemail.dev",
    description:
      "Pay-per-send email delivery, forwarding inboxes, and custom subdomains — no API keys or accounts.",
    categories: ["social"],
    integration: "first-party",
    tags: ["email", "send", "inbox", "forwarding", "subdomain"],
    docs: {
      homepage: "https://stableemail.dev",
      llmsTxt: "https://stableemail.dev/llms.txt",
    },
    provider: { name: "Merit Systems", url: "https://stableemail.dev" },
    realm: "stableemail.dev",
    intent: "charge",
    payment: TEMPO_PAYMENT,
    endpoints: [
      {
        route: "POST /api/send",
        desc: "Send email from relay address",
        amount: "20000",
      },
      {
        route: "POST /api/subdomain/buy",
        desc: "Purchase a custom email subdomain",
        amount: "5000000",
      },
      {
        route: "POST /api/subdomain/send",
        desc: "Send email from custom subdomain",
        amount: "5000",
      },
      {
        route: "POST /api/subdomain/signers",
        desc: "Add or remove authorized wallet signers",
      },
      {
        route: "POST /api/subdomain/update",
        desc: "Update subdomain settings (catch-all forwarding)",
      },
      {
        route: "GET /api/subdomain/status",
        desc: "Check DNS/SES verification status",
      },
      {
        route: "POST /api/subdomain/inbox/create",
        desc: "Create inbox on subdomain",
        amount: "250000",
      },
      {
        route: "POST /api/subdomain/inbox/list",
        desc: "List subdomain inboxes",
      },
      {
        route: "POST /api/subdomain/inbox/update",
        desc: "Update subdomain inbox settings",
      },
      {
        route: "POST /api/subdomain/inbox/delete",
        desc: "Delete inbox from subdomain",
      },
      {
        route: "POST /api/subdomain/inbox/messages",
        desc: "List subdomain inbox messages",
        amount: "1000",
      },
      {
        route: "POST /api/subdomain/inbox/messages/read",
        desc: "Read a subdomain inbox message",
        amount: "1000",
      },
      {
        route: "POST /api/subdomain/inbox/messages/delete",
        desc: "Delete a subdomain inbox message",
      },
      {
        route: "POST /api/inbox/buy",
        desc: "Buy a forwarding inbox (30 days)",
        amount: "1000000",
      },
      {
        route: "POST /api/inbox/topup",
        desc: "Extend inbox 30 days",
        amount: "1000000",
      },
      {
        route: "POST /api/inbox/topup/quarter",
        desc: "Extend inbox 90 days (save 17%)",
        amount: "2500000",
      },
      {
        route: "POST /api/inbox/topup/year",
        desc: "Extend inbox 365 days (save 34%)",
        amount: "8000000",
      },
      {
        route: "POST /api/inbox/send",
        desc: "Send email from inbox address",
        amount: "5000",
      },
      { route: "GET /api/inbox/status", desc: "Check inbox status and expiry" },
      { route: "POST /api/inbox/update", desc: "Update inbox settings" },
      {
        route: "POST /api/inbox/cancel",
        desc: "Cancel inbox and get pro-rata refund",
      },
      {
        route: "POST /api/inbox/messages",
        desc: "List messages in inbox",
        amount: "1000",
      },
      {
        route: "POST /api/inbox/messages/read",
        desc: "Read a single inbox message",
        amount: "1000",
      },
      {
        route: "POST /api/inbox/messages/delete",
        desc: "Delete an inbox message",
      },
    ],
  },

  // ── StableEnrich ───────────────────────────────────────────────────────
  {
    id: "stableenrich",
    name: "StableEnrich",
    url: "https://stableenrich.dev",
    serviceUrl: "https://stableenrich.dev",
    description:
      "Pay-per-request research APIs — people, companies, web search, scraping, places, social media, and contact enrichment.",
    categories: ["data", "search", "social"],
    integration: "first-party",
    tags: [
      "apollo",
      "exa",
      "firecrawl",
      "google-maps",
      "grok",
      "linkedin",
      "reddit",
      "enrichment",
      "research",
    ],
    docs: {
      homepage: "https://stableenrich.dev",
      llmsTxt: "https://stableenrich.dev/llms.txt",
    },
    provider: { name: "Merit Systems", url: "https://stableenrich.dev" },
    realm: "stableenrich.dev",
    intent: "charge",
    payment: TEMPO_PAYMENT,
    endpoints: [
      // Apollo
      {
        route: "POST /api/apollo/people-search",
        desc: "Find prospects by filters",
        amount: "20000",
      },
      {
        route: "POST /api/apollo/people-enrich",
        desc: "Enrich single person by email/name/domain",
        amount: "49500",
      },
      {
        route: "POST /api/apollo/org-search",
        desc: "Find companies by filters",
        amount: "20000",
      },
      {
        route: "POST /api/apollo/org-enrich",
        desc: "Enrich single company by domain",
        amount: "49500",
      },
      // Clado
      {
        route: "POST /api/clado/linkedin-scrape",
        desc: "Scrape full LinkedIn profile data",
        amount: "40000",
      },
      {
        route: "POST /api/clado/contacts-enrich",
        desc: "Enrich contact info from LinkedIn URL, email, or phone",
        amount: "200000",
      },
      // Exa
      {
        route: "POST /api/exa/search",
        desc: "Neural web search",
        amount: "10000",
      },
      {
        route: "POST /api/exa/find-similar",
        desc: "Find pages similar to a URL",
        amount: "10000",
      },
      {
        route: "POST /api/exa/contents",
        desc: "Extract content from URLs",
        amount: "2000",
      },
      {
        route: "POST /api/exa/answer",
        desc: "AI-generated answers with citations",
        amount: "10000",
      },
      // Firecrawl
      {
        route: "POST /api/firecrawl/scrape",
        desc: "Scrape a URL with full JavaScript rendering",
        amount: "12600",
      },
      {
        route: "POST /api/firecrawl/search",
        desc: "Search the web and get scraped results",
        amount: "25200",
      },
      // Google Maps
      {
        route: "POST /api/google-maps/text-search/full",
        desc: "Text search with full details",
        amount: "80000",
      },
      {
        route: "POST /api/google-maps/text-search/partial",
        desc: "Text search with basic details",
        amount: "20000",
      },
      {
        route: "POST /api/google-maps/nearby-search/full",
        desc: "Nearby search with full details",
        amount: "80000",
      },
      {
        route: "POST /api/google-maps/nearby-search/partial",
        desc: "Nearby search with basic details",
        amount: "20000",
      },
      {
        route: "GET /api/google-maps/place-details/full",
        desc: "Full place details by ID",
        amount: "50000",
      },
      {
        route: "GET /api/google-maps/place-details/partial",
        desc: "Partial place details by ID",
        amount: "20000",
      },
      // Grok (X/Twitter)
      {
        route: "POST /api/grok/x-search",
        desc: "Search X/Twitter posts",
        amount: "20000",
      },
      {
        route: "POST /api/grok/user-search",
        desc: "Search X/Twitter users",
        amount: "20000",
      },
      {
        route: "POST /api/grok/user-posts",
        desc: "Get recent posts from an X user",
        amount: "20000",
      },
      // Serper
      {
        route: "POST /api/serper/news",
        desc: "Google News search",
        amount: "40000",
      },
      {
        route: "POST /api/serper/shopping",
        desc: "Google Shopping search",
        amount: "40000",
      },
      // Reddit
      {
        route: "POST /api/reddit/search",
        desc: "Search Reddit posts",
        amount: "20000",
      },
      {
        route: "POST /api/reddit/post-comments",
        desc: "Get post details and comments",
        amount: "20000",
      },
      // Whitepages
      {
        route: "POST /api/whitepages/person-search",
        desc: "Search for people by name, phone, or address",
        amount: "440000",
      },
      {
        route: "POST /api/whitepages/property-search",
        desc: "Property ownership and resident details by address",
        amount: "440000",
      },
      // Hunter
      {
        route: "POST /api/hunter/email-verifier",
        desc: "Verify email deliverability",
        amount: "30000",
      },
      // Influencer
      {
        route: "POST /api/influencer/enrich-by-email",
        desc: "Find social profiles by email",
        amount: "400000",
      },
      {
        route: "POST /api/influencer/enrich-by-social",
        desc: "Enrich social media profile with contact info",
        amount: "400000",
      },
    ],
  },

  // ── StablePhone ────────────────────────────────────────────────────────
  {
    id: "stablephone",
    name: "StablePhone",
    url: "https://stablephone.dev",
    serviceUrl: "https://stablephone.dev",
    description:
      "AI phone calls, dedicated phone numbers, and iMessage/FaceTime lookup — pay per request.",
    categories: ["ai", "social"],
    integration: "first-party",
    tags: ["phone", "call", "voice", "ai-call", "imessage"],
    docs: {
      homepage: "https://stablephone.dev",
      llmsTxt: "https://stablephone.dev/llms.txt",
    },
    provider: { name: "Merit Systems", url: "https://stablephone.dev" },
    realm: "stablephone.dev",
    intent: "charge",
    payment: TEMPO_PAYMENT,
    endpoints: [
      {
        route: "POST /api/call",
        desc: "Make an AI phone call",
        amount: "540000",
      },
      { route: "GET /api/call/:id", desc: "Get call status and transcript" },
      {
        route: "POST /api/number",
        desc: "Buy a phone number (30 days)",
        amount: "20000000",
      },
      {
        route: "POST /api/number/topup",
        desc: "Extend a phone number 30 days",
        amount: "15000000",
      },
      { route: "GET /api/numbers", desc: "List your phone numbers" },
      {
        route: "POST /api/lookup",
        desc: "iMessage/FaceTime lookup",
        amount: "50000",
      },
      { route: "GET /api/lookup/status", desc: "Poll lookup results" },
    ],
  },

  // ── StableSocial ───────────────────────────────────────────────────────
  {
    id: "stablesocial",
    name: "StableSocial",
    url: "https://stablesocial.dev",
    serviceUrl: "https://stablesocial.dev",
    description:
      "Pay-per-request social media data from TikTok, Instagram, X/Twitter, Facebook, and Reddit.",
    categories: ["social", "data"],
    integration: "first-party",
    tags: [
      "tiktok",
      "instagram",
      "twitter",
      "facebook",
      "reddit",
      "scraping",
      "social",
    ],
    docs: {
      homepage: "https://stablesocial.dev",
      llmsTxt: "https://stablesocial.dev/llms.txt",
    },
    provider: { name: "Merit Systems", url: "https://stablesocial.dev" },
    realm: "stablesocial.dev",
    intent: "charge",
    payment: TEMPO_PAYMENT,
    endpoints: [
      // TikTok
      {
        route: "POST /api/tiktok/profile",
        desc: "Get TikTok user profile",
        amount: "60000",
      },
      {
        route: "POST /api/tiktok/posts",
        desc: "Get TikTok user posts",
        amount: "60000",
      },
      {
        route: "POST /api/tiktok/post-comments",
        desc: "Get TikTok video comments",
        amount: "60000",
      },
      {
        route: "POST /api/tiktok/comment-replies",
        desc: "Get TikTok comment replies",
        amount: "60000",
      },
      {
        route: "POST /api/tiktok/followers",
        desc: "Get TikTok followers",
        amount: "60000",
      },
      {
        route: "POST /api/tiktok/following",
        desc: "Get TikTok following",
        amount: "60000",
      },
      {
        route: "POST /api/tiktok/search",
        desc: "Search TikTok posts by keyword",
        amount: "60000",
      },
      {
        route: "POST /api/tiktok/search-hashtag",
        desc: "Search TikTok by hashtag",
        amount: "60000",
      },
      {
        route: "POST /api/tiktok/search-profiles",
        desc: "Search TikTok user profiles",
        amount: "60000",
      },
      {
        route: "POST /api/tiktok/search-music",
        desc: "Search TikTok posts by sound",
        amount: "60000",
      },
      // Instagram
      {
        route: "POST /api/instagram/profile",
        desc: "Get Instagram user profile",
        amount: "60000",
      },
      {
        route: "POST /api/instagram/posts",
        desc: "Get Instagram user posts",
        amount: "60000",
      },
      {
        route: "POST /api/instagram/post-comments",
        desc: "Get Instagram post comments",
        amount: "60000",
      },
      {
        route: "POST /api/instagram/comment-replies",
        desc: "Get Instagram comment replies",
        amount: "60000",
      },
      {
        route: "POST /api/instagram/followers",
        desc: "Get Instagram followers",
        amount: "60000",
      },
      {
        route: "POST /api/instagram/following",
        desc: "Get Instagram following",
        amount: "60000",
      },
      {
        route: "POST /api/instagram/stories",
        desc: "Get Instagram user stories",
        amount: "60000",
      },
      {
        route: "POST /api/instagram/highlights",
        desc: "Get Instagram user highlights",
        amount: "60000",
      },
      {
        route: "POST /api/instagram/search",
        desc: "Search Instagram posts by keyword",
        amount: "60000",
      },
      {
        route: "POST /api/instagram/search-tags",
        desc: "Search Instagram by tag",
        amount: "60000",
      },
      // X/Twitter
      {
        route: "POST /api/x/profile",
        desc: "Get X/Twitter user profile",
        amount: "60000",
      },
      {
        route: "POST /api/x/posts",
        desc: "Get X/Twitter user posts",
        amount: "60000",
      },
      {
        route: "POST /api/x/post-replies",
        desc: "Get X/Twitter post replies",
        amount: "60000",
      },
      {
        route: "POST /api/x/post-retweets",
        desc: "Get X/Twitter retweet profiles",
        amount: "60000",
      },
      {
        route: "POST /api/x/post-quotes",
        desc: "Get X/Twitter quote tweets",
        amount: "60000",
      },
      {
        route: "POST /api/x/followers",
        desc: "Get X/Twitter followers",
        amount: "60000",
      },
      {
        route: "POST /api/x/following",
        desc: "Get X/Twitter following",
        amount: "60000",
      },
      {
        route: "POST /api/x/search",
        desc: "Search X/Twitter posts by keyword",
        amount: "60000",
      },
      {
        route: "POST /api/x/search-profiles",
        desc: "Search X/Twitter user profiles",
        amount: "60000",
      },
      // Facebook
      {
        route: "POST /api/facebook/profile",
        desc: "Get Facebook page/user profile",
        amount: "60000",
      },
      {
        route: "POST /api/facebook/posts",
        desc: "Get Facebook page/user posts",
        amount: "60000",
      },
      {
        route: "POST /api/facebook/post-comments",
        desc: "Get Facebook post comments",
        amount: "60000",
      },
      {
        route: "POST /api/facebook/comment-replies",
        desc: "Get Facebook comment replies",
        amount: "60000",
      },
      {
        route: "POST /api/facebook/followers",
        desc: "Get Facebook followers",
        amount: "60000",
      },
      {
        route: "POST /api/facebook/following",
        desc: "Get Facebook following",
        amount: "60000",
      },
      {
        route: "POST /api/facebook/search",
        desc: "Search Facebook posts by keyword",
        amount: "60000",
      },
      {
        route: "POST /api/facebook/search-people",
        desc: "Search Facebook people profiles",
        amount: "60000",
      },
      {
        route: "POST /api/facebook/search-pages",
        desc: "Search Facebook page profiles",
        amount: "60000",
      },
      {
        route: "POST /api/facebook/search-groups",
        desc: "Search Facebook group profiles",
        amount: "60000",
      },
      // Reddit
      {
        route: "POST /api/reddit/post",
        desc: "Get Reddit post details",
        amount: "60000",
      },
      {
        route: "POST /api/reddit/post-comments",
        desc: "Get Reddit post comments",
        amount: "60000",
      },
      {
        route: "POST /api/reddit/comment",
        desc: "Get Reddit comment details",
        amount: "60000",
      },
      {
        route: "POST /api/reddit/search",
        desc: "Search Reddit posts by keyword",
        amount: "60000",
      },
      {
        route: "POST /api/reddit/search-profiles",
        desc: "Search Reddit user profiles",
        amount: "60000",
      },
      {
        route: "POST /api/reddit/subreddit",
        desc: "Get subreddit posts",
        amount: "60000",
      },
      // Polling
      { route: "GET /api/jobs", desc: "Poll job status and retrieve results" },
    ],
  },

  // ── StableStudio ───────────────────────────────────────────────────────
  {
    id: "stablestudio",
    name: "StableStudio",
    url: "https://stablestudio.dev",
    serviceUrl: "https://stablestudio.dev",
    description:
      "Pay-per-generation AI image and video creation — Nano Banana, GPT Image, Grok, Flux, Sora, Veo, Seedance, and Wan.",
    categories: ["ai", "media"],
    integration: "first-party",
    tags: [
      "image",
      "video",
      "generation",
      "nano-banana",
      "gpt-image",
      "grok",
      "flux",
      "sora",
      "veo",
      "seedance",
      "wan",
    ],
    docs: {
      homepage: "https://stablestudio.dev",
      llmsTxt: "https://stablestudio.dev/llms.txt",
    },
    provider: { name: "Merit Systems", url: "https://stablestudio.dev" },
    realm: "stablestudio.dev",
    intent: "charge",
    payment: TEMPO_PAYMENT,
    endpoints: [
      // Nano Banana
      {
        route: "POST /api/generate/nano-banana/generate",
        desc: "Nano Banana image generation",
        amount: "39000",
      },
      {
        route: "POST /api/generate/nano-banana/edit",
        desc: "Nano Banana image editing",
        amount: "39000",
      },
      {
        route: "POST /api/generate/nano-banana-pro/generate",
        desc: "Nano Banana Pro image generation (up to 4K)",
        dynamic: true,
      },
      {
        route: "POST /api/generate/nano-banana-pro/edit",
        desc: "Nano Banana Pro image editing (up to 4K)",
        dynamic: true,
      },
      // Grok
      {
        route: "POST /api/generate/grok/generate",
        desc: "Grok image generation",
        amount: "70000",
      },
      {
        route: "POST /api/generate/grok/edit",
        desc: "Grok image editing",
        amount: "22000",
      },
      {
        route: "POST /api/generate/grok-video/generate",
        desc: "Grok video generation",
        dynamic: true,
      },
      // GPT Image
      {
        route: "POST /api/generate/gpt-image-1/generate",
        desc: "GPT Image 1 generation",
        dynamic: true,
      },
      {
        route: "POST /api/generate/gpt-image-1/edit",
        desc: "GPT Image 1 editing",
        dynamic: true,
      },
      {
        route: "POST /api/generate/gpt-image-1.5/generate",
        desc: "GPT Image 1.5 generation",
        dynamic: true,
      },
      {
        route: "POST /api/generate/gpt-image-1.5/edit",
        desc: "GPT Image 1.5 editing",
        dynamic: true,
      },
      // Flux
      {
        route: "POST /api/generate/flux-2-pro/generate",
        desc: "Flux 2 Pro image generation",
        dynamic: true,
      },
      {
        route: "POST /api/generate/flux-2-pro/edit",
        desc: "Flux 2 Pro image editing",
        dynamic: true,
      },
      // Seedance
      {
        route: "POST /api/generate/seedance/t2v",
        desc: "Seedance text-to-video",
        dynamic: true,
      },
      {
        route: "POST /api/generate/seedance/i2v",
        desc: "Seedance image-to-video",
        dynamic: true,
      },
      {
        route: "POST /api/generate/seedance-fast/t2v",
        desc: "Seedance Fast text-to-video",
        dynamic: true,
      },
      {
        route: "POST /api/generate/seedance-fast/i2v",
        desc: "Seedance Fast image-to-video",
        dynamic: true,
      },
      // Wan
      {
        route: "POST /api/generate/wan-2.6/t2v",
        desc: "Wan 2.6 text-to-video",
        dynamic: true,
      },
      {
        route: "POST /api/generate/wan-2.6/i2v",
        desc: "Wan 2.6 image-to-video",
        dynamic: true,
      },
      // Sora
      {
        route: "POST /api/generate/sora-2/generate",
        desc: "Sora 2 video generation",
        dynamic: true,
      },
      {
        route: "POST /api/generate/sora-2-pro/generate",
        desc: "Sora 2 Pro video generation",
        dynamic: true,
      },
      // Veo
      {
        route: "POST /api/generate/veo-3.1/generate",
        desc: "Veo 3.1 video generation",
        dynamic: true,
      },
      {
        route: "POST /api/generate/veo-3.1-fast/generate",
        desc: "Veo 3.1 Fast video generation",
        dynamic: true,
      },
      // Upload & Jobs
      {
        route: "POST /api/upload",
        desc: "Upload image for editing or image-to-video",
        amount: "10000",
      },
      { route: "POST /api/upload/confirm", desc: "Confirm uploaded file" },
      {
        route: "GET /api/jobs/:jobId",
        desc: "Poll job status and retrieve results",
      },
      { route: "GET /api/jobs", desc: "List jobs" },
      { route: "DELETE /api/jobs/:jobId", desc: "Delete a failed job" },
    ],
  },

  // ── StableUpload ───────────────────────────────────────────────────────
  {
    id: "stableupload",
    name: "StableUpload",
    url: "https://stableupload.dev",
    serviceUrl: "https://stableupload.dev",
    description:
      "Pay-per-upload file hosting and static site hosting with custom domains — 6 month TTL.",
    categories: ["storage"],
    integration: "first-party",
    tags: ["upload", "files", "hosting", "static-site", "cdn"],
    docs: {
      homepage: "https://stableupload.dev",
      llmsTxt: "https://stableupload.dev/llms.txt",
    },
    provider: { name: "Merit Systems", url: "https://stableupload.dev" },
    realm: "stableupload.dev",
    intent: "charge",
    payment: TEMPO_PAYMENT,
    endpoints: [
      {
        route: "POST /api/upload",
        desc: "Buy an upload slot (10MB $0.02, 100MB $0.20, 1GB $2.00)",
        dynamic: true,
      },
      {
        route: "GET /api/uploads",
        desc: "List uploads for authenticated wallet",
      },
      {
        route: "GET /api/download/:uploadId",
        desc: "Get upload details by ID",
      },
      {
        route: "POST /api/site",
        desc: "Buy a site upload slot for zip hosting",
        dynamic: true,
      },
      {
        route: "POST /api/site/activate",
        desc: "Extract zip and make site live",
      },
      {
        route: "POST /api/site/domain",
        desc: "Connect a custom domain to a site",
      },
      {
        route: "GET /api/site/domain/status",
        desc: "Check TLS provisioning status",
      },
    ],
  },
];
