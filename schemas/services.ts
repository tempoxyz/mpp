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
  /** MPP service URL — where this service is accessed through the proxy (e.g. "https://mpp.tempo.xyz/openai") */
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
    serviceUrl: `https://${MPP_REALM}/agentmail`,
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
    serviceUrl: `https://${MPP_REALM}/alchemy`,
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
    serviceUrl: `https://${MPP_REALM}/anthropic`,
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
    serviceUrl: `https://${MPP_REALM}/browserbase`,
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
    serviceUrl: `https://${MPP_REALM}/codex`,
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
    serviceUrl: `https://${MPP_REALM}/digitalocean`,
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
    serviceUrl: `https://${MPP_REALM}/elevenlabs`,
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
    serviceUrl: `https://${MPP_REALM}/exa`,
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
    serviceUrl: `https://${MPP_REALM}/fal`,
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
    serviceUrl: `https://${MPP_REALM}/firecrawl`,
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
    serviceUrl: `https://${MPP_REALM}/gemini`,
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
    serviceUrl: `https://${MPP_REALM}/modal`,
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
    serviceUrl: `https://${MPP_REALM}/openai`,
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
    serviceUrl: `https://${MPP_REALM}/openrouter`,
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
    serviceUrl: `https://${MPP_REALM}/parallel`,
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
    serviceUrl: `https://${MPP_REALM}/rpc`,
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
    serviceUrl: `https://${MPP_REALM}/storage`,
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
    serviceUrl: `https://${MPP_REALM}/twitter`,
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
];
