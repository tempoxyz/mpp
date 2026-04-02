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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
    docsBase: "https://context7.com/websites/codex_io/llms.txt",
    endpoints: [
      {
        route: "POST /graphql",
        desc: "GraphQL query (token data, trades, liquidity, NFTs, wallets)",
        amount: "1000",
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    intent: "session",
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: STRIPE_PAYMENT,
    endpoints: [
      {
        route: "GET /buy/:slug",
        desc: "Purchase a sandwich",
        dynamic: true,
        amountHint: "Varies",
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: STRIPE_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: TEMPO_PAYMENT,
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
    payment: STRIPE_PAYMENT,
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
    payment: TEMPO_PAYMENT,
    endpoints: [
      {
        route: "POST /api/send",
        desc: "Write and send an agent-penned postcard",
        dynamic: true,
        amountHint: "$1 digital, $3 physical",
      },
    ],
  },
];
