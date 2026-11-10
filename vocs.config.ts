import ruby from "shiki/langs/ruby.mjs";
import { defineConfig, McpSource } from "vocs/config";
import { loadBlogPosts } from "./scripts/blog";
import { transformMarkdownOutput } from "./scripts/markdown-output.ts";
import remarkMppMarkdown from "./scripts/remark-mpp-markdown.ts";
import { shikiStyleToClass } from "./src/shiki-style-to-class.js";

const baseUrl = (() => {
  if (process.env.VERCEL_ENV === "production")
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.NODE_ENV !== "production") return "https://localhost:5173";
  return "";
})();

export default defineConfig({
  accentColor: "#ffffff",
  colorScheme: "dark",
  baseUrl,
  head: (path) => {
    if (path === "/")
      return {
        link: [
          {
            as: "image",
            fetchpriority: "high",
            href: "/marketing/mpp-hero-poster.jpg",
            rel: "preload",
          },
        ],
      };
    if (path === "/services" || path.startsWith("/services/"))
      return {
        link: [
          {
            as: "font",
            crossorigin: "anonymous",
            href: "https://wgfdjv2jfqz2dlpx.public.blob.vercel-storage.com/fonts/VTCDuBois-Regular.woff2",
            rel: "preload",
            type: "font/woff2",
          },
          {
            as: "font",
            crossorigin: "anonymous",
            href: "https://wgfdjv2jfqz2dlpx.public.blob.vercel-storage.com/fonts/VTCDuBois-Bold.woff2",
            rel: "preload",
            type: "font/woff2",
          },
        ],
      };
    return undefined;
  },
  markdown: {
    output: { validation: "fail", transform: transformMarkdownOutput },
    outputRemarkPlugins: [
      // Production bundles may omit source MDX after Markdown artifacts exist.
      // Builds still fail on missing or invalid posts; only runtime config load
      // can safely use an empty catalog.
      [
        remarkMppMarkdown,
        { blogPosts: loadBlogPosts({ missingDirectory: "empty" }) },
      ],
    ],
  },
  redirects: [
    { source: "/index", destination: "/" },

    // Aliases for overview
    { source: "/docs", destination: "/overview", status: 308 },
    { source: "/documentation", destination: "/overview" },
    { source: "/about", destination: "/overview" },

    // Spec redirects
    {
      source: "/specifications",
      destination: "https://paymentauth.org",
    },
    { source: "/specs", destination: "https://paymentauth.org" },
    { source: "/spec", destination: "https://paymentauth.org" },
    { source: "/specification", destination: "https://paymentauth.org" },

    // Quickstart aliases
    { source: "/get-started", destination: "/quickstart" },
    { source: "/getting-started", destination: "/quickstart" },
    { source: "/start", destination: "/quickstart" },
    { source: "/quick-start", destination: "/quickstart" },
    { source: "/install", destination: "/quickstart" },
    { source: "/installation", destination: "/quickstart" },
    { source: "/guide", destination: "/quickstart" },
    { source: "/tutorial", destination: "/quickstart" },

    // Deleted guide pages
    {
      source: "/guides/building-with-ai",
      destination: "/guides/building-with-an-llm",
    },
    {
      source: "/guides/mpp-with-stripe",
      destination: "/payment-methods/stripe",
    },

    // Pages merged into their parent page
    {
      source: "/payment-methods/evm/charge",
      destination: "/payment-methods/evm#charge",
      status: 308,
    },
    {
      source: "/payment-methods/card/charge",
      destination: "/payment-methods/card#charge",
      status: 308,
    },
    {
      source: "/payment-methods/stripe/charge",
      destination: "/payment-methods/stripe#charge",
      status: 308,
    },
    {
      source: "/payment-methods/lightning/charge",
      destination: "/payment-methods/lightning#charge",
      status: 308,
    },
    {
      source: "/payment-methods/lightning/session",
      destination: "/payment-methods/lightning#session",
      status: 308,
    },
    {
      source: "/payment-methods/solana/charge",
      destination: "/payment-methods/solana#charge",
      status: 308,
    },
    {
      source: "/payment-methods/solana/session",
      destination: "/payment-methods/solana#session",
      status: 308,
    },
    {
      source: "/payment-methods/xrpl/charge",
      destination: "/payment-methods/xrpl#charge",
      status: 308,
    },
    {
      source: "/payment-methods/xrpl/session",
      destination: "/payment-methods/xrpl#session",
      status: 308,
    },
    {
      source: "/payment-methods/stellar/charge",
      destination: "/payment-methods/stellar#charge",
      status: 308,
    },
    {
      source: "/payment-methods/stellar/session",
      destination: "/payment-methods/stellar#session",
      status: 308,
    },
    {
      source: "/payment-methods/monad/charge",
      destination: "/payment-methods/monad#charge",
      status: 308,
    },
    {
      source: "/payment-methods/nearintents/charge",
      destination: "/payment-methods/nearintents#charge",
      status: 308,
    },
    {
      source: "/payment-methods/redotpay/charge",
      destination: "/payment-methods/redotpay#charge",
      status: 308,
    },
    {
      source: "/guides/pay-as-you-go",
      destination: "/guides/usage-based#per-request",
      status: 308,
    },
    {
      source: "/guides/streamed-payments",
      destination: "/guides/usage-based#streaming",
      status: 308,
    },
    {
      source: "/protocol/transports/http",
      destination: "/protocol/transports#http",
      status: 308,
    },
    {
      source: "/protocol/transports/mcp",
      destination: "/protocol/transports#mcp-and-json-rpc",
      status: 308,
    },
    {
      source: "/protocol/transports/websocket",
      destination: "/protocol/transports#websocket",
      status: 308,
    },
    {
      source: "/extensions/identity/email-otp",
      destination: "/extensions/identity#email-otp",
      status: 308,
    },
    {
      source: "/extensions/identity/agent-signatures",
      destination: "/extensions/identity#agent-signatures",
      status: 308,
    },
    {
      source: "/extensions/identity/custom",
      destination: "/extensions/identity#your-own-identity-provider",
      status: 308,
    },
    {
      source: "/extensions/identity/payer",
      destination: "/extensions/identity#payer-identity",
      status: 308,
    },
    {
      source: "/sdk/python/core",
      destination: "/sdk/python#core-types",
      status: 308,
    },
    {
      source: "/sdk/python/client",
      destination: "/sdk/python#client",
      status: 308,
    },
    {
      source: "/sdk/python/server",
      destination: "/sdk/python#server",
      status: 308,
    },
    {
      source: "/sdk/rust/core",
      destination: "/sdk/rust#core-types",
      status: 308,
    },
    {
      source: "/sdk/rust/client",
      destination: "/sdk/rust#client",
      status: 308,
    },
    {
      source: "/sdk/rust/server",
      destination: "/sdk/rust#server",
      status: 308,
    },
    {
      source: "/sdk/go/core",
      destination: "/sdk/go#core-types",
      status: 308,
    },
    {
      source: "/sdk/go/client",
      destination: "/sdk/go#client",
      status: 308,
    },
    {
      source: "/sdk/go/server",
      destination: "/sdk/go#server",
      status: 308,
    },
    {
      source: "/sdk/ruby/core",
      destination: "/sdk/ruby#core-types",
      status: 308,
    },
    {
      source: "/sdk/ruby/client",
      destination: "/sdk/ruby#client",
      status: 308,
    },
    {
      source: "/sdk/ruby/server",
      destination: "/sdk/ruby#server",
      status: 308,
    },

    // Protocol concept shortcuts
    { source: "/402", destination: "/protocol/http-402" },
    {
      source: "/x402",
      destination: "/guides/use-mpp-with-x402#run-x402-inline-with-mppx",
    },
    {
      source: "/guides/upgrade-x402",
      destination: "/guides/use-mpp-with-x402",
      status: 308,
    },
    { source: "/challenges", destination: "/protocol/challenges" },
    { source: "/challenge", destination: "/protocol/challenges" },
    { source: "/credentials", destination: "/protocol/credentials" },
    { source: "/credential", destination: "/protocol/credentials" },
    { source: "/receipts", destination: "/protocol/receipts" },
    { source: "/receipt", destination: "/protocol/receipts" },
    { source: "/transports", destination: "/protocol/transports" },
    { source: "/transport", destination: "/protocol/transports" },
    { source: "/mcp", destination: "/protocol/transports#mcp-and-json-rpc" },

    // SDK shortcuts
    { source: "/typescript", destination: "/sdk/typescript" },
    { source: "/python", destination: "/sdk/python" },
    { source: "/rust", destination: "/sdk/rust" },
    { source: "/reference", destination: "/sdk" },
    { source: "/api", destination: "/sdk" },
    {
      source: "/sdk/typescript/tempo.mach",
      destination: "/sdk/typescript/tempo.machineTokenDeployments",
    },

    // SDK repo shortcuts
    { source: "/mppx", destination: "https://github.com/wevm/mppx" },
    { source: "/pympp", destination: "https://github.com/tempoxyz/pympp" },
    {
      source: "/mpp-rs",
      destination: "https://github.com/tempoxyz/mpp-rs",
    },

    // Payment methods aliases
    { source: "/methods", destination: "/payment-methods" },
    { source: "/payment-method", destination: "/payment-methods" },
    { source: "/intent", destination: "/intents" },

    // Stream → session renames
    {
      source: "/payment-methods/tempo/stream",
      destination: "/payment-methods/tempo/session",
    },
    {
      source: "/sdk/typescript/client/Method.tempo.stream",
      destination: "/sdk/typescript/client/Method.tempo.session",
    },
    {
      source: "/sdk/typescript/server/Method.tempo.stream",
      destination: "/sdk/typescript/server/Method.tempo.session",
    },

    // Old TS SDK pages moved from /sdk/typescript/ to /sdk/typescript/core/
    {
      source: "/sdk/typescript/BodyDigest.compute",
      destination: "/sdk/typescript/core/BodyDigest.compute",
    },
    {
      source: "/sdk/typescript/BodyDigest.verify",
      destination: "/sdk/typescript/core/BodyDigest.verify",
    },
    {
      source: "/sdk/typescript/Challenge.deserialize",
      destination: "/sdk/typescript/core/Challenge.deserialize",
    },
    {
      source: "/sdk/typescript/Challenge.from",
      destination: "/sdk/typescript/core/Challenge.from",
    },
    {
      source: "/sdk/typescript/Challenge.fromHeaders",
      destination: "/sdk/typescript/core/Challenge.fromHeaders",
    },
    {
      source: "/sdk/typescript/Challenge.fromResponse",
      destination: "/sdk/typescript/core/Challenge.fromResponse",
    },
    {
      source: "/sdk/typescript/Challenge.fromResponseList",
      destination: "/sdk/typescript/core/Challenge.fromResponseList",
    },
    {
      source: "/sdk/typescript/Challenge.serialize",
      destination: "/sdk/typescript/core/Challenge.serialize",
    },
    {
      source: "/sdk/typescript/Challenge.verify",
      destination: "/sdk/typescript/core/Challenge.verify",
    },
    {
      source: "/sdk/typescript/Credential.deserialize",
      destination: "/sdk/typescript/core/Credential.deserialize",
    },
    {
      source: "/sdk/typescript/Credential.from",
      destination: "/sdk/typescript/core/Credential.from",
    },
    {
      source: "/sdk/typescript/Credential.fromRequest",
      destination: "/sdk/typescript/core/Credential.fromRequest",
    },
    {
      source: "/sdk/typescript/Credential.serialize",
      destination: "/sdk/typescript/core/Credential.serialize",
    },
    {
      source: "/sdk/typescript/Expires",
      destination: "/sdk/typescript/core/Expires",
    },
    {
      source: "/sdk/typescript/Method.toClient",
      destination: "/sdk/typescript/core/Method.toClient",
    },
    {
      source: "/sdk/typescript/Method.toServer",
      destination: "/sdk/typescript/core/Method.toServer",
    },
    {
      source: "/sdk/typescript/PaymentRequest.deserialize",
      destination: "/sdk/typescript/core/PaymentRequest.deserialize",
    },
    {
      source: "/sdk/typescript/PaymentRequest.from",
      destination: "/sdk/typescript/core/PaymentRequest.from",
    },
    {
      source: "/sdk/typescript/PaymentRequest.serialize",
      destination: "/sdk/typescript/core/PaymentRequest.serialize",
    },
    {
      source: "/sdk/typescript/Receipt.deserialize",
      destination: "/sdk/typescript/core/Receipt.deserialize",
    },
    {
      source: "/sdk/typescript/Receipt.from",
      destination: "/sdk/typescript/core/Receipt.from",
    },
    {
      source: "/sdk/typescript/Receipt.fromResponse",
      destination: "/sdk/typescript/core/Receipt.fromResponse",
    },
    {
      source: "/sdk/typescript/Receipt.serialize",
      destination: "/sdk/typescript/core/Receipt.serialize",
    },
    {
      source: "/sdk/typescript/installation",
      destination: "/sdk/typescript",
    },

    // Old server page
    {
      source: "/sdk/typescript/server/Request.fromNodeListener",
      destination: "/sdk/typescript/server/Request.toNodeListener",
    },

    // Extensions aliases
    {
      source: "/authentication",
      destination: "/extensions/identity",
    },
    {
      source: "/advanced/authentication",
      destination: "/extensions/identity",
    },
    { source: "/identity", destination: "/extensions/identity" },
    {
      source: "/protocol/discovery",
      destination: "/extensions/discovery",
      status: 308,
    },
    { source: "/refunds", destination: "/extensions/refunds" },
    {
      source: "/advanced/discovery",
      destination: "/extensions/discovery",
      status: 308,
    },
    {
      source: "/advanced/identity",
      destination: "/extensions/identity",
      status: 308,
    },
    {
      source: "/advanced/payment-hooks",
      destination: "/extensions/payment-hooks",
      status: 308,
    },
    {
      source: "/advanced/refunds",
      destination: "/extensions/refunds",
      status: 308,
    },
    {
      source: "/advanced/relays",
      destination: "/extensions/relays",
      status: 308,
    },

    // Third-party extensions aliases
    { source: "/awesome", destination: "/extensions/third-party" },
    { source: "/community", destination: "/extensions/third-party" },
    { source: "/ecosystem", destination: "/extensions/third-party" },

    // Services aliases
    { source: "/service", destination: "/services" },
    { source: "/marketplace", destination: "/services" },
    { source: "/directory", destination: "/services" },
  ],
  description:
    "MPP (Machine Payments Protocol) is the open standard for machine-to-machine payments via HTTP 402, co-authored by Tempo and Stripe.",
  checkDeadlinks: true,
  editLink: {
    link: "https://github.com/tempoxyz/mpp/edit/main/src/pages/:path",
    text: "Suggest changes to this page",
  },
  iconUrl: "/favicon.svg",
  groupIcons: {
    customIcons: {
      amp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="currentColor"><path d="M13.9197 13.61L17.3816 26.566L14.242 27.4049L11.2645 16.2643L0.119926 13.2906L0.957817 10.15L13.9197 13.61Z"/><path d="M13.7391 16.0892L4.88169 24.9056L2.58872 22.6019L11.4461 13.7865L13.7391 16.0892Z"/><path d="M18.9386 8.58315L22.4005 21.5392L19.2609 22.3781L16.2833 11.2374L5.13879 8.26381L5.97668 5.12318L18.9386 8.58315Z"/><path d="M23.9803 3.55632L27.4422 16.5124L24.3025 17.3512L21.325 6.21062L10.1805 3.23698L11.0183 0.0963593L23.9803 3.55632Z"/></svg>',
    },
  },
  logoUrl: {
    light: "/marketing/mpp-logo.svg",
    dark: "/marketing/mpp-logo.svg",
  },
  mcp: {
    enabled: true,
    sources: [
      McpSource.github({ name: "mppx", repo: "wevm/mppx" }),
      McpSource.github({ name: "mpp-rs", repo: "tempoxyz/mpp-rs" }),
      McpSource.github({ name: "pympp", repo: "tempoxyz/pympp" }),
      McpSource.github({
        name: "mpp-specs",
        repo: "tempoxyz/mpp-specs",
      }),
      McpSource.github({ name: "tempo", repo: "tempoxyz/tempo" }),
    ],
  },
  ogImageUrl: (path, { baseUrl: base } = { baseUrl: "" }) =>
    path === "/"
      ? `${base}/og.png`
      : `${base}/api/og?title=%title&description=%description&path=${encodeURIComponent(path)}`,
  sidebar: {
    "/": [
      {
        text: "Get started",
        items: [
          { text: "Overview", link: "/overview" },
          {
            text: "Quickstart",
            link: "/quickstart",
            items: [
              { text: "Add payments to your API", link: "/quickstart/server" },
              { text: "Use with agents", link: "/quickstart/agent" },
              { text: "Use with your app", link: "/quickstart/client" },
            ],
          },
          { text: "Build with an LLM", link: "/guides/building-with-an-llm" },
          { text: "Security best practices", link: "/advanced/security" },
        ],
      },
      {
        text: "For sellers",
        items: [
          { text: "One-time", link: "/guides/one-time-payments" },
          { text: "Usage-based", link: "/guides/usage-based" },
          { text: "Subscriptions", link: "/guides/subscription-payments" },
          { text: "Cards", link: "/guides/accept-card-payments" },
          { text: "Splits", link: "/guides/split-payments" },
          {
            text: "Multiple methods",
            link: "/guides/multiple-payment-methods",
          },
          { text: "Payment links", link: "/guides/payment-links" },
          {
            text: "Proxy an existing service",
            link: "/guides/proxy-existing-service",
          },
          { text: "MCP servers", link: "/guides/monetize-mcp-server" },
          { text: "WebMCP tools", link: "/guides/webmcp-payments" },
          { text: "x402", link: "/guides/use-mpp-with-x402" },
        ],
      },
      {
        text: "For buyers",
        items: [
          {
            text: "Agents",
            items: [
              { text: "Manage spend", link: "/guides/managing-agent-spend" },
              {
                text: "Agent SDKs",
                items: [
                  {
                    text: "Cloudflare Agents",
                    link: "/partner-integrations/cloudflare-agents",
                  },
                  { text: "MCP SDK", link: "/partner-integrations/mcp-sdk" },
                  { text: "OpenClaw", link: "/partner-integrations/openclaw" },
                  {
                    text: "Vercel AI SDK",
                    link: "/partner-integrations/vercel-ai-sdk",
                  },
                ],
              },
            ],
          },
          { text: "Wallets", link: "/tools/wallet" },
        ],
      },
      {
        text: "Concepts",
        items: [
          {
            text: "Protocol",
            link: "/protocol",
            collapsed: false,
            items: [
              { text: "HTTP 402", link: "/protocol/http-402" },
              { text: "Challenges", link: "/protocol/challenges" },
              { text: "Credentials", link: "/protocol/credentials" },
              { text: "Receipts", link: "/protocol/receipts" },
              { text: "Transports", link: "/protocol/transports" },
            ],
          },
          {
            text: "Intents",
            link: "/intents",
            collapsed: false,
            items: [
              { text: "Charge", link: "/intents/charge" },
              { text: "Session", link: "/intents/session" },
              { text: "Subscription", link: "/intents/subscription" },
            ],
          },
          {
            text: "Extensions",
            link: "/extensions",
            collapsed: false,
            items: [
              { text: "Discovery", link: "/extensions/discovery" },
              { text: "Identity", link: "/extensions/identity" },
              { text: "Payment hooks", link: "/extensions/payment-hooks" },
              { text: "Refunds", link: "/extensions/refunds" },
              { text: "Relays", link: "/extensions/relays" },
              {
                text: "Third-party extensions",
                link: "/extensions/third-party",
              },
            ],
          },
        ],
      },
      {
        text: "Payment methods",
        items: [
          { text: "Overview", link: "/payment-methods" },
          {
            text: "Tempo",
            link: "/payment-methods/tempo",
            collapsed: true,
            items: [
              { text: "Charge", link: "/payment-methods/tempo/charge" },
              { text: "Session", link: "/payment-methods/tempo/session" },
              {
                text: "Subscription",
                link: "/payment-methods/tempo/subscription",
              },
              { text: "Private payments", link: "/guides/private-payments" },
            ],
          },
          { text: "EVM", link: "/payment-methods/evm" },
          { text: "Stripe", link: "/payment-methods/stripe" },
          { text: "Card", link: "/payment-methods/card" },
          { text: "Lightning", link: "/payment-methods/lightning" },
          { text: "Solana", link: "/payment-methods/solana" },
          { text: "XRPL", link: "/payment-methods/xrpl" },
          { text: "Stellar", link: "/payment-methods/stellar" },
          { text: "Monad", link: "/payment-methods/monad" },
          { text: "NEAR Intents", link: "/payment-methods/nearintents" },
          { text: "RedotPay", link: "/payment-methods/redotpay" },
          { text: "Custom", link: "/payment-methods/custom" },
        ],
      },
    ],
    "/sdk": [
      { text: "Overview", link: "/sdk" },
      { text: "SDK features", link: "/sdk/features" },
      {
        text: "TypeScript",
        items: [
          { text: "Getting started", link: "/sdk/typescript" },
          {
            text: "Client reference",
            items: [
              {
                text: "Methods",
                collapsed: true,
                items: [
                  {
                    text: "evm",
                    link: "/sdk/typescript/client/Method.evm",
                  },
                  {
                    text: "evm.charge",
                    link: "/sdk/typescript/client/Method.evm.charge",
                  },
                  {
                    text: "tempo",
                    link: "/sdk/typescript/client/Method.tempo",
                  },
                  {
                    text: "tempo.charge",
                    link: "/sdk/typescript/client/Method.tempo.charge",
                  },
                  {
                    text: "tempo.session",
                    link: "/sdk/typescript/client/Method.tempo.session",
                  },
                  {
                    text: "tempo.session (manager)",
                    link: "/sdk/typescript/client/Method.tempo.session-manager",
                  },
                  {
                    text: "tempo.subscription",
                    link: "/sdk/typescript/client/Method.tempo.subscription",
                  },
                  {
                    text: "stripe",
                    link: "/sdk/typescript/client/Method.stripe",
                  },
                  {
                    text: "stripe.charge",
                    link: "/sdk/typescript/client/Method.stripe.charge",
                  },
                ],
              },
              {
                text: "Mppx",
                collapsed: true,
                items: [
                  {
                    text: ".create",
                    link: "/sdk/typescript/client/Mppx.create",
                  },
                  {
                    text: ".preparePayment",
                    link: "/sdk/typescript/client/Mppx.preparePayment",
                  },
                  {
                    text: ".restore",
                    link: "/sdk/typescript/client/Mppx.restore",
                  },
                ],
              },
              {
                text: "Fetch",
                collapsed: true,
                items: [
                  {
                    text: ".from",
                    link: "/sdk/typescript/client/Fetch.from",
                  },
                  {
                    text: ".polyfill",
                    link: "/sdk/typescript/client/Fetch.polyfill",
                  },
                  {
                    text: ".restore",
                    link: "/sdk/typescript/client/Fetch.restore",
                  },
                ],
              },
              {
                text: "Transport",
                collapsed: true,
                items: [
                  {
                    text: ".from",
                    link: "/sdk/typescript/client/Transport.from",
                  },
                  {
                    text: ".http",
                    link: "/sdk/typescript/client/Transport.http",
                  },
                  {
                    text: ".mcp",
                    link: "/sdk/typescript/client/Transport.mcp",
                  },
                ],
              },
              {
                text: "MCP",
                collapsed: true,
                items: [
                  {
                    text: "McpClient.wrap",
                    link: "/sdk/typescript/client/McpClient.wrap",
                  },
                ],
              },
            ],
          },
          {
            text: "Server reference",
            items: [
              {
                text: "Methods",
                collapsed: true,
                items: [
                  {
                    text: "evm",
                    link: "/sdk/typescript/server/Method.evm",
                  },
                  {
                    text: "evm.charge",
                    link: "/sdk/typescript/server/Method.evm.charge",
                  },
                  {
                    text: "tempo",
                    link: "/sdk/typescript/server/Method.tempo",
                  },
                  {
                    text: "tempo.charge",
                    link: "/sdk/typescript/server/Method.tempo.charge",
                  },
                  {
                    text: "tempo.session",
                    link: "/sdk/typescript/server/Method.tempo.session",
                  },
                  {
                    text: "tempo.session (Cloudflare)",
                    link: "/sdk/typescript/cloudflare",
                  },
                  {
                    text: "tempo.session (WebSocket)",
                    link: "/sdk/typescript/server/Ws.serve",
                  },
                  {
                    text: "tempo.subscription",
                    link: "/sdk/typescript/server/Method.tempo.subscription",
                  },
                  {
                    text: "tempo.renewSubscription",
                    link: "/sdk/typescript/server/Method.tempo.renewSubscription",
                  },
                  {
                    text: "stripe",
                    link: "/sdk/typescript/server/Method.stripe",
                  },
                  {
                    text: "stripe.charge",
                    link: "/sdk/typescript/server/Method.stripe.charge",
                  },
                  {
                    text: "stripe.create",
                    link: "/sdk/typescript/server/Method.stripe.create",
                  },
                  {
                    text: "stripe.findOrCreateDepositAddress",
                    link: "/sdk/typescript/server/Method.stripe.findOrCreateDepositAddress",
                  },
                  {
                    text: "stripe.recordPayment",
                    link: "/sdk/typescript/server/Method.stripe.recordPayment",
                  },
                  {
                    text: "stripe.spt",
                    link: "/sdk/typescript/server/Method.stripe.spt",
                  },
                ],
              },
              {
                text: "Mppx",
                collapsed: true,
                items: [
                  {
                    text: ".broadcastCredential",
                    link: "/sdk/typescript/server/Mppx.broadcastCredential",
                  },
                  {
                    text: ".compose",
                    link: "/sdk/typescript/server/Mppx.compose",
                  },
                  {
                    text: ".create",
                    link: "/sdk/typescript/server/Mppx.create",
                  },
                  {
                    text: ".toNodeListener",
                    link: "/sdk/typescript/server/Mppx.toNodeListener",
                  },
                  {
                    text: ".validateCredential",
                    link: "/sdk/typescript/server/Mppx.validateCredential",
                  },
                  {
                    text: ".verifyCredential",
                    link: "/sdk/typescript/server/Mppx.verifyCredential",
                  },
                ],
              },
              {
                text: "Transport",
                collapsed: true,
                items: [
                  {
                    text: ".from",
                    link: "/sdk/typescript/server/Transport.from",
                  },
                  {
                    text: ".http",
                    link: "/sdk/typescript/server/Transport.http",
                  },
                  {
                    text: ".mcp",
                    link: "/sdk/typescript/server/Transport.mcp",
                  },
                  {
                    text: ".mcpSdk",
                    link: "/sdk/typescript/server/Transport.mcpSdk",
                  },
                ],
              },
              {
                text: "Utilities",
                collapsed: true,
                items: [
                  {
                    text: "Request.toNodeListener",
                    link: "/sdk/typescript/server/Request.toNodeListener",
                  },
                  {
                    text: "Response.requirePayment",
                    link: "/sdk/typescript/server/Response.requirePayment",
                  },
                  {
                    text: "tempo.Attribution",
                    link: "/sdk/typescript/tempo.Attribution",
                  },
                  {
                    text: "tempo.machineTokenDeployments",
                    link: "/sdk/typescript/tempo.machineTokenDeployments",
                  },
                ],
              },
            ],
          },
          {
            text: "Middleware reference",
            items: [
              {
                text: "Elysia",
                link: "/sdk/typescript/middlewares/elysia",
              },
              {
                text: "Express",
                link: "/sdk/typescript/middlewares/express",
              },
              {
                text: "Hono",
                link: "/sdk/typescript/middlewares/hono",
              },
              {
                text: "Next.js",
                link: "/sdk/typescript/middlewares/nextjs",
              },
            ],
          },
          {
            text: "x402 compatibility",
            items: [
              {
                text: "Express",
                link: "/sdk/typescript/x402/express",
              },
              {
                text: "Hono",
                link: "/sdk/typescript/x402/hono",
              },
              {
                text: "MCP",
                link: "/sdk/typescript/x402/mcp",
              },
              {
                text: "Next.js",
                link: "/sdk/typescript/x402/next",
              },
            ],
          },
          {
            text: "Identity",
            collapsed: true,
            items: [
              {
                text: "Attestation",
                collapsed: true,
                items: [
                  {
                    text: ".Client.prover",
                    link: "/sdk/typescript/client/Attestation.prover",
                  },
                  {
                    text: ".Constants",
                    link: "/sdk/typescript/core/Attestation.Constants",
                  },
                  {
                    text: ".Jwks.resolver",
                    link: "/sdk/typescript/core/Attestation.Jwks.resolver",
                  },
                  {
                    text: ".Server.verifier",
                    link: "/sdk/typescript/server/Attestation.verifier",
                  },
                  {
                    text: ".decode",
                    link: "/sdk/typescript/core/Attestation.decode",
                  },
                  {
                    text: ".sign",
                    link: "/sdk/typescript/core/Attestation.sign",
                  },
                  {
                    text: ".verify",
                    link: "/sdk/typescript/core/Attestation.verify",
                  },
                ],
              },
              {
                text: "EmailOtp",
                collapsed: true,
                items: [
                  {
                    text: ".Client.EmailOtpError",
                    link: "/sdk/typescript/client/EmailOtp.EmailOtpError",
                  },
                  {
                    text: ".Client.prover",
                    link: "/sdk/typescript/client/EmailOtp.prover",
                  },
                  {
                    text: ".Client.sendCode",
                    link: "/sdk/typescript/client/EmailOtp.sendCode",
                  },
                  {
                    text: ".Client.verifyCode",
                    link: "/sdk/typescript/client/EmailOtp.verifyCode",
                  },
                  {
                    text: ".Constants",
                    link: "/sdk/typescript/core/EmailOtp.Constants",
                  },
                  {
                    text: ".Server.verifier",
                    link: "/sdk/typescript/server/EmailOtp.verifier",
                  },
                ],
              },
              {
                text: "Identity",
                collapsed: true,
                items: [
                  {
                    text: ".Headers",
                    link: "/sdk/typescript/core/Identity.Headers",
                  },
                  {
                    text: ".Rejection",
                    link: "/sdk/typescript/core/Identity.Rejection",
                  },
                  {
                    text: ".Status",
                    link: "/sdk/typescript/core/Identity.Status",
                  },
                  {
                    text: ".anyOf",
                    link: "/sdk/typescript/core/Identity.anyOf",
                  },
                  {
                    text: ".from",
                    link: "/sdk/typescript/core/Identity.from",
                  },
                ],
              },
            ],
          },
          {
            text: "Proxy",
            link: "/sdk/typescript/proxy",
          },
          {
            text: "Core reference",
            items: [
              {
                text: "BodyDigest",
                collapsed: true,
                items: [
                  {
                    text: ".compute",
                    link: "/sdk/typescript/core/BodyDigest.compute",
                  },
                  {
                    text: ".verify",
                    link: "/sdk/typescript/core/BodyDigest.verify",
                  },
                ],
              },
              {
                text: "Challenge",
                collapsed: true,
                items: [
                  {
                    text: ".credentialHeader",
                    link: "/sdk/typescript/core/Challenge.credentialHeader",
                  },
                  {
                    text: ".deserialize",
                    link: "/sdk/typescript/core/Challenge.deserialize",
                  },
                  {
                    text: ".from",
                    link: "/sdk/typescript/core/Challenge.from",
                  },
                  {
                    text: ".fromHeaders",
                    link: "/sdk/typescript/core/Challenge.fromHeaders",
                  },
                  {
                    text: ".fromMethod",
                    link: "/sdk/typescript/core/Challenge.fromMethod",
                  },
                  {
                    text: ".fromResponse",
                    link: "/sdk/typescript/core/Challenge.fromResponse",
                  },
                  {
                    text: ".fromResponseList",
                    link: "/sdk/typescript/core/Challenge.fromResponseList",
                  },
                  {
                    text: ".meta",
                    link: "/sdk/typescript/core/Challenge.meta",
                  },
                  {
                    text: ".serialize",
                    link: "/sdk/typescript/core/Challenge.serialize",
                  },
                  {
                    text: ".verify",
                    link: "/sdk/typescript/core/Challenge.verify",
                  },
                ],
              },
              {
                text: "Credential",
                collapsed: true,
                items: [
                  {
                    text: ".deserialize",
                    link: "/sdk/typescript/core/Credential.deserialize",
                  },
                  {
                    text: ".from",
                    link: "/sdk/typescript/core/Credential.from",
                  },
                  {
                    text: ".fromRequest",
                    link: "/sdk/typescript/core/Credential.fromRequest",
                  },
                  {
                    text: ".serialize",
                    link: "/sdk/typescript/core/Credential.serialize",
                  },
                ],
              },
              { text: "Errors", link: "/sdk/typescript/core/Errors" },
              { text: "Expires", link: "/sdk/typescript/core/Expires" },
              {
                text: "Method",
                collapsed: true,
                items: [
                  {
                    text: ".from",
                    link: "/sdk/typescript/core/Method.from",
                  },
                  {
                    text: ".toClient",
                    link: "/sdk/typescript/core/Method.toClient",
                  },
                  {
                    text: ".toServer",
                    link: "/sdk/typescript/core/Method.toServer",
                  },
                ],
              },
              {
                text: "PaymentRequest",
                collapsed: true,
                items: [
                  {
                    text: ".deserialize",
                    link: "/sdk/typescript/core/PaymentRequest.deserialize",
                  },
                  {
                    text: ".from",
                    link: "/sdk/typescript/core/PaymentRequest.from",
                  },
                  {
                    text: ".serialize",
                    link: "/sdk/typescript/core/PaymentRequest.serialize",
                  },
                ],
              },
              {
                text: "Receipt",
                collapsed: true,
                items: [
                  {
                    text: ".deserialize",
                    link: "/sdk/typescript/core/Receipt.deserialize",
                  },
                  {
                    text: ".from",
                    link: "/sdk/typescript/core/Receipt.from",
                  },
                  {
                    text: ".fromResponse",
                    link: "/sdk/typescript/core/Receipt.fromResponse",
                  },
                  {
                    text: ".serialize",
                    link: "/sdk/typescript/core/Receipt.serialize",
                  },
                ],
              },
              {
                text: "Store",
                collapsed: true,
                items: [
                  {
                    text: ".DurableObjectStore",
                    link: "/sdk/typescript/core/Store.DurableObjectStore",
                  },
                  {
                    text: ".d1",
                    link: "/sdk/typescript/core/Store.d1",
                  },
                  {
                    text: ".durableObject",
                    link: "/sdk/typescript/core/Store.durableObject",
                  },
                  {
                    text: ".postgres",
                    link: "/sdk/typescript/core/Store.postgres",
                  },
                  {
                    text: ".sql",
                    link: "/sdk/typescript/core/Store.sql",
                  },
                  {
                    text: ".sqlite",
                    link: "/sdk/typescript/core/Store.sqlite",
                  },
                  {
                    text: ".tryClaim",
                    link: "/sdk/typescript/core/Store.tryClaim",
                  },
                ],
              },
            ],
          },
          {
            text: "HTML reference",
            items: [
              {
                text: "Html.init",
                link: "/sdk/typescript/Html.init",
              },
              {
                text: "Custom",
                link: "/sdk/typescript/html/custom",
              },
            ],
          },
          { text: "CLI reference", link: "/sdk/typescript/cli" },
        ],
      },
      { text: "Python", link: "/sdk/python" },
      { text: "Rust", link: "/sdk/rust" },
      { text: "Go", link: "/sdk/go" },
      { text: "Ruby", link: "/sdk/ruby" },
    ],
  },
  socials: [
    { icon: "x", link: "https://x.com/mpp" },
    { icon: "github", link: "https://github.com/tempoxyz/mpp" },
  ],
  title: "MPP — Machine Payments Protocol",
  titleTemplate: "%s | MPP",
  // Replaces repeated inline Shiki color styles with CSS classes, reducing
  // uncompressed page size by ~1.5 MB. See src/shiki-style-to-class.ts.
  codeHighlight: {
    engine: "highlights",
    langs: ruby,
    transformers: [shikiStyleToClass()],
  },
  twoslash: {
    twoslashOptions: {
      compilerOptions: {
        moduleResolution: 100,
        types: ["node"],
      },
    },
  },
  topNav: [
    {
      text: "Docs",
      link: "/overview",
      match: (path) => path !== "/" && !path?.startsWith("/sdk"),
    },
    {
      text: "SDKs",
      link: "/sdk",
      match: (path) => Boolean(path?.startsWith("/sdk")),
    },
    { text: "Services", link: "/services" },
    { text: "Blog", link: "/blog" },
    { text: "IETF Specification", link: "https://paymentauth.org" },
    {
      text: "GitHub",
      items: [
        { text: "mppx (TypeScript)", link: "https://github.com/wevm/mppx" },
        { text: "mpp-go (Go)", link: "https://github.com/tempoxyz/mpp-go" },
        { text: "mpp-rb (Ruby)", link: "https://github.com/stripe/mpp-rb" },
        { text: "mpp-rs (Rust)", link: "https://github.com/tempoxyz/mpp-rs" },
        { text: "pympp (Python)", link: "https://github.com/tempoxyz/pympp" },
      ],
    },
  ],
});
