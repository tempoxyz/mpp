/**
 * MPP Service Registry
 *
 * Edit this file to add or modify services.
 * Generated artifacts (discovery.json, llms.txt, icons) are built
 * automatically during `pnpm dev` and `pnpm build`.
 */

// --- Shared constants ---
export const USDCe = "0x20c000000000000000000000b9537d11c60e8b50";
/** @deprecated Use `USDCe` instead. */
export const USDC = USDCe;
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
  /** Decimal places for the currency (e.g. 6 for USDC.e) */
  decimals: number;
}

/** Common payment defaults for Tempo USDC.e services */
export const TEMPO_PAYMENT: PaymentDefaults = {
  method: "tempo",
  currency: USDCe,
  decimals: 6,
};

/** Common payment defaults for Stripe MPP services */
export const STRIPE_PAYMENT: PaymentDefaults = {
  method: "stripe",
  currency: "usd",
  decimals: 2,
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
  /** Freeform pricing hint for dynamic endpoints (e.g. "$0.10 – $0.30 depending on processor") */
  amountHint?: string;
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
  /** Payment methods accepted by this service — first entry is primary for endpoint-level payment info */
  payments: PaymentDefaults[];
  /** Base URL for auto-generating per-endpoint docs links */
  docsBase?: string;
  endpoints: EndpointDef[];
}

// prettier-ignore
export const services: ServiceDef[] = [
  // ── Apex DB ───────────────────────────────────────────────────────────
  {
    id: "apex-db",
    name: "Apex DB",
    url: "https://apex-db.org",
    serviceUrl: "https://api.apex-db.org",
    description:
      "Search normalized vehicle variants, specifications, emissions, and source-linked provenance from public automotive datasets.",
    icon: "https://apex-db.org/icon.svg",
    categories: ["data", "search"],
    integration: "third-party",
    tags: [
      "automotive",
      "vehicles",
      "emissions",
      "specifications",
      "provenance",
    ],
    status: "active",
    docs: {
      homepage: "https://apex-db.org",
      llmsTxt: "https://apex-db.org/llms.txt",
      apiReference: "https://api.apex-db.org/openapi.json",
    },
    provider: { name: "Apex DB", url: "https://apex-db.org" },
    realm: "api.apex-db.org",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v1/apex",
        desc: "Search vehicle variants",
        amount: "100000",
        unitType: "request",
      },
      {
        route: "GET /v1/apex/:id",
        desc: "Get one vehicle variant",
        amount: "25000",
        unitType: "record",
      },
      {
        route: "GET /v1/coverage",
        desc: "Get the coverage matrix",
        amount: "250000",
        unitType: "request",
      },
    ],
  },

  // ── RxAtlas ───────────────────────────────────────────────────────────
  {
    id: "rxatlas",
    name: "RxAtlas",
    url: "https://rxatlas.dev",
    serviceUrl: "https://api.rxatlas.dev",
    description:
      "Search normalized US drug products with source-linked FDA, DailyMed, RxNorm, NADAC, shortage, and enforcement enrichments.",
    icon: "https://rxatlas.dev/icon.svg",
    categories: ["data", "search"],
    integration: "third-party",
    tags: ["drugs", "ndc", "fda", "rxnorm", "pricing", "provenance"],
    status: "active",
    docs: {
      homepage: "https://rxatlas.dev",
      llmsTxt: "https://rxatlas.dev/llms.txt",
      apiReference: "https://api.rxatlas.dev/openapi.json",
    },
    provider: { name: "RxAtlas", url: "https://rxatlas.dev" },
    realm: "api.rxatlas.dev",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v1/drugs",
        desc: "Search drug products",
        amount: "100000",
        unitType: "request",
      },
      {
        route: "GET /v1/drugs/:id",
        desc: "Get one drug product",
        amount: "25000",
        unitType: "record",
      },
      {
        route: "GET /v1/coverage",
        desc: "Get the coverage matrix",
        amount: "250000",
        unitType: "request",
      },
    ],
  },

  // ── TrialBase DB ──────────────────────────────────────────────────────
  {
    id: "trialbase-db",
    name: "TrialBase DB",
    url: "https://trialbase-db.org",
    serviceUrl: "https://api.trialbase-db.org",
    description:
      "Search normalized clinical trials from ClinicalTrials.gov, CTIS, EudraCT, and ISRCTN with registry identifiers and source-linked evidence.",
    icon: "https://trialbase-db.org/icon.svg",
    categories: ["data", "search"],
    integration: "third-party",
    tags: [
      "clinical-trials",
      "registries",
      "healthcare",
      "research",
      "provenance",
    ],
    status: "active",
    docs: {
      homepage: "https://trialbase-db.org",
      llmsTxt: "https://trialbase-db.org/llms.txt",
      apiReference: "https://api.trialbase-db.org/openapi.json",
    },
    provider: { name: "TrialBase DB", url: "https://trialbase-db.org" },
    realm: "api.trialbase-db.org",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v1/trials",
        desc: "Search clinical trials",
        amount: "100000",
        unitType: "request",
      },
      {
        route: "GET /v1/trials/:id",
        desc: "Get one clinical trial",
        amount: "25000",
        unitType: "record",
      },
      {
        route: "GET /v1/coverage",
        desc: "Get the coverage matrix",
        amount: "250000",
        unitType: "request",
      },
    ],
  },

  // ── RecallRadar ───────────────────────────────────────────────────────
  {
    id: "recallradar",
    name: "RecallRadar",
    url: "https://recallradar.dev",
    serviceUrl: "https://api.recallradar.dev",
    description:
      "Search normalized consumer-product safety notices from six public authorities with recall classification, hazards, remedies, and provenance.",
    icon: "https://recallradar.dev/icon.svg",
    categories: ["data", "search"],
    integration: "third-party",
    tags: ["recalls", "product-safety", "compliance", "hazards", "provenance"],
    status: "active",
    docs: {
      homepage: "https://recallradar.dev",
      llmsTxt: "https://recallradar.dev/llms.txt",
      apiReference: "https://api.recallradar.dev/openapi.json",
    },
    provider: { name: "RecallRadar", url: "https://recallradar.dev" },
    realm: "api.recallradar.dev",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v1/recalls",
        desc: "Search safety notices",
        amount: "100000",
        unitType: "request",
      },
      {
        route: "GET /v1/recalls/:id",
        desc: "Get one safety notice",
        amount: "25000",
        unitType: "record",
      },
      {
        route: "GET /v1/coverage",
        desc: "Get the coverage matrix",
        amount: "250000",
        unitType: "request",
      },
    ],
  },

  // ── agentfax ───────────────────────────────────────────────────────────
  {
    id: "agentfax",
    name: "agentfax",
    url: "https://agentfax.val.run",
    serviceUrl: "https://agentfax.val.run",
    description:
      "Send a fax to any phone number, priced per page. Pay-per-fax for AI agents — no signup, no API key; documents are never stored.",

    categories: ["social"],
    integration: "third-party",
    tags: ["fax", "documents", "pdf", "communication"],
    status: "active",
    docs: {
      homepage: "https://agentfax.val.run",
      llmsTxt: "https://agentfax.val.run/llms.txt",
      apiReference: "https://agentfax.val.run/v1/info",
    },
    provider: { name: "agentfax", url: "https://agentfax.val.run" },
    realm: "agentfax.val.run",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v1/fax",
        desc: "Send a fax to any phone number — priced per page",
        dynamic: true,
        amountHint: "$0.20/page",
        unitType: "page",
      },
    ],
  },
  // ── AgentMail ──────────────────────────────────────────────────────────
  {
    id: "agentmail",
    name: "AgentMail",
    url: "https://mpp.api.agentmail.to",
    serviceUrl: "https://mpp.api.agentmail.to",
    description: "Email inboxes for AI agents.",

    categories: ["ai", "social"],
    integration: "first-party",
    tags: [
      "email",
      "inboxes",
      "domains",
      "drafts",
      "threads",
      "webhooks",
      "messaging",
    ],
    docs: { homepage: "https://docs.agentmail.to" },
    provider: { name: "AgentMail", url: "https://agentmail.to" },
    realm: "mpp.api.agentmail.to",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      // Inboxes
      { route: "GET /v0/inboxes", desc: "List inboxes" },
      { route: "GET /v0/inboxes/:inbox_id", desc: "Get inbox" },
      { route: "POST /v0/inboxes", desc: "Create inbox", amount: "2000000" },
      { route: "PATCH /v0/inboxes/:inbox_id", desc: "Update inbox" },
      { route: "DELETE /v0/inboxes/:inbox_id", desc: "Delete inbox" },
      // Inbox threads
      { route: "GET /v0/inboxes/:inbox_id/threads", desc: "List threads" },
      {
        route: "GET /v0/inboxes/:inbox_id/threads/:thread_id",
        desc: "Get thread",
      },
      {
        route:
          "GET /v0/inboxes/:inbox_id/threads/:thread_id/attachments/:attachment_id",
        desc: "Get attachment",
      },
      {
        route: "DELETE /v0/inboxes/:inbox_id/threads/:thread_id",
        desc: "Delete thread",
      },
      // Inbox messages
      { route: "GET /v0/inboxes/:inbox_id/messages", desc: "List messages" },
      {
        route: "GET /v0/inboxes/:inbox_id/messages/:message_id",
        desc: "Get message",
      },
      {
        route:
          "GET /v0/inboxes/:inbox_id/messages/:message_id/attachments/:attachment_id",
        desc: "Get attachment",
      },
      {
        route: "GET /v0/inboxes/:inbox_id/messages/:message_id/raw",
        desc: "Get raw message",
      },
      {
        route: "PATCH /v0/inboxes/:inbox_id/messages/:message_id",
        desc: "Update message",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/messages/send",
        desc: "Send message",
        amount: "10000",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/messages/:message_id/reply",
        desc: "Reply to message",
        amount: "10000",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/messages/:message_id/reply-all",
        desc: "Reply all message",
        amount: "10000",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/messages/:message_id/forward",
        desc: "Forward message",
        amount: "10000",
      },
      // Inbox drafts
      { route: "GET /v0/inboxes/:inbox_id/drafts", desc: "List drafts" },
      {
        route: "GET /v0/inboxes/:inbox_id/drafts/:draft_id",
        desc: "Get draft",
      },
      {
        route:
          "GET /v0/inboxes/:inbox_id/drafts/:draft_id/attachments/:attachment_id",
        desc: "Get attachment",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/drafts",
        desc: "Create draft",
        amount: "10000",
      },
      {
        route: "PATCH /v0/inboxes/:inbox_id/drafts/:draft_id",
        desc: "Update draft",
      },
      {
        route: "DELETE /v0/inboxes/:inbox_id/drafts/:draft_id",
        desc: "Delete draft",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/drafts/:draft_id/send",
        desc: "Send draft",
        amount: "10000",
      },
      // Inbox lists
      {
        route: "GET /v0/inboxes/:inbox_id/lists/:direction/:type",
        desc: "List entries",
      },
      {
        route: "GET /v0/inboxes/:inbox_id/lists/:direction/:type/:entry",
        desc: "Get list entry",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/lists/:direction/:type",
        desc: "Create list entry",
        amount: "10000",
      },
      {
        route: "DELETE /v0/inboxes/:inbox_id/lists/:direction/:type/:entry",
        desc: "Delete list entry",
      },
      // Inbox metrics
      { route: "GET /v0/inboxes/:inbox_id/metrics", desc: "Query metrics" },
      // Top-level threads
      { route: "GET /v0/threads", desc: "List threads" },
      { route: "GET /v0/threads/:thread_id", desc: "Get thread" },
      {
        route: "GET /v0/threads/:thread_id/attachments/:attachment_id",
        desc: "Get attachment",
      },
      { route: "DELETE /v0/threads/:thread_id", desc: "Delete thread" },
      // Top-level drafts
      { route: "GET /v0/drafts", desc: "List drafts" },
      { route: "GET /v0/drafts/:draft_id", desc: "Get draft" },
      {
        route: "GET /v0/drafts/:draft_id/attachments/:attachment_id",
        desc: "Get attachment",
      },
      // Domains
      { route: "GET /v0/domains", desc: "List domains" },
      { route: "GET /v0/domains/:domain_id", desc: "Get domain" },
      { route: "GET /v0/domains/:domain_id/zone-file", desc: "Get zone file" },
      { route: "POST /v0/domains", desc: "Create domain", amount: "10000" },
      { route: "DELETE /v0/domains/:domain_id", desc: "Delete domain" },
      { route: "POST /v0/domains/:domain_id/verify", desc: "Verify domain" },
      // Top-level lists
      { route: "GET /v0/lists/:direction/:type", desc: "List entries" },
      {
        route: "GET /v0/lists/:direction/:type/:entry",
        desc: "Get list entry",
      },
      {
        route: "POST /v0/lists/:direction/:type",
        desc: "Create list entry",
        amount: "10000",
      },
      {
        route: "DELETE /v0/lists/:direction/:type/:entry",
        desc: "Delete list entry",
      },
      // Metrics
      { route: "GET /v0/metrics", desc: "Query metrics" },
      // API keys
      { route: "GET /v0/api-keys", desc: "List API keys" },
      { route: "POST /v0/api-keys", desc: "Create API key" },
      { route: "DELETE /v0/api-keys/:api_key", desc: "Delete API key" },
      // Pods
      { route: "GET /v0/pods", desc: "List pods" },
      { route: "GET /v0/pods/:pod_id", desc: "Get pod" },
      { route: "POST /v0/pods", desc: "Create pod", amount: "10000" },
      { route: "DELETE /v0/pods/:pod_id", desc: "Delete pod" },
      // Pod inboxes
      { route: "GET /v0/pods/:pod_id/inboxes", desc: "List inboxes" },
      { route: "GET /v0/pods/:pod_id/inboxes/:inbox_id", desc: "Get inbox" },
      {
        route: "POST /v0/pods/:pod_id/inboxes",
        desc: "Create inbox",
        amount: "2000000",
      },
      {
        route: "PATCH /v0/pods/:pod_id/inboxes/:inbox_id",
        desc: "Update inbox",
      },
      {
        route: "DELETE /v0/pods/:pod_id/inboxes/:inbox_id",
        desc: "Delete inbox",
      },
      // Pod threads
      { route: "GET /v0/pods/:pod_id/threads", desc: "List threads" },
      { route: "GET /v0/pods/:pod_id/threads/:thread_id", desc: "Get thread" },
      {
        route:
          "GET /v0/pods/:pod_id/threads/:thread_id/attachments/:attachment_id",
        desc: "Get attachment",
      },
      {
        route: "DELETE /v0/pods/:pod_id/threads/:thread_id",
        desc: "Delete thread",
      },
      // Pod drafts
      { route: "GET /v0/pods/:pod_id/drafts", desc: "List drafts" },
      { route: "GET /v0/pods/:pod_id/drafts/:draft_id", desc: "Get draft" },
      {
        route:
          "GET /v0/pods/:pod_id/drafts/:draft_id/attachments/:attachment_id",
        desc: "Get attachment",
      },
      // Pod domains
      { route: "GET /v0/pods/:pod_id/domains", desc: "List domains" },
      { route: "GET /v0/pods/:pod_id/domains/:domain_id", desc: "Get domain" },
      {
        route: "GET /v0/pods/:pod_id/domains/:domain_id/zone-file",
        desc: "Get zone file",
      },
      {
        route: "POST /v0/pods/:pod_id/domains",
        desc: "Create domain",
        amount: "10000000",
      },
      {
        route: "PATCH /v0/pods/:pod_id/domains/:domain_id",
        desc: "Update domain",
      },
      {
        route: "DELETE /v0/pods/:pod_id/domains/:domain_id",
        desc: "Delete domain",
      },
      {
        route: "POST /v0/pods/:pod_id/domains/:domain_id/verify",
        desc: "Verify domain",
      },
      // Pod lists
      {
        route: "GET /v0/pods/:pod_id/lists/:direction/:type",
        desc: "List entries",
      },
      {
        route: "GET /v0/pods/:pod_id/lists/:direction/:type/:entry",
        desc: "Get list entry",
      },
      {
        route: "POST /v0/pods/:pod_id/lists/:direction/:type",
        desc: "Create list entry",
        amount: "10000",
      },
      {
        route: "DELETE /v0/pods/:pod_id/lists/:direction/:type/:entry",
        desc: "Delete list entry",
      },
      // Pod metrics & API keys
      { route: "GET /v0/pods/:pod_id/metrics", desc: "Query metrics" },
      { route: "GET /v0/pods/:pod_id/api-keys", desc: "List API keys" },
      { route: "POST /v0/pods/:pod_id/api-keys", desc: "Create API key" },
      {
        route: "DELETE /v0/pods/:pod_id/api-keys/:api_key",
        desc: "Delete API key",
      },
      // Organization
      { route: "GET /v0/organizations", desc: "Get organization" },
    ],
  },

  // ── Allium ──────────────────────────────────────────────────────────────
  {
    id: "allium",
    name: "Allium",
    url: "https://agents.allium.so",
    serviceUrl: "https://agents.allium.so",
    description:
      "System of record for onchain finance. Real-time blockchain data: token prices, wallet balances, transactions, PnL, and SQL explorer.",

    categories: ["blockchain", "data"],
    integration: "first-party",
    tags: [
      "blockchain",
      "prices",
      "tokens",
      "wallet",
      "balances",
      "transactions",
      "pnl",
      "sql",
      "explorer",
      "solana",
      "base",
      "defi",
    ],
    docs: { homepage: "https://docs.allium.so" },
    provider: { name: "Allium", url: "https://allium.so" },
    realm: "agents.allium.so",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      // Realtime - Prices
      {
        route: "POST /api/v1/developer/prices",
        desc: "Get latest token prices",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/developer/prices/at-timestamp",
        desc: "Get token prices at a specific time",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/developer/prices/history",
        desc: "Get historical token price series",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/developer/prices/stats",
        desc: "Get token price statistics",
        amount: "20000",
        unitType: "request",
      },
      // Realtime - Tokens
      {
        route: "GET /api/v1/developer/tokens/search",
        desc: "Search tokens by name or symbol",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/developer/tokens/chain-address",
        desc: "Look up tokens by chain and address",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /api/v1/developer/tokens",
        desc: "List all supported tokens",
        amount: "30000",
        unitType: "request",
      },
      // Realtime - Balances
      {
        route: "POST /api/v1/developer/wallet/balances",
        desc: "Get current wallet token balances",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/developer/wallet/balances/history",
        desc: "Get historical wallet balances",
        amount: "30000",
        unitType: "request",
      },
      // Realtime - Transactions
      {
        route: "POST /api/v1/developer/wallet/transactions",
        desc: "Get wallet transaction history",
        amount: "30000",
        unitType: "request",
      },
      // Realtime - PnL
      {
        route: "POST /api/v1/developer/wallet/pnl",
        desc: "Get wallet profit and loss",
        amount: "30000",
        unitType: "request",
      },
      // Explorer
      {
        route: "POST /api/v1/explorer/queries/run-async",
        desc: "Submit raw SQL for async execution",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/explorer/queries/:query_id/run-async",
        desc: "Run a saved query asynchronously",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /api/v1/explorer/query-runs/:run_id/status",
        desc: "Check status of a query run",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /api/v1/explorer/query-runs/:run_id/results",
        desc: "Fetch results of a completed query",
        dynamic: true,
        amountHint: "$0.01 – $2.00",
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
    payments: [TEMPO_PAYMENT],
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
    url: "https://mpp.browserbase.com",
    serviceUrl: "https://mpp.browserbase.com",
    description:
      "Headless browser sessions, web search, and page fetching for AI agents.",

    categories: ["web", "compute", "search"],
    integration: "first-party",
    tags: ["browser", "scraping", "automation", "headless", "search", "fetch"],
    docs: {
      homepage: "https://docs.browserbase.com",
      llmsTxt: "https://docs.browserbase.com/llms.txt",
    },
    provider: { name: "Browserbase", url: "https://browserbase.com" },
    realm: "mpp.browserbase.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT, STRIPE_PAYMENT],
    docsBase: "https://docs.browserbase.com/features",
    endpoints: [
      {
        route: "POST /browser/session/create",
        desc: "Create a browser session",
        dynamic: true,
        amountHint: "$0.12/hr",
        docs: "https://docs.browserbase.com/reference/api/create-a-session",
      },
      {
        route: "GET /browser/session/:id/status",
        desc: "Check session status",
        docs: false,
      },
      {
        route: "POST /browser/session/:id/extend",
        desc: "Add more time to session",
        dynamic: true,
        amountHint: "$0.12/hr",
        docs: "https://docs.browserbase.com/reference/api/create-a-session",
      },
      {
        route: "DELETE /browser/session/:id",
        desc: "Terminate session",
        docs: false,
      },
      {
        route: "POST /search",
        desc: "Web search with structured results",
        amount: "10000",
        unitType: "request",
        docs: "https://docs.browserbase.com/features/search",
      },
      {
        route: "POST /fetch",
        desc: "Fetch a page and return content and metadata",
        amount: "10000",
        unitType: "request",
        docs: "https://docs.browserbase.com/features/fetch",
      },
    ],
  },

  // ── Build With Locus ───────────────────────────────────────────────────
  {
    id: "buildwithlocus",
    name: "Build With Locus",
    url: "https://mpp.buildwithlocus.com",
    serviceUrl: "https://mpp.buildwithlocus.com",
    description:
      "Deploy containerized services, Postgres, Redis, and custom domains on demand — all via REST API. Pay-per-use credit billing.",

    categories: ["compute"],
    integration: "first-party",
    tags: [
      "deploy",
      "containers",
      "paas",
      "hosting",
      "postgres",
      "redis",
      "domains",
      "monorepo",
      "github",
    ],
    docs: {
      homepage: "https://docs.paywithlocus.com/build",
    },
    provider: { name: "Locus", url: "https://buildwithlocus.com" },
    realm: "mpp.buildwithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      // Auth
      {
        route: "POST /v1/auth/mpp-sign-up",
        desc: "Bootstrap workspace — returns JWT and workspace ID (free)",
        amount: "0",
        unitType: "request",
      },
      { route: "GET /v1/auth/whoami", desc: "Current user and workspace info" },
      // Billing
      {
        route: "POST /v1/billing/mpp-top-up",
        desc: "Add credits to workspace via MPP payment",
        dynamic: true,
        amountHint: "$1–$100",
      },
      {
        route: "GET /v1/billing/balance",
        desc: "Credit balance and billing summary",
      },
      { route: "GET /v1/billing/transactions", desc: "Credit ledger history" },
      {
        route: "GET /v1/billing/services",
        desc: "Billable services with rate breakdown",
      },
      // Projects
      { route: "POST /v1/projects", desc: "Create a project" },
      { route: "GET /v1/projects", desc: "List projects" },
      { route: "GET /v1/projects/:projectId", desc: "Get project" },
      { route: "PATCH /v1/projects/:projectId", desc: "Update project" },
      { route: "DELETE /v1/projects/:projectId", desc: "Delete project" },
      // Environments
      {
        route: "POST /v1/projects/:projectId/environments",
        desc: "Create environment",
      },
      {
        route: "GET /v1/projects/:projectId/environments",
        desc: "List environments",
      },
      {
        route: "GET /v1/projects/:projectId/environments/:envId",
        desc: "Get environment",
      },
      {
        route: "DELETE /v1/projects/:projectId/environments/:envId",
        desc: "Delete environment",
      },
      // Services
      { route: "POST /v1/services", desc: "Create a service" },
      { route: "GET /v1/services/:serviceId", desc: "Get service status" },
      { route: "PATCH /v1/services/:serviceId", desc: "Update service" },
      { route: "DELETE /v1/services/:serviceId", desc: "Delete service" },
      {
        route: "GET /v1/services/environment/:environmentId",
        desc: "List services in environment",
      },
      {
        route: "POST /v1/services/:serviceId/restart",
        desc: "Rolling restart without rebuild",
      },
      {
        route: "POST /v1/services/:serviceId/redeploy",
        desc: "Redeploy latest image",
      },
      // Deployments
      { route: "POST /v1/deployments", desc: "Trigger deployment" },
      {
        route: "GET /v1/deployments/:deploymentId",
        desc: "Get deployment status",
      },
      {
        route: "GET /v1/deployments/service/:serviceId",
        desc: "List deployments for service",
      },
      {
        route: "POST /v1/deployments/:deploymentId/cancel",
        desc: "Cancel deployment",
      },
      {
        route: "POST /v1/deployments/:deploymentId/rollback",
        desc: "Rollback to previous image",
      },
      {
        route: "GET /v1/deployments/:deploymentId/logs",
        desc: "Stream deployment logs (SSE)",
      },
      // Variables
      {
        route: "PUT /v1/variables/service/:serviceId",
        desc: "Replace all service variables",
      },
      {
        route: "PATCH /v1/variables/service/:serviceId",
        desc: "Merge service variables",
      },
      {
        route: "GET /v1/variables/service/:serviceId/resolved",
        desc: "Resolved variables with addon injections",
      },
      // Monorepo
      {
        route: "POST /v1/projects/from-repo",
        desc: "Deploy full stack from GitHub repo",
      },
      {
        route: "POST /v1/projects/from-locusbuild",
        desc: "Deploy from inline .locusbuild config",
      },
      // Addons
      { route: "POST /v1/addons", desc: "Create Postgres or Redis addon" },
      { route: "GET /v1/addons/:addonId", desc: "Get addon status" },
      {
        route: "GET /v1/addons/environment/:envId",
        desc: "List addons in environment",
      },
      { route: "DELETE /v1/addons/:addonId", desc: "Delete addon" },
      // Domains
      { route: "POST /v1/domains", desc: "Register BYOD domain" },
      { route: "GET /v1/domains", desc: "List all domains" },
      {
        route: "POST /v1/domains/:domainId/verify",
        desc: "Verify domain CNAME and cert",
      },
      {
        route: "POST /v1/domains/:domainId/attach",
        desc: "Attach domain to service",
      },
      { route: "DELETE /v1/domains/:domainId", desc: "Delete domain" },
      // Webhooks
      { route: "POST /v1/webhooks", desc: "Create webhook" },
      { route: "GET /v1/webhooks", desc: "List webhooks" },
      { route: "PATCH /v1/webhooks/:webhookId", desc: "Update webhook" },
      { route: "DELETE /v1/webhooks/:webhookId", desc: "Delete webhook" },
    ],
  },

  // ── Codex ──────────────────────────────────────────────────────────────
  {
    id: "codex",
    name: "Codex",
    url: "https://graph.codex.io",
    serviceUrl: "https://graph.codex.io",
    description:
      "Comprehensive onchain data API for tokens and prediction markets. Real-time prices, charts, trades, and wallet analytics across 80+ networks via GraphQL.",

    categories: ["blockchain", "data"],
    integration: "first-party",
    tags: ["graphql", "defi", "tokens", "trades", "nft"],
    docs: {
      homepage: "https://docs.codex.io",
      llmsTxt: "https://docs.codex.io/llms.txt",
    },
    provider: { name: "Codex", url: "https://codex.io" },
    realm: "graph.codex.io",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    docsBase: "https://context7.com/websites/codex_io/llms.txt",
    endpoints: [
      {
        route: "POST /graphql",
        desc: "GraphQL query (token data, trades, liquidity, NFTs, wallets)",
        amount: "1000",
      },
    ],
  },

  // ── Doma ────────────────────────────────────────────────────────────────
  {
    id: "doma",
    name: "Doma",
    url: "https://doma.xyz",
    serviceUrl: "https://mpp.doma.xyz",
    description:
      "Domain registration on the Doma blockchain. Instantly register .com, .xyz, .ai, .io, and .net domains.",

    categories: ["web", "blockchain"],
    integration: "first-party",
    tags: ["domains", "dns"],
    status: "active",
    docs: {
      homepage: "https://docs.doma.xyz",
      llmsTxt: "https://mpp.doma.xyz/SKILL.md",
    },
    provider: { name: "Doma", url: "https://doma.xyz" },
    realm: "mpp.doma.xyz",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /register",
        desc: "Register a domain — price varies by TLD and domain name",
        dynamic: true,
        amountHint: "Varies by TLD",
        unitType: "request",
      },
    ],
  },

  // ── DripStack ────────────────────────────────────────────────────────────────
  {
    id: "dripstack",
    name: "DripStack",
    url: "https://dripstack.xyz",
    serviceUrl: "https://dripstack.xyz",
    description: "MPP-enabled content retrieval from Substack publications.",
    categories: ["web", "data"],
    integration: "third-party",
    tags: ["substack", "blog", "publication", "post", "data", "query"],
    docs: {
      homepage: "https://dripstack.xyz/?tab=agents",
      llmsTxt: "https://dripstack.xyz/SKILL.md",
    },
    provider: { name: "DripStack", url: "https://dripstack.xyz/" },
    realm: "dripstack.xyz",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /api/v1/publications",
        desc: "List publications (free)",
      },
      {
        route: "GET /api/v1/publications/:publicationSlug",
        desc: "Get list of posts for a publication (free)",
      },
      {
        route: "GET /api/v1/publications/:publicationSlug/:postSlug",
        desc: "Get post content",
        dynamic: true,
        amountHint: "$0.05-$10",
      },
    ],
  },

  // ── Dune ────────────────────────────────────────────────────────────────
  {
    id: "dune",
    name: "Dune",
    url: "https://dune.com",
    serviceUrl: "https://api.dune.com",
    description:
      "Query across raw transaction data, decoded smart contract events, stablecoin flows, RWA tracking, protocol analytics, DeFi positions, NFT activity, blockchain market research, and whatever is trending in crypto.",

    categories: ["data", "blockchain"],
    integration: "first-party",
    tags: ["sql", "analytics", "blockchain", "data", "query"],
    docs: { homepage: "https://docs.dune.com/api-reference/agents/mpp" },
    provider: { name: "Dune", url: "https://dune.com" },
    realm: "api.dune.com",
    intent: "session",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /api/v1/sql/execute",
        desc: "Execute a SQL query",
        dynamic: true,
        amountHint: "$0.05-$4",
      },
      {
        route: "GET /api/v1/execution/:execution_id/csv",
        desc: "Download CSV results for an execution",
        dynamic: true,
        amountHint: "$0.05-$10",
      },
      {
        route: "GET /api/v1/execution/:execution_id/results",
        desc: "Fetch JSON results for an execution",
        dynamic: true,
        amountHint: "$0.05-$10",
      },
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
    payments: [TEMPO_PAYMENT],
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
    payments: [TEMPO_PAYMENT],
    docsBase: "https://context7.com/websites/fal_ai/llms.txt",
    endpoints: [
      {
        route: "POST /fal-ai/flux/dev",
        desc: "FLUX.1 [dev] - High-quality text-to-image generation",
        amount: "25000",
      },
      {
        route: "POST /fal-ai/flux/dev/image-to-image",
        desc: "FLUX.1 [dev] - Image-to-image editing and transformations",
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
    payments: [TEMPO_PAYMENT],
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

  // ── GovLaws ────────────────────────────────────────────────────────────
  {
    id: "govlaws",
    name: "GovLaws",
    url: "https://govlaws.ai",
    serviceUrl: "https://govlaws.ai",
    description:
      "Current U.S. federal regulation lookup, semantic search, and change tracking with provenance-rich responses from official government sources.",

    categories: ["data", "search"],
    integration: "first-party",
    tags: [
      "legal",
      "regulatory",
      "government",
      "citations",
      "compliance",
      "federal",
    ],
    docs: {
      homepage: "https://govlaws.ai/mpp",
      llmsTxt: "https://govlaws.ai/llms.txt",
    },
    provider: { name: "GovLaws", url: "https://govlaws.ai" },
    realm: "govlaws.ai",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /api/mpp/resolve",
        desc: "Resolve a CFR citation to current text, provenance, freshness, and recent changes",
        amount: "50000",
      },
      {
        route: "POST /api/mpp/search",
        desc: "Semantic search across current U.S. federal regulations",
        amount: "30000",
      },
      {
        route: "GET /api/mpp/changes",
        desc: "Recent Federal Register change events filtered by agency, citation, or lookback",
        amount: "30000",
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
    payments: [TEMPO_PAYMENT],
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
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    docsBase: "https://context7.com/websites/modal/llms.txt",
    endpoints: [
      {
        route: "POST /sandbox/create",
        desc: "Create a sandbox for code execution",
        dynamic: true,
      },
      {
        route: "POST /sandbox/exec",
        desc: "Execute command in sandbox",
        amount: "100",
      },
      {
        route: "POST /sandbox/status",
        desc: "Get sandbox status",
        amount: "100",
      },
      {
        route: "POST /sandbox/terminate",
        desc: "Terminate a sandbox",
        amount: "100",
      },
    ],
  },

  // ── molty.cash ──────────────────────────────────────────────────────────
  {
    id: "moltycash",
    name: "molty.cash",
    url: "https://api.molty.cash",
    serviceUrl: "https://api.molty.cash",
    description:
      "USDC payment infrastructure for AI agents and humans. Send tips, hire people for tasks, and create/earn from gigs — all settled on-chain via x402 (Base, Solana, World Chain) and MPP (Tempo, Stellar, Monad).",

    icon: "https://molty.cash/logo.svg",
    categories: ["ai", "social"],
    integration: "first-party",
    tags: ["payments", "usdc", "tips", "gigs", "tasks", "earn", "x402", "mpp"],
    docs: {
      homepage: "https://molty.cash",
      llmsTxt: "https://molty.cash/skills/moltycash/SKILL.md",
    },
    provider: { name: "molty.cash", url: "https://molty.cash" },
    realm: "api.molty.cash",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /a2a",
        desc: "Create pay-per-post gigs — fund tasks for humans to complete on X",
        dynamic: true,
        amountHint: "$0.10 – $50.00",
      },
      {
        route: "POST /:username/a2a",
        desc: "Tip or hire an X user with USDC",
        dynamic: true,
        amountHint: "$0.01+",
      },
    ],
  },

  // ── Nansen ──────────────────────────────────────────────────────────────
  {
    id: "nansen",
    name: "Nansen",
    url: "https://api.nansen.ai",
    serviceUrl: "https://api.nansen.ai",
    description:
      "Blockchain analytics and smart money intelligence. Token data, wallet profiling, DEX trades, PnL, and flow analysis across multiple chains.",

    categories: ["blockchain", "data"],
    integration: "first-party",
    tags: [
      "blockchain",
      "smart-money",
      "wallet",
      "tokens",
      "defi",
      "analytics",
      "profiler",
      "dex",
      "pnl",
      "onchain",
      "prediction-market",
    ],
    docs: {
      homepage: "https://docs.nansen.ai",
      apiReference: "https://docs.nansen.ai/nansen-api-reference",
    },
    provider: { name: "Nansen", url: "https://nansen.ai" },
    realm: "api.nansen.ai",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    docsBase: "https://docs.nansen.ai/api",
    endpoints: [
      // Account
      { route: "GET /api/v1/account", desc: "Get account information" },
      // Smart Money
      {
        route: "POST /api/v1/smart-money/netflow",
        desc: "Net token flows by smart money addresses",
        amount: "50000",
      },
      {
        route: "POST /api/v1/smart-money/dex-trades",
        desc: "Smart money DEX trades",
        amount: "50000",
      },
      {
        route: "POST /api/v1/smart-money/perp-trades",
        desc: "Smart money perp trades on Hyperliquid",
        amount: "50000",
      },
      {
        route: "POST /api/v1/smart-money/dcas",
        desc: "Smart money DCA orders on Solana",
        amount: "50000",
      },
      {
        route: "POST /api/v1/smart-money/holdings",
        desc: "Smart money aggregated token balances",
        amount: "50000",
      },
      {
        route: "POST /api/v1/smart-money/historical-holdings",
        desc: "Historical smart money holdings",
        amount: "10000",
      },
      // Profiler
      {
        route: "POST /api/v1/profiler/address/transactions",
        desc: "Wallet transaction history",
        amount: "10000",
      },
      {
        route: "POST /api/v1/transaction-with-token-transfer-lookup",
        desc: "Transaction with token transfer lookup",
        amount: "10000",
      },
      {
        route: "POST /api/v1/profiler/address/pnl-summary",
        desc: "Trade summary with top 5 trades",
        amount: "10000",
      },
      {
        route: "POST /api/v1/profiler/address/current-balance",
        desc: "Current token balances of an address",
        amount: "10000",
      },
      {
        route: "POST /api/v1/profiler/address/counterparties",
        desc: "Top counterparties of a wallet",
        amount: "50000",
      },
      {
        route: "POST /api/v1/profiler/address/historical-balances",
        desc: "Historical wallet balances",
        amount: "10000",
      },
      {
        route: "POST /api/v1/profiler/address/related-wallets",
        desc: "Related wallets and first-degree relations",
        amount: "10000",
      },
      {
        route: "POST /api/v1/profiler/address/pnl",
        desc: "Past trades and PnL performance",
        amount: "10000",
      },
      {
        route: "POST /api/v1/profiler/address/labels",
        desc: "Address labels and entity tags",
      },
      {
        route: "POST /api/v1/profiler/address/premium-labels",
        desc: "Premium address labels and entity tags",
      },
      {
        route: "POST /api/v1/profiler/perp-positions",
        desc: "Wallet perp positions and account health",
        amount: "10000",
      },
      {
        route: "POST /api/v1/profiler/perp-trades",
        desc: "Wallet Hyperliquid trade history",
        amount: "10000",
      },
      // Token God Mode
      {
        route: "POST /api/v1/tgm/flows",
        desc: "Total token inflow and outflow",
        amount: "10000",
      },
      {
        route: "POST /api/v1/tgm/who-bought-sold",
        desc: "Recent buyers and sellers summary",
        amount: "10000",
      },
      {
        route: "POST /api/v1/tgm/dex-trades",
        desc: "All DEX trades of a token",
        amount: "10000",
      },
      {
        route: "POST /api/v1/tgm/transfers",
        desc: "Top token transfers",
        amount: "10000",
      },
      {
        route: "POST /api/v1/tgm/holders",
        desc: "Top holders by entity category",
        amount: "50000",
      },
      {
        route: "POST /api/v1/tgm/pnl-leaderboard",
        desc: "Top addresses by realized and unrealized PnL",
        amount: "50000",
      },
      {
        route: "POST /api/v1/tgm/perp-pnl-leaderboard",
        desc: "Perp PnL leaderboard for a token",
        amount: "50000",
      },
      {
        route: "POST /api/v1/tgm/perp-positions",
        desc: "Open perp positions for a token",
        amount: "50000",
      },
      {
        route: "POST /api/v1/tgm/perp-trades",
        desc: "Perp trading history for a token",
        amount: "10000",
      },
      {
        route: "POST /api/v1/tgm/flow-intelligence",
        desc: "Token flow summary across smart money and exchanges",
        amount: "10000",
      },
      {
        route: "POST /api/v1/tgm/position-intelligence",
        desc: "Token position intelligence",
        amount: "10000",
      },
      {
        route: "POST /api/v1/tgm/token-information",
        desc: "Token metadata: market cap, volume, holders",
        amount: "10000",
      },
      {
        route: "POST /api/v1/tgm/indicators",
        desc: "Risk and reward indicators for a token",
        amount: "50000",
      },
      {
        route: "POST /api/v1/tgm/token-ohlcv",
        desc: "Token OHLCV price data",
        amount: "10000",
      },
      {
        route: "POST /api/v1/tgm/jup-dca",
        desc: "Jupiter DCA orders for a token on Solana",
        amount: "10000",
      },
      // Screeners
      {
        route: "POST /api/v1/token-screener",
        desc: "Real-time token analytics across chains",
        amount: "10000",
      },
      {
        route: "POST /api/v1/perp-screener",
        desc: "Screen Hyperliquid tokens by volume",
        amount: "10000",
      },
      // Portfolio
      {
        route: "POST /api/v1/portfolio/defi-holdings",
        desc: "Track DeFi positions across addresses",
      },
      // Search
      {
        route: "POST /api/v1/search/entity-name",
        desc: "Search for entity names",
      },
      { route: "GET /api/v1/search/token-sectors", desc: "List token sectors" },
      { route: "POST /api/v1/search/general", desc: "General search" },
      // Perp Leaderboard
      {
        route: "POST /api/v1/perp-leaderboard",
        desc: "Most profitable Hyperliquid addresses",
        amount: "50000",
      },
      // Prediction Market
      {
        route: "POST /api/v1/prediction-market/ohlcv",
        desc: "Prediction market OHLCV data",
        amount: "10000",
      },
      {
        route: "POST /api/v1/prediction-market/orderbook",
        desc: "Prediction market orderbook",
        amount: "10000",
      },
      {
        route: "POST /api/v1/prediction-market/top-holders",
        desc: "Top holders in prediction market",
        amount: "50000",
      },
      {
        route: "POST /api/v1/prediction-market/trades-by-market",
        desc: "Trades by prediction market",
        amount: "10000",
      },
      {
        route: "POST /api/v1/prediction-market/market-screener",
        desc: "Screen prediction markets",
        amount: "10000",
      },
      {
        route: "POST /api/v1/prediction-market/event-screener",
        desc: "Screen prediction market events",
        amount: "10000",
      },
      {
        route: "POST /api/v1/prediction-market/pnl-by-market",
        desc: "PnL by prediction market",
        amount: "50000",
      },
      {
        route: "POST /api/v1/prediction-market/pnl-by-address",
        desc: "PnL by address in prediction markets",
        amount: "10000",
      },
      {
        route: "POST /api/v1/prediction-market/position-detail",
        desc: "Prediction market position details",
        amount: "50000",
      },
      {
        route: "POST /api/v1/prediction-market/trades-by-address",
        desc: "Trades by address in prediction markets",
        amount: "10000",
      },
      {
        route: "POST /api/v1/prediction-market/categories",
        desc: "Prediction market categories",
        amount: "10000",
      },
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
    payments: [TEMPO_PAYMENT],
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
    payments: [TEMPO_PAYMENT],
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
    url: "https://parallelmpp.dev",
    serviceUrl: `https://parallelmpp.dev`,
    description: "Web search, page extraction, and multi-hop web research.",

    categories: ["search", "ai"],
    integration: "first-party",
    tags: ["search", "web", "extraction", "research"],
    docs: { homepage: "https://parallelmpp.dev/#agents" },
    provider: { name: "Parallel", url: "https://parallel.ai" },
    realm: "parallelmpp.dev",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /api/search",
        desc: "Search the web",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /api/extract",
        desc: "Extract page content",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /api/task",
        desc: "Multi-hop web research task - price varies by processor",
        dynamic: true,
        amountHint: "$0.10 – $0.30",
      },
    ],
  },

  // ── Alchemy ────────────────────────────────────────────────────────────
  {
    id: "alchemy",
    name: "Alchemy",
    url: "https://agents.alchemy.com/",
    serviceUrl: "https://mpp.alchemy.com",
    description:
      "Blockchain data APIs including Core RPC APIs, Prices API, Portfolio API, and NFT API across 100+ chains.",

    categories: ["blockchain", "data"],
    integration: "first-party",
    tags: ["rpc", "json-rpc", "nft", "evm", "multichain"],
    docs: {
      homepage: "https://agents.alchemy.com/s",
      llmsTxt: "https://www.alchemy.com/llms.txt",
    },
    provider: { name: "Alchemy", url: "https://agents.alchemy.com/" },
    realm: "alchemy.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT, STRIPE_PAYMENT],
    docsBase: "https://www.alchemy.com/llms.txt",
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

  // ── Conduit ────────────────────────────────────────────────────────────
  {
    id: "conduit",
    name: "Conduit",
    url: "https://mpp.conduit.xyz/",
    serviceUrl: "https://mpp.conduit.xyz",
    description:
      "EVM JSON-RPC access to Conduit Nodes across 60+ networks including Tempo, Plume, and Polygon Katana.",
    categories: ["blockchain", "data"],
    integration: "first-party",
    tags: ["rpc", "json-rpc", "evm", "multichain"],
    docs: {
      homepage: "https://docs.conduit.xyz/",
      llmsTxt:
        "https://github.com/conduitxyz/skills/blob/main/skills/conduit-rpc-gateway/SKILL.md",
    },
    provider: { name: "Conduit", url: "https://mpp.conduit.xyz/" },
    realm: "conduit.xyz",
    intent: "session",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /:network/",
        desc: "JSON-RPC calls - $0.00005 per call",
        amount: "50",
        unitType: "request",
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
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /",
        desc: "JSON-RPC calls - $0.001 per call",
        amount: "1000",
        unitType: "request",
      },
    ],
  },

  // ── Quicknode RPC ──────────────────────────────────────────────────────
  {
    id: "quicknode",
    name: "Quicknode",
    url: "https://quicknode.com/",
    serviceUrl: "https://mpp.quicknode.com",
    description:
      "Quicknode Core Node API for 80+ blockchains and 140+ networks.",

    icon: "https://mpp.quicknode.com/favicon.ico",
    categories: ["blockchain"],
    integration: "first-party",
    tags: ["rpc", "json-rpc", "evm", "solana", "tempo", "node"],
    docs: {
      homepage: "https://quicknode.com/",
      llmsTxt: "https://quicknode.com/llms.txt",
    },
    provider: { name: "Quicknode", url: "https://quicknode.com/" },
    realm: "quicknode.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /:network",
        desc: "JSON-RPC calls - $0.001 per call",
        amount: "1000",
        unitType: "request",
      },
      {
        route: "POST /session/:network",
        desc: "JSON-RPC calls - $0.00001 per call",
        amount: "10",
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
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /:key",
        desc: "Download object ($0.001 base + $0.01/MB)",
        dynamic: true,
      },
      {
        route: "PUT /:key",
        desc: "Upload object ($0.001 base + $0.01/MB, max 100MB)",
        dynamic: true,
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

  // ── Pinata IPFS ──────────────────────────────────────────────────────────
  {
    id: "pinata",
    name: "Pinata IPFS",
    url: "https://pinata.cloud",
    serviceUrl: "https://mpp.pinata.cloud",
    description:
      "Paid Pinata IPFS storage — upload and download public files via MPP.",

    categories: ["storage"],
    integration: "first-party",
    tags: ["ipfs", "pinata", "storage", "files", "upload", "download", "cid"],
    docs: { homepage: "https://docs.pinata.cloud/files/mpp/overview" },
    provider: { name: "Pinata", url: "https://pinata.cloud" },
    realm: "mpp.pinata.cloud",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v1/pin/public",
        desc: "Upload file to IPFS — dynamic pricing based on file size ($0.10/GB/month, min $0.01)",
        dynamic: true,
        amountHint: "$0.01+",
        unitType: "request",
        docs: "https://docs.pinata.cloud/files/mpp/quickstart",
      },
      {
        route: "GET /v1/pin/public/:cid",
        desc: "Download file from IPFS — $0.01 per request",
        amount: "10000",
        unitType: "request",
        docs: "https://docs.pinata.cloud/files/mpp/quickstart",
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
    payments: [TEMPO_PAYMENT],
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
    payments: [TEMPO_PAYMENT],
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

  // ── StableTravel ─────────────────────────────────────────────────────
  {
    id: "stabletravel",
    name: "StableTravel",
    url: "https://stabletravel.dev",
    serviceUrl: "https://stabletravel.dev",
    description:
      "Pay-per-request travel APIs — flights, hotels, activities, transfers, and real-time flight tracking. Powered by Amadeus and FlightAware.",

    categories: ["data", "web"],
    integration: "first-party",
    tags: [
      "amadeus",
      "flightaware",
      "flights",
      "hotels",
      "activities",
      "transfers",
      "travel",
    ],
    docs: {
      homepage: "https://stabletravel.dev",
      llmsTxt: "https://stabletravel.dev/llms.txt",
    },
    provider: { name: "Merit Systems", url: "https://stabletravel.dev" },
    realm: "stabletravel.dev",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      // Flights
      {
        route: "POST /api/flights/search",
        desc: "Search flight offers (advanced multi-city)",
        amount: "54000",
      },
      {
        route: "POST /api/flights/price",
        desc: "Confirm pricing for a flight offer",
        amount: "32400",
      },
      {
        route: "POST /api/flights/book",
        desc: "Book a flight (create flight order)",
        amount: "86400",
      },
      {
        route: "GET /api/flights/orders",
        desc: "Retrieve a flight order by ID",
        amount: "5400",
      },
      {
        route: "POST /api/flights/orders/cancel",
        desc: "Cancel a flight order",
        amount: "5400",
      },
      {
        route: "POST /api/flights/seatmap",
        desc: "Get seat maps for a flight",
        amount: "32400",
      },
      {
        route: "POST /api/flights/upsell",
        desc: "Get upsell offers for a flight",
        amount: "32400",
      },
      {
        route: "POST /api/flights/availability",
        desc: "Check flight availability",
        amount: "32400",
      },
      {
        route: "GET /api/flights/status",
        desc: "Get flight status by carrier, number, and date",
        amount: "5400",
      },
      {
        route: "GET /api/flights/checkin-links",
        desc: "Get airline check-in page URLs",
        amount: "5400",
      },
      // Hotels
      {
        route: "GET /api/hotels/list",
        desc: "List hotels by city code",
        amount: "32400",
      },
      {
        route: "GET /api/hotels/list/by-geocode",
        desc: "List hotels by latitude/longitude",
        amount: "32400",
      },
      {
        route: "GET /api/hotels/search",
        desc: "Search hotel offers by hotel IDs",
        amount: "32400",
      },
      {
        route: "GET /api/hotels/search/by-hotel",
        desc: "Search offers for a specific hotel",
        amount: "32400",
      },
      {
        route: "GET /api/hotels/offer",
        desc: "Get details for a specific hotel offer",
        amount: "32400",
      },
      {
        route: "POST /api/hotels/book",
        desc: "Book a hotel offer",
        amount: "2160",
      },
      {
        route: "GET /api/hotels/autocomplete",
        desc: "Autocomplete hotel names",
        amount: "5400",
      },
      // Activities
      {
        route: "GET /api/activities/search",
        desc: "Search tours & activities by lat/lng",
        amount: "54000",
      },
      {
        route: "GET /api/activities/by-square",
        desc: "Search activities within a geographic square",
        amount: "54000",
      },
      {
        route: "GET /api/activities/details",
        desc: "Get activity details by ID",
        amount: "54000",
      },
      // Transfers
      {
        route: "POST /api/transfers/search",
        desc: "Search airport transfer options",
        amount: "3240",
      },
      {
        route: "POST /api/transfers/book",
        desc: "Book a transfer",
        amount: "2160",
      },
      {
        route: "POST /api/transfers/cancel",
        desc: "Cancel a transfer booking",
        amount: "2160",
      },
      // Reference Data
      {
        route: "GET /api/reference/locations",
        desc: "Search locations (airports, cities) by keyword",
        amount: "5400",
      },
      {
        route: "GET /api/reference/airports",
        desc: "Find nearby airports by latitude/longitude",
        amount: "5400",
      },
      {
        route: "GET /api/reference/airlines",
        desc: "Look up airline by IATA code",
        amount: "5400",
      },
      {
        route: "GET /api/reference/airline-routes",
        desc: "Get routes for an airline from an airport",
        amount: "5400",
      },
      {
        route: "GET /api/reference/airport-routes",
        desc: "Get direct destinations from an airport",
        amount: "5400",
      },
      {
        route: "GET /api/reference/cities",
        desc: "Search cities by keyword",
        amount: "5400",
      },
      // FlightAware — Real-Time Flights
      {
        route: "GET /api/flightaware/flights/search",
        desc: "Search flights by query string",
        amount: "100000",
      },
      {
        route: "GET /api/flightaware/flights/search/positions",
        desc: "Search flights with position data",
        amount: "100000",
      },
      {
        route: "GET /api/flightaware/flights/search/count",
        desc: "Get count of flights matching a search",
        amount: "40000",
      },
      {
        route: "GET /api/flightaware/flights/search/advanced",
        desc: "Advanced flight search with complex query syntax",
        amount: "100000",
      },
      {
        route: "GET /api/flightaware/flights/:id",
        desc: "Get flights by ident (flight number, registration)",
        amount: "10000",
      },
      {
        route: "GET /api/flightaware/flights/:id/canonical",
        desc: "Get canonical ident for a flight",
        amount: "2000",
      },
      {
        route: "POST /api/flightaware/flights/:id/intents",
        desc: "Set flight intent for push notifications",
        amount: "1000",
      },
      {
        route: "GET /api/flightaware/flights/:id/position",
        desc: "Get latest position for a flight",
        amount: "20000",
      },
      {
        route: "GET /api/flightaware/flights/:id/track",
        desc: "Get full track/positions for a flight",
        amount: "24000",
      },
      {
        route: "GET /api/flightaware/flights/:id/route-info",
        desc: "Get route info (fixes, waypoints) for a flight",
        amount: "20000",
      },
      {
        route: "GET /api/flightaware/flights/:id/map",
        desc: "Get flight track map image (PNG)",
        amount: "60000",
      },
      // FlightAware — Airports
      {
        route: "GET /api/flightaware/airports",
        desc: "List all airports",
        amount: "10000",
      },
      {
        route: "GET /api/flightaware/airports/nearby",
        desc: "Find airports near a lat/lng",
        amount: "8000",
      },
      {
        route: "GET /api/flightaware/airports/delays",
        desc: "Get all airport delay information",
        amount: "100000",
      },
      {
        route: "GET /api/flightaware/airports/:id",
        desc: "Get airport info by code",
        amount: "30000",
      },
      {
        route: "GET /api/flightaware/airports/:id/canonical",
        desc: "Get canonical airport code",
        amount: "2000",
      },
      {
        route: "GET /api/flightaware/airports/:id/nearby",
        desc: "Find airports near a specific airport",
        amount: "8000",
      },
      {
        route: "GET /api/flightaware/airports/:id/delays",
        desc: "Get delays for a specific airport",
        amount: "20000",
      },
      {
        route: "GET /api/flightaware/airports/:id/flights",
        desc: "Get all flights at an airport",
        amount: "40000",
      },
      {
        route: "GET /api/flightaware/airports/:id/flights/arrivals",
        desc: "Get arrivals at an airport",
        amount: "10000",
      },
      {
        route: "GET /api/flightaware/airports/:id/flights/departures",
        desc: "Get departures from an airport",
        amount: "10000",
      },
      {
        route: "GET /api/flightaware/airports/:id/flights/scheduled-departures",
        desc: "Get scheduled departures",
        amount: "10000",
      },
      {
        route: "GET /api/flightaware/airports/:id/flights/scheduled-arrivals",
        desc: "Get scheduled arrivals",
        amount: "10000",
      },
      {
        route: "GET /api/flightaware/airports/:id/flights/to/:dest_id",
        desc: "Get flights between two airports",
        amount: "100000",
      },
      {
        route: "GET /api/flightaware/airports/:id/flights/counts",
        desc: "Get flight count statistics",
        amount: "200000",
      },
      {
        route: "GET /api/flightaware/airports/:id/weather/observations",
        desc: "Get METAR weather observations",
        amount: "4000",
      },
      {
        route: "GET /api/flightaware/airports/:id/weather/forecast",
        desc: "Get TAF weather forecast",
        amount: "4000",
      },
      {
        route: "GET /api/flightaware/airports/:id/routes/:dest_id",
        desc: "Get route info between airports",
        amount: "40000",
      },
      // FlightAware — Flight History
      {
        route: "GET /api/flightaware/history/flights/:id",
        desc: "Get historical flights by ident",
        amount: "40000",
      },
      {
        route: "GET /api/flightaware/history/flights/:id/track",
        desc: "Get historical flight track",
        amount: "120000",
      },
      {
        route: "GET /api/flightaware/history/flights/:id/map",
        desc: "Get historical flight map image (PNG)",
        amount: "280000",
      },
      {
        route: "GET /api/flightaware/history/flights/:id/route-info",
        desc: "Get historical flight route info",
        amount: "80000",
      },
      {
        route: "GET /api/flightaware/history/airports/:id/flights/arrivals",
        desc: "Get historical arrivals at airport",
        amount: "40000",
      },
      {
        route: "GET /api/flightaware/history/airports/:id/flights/departures",
        desc: "Get historical departures from airport",
        amount: "40000",
      },
      {
        route: "GET /api/flightaware/history/airports/:id/flights/to/:dest_id",
        desc: "Get historical flights between airports",
        amount: "240000",
      },
      {
        route:
          "GET /api/flightaware/history/aircraft/:registration/last-flight",
        desc: "Get last flight for an aircraft",
        amount: "400000",
      },
      {
        route: "GET /api/flightaware/history/operators/:id/flights",
        desc: "Get historical flights by operator",
        amount: "40000",
      },
      // FlightAware — Disruption Counts
      {
        route: "GET /api/flightaware/disruption-counts/:entity_type",
        desc: "Get disruption stats by entity type",
        amount: "10000",
      },
      {
        route: "GET /api/flightaware/disruption-counts/:entity_type/:id",
        desc: "Get disruption stats for a specific entity",
        amount: "10000",
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
    payments: [TEMPO_PAYMENT],
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
      "Pay-per-request social media data from TikTok, Instagram, Facebook, and Reddit.",

    categories: ["social", "data"],
    integration: "first-party",
    tags: ["tiktok", "instagram", "facebook", "reddit", "scraping", "social"],
    docs: {
      homepage: "https://stablesocial.dev",
      llmsTxt: "https://stablesocial.dev/llms.txt",
    },
    provider: { name: "Merit Systems", url: "https://stablesocial.dev" },
    realm: "stablesocial.dev",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
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
    payments: [TEMPO_PAYMENT],
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
    payments: [TEMPO_PAYMENT],
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

  // ── AviationStack ──────────────────────────────────────────────────────
  {
    id: "aviationstack",
    name: "AviationStack",
    url: "https://api.aviationstack.com",
    serviceUrl: `https://aviationstack.${MPP_REALM}`,
    description:
      "Real-time and historical flight tracking, airports, airlines, and schedules.",

    categories: ["data"],
    integration: "third-party",
    tags: ["flights", "aviation", "tracking", "airports", "airlines"],
    provider: { name: "AviationStack", url: "https://aviationstack.com" },
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v1/aircraft_types",
        desc: "Aircraft types lookup",
        amount: "5000",
      },
      { route: "GET /v1/airlines", desc: "Airlines lookup", amount: "5000" },
      { route: "GET /v1/airplanes", desc: "Airplanes lookup", amount: "5000" },
      { route: "GET /v1/airports", desc: "Airports lookup", amount: "5000" },
      { route: "GET /v1/cities", desc: "Cities lookup", amount: "5000" },
      { route: "GET /v1/countries", desc: "Countries lookup", amount: "5000" },
      { route: "GET /v1/flights", desc: "Real-time flights", amount: "5000" },
      {
        route: "GET /v1/flightsFuture",
        desc: "Future flight schedules",
        amount: "5000",
      },
      { route: "GET /v1/routes", desc: "Routes lookup", amount: "5000" },
      { route: "GET /v1/taxes", desc: "Aviation taxes lookup", amount: "5000" },
      { route: "GET /v1/timetable", desc: "Flight schedules", amount: "5000" },
    ],
  },

  // ── Code Storage ───────────────────────────────────────────────────────
  {
    id: "codestorage",
    name: "Code Storage",
    url: "https://code.storage",
    serviceUrl: `https://codestorage.${MPP_REALM}`,
    description:
      "Paid Git repository creation — create repos and get authenticated clone URLs.",

    categories: ["storage"],
    integration: "third-party",
    tags: ["git", "repos", "code", "storage"],
    docs: {
      llmsTxt: "https://code.storage/docs/llms.txt",
    },
    provider: { name: "Code Storage", url: "https://code.storage" },
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /repos/:id",
        desc: "Get clone URL for a repository",
        amount: "10000",
      },
      {
        route: "POST /repos",
        desc: "Create a Git repository",
        amount: "1000000",
      },
    ],
  },

  // ── FlightAPI ──────────────────────────────────────────────────────────
  {
    id: "flightapi",
    name: "FlightAPI",
    url: "https://api.flightapi.io",
    serviceUrl: `https://flightapi.${MPP_REALM}`,
    description:
      "Real-time flight prices, tracking, and airport schedules from 700+ airlines.",

    categories: ["data"],
    integration: "third-party",
    tags: ["flights", "prices", "tracking", "airports", "airlines"],
    provider: { name: "FlightAPI", url: "https://flightapi.io" },
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      { route: "GET /airline/:rest*", desc: "Track a flight", amount: "2000" },
      {
        route: "GET /iata/:rest*",
        desc: "Airline/airport code lookup",
        amount: "2000",
      },
      {
        route: "GET /multitrip/:rest*",
        desc: "Multi-city flight price search",
        amount: "8000",
      },
      {
        route: "GET /onewaytrip/:rest*",
        desc: "One-way flight price search",
        amount: "3000",
      },
      {
        route: "GET /roundtrip/:rest*",
        desc: "Round-trip flight price search",
        amount: "3000",
      },
      {
        route: "GET /schedule/:rest*",
        desc: "Airport schedule",
        amount: "3000",
      },
      {
        route: "GET /trackbyroute/:rest*",
        desc: "Track flights between airports",
        amount: "2000",
      },
    ],
  },

  // ── GoFlightLabs ───────────────────────────────────────────────────────
  {
    id: "goflightlabs",
    name: "GoFlightLabs",
    url: "https://goflightlabs.com",
    serviceUrl: `https://goflightlabs.${MPP_REALM}`,
    description:
      "Real-time flight tracking, prices, schedules, and airline data.",

    categories: ["data"],
    integration: "third-party",
    tags: ["flights", "tracking", "prices", "airlines", "airports"],
    provider: { name: "GoFlightLabs", url: "https://goflightlabs.com" },
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /airports-by-filters",
        desc: "Airports by filter",
        amount: "5000",
      },
      {
        route: "GET /flight-data-by-date",
        desc: "Flight data by date",
        amount: "5000",
      },
      { route: "GET /flight-delay", desc: "Flight delay info", amount: "5000" },
      {
        route: "GET /flight-info-by-flight-number",
        desc: "Flight info by number",
        amount: "5000",
      },
      {
        route: "GET /flight-prices",
        desc: "Flight price search",
        amount: "10000",
      },
      { route: "GET /flights", desc: "Real-time flights", amount: "5000" },
      {
        route: "GET /flights-airline",
        desc: "Flights by airline",
        amount: "5000",
      },
      {
        route: "GET /flights-callsign",
        desc: "Flights by callsign",
        amount: "5000",
      },
      {
        route: "GET /flights-history",
        desc: "Historical flights",
        amount: "5000",
      },
      {
        route: "GET /flights-schedules",
        desc: "Flight schedules",
        amount: "5000",
      },
      {
        route: "GET /future-flights",
        desc: "Future flight predictions",
        amount: "5000",
      },
      {
        route: "GET /retrieve-airlines",
        desc: "Retrieve airlines",
        amount: "5000",
      },
      {
        route: "GET /retrieve-airports",
        desc: "Retrieve airports",
        amount: "5000",
      },
      {
        route: "GET /retrieve-countries",
        desc: "Retrieve countries",
        amount: "5000",
      },
      { route: "GET /retrieve-routes", desc: "Airline routes", amount: "5000" },
    ],
  },

  // ── Oxylabs ─────────────────────────────────────────────────────────────
  {
    id: "oxylabs",
    name: "Oxylabs",
    url: "https://realtime.oxylabs.io",
    serviceUrl: `https://oxylabs.${MPP_REALM}`,
    description:
      "Web scraping API with geo-targeting by country, state, and city. Fetch any public URL with JavaScript rendering support.",

    categories: ["web", "data"],
    integration: "third-party",
    tags: ["scraping", "web-scraping", "geo-targeting", "data-extraction"],
    docs: {
      apiReference:
        "https://developers.oxylabs.io/scraper-apis/web-scraper-api",
    },
    provider: { name: "Oxylabs", url: "https://oxylabs.io" },
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v1/proxy",
        desc: "Scrape a public URL with optional geo-targeting and JS rendering",
        dynamic: true,
      },
    ],
  },

  // ── SpyFu ──────────────────────────────────────────────────────────────
  {
    id: "spyfu",
    name: "SpyFu",
    url: "https://api.spyfu.com",
    serviceUrl: `https://spyfu.${MPP_REALM}`,
    description:
      "Competitor keyword research — SEO rankings, PPC ads, ad history, and domain analytics. 18+ years of historical data.",

    categories: ["data", "search"],
    integration: "third-party",
    tags: ["seo", "ppc", "keyword-research", "competitor-analysis", "ads"],
    docs: {
      homepage: "https://developer.spyfu.com",
      apiReference: "https://developer.spyfu.com",
    },
    provider: { name: "SpyFu", url: "https://spyfu.com" },
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /apis/domain_stats_api/v2/*",
        desc: "Domain stats lookup",
        amount: "10000",
      },
      {
        route: "GET /apis/serp_api/v2/seo/*",
        desc: "SEO keyword research",
        amount: "10000",
      },
      {
        route: "GET /apis/serp_api/v2/ppc/*",
        desc: "PPC keyword research",
        amount: "20000",
      },
      {
        route: "GET /apis/keyword_api/v2/ppc/*",
        desc: "PPC keyword research",
        amount: "20000",
      },
      {
        route: "GET /apis/cloud_ad_history_api/v2/*",
        desc: "Ad history research",
        amount: "30000",
      },
      {
        route: "GET /apis/competitors_api/v2/*",
        desc: "Competitor analysis",
        amount: "10000",
      },
      {
        route: "GET /apis/keyword_api/v2/kombat/*",
        desc: "Keyword overlap analysis",
        amount: "20000",
      },
      {
        route: "GET /apis/keyword_api/v2/related/*",
        desc: "Keyword research",
        amount: "20000",
      },
      {
        route: "GET /apis/organic_history_api/v2/*",
        desc: "Ranking history research",
        amount: "30000",
      },
    ],
  },

  // ── SerpApi ────────────────────────────────────────────────────────────
  {
    id: "serpapi",
    name: "SerpApi",
    url: "https://serpapi.com",
    serviceUrl: `https://serpapi.${MPP_REALM}`,
    description:
      "Google Flights search — real-time prices, schedules, and booking options.",

    categories: ["search", "data"],
    integration: "third-party",
    tags: ["search", "flights", "google", "prices"],
    provider: { name: "SerpApi", url: "https://serpapi.com" },
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      { route: "GET /search", desc: "Google Flights search", amount: "15000" },
    ],
  },

  // ── Google Maps ─────────────────────────────────────────────────────
  {
    id: "googlemaps",
    name: "Google Maps",
    url: "https://maps.googleapis.com",
    serviceUrl: `https://googlemaps.${MPP_REALM}`,
    description:
      "Google Maps Platform — geocoding, directions, places, routes, tiles, weather, air quality, and more.",

    categories: ["data"],
    integration: "third-party",
    tags: [
      "maps",
      "google",
      "geocoding",
      "directions",
      "places",
      "routes",
      "tiles",
      "weather",
      "air-quality",
      "solar",
      "roads",
      "pollen",
      "geolocation",
      "aerial",
      "validation",
    ],
    docs: {
      homepage: "https://developers.google.com/maps",
      apiReference: "https://developers.google.com/maps/documentation",
    },
    provider: { name: "Google", url: "https://developers.google.com/maps" },
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      // Legacy REST (maps.googleapis.com/maps/api)
      {
        route: "GET /maps/geocode/json",
        desc: "Geocode an address or reverse-geocode coordinates",
        amount: "5000",
      },
      {
        route: "GET /maps/directions/json",
        desc: "Get directions between locations",
        amount: "5000",
      },
      {
        route: "GET /maps/distancematrix/json",
        desc: "Travel time and distance for origin-destination pairs",
        amount: "5000",
      },
      {
        route: "GET /maps/elevation/json",
        desc: "Get elevation for locations",
        amount: "5000",
      },
      {
        route: "GET /maps/timezone/json",
        desc: "Get time zone for coordinates",
        amount: "5000",
      },
      {
        route: "GET /maps/staticmap",
        desc: "Generate a static map image",
        amount: "2000",
      },
      {
        route: "GET /maps/streetview",
        desc: "Get a static Street View image",
        amount: "7000",
      },
      {
        route: "GET /maps/streetview/metadata",
        desc: "Get Street View metadata",
      },
      {
        route: "GET /maps/place/textsearch/json",
        desc: "Search places by text query",
        amount: "32000",
      },
      {
        route: "GET /maps/place/nearbysearch/json",
        desc: "Search nearby places",
        amount: "32000",
      },
      {
        route: "GET /maps/place/details/json",
        desc: "Get place details",
        amount: "17000",
      },
      {
        route: "GET /maps/place/findplacefromtext/json",
        desc: "Find a place from text",
        amount: "17000",
      },
      {
        route: "GET /maps/place/autocomplete/json",
        desc: "Place autocomplete suggestions",
        amount: "2830",
      },
      {
        route: "GET /maps/place/queryautocomplete/json",
        desc: "Query autocomplete suggestions",
        amount: "2830",
      },
      {
        route: "GET /maps/place/photo",
        desc: "Get a place photo",
        amount: "7000",
      },
      // Routes API
      {
        route: "POST /routes/directions/v2:computeRoutes",
        desc: "Compute routes between locations",
        amount: "5000",
      },
      {
        route: "POST /routes/distanceMatrix/v2:computeRouteMatrix",
        desc: "Compute distance matrix",
        amount: "5000",
      },
      // Places (New) API
      {
        route: "GET /places/v1/places/:id",
        desc: "Get place details (essentials)",
        amount: "5000",
      },
      {
        route: "POST /places/v1/places:searchText",
        desc: "Text search for places",
        amount: "32000",
      },
      {
        route: "POST /places/v1/places:searchNearby",
        desc: "Nearby search for places",
        amount: "32000",
      },
      {
        route: "POST /places/v1/places:autocomplete",
        desc: "Place autocomplete",
        amount: "2830",
      },
      {
        route: "GET /places/v1/places/:id/photos/:photoId/media",
        desc: "Get a place photo",
        amount: "7000",
      },
      // Tiles API
      {
        route: "GET /tiles/v1/2dtiles/:z/:x/:y",
        desc: "Get a 2D map tile",
        amount: "600",
      },
      {
        route: "GET /tiles/v1/streetview/tiles/:panoId/:z/:x/:y",
        desc: "Get a Street View tile",
        amount: "2000",
      },
      {
        route: "GET /tiles/v1/3dtiles/root.json",
        desc: "Get 3D tiles root",
        amount: "6000",
      },
      { route: "GET /tiles/v1/createSession", desc: "Create a tile session" },
      // Roads API
      {
        route: "GET /roads/v1/nearestRoads",
        desc: "Find nearest roads to coordinates",
        amount: "10000",
      },
      {
        route: "GET /roads/v1/snapToRoads",
        desc: "Snap GPS coordinates to roads",
        amount: "10000",
      },
      // Address Validation API
      {
        route: "POST /validation/v1:validateAddress",
        desc: "Validate a postal address",
        amount: "17000",
      },
      {
        route: "POST /validation/v1:provideValidationFeedback",
        desc: "Provide validation feedback",
      },
      // Solar API
      {
        route: "GET /solar/v1/buildingInsights:findClosest",
        desc: "Get building solar insights",
        amount: "10000",
      },
      {
        route: "GET /solar/v1/dataLayers:get",
        desc: "Get solar data layers",
        amount: "75000",
      },
      // Aerial View API
      {
        route: "GET /aerialview/v1/videos:lookupVideo",
        desc: "Look up an aerial view video",
        amount: "16000",
      },
      {
        route: "POST /aerialview/v1/videos:renderVideo",
        desc: "Render an aerial view video",
        amount: "16000",
      },
      {
        route: "GET /aerialview/v1/videos:lookupVideoMetadata",
        desc: "Look up video metadata",
      },
      // Air Quality API
      {
        route: "POST /airquality/v1/currentConditions:lookup",
        desc: "Get current air quality conditions",
        amount: "5000",
      },
      {
        route: "POST /airquality/v1/history:lookup",
        desc: "Get air quality history",
        amount: "5000",
      },
      // Pollen API
      {
        route: "GET /pollen/v1/forecast:lookup",
        desc: "Get pollen forecast",
        amount: "10000",
      },
      // Geolocation API
      {
        route: "POST /geolocation/geolocation/v1/geolocate",
        desc: "Geolocate a device",
        amount: "5000",
      },
      // Weather API
      {
        route: "GET /weather/v1/currentConditions:lookup",
        desc: "Get current weather conditions",
        amount: "150",
      },
      {
        route: "GET /weather/v1/forecast/hours:lookup",
        desc: "Get hourly weather forecast",
        amount: "150",
      },
      {
        route: "GET /weather/v1/forecast/days:lookup",
        desc: "Get daily weather forecast",
        amount: "150",
      },
      {
        route: "GET /weather/v1/history/hours:lookup",
        desc: "Get hourly weather history",
        amount: "150",
      },
    ],
  },

  // ── KicksDB ────────────────────────────────────────────────────────
  {
    id: "kicksdb",
    name: "KicksDB",
    url: "https://api.kicks.dev",
    serviceUrl: `https://kicksdb.${MPP_REALM}`,
    description:
      "Sneaker & streetwear market data — prices, sales history, and availability from StockX, GOAT, and more.",

    categories: ["data"],
    integration: "third-party",
    tags: ["sneakers", "streetwear", "prices", "stockx", "goat"],
    docs: {
      homepage: "https://kicks.dev",
      llmsTxt: "https://docs.kicks.dev/llms.txt",
      apiReference: "https://docs.kicks.dev",
    },
    provider: { name: "KicksDB", url: "https://kicks.dev" },
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      // Standard API — StockX
      {
        route: "GET /v3/stockx/products",
        desc: "Search StockX products",
        amount: "500",
      },
      {
        route: "GET /v3/stockx/products/:id",
        desc: "Get a StockX product",
        amount: "500",
      },
      {
        route: "GET /v3/stockx/products/:id/sales",
        desc: "StockX sales history",
        amount: "500",
      },
      {
        route: "GET /v3/stockx/products/:id/sales/daily",
        desc: "StockX daily sales data",
        amount: "500",
      },
      {
        route: "POST /v3/stockx/prices",
        desc: "StockX batch prices",
        amount: "500",
      },
      // Standard API — GOAT
      {
        route: "GET /v3/goat/products",
        desc: "Search GOAT products",
        amount: "500",
      },
      {
        route: "GET /v3/goat/products/:id",
        desc: "Get a GOAT product",
        amount: "500",
      },
      {
        route: "GET /v3/goat/products/:id/sales",
        desc: "GOAT sales history",
        amount: "500",
      },
      {
        route: "GET /v3/goat/products/:id/sales/daily",
        desc: "GOAT daily sales data",
        amount: "500",
      },
      // Standard API — Shopify, SNKRS, Kream, Novelship
      {
        route: "GET /v3/shopify/products",
        desc: "Search Shopify products",
        amount: "500",
      },
      {
        route: "GET /v3/shopify/products/:id",
        desc: "Get a Shopify product",
        amount: "500",
      },
      {
        route: "GET /v3/shopify/shops",
        desc: "List Shopify shops",
        amount: "500",
      },
      {
        route: "GET /v3/snkrs/products",
        desc: "Search SNKRS products",
        amount: "500",
      },
      {
        route: "GET /v3/kream/products",
        desc: "Search Kream products",
        amount: "500",
      },
      {
        route: "GET /v3/kream/products/:id",
        desc: "Get a Kream product",
        amount: "500",
      },
      {
        route: "GET /v3/novelship/products",
        desc: "Search Novelship products",
        amount: "500",
      },
      // Unified API
      {
        route: "GET /v3/unified/products/:id",
        desc: "Get a unified product",
        amount: "500",
      },
      {
        route: "GET /v3/unified/gtin",
        desc: "Look up unified product by GTIN/barcode",
        amount: "500",
      },
      // Exports
      {
        route: "GET /v3/exports/daily",
        desc: "Daily CSV snapshot",
        amount: "500",
      },
      // Real-Time API
      {
        route: "GET /v3/realtime/stockx/products",
        desc: "Search StockX in real-time",
        amount: "5000",
      },
      {
        route: "GET /v3/realtime/stockx/products/:id",
        desc: "Get StockX product in real-time",
        amount: "5000",
      },
      {
        route: "GET /v3/realtime/stockx/products/:id/asks",
        desc: "StockX real-time asks/bids",
        amount: "5000",
      },
      {
        route: "GET /v3/realtime/stockx/products/:id/sales",
        desc: "StockX real-time sales",
        amount: "5000",
      },
      {
        route: "GET /v3/realtime/stockx/products/:id/related",
        desc: "StockX real-time related products",
        amount: "5000",
      },
      {
        route: "GET /v3/realtime/goat/products",
        desc: "Search GOAT in real-time",
        amount: "5000",
      },
      {
        route: "GET /v3/realtime/goat/products/:id",
        desc: "Get GOAT product in real-time",
        amount: "5000",
      },
      {
        route: "GET /v3/realtime/goat/products/:id/offers",
        desc: "GOAT real-time offers",
        amount: "5000",
      },
      {
        route: "GET /v3/realtime/goat/products/:id/sales",
        desc: "GOAT real-time sales",
        amount: "5000",
      },
      {
        route: "GET /v3/realtime/alias/products/:id/recent-orders",
        desc: "Real-time recent orders by alias",
        amount: "5000",
      },
    ],
  },

  // ── 2Captcha ───────────────────────────────────────────────────────
  {
    id: "twocaptcha",
    name: "2Captcha",
    url: "https://api.2captcha.com",
    serviceUrl: `https://twocaptcha.${MPP_REALM}`,
    description:
      "CAPTCHA solving API — reCAPTCHA, Turnstile, hCaptcha, image captchas, and more.",

    categories: ["web"],
    integration: "third-party",
    tags: ["captcha", "automation", "solving"],
    docs: {
      homepage: "https://2captcha.com",
      apiReference: "https://2captcha.com/api-docs",
    },
    provider: { name: "2Captcha", url: "https://2captcha.com" },
    realm: MPP_REALM,
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /createTask",
        desc: "Submit a captcha task for solving",
        amount: "3000",
      },
      { route: "POST /getTaskResult", desc: "Poll for task result" },
    ],
  },

  // ── PostalForm ──────────────────────────────────────────────────────────
  {
    id: "postalform",
    name: "PostalForm",
    url: "https://postalform.com",
    serviceUrl: "https://postalform.com",
    description: "Print and mail real letters and documents via AI agents.",

    categories: ["web"],
    integration: "first-party",
    tags: ["mail", "print", "letters", "physical", "postal"],
    docs: {
      homepage: "https://postalform.com/agents",
    },
    provider: { name: "PostalForm", url: "https://postalform.com" },
    realm: "postalform.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT, STRIPE_PAYMENT],
    endpoints: [
      {
        route: "POST /api/machine/mpp/orders/validate",
        desc: "Quote and validate an order before payment",
      },
      {
        route: "POST /api/machine/mpp/orders",
        desc: "Create and pay for a print-and-mail order",
        dynamic: true,
        amountHint: "Varies",
      },
      {
        route: "GET /api/machine/mpp/orders/:id",
        desc: "Poll order status and fulfillment",
      },
    ],
  },

  // ── Prospect Butcher Co ─────────────────────────────────────────────────
  {
    id: "prospect-butcher",
    name: "Prospect Butcher",
    url: "https://agents.prospectbutcher.shop",
    serviceUrl: "https://agents.prospectbutcher.shop",
    description:
      "Order sandwiches for pickup in Brooklyn — the first food purchase made entirely by an AI agent.",

    categories: ["web"],
    integration: "first-party",
    tags: ["food", "ordering", "sandwiches", "physical", "restaurant"],
    docs: {
      homepage: "https://agents.prospectbutcher.shop",
      llmsTxt: "https://agents.prospectbutcher.shop/llms.txt",
    },
    provider: {
      name: "Prospect Butcher",
      url: "https://www.prospectbutcher.com",
    },
    realm: "agents.prospectbutcher.shop",
    intent: "charge",
    payments: [STRIPE_PAYMENT],
    endpoints: [
      {
        route: "GET /buy/:slug",
        desc: "Purchase a sandwich",
        dynamic: true,
        amountHint: "Varies",
      },
    ],
  },

  // ── Martin Estate Winery ────────────────────────────────────────────────
  {
    id: "martin-estate",
    name: "Martin Estate Winery",
    url: "https://www.martinestate.com",
    serviceUrl: "https://agents.martinestate.com",
    description:
      "Estate-grown Napa Valley wine. AI agents can browse and purchase wine with identity verification (KYC, age 21+, US only) via AgentScore.",

    categories: ["web"],
    integration: "first-party",
    tags: [
      "wine",
      "commerce",
      "alcohol",
      "age-restricted",
      "physical-goods",
      "napa-valley",
    ],
    status: "active",
    docs: {
      homepage: "https://www.martinestate.com",
      llmsTxt: "https://agents.martinestate.com/llms.txt",
      apiReference: "https://agents.martinestate.com/openapi.json",
    },
    provider: { name: "Martin Estate", url: "https://www.martinestate.com" },
    realm: "agents.martinestate.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT, STRIPE_PAYMENT],
    endpoints: [
      {
        route: "GET /catalog",
        desc: "List purchasable wines",
      },
      {
        route: "GET /catalog/:slug",
        desc: "Get wine details by slug",
      },
      {
        route: "POST /purchase",
        desc: "Purchase wine with identity verification via AgentScore and MPP payment",
        dynamic: true,
        amountHint: "Variable",
      },
      {
        route: "GET /orders/:id",
        desc: "Retrieve order details",
      },
      {
        route: "GET /orders/:id/status",
        desc: "Check payment status",
      },
    ],
  },

  // ── Sayer & Stone ───────────────────────────────────────────────────────
  {
    id: "sayer-and-stone",
    name: "Sayer & Stone",
    url: "https://www.sayerandstone.com",
    serviceUrl: "https://agents.sayerandstone.com",
    description:
      "Lab-grown diamond fine jewelry, made to order. AI agents can browse and purchase pieces.",

    categories: ["web"],
    integration: "first-party",
    tags: [
      "jewelry",
      "commerce",
      "physical-goods",
      "lab-grown-diamond",
      "made-to-order",
      "luxury",
    ],
    status: "active",
    docs: {
      homepage: "https://www.sayerandstone.com",
      llmsTxt: "https://agents.sayerandstone.com/llms.txt",
      apiReference: "https://agents.sayerandstone.com/openapi.json",
    },
    provider: { name: "Sayer & Stone", url: "https://www.sayerandstone.com" },
    realm: "agents.sayerandstone.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT, STRIPE_PAYMENT],
    endpoints: [
      {
        route: "GET /catalog",
        desc: "List products with embedded variants",
      },
      {
        route: "GET /catalog/:slug",
        desc: "Get product detail by slug, including all variants",
      },
      {
        route: "POST /purchase",
        desc: "Purchase a jewelry piece",
        dynamic: true,
        amountHint: "Variable",
      },
      {
        route: "GET /orders/:id",
        desc: "Retrieve order details",
      },
      {
        route: "GET /orders/:id/status",
        desc: "Check payment status",
      },
    ],
  },

  // ── Megapot ─────────────────────────────────────────────────────────────
  {
    id: "megapot",
    name: "Megapot",
    url: "https://megapot.io",
    serviceUrl: "https://megapot.mpp.paysponge.com",
    description:
      "Global internet lottery tickets. AI agents can purchase Megapot tickets and check ticket status through MPP.",

    categories: ["web", "blockchain"],
    integration: "third-party",
    tags: ["lottery", "gaming", "tickets", "base", "agent-commerce"],
    status: "active",
    docs: {
      homepage: "https://megapot.io",
      apiReference: "https://megapot.mpp.paysponge.com/openapi.json",
    },
    provider: { name: "Megapot", url: "https://megapot.io" },
    realm: "megapot.mpp.paysponge.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /purchase",
        desc: "Purchase a Megapot lottery ticket for a recipient wallet",
        amount: "1000000",
      },
      {
        route: "POST /status",
        desc: "Check Megapot ticket status and winnings",
        amount: "0",
      },
    ],
  },

  // =========================================================================
  // Locus — Pay-per-use API proxy (paywithlocus.com)
  //
  // Each provider runs on its own subdomain: {provider}.mpp.paywithlocus.com
  // Agents pay via Tempo USDC.e, no account needed. Automatic refunds on
  // upstream failure. Docs: https://paywithlocus.com/mpp/
  // OpenAPI discovery: GET https://{provider}.mpp.paywithlocus.com/openapi.json
  // =========================================================================

  // ── Alpha Vantage ────────────────────────────────────────────────────
  {
    id: "alphavantage",
    name: "Alpha Vantage",
    url: "https://www.alphavantage.co",
    serviceUrl: "https://alphavantage.mpp.paywithlocus.com",
    description:
      "Financial market data — stock prices, forex, crypto, commodities, economic indicators, technical analysis, and news sentiment.",

    categories: ["data"],
    integration: "third-party",
    tags: [
      "finance",
      "stocks",
      "forex",
      "crypto",
      "market-data",
      "technical-analysis",
    ],
    docs: {
      homepage: "https://www.alphavantage.co/documentation/",
      llmsTxt: "https://paywithlocus.com/mpp/alphavantage.md",
    },
    provider: { name: "Alpha Vantage", url: "https://www.alphavantage.co" },
    realm: "alphavantage.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /alphavantage/time-series-intraday",
        desc: "Intraday Time Series",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/time-series-daily",
        desc: "Daily Time Series",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/time-series-weekly",
        desc: "Weekly Time Series",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/time-series-monthly",
        desc: "Monthly Time Series",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/global-quote",
        desc: "Global Quote",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/symbol-search",
        desc: "Symbol Search",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/market-status",
        desc: "Market Status",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/top-gainers-losers",
        desc: "Top Gainers & Losers",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/news-sentiment",
        desc: "News Sentiment",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/earnings-call-transcript",
        desc: "Earnings Call Transcript",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/company-overview",
        desc: "Company Overview",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/income-statement",
        desc: "Income Statement",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/balance-sheet",
        desc: "Balance Sheet",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/cash-flow",
        desc: "Cash Flow",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/earnings",
        desc: "Earnings",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/currency-exchange-rate",
        desc: "Currency Exchange Rate",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/fx-daily",
        desc: "FX Daily",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/crypto-exchange-rate",
        desc: "Crypto Exchange Rate",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/digital-currency-daily",
        desc: "Digital Currency Daily",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/commodity-price",
        desc: "Commodity Price",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/economic-indicator",
        desc: "Economic Indicator",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/sma",
        desc: "SMA (Simple Moving Average)",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/ema",
        desc: "EMA (Exponential Moving Average)",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/macd",
        desc: "MACD",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/rsi",
        desc: "RSI (Relative Strength Index)",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /alphavantage/bbands",
        desc: "Bollinger Bands",
        amount: "8000",
        unitType: "request",
      },
    ],
  },

  // ── Apollo ───────────────────────────────────────────────────────────
  {
    id: "apollo",
    name: "Apollo",
    url: "https://www.apollo.io",
    serviceUrl: "https://apollo.mpp.paywithlocus.com",
    description:
      "People and company enrichment, lead search, and sales intelligence with 275M+ contacts.",

    categories: ["data"],
    integration: "third-party",
    tags: ["leads", "enrichment", "contacts", "sales-intelligence", "b2b"],
    docs: {
      homepage: "https://docs.apollo.io",
      llmsTxt: "https://paywithlocus.com/mpp/apollo.md",
    },
    provider: { name: "Apollo", url: "https://www.apollo.io" },
    realm: "apollo.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /apollo/people-enrichment",
        desc: "People Enrichment",
        dynamic: true,
        amountHint: "$0.008-$0.043",
      },
      {
        route: "POST /apollo/bulk-people-enrichment",
        desc: "Bulk People Enrichment",
        dynamic: true,
        amountHint: "$0.008-$0.043/person",
      },
      {
        route: "POST /apollo/org-enrichment",
        desc: "Organization Enrichment",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /apollo/bulk-org-enrichment",
        desc: "Bulk Organization Enrichment",
        dynamic: true,
        amountHint: "$0.008/org",
      },
      {
        route: "POST /apollo/people-search",
        desc: "People Search",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /apollo/org-search",
        desc: "Organization Search",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /apollo/job-postings",
        desc: "Organization Job Postings",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /apollo/news-search",
        desc: "News Articles Search",
        amount: "5000",
        unitType: "request",
      },
    ],
  },

  // ── Auto.exchange ────────────────────────────────────────────────────
  {
    id: "autoexchange",
    name: "Auto.exchange",
    url: "https://auto.exchange",
    serviceUrl: "https://api.auto.exchange",
    description:
      "The agent exchange. Discover, hire, and pay agents for coding, design, writing, and more. Pay per request with stablecoins on Tempo.",

    categories: ["ai"],
    integration: "first-party",
    tags: [
      "agents",
      "marketplace",
      "exchange",
      "coding",
      "design",
      "writing",
      "ai-agents",
    ],
    status: "active",
    docs: {
      homepage: "https://auto.exchange/docs",
      llmsTxt: "https://auto.exchange/docs/llms.txt",
    },
    provider: { name: "Auto.exchange", url: "https://auto.exchange" },
    realm: "api.auto.exchange",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /agents",
        desc: "List all available agents on the marketplace",
      },
      {
        route: "GET /agents/search",
        desc: "Search agents by name, skills, or description",
      },
      {
        route: "GET /agents/by-slug/:slug",
        desc: "Look up an agent by its slug",
      },
      {
        route: "POST /agents/:id/run",
        desc: "Execute an agent — price varies by agent and token usage",
        dynamic: true,
        amountHint: "$0.0006 – $0.075 per 1k tokens",
        unitType: "request",
      },
    ],
  },

  // ── Billboard ────────────────────────────────────────────────────────
  {
    id: "billboard",
    name: "Billboard",
    url: "https://x.com/MPPBillboard",
    serviceUrl: "https://billboard.mpp.paywithlocus.com",
    description:
      "Post to @MPPBillboard on X. Price starts at $0.01 and doubles with every post. The ultimate AI agent billboard.",

    categories: ["data"],
    integration: "third-party",
    tags: ["advertising", "billboard", "mpp-billboard"],
    docs: {
      homepage: "https://x.com/MPPBillboard",
      llmsTxt: "https://paywithlocus.com/mpp/billboard.md",
    },
    provider: { name: "Billboard", url: "https://x.com/MPPBillboard" },
    realm: "billboard.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /billboard/post",
        desc: "Post",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /billboard/get-price",
        desc: "Get Price",
      },
    ],
  },

  // ── Brave Search ─────────────────────────────────────────────────────
  {
    id: "brave",
    name: "Brave Search",
    url: "https://brave.com/search",
    serviceUrl: "https://brave.mpp.paywithlocus.com",
    description:
      "Independent web search — web, news, images, videos, AI answers, and LLM context. Privacy-first search from a large independent index.",

    categories: ["search"],
    integration: "third-party",
    tags: ["search", "web-search", "privacy", "news", "images"],
    docs: {
      homepage: "https://api.search.brave.com/app/#/documentation",
      llmsTxt: "https://paywithlocus.com/mpp/brave.md",
    },
    provider: { name: "Brave Search", url: "https://brave.com/search" },
    realm: "brave.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /brave/web-search",
        desc: "Web Search",
        amount: "35000",
        unitType: "request",
      },
      {
        route: "POST /brave/news-search",
        desc: "News Search",
        amount: "35000",
        unitType: "request",
      },
      {
        route: "POST /brave/image-search",
        desc: "Image Search",
        amount: "35000",
        unitType: "request",
      },
      {
        route: "POST /brave/video-search",
        desc: "Video Search",
        amount: "35000",
        unitType: "request",
      },
      {
        route: "POST /brave/llm-context",
        desc: "LLM Context",
        amount: "35000",
        unitType: "request",
      },
      {
        route: "POST /brave/answers",
        desc: "AI Answers",
        amount: "85000",
        unitType: "request",
      },
    ],
  },

  // ── BuiltWith ────────────────────────────────────────────────────────
  {
    id: "builtwith",
    name: "BuiltWith",
    url: "https://builtwith.com",
    serviceUrl: "https://builtwith.mpp.paywithlocus.com",
    description:
      "Technology profiling for websites — detect tech stacks, find sites using specific technologies, discover domain relationships, trends, and competitive intelligence across 100M+ websites.",

    categories: ["data"],
    integration: "third-party",
    tags: [
      "technology-profiling",
      "tech-stack",
      "competitive-intel",
      "domains",
    ],
    docs: {
      homepage: "https://api.builtwith.com",
      llmsTxt: "https://paywithlocus.com/mpp/builtwith.md",
    },
    provider: { name: "BuiltWith", url: "https://builtwith.com" },
    realm: "builtwith.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /builtwith/domain",
        desc: "Domain Lookup",
        amount: "55000",
        unitType: "request",
      },
      {
        route: "POST /builtwith/lists",
        desc: "Technology Lists",
        amount: "55000",
        unitType: "request",
      },
      {
        route: "POST /builtwith/relationships",
        desc: "Relationships",
        amount: "55000",
        unitType: "request",
      },
      {
        route: "POST /builtwith/company-to-url",
        desc: "Company to URL",
        amount: "55000",
        unitType: "request",
      },
      {
        route: "POST /builtwith/tags",
        desc: "Tags",
        amount: "55000",
        unitType: "request",
      },
      {
        route: "POST /builtwith/product",
        desc: "Product Search",
        amount: "55000",
        unitType: "request",
      },
      {
        route: "POST /builtwith/recommendations",
        desc: "Recommendations",
        amount: "35000",
        unitType: "request",
      },
      {
        route: "POST /builtwith/redirects",
        desc: "Redirects",
        amount: "35000",
        unitType: "request",
      },
      {
        route: "POST /builtwith/keywords",
        desc: "Keywords",
        amount: "35000",
        unitType: "request",
      },
      {
        route: "POST /builtwith/trends",
        desc: "Trends",
        amount: "35000",
        unitType: "request",
      },
      {
        route: "POST /builtwith/trust",
        desc: "Trust",
        amount: "35000",
        unitType: "request",
      },
      {
        route: "POST /builtwith/free",
        desc: "Free Summary",
        amount: "15000",
        unitType: "request",
      },
    ],
  },

  // ── Clado ────────────────────────────────────────────────────────────
  {
    id: "clado",
    name: "Clado",
    url: "https://clado.ai",
    serviceUrl: "https://clado.mpp.paywithlocus.com",
    description:
      "People search, LinkedIn enrichment, and deep research for lead generation.",

    categories: ["data"],
    integration: "third-party",
    tags: ["linkedin", "enrichment", "leads", "deep-research", "people-search"],
    docs: {
      homepage: "https://docs.clado.ai",
      llmsTxt: "https://paywithlocus.com/mpp/clado.md",
    },
    provider: { name: "Clado", url: "https://clado.ai" },
    realm: "clado.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /clado/search",
        desc: "Search",
        dynamic: true,
        amountHint: "$0.01/result",
      },
      {
        route: "POST /clado/deep-research",
        desc: "Deep Research",
        dynamic: true,
        amountHint: "$0.01/result",
      },
      {
        route: "POST /clado/deep-research-status",
        desc: "Deep Research Status",
        amount: "3000",
        unitType: "request",
      },
      {
        route: "POST /clado/deep-research-cancel",
        desc: "Cancel Deep Research",
        amount: "3000",
        unitType: "request",
      },
      {
        route: "POST /clado/deep-research-more",
        desc: "Deep Research More",
        dynamic: true,
        amountHint: "$0.01/result",
      },
      {
        route: "POST /clado/contacts",
        desc: "Contact Enrichment",
        dynamic: true,
        amountHint: "$0.04-$0.14",
      },
      {
        route: "POST /clado/scrape",
        desc: "Scrape LinkedIn",
        amount: "23000",
        unitType: "request",
      },
      {
        route: "POST /clado/linkedin-profile",
        desc: "LinkedIn Profile",
        amount: "13000",
        unitType: "request",
      },
      {
        route: "POST /clado/post-reactions",
        desc: "Post Reactions",
        amount: "13000",
        unitType: "request",
      },
      {
        route: "POST /clado/bulk-contacts",
        desc: "Bulk Contact Enrichment",
        dynamic: true,
        amountHint: "$0.04+/contact",
      },
      {
        route: "POST /clado/bulk-contacts-status",
        desc: "Bulk Contacts Status",
        amount: "3000",
        unitType: "request",
      },
    ],
  },

  // ── CoinGecko ────────────────────────────────────────────────────────
  {
    id: "coingecko",
    name: "CoinGecko",
    url: "https://www.coingecko.com",
    serviceUrl: "https://coingecko.mpp.paywithlocus.com",
    description:
      "Cryptocurrency market data — prices, charts, market cap, exchanges, trending coins, global stats, NFTs, derivatives, and on-chain data.",

    categories: ["data"],
    integration: "third-party",
    tags: ["crypto", "prices", "market-cap", "exchanges", "trending"],
    docs: {
      homepage: "https://docs.coingecko.com",
      llmsTxt: "https://paywithlocus.com/mpp/coingecko.md",
    },
    provider: { name: "CoinGecko", url: "https://www.coingecko.com" },
    realm: "coingecko.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /coingecko/simple-price",
        desc: "Simple Price",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/simple-token-price",
        desc: "Token Price by Contract",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/coins-markets",
        desc: "Coins Markets",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/coin-data",
        desc: "Coin Data",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/coins-list",
        desc: "Coins List",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/search",
        desc: "Search",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/trending",
        desc: "Trending",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/exchange-rates",
        desc: "Exchange Rates",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/global",
        desc: "Global",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/global-defi",
        desc: "Global DeFi",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/market-chart",
        desc: "Market Chart",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/coin-history",
        desc: "Coin History",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/categories",
        desc: "Categories",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/top-gainers-losers",
        desc: "Top Gainers & Losers",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /coingecko/exchanges",
        desc: "Exchanges",
        amount: "60000",
        unitType: "request",
      },
    ],
  },

  // ── Company Enrichment ───────────────────────────────────────────────
  {
    id: "abstract-company-enrichment",
    name: "Company Enrichment",
    url: "https://www.abstractapi.com/api/company-enrichment",
    serviceUrl: "https://abstract-company-enrichment.mpp.paywithlocus.com",
    description: "Enrich company data from a domain name.",

    categories: ["data"],
    integration: "third-party",
    tags: ["company", "enrichment", "domain-lookup"],
    docs: {
      homepage: "https://docs.abstractapi.com/company-enrichment",
      llmsTxt: "https://paywithlocus.com/mpp/abstract-company-enrichment.md",
    },
    provider: {
      name: "Company Enrichment",
      url: "https://www.abstractapi.com/api/company-enrichment",
    },
    realm: "abstract-company-enrichment.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /abstract-company-enrichment/lookup",
        desc: "Lookup",
        amount: "6000",
        unitType: "request",
      },
    ],
  },

  // ── Deepgram ─────────────────────────────────────────────────────────
  {
    id: "deepgram",
    name: "Deepgram",
    url: "https://deepgram.com",
    serviceUrl: "https://deepgram.mpp.paywithlocus.com",
    description:
      "Industry-leading speech AI — transcribe audio from URLs with Nova-3, generate natural speech with Aura-2 TTS, and analyze text for sentiment, topics, intents, and summaries.",

    categories: ["data"],
    integration: "third-party",
    tags: ["speech-to-text", "transcription", "tts", "audio", "sentiment"],
    docs: {
      homepage:
        "https://developers.deepgram.com/reference/deepgram-api-overview",
      llmsTxt: "https://paywithlocus.com/mpp/deepgram.md",
    },
    provider: { name: "Deepgram", url: "https://deepgram.com" },
    realm: "deepgram.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /deepgram/transcribe",
        desc: "Transcribe Audio",
        amount: "53000",
        unitType: "request",
      },
      {
        route: "POST /deepgram/speak",
        desc: "Text to Speech",
        amount: "23000",
        unitType: "request",
      },
      {
        route: "POST /deepgram/analyze",
        desc: "Analyze Text",
        amount: "13000",
        unitType: "request",
      },
      {
        route: "POST /deepgram/list-models",
        desc: "List Models",
        amount: "4000",
        unitType: "request",
      },
    ],
  },

  // ── DeepL ────────────────────────────────────────────────────────────
  {
    id: "deepl",
    name: "DeepL",
    url: "https://www.deepl.com",
    serviceUrl: "https://deepl.mpp.paywithlocus.com",
    description:
      "Professional translation and text improvement — translate text between 30+ languages with industry-leading quality, or improve and rephrase text with DeepL Write.",

    categories: ["data"],
    integration: "third-party",
    tags: ["translation", "languages", "glossary", "document-translation"],
    docs: {
      homepage: "https://developers.deepl.com",
      llmsTxt: "https://paywithlocus.com/mpp/deepl.md",
    },
    provider: { name: "DeepL", url: "https://www.deepl.com" },
    realm: "deepl.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /deepl/translate",
        desc: "Translate",
        dynamic: true,
        amountHint: "$0.025+ (scales with text length)",
      },
      {
        route: "POST /deepl/rephrase",
        desc: "Rephrase (Write)",
        dynamic: true,
        amountHint: "$0.025+ (scales with text length)",
      },
      {
        route: "POST /deepl/languages",
        desc: "Languages",
        amount: "5000",
        unitType: "request",
      },
    ],
  },

  // ── DeepSeek ─────────────────────────────────────────────────────────
  {
    id: "deepseek",
    name: "DeepSeek",
    url: "https://deepseek.com",
    serviceUrl: "https://deepseek.mpp.paywithlocus.com",
    description:
      "Frontier AI models — DeepSeek-V3 for fast chat and code, DeepSeek-R1 for deep chain-of-thought reasoning. OpenAI-compatible API format. Among the most capable and cost-efficient models available.",

    categories: ["ai"],
    integration: "third-party",
    tags: ["llm", "reasoning", "code", "chat", "chain-of-thought"],
    docs: {
      homepage: "https://api-docs.deepseek.com",
      llmsTxt: "https://paywithlocus.com/mpp/deepseek.md",
    },
    provider: { name: "DeepSeek", url: "https://deepseek.com" },
    realm: "deepseek.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /deepseek/chat",
        desc: "Chat",
        dynamic: true,
        amountHint: "Model + token dependent (~$0.004–$0.025)",
      },
      {
        route: "POST /deepseek/fim",
        desc: "Fill-In-the-Middle (FIM)",
        dynamic: true,
        amountHint: "Token dependent (~$0.003–$0.005)",
      },
      {
        route: "POST /deepseek/list-models",
        desc: "List Models",
        amount: "3000",
        unitType: "request",
      },
    ],
  },

  // ── Diffbot ──────────────────────────────────────────────────────────
  {
    id: "diffbot",
    name: "Diffbot",
    url: "https://www.diffbot.com",
    serviceUrl: "https://diffbot.mpp.paywithlocus.com",
    description:
      "Web data extraction — articles, products, discussions, images, videos, and auto-detect.",

    categories: ["web", "data"],
    integration: "third-party",
    tags: ["web-scraping", "extraction", "articles", "products"],
    docs: {
      homepage: "https://docs.diffbot.com",
      llmsTxt: "https://paywithlocus.com/mpp/diffbot.md",
    },
    provider: { name: "Diffbot", url: "https://www.diffbot.com" },
    realm: "diffbot.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /diffbot/article",
        desc: "Article",
        amount: "4200",
        unitType: "request",
      },
      {
        route: "POST /diffbot/product",
        desc: "Product",
        amount: "4200",
        unitType: "request",
      },
      {
        route: "POST /diffbot/discussion",
        desc: "Discussion",
        amount: "4200",
        unitType: "request",
      },
      {
        route: "POST /diffbot/image",
        desc: "Image",
        amount: "4200",
        unitType: "request",
      },
      {
        route: "POST /diffbot/video",
        desc: "Video",
        amount: "4200",
        unitType: "request",
      },
      {
        route: "POST /diffbot/analyze",
        desc: "Analyze",
        amount: "4200",
        unitType: "request",
      },
      {
        route: "POST /diffbot/event",
        desc: "Event",
        amount: "4200",
        unitType: "request",
      },
      {
        route: "POST /diffbot/list",
        desc: "List",
        amount: "4200",
        unitType: "request",
      },
      {
        route: "POST /diffbot/job",
        desc: "Job Posting",
        amount: "4200",
        unitType: "request",
      },
    ],
  },

  // ── Diffbot KG ───────────────────────────────────────────────────────
  {
    id: "diffbot-kg",
    name: "Diffbot KG",
    url: "https://www.diffbot.com",
    serviceUrl: "https://diffbot-kg.mpp.paywithlocus.com",
    description:
      "Knowledge Graph — search 10B+ entities and enrich company/person records.",

    categories: ["data"],
    integration: "third-party",
    tags: ["knowledge-graph", "entities", "enrichment", "company-data"],
    docs: {
      homepage: "https://docs.diffbot.com/reference/knowledge-graph",
      llmsTxt: "https://paywithlocus.com/mpp/diffbot-kg.md",
    },
    provider: { name: "Diffbot KG", url: "https://www.diffbot.com" },
    realm: "diffbot-kg.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /diffbot-kg/search",
        desc: "Search (DQL)",
        dynamic: true,
        amountHint: "$0.03–$1.50 (25 credits/entity)",
      },
      {
        route: "POST /diffbot-kg/enhance",
        desc: "Enhance",
        dynamic: true,
        amountHint: "$0.03 ($0.12 with refresh)",
      },
    ],
  },

  // ── Diffbot NL ───────────────────────────────────────────────────────
  {
    id: "diffbot-nl",
    name: "Diffbot NL",
    url: "https://www.diffbot.com",
    serviceUrl: "https://diffbot-nl.mpp.paywithlocus.com",
    description:
      "Natural language processing — NER, sentiment, facts, summarization.",

    categories: ["ai"],
    integration: "third-party",
    tags: ["nlp", "ner", "sentiment", "summarization"],
    docs: {
      homepage: "https://docs.diffbot.com/reference/natural-language",
      llmsTxt: "https://paywithlocus.com/mpp/diffbot-nl.md",
    },
    provider: { name: "Diffbot NL", url: "https://www.diffbot.com" },
    realm: "diffbot-nl.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /diffbot-nl/analyze",
        desc: "Analyze Text",
        dynamic: true,
        amountHint: "$0.004+ (per 10k chars)",
      },
    ],
  },

  // ── EDGAR (SEC) ──────────────────────────────────────────────────────
  {
    id: "edgar",
    name: "EDGAR (SEC)",
    url: "https://www.sec.gov/developer",
    serviceUrl: "https://edgar.mpp.paywithlocus.com",
    description:
      "SEC EDGAR public financial data — company filing history, XBRL financial facts (income statements, balance sheets, cash flows), and full-text search across all public filings. No API key required.",

    categories: ["data"],
    integration: "third-party",
    tags: ["sec", "filings", "company-data", "financials"],
    docs: {
      homepage: "https://www.sec.gov/developer",
      llmsTxt: "https://paywithlocus.com/mpp/edgar.md",
    },
    provider: { name: "EDGAR (SEC)", url: "https://www.sec.gov/developer" },
    realm: "edgar.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /edgar/company-submissions",
        desc: "Company Submissions",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /edgar/company-facts",
        desc: "Company Facts",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /edgar/company-concept",
        desc: "Company Concept",
        amount: "8000",
        unitType: "request",
      },
    ],
  },

  // ── EDGAR Full-Text Search ───────────────────────────────────────────
  {
    id: "edgar-search",
    name: "EDGAR Full-Text Search",
    url: "https://efts.sec.gov",
    serviceUrl: "https://edgar-search.mpp.paywithlocus.com",
    description:
      "Full-text search across all SEC filings — 10-Ks, 10-Qs, 8-Ks, proxy statements, and more. Search by keyword, company name, form type, and date range.",

    categories: ["data"],
    integration: "third-party",
    tags: ["sec", "filings", "full-text-search"],
    docs: {
      homepage: "https://efts.sec.gov/LATEST/search-index",
      llmsTxt: "https://paywithlocus.com/mpp/edgar-search.md",
    },
    provider: { name: "EDGAR Full-Text Search", url: "https://efts.sec.gov" },
    realm: "edgar-search.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /edgar-search/search",
        desc: "Search Filings",
        amount: "8000",
        unitType: "request",
      },
    ],
  },

  // ── Email Reputation ─────────────────────────────────────────────────
  {
    id: "abstract-email-reputation",
    name: "Email Reputation",
    url: "https://www.abstractapi.com/api/email-reputation-api",
    serviceUrl: "https://abstract-email-reputation.mpp.paywithlocus.com",
    description: "Check the reputation and risk score of an email address.",

    categories: ["data"],
    integration: "third-party",
    tags: ["email", "reputation", "risk-score"],
    docs: {
      homepage: "https://docs.abstractapi.com/email-reputation",
      llmsTxt: "https://paywithlocus.com/mpp/abstract-email-reputation.md",
    },
    provider: {
      name: "Email Reputation",
      url: "https://www.abstractapi.com/api/email-reputation-api",
    },
    realm: "abstract-email-reputation.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /abstract-email-reputation/check",
        desc: "Check",
        amount: "6000",
        unitType: "request",
      },
    ],
  },

  // ── Exchange Rates ───────────────────────────────────────────────────
  {
    id: "abstract-exchange-rates",
    name: "Exchange Rates",
    url: "https://www.abstractapi.com/api/exchange-rate-api",
    serviceUrl: "https://abstract-exchange-rates.mpp.paywithlocus.com",
    description:
      "Live, historical, and conversion exchange rates for 150+ currencies.",

    categories: ["data"],
    integration: "third-party",
    tags: ["forex", "exchange-rates", "currency-conversion"],
    docs: {
      homepage: "https://docs.abstractapi.com/exchange-rates",
      llmsTxt: "https://paywithlocus.com/mpp/abstract-exchange-rates.md",
    },
    provider: {
      name: "Exchange Rates",
      url: "https://www.abstractapi.com/api/exchange-rate-api",
    },
    realm: "abstract-exchange-rates.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /abstract-exchange-rates/live",
        desc: "Live Rates",
        amount: "6000",
        unitType: "request",
      },
      {
        route: "POST /abstract-exchange-rates/convert",
        desc: "Convert",
        amount: "6000",
        unitType: "request",
      },
      {
        route: "POST /abstract-exchange-rates/historical",
        desc: "Historical Rates",
        amount: "6000",
        unitType: "request",
      },
    ],
  },

  // ── Grok ─────────────────────────────────────────────────────────────
  {
    id: "grok",
    name: "Grok",
    url: "https://x.ai",
    serviceUrl: "https://grok.mpp.paywithlocus.com",
    description:
      "xAI models — chat, web/X search, code execution, image generation/editing, and text-to-speech.",

    categories: ["ai"],
    integration: "third-party",
    tags: ["llm", "chat", "x-search", "web-search", "image-generation", "tts"],
    docs: {
      homepage: "https://docs.x.ai",
      llmsTxt: "https://paywithlocus.com/mpp/grok.md",
    },
    provider: { name: "Grok", url: "https://x.ai" },
    realm: "grok.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /grok/chat",
        desc: "Chat Completions",
        dynamic: true,
        amountHint: "Model-dependent (~$0.001–$0.02)",
      },
      {
        route: "POST /grok/image-generate",
        desc: "Image Generation",
        dynamic: true,
        amountHint: "$0.02–$0.08 per image",
      },
      {
        route: "POST /grok/image-edit",
        desc: "Image Editing",
        dynamic: true,
        amountHint: "$0.02–$0.08 per image",
      },
      {
        route: "POST /grok/web-search",
        desc: "Chat with Web Search",
        dynamic: true,
        amountHint: "Dynamic (~$0.01–$0.50)",
      },
      {
        route: "POST /grok/x-search",
        desc: "Chat with X Search",
        dynamic: true,
        amountHint: "Dynamic (~$0.01–$0.50)",
      },
      {
        route: "POST /grok/code-execution",
        desc: "Chat with Code Execution",
        dynamic: true,
        amountHint: "Dynamic (~$0.01–$0.50)",
      },
      {
        route: "POST /grok/tts",
        desc: "Text-to-Speech",
        dynamic: true,
        amountHint: "~$0.005 per 1,000 characters",
      },
    ],
  },

  // ── Groq ─────────────────────────────────────────────────────────────
  {
    id: "groq",
    name: "Groq",
    url: "https://groq.com",
    serviceUrl: "https://groq.mpp.paywithlocus.com",
    description:
      "Ultra-fast LLM inference — Llama 3.3, DeepSeek R1, Gemma 2, GPT-OSS, Qwen, Whisper, and PlayAI TTS. OpenAI-compatible API with industry-leading speed.",

    categories: ["ai"],
    integration: "third-party",
    tags: ["llm", "fast-inference", "llama", "gemma", "deepseek"],
    docs: {
      homepage: "https://console.groq.com/docs",
      llmsTxt: "https://paywithlocus.com/mpp/groq.md",
    },
    provider: { name: "Groq", url: "https://groq.com" },
    realm: "groq.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /groq/chat",
        desc: "Chat Completion",
        dynamic: true,
        amountHint: "$0.005 – $0.10 (varies by model and tokens)",
      },
      {
        route: "POST /groq/models",
        desc: "List Models",
        amount: "5000",
        unitType: "request",
      },
    ],
  },

  // ── Holidays ─────────────────────────────────────────────────────────
  {
    id: "abstract-holidays",
    name: "Holidays",
    url: "https://www.abstractapi.com/api/holidays-api",
    serviceUrl: "https://abstract-holidays.mpp.paywithlocus.com",
    description: "Public holiday data for 200+ countries.",

    categories: ["data"],
    integration: "third-party",
    tags: ["holidays", "countries", "public-holidays"],
    docs: {
      homepage: "https://docs.abstractapi.com/holidays",
      llmsTxt: "https://paywithlocus.com/mpp/abstract-holidays.md",
    },
    provider: {
      name: "Holidays",
      url: "https://www.abstractapi.com/api/holidays-api",
    },
    realm: "abstract-holidays.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /abstract-holidays/lookup",
        desc: "Lookup",
        amount: "6000",
        unitType: "request",
      },
    ],
  },

  // ── Hunter ───────────────────────────────────────────────────────────
  {
    id: "hunter",
    name: "Hunter",
    url: "https://hunter.io",
    serviceUrl: "https://hunter.mpp.paywithlocus.com",
    description:
      "Email finding, verification, and company enrichment for outreach and lead generation.",

    categories: ["data"],
    integration: "third-party",
    tags: ["email", "verification", "enrichment", "outreach"],
    docs: {
      homepage: "https://hunter.io/api-documentation/v2",
      llmsTxt: "https://paywithlocus.com/mpp/hunter.md",
    },
    provider: { name: "Hunter", url: "https://hunter.io" },
    realm: "hunter.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /hunter/domain-search",
        desc: "Domain Search",
        dynamic: true,
        amountHint: "$0.013-$0.103",
      },
      {
        route: "POST /hunter/discover",
        desc: "Discover Companies",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /hunter/email-finder",
        desc: "Email Finder",
        amount: "13000",
        unitType: "request",
      },
      {
        route: "POST /hunter/email-verifier",
        desc: "Email Verifier",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /hunter/email-enrichment",
        desc: "Email Enrichment",
        amount: "13000",
        unitType: "request",
      },
      {
        route: "POST /hunter/company-enrichment",
        desc: "Company Enrichment",
        amount: "13000",
        unitType: "request",
      },
      {
        route: "POST /hunter/combined-enrichment",
        desc: "Combined Enrichment",
        amount: "23000",
        unitType: "request",
      },
      {
        route: "POST /hunter/email-count",
        desc: "Email Count",
        amount: "3000",
        unitType: "request",
      },
    ],
  },

  // ── IBAN Validation ──────────────────────────────────────────────────
  {
    id: "abstract-iban-validation",
    name: "IBAN Validation",
    url: "https://www.abstractapi.com/api/iban-validation-api",
    serviceUrl: "https://abstract-iban-validation.mpp.paywithlocus.com",
    description: "Validate International Bank Account Numbers (IBANs).",

    categories: ["data"],
    integration: "third-party",
    tags: ["iban", "banking", "validation"],
    docs: {
      homepage: "https://docs.abstractapi.com/iban-validation",
      llmsTxt: "https://paywithlocus.com/mpp/abstract-iban-validation.md",
    },
    provider: {
      name: "IBAN Validation",
      url: "https://www.abstractapi.com/api/iban-validation-api",
    },
    realm: "abstract-iban-validation.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /abstract-iban-validation/validate",
        desc: "Validate",
        amount: "6000",
        unitType: "request",
      },
    ],
  },

  // ── IP Intelligence ──────────────────────────────────────────────────
  {
    id: "abstract-ip-intelligence",
    name: "IP Intelligence",
    url: "https://www.abstractapi.com/api/ip-intelligence-api",
    serviceUrl: "https://abstract-ip-intelligence.mpp.paywithlocus.com",
    description: "Detect VPNs, proxies, bots, and Tor nodes by IP address.",

    categories: ["data"],
    integration: "third-party",
    tags: ["ip", "vpn-detection", "proxy", "bot-detection"],
    docs: {
      homepage: "https://docs.abstractapi.com/ip-intelligence",
      llmsTxt: "https://paywithlocus.com/mpp/abstract-ip-intelligence.md",
    },
    provider: {
      name: "IP Intelligence",
      url: "https://www.abstractapi.com/api/ip-intelligence-api",
    },
    realm: "abstract-ip-intelligence.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /abstract-ip-intelligence/lookup",
        desc: "Lookup",
        amount: "6000",
        unitType: "request",
      },
    ],
  },

  // ── IPinfo ───────────────────────────────────────────────────────────
  {
    id: "ipinfo",
    name: "IPinfo",
    url: "https://ipinfo.io",
    serviceUrl: "https://ipinfo.mpp.paywithlocus.com",
    description:
      "IP intelligence — geolocation, ASN, privacy detection, carrier data, and hosting identification.",

    categories: ["data"],
    integration: "third-party",
    tags: ["ip", "geolocation", "asn", "privacy-detection"],
    docs: {
      homepage: "https://ipinfo.io/developers",
      llmsTxt: "https://paywithlocus.com/mpp/ipinfo.md",
    },
    provider: { name: "IPinfo", url: "https://ipinfo.io" },
    realm: "ipinfo.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /ipinfo/ip-lite",
        desc: "IP Lite",
        amount: "1000",
        unitType: "request",
      },
      {
        route: "POST /ipinfo/ip-lookup",
        desc: "IP Lookup",
        amount: "1000",
        unitType: "request",
      },
    ],
  },

  // ── Judge0 ───────────────────────────────────────────────────────────
  {
    id: "judge0",
    name: "Judge0",
    url: "https://judge0.com",
    serviceUrl: "https://judge0.mpp.paywithlocus.com",
    description:
      "Online code execution — run source code in 60+ programming languages with sandboxed isolation.",

    categories: ["compute"],
    integration: "third-party",
    tags: ["code-execution", "sandbox", "programming-languages"],
    docs: {
      homepage: "https://ce.judge0.com",
      llmsTxt: "https://paywithlocus.com/mpp/judge0.md",
    },
    provider: { name: "Judge0", url: "https://judge0.com" },
    realm: "judge0.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /judge0/execute-code",
        desc: "Execute Code",
        amount: "6000",
        unitType: "request",
      },
      {
        route: "POST /judge0/submit-code",
        desc: "Submit Code (Async)",
        amount: "6000",
        unitType: "request",
      },
      {
        route: "POST /judge0/get-submission",
        desc: "Get Submission",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /judge0/list-languages",
        desc: "List Languages",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /judge0/list-statuses",
        desc: "List Statuses",
        amount: "5000",
        unitType: "request",
      },
    ],
  },

  // ── Mapbox ───────────────────────────────────────────────────────────
  {
    id: "mapbox",
    name: "Mapbox",
    url: "https://www.mapbox.com",
    serviceUrl: "https://mapbox.mpp.paywithlocus.com",
    description:
      "Location and mapping APIs — geocoding, directions, isochrones, matrix routing, map matching, static maps, and spatial queries.",

    categories: ["data"],
    integration: "third-party",
    tags: ["maps", "geocoding", "directions", "routing", "geospatial"],
    docs: {
      homepage: "https://docs.mapbox.com/api/",
      llmsTxt: "https://paywithlocus.com/mpp/mapbox.md",
    },
    provider: { name: "Mapbox", url: "https://www.mapbox.com" },
    realm: "mapbox.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /mapbox/geocode-forward",
        desc: "Forward Geocode",
        amount: "3750",
        unitType: "request",
      },
      {
        route: "POST /mapbox/geocode-reverse",
        desc: "Reverse Geocode",
        amount: "3750",
        unitType: "request",
      },
      {
        route: "POST /mapbox/directions",
        desc: "Directions",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /mapbox/matrix",
        desc: "Matrix",
        dynamic: true,
        amountHint: "$0.002/element",
      },
      {
        route: "POST /mapbox/isochrone",
        desc: "Isochrone",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /mapbox/map-matching",
        desc: "Map Matching",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /mapbox/static-image",
        desc: "Static Image",
        amount: "4000",
        unitType: "request",
      },
      {
        route: "POST /mapbox/tilequery",
        desc: "Tilequery",
        amount: "5000",
        unitType: "request",
      },
    ],
  },

  // ── Mathpix ──────────────────────────────────────────────────────────
  {
    id: "mathpix",
    name: "Mathpix",
    url: "https://mathpix.com",
    serviceUrl: "https://mathpix.mpp.paywithlocus.com",
    description:
      "OCR for math, science, and documents — extract LaTeX, MathML, and Mathpix Markdown from images and handwriting.",

    categories: ["ai"],
    integration: "third-party",
    tags: ["ocr", "math", "latex", "equations", "documents"],
    docs: {
      homepage: "https://docs.mathpix.com",
      llmsTxt: "https://paywithlocus.com/mpp/mathpix.md",
    },
    provider: { name: "Mathpix", url: "https://mathpix.com" },
    realm: "mathpix.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /mathpix/process-image",
        desc: "Process Image",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /mathpix/process-strokes",
        desc: "Process Strokes",
        amount: "13000",
        unitType: "request",
      },
    ],
  },

  // ── Mistral AI ───────────────────────────────────────────────────────
  {
    id: "mistral",
    name: "Mistral AI",
    url: "https://mistral.ai",
    serviceUrl: "https://mistral.mpp.paywithlocus.com",
    description:
      "Premier and open-source LLMs — Mistral Large, Medium, Small, Codestral, Magistral reasoning, Pixtral vision, text embeddings, and content moderation.",

    categories: ["ai"],
    integration: "third-party",
    tags: ["llm", "chat", "embeddings", "code", "reasoning"],
    docs: {
      homepage: "https://docs.mistral.ai",
      llmsTxt: "https://paywithlocus.com/mpp/mistral.md",
    },
    provider: { name: "Mistral AI", url: "https://mistral.ai" },
    realm: "mistral.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /mistral/chat",
        desc: "Chat Completion",
        dynamic: true,
        amountHint: "$0.005 – $0.10 (varies by model and tokens)",
      },
      {
        route: "POST /mistral/embed",
        desc: "Embeddings",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /mistral/moderate",
        desc: "Moderation",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /mistral/models",
        desc: "List Models",
        amount: "5000",
        unitType: "request",
      },
    ],
  },

  // ── OpenWeather ──────────────────────────────────────────────────────
  {
    id: "openweather",
    name: "OpenWeather",
    url: "https://openweathermap.org",
    serviceUrl: "https://openweather.mpp.paywithlocus.com",
    description:
      "Global weather data — current conditions, 5-day forecasts, hourly forecasts, air quality index with pollutants, geocoding, and One Call 3.0 with full weather suite and government alerts.",

    categories: ["data"],
    integration: "third-party",
    tags: ["weather", "forecast", "conditions", "temperature"],
    docs: {
      homepage: "https://openweathermap.org/api",
      llmsTxt: "https://paywithlocus.com/mpp/openweather.md",
    },
    provider: { name: "OpenWeather", url: "https://openweathermap.org" },
    realm: "openweather.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /openweather/current-weather",
        desc: "Current Weather",
        amount: "6000",
        unitType: "request",
      },
      {
        route: "POST /openweather/forecast-5day",
        desc: "5-Day Forecast",
        amount: "8000",
        unitType: "request",
      },
      {
        route: "POST /openweather/air-quality",
        desc: "Air Quality",
        amount: "6000",
        unitType: "request",
      },
      {
        route: "POST /openweather/geocode",
        desc: "Geocode",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /openweather/reverse-geocode",
        desc: "Reverse Geocode",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /openweather/onecall",
        desc: "One Call — Full Forecast",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /openweather/weather-overview",
        desc: "Weather Overview",
        amount: "10000",
        unitType: "request",
      },
    ],
  },

  // ── Perplexity ───────────────────────────────────────────────────────
  {
    id: "perplexity",
    name: "Perplexity",
    url: "https://perplexity.ai",
    serviceUrl: "https://perplexity.mpp.paywithlocus.com",
    description:
      "AI-powered search — Sonar chat with real-time web grounding, web search, and embeddings.",

    categories: ["ai", "search"],
    integration: "third-party",
    tags: ["search", "ai-search", "web-grounding", "sonar"],
    docs: {
      homepage: "https://docs.perplexity.ai",
      llmsTxt: "https://paywithlocus.com/mpp/perplexity.md",
    },
    provider: { name: "Perplexity", url: "https://perplexity.ai" },
    realm: "perplexity.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /perplexity/chat",
        desc: "Sonar Chat",
        dynamic: true,
        amountHint: "Model-dependent (~$0.005–$0.02)",
      },
      {
        route: "POST /perplexity/search",
        desc: "Web Search",
        dynamic: true,
        amountHint: "$0.006",
      },
      {
        route: "POST /perplexity/embed",
        desc: "Embeddings",
        dynamic: true,
        amountHint: "~$0.001",
      },
      {
        route: "POST /perplexity/context-embed",
        desc: "Contextualized Embeddings",
        dynamic: true,
        amountHint: "~$0.001",
      },
    ],
  },

  // ── Phone Intelligence ───────────────────────────────────────────────
  {
    id: "abstract-phone-intelligence",
    name: "Phone Intelligence",
    url: "https://www.abstractapi.com/api/phone-validation-api",
    serviceUrl: "https://abstract-phone-intelligence.mpp.paywithlocus.com",
    description: "Validate and get carrier info for phone numbers worldwide.",

    categories: ["data"],
    integration: "third-party",
    tags: ["phone", "carrier", "validation"],
    docs: {
      homepage: "https://docs.abstractapi.com/phone-intelligence",
      llmsTxt: "https://paywithlocus.com/mpp/abstract-phone-intelligence.md",
    },
    provider: {
      name: "Phone Intelligence",
      url: "https://www.abstractapi.com/api/phone-validation-api",
    },
    realm: "abstract-phone-intelligence.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /abstract-phone-intelligence/lookup",
        desc: "Lookup",
        amount: "6000",
        unitType: "request",
      },
    ],
  },

  // ── RentCast ─────────────────────────────────────────────────────────
  {
    id: "rentcast",
    name: "RentCast",
    url: "https://rentcast.io",
    serviceUrl: "https://rentcast.mpp.paywithlocus.com",
    description:
      "US real estate intelligence — property records, AVM valuations, rent estimates, sale/rental listings, and market statistics.",

    categories: ["data"],
    integration: "third-party",
    tags: ["real-estate", "property", "valuations", "rent-estimates"],
    docs: {
      homepage: "https://developers.rentcast.io/reference/introduction",
      llmsTxt: "https://paywithlocus.com/mpp/rentcast.md",
    },
    provider: { name: "RentCast", url: "https://rentcast.io" },
    realm: "rentcast.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /rentcast/properties",
        desc: "Property Records",
        amount: "33000",
        unitType: "request",
      },
      {
        route: "POST /rentcast/property-by-id",
        desc: "Property by ID",
        amount: "33000",
        unitType: "request",
      },
      {
        route: "POST /rentcast/random-properties",
        desc: "Random Properties",
        amount: "33000",
        unitType: "request",
      },
      {
        route: "POST /rentcast/value-estimate",
        desc: "Value Estimate (AVM)",
        amount: "33000",
        unitType: "request",
      },
      {
        route: "POST /rentcast/rent-estimate",
        desc: "Rent Estimate",
        amount: "33000",
        unitType: "request",
      },
      {
        route: "POST /rentcast/sale-listings",
        desc: "Sale Listings",
        amount: "33000",
        unitType: "request",
      },
      {
        route: "POST /rentcast/sale-listing-by-id",
        desc: "Sale Listing by ID",
        amount: "33000",
        unitType: "request",
      },
      {
        route: "POST /rentcast/rental-listings",
        desc: "Rental Listings",
        amount: "33000",
        unitType: "request",
      },
      {
        route: "POST /rentcast/rental-listing-by-id",
        desc: "Rental Listing by ID",
        amount: "33000",
        unitType: "request",
      },
      {
        route: "POST /rentcast/markets",
        desc: "Market Statistics",
        amount: "33000",
        unitType: "request",
      },
    ],
  },

  // ── Replicate ────────────────────────────────────────────────────────
  {
    id: "replicate",
    name: "Replicate",
    url: "https://replicate.com",
    serviceUrl: "https://replicate.mpp.paywithlocus.com",
    description:
      "Run thousands of open-source AI models via API — image generation, language models, speech recognition, video, and more. Pay only for what you use.",

    categories: ["ai", "media"],
    integration: "third-party",
    tags: ["ai-models", "open-source", "image-generation", "inference"],
    docs: {
      homepage: "https://replicate.com/docs/reference/http",
      llmsTxt: "https://paywithlocus.com/mpp/replicate.md",
    },
    provider: { name: "Replicate", url: "https://replicate.com" },
    realm: "replicate.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /replicate/run",
        desc: "Run Model",
        dynamic: true,
        amountHint: "Model-dependent ($0.005–$0.05)",
      },
      {
        route: "POST /replicate/get-prediction",
        desc: "Get Prediction",
        amount: "3000",
        unitType: "request",
      },
      {
        route: "POST /replicate/get-model",
        desc: "Get Model",
        amount: "4000",
        unitType: "request",
      },
      {
        route: "POST /replicate/list-models",
        desc: "List Models",
        amount: "4000",
        unitType: "request",
      },
    ],
  },

  // ── ScreenshotOne ────────────────────────────────────────────────────
  {
    id: "screenshotone",
    name: "ScreenshotOne",
    url: "https://screenshotone.com",
    serviceUrl: "https://screenshotone.mpp.paywithlocus.com",
    description:
      "Website screenshot API — capture any URL, HTML, or markdown as PNG, JPEG, WebP, or PDF. Full-page, element selection, dark mode, ad blocking, and more.",

    categories: ["compute"],
    integration: "third-party",
    tags: ["screenshots", "webpage-capture", "rendering"],
    docs: {
      homepage: "https://screenshotone.com/docs/getting-started/",
      llmsTxt: "https://paywithlocus.com/mpp/screenshotone.md",
    },
    provider: { name: "ScreenshotOne", url: "https://screenshotone.com" },
    realm: "screenshotone.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /screenshotone/take",
        desc: "Take Screenshot",
        amount: "55000",
        unitType: "request",
      },
    ],
  },

  // ── Stability AI ─────────────────────────────────────────────────────
  {
    id: "stability-ai",
    name: "Stability AI",
    url: "https://stability.ai",
    serviceUrl: "https://stability-ai.mpp.paywithlocus.com",
    description:
      "Generative AI platform for images, 3D models, and audio — text-to-image, editing, upscaling, and more.",

    categories: ["ai", "media"],
    integration: "third-party",
    tags: ["image-generation", "stable-diffusion", "upscaling", "3d"],
    docs: {
      homepage: "https://platform.stability.ai/docs/api-reference",
      llmsTxt: "https://paywithlocus.com/mpp/stability-ai.md",
    },
    provider: { name: "Stability AI", url: "https://stability.ai" },
    realm: "stability-ai.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /stability-ai/generate-ultra",
        desc: "Generate Ultra",
        amount: "92000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/generate-core",
        desc: "Generate Core",
        amount: "34000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/generate-sd3",
        desc: "Generate SD3",
        dynamic: true,
        amountHint: "$0.029–$0.075 (model-dependent)",
      },
      {
        route: "POST /stability-ai/erase",
        desc: "Erase",
        amount: "57000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/inpaint",
        desc: "Inpaint",
        amount: "57000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/outpaint",
        desc: "Outpaint",
        amount: "46000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/search-and-replace",
        desc: "Search and Replace",
        amount: "57000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/search-and-recolor",
        desc: "Search and Recolor",
        amount: "57000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/remove-background",
        desc: "Remove Background",
        amount: "57000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/replace-background-and-relight",
        desc: "Replace Background & Relight",
        amount: "92000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/upscale-fast",
        desc: "Upscale Fast",
        amount: "23000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/upscale-conservative",
        desc: "Upscale Conservative",
        amount: "460000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/upscale-creative",
        desc: "Upscale Creative",
        amount: "690000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/sketch",
        desc: "Sketch",
        amount: "57000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/structure",
        desc: "Structure",
        amount: "57000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/style-guide",
        desc: "Style Guide",
        amount: "57000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/style-transfer",
        desc: "Style Transfer",
        amount: "92000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/stable-fast-3d",
        desc: "Stable Fast 3D",
        amount: "115000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/stable-point-aware-3d",
        desc: "Stable Point Aware 3D",
        amount: "46000",
        unitType: "request",
      },
      {
        route: "POST /stability-ai/text-to-audio",
        desc: "Text to Audio",
        dynamic: true,
        amountHint: "$0.23 (50 steps, stable-audio-2)",
      },
      {
        route: "POST /stability-ai/audio-to-audio",
        desc: "Audio to Audio",
        dynamic: true,
        amountHint: "$0.23 (50 steps, stable-audio-2)",
      },
      {
        route: "POST /stability-ai/audio-inpaint",
        desc: "Audio Inpaint",
        dynamic: true,
        amountHint: "$0.23 (50 steps, stable-audio-2)",
      },
      {
        route: "POST /stability-ai/result",
        desc: "Result",
      },
    ],
  },

  // ── Suno ─────────────────────────────────────────────────────────────
  {
    id: "suno",
    name: "Suno",
    url: "https://sunoapi.org",
    serviceUrl: "https://suno.mpp.paywithlocus.com",
    description:
      "AI music generation — create full songs, generate lyrics, and build custom music tracks with state-of-the-art AI models. Supports custom styles, vocals, and instrumental modes.",

    categories: ["ai", "media"],
    integration: "third-party",
    tags: ["music-generation", "ai-music", "lyrics", "songs"],
    docs: {
      homepage: "https://docs.sunoapi.org",
      llmsTxt: "https://paywithlocus.com/mpp/suno.md",
    },
    provider: { name: "Suno", url: "https://sunoapi.org" },
    realm: "suno.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /suno/generate-music",
        desc: "Generate Music",
        amount: "105000",
        unitType: "request",
      },
      {
        route: "POST /suno/get-music-status",
        desc: "Get Music Status",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /suno/generate-lyrics",
        desc: "Generate Lyrics",
        amount: "25000",
        unitType: "request",
      },
      {
        route: "POST /suno/get-lyrics-status",
        desc: "Get Lyrics Status",
        amount: "5000",
        unitType: "request",
      },
    ],
  },

  // ── Tako ──────────────────────────────────────────────────────────────
  {
    id: "tako",
    name: "Tako",
    url: "https://tako.com",
    serviceUrl: "https://tako.com",
    description:
      "Data visualization and research platform. Search datasets, generate charts, and build research reports with AI.",

    categories: ["data", "search", "ai"],
    integration: "first-party",
    tags: [
      "data",
      "visualization",
      "charts",
      "research",
      "search",
      "reports",
      "datasets",
      "analytics",
    ],
    status: "active",
    docs: {
      homepage: "https://tako.com",
      llmsTxt: "https://tako.com/.well-known/agent.md",
    },
    provider: { name: "Tako", url: "https://tako.com" },
    realm: "tako.com",
    intent: "charge",
    payments: [STRIPE_PAYMENT],
    endpoints: [
      {
        route: "POST /api/mpp/v1/search/fast",
        desc: "Fast data search across datasets",
        amount: "4",
        unitType: "request",
      },
      {
        route: "POST /api/mpp/v1/visualize",
        desc: "Visualize data from a search query",
        amount: "4",
        unitType: "request",
      },
      {
        route: "POST /api/mpp/v1/thinviz/create",
        desc: "Create an embeddable ThinViz card",
        amount: "1",
        unitType: "request",
      },
      {
        route: "POST /api/mpp/v1/search/deep",
        desc: "Deep async data search with AI research agent",
        amount: "55",
        unitType: "request",
      },
      {
        route: "GET /api/mpp/v1/search/deep/status",
        desc: "Poll status for async deep search",
      },
      {
        route: "POST /api/mpp/v1/threads/deep",
        desc: "Deep async knowledge search with full pipeline",
        amount: "55",
        unitType: "request",
      },
      {
        route: "GET /api/mpp/v1/threads/status",
        desc: "Poll status for async knowledge search",
      },
      {
        route: "POST /api/mpp/v1/reports/generate",
        desc: "Generate a research report (async)",
        amount: "550",
        unitType: "request",
      },
      {
        route: "GET /api/mpp/v1/reports/status",
        desc: "Poll status for report generation",
      },
      {
        route: "POST /api/mpp/v1/charts/edit",
        desc: "Edit a chart using a natural language prompt",
        amount: "1",
        unitType: "request",
      },
    ],
  },

  // ── Tavily ───────────────────────────────────────────────────────────
  {
    id: "tavily",
    name: "Tavily",
    url: "https://tavily.com",
    serviceUrl: "https://tavily.mpp.paywithlocus.com",
    description:
      "AI-optimized web search, content extraction, site mapping, and crawling API.",

    categories: ["search", "web"],
    integration: "third-party",
    tags: ["ai-search", "web-search", "extraction", "crawling"],
    docs: {
      homepage: "https://docs.tavily.com",
      llmsTxt: "https://paywithlocus.com/mpp/tavily.md",
    },
    provider: { name: "Tavily", url: "https://tavily.com" },
    realm: "tavily.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /tavily/search",
        desc: "Search",
        dynamic: true,
        amountHint: "$0.09 (basic) / $0.16 (advanced)",
      },
      {
        route: "POST /tavily/extract",
        desc: "Extract",
        dynamic: true,
        amountHint: "$0.11+ (scales with URL count)",
      },
      {
        route: "POST /tavily/map",
        desc: "Map",
        amount: "90000",
        unitType: "request",
      },
      {
        route: "POST /tavily/crawl",
        desc: "Crawl",
        dynamic: true,
        amountHint: "$0.21+ (scales with page limit)",
      },
    ],
  },

  // ── Timezone ─────────────────────────────────────────────────────────
  {
    id: "abstract-timezone",
    name: "Timezone",
    url: "https://www.abstractapi.com/api/time-date-timezone-api",
    serviceUrl: "https://abstract-timezone.mpp.paywithlocus.com",
    description: "Current time and timezone conversion for any location.",

    categories: ["data"],
    integration: "third-party",
    tags: ["timezone", "time-conversion", "location"],
    docs: {
      homepage: "https://docs.abstractapi.com/timezone",
      llmsTxt: "https://paywithlocus.com/mpp/abstract-timezone.md",
    },
    provider: {
      name: "Timezone",
      url: "https://www.abstractapi.com/api/time-date-timezone-api",
    },
    realm: "abstract-timezone.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /abstract-timezone/current-time",
        desc: "Current Time",
        amount: "6000",
        unitType: "request",
      },
      {
        route: "POST /abstract-timezone/convert-time",
        desc: "Convert Time",
        amount: "6000",
        unitType: "request",
      },
    ],
  },

  // ── VAT ──────────────────────────────────────────────────────────────
  {
    id: "abstract-vat",
    name: "VAT",
    url: "https://www.abstractapi.com/api/vat-validation-rates-api",
    serviceUrl: "https://abstract-vat.mpp.paywithlocus.com",
    description:
      "VAT number validation, rate calculation, and category lookup for EU.",

    categories: ["data"],
    integration: "third-party",
    tags: ["vat", "tax", "eu-compliance"],
    docs: {
      homepage: "https://docs.abstractapi.com/vat",
      llmsTxt: "https://paywithlocus.com/mpp/abstract-vat.md",
    },
    provider: {
      name: "VAT",
      url: "https://www.abstractapi.com/api/vat-validation-rates-api",
    },
    realm: "abstract-vat.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /abstract-vat/validate",
        desc: "Validate",
        amount: "6000",
        unitType: "request",
      },
      {
        route: "POST /abstract-vat/calculate",
        desc: "Calculate",
        amount: "6000",
        unitType: "request",
      },
      {
        route: "POST /abstract-vat/categories",
        desc: "Categories",
        amount: "6000",
        unitType: "request",
      },
    ],
  },

  // ── Web Scraping ─────────────────────────────────────────────────────
  {
    id: "abstract-web-scraping",
    name: "Web Scraping",
    url: "https://www.abstractapi.com/api/web-scraping-api",
    serviceUrl: "https://abstract-web-scraping.mpp.paywithlocus.com",
    description: "Scrape web pages with optional JavaScript rendering.",

    categories: ["web", "data"],
    integration: "third-party",
    tags: ["scraping", "web-pages", "javascript-rendering"],
    docs: {
      homepage: "https://docs.abstractapi.com/web-scraping",
      llmsTxt: "https://paywithlocus.com/mpp/abstract-web-scraping.md",
    },
    provider: {
      name: "Web Scraping",
      url: "https://www.abstractapi.com/api/web-scraping-api",
    },
    realm: "abstract-web-scraping.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /abstract-web-scraping/scrape",
        desc: "Scrape",
        amount: "6000",
        unitType: "request",
      },
    ],
  },

  // ── Wolfram|Alpha ────────────────────────────────────────────────────
  {
    id: "wolframalpha",
    name: "Wolfram|Alpha",
    url: "https://www.wolframalpha.com",
    serviceUrl: "https://wolframalpha.mpp.paywithlocus.com",
    description:
      "Computational knowledge engine — math, science, geography, history, nutrition, finance, and more. Get answers as text, spoken audio, LLM-optimized data, or full structured results.",

    categories: ["data"],
    integration: "third-party",
    tags: ["computation", "math", "science", "knowledge-engine"],
    docs: {
      homepage: "https://products.wolframalpha.com/api",
      llmsTxt: "https://paywithlocus.com/mpp/wolframalpha.md",
    },
    provider: { name: "Wolfram|Alpha", url: "https://www.wolframalpha.com" },
    realm: "wolframalpha.mpp.paywithlocus.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /wolframalpha/short-answer",
        desc: "Short Answer",
        amount: "55000",
        unitType: "request",
      },
      {
        route: "POST /wolframalpha/spoken",
        desc: "Spoken Result",
        amount: "55000",
        unitType: "request",
      },
      {
        route: "POST /wolframalpha/full-results",
        desc: "Full Results",
        amount: "55000",
        unitType: "request",
      },
      {
        route: "POST /wolframalpha/simple",
        desc: "Simple (Image)",
        amount: "55000",
        unitType: "request",
      },
    ],
  },

  // ── Stripe Climate ──────────────────────────────────────────────────────
  {
    id: "stripe-climate",
    name: "Stripe Climate",
    url: "https://climate.stripe.dev",
    serviceUrl: "https://climate.stripe.dev",
    description: "Fund permanent carbon removal projects via Stripe Climate.",

    categories: ["web"],
    integration: "first-party",
    tags: ["climate", "carbon", "sustainability", "stripe"],
    docs: {
      homepage: "https://climate.stripe.dev",
    },
    provider: { name: "Stripe", url: "https://stripe.com/climate" },
    realm: "climate.stripe.dev",
    intent: "charge",
    payments: [STRIPE_PAYMENT, TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /api/contribute",
        desc: "Create a climate contribution",
        dynamic: true,
        amountHint: "$0.01+",
      },
    ],
  },

  // ── Papercut ───────────────────────────────────────────────────────────
  {
    id: "papercut",
    name: "Papercut",
    url: "https://papercut.lol",
    serviceUrl: "https://papercut.lol",
    description:
      "Postcards penned by your agent. Let your agent roast and send you a digital or physical postcard.",

    categories: ["ai", "social"],
    integration: "first-party",
    tags: ["postcards", "roast", "github", "ai-art"],
    docs: {
      homepage: "https://papercut.lol",
      llmsTxt: "https://papercut.lol/llms.txt",
    },
    provider: { name: "Papercut", url: "https://papercut.lol" },
    realm: "papercut.lol",
    intent: "charge",
    payments: [TEMPO_PAYMENT, STRIPE_PAYMENT],
    endpoints: [
      {
        route: "POST /api/send",
        desc: "Write and send an agent-penned postcard",
        dynamic: true,
        amountHint: "$1 digital, $3 physical",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // Orthogonal (mpp.orthogonal.com) — third-party MPP gateway: 42 verified APIs
  // ════════════════════════════════════════════════════════════════════
  // ── Fantastic Jobs (Orthogonal) ──
  {
    id: "orth-fantastic-jobs",
    name: "Fantastic Jobs",
    url: "https://data.fantastic.jobs",
    serviceUrl: "https://mpp.orthogonal.com/fantastic-jobs",
    description:
      "High-volume job postings feed. Indexes new ATS jobs hourly from 54 ATS platforms across 200k+ companies, plus job board listings from LinkedIn, Wellfound, and Y Combinator. Includes 20+ AI enrichments per job and deep",
    categories: ["data"],
    integration: "third-party",
    tags: ["jobs", "ats", "hiring", "feed"],
    docs: { homepage: "https://data.fantastic.jobs" },
    provider: { name: "Fantastic Jobs", url: "https://data.fantastic.jobs" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v1/ats-organizations",
        desc: "Catalog of every organization tracked across ATS sources. ~50MB payload, refreshed daily at 02:00 UTC.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/modified-ats",
        desc: "ATS jobs whose fields changed in the last 24 hours. Returns full job data plus date_modified and modified_fields",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/active-jb",
        desc: "Returns new jobs from LinkedIn, Wellfound, and Y Combinator. LinkedIn hourly for English-speaking countries; others",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/active-ats",
        desc: "Returns new jobs from 54 ATS platforms (company career pages). Refreshed hourly. Supports 30+ filters including title",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/ats-organizations-advanced",
        desc: "Deep company profiles: LinkedIn, Crunchbase funding, Glassdoor ratings, headcount/revenue timeseries, news. Refreshed",
        amount: "10000",
        unitType: "request",
      },
    ],
  },

  // ── Sixtyfour API (Orthogonal) ──
  {
    id: "orth-sixtyfour",
    name: "Sixtyfour API",
    url: "https://api.sixtyfour.ai",
    serviceUrl: "https://mpp.orthogonal.com/sixtyfour",
    description:
      "Build custom research agents to enrich people and company data, and surface real-time signals all with a simple API call.",
    categories: ["data"],
    integration: "third-party",
    tags: ["enrichment", "people", "company", "research"],
    docs: { homepage: "https://api.sixtyfour.ai" },
    provider: { name: "Sixtyfour API", url: "https://api.sixtyfour.ai" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /find-email",
        desc: "Find email address for a lead.",
        dynamic: true,
      },
      {
        route: "POST /enrich-lead",
        desc: "Enrich lead information with additional details such as contact information, social profiles, and company details.",
        amount: "100000",
        unitType: "request",
      },
      {
        route: "POST /find-phone",
        desc: "The Find Phone API uses Sixtyfour AI to discover phone numbers for leads. It extracts contact information from lead",
        amount: "300000",
        unitType: "request",
      },
      {
        route: "POST /enrich-company",
        desc: "Enrich company data with additional information and find associated people.",
        amount: "100000",
        unitType: "request",
      },
    ],
  },

  // ── Fiber AI API (Orthogonal) ──
  {
    id: "orth-fiber",
    name: "Fiber AI API",
    url: "https://api.fiber.ai",
    serviceUrl: "https://mpp.orthogonal.com/fiber",
    description:
      "Reach anyone on the planet with verified contacts. Fiber AI delivers the most accurate contact data, period.",
    categories: ["data"],
    integration: "third-party",
    tags: ["contacts", "email", "phone", "enrichment"],
    docs: { homepage: "https://api.fiber.ai" },
    provider: { name: "Fiber AI API", url: "https://api.fiber.ai" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v1/linkedin-live-fetch/company/single",
        desc: "Returns an enriched company with details for a given LinkedIn company identifier",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/linkedin-live-fetch/post-comments",
        desc: "Fetches paginated comments for a LinkedIn post. Each page contains up to 10 comments.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/investor-search",
        desc: "Search for investors with flexible filtering capabilities",
        dynamic: true,
      },
      {
        route: "POST /v1/email-to-person/single",
        desc: "Do a reverse lookup: given an email address, find someone's LinkedIn profile and personal details. Note: if you also",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/natural-language-search/companies",
        desc: "Takes free-form text (e.g., 'Series A startups in USA with 50–200 employees') and returns a list of matching companies",
        dynamic: true,
      },
      {
        route: "POST /v1/validate-email/single",
        desc: "Checks if a given email is likely to bounce using a waterfall of strategies. Works for catch-all email addresses, which",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "POST /v1/company-search",
        desc: "Search for companies using filters",
        dynamic: true,
      },
      {
        route: "POST /v1/kitchen-sink/person",
        desc: "Search for a person using a variety of parameters such as LinkedIn slug, LinkedIn URL, or their current company",
        dynamic: true,
      },
      {
        route: "POST /v1/linkedin-live-fetch/profile-posts",
        desc: "Fetches recent posts from a LinkedIn profile. Returns a paginated feed of posts with optional cursor for pagination",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/text-to-search-params/companies",
        desc: "Takes free-form text (e.g., 'Series A startups in USA with 50–200 employees') and converts it into a structured set of",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/natural-language-search/profiles",
        desc: "Takes free-form text (e.g., 'Software engineers in US with 5+ years of experience') and returns a list of matching",
        dynamic: true,
      },
      {
        route: "POST /v1/text-to-search-params/profiles",
        desc: "Takes free-form text (e.g., 'Software engineers in US with 5+ years of experience') and converts it into a structured",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/people-search",
        desc: "Search for people using filters",
        dynamic: true,
      },
      {
        route: "POST /v1/linkedin-live-fetch/profile/single",
        desc: "Returns an enriched profile with details for a given LinkedIn profile identifier",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/job-search",
        desc: "Search for job postings with flexible filtering capabilities",
        dynamic: true,
      },
      {
        route: "POST /v1/linkedin-live-fetch/post-reactions",
        desc: "Fetches paginated reactions of a specific type for a LinkedIn post. Each page contains up to 10 reactions.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/kitchen-sink/company",
        desc: "Search for a company using a variety of parameters such as LinkedIn slug, LinkedIn URL, name, etc. Returns complete",
        dynamic: true,
      },
      {
        route: "POST /v1/company-revenue",
        desc: "Fetches the most recent annual revenue estimate for a company. Pass a LinkedIn company URL, domain, and/or company name.",
        amount: "80000",
        unitType: "request",
      },
      {
        route: "POST /v1/depth-chart/start",
        desc: "Generates an organizational depth chart for a company. Classifies employees by function. Async. Poll with",
        amount: "180000",
        unitType: "request",
      },
      {
        route: "POST /v1/validate-phone/single",
        desc: "Validates a phone number and returns whether it's valid, reachable, carrier info, and caller name.",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /v1/combined-search/count",
        desc: "Get total count of companies and people matching search filters in one call.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/people-search/count",
        desc: "Get count of profiles matching search filters. Use to estimate result sizes before running a full search.",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "POST /v1/contact-details/turbo/sync",
        desc: "Fastest synchronous contact reveal using premium enrichment stack. Higher cost, lowest latency.",
        dynamic: true,
      },
      {
        route: "POST /v1/scouting-report",
        desc: "Generates a comprehensive scouting report for a company including news, founders, funding, media links, and historical",
        amount: "120000",
        unitType: "request",
      },
      {
        route: "POST /v1/company-count",
        desc: "Get count of companies matching search filters. Use to estimate result sizes before running a full search.",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "POST /v1/contact-details/batch/start",
        desc: "Batch contact reveal for up to 2000 people. Async. Poll with /contact-details/batch/poll.",
        dynamic: true,
      },
      {
        route: "POST /v1/contact-details/single",
        desc: "Standard synchronous contact reveal. Returns emails and/or phone numbers for a person given their LinkedIn URL. Best",
        dynamic: true,
      },
      {
        route: "POST /v1/contact-details/exhaustive/start",
        desc: "Maximum-coverage async contact reveal. Runs all waterfall steps in parallel. Poll with /contact-details/exhaustive/poll.",
        dynamic: true,
      },
      {
        route: "POST /v1/twitter/profile",
        desc: "Fetches a Twitter/X user profile by handle.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/twitter/search",
        desc: "Search tweets by query string. Supports Twitter search operators.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/twitter/tweet-quotes",
        desc: "Fetches paginated quote tweets for a given tweet.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/twitter/tweet-replies",
        desc: "Fetches paginated replies to a given tweet.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/twitter/user-tweets",
        desc: "Fetches paginated tweets from a Twitter/X user.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/twitter-handle-to-linkedin/single",
        desc: "Resolves a Twitter/X handle to a LinkedIn profile URL.",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /v1/instagram/profile",
        desc: "Fetches an Instagram user profile by handle.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/instagram/post-details",
        desc: "Fetches details for a specific Instagram post.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/instagram/user-posts",
        desc: "Fetches paginated posts from an Instagram user.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/instagram/user-reels",
        desc: "Fetches paginated reels from an Instagram user.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/github-lookup/trigger",
        desc: "Looks up GitHub profiles for a list of people. Async. Poll with /github-lookup/poll.",
        dynamic: true,
      },
      {
        route: "POST /v1/github-to-linkedin/trigger",
        desc: "Batch GitHub to LinkedIn lookup. Async. Poll with /github-to-linkedin/polling.",
        dynamic: true,
      },
      {
        route: "POST /v1/twitter/tweet-details",
        desc: "Fetches full details for a specific tweet by ID.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/twitter/tweet-retweeters",
        desc: "Fetches paginated list of users who retweeted a tweet.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/instagram/post-comments",
        desc: "Fetches paginated comments on an Instagram post.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/twitter/user-followers",
        desc: "Fetches paginated followers of a Twitter/X user.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/twitter/user-following",
        desc: "Fetches paginated list of accounts a Twitter/X user follows.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/twitter/user-mentions",
        desc: "Fetches paginated mentions of a Twitter/X user.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/github-to-linkedin/single",
        desc: "Finds LinkedIn profile and/or email from a GitHub username. Synchronous.",
        dynamic: true,
      },
      {
        route: "POST /v1/tiktok/popular-songs",
        desc: "Fetches popular TikTok songs.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/search-keyword",
        desc: "Searches TikTok videos by keyword or phrase.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/search-users",
        desc: "Searches TikTok users by query.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/song-details",
        desc: "Fetches details for a TikTok song.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/song-videos",
        desc: "Fetches TikTok videos that use a specific song.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/trending-feed",
        desc: "Fetches the TikTok trending feed.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/unified-search",
        desc: "Unified search returning both videos and users.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/user-videos",
        desc: "Fetches paginated videos from a TikTok user.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/video-comments",
        desc: "Fetches paginated comments on a TikTok video.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/video-details",
        desc: "Fetches details for a specific TikTok video.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/video-transcript",
        desc: "Fetches the transcript of a TikTok video.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/youtube/channel",
        desc: "Fetches YouTube channel info and paginated videos.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/youtube/search",
        desc: "Searches YouTube videos by query.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/youtube/transcript",
        desc: "Fetches the transcript of a YouTube video.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/youtube/video-details",
        desc: "Fetches details for a specific YouTube video.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/youtube/video-comments",
        desc: "Fetches paginated comments on a YouTube video.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/profile",
        desc: "Fetches a TikTok user profile by handle.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/popular-creators",
        desc: "Fetches popular TikTok creators, optionally filtered by country.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/popular-hashtags",
        desc: "Fetches trending TikTok hashtags.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/user-followers",
        desc: "Fetches paginated followers of a TikTok user.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/search-hashtag",
        desc: "Searches TikTok videos by hashtag.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/user-following",
        desc: "Fetches paginated list of accounts a TikTok user follows.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/tiktok/comment-replies",
        desc: "Fetches paginated replies to a TikTok comment.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v1/stealth-founders/search",
        desc: "Search for stealth or ex-stealth startup founders. Returns profiles of founders currently in or who have left stealth",
        dynamic: true,
      },
      {
        route: "POST /v1/natural-language-search/combined/sync",
        desc: "Natural language search for both companies and profiles. Converts text query to search params and returns results",
        dynamic: true,
      },
      {
        route: "POST /v1/natural-language-search/job-description-search",
        desc: "Search for profiles matching a job description using natural language. Converts JD text to search params and returns",
        dynamic: true,
      },
      {
        route: "POST /v1/local-business-search/start",
        desc: "Start an AI-powered local business search. Finds company details, decision makers, and contact info. Async: poll with",
        dynamic: true,
      },
      {
        route: "POST /v1/social-media-lookup/trigger",
        desc: "Find social media profiles (Twitter, Instagram) for a person. Async: poll with /social-media-lookup/polling.",
        dynamic: true,
      },
      {
        route: "POST /v1/domain-lookup/trigger",
        desc: "Find domains and websites for a list of companies. Async: poll with /domain-lookup/polling. Max 400 companies per",
        dynamic: true,
      },
      {
        route: "POST /v1/multi-source/search",
        desc: "Multi-source AI search. Searches across multiple data sources using natural language. Pricing coming soon from Fiber.",
        dynamic: true,
      },
      {
        route: "POST /v1/google-maps-search/start",
        desc: "Start a search on Google Maps. Searches businesses by query across specified areas. Charges 3 credits ($0.06) per",
        dynamic: true,
      },
      {
        route: "POST /v1/stealth-founders/count",
        desc: "Count stealth or ex-stealth startup founders matching search criteria.",
        dynamic: true,
      },
      {
        route: "POST /v1/real-estate/listings",
        desc: "Search real estate listings by location. Supports filtering by price, bedrooms, property type, and more. Charged per",
        dynamic: true,
      },
      {
        route: "POST /v1/combined-search/paginated",
        desc: "Combined people and company search with pagination. Returns both companies and profiles matching filters. Charged per",
        dynamic: true,
      },
      {
        route: "POST /v1/natural-language-search/combined-search-param",
        desc: "Converts natural language text into structured company and profile search parameters. Does not return results, only the",
        dynamic: true,
      },
    ],
  },

  // ── Openmart (Orthogonal) ──
  {
    id: "orth-openmart",
    name: "Openmart",
    url: "https://api.openmart.ai",
    serviceUrl: "https://mpp.orthogonal.com/openmart",
    description:
      "Local business search, enrichment, and lead intelligence. Search 30M+ US/CA/AU businesses by query, tags, location, reviews, ownership type, price tier, revenue. Enrich companies, find decision makers with verified",
    categories: ["data"],
    integration: "third-party",
    tags: ["local-business", "leads", "enrichment"],
    docs: { homepage: "https://api.openmart.ai" },
    provider: { name: "Openmart", url: "https://api.openmart.ai" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /api/v1/business_records/list/:id_type",
        desc: "Fetch full business records by openmart_id or google_place_id. Up to 100 IDs.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/search",
        desc: "Search local businesses by natural language query with 22+ filter categories.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/enrich_company",
        desc: "Enrich a company by website URL or social media link.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/search/only_ids",
        desc: "Lightweight search returning only business IDs.",
        amount: "10000",
        unitType: "request",
      },
    ],
  },

  // ── Edges (Orthogonal) ──
  {
    id: "orth-edges",
    name: "Edges",
    url: "https://api.edges.run/v1",
    serviceUrl: "https://mpp.orthogonal.com/edges",
    description:
      "Edges provides LinkedIn automation actions for data extraction, search, and discovery. Extract profiles, companies, posts, jobs, events, and more. Search across LinkedIn and Sales Navigator.",
    categories: ["data", "social"],
    integration: "third-party",
    tags: ["linkedin", "automation", "scraping"],
    docs: { homepage: "https://api.edges.run" },
    provider: { name: "Edges", url: "https://api.edges.run" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /actions/salesnavigator-search-company-employees/run/live",
        desc: "Search for leads within a specific company using Sales Navigator filters.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/salesnavigator-extract-accounts-list/run/live",
        desc: "Extract accounts (companies) from a saved accounts list in Sales Navigator.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-find-company-url/run/live",
        desc: "Use AI to find a LinkedIn company page URL from a company name or domain.",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-search-content/run/live",
        desc: "Search for posts and articles on LinkedIn using keywords and filters.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-search-schools/run/live",
        desc: "Search for schools and universities on LinkedIn using keywords and filters.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/salesnavigator-extract-employees-count/run/live",
        desc: "Extract employee count statistics from a company's Sales Navigator account page.",
        amount: "180000",
        unitType: "request",
      },
      {
        route: "POST /actions/salesnavigator-search-company-metrics/run/live",
        desc: "Get total result count metrics for a Sales Navigator company search URL.",
        amount: "180000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-similar-companies/run/live",
        desc: "Extract a list of companies similar to a given LinkedIn company page, based on LinkedIn's recommendations.",
        amount: "180000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-people-educations/run/live",
        desc: "Extract education history from LinkedIn profiles including schools, degrees, fields of study, and dates.",
        amount: "350000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-find-profile-url/run/live",
        desc: "Use AI to find a LinkedIn profile URL from a person's name and optional contextual information.",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /actions/salesnavigator-extract-leads-list/run/live",
        desc: "Extract leads from a saved leads list in Sales Navigator.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-post-likers/run/live",
        desc: "Extract users who liked a specific LinkedIn post. Returns profile information of people who have reacted to the post.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-post-commenters/run/live",
        desc: "Extract users who commented on a specific LinkedIn post with their profile information and comments.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-search-events/run/live",
        desc: "Search for events on LinkedIn using keywords, date, and location filters.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-peopleid-from-salesnavigatorid/run/live",
        desc: "Convert a Sales Navigator lead ID to a LinkedIn people ID for profile enrichment.",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-people-post-activity/run/live",
        desc: "Extract the post activity history of a LinkedIn profile, showing content they have published.",
        amount: "90000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-search-companies/run/live",
        desc: "Search for companies on LinkedIn using filters like industry, size, location, and keywords.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-search-groups/run/live",
        desc: "Search for groups on LinkedIn using keywords and filters.",
        amount: "880000",
        unitType: "request",
      },
      {
        route:
          "POST /actions/linkedin-extract-people-reaction-activity/run/live",
        desc: "Extract the reaction activity history of a LinkedIn profile, showing posts they have liked or reacted to.",
        amount: "90000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-company-affiliates/run/live",
        desc: "Extract the list of affiliated companies (subsidiaries, parent companies) linked to a LinkedIn company page.",
        amount: "180000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-event/run/live",
        desc: "Extract detailed information from a LinkedIn event including title, description, date, location, and organizer.",
        amount: "90000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-job/run/live",
        desc: "Extract detailed information from a LinkedIn job posting including title, company, description, requirements, and",
        amount: "90000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-search-jobs/run/live",
        desc: "Search for job postings on LinkedIn using keywords, location, company, and other filters.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/salesnavigator-extract-company/run/live",
        desc: "Extract full company data from a Sales Navigator company page, including revenue, description, employee counts, and",
        amount: "180000",
        unitType: "request",
      },
      {
        route:
          "POST /actions/salesnavigator-extract-employees-distribution/run/live",
        desc: "Extract employee distribution data (by department, seniority, location) from a Sales Navigator company page.",
        amount: "180000",
        unitType: "request",
      },
      {
        route: "POST /actions/salesnavigator-search-companies/run/live",
        desc: "Search for accounts (companies) on Sales Navigator using advanced filters.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-people/run/live",
        desc: "Extract detailed profile information from LinkedIn people including name, headline, experience, education, and skills.",
        amount: "90000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-people-skills/run/live",
        desc: "Extract the skills listed on a LinkedIn profile including skill names and endorsement counts.",
        amount: "350000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-post-reposters/run/live",
        desc: "Extract users who reposted a specific LinkedIn post with their profile information.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-event-attendees/run/live",
        desc: "Extract the list of attendees registered for a LinkedIn event.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-group-members/run/live",
        desc: "Extract the list of members from a LinkedIn group you belong to.",
        amount: "880000",
        unitType: "request",
      },
      {
        route:
          "POST /actions/linkedin-extract-licenses-certifications/run/live",
        desc: "Extract licenses and certifications from a LinkedIn profile including credential name, issuing organization, and dates.",
        amount: "350000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-people-experiences/run/live",
        desc: "Extract detailed work experience history from LinkedIn profiles including job titles, companies, dates, and",
        amount: "350000",
        unitType: "request",
      },
      {
        route:
          "POST /actions/linkedin-extract-company-employees-insights/run/live",
        desc: "Extract employee insights and analytics from a LinkedIn company page, including headcount by function, location, and",
        amount: "180000",
        unitType: "request",
      },
      {
        route:
          "POST /actions/linkedin-extract-people-comment-activity/run/live",
        desc: "Extract the comment activity history of a LinkedIn profile, showing posts they have commented on.",
        amount: "90000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-search-company-employees/run/live",
        desc: "Search for employees of a specific company on LinkedIn with optional filters.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-search-people/run/live",
        desc: "Search for people on LinkedIn using filters like title, company, location, and keywords.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-company/run/live",
        desc: "Extract detailed information from a LinkedIn company page including name, description, industry, employee count, and",
        amount: "180000",
        unitType: "request",
      },
      {
        route: "POST /actions/salesnavigator-search-metrics/run/live",
        desc: "Get metrics and statistics for a Sales Navigator search query, including total results count.",
        amount: "180000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-post/run/live",
        desc: "Extract detailed information from a LinkedIn post including content, author, engagement metrics, and media.",
        amount: "90000",
        unitType: "request",
      },
      {
        route: "POST /actions/linkedin-extract-school-alumnis/run/live",
        desc: "Extract the list of alumni from a LinkedIn school page with their profile information.",
        amount: "880000",
        unitType: "request",
      },
      {
        route: "POST /actions/salesnavigator-search-people/run/live",
        desc: "Search for leads on Sales Navigator using advanced filters like title, company, geography, and more.",
        amount: "880000",
        unitType: "request",
      },
    ],
  },

  // ── CaptainData (Orthogonal) ──
  {
    id: "orth-captaindata",
    name: "CaptainData",
    url: "https://api.captaindata.com/v1",
    serviceUrl: "https://mpp.orthogonal.com/captaindata",
    description:
      "CaptainData API provides people and company enrichment, search, and discovery powered by LinkedIn Sales Navigator data. Find and enrich profiles, search for people and companies, and discover employees.",
    categories: ["data"],
    integration: "third-party",
    tags: ["enrichment", "people", "company", "search"],
    docs: { homepage: "https://api.captaindata.com" },
    provider: { name: "CaptainData", url: "https://api.captaindata.com" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /people/enrich",
        desc: "Get comprehensive profile information from a LinkedIn URL with additional enrichment data. Returns full name, headline",
        amount: "180000",
        unitType: "request",
      },
      {
        route: "GET /people/find",
        desc: "Find people by name and optionally company name. Returns matching profiles.",
        amount: "180000",
        unitType: "request",
      },
      {
        route: "GET /companies/enrich",
        desc: "Get comprehensive company information from a LinkedIn Company URL. Returns company details, industry, size, and more.",
        amount: "90000",
        unitType: "request",
      },
      {
        route: "GET /companies/find",
        desc: "Find a company by name. Returns matching company profiles.",
        amount: "180000",
        unitType: "request",
      },
      {
        route: "GET /people/search",
        desc: "Search and discover people using a LinkedIn Sales Navigator search query. Returns paginated results with profile",
        amount: "2290000",
        unitType: "request",
      },
      {
        route: "GET /companies/search",
        desc: "Search and discover companies using a LinkedIn Sales Navigator search query. Returns paginated results.",
        amount: "2290000",
        unitType: "request",
      },
      {
        route: "GET /companies/:company_uid/employees",
        desc: "List employees of a given company. Returns paginated results. The company_uid path parameter is the LinkedIn company ID",
        amount: "2290000",
        unitType: "request",
      },
    ],
  },

  // ── Baseten Model APIs (Orthogonal) ──
  {
    id: "orth-baseten",
    name: "Baseten Model APIs",
    url: "https://inference.baseten.co",
    serviceUrl: "https://mpp.orthogonal.com/baseten",
    description:
      "Baseten is a high-performance inference platform for running open source LLMs. This API provides an OpenAI-compatible chat completions endpoint, so it works as a drop-in replacement with any OpenAI SDK or client. Just",
    categories: ["ai", "compute"],
    integration: "third-party",
    tags: ["inference", "llm", "models", "gpu"],
    docs: { homepage: "https://inference.baseten.co" },
    provider: {
      name: "Baseten Model APIs",
      url: "https://inference.baseten.co",
    },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v1/chat/completions",
        desc: "Send a conversation to a model and get a completion back. Works exactly like the OpenAI chat completions endpoint. Pass",
        dynamic: true,
      },
    ],
  },

  // ── Seltz (Orthogonal) ──
  {
    id: "orth-seltz",
    name: "Seltz",
    url: "https://api.seltz.ai",
    serviceUrl: "https://mpp.orthogonal.com/seltz",
    description:
      "Context-engineered web search API. Search the web and return matching documents with full content.",
    categories: ["search", "web"],
    integration: "third-party",
    tags: ["web-search", "context", "scraping"],
    docs: { homepage: "https://api.seltz.ai" },
    provider: { name: "Seltz", url: "https://api.seltz.ai" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v1/search",
        desc: "Search the web and return matching documents with URLs and content.",
        amount: "6250",
        unitType: "request",
      },
    ],
  },

  // ── ScrapeGraphAI (Orthogonal) ──
  {
    id: "orth-scrapegraphai",
    name: "ScrapeGraphAI",
    url: "https://v2-api.scrapegraphai.com",
    serviceUrl: "https://mpp.orthogonal.com/scrapegraphai",
    description:
      "Scrape URLs, extract structured data with LLMs, search and scrape top results, crawl websites, and monitor pages for changes.",
    categories: ["web", "data"],
    integration: "third-party",
    tags: ["scraping", "extraction", "llm", "crawl"],
    docs: { homepage: "https://v2-api.scrapegraphai.com" },
    provider: {
      name: "ScrapeGraphAI",
      url: "https://v2-api.scrapegraphai.com",
    },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /api/scrape",
        desc: "Fetches a URL and returns the requested format(s): markdown, html, links, images, summary, json, branding, screenshot.",
        dynamic: true,
      },
      {
        route: "POST /api/crawl",
        desc: "Start a website crawl from a seed URL with configurable depth and page limits.",
        dynamic: true,
      },
      {
        route: "POST /api/monitor",
        desc: "Create a monitor to track changes on a URL at a given interval.",
        dynamic: true,
      },
      {
        route: "POST /api/extract",
        desc: "LLM-driven extraction from a URL, HTML, or markdown input with a prompt and optional JSON schema.",
        dynamic: true,
      },
      {
        route: "POST /api/search",
        desc: "Runs a search, scrapes the top N result URLs, optionally runs LLM extraction with prompt and schema.",
        dynamic: true,
      },
    ],
  },

  // ── OpenFunnel (Orthogonal) ──
  {
    id: "orth-openfunnel",
    name: "OpenFunnel",
    url: "https://api.openfunnel.dev",
    serviceUrl: "https://mpp.orthogonal.com/openfunnel",
    description:
      "GTM intelligence platform. Search companies by traits/signals, enrich accounts with firmographic data, find and enrich people, get account timelines and insights, and deploy signal-monitoring agents.",
    categories: ["data"],
    integration: "third-party",
    tags: ["gtm", "signals", "enrichment", "intent"],
    docs: { homepage: "https://api.openfunnel.dev" },
    provider: { name: "OpenFunnel", url: "https://api.openfunnel.dev" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /api/v1/audience/create-account-audience",
        desc: "Create Account Audience Endpoint",
        dynamic: true,
      },
      {
        route: "POST /api/v1/signal/deploy/deep-hiring-agent",
        desc: "Deploy a Deep Hiring signal. OpenFunnel Deep Hiring Agent find deep company activities that are buried inside job",
        dynamic: true,
      },
      {
        route: "POST /api/v1/enrich/deep-enrich",
        desc: "End-to-end company qualification and people enrichment. 1. Creates or finds the account for the given domain. 2. Finds",
        amount: "132000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/signal/deploy/deep-company-search-agent",
        desc: "Deploy a Deep Company Search signal using the TAQ framework (Trait, Activity, Qualifier). Discover companies by",
        dynamic: true,
      },
      {
        route: "POST /api/v1/signal/deploy/social-listening-agent",
        desc: "Deploy a Social Listening signal. OpenFunnel Company Social Listening Agents listen for any announcements or",
        dynamic: true,
      },
      {
        route: "POST /api/v1/signal/deploy/competitor-engagement-agent",
        desc: "Deploy a Competitor Engagement signal. Find and qualify every ICP liking or commenting on posts by any LinkedIn profile.",
        dynamic: true,
      },
      {
        route: "POST /api/v1/signal/deploy/competitor-activity-agent",
        desc: "Deploy a Competitor Activity signal. Monitor potential customers your competitors are engaging with. This competitor",
        dynamic: true,
      },
      {
        route: "POST /api/v1/signal/deploy/technography-search-agent",
        desc: "Deploy a Technography Search signal. OpenFunnel Technography Agents help you find companies based on their technology",
        dynamic: true,
      },
      {
        route: "POST /api/v1/signal/deploy/icp-job-change-agent",
        desc: "Deploy an ICP Job Change signal. Find newly joined people in your ICP at your target companies - new joinees come in",
        dynamic: true,
      },
    ],
  },

  // ── ContactOut (Orthogonal) ──
  {
    id: "orth-contactout",
    name: "ContactOut",
    url: "https://api.contactout.com",
    serviceUrl: "https://mpp.orthogonal.com/contactout",
    description:
      "Find anyone's email and phone number. Sales and recruitment intelligence with LinkedIn enrichment, people search, company search, email verification, and decision maker discovery.",
    categories: ["data"],
    integration: "third-party",
    tags: ["email", "phone", "contacts", "recruiting"],
    docs: { homepage: "https://api.contactout.com" },
    provider: { name: "ContactOut", url: "https://api.contactout.com" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v1/people/linkedin",
        desc: "Get contact details for a LinkedIn profile.",
        dynamic: true,
      },
      {
        route: "POST /v1/people/linkedin/batch",
        desc: "Get contact details for up to 30 LinkedIn profiles.",
        dynamic: true,
      },
      {
        route: "GET /v1/linkedin/enrich",
        desc: "Get full profile details (email, phone, work history, education, skills) from a LinkedIn profile URL.",
        dynamic: true,
      },
      {
        route: "GET /v1/email/enrich",
        desc: "Get profile details from an email address.",
        amount: "330000",
        unitType: "request",
      },
      {
        route: "POST /v1/domain/enrich",
        desc: "Get company information from domain names.",
        dynamic: true,
      },
      {
        route: "POST /v1/people/enrich",
        desc: "Enrich a person using multiple data points (name, email, phone, LinkedIn, company).",
        amount: "550000",
        unitType: "request",
      },
    ],
  },

  // ── Tavily API (Orthogonal) ──
  {
    id: "orth-tavily",
    name: "Tavily API",
    url: "https://api.tavily.com",
    serviceUrl: "https://mpp.orthogonal.com/tavily",
    description:
      "Real-time search, extraction, and web crawling through a single, secure API.",
    categories: ["search", "web"],
    integration: "third-party",
    tags: ["web-search", "extraction", "crawl"],
    docs: { homepage: "https://api.tavily.com" },
    provider: { name: "Tavily API", url: "https://api.tavily.com" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /crawl",
        desc: "Tavily Crawl is a graph-based website traversal tool that can explore hundreds of paths in parallel with built-in",
        dynamic: true,
      },
      {
        route: "POST /search",
        desc: "Execute a search query using Tavily Search.",
        dynamic: true,
      },
      {
        route: "POST /map",
        desc: "Tavily Map traverses websites like a graph and can explore hundreds of paths in parallel with intelligent discovery to",
        dynamic: true,
      },
      {
        route: "POST /research",
        desc: "Tavily Research performs comprehensive research on a given topic by conducting multiple searches, analyzing sources",
        amount: "500000",
        unitType: "request",
      },
      {
        route: "POST /extract",
        desc: "Extract web page content from one or more specified URLs using Tavily Extract.",
        dynamic: true,
      },
    ],
  },

  // ── Serper Scrape (Orthogonal) ──
  {
    id: "orth-serper-scrape",
    name: "Serper Scrape",
    url: "https://scrape.serper.dev",
    serviceUrl: "https://mpp.orthogonal.com/serper-scrape",
    description:
      "Web scraping powered by Serper - extract clean text, markdown, or HTML from any URL. Handles JavaScript-rendered pages and returns structured content with metadata.",
    categories: ["web", "data"],
    integration: "third-party",
    tags: ["scraping", "markdown", "html"],
    docs: { homepage: "https://scrape.serper.dev" },
    provider: { name: "Serper Scrape", url: "https://scrape.serper.dev" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /",
        desc: "Scrape any webpage and extract its content as clean text, markdown, or raw HTML. Handles JavaScript-rendered pages",
        amount: "20000",
        unitType: "request",
      },
    ],
  },

  // ── People Data Labs (Orthogonal) ──
  {
    id: "orth-peopledatalabs",
    name: "People Data Labs",
    url: "https://api.peopledatalabs.com",
    serviceUrl: "https://mpp.orthogonal.com/peopledatalabs",
    description:
      "Access the world's largest people and company dataset. Enrich, search, and clean person, company, school, location, job title, and IP data.",
    categories: ["data"],
    integration: "third-party",
    tags: ["people", "company", "enrichment", "search"],
    docs: { homepage: "https://api.peopledatalabs.com" },
    provider: {
      name: "People Data Labs",
      url: "https://api.peopledatalabs.com",
    },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v5/person/identify",
        desc: "Broad person lookup returning up to 20 candidate matches with confidence scores. Useful when you have partial info and",
        amount: "700000",
        unitType: "request",
      },
      {
        route: "POST /v5/company/search",
        desc: "Search and filter companies using Elasticsearch or SQL queries. Find companies by industry, size, location, funding",
        dynamic: true,
      },
      {
        route: "GET /v5/ip/enrich",
        desc: "Enrich an IP address with associated company, location, and metadata.",
        amount: "90000",
        unitType: "request",
      },
      {
        route: "GET /v5/company/enrich",
        desc: "Enrich a company by name, website, ticker, or LinkedIn URL. Returns full company profile with industry, size, location",
        amount: "110000",
        unitType: "request",
      },
      {
        route: "POST /v5/person/search",
        desc: "Search and filter people using Elasticsearch or SQL queries. Find people by job title, company, location, skills",
        dynamic: true,
      },
      {
        route: "GET /v5/person/enrich",
        desc: "Enrich a person by name, email, phone, LinkedIn URL, or other identifiers. Returns full profile with work history",
        amount: "350000",
        unitType: "request",
      },
    ],
  },

  // ── Olostep API (Orthogonal) ──
  {
    id: "orth-olostep",
    name: "Olostep API",
    url: "https://api.olostep.com",
    serviceUrl: "https://mpp.orthogonal.com/olostep",
    description:
      "Olostep offers AI a way to search the web, extract structured data in real time and build custom research agents.",
    categories: ["web", "search"],
    integration: "third-party",
    tags: ["scraping", "extraction", "search", "crawl"],
    docs: { homepage: "https://api.olostep.com" },
    provider: { name: "Olostep API", url: "https://api.olostep.com" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v1/scrapes",
        desc: "Initiate a web page scrape",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /v1/answers",
        desc: "The AI will perform actions like searching and browsing web pages to find the answer to the provided task. Execution",
        amount: "50000",
        unitType: "request",
      },
      {
        route: "POST /v1/crawls",
        desc: "Starts a new crawl. You receive a `id` to track the progress. The operation may take 1-10 mins depending upon the site",
        dynamic: true,
      },
      {
        route: "POST /v1/maps",
        desc: "This endpoint allows users to get all the urls on a certain website. It can take up to 120 seconds for complex",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /v1/batches",
        desc: "Starts a new batch. You receive an `id` that you can use to track the progress of the batch as shown",
        dynamic: true,
      },
    ],
  },

  // ── Riveter API (Orthogonal) ──
  {
    id: "orth-riveter",
    name: "Riveter API",
    url: "https://api.riveterhq.com",
    serviceUrl: "https://mpp.orthogonal.com/riveter",
    description:
      "Power your product with data from the web. Riveter's agents manage web search, scraping, browser infrastructure, and proxies for you. Every result has a source.",
    categories: ["web", "data"],
    integration: "third-party",
    tags: ["scraping", "extraction", "agents"],
    docs: { homepage: "https://api.riveterhq.com" },
    provider: { name: "Riveter API", url: "https://api.riveterhq.com" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v1/scrape",
        desc: "Scrape a webpage and return the text content. This endpoint allows you to extract text content from any public webpage.",
        dynamic: true,
      },
      {
        route: "POST /v1/run",
        desc: "Copy link Define the structure of your output directly in the API request. This endpoint allows you to define both your",
        dynamic: true,
      },
    ],
  },

  // ── Happenstance (Orthogonal) ──
  {
    id: "orth-happenstance",
    name: "Happenstance",
    url: "https://api.happenstance.ai",
    serviceUrl: "https://mpp.orthogonal.com/happenstance",
    description:
      "Person research API. Submit a description of someone and get back a detailed profile including employment history, education, projects, writings, hobbies, and a summary.",
    categories: ["data"],
    integration: "third-party",
    tags: ["people", "research", "enrichment"],
    docs: { homepage: "https://api.happenstance.ai" },
    provider: { name: "Happenstance", url: "https://api.happenstance.ai" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v1/research",
        desc: "Start a new person research request. Include as many details as possible about the person in the description field",
        amount: "300000",
        unitType: "request",
      },
    ],
  },

  // ── Apollo API (Orthogonal) ──
  {
    id: "orth-apollo",
    name: "Apollo API",
    url: "https://api.apollo.io",
    serviceUrl: "https://mpp.orthogonal.com/apollo",
    description:
      "Apollo.io API for people and company enrichment, search, and prospecting. Access the Apollo database of 210M+ contacts and 30M+ companies.",
    categories: ["data"],
    integration: "third-party",
    tags: ["enrichment", "people", "company", "prospecting"],
    docs: { homepage: "https://api.apollo.io" },
    provider: { name: "Apollo API", url: "https://api.apollo.io" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /api/v1/organizations/enrich",
        desc: "Enrich a company by domain. Returns industry, revenue, employee count, funding, locations, and more.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/organizations/bulk_enrich",
        desc: "Enrich up to 10 organizations in a single request.",
        amount: "50000",
        unitType: "request",
      },
      {
        route: "GET /api/v1/organizations/:organization_id/job_postings",
        desc: "Get current job postings for a company by Apollo organization ID.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/news_articles/search",
        desc: "Search for news articles related to companies in the Apollo database.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /api/v1/organizations/:id",
        desc: "Get complete organization info by Apollo organization ID.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/people/match",
        desc: "Enrich a person by email, LinkedIn URL, name+company, or other identifiers. Returns contact details, job info, and",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/people/bulk_match",
        desc: "Enrich up to 10 people in a single request. Webhook required for async results.",
        amount: "50000",
        unitType: "request",
      },
      {
        route: "POST /api/v1/mixed_companies/search",
        desc: "Search Apollo database for companies matching filters. Returns up to 100 results per page.",
        amount: "10000",
        unitType: "request",
      },
    ],
  },

  // ── Context.dev (Orthogonal) ──
  {
    id: "orth-context-dev",
    name: "Context.dev",
    url: "https://api.context.dev/v1",
    serviceUrl: "https://mpp.orthogonal.com/context-dev",
    description:
      "API for retrieving context data from any website. Web scraping, brand retrieval, AI data extraction, screenshots, and more.",
    categories: ["web", "data"],
    integration: "third-party",
    tags: ["scraping", "brand", "context", "extraction"],
    docs: { homepage: "https://www.context.dev" },
    provider: { name: "Context.dev", url: "https://www.context.dev" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /web/scrape/html",
        desc: "Scrapes the given URL and returns the raw HTML content of the page.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /web/scrape/markdown",
        desc: "Scrapes the given URL, converts the HTML content to Markdown, and returns the result.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /web/scrape/images",
        desc: "Scrapes all images from the given URL. Extracts images from img, svg, picture/source, link, and video elements",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /web/scrape/sitemap",
        desc: "Crawls the sitemap of the given domain and returns all discovered page URLs. Supports sitemap index files (recursive)",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /web/search",
        desc: "Performs an intelligent web search. Costs 1 credit per returned result.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /brand/retrieve-by-email",
        desc: "Retrieve brand information using an email address while detecting disposable and free email addresses. This endpoint",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /brand/retrieve-by-isin",
        desc: "Retrieve brand information using an ISIN (International Securities Identification Number). This endpoint looks up the",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /brand/retrieve-simplified",
        desc: "Returns a simplified version of brand data containing only essential information: domain, title, colors, logos, and",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /brand/fonts",
        desc: "Extract font information from a brand's website including font families, usage statistics, fallbacks, and element/word",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /brand/ai/query",
        desc: "Use AI to extract specific data points from a brand's website. The AI will crawl the website and extract the requested",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /brand/ai/products",
        desc: "Beta feature: Extract product information from a brand's website. We will analyze the website and return a list of",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /brand/ai/product",
        desc: "Beta feature: Given a single URL, determines if it is a product detail page, classifies the platform/product type, and",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /brand/prefetch",
        desc: "Signal that you may fetch brand data for a particular domain soon to improve latency. This endpoint does not charge",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /brand/naics",
        desc: "Endpoint to classify any brand into a 2022 NAICS code.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /brand/retrieve-by-ticker",
        desc: "Retrieve brand information using a stock ticker symbol. This endpoint looks up the company associated with the ticker",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /brand/transaction_identifier",
        desc: "Endpoint specially designed for platforms that want to identify transaction data by the transaction title.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /web/crawl",
        desc: "Performs a crawl starting from a given URL, extracts page content as Markdown, and returns results for all crawled",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /brand/retrieve",
        desc: "Retrieve logos, backdrops, colors, industry, description, and more from any domain",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /brand/retrieve-by-name",
        desc: "Retrieve brand information using a company name. This endpoint searches for the company by name and returns its brand",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /brand/styleguide",
        desc: "Automatically extract comprehensive design system information from a brand's website including colors, typography",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /brand/screenshot",
        desc: "Capture a screenshot of a website. Supports both viewport (standard browser view) and full-page screenshots. Can also",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /brand/prefetch-by-email",
        desc: "Signal that you may fetch brand data for a particular domain soon to improve latency. This endpoint accepts an email",
        amount: "30000",
        unitType: "request",
      },
    ],
  },

  // ── Precip AI - Hyperlocal Weather Data API (Orthogonal) ──
  {
    id: "orth-precip",
    name: "Precip AI - Hyperlocal Weather Data API",
    url: "https://api.precip.ai",
    serviceUrl: "https://mpp.orthogonal.com/precip",
    description:
      "Precip offers highly accurate, site-specific rainfall accumulation data.",
    categories: ["data"],
    integration: "third-party",
    tags: ["weather", "rainfall", "hyperlocal", "climate"],
    docs: { homepage: "https://api.precip.ai" },
    provider: {
      name: "Precip AI - Hyperlocal Weather Data API",
      url: "https://api.precip.ai",
    },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /api/v1/last-48",
        desc: "Total precipitation in the last 48 hours for the given location(s).",
        dynamic: true,
      },
      {
        route: "GET /api/v1/temperature-hourly",
        desc: "Hourly near-surface air temperature in Celsius (°C)",
        dynamic: true,
      },
      {
        route: "GET /api/v1/soil-moisture-hourly",
        desc: "Hourly soil moisture percentage relative to holding capacity at 0-10cm depth",
        dynamic: true,
      },
      {
        route: "GET /api/v1/wind-direction-hourly",
        desc: "Hourly wind direction in compass degrees (0-360)",
        dynamic: true,
      },
      {
        route: "GET /api/v1/daily",
        desc: "Returns comprehensive daily precipitation data for the given time range and location(s). Each day includes",
        dynamic: true,
      },
      {
        route: "GET /api/v1/wind-speed-gust-hourly",
        desc: "Hourly wind gust speed in meters per second (m/s)",
        dynamic: true,
      },
      {
        route: "GET /api/v1/recent-rain",
        desc: "Returns detailed information about the most recent precipitation event for the given location(s), including total",
        dynamic: true,
      },
      {
        route: "GET /api/v1/map/:serviceName/ImageServer/tile/:z/:y/:x",
        desc: "Map tiles compatible with most web mapping or GIS tools. Software such as Mapbox, Google Maps, ArcGIS, Leaflet",
        dynamic: true,
      },
      {
        route: "GET /api/v1/wind-speed-hourly",
        desc: "Hourly near-surface wind speed in meters per second (m/s)",
        dynamic: true,
      },
      {
        route: "GET /api/v1/cloud-cover-hourly",
        desc: "Hourly cloud cover fraction (0-1, where 0 is clear and 1 is overcast)",
        dynamic: true,
      },
      {
        route: "GET /api/v1/temp-0-10cm-hourly",
        desc: "Hourly soil temperature data at 0-10cm depth in Celsius (°C)",
        dynamic: true,
      },
      {
        route: "GET /api/v1/specific-humidity-hourly",
        desc: "Hourly specific humidity (kg/kg)",
        dynamic: true,
      },
      {
        route: "GET /api/v1/hourly",
        desc: "Returns comprehensive hourly precipitation data for the given time range and location(s). Each hour includes",
        dynamic: true,
      },
      {
        route: "GET /api/v1/soil-moisture-daily",
        desc: "Daily soil moisture percentage relative to holding capacity at 0-10cm depth",
        dynamic: true,
      },
      {
        route: "GET /embed/location",
        desc: "Returns a complete, HTML page displaying comprehensive weather data for a specific location. See the examples page for",
        amount: "100000",
        unitType: "request",
      },
      {
        route: "GET /api/v1/solar-radiation-hourly",
        desc: "Hourly downward short-wave radiation flux in watts per square meter (W/m²)",
        dynamic: true,
      },
      {
        route: "GET /api/v1/relative-humidity-hourly",
        desc: "Hourly relative humidity as a percentage (0-100%)",
        dynamic: true,
      },
    ],
  },

  // ── Nyne.ai (Orthogonal) ──
  {
    id: "orth-nyne",
    name: "Nyne.ai",
    url: "https://api.nyne.ai",
    serviceUrl: "https://mpp.orthogonal.com/nyne",
    description:
      "People and company intelligence platform. Find contacts, enrich profiles, get social media activity, and discover event attendees.",
    categories: ["data"],
    integration: "third-party",
    tags: ["people", "company", "enrichment", "contacts"],
    docs: { homepage: "https://api.nyne.ai" },
    provider: { name: "Nyne.ai", url: "https://api.nyne.ai" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /company/funding",
        desc: "Start async retrieval of company funding history and investment details.",
        amount: "578000",
        unitType: "request",
      },
      {
        route: "POST /person/interactions",
        desc: "Start async retrieval of social media interactions. Requires social_media_url and type.",
        amount: "219000",
        unitType: "request",
      },
      {
        route: "POST /person/search",
        desc: "Start async person search by company name, role, geography, and person name. Returns requestId for polling.",
        dynamic: true,
      },
      {
        route: "POST /company/enrichment",
        desc: "Start async company enrichment. Requires at least one of: email, phone, or social_media_url.",
        amount: "76000",
        unitType: "request",
      },
      {
        route: "POST /person/newsfeed",
        desc: "Start async retrieval of social media newsfeed data from LinkedIn, Twitter, Instagram, GitHub, or Facebook profiles.",
        amount: "435000",
        unitType: "request",
      },
      {
        route: "POST /person/interests",
        desc: "Start async retrieval of interests, skills, and topics a person engages with.",
        amount: "363000",
        unitType: "request",
      },
      {
        route: "POST /company/search",
        desc: "Start async company search. Requires at least one of: industry or website_keyword.",
        amount: "363000",
        unitType: "request",
      },
      {
        route: "POST /company/funders",
        desc: "Start async retrieval of investors and funders associated with a company.",
        amount: "1440000",
        unitType: "request",
      },
      {
        route: "POST /person/events",
        desc: "Start async retrieval of life events and career milestones. Requires event parameter.",
        amount: "219000",
        unitType: "request",
      },
      {
        route: "POST /person/social-profiles",
        desc: "Start async retrieval of all social media profiles associated with a person.",
        amount: "363000",
        unitType: "request",
      },
      {
        route: "POST /person/single-social-lookup",
        desc: "Start async lookup of a single social media profile. Requires both social_media_url and site.",
        amount: "148000",
        unitType: "request",
      },
      {
        route: "POST /company/checkseller",
        desc: "Start async check if a company sells a specific product/service.",
        amount: "148000",
        unitType: "request",
      },
      {
        route: "POST /person/enrichment",
        desc: "Start async person enrichment. Requires at least one of: email, phone, or social_media_url.",
        dynamic: true,
      },
      {
        route: "POST /company/needs",
        desc: "Start async analysis of company needs based on provided content.",
        amount: "219000",
        unitType: "request",
      },
    ],
  },

  // ── Company Enrich (Orthogonal) ──
  {
    id: "orth-company-enrich",
    name: "Company Enrich",
    url: "https://api.companyenrich.com",
    serviceUrl: "https://mpp.orthogonal.com/company-enrich",
    description:
      "Comprehensive company and people data enrichment, search, and lead generation API. Enrich company profiles by domain or properties, search companies by industry/location/size/technology, find similar companies, search",
    categories: ["data"],
    integration: "third-party",
    tags: ["company", "people", "enrichment", "leads"],
    docs: { homepage: "https://api.companyenrich.com" },
    provider: { name: "Company Enrich", url: "https://api.companyenrich.com" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /companies/workforce",
        desc: "Get workforce insights for a company. Returns observed employee count, employee range bucket, and headcounts broken",
        amount: "61250",
        unitType: "request",
      },
      {
        route: "POST /companies/search",
        desc: "Search for companies matching specific criteria. Supports filters for country, industry, employee count, revenue",
        dynamic: true,
      },
      {
        route: "POST /companies/search/scroll",
        desc: "Search companies with cursor-based pagination for large result sets. Accepts the same filters as /companies/search. No",
        dynamic: true,
      },
      {
        route: "GET /companies/enrich",
        desc: "Enrich a company by domain name. Returns the full company profile including industry, employee count, revenue",
        amount: "12250",
        unitType: "request",
      },
      {
        route: "GET /companies",
        desc: "Get a company's full profile by its CompanyEnrich ID. Returns name, domain, industry, employee count, revenue",
        amount: "12250",
        unitType: "request",
      },
      {
        route: "POST /people/lookup",
        desc: "Look up a person by their email address. Resolves the company from the email domain, then matches the person. Returns",
        amount: "61250",
        unitType: "request",
      },
      {
        route: "GET /people",
        desc: "Get a person's full profile by their CompanyEnrich ID. Returns name, title, company, location, social links, and more.",
        amount: "24500",
        unitType: "request",
      },
      {
        route: "GET /people/email",
        desc: "Resolve a work email address for a person. If domain is omitted, the person's current experience domains are tried",
        amount: "122500",
        unitType: "request",
      },
      {
        route: "POST /companies/enrich",
        desc: "Enrich a company by its properties when you don't have a domain. Requires at least one of: name, LinkedIn URL, LinkedIn",
        amount: "12250",
        unitType: "request",
      },
      {
        route: "POST /companies/enrich/batch",
        desc: "Enrich multiple companies by domain in a single request. Accepts 1 to 50 domains. Use this instead of multiple",
        dynamic: true,
      },
      {
        route: "POST /companies/similar/scroll",
        desc: "Find similar companies with cursor-based pagination for large result sets. Accepts the same parameters as",
        dynamic: true,
      },
      {
        route: "POST /people/search/scroll",
        desc: "Search people with cursor-based pagination for large result sets. Accepts the same filters as /people/search. No 10,000",
        dynamic: true,
      },
      {
        route: "POST /companies/similar",
        desc: "Find companies similar to one or more given companies. Supports additional filters like country, industry, employee",
        dynamic: true,
      },
      {
        route: "POST /people/search",
        desc: "Search for people matching specific criteria. Supports filters for company domains, job titles, countries, states",
        dynamic: true,
      },
    ],
  },

  // ── Fundable (Orthogonal) ──
  {
    id: "orth-fundable",
    name: "Fundable",
    url: "https://tryfundable.ai/api/v1",
    serviceUrl: "https://mpp.orthogonal.com/fundable",
    description:
      "Real-time venture capital deals, startup, and investor data. Search funding rounds, discover companies, analyze investors, and track deal flow with advanced filtering and AI-powered semantic search.",
    categories: ["data"],
    integration: "third-party",
    tags: ["funding", "vc", "startups", "investors"],
    docs: { homepage: "https://tryfundable.ai" },
    provider: { name: "Fundable", url: "https://tryfundable.ai" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /deals/:id",
        desc: "Get funding round by id",
        amount: "66000",
        unitType: "request",
      },
      {
        route: "GET /deals/:id/investors",
        desc: "Get investors in a funding round by id",
        amount: "66000",
        unitType: "request",
      },
      {
        route: "GET /investor",
        desc: "Get investor by id",
        amount: "66000",
        unitType: "request",
      },
      {
        route: "GET /investor/search",
        desc: "Search for an investor id using fuzzy match or other identifiers",
        amount: "11000",
        unitType: "request",
      },
      {
        route: "GET /company",
        desc: "Get company by id, includes latest funding round",
        amount: "66000",
        unitType: "request",
      },
      {
        route: "GET /company/search",
        desc: "Search for company id using fuzzy match or other identifiers",
        amount: "11000",
        unitType: "request",
      },
      {
        route: "POST /investors",
        desc: "Search for investors using filters",
        dynamic: true,
      },
      {
        route: "GET /company/deals",
        desc: "Get entire funding history for a company",
        dynamic: true,
      },
      {
        route: "GET /investor/deals",
        desc: "Get investment firm's portfolio of investments",
        dynamic: true,
      },
      {
        route: "POST /companies",
        desc: "Search for companies using filters, includes latest funding round",
        dynamic: true,
      },
      {
        route: "POST /deals",
        desc: "Search for funding rounds using filters",
        dynamic: true,
      },
    ],
  },

  // ── Didit API (Orthogonal) ──
  {
    id: "orth-didit",
    name: "Didit API",
    url: "https://verification.didit.me",
    serviceUrl: "https://mpp.orthogonal.com/didit",
    description:
      "The all-in-one identity platform. Powering the fastest identity verification while fighting fraud and unifying all identity checks.",
    categories: ["data"],
    integration: "third-party",
    tags: ["identity", "verification", "kyc"],
    docs: { homepage: "https://verification.didit.me" },
    provider: { name: "Didit API", url: "https://verification.didit.me" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v3/email/send",
        desc: "Send a one-time verification code to an email address.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "POST /v3/phone/send",
        desc: "Send a one-time verification code to a phone number.",
        amount: "300000",
        unitType: "request",
      },
      {
        route: "POST /v3/aml",
        desc: "The AML Screening API allows you to screen individuals or companies against global watchlists and high-risk databases",
        amount: "360000",
        unitType: "request",
      },
      {
        route: "POST /v3/database-validation",
        desc: "Validate user-provided identity data against authoritative national and global data sources.",
        amount: "310000",
        unitType: "request",
      },
    ],
  },

  // ── Influencers Club (Orthogonal) ──
  {
    id: "orth-influencers-club",
    name: "Influencers Club",
    url: "https://api-dashboard.influencers.club",
    serviceUrl: "https://mpp.orthogonal.com/influencers-club",
    description:
      "Creator discovery, enrichment, and audience analytics across Instagram, YouTube, TikTok, Twitter, Twitch, and more. Search creators with advanced filters, enrich profiles by handle or email, find similar creators",
    categories: ["social", "data"],
    integration: "third-party",
    tags: ["creators", "influencers", "instagram", "tiktok"],
    docs: { homepage: "https://api-dashboard.influencers.club" },
    provider: {
      name: "Influencers Club",
      url: "https://api-dashboard.influencers.club",
    },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /public/v1/creators/enrich/handle/raw/",
        desc: "Retrieve raw platform data for a creator by handle. Returns unprocessed data including profile info, post data, media",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "POST /public/v1/creators/audience/overlap/",
        desc: "Compare audience overlap between 2-10 creators on a given platform. Returns per-creator overlap and unique audience",
        amount: "660000",
        unitType: "request",
      },
      {
        route: "POST /public/v1/discovery/",
        desc: "Search and discover creators across multiple platforms using advanced filtering (location, gender, language, followers",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /public/v1/creators/socials/",
        desc: "Discover all verified social accounts connected to a creator. Supports 10 seed platforms: Instagram, YouTube, TikTok",
        amount: "330000",
        unitType: "request",
      },
      {
        route: "POST /public/v1/creators/enrich/email/",
        desc: "Basic creator enrichment by email address. Returns essential profile info including social media presence, contact",
        amount: "33000",
        unitType: "request",
      },
      {
        route: "POST /public/v1/creators/content/posts/",
        desc: "Fetch recent posts for a creator. Returns post metadata including ID, URL, caption, media URLs, timestamps, and",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "POST /public/v1/creators/content/details/",
        desc: "Retrieve detailed post information: metadata, comments, transcript, or audio. Supports Instagram",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "POST /public/v1/creators/enrich/handle/full/",
        desc: "Comprehensive creator enrichment by social media handle. Returns cross-platform presence, engagement analytics",
        amount: "660000",
        unitType: "request",
      },
      {
        route: "POST /public/v1/discovery/creators/similar/",
        desc: "Find creators similar to a reference creator by URL, username, or ID. Supports Instagram, YouTube, TikTok, and Twitch",
        amount: "30000",
        unitType: "request",
      },
    ],
  },

  // ── Bytemine (Orthogonal) ──
  {
    id: "orth-bytemine",
    name: "Bytemine",
    url: "https://bvjmtgaxijpyasjtaqiv.supabase.co/functions/v1/api-gateway",
    serviceUrl: "https://mpp.orthogonal.com/bytemine",
    description:
      "Sales intelligence platform offering prospect search, contact enrichment, company intelligence, web crawling, funding/acquisition signals, LinkedIn post monitoring, proposal generation, meeting briefs, ROI calculators",
    categories: ["data"],
    integration: "third-party",
    tags: ["sales-intelligence", "prospecting", "enrichment"],
    docs: { homepage: "https://bvjmtgaxijpyasjtaqiv.supabase.co" },
    provider: {
      name: "Bytemine",
      url: "https://bvjmtgaxijpyasjtaqiv.supabase.co",
    },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /crawl/start",
        desc: "Start a multi-page crawl job with sitemap discovery and configurable depth/page limits. Returns job_id. 1 credit per",
        dynamic: true,
      },
      {
        route: "POST /b2b-search",
        desc: "Search companies by name, industry, NAICS code, keywords, location, employee count. 1 credit per company returned.",
        dynamic: true,
      },
      {
        route: "POST /contacts/search",
        desc: "Search the prospect database using filters like job title, seniority, industry, location, company size, and more",
        dynamic: true,
      },
      {
        route: "POST /signals/acquisitions",
        desc: "Search real-time M&A/acquisition signals with filters for acquirer, amount, industry, date, and more. 1 credit per",
        dynamic: true,
      },
      {
        route: "POST /contacts/enrich",
        desc: "Enrich a single contact by email, phone, LinkedIn, Facebook, or name+company. Returns full profile with work email",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /v1/icp-builder",
        desc: "Describe your ideal customer profile in plain text. Returns a job_id immediately. Provide a webhook_url to receive",
        amount: "1500000",
        unitType: "request",
      },
      {
        route: "POST /signals/funding",
        desc: "Search real-time funding signals with filters for round type, amount, investor, industry, date, employee count, and",
        dynamic: true,
      },
      {
        route: "POST /contacts/unlock",
        desc: "Unlock full contact details (emails, phones, social profiles) for prospect PIDs obtained from /contacts/search",
        dynamic: true,
      },
      {
        route: "POST /v1/company-lookalikes",
        desc: "Find companies similar to provided domains (max 10). Returns job_id immediately. Provide a webhook_url to receive",
        amount: "1500000",
        unitType: "request",
      },
      {
        route: "POST /b2b-enrich",
        desc: "Enrich a company by name, website, LinkedIn URL, or company_id. Returns full profile with description, industries",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /crawl/map",
        desc: "Discover all URLs on a website via sitemap + link extraction. Returns scored/sorted URLs without scraping content. 1",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /crawl/scrape",
        desc: "Scrape a URL and return markdown, links, metadata, and tech stack. Falls back to Firecrawl if needed. 1 credit.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /crawl/extract",
        desc: "Scrape a URL and extract structured data using a schema: company_profile, team_members, pricing, tech_stack",
        amount: "60000",
        unitType: "request",
      },
      {
        route: "POST /crawl/intel",
        desc: "Crawl a website's key pages and return comprehensive intel: company profile, contacts, social links, tech stack, sales",
        amount: "150000",
        unitType: "request",
      },
      {
        route: "POST /crawl/batch",
        desc: "Scrape up to 100 URLs in parallel. Returns markdown, metadata, and tech stack per URL. 1 credit per URL.",
        dynamic: true,
      },
      {
        route: "POST /crawl/snapshot",
        desc: "Save a snapshot of a page's current content for change tracking. Use with /crawl/diff to detect changes. 1 credit.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /v1/proposals/generate",
        desc: "Generate a personalized sales or partnership proposal with branding, ROI projections, social proof, and outreach copy",
        amount: "300000",
        unitType: "request",
      },
      {
        route: "POST /crawl/diff",
        desc: "Compare a page's current content against a saved snapshot. Returns added/removed lines and change summary. 1 credit.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /crawl/continue",
        desc: "Resume processing pending pages in an existing crawl job. Call repeatedly until status is 'completed'.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /crawl/status",
        desc: "Check crawl job status including pages crawled, found, and completion. Free, no credits.",
        amount: "0",
        unitType: "request",
      },
      {
        route: "POST /crawl/results",
        desc: "Retrieve paginated results from a completed crawl. Each result includes URL, markdown, metadata, and links. Free, no",
        amount: "0",
        unitType: "request",
      },
      {
        route: "POST /v1/apps/meeting-prep",
        desc: "Generate a comprehensive meeting prep brief with company intel, contacts, talking points, objections, ice breakers, and",
        amount: "300000",
        unitType: "request",
      },
      {
        route: "POST /v1/apps/roi-calculator",
        desc: "Generate a personalized ROI projection and business case with quantified savings, implementation timeline, risk",
        amount: "300000",
        unitType: "request",
      },
    ],
  },

  // ── Brand.dev API (Orthogonal) ──
  {
    id: "orth-brand-dev",
    name: "Brand.dev API",
    url: "https://api.brand.dev",
    serviceUrl: "https://mpp.orthogonal.com/brand-dev",
    description:
      "API to personalize your product with logos, colors, and company info from any domain.",
    categories: ["data", "web"],
    integration: "third-party",
    tags: ["brand", "logos", "colors", "company"],
    docs: { homepage: "https://api.brand.dev" },
    provider: { name: "Brand.dev API", url: "https://api.brand.dev" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v1/brand/fonts",
        desc: "Extract font information from a brand’s website including font families, usage statistics, fallbacks, and element/word",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /v1/brand/transaction_identifier",
        desc: "Endpoint specially designed for platforms that want to identify transaction data by the transaction title.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /v1/brand/naics",
        desc: "Endpoint to classify any brand into a 2022 NAICS code.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /v1/brand/retrieve-by-email",
        desc: "Retrieve brand information using an email address while detecting disposable and free email addresses. This endpoint",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /v1/brand/retrieve-simplified",
        desc: "Returns a simplified version of brand data containing only essential information: domain, title, colors, logos, and",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /v1/brand/retrieve-by-isin",
        desc: "Retrieve brand information using an ISIN (International Securities Identification Number). This endpoint looks up the",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /v1/brand/ai/products",
        desc: "Beta feature: Extract product information from a brand’s website. Brand.dev will analyze the website and return a list",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /v1/brand/retrieve",
        desc: "Retrieve logos, backdrops, colors, industry, description, and more from any domain",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /v1/brand/retrieve-by-name",
        desc: "Retrieve brand information using a company name. This endpoint searches for the company by name and returns its brand",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /v1/brand/retrieve-by-ticker",
        desc: "Retrieve brand information using a stock ticker symbol. This endpoint looks up the company associated with the ticker",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /v1/brand/styleguide",
        desc: "Automatically extract comprehensive design system information from a brand’s website including colors, typography",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /v1/brand/screenshot",
        desc: "Capture a screenshot of a website. Supports both viewport (standard browser view) and full-page screenshots. Can also",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /v1/brand/ai/query",
        desc: "Use AI to extract specific data points from a brand’s website. The AI will crawl the website and extract the requested",
        amount: "30000",
        unitType: "request",
      },
    ],
  },

  // ── Notte (Orthogonal) ──
  {
    id: "orth-notte",
    name: "Notte",
    url: "https://api.notte.cc",
    serviceUrl: "https://mpp.orthogonal.com/notte",
    description:
      "Browser automation API for AI agents. Start browser sessions, run AI agents, scrape webpages, and automate browser tasks with headless Chrome/Firefox. Features include CAPTCHA solving, proxy support, and persistent",
    categories: ["web", "compute"],
    integration: "third-party",
    tags: ["browser", "automation", "agents"],
    docs: { homepage: "https://api.notte.cc" },
    provider: { name: "Notte", url: "https://api.notte.cc" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /sessions/:session_id/page/screenshot",
        desc: "Take a screenshot of the current page.",
        amount: "1000",
        unitType: "request",
      },
      {
        route: "POST /sessions/:session_id/page/observe",
        desc: "Observe the current page state and get available actions.",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /scrape",
        desc: "Scrape content from a URL without managing sessions.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /sessions/:session_id/page/execute",
        desc: "Execute an action on the page (click, type, navigate, etc.).",
        amount: "2000",
        unitType: "request",
      },
      {
        route: "POST /sessions/:session_id/cookies",
        desc: "Set cookies in the browser session.",
        amount: "1000",
        unitType: "request",
      },
      {
        route: "POST /sessions/start",
        desc: "Start a new browser session. Configure browser type, proxies, viewport, and session timeout.",
        dynamic: true,
      },
      {
        route: "POST /scrape_from_html",
        desc: "Extract structured content from raw HTML without using a browser",
        amount: "2000",
        unitType: "request",
      },
      {
        route: "POST /agents/start",
        desc: "Start an AI agent to autonomously complete a browser task.",
        dynamic: true,
      },
      {
        route: "POST /sessions/:session_id/page/scrape",
        desc: "Scrape content from the current page in the session.",
        amount: "3000",
        unitType: "request",
      },
    ],
  },

  // ── Coresignal (Orthogonal) ──
  {
    id: "orth-coresignal",
    name: "Coresignal",
    url: "https://api.coresignal.com/cdapi",
    serviceUrl: "https://mpp.orthogonal.com/coresignal",
    description:
      "Business data intelligence platform providing company, employee, and job data from multiple sources. Access 3B+ regularly updated records via simple filters and data collection endpoints.",
    categories: ["data"],
    integration: "third-party",
    tags: ["company", "employee", "jobs", "intelligence"],
    docs: { homepage: "https://api.coresignal.com" },
    provider: { name: "Coresignal", url: "https://api.coresignal.com" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v2/company_base/collect/:profile_url",
        desc: "Get a full company profile by its professional network URL. Pass the URL-encoded company page URL in the path. Returns",
        amount: "42000",
        unitType: "request",
      },
      {
        route: "GET /v2/employee_clean/collect/:employee_id",
        desc: "Get a cleaned, deduplicated employee profile by its Coresignal numeric ID. Use IDs returned by the search endpoints",
        amount: "42000",
        unitType: "request",
      },
      {
        route: "GET /v2/company_clean/enrich",
        desc: "Look up a company by its website domain and get a full cleaned company profile. This is the easiest way to get company",
        amount: "42000",
        unitType: "request",
      },
      {
        route: "GET /v2/company_clean/collect/:company_id",
        desc: "Get a cleaned, deduplicated company profile by its Coresignal numeric ID. Use IDs returned by the search endpoints or",
        amount: "42000",
        unitType: "request",
      },
      {
        route: "GET /v2/company_multi_source/collect/:company_id",
        desc: "Get the most comprehensive company profile by its Coresignal numeric ID. Multi-source data is aggregated from",
        amount: "84000",
        unitType: "request",
      },
      {
        route: "GET /v2/company_multi_source/collect/:profile_url",
        desc: "Get a comprehensive multi-source company profile by its professional network URL. Pass the URL-encoded company page URL",
        amount: "84000",
        unitType: "request",
      },
      {
        route: "GET /v2/employee_multi_source/collect/:employee_id",
        desc: "Get the most comprehensive employee profile by its Coresignal numeric ID. Multi-source data is aggregated from multiple",
        amount: "84000",
        unitType: "request",
      },
      {
        route: "GET /v2/employee_post/collect/:post_id",
        desc: "Get a full professional network post by its numeric post ID. Use IDs returned by the 'Employee Posts Search (Filter)'",
        amount: "42000",
        unitType: "request",
      },
      {
        route: "POST /v2/employee_base/search/filter/preview",
        desc: "Preview employee search results with summary data. Pass filters in the request body. Returns matching professionals",
        amount: "21000",
        unitType: "request",
      },
      {
        route: "POST /v2/job_base/search/filter",
        desc: "Search for job listings using filters passed in the request body. Returns an array of numeric Coresignal job IDs (e.g",
        amount: "21000",
        unitType: "request",
      },
      {
        route: "POST /v2/job_base/search/filter/preview",
        desc: "Preview job search results with summary data. Pass filters in the request body. Returns matching jobs with key fields",
        amount: "21000",
        unitType: "request",
      },
      {
        route: "GET /v2/employee_multi_source/collect/:profile_url",
        desc: "Get a comprehensive multi-source employee profile by their professional network URL. Pass the URL-encoded profile URL",
        amount: "84000",
        unitType: "request",
      },
      {
        route: "GET /v2/employee_base/collect/:profile_url",
        desc: "Get a full employee profile by their professional network URL. Pass the URL-encoded profile URL in the path. Returns",
        amount: "42000",
        unitType: "request",
      },
      {
        route: "POST /v2/company_base/search/filter/preview",
        desc: "Preview company search results with summary data. Pass filters in the request body. Returns matching companies with key",
        amount: "21000",
        unitType: "request",
      },
      {
        route: "GET /v2/job_base/collect/:job_id",
        desc: "Get a full job listing by its Coresignal numeric ID. Use IDs returned by the 'Base Jobs Search (Filter)' or Preview",
        amount: "42000",
        unitType: "request",
      },
      {
        route: "GET /v2/company_base/collect/:company_id",
        desc: "Get a full company profile by its Coresignal numeric ID. Use IDs returned by the 'Base Company Search (Filter)' or",
        amount: "42000",
        unitType: "request",
      },
      {
        route: "POST /v2/employee_base/search/filter",
        desc: "Search for professionals/employees using filters passed in the request body. Returns an array of numeric Coresignal",
        amount: "21000",
        unitType: "request",
      },
      {
        route: "GET /v2/company_multi_source/enrich",
        desc: "Look up a company by its website domain and get the most comprehensive company profile. This is the easiest way to get",
        amount: "84000",
        unitType: "request",
      },
      {
        route: "POST /v2/company_base/search/filter",
        desc: "Search for companies using filters passed in the request body. Returns an array of numeric Coresignal company IDs",
        amount: "21000",
        unitType: "request",
      },
      {
        route: "GET /v2/employee_base/collect/:employee_id",
        desc: "Get a full employee/professional profile by its Coresignal numeric ID. Use IDs returned by the 'Base Employee Search",
        amount: "42000",
        unitType: "request",
      },
      {
        route: "POST /v2/employee_post/search/filter",
        desc: "Search for professional network posts using filters like author profile URL or keywords. Pass filters in the request",
        amount: "21000",
        unitType: "request",
      },
    ],
  },

  // ── Linkup API (Orthogonal) ──
  {
    id: "orth-linkup",
    name: "Linkup API",
    url: "https://api.linkup.so/v1",
    serviceUrl: "https://mpp.orthogonal.com/linkup",
    description:
      "Linkup is a web search engine for AI apps. We connect your AI application to the internet. Our API provides grounding data to enrich your AI’s output and increase its precision, accuracy and factuality.",
    categories: ["search", "web"],
    integration: "third-party",
    tags: ["web-search", "ai", "retrieval"],
    docs: { homepage: "https://api.linkup.so" },
    provider: { name: "Linkup API", url: "https://api.linkup.so" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /search",
        desc: "The /search endpoint allows you to retrieve web content.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /fetch",
        desc: "The /fetch endpoint allows you to fetch a single webpage from a given URL.",
        amount: "10000",
        unitType: "request",
      },
    ],
  },

  // ── Scrape Creators (Orthogonal) ──
  {
    id: "orth-scrapecreators",
    name: "Scrape Creators",
    url: "https://api.scrapecreators.com",
    serviceUrl: "https://mpp.orthogonal.com/scrapecreators",
    description:
      "Social media data extraction API covering 22+ platforms including TikTok, Instagram, YouTube, Twitter/X, LinkedIn, Facebook, Reddit, Pinterest, Threads, Bluesky, and more.",
    categories: ["social", "data"],
    integration: "third-party",
    tags: ["social-media", "tiktok", "instagram", "youtube", "scraping"],
    docs: { homepage: "https://api.scrapecreators.com" },
    provider: {
      name: "Scrape Creators",
      url: "https://api.scrapecreators.com",
    },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v1/komi",
        desc: "Komi",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/pillar",
        desc: "Pillar",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/amazon/shop",
        desc: "Amazon Shop",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/linkme",
        desc: "Linkme",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "POST /v1/truthsocial/webhook",
        desc: "Truth Social Webhook",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/detect-age-gender",
        desc: "Age and Gender",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/reddit/ad",
        desc: "Get Ad",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/profile",
        desc: "TikTok",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/user/audience",
        desc: "User's Audience Demographics",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v2/instagram/media/transcript",
        desc: "Transcript",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v2/instagram/reels/search",
        desc: "Search Reels",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v2/instagram/post/comments",
        desc: "Comments",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/instagram/user/reels",
        desc: "Reels",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/instagram/user/highlights",
        desc: "Story Highlights",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/instagram/user/highlight/detail",
        desc: "Highlights Details",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/video/transcript",
        desc: "Transcript",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/user/live",
        desc: "TikTok Live",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/user/following",
        desc: "Following",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/user/followers",
        desc: "Followers",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/search/users",
        desc: "Search Users",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/songs/popular",
        desc: "Get popular songs",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/song",
        desc: "Get Song Details",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/instagram/post",
        desc: "Post/Reel Info",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/creators/popular",
        desc: "Get popular creators",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/hashtags/popular",
        desc: "Get popular hashtags",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/song/videos",
        desc: "TikToks using Song",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/get-trending-feed",
        desc: "Trending Feed",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/product",
        desc: "Product Details",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/shop/product/reviews",
        desc: "Product Reviews",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/instagram/profile",
        desc: "Instagram",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/instagram/basic-profile",
        desc: "Basic Profile",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/youtube/channel",
        desc: "YouTube",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/youtube/channel/shorts",
        desc: "Channel Shorts",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/youtube/video",
        desc: "Video/Short Details",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/youtube/search",
        desc: "Search",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/youtube/video/comments",
        desc: "Comments",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/youtube/shorts/trending",
        desc: "Trending Shorts",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/youtube/playlist",
        desc: "Playlist",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/youtube/community-post",
        desc: "Community Post Details",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/linkedin/profile",
        desc: "LinkedIn",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/linkedin/company",
        desc: "Company Page",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/linkedin/post",
        desc: "Post",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/profile",
        desc: "Facebook",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/profile/reels",
        desc: "Profile Reels",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/profile/photos",
        desc: "Profile Photos",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/profile/posts",
        desc: "Profile Posts",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/group/posts",
        desc: "Facebook Group Posts",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/post",
        desc: "Post",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/post/transcript",
        desc: "Transcript",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/post/comments",
        desc: "Comments",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/adLibrary/ad",
        desc: "Facebook Ad Library",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/adLibrary/company/ads",
        desc: "Company Ads",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/adLibrary/search/companies",
        desc: "Search for Companies",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/reddit/post/comments",
        desc: "Post Comments",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/google/ad",
        desc: "Ad Details",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/google/adLibrary/advertisers/search",
        desc: "Advertiser Search",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/linkedin/ads/search",
        desc: "LinkedIn Ad Library",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/linkedin/ad",
        desc: "Ad Details",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/twitter/profile",
        desc: "Twitter",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/twitter/user-tweets",
        desc: "User Tweets",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/twitter/tweet",
        desc: "Tweet Details",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/twitter/tweet/transcript",
        desc: "Transcript",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/twitter/community",
        desc: "Community",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/twitter/community/tweets",
        desc: "Community Tweets",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/reddit/subreddit/details",
        desc: "Reddit",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/reddit/subreddit",
        desc: "Subreddit Posts",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/google/search",
        desc: "Google",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/reddit/ads/search",
        desc: "Search Ads",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/truthsocial/profile",
        desc: "Truth Social",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/truthsocial/user/posts",
        desc: "User Posts",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/truthsocial/post",
        desc: "Post",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/threads/profile",
        desc: "Threads",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/threads/user/posts",
        desc: "Posts",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/threads/post",
        desc: "Post",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/threads/search/users",
        desc: "Search Users",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/bluesky/profile",
        desc: "Bluesky",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/bluesky/user/posts",
        desc: "Posts",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/bluesky/post",
        desc: "Post",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/pinterest/search",
        desc: "Search",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/pinterest/pin",
        desc: "Pin",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/pinterest/user/boards",
        desc: "User Boards",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/pinterest/board",
        desc: "Board",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/facebook/adLibrary/search/ads",
        desc: "Search",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/youtube/search/hashtag",
        desc: "Search by Hashtag",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/youtube/video/transcript",
        desc: "Transcript",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/twitch/profile",
        desc: "Twitch",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/search/hashtag",
        desc: "Search by Hashtag",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/instagram/song/reels",
        desc: "Reels using Song",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/snapchat/profile",
        desc: "Snapchat",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v3/tiktok/profile/videos",
        desc: "Profile Videos",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/shop/search",
        desc: "TikTok Shop",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/reddit/search",
        desc: "Search",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/linktree",
        desc: "Linktree",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/search/top",
        desc: "Top Search",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/kick/clip",
        desc: "Kick",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/linkbio",
        desc: "Linkbio",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/video/comments",
        desc: "Comments",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v2/tiktok/video",
        desc: "Video Info",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/instagram/user/embed",
        desc: "Embed HTML",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/reddit/subreddit/search",
        desc: "Subreddit Search",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/videos/popular",
        desc: "Get popular videos",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/twitch/clip",
        desc: "Clip",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/youtube/channel-videos",
        desc: "Channel Videos",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/google/company/ads",
        desc: "Company Ads",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v2/instagram/user/posts",
        desc: "Posts",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/shop/products",
        desc: "Shop Products",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /v1/tiktok/search/keyword",
        desc: "Search by Keyword",
        amount: "20000",
        unitType: "request",
      },
    ],
  },

  // ── Tako (Orthogonal) ──
  {
    id: "orth-tako",
    name: "Tako via Orthogonal",
    url: "https://trytako.com/api",
    serviceUrl: "https://mpp.orthogonal.com/tako",
    description:
      "Tako is a knowledge search engine that visualizes the world's data. Search with natural language to get interactive knowledge cards with charts, tables, and insights powered by sources like S&P Global, World Bank, and",
    categories: ["search", "data"],
    integration: "third-party",
    tags: ["knowledge", "search", "visualization"],
    docs: { homepage: "https://trytako.com" },
    provider: { name: "Tako", url: "https://trytako.com" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v1/beta/visualize",
        desc: "Turn your own data into interactive Tako Knowledge Card visualizations. Provide data as CSV strings and a natural",
        amount: "23000",
        unitType: "request",
      },
      {
        route: "POST /v1/thin_viz/create/",
        desc: "Create a custom embeddable knowledge card from your own data by specifying chart components directly. Returns card_id",
        amount: "23000",
        unitType: "request",
      },
      {
        route: "GET /v1/tako_tools_description",
        desc: "Get descriptions of Tako search tool capabilities and available data topics. Returns what types of data Tako can search",
        amount: "23000",
        unitType: "request",
      },
      {
        route: "GET /v1/beta/chart_insights",
        desc: "Analyze a Tako Knowledge Card and get AI-generated insights. Returns plain-text observations about trends, growth",
        amount: "23000",
        unitType: "request",
      },
      {
        route: "GET /v1/thin_viz/default_schema/",
        desc: "List all available chart/visualization templates that can be used with the Create Card endpoint. Returns schema names",
        amount: "23000",
        unitType: "request",
      },
      {
        route: "POST /v1/knowledge_search",
        desc: "Search for data visualizations using natural language. Ask any question about finance, economics, demographics, sports",
        amount: "23000",
        unitType: "request",
      },
    ],
  },

  // ── Andi Search API (Orthogonal) ──
  {
    id: "orth-andi",
    name: "Andi Search API",
    url: "https://search-api.andisearch.com/api",
    serviceUrl: "https://mpp.orthogonal.com/andi",
    description: "AI Search for the Next Generation",
    categories: ["search", "ai"],
    integration: "third-party",
    tags: ["ai-search", "answers"],
    docs: { homepage: "https://search-api.andisearch.com" },
    provider: {
      name: "Andi Search API",
      url: "https://search-api.andisearch.com",
    },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v1/search",
        desc: "Fast, high-quality search API with intelligent ranking, instant answers, and result enrichment.",
        amount: "10000",
        unitType: "request",
      },
    ],
  },

  // ── Voygr (Orthogonal) ──
  {
    id: "orth-voygr",
    name: "Voygr",
    url: "https://dev.voygr.tech",
    serviceUrl: "https://mpp.orthogonal.com/voygr",
    description:
      "Validate whether a business exists at a given address and check if it is currently open or closed.",
    categories: ["data"],
    integration: "third-party",
    tags: ["business-verification", "address"],
    docs: { homepage: "https://dev.voygr.tech" },
    provider: { name: "Voygr", url: "https://dev.voygr.tech" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v1/business-status",
        desc: "Check whether a business exists at the given address and whether it is open or closed. Returns existence_status",
        amount: "5000",
        unitType: "request",
      },
    ],
  },

  // ── Ocean.io (Orthogonal) ──
  {
    id: "orth-ocean-io",
    name: "Ocean.io",
    url: "https://api.ocean.io",
    serviceUrl: "https://mpp.orthogonal.com/ocean-io",
    description:
      "Ocean.io API for company and people search, enrichment, lookup, and discovery. Find lookalike companies, enrich contacts, reveal emails/phones, and more.",
    categories: ["data"],
    integration: "third-party",
    tags: ["company", "people", "search", "enrichment"],
    docs: { homepage: "https://api.ocean.io" },
    provider: { name: "Ocean.io", url: "https://api.ocean.io" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v3/search/companies",
        desc: "Search for companies using filters (industry, size, location, technologies, revenue, headcount growth, etc.) and/or",
        dynamic: true,
      },
      {
        route: "POST /v3/search/people",
        desc: "Search for people using filters (job title, seniority, department, skills, location) with optional company filters",
        dynamic: true,
      },
      {
        route: "POST /v2/lookup/people",
        desc: "Lookup and enrich multiple people by LinkedIn handle or Ocean.io ID (max 1000 total). Costs 0.05 credits per handle/ID",
        dynamic: true,
      },
      {
        route: "POST /v2/enrich/company",
        desc: "Match a company with Ocean.io database and enrich it with additional information (industry, size, revenue",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /v2/enrich/person",
        desc: "Match a person with Ocean.io database and enrich with additional information (job title, company, location, social",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /v2/lookup/companies",
        desc: "Lookup and enrich multiple companies by domain (max 1000). Domain redirections are handled automatically. Companies not",
        dynamic: true,
      },
    ],
  },

  // ── Tomba API (Orthogonal) ──
  {
    id: "orth-tomba",
    name: "Tomba API",
    url: "https://api.tomba.io",
    serviceUrl: "https://mpp.orthogonal.com/tomba",
    description: "Email finding and verification API",
    categories: ["data"],
    integration: "third-party",
    tags: ["email", "verification", "finder"],
    docs: { homepage: "https://api.tomba.io" },
    provider: { name: "Tomba API", url: "https://api.tomba.io" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v1/people/find",
        desc: "Get person information from an email address.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/combined/find",
        desc: "Get combined person and company information from an email.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/domain-suggestions",
        desc: "Get domain suggestions for a company name",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/email-count",
        desc: "Get the count of email addresses for a domain, broken down by department and seniority.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/author-finder",
        desc: "Find the email address of a blog post author from the article URL.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/linkedin",
        desc: "Find the email address from a LinkedIn profile URL.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/email-verifier",
        desc: "Verify the deliverability of an email address.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/technology",
        desc: "Discover technologies used by a website.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/companies/find",
        desc: "Get company information from a domain.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/location",
        desc: "Get employee location distribution for a domain.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/similar",
        desc: "Find domains similar to a given domain.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /v1/reveal/search",
        desc: "Search for companies using natural language queries or structured filters. AI assistant generates appropriate filters",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/email-sources",
        desc: "Find the sources where an email was found on the web.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/email-finder",
        desc: "Find the most likely email address from a domain name, first name, and last name.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/phone-finder",
        desc: "Find phone numbers associated with an email, domain, or LinkedIn profile.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/email-format",
        desc: "Get the email format patterns used by a domain (e.g. first.last, firstlast).",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/domain-status",
        desc: "Check the status and availability of a domain.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/enrich",
        desc: "Enrich an email address with person and company data (name, location, social handles).",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/phone-validator",
        desc: "Validate a phone number and get carrier information.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /v1/domain-search",
        desc: "Search emails based on a website domain. Returns all email addresses found on the internet for a given domain, with",
        amount: "10000",
        unitType: "request",
      },
    ],
  },

  // ── Crustdata (Orthogonal) ──
  {
    id: "orth-crustdata",
    name: "Crustdata",
    url: "https://api.crustdata.com",
    serviceUrl: "https://mpp.orthogonal.com/crustdata",
    description:
      "Comprehensive B2B data platform providing firmographic data, growth metrics, people profiles, and web intelligence for companies worldwide.",
    categories: ["data"],
    integration: "third-party",
    tags: ["firmographic", "b2b", "enrichment", "growth"],
    docs: { homepage: "https://api.crustdata.com" },
    provider: { name: "Crustdata", url: "https://api.crustdata.com" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /screener/identify/",
        desc: "Identify one or more companies in Crustdata's database by domain, name, LinkedIn URL, Crunchbase URL, or company ID",
        dynamic: true,
      },
      {
        route: "POST /screener/persondb/search",
        desc: "Search millions of professional profiles in Crustdata's database with advanced filtering. Supports nested AND/OR filter",
        dynamic: true,
      },
      {
        route: "POST /data_lab/gartner_reviews/Table/",
        desc: "Get Gartner Peer Insights review data for companies. Filter by review rating, company ID, and other metrics. Returns a",
        dynamic: true,
      },
      {
        route: "POST /data_lab/job_listings/Table/",
        desc: "Get job listings from Crustdata's database. Filter by company, date, location, and more. Returns a fields-and-rows",
        amount: "313000",
        unitType: "request",
      },
      {
        route: "GET /screener/company",
        desc: "Enrich one or more companies by domain, name, or Crustdata company ID. Returns comprehensive firmographic data",
        dynamic: true,
      },
      {
        route: "GET /screener/person/enrich",
        desc: "Enrich one or more individuals by LinkedIn URL or business email. Returns employment history, education, skills",
        amount: "1563000",
        unitType: "request",
      },
      {
        route: "POST /screener/companydb/search",
        desc: "Search millions of companies in Crustdata's database with advanced filtering. Supports nested AND/OR filter logic",
        dynamic: true,
      },
    ],
  },

  // ── AgentMail (Orthogonal) ──
  {
    id: "orth-agentmail",
    name: "AgentMail via Orthogonal",
    url: "https://api.agentmail.to",
    serviceUrl: "https://mpp.orthogonal.com/agentmail",
    description:
      "Programmatic email for AI agents. Create inboxes, send/receive emails, manage threads and drafts. Inboxes cost $2/month. Inboxes inactive for 30+ days are automatically deleted.",
    categories: ["ai", "social"],
    integration: "third-party",
    tags: ["email", "inboxes", "messaging", "agents"],
    docs: { homepage: "https://api.agentmail.to" },
    provider: { name: "AgentMail", url: "https://api.agentmail.to" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v0/inboxes",
        desc: "Create a new email inbox. Inboxes cost $2/month. Inboxes with no API activity for 30+ days are automatically deleted",
        amount: "2000000",
        unitType: "request",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/drafts",
        desc: "Create a new draft in an inbox. The draft can be edited later and sent with Send Draft.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/messages/send",
        desc: "Send an email message from an inbox. At least one recipient (to, cc, or bcc) is required. Returns the message_id and",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/messages/:message_id/reply-all",
        desc: "Reply to all recipients of a message. Includes all original To and CC recipients automatically.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/messages/:message_id/reply",
        desc: "Reply to a specific message. Automatically sets In-Reply-To and References headers for proper threading.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "POST /v0/inboxes/:inbox_id/messages/:message_id/forward",
        desc: "Forward a message to new recipients. Includes the original message content and any attachments.",
        amount: "10000",
        unitType: "request",
      },
    ],
  },

  // ── PredictLeads (Orthogonal) ──
  {
    id: "orth-predictleads",
    name: "PredictLeads",
    url: "https://predictleads.com/api",
    serviceUrl: "https://mpp.orthogonal.com/predictleads",
    description:
      "Company intelligence API providing job openings, news events, financing events, technology detections, connections, products, and more for any company.",
    categories: ["data"],
    integration: "third-party",
    tags: ["jobs", "news", "funding", "signals"],
    docs: { homepage: "https://predictleads.com" },
    provider: { name: "PredictLeads", url: "https://predictleads.com" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /v3/companies/:id_or_domain",
        desc: "Get company profile by ID or domain",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/companies/:company_id_or_domain/similar_companies",
        desc: "Find companies similar to a given company",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/job_openings/:id",
        desc: "Get a single job opening by ID",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/technologies",
        desc: "List all tracked technologies",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/news_events/:id",
        desc: "Get a single news event by ID",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/companies/:company_id_or_domain/products",
        desc: "Get products associated with a company",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/products/:id",
        desc: "Get a single product by ID",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/discover/companies",
        desc: "Search and filter companies",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/companies/:company_id_or_domain/github_repositories",
        desc: "Get GitHub repositories associated with a company",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/companies/:company_id_or_domain/website_evolution",
        desc: "Track website changes over time for a specific company",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/companies/:company_id_or_domain/technology_detections",
        desc: "Get technology stack detections for a specific company",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/discover/job_openings",
        desc: "Search and filter job openings across all companies",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/technologies/:id_or_fuzzy_name",
        desc: "Get a specific technology by ID or name",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/discover/financing_events",
        desc: "Search and filter financing events across all companies",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/discover/portfolio_companies/connections",
        desc: "Discover connections across portfolio companies",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/discover/products/latest",
        desc: "Discover the latest products across all companies",
        amount: "40000",
        unitType: "request",
      },
      {
        route:
          "GET /v3/discover/technologies/:technology_id_or_fuzzy_name/technology_detections",
        desc: "Find companies using a specific technology",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/discover/startup_platform_posts",
        desc: "Discover posts from startup platforms (Product Hunt, Hacker News, etc.)",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/companies/:company_id_or_domain/news_events",
        desc: "Get news events for a specific company",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/discover/news_events",
        desc: "Search and filter news events across all companies",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/companies/:company_id_or_domain/financing_events",
        desc: "Get financing/funding events for a specific company",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/companies/:company_id_or_domain/job_openings",
        desc: "Get job openings for a specific company",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /v3/companies/:company_id_or_domain/connections",
        desc: "Get business connections for a specific company",
        amount: "40000",
        unitType: "request",
      },
    ],
  },

  // ── Serper (Orthogonal) ──
  {
    id: "orth-serper",
    name: "Serper",
    url: "https://google.serper.dev",
    serviceUrl: "https://mpp.orthogonal.com/serper",
    description:
      "Google Search API by Serper - fast, reliable access to 12 Google search types: web search, images, videos, news, places, maps, shopping, scholar, patents, autocomplete, lens (reverse image search), and reviews. All",
    categories: ["search", "web"],
    integration: "third-party",
    tags: ["google", "serp", "search"],
    docs: { homepage: "https://google.serper.dev" },
    provider: { name: "Serper", url: "https://google.serper.dev" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /autocomplete",
        desc: "Google Autocomplete - returns search query suggestions based on a prefix. Use for keyword research, SEO, understanding",
        amount: "2000",
        unitType: "request",
      },
      {
        route: "POST /lens",
        desc: "Google Lens reverse image search - identify objects, find visually similar images, and get visual search results from",
        amount: "6000",
        unitType: "request",
      },
      {
        route: "POST /search",
        desc: "Google Search - returns organic results, knowledge graph, people also ask, related searches, and sitelinks. Use for",
        amount: "2000",
        unitType: "request",
      },
      {
        route: "POST /maps",
        desc: "Google Maps search - returns map listings with titles, addresses, latitude/longitude coordinates, ratings, review",
        amount: "6000",
        unitType: "request",
      },
      {
        route: "POST /images",
        desc: "Google Images search - returns image results with titles, image URLs, thumbnail URLs, source domains, and dimensions",
        amount: "2000",
        unitType: "request",
      },
      {
        route: "POST /reviews",
        desc: "Google Reviews - returns reviews for a specific business/place including review text, ratings, authors, dates, and",
        amount: "2000",
        unitType: "request",
      },
      {
        route: "POST /videos",
        desc: "Google Videos search - returns video results with titles, links, channels, durations, dates, and platforms (YouTube",
        amount: "2000",
        unitType: "request",
      },
      {
        route: "POST /shopping",
        desc: "Google Shopping search - returns product listings with titles, prices, sellers, ratings, delivery info, and product",
        amount: "4000",
        unitType: "request",
      },
      {
        route: "POST /news",
        desc: "Google News search - returns news articles with titles, links, sources, dates, and snippets. Use for current events",
        amount: "2000",
        unitType: "request",
      },
      {
        route: "POST /scholar",
        desc: "Google Scholar search - returns academic papers with titles, authors, publication venues, years, citation counts",
        amount: "2000",
        unitType: "request",
      },
      {
        route: "POST /places",
        desc: "Google Places search - returns local businesses with names, addresses, phone numbers, ratings, review counts, hours",
        amount: "2000",
        unitType: "request",
      },
      {
        route: "POST /patents",
        desc: "Google Patents search - returns patent results with titles, patent numbers, inventors, assignees, filing dates",
        amount: "2000",
        unitType: "request",
      },
    ],
  },

  // ── Aviato (Orthogonal) ──
  {
    id: "orth-aviato",
    name: "Aviato",
    url: "https://data.api.aviato.co",
    serviceUrl: "https://mpp.orthogonal.com/aviato",
    description:
      "Comprehensive company and person intelligence platform. Enrich companies and people, search with advanced DSL queries, get funding rounds, investments, employees, founders, contact info, LinkedIn social data, and market",
    categories: ["data"],
    integration: "third-party",
    tags: ["company", "people", "intelligence", "enrichment"],
    docs: { homepage: "https://data.api.aviato.co" },
    provider: { name: "Aviato", url: "https://data.api.aviato.co" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "GET /company/funding-rounds",
        desc: "Get funding rounds of the specified company.",
        amount: "80000",
        unitType: "request",
      },
      {
        route: "GET /company/investments",
        desc: "Get investments made into the specified company.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /company/employees",
        desc: "Get employees of the specified company.",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /company/investments/outbound",
        desc: "Get outbound investments that a company has made.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /geocoder/search",
        desc: "Search for a location and get geocoded matches. Use the geocoded ID with person/company search locationIDList filter.",
        amount: "10000",
        unitType: "request",
      },
      {
        route: "GET /company/funds",
        desc: "Get funds that a company has raised.",
        amount: "80000",
        unitType: "request",
      },
      {
        route: "POST /person/search",
        desc: "Search for people using Aviato DSL. Pass dsl object with filters, limit, and offset inside it.",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /person/simple/search",
        desc: "Simplified person search with pre-defined query parameters.",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /person/email",
        desc: "Get a person's email addresses.",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /person/vestings",
        desc: "Get vestings of a person.",
        amount: "160000",
        unitType: "request",
      },
      {
        route: "GET /person/investments/companies",
        desc: "Get companies that a person has invested in.",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /social/company/posts",
        desc: "Get posts from a company's LinkedIn page.",
        amount: "80000",
        unitType: "request",
      },
      {
        route: "GET /social/post/:postUrn/reactions",
        desc: "Get reactions for a LinkedIn post.",
        amount: "80000",
        unitType: "request",
      },
      {
        route: "GET /social/post/:postUrn/reshares",
        desc: "Get reshares for a LinkedIn post.",
        amount: "80000",
        unitType: "request",
      },
      {
        route: "GET /social/post/:postUrn/comments",
        desc: "Get comments for a LinkedIn post.",
        amount: "80000",
        unitType: "request",
      },
      {
        route: "GET /person/founded-companies",
        desc: "Get companies that a person has founded.",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /company/enrich",
        desc: "Get enriched details on a company. Pass any identifier (id, linkedinURL, website, etc.).",
        amount: "120000",
        unitType: "request",
      },
      {
        route: "GET /company/acquisitions",
        desc: "Get companies acquired by the specified company.",
        amount: "120000",
        unitType: "request",
      },
      {
        route: "GET /company/founders",
        desc: "Get founders of the specified company.",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "POST /company/search",
        desc: "Search for companies using Aviato DSL. Pass dsl object with filters, limit, and offset inside it.",
        amount: "20000",
        unitType: "request",
      },
      {
        route: "GET /social/person/posts",
        desc: "Get posts from a person's LinkedIn profile.",
        amount: "80000",
        unitType: "request",
      },
      {
        route: "GET /company/investments/funds",
        desc: "Get individual funds that a company has invested in (e.g. Sequoia's Growth Fund).",
        amount: "40000",
        unitType: "request",
      },
      {
        route: "GET /person/enrich",
        desc: "Get enriched details on a person. Pass any identifier.",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "POST /marketmap/generate",
        desc: "Start generating a market map to find similar companies. Supply name+website or an Aviato company ID.",
        amount: "200000",
        unitType: "request",
      },
      {
        route: "GET /person/investments/funds",
        desc: "Get funds that a person has invested in.",
        amount: "20000",
        unitType: "request",
      },
    ],
  },

  // ── AgentPhone (Orthogonal) ──
  {
    id: "orth-agentphone",
    name: "AgentPhone",
    url: "https://api.agentphone.ai",
    serviceUrl: "https://mpp.orthogonal.com/agentphone",
    description:
      "Give your AI agent a real US/Canada phone number. Make voice calls, send and receive SMS, and hold actual conversations — all via API. Note: Outbound SMS requires first-message compliance (brand name, opt-in",
    categories: ["social"],
    integration: "third-party",
    tags: ["phone", "voice", "sms", "calls"],
    docs: { homepage: "https://api.agentphone.ai" },
    provider: { name: "AgentPhone", url: "https://api.agentphone.ai" },
    realm: "mpp.orthogonal.com",
    intent: "charge",
    payments: [TEMPO_PAYMENT],
    endpoints: [
      {
        route: "POST /v0/agent/verify",
        desc: "Verify OTP code. Atomically creates account, provisions phone number, creates starter agent, returns API key. No auth",
        amount: "0",
        unitType: "request",
      },
      {
        route: "GET /v1/agents/:agentId",
        desc: "Get details for a specific agent.",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "PATCH /v1/agents/:agentId",
        desc: "Update agent fields. Only sent fields change.",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /v1/agents/:agentId/numbers",
        desc: "Attach a phone number to an agent.",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "DELETE /v1/agents/:agentId/numbers/:numberId",
        desc: "Detach a phone number from an agent.",
        amount: "0",
        unitType: "request",
      },
      {
        route: "GET /v1/agents/voices",
        desc: "List all available voices across providers (ElevenLabs, Cartesia, OpenAI, etc).",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /v1/numbers",
        desc: "Buy a US or CA phone number. $3/month per number.",
        amount: "3500000",
        unitType: "request",
      },
      {
        route: "DELETE /v1/numbers/:numberId",
        desc: "Release a phone number. Irreversible.",
        amount: "0",
        unitType: "request",
      },
      {
        route: "POST /v1/messages",
        desc: "Send an SMS from an agent's phone number. First message compliance: Your initial SMS to any new contact must include",
        amount: "30000",
        unitType: "request",
      },
      {
        route: "GET /v1/numbers/:numberId/messages",
        desc: "List messages for a phone number.",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "GET /v1/agents/:agentId/conversations",
        desc: "List SMS conversations for a specific agent.",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "GET /v1/conversations/:conversationId",
        desc: "Get a conversation with all messages.",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "GET /v1/agents/:agentId/calls",
        desc: "List calls for a specific agent.",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "GET /v1/agents/:agentId/webhook",
        desc: "Get webhook URL for a specific agent.",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /v1/agents/:agentId/webhook",
        desc: "Set webhook URL for a specific agent.",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /v1/agents",
        desc: "Create a new agent with name, voice, system prompt, and voice mode.",
        amount: "5000",
        unitType: "request",
      },
      {
        route: "POST /v1/calls",
        desc: "Make an outbound voice call. Include systemPrompt for autonomous AI conversation, omit for webhook-driven mode.",
        amount: "100000",
        unitType: "request",
      },
      {
        route: "DELETE /v1/agents/:agentId",
        desc: "Permanently delete an agent. Cannot be undone.",
        amount: "0",
        unitType: "request",
      },
      {
        route: "POST /v0/agent/sign-up",
        desc: "Start agent signup. Sends a 6-digit OTP to the human's email. Returns a verification_id. No auth required.",
        amount: "0",
        unitType: "request",
      },
      {
        route: "GET /v1/calls/:callId",
        desc: "Get call details and transcript. Poll until status is completed or failed.",
        amount: "5000",
        unitType: "request",
      },
    ],
  },
];
