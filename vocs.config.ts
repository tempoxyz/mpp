import { defineConfig, McpSource } from "vocs/config";

const baseUrl = (() => {
  if (process.env.VERCEL_ENV === "production")
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV !== "production") return "http://localhost:5173";
  return "";
})();

export default defineConfig({
  accentColor: "light-dark(#000000, #ffffff)",
  colorScheme: "light dark",
  baseUrl,
  redirects: [
    // Aliases for overview
    { source: "/docs", destination: "/overview" },
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

    // Protocol concept shortcuts
    { source: "/402", destination: "/protocol/http-402" },
    { source: "/x402", destination: "/protocol/http-402" },
    { source: "/challenges", destination: "/protocol/challenges" },
    { source: "/challenge", destination: "/protocol/challenges" },
    { source: "/credentials", destination: "/protocol/credentials" },
    { source: "/credential", destination: "/protocol/credentials" },
    { source: "/receipts", destination: "/protocol/receipts" },
    { source: "/receipt", destination: "/protocol/receipts" },
    { source: "/transports", destination: "/protocol/transports" },
    { source: "/transport", destination: "/protocol/transports" },
    { source: "/mcp", destination: "/protocol/transports/mcp" },

    // SDK shortcuts
    { source: "/typescript", destination: "/sdk/typescript" },
    { source: "/python", destination: "/sdk/python" },
    { source: "/rust", destination: "/sdk/rust" },
    { source: "/reference", destination: "/sdk" },
    { source: "/api", destination: "/sdk" },

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
    { source: "/intents", destination: "/intents/charge" },
    { source: "/intent", destination: "/intents/charge" },

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

    // Old Fetch.* client pages (removed)
    {
      source: "/sdk/typescript/client/Fetch.from",
      destination: "/sdk/typescript",
    },
    {
      source: "/sdk/typescript/client/Fetch.polyfill",
      destination: "/sdk/typescript",
    },

    // Old server page
    {
      source: "/sdk/typescript/server/Request.fromNodeListener",
      destination: "/sdk/typescript/server/Request.toNodeListener",
    },

    // Extensions aliases
    { source: "/awesome", destination: "/extensions" },
    { source: "/community", destination: "/extensions" },
    { source: "/ecosystem", destination: "/extensions" },

    // Services aliases
    { source: "/service", destination: "/services" },
    { source: "/marketplace", destination: "/services" },
    { source: "/directory", destination: "/services" },
  ],
  description:
    "MPP (Machine Payments Protocol) is the open standard for machine-to-machine payments via HTTP 402.",
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
    light: "/logo-dark.svg",
    dark: "/logo-light.svg",
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
        text: "Introduction",
        items: [
          { text: "Overview", link: "/overview" },
          {
            text: "IETF Specs",
            link: "https://paymentauth.org",
          },
          { text: "FAQ", link: "/faq" },
          { text: "Build with an LLM", link: "/guides/building-with-an-llm" },
        ],
      },
      {
        text: "Quick Start",
        items: [
          { text: "Overview", link: "/quickstart" },
          { text: "Add payments to your API", link: "/quickstart/server" },
          { text: "Use with agents", link: "/quickstart/agent" },
          { text: "Use with your app", link: "/quickstart/client" },
        ],
      },
      {
        text: "Guides",
        items: [
          {
            text: "Accept one-time payments",
            link: "/guides/one-time-payments",
          },
          {
            text: "Accept pay-as-you-go payments",
            link: "/guides/pay-as-you-go",
          },
          {
            text: "Accept streamed payments",
            link: "/guides/streamed-payments",
          },
          {
            text: "Accept multiple payment methods",
            link: "/guides/multiple-payment-methods",
          },
        ],
      },
      {
        text: "Protocol",
        items: [
          { text: "Overview", link: "/protocol" },
          { text: "HTTP 402", link: "/protocol/http-402" },
          { text: "Challenges", link: "/protocol/challenges" },
          { text: "Credentials", link: "/protocol/credentials" },
          { text: "Receipts", link: "/protocol/receipts" },
          {
            text: "Transports",
            link: "/protocol/transports",
            items: [
              { text: "HTTP", link: "/protocol/transports/http" },
              { text: "MCP and JSON-RPC", link: "/protocol/transports/mcp" },
            ],
          },
        ],
      },

      {
        text: "Discovery",
        items: [{ text: "Overview", link: "/protocol/discovery" }],
      },
      {
        text: "Payment Methods & Intents",
        items: [
          { text: "Overview", link: "/payment-methods" },
          {
            text: "Intents",
            collapsed: true,
            items: [{ text: "Charge", link: "/intents/charge" }],
          },
          {
            text: "Tempo",
            collapsed: true,
            items: [
              { text: "Overview", link: "/payment-methods/tempo" },
              { text: "Charge", link: "/payment-methods/tempo/charge" },
              { text: "Session", link: "/payment-methods/tempo/session" },
            ],
          },
          {
            text: "Stripe",
            collapsed: true,
            items: [
              { text: "Overview", link: "/payment-methods/stripe" },
              { text: "Charge", link: "/payment-methods/stripe/charge" },
            ],
          },
          {
            text: "Card",
            collapsed: true,
            items: [
              { text: "Overview", link: "/payment-methods/card" },
              { text: "Charge", link: "/payment-methods/card/charge" },
            ],
          },
          {
            text: "Lightning",
            collapsed: true,
            items: [
              { text: "Overview", link: "/payment-methods/lightning" },
              { text: "Charge", link: "/payment-methods/lightning/charge" },
              { text: "Session", link: "/payment-methods/lightning/session" },
            ],
          },
          {
            text: "Solana",
            collapsed: true,
            items: [
              { text: "Overview", link: "/payment-methods/solana" },
              { text: "Charge", link: "/payment-methods/solana/charge" },
            ],
          },
          { text: "Custom", link: "/payment-methods/custom" },
        ],
      },
      {
        text: "SDKs",
        items: [
          { text: "Overview", link: "/sdk" },
          { text: "SDK features", link: "/sdk/features" },
          {
            text: "TypeScript",
            collapsed: true,
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
                        text: ".restore",
                        link: "/sdk/typescript/client/Mppx.restore",
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
                        text: "stripe",
                        link: "/sdk/typescript/server/Method.stripe",
                      },
                      {
                        text: "stripe.charge",
                        link: "/sdk/typescript/server/Method.stripe.charge",
                      },
                    ],
                  },
                  {
                    text: "Mppx",
                    collapsed: true,
                    items: [
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
                        text: "Response.requirePayment",
                        link: "/sdk/typescript/server/Response.requirePayment",
                      },
                      {
                        text: "Request.toNodeListener",
                        link: "/sdk/typescript/server/Request.toNodeListener",
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
                ],
              },
              { text: "CLI reference", link: "/sdk/typescript/cli" },
            ],
          },
          {
            text: "Python",
            collapsed: true,
            items: [
              { text: "Overview", link: "/sdk/python" },
              { text: "Core types", link: "/sdk/python/core" },
              { text: "Client", link: "/sdk/python/client" },
              { text: "Server", link: "/sdk/python/server" },
            ],
          },
          {
            text: "Rust",
            collapsed: true,
            items: [
              { text: "Overview", link: "/sdk/rust" },
              { text: "Core types", link: "/sdk/rust/core" },
              { text: "Client", link: "/sdk/rust/client" },
              { text: "Server", link: "/sdk/rust/server" },
            ],
          },
        ],
      },
      {
        text: "Resources",
        items: [
          { text: "Extensions", link: "/extensions" },
          { text: "Brand", link: "/brand" },
        ],
      },
    ],
  },
  socials: [
    { icon: "x", link: "https://x.com/mpp" },
    { icon: "github", link: "https://github.com/tempoxyz/mpp" },
  ],
  title: "MPP — Machine Payments Protocol",
  titleTemplate: "%s | MPP",
  twoslash: {
    twoslashOptions: {
      compilerOptions: {
        moduleResolution: 100,
      },
    },
  },
  topNav: [
    { text: "Docs", link: "/overview", match: (path) => path !== "/" },
    { text: "Services", link: "/services" },
    { text: "IETF Specs", link: "https://paymentauth.org" },
    {
      text: "GitHub",
      items: [
        { text: "mppx (TypeScript)", link: "https://github.com/wevm/mppx" },
        { text: "mpp-rs (Rust)", link: "https://github.com/tempoxyz/mpp-rs" },
        { text: "pympp (Python)", link: "https://github.com/tempoxyz/pympp" },
      ],
    },
  ],
});
