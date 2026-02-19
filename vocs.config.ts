import { defineConfig, McpSource } from "vocs/config";

const baseUrl = (() => {
  if (process.env.VERCEL_ENV === "production")
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Use localhost for local development
  if (process.env.NODE_ENV !== "production") return "http://localhost:5173";
  return "";
})();

export default defineConfig({
  accentColor: "light-dark(#000000, #ffffff)",
  colorScheme: "light dark",
  baseUrl,
  redirects: [
    { source: "/docs", destination: "/overview" },
    {
      source: "/specifications",
      destination: "https://tempoxyz.github.io/mpp-specs/",
    },
    { source: "/specs", destination: "https://tempoxyz.github.io/mpp-specs/" },
    { source: "/quickstart/pget", destination: "/quickstart/presto" },
    { source: "/quickstart/tempoctl", destination: "/quickstart/presto" },
    { source: "/tools/pget", destination: "/tools/presto" },
    { source: "/tools/pget/examples", destination: "/tools/presto/examples" },
    { source: "/tools/tempoctl", destination: "/tools/presto" },
    {
      source: "/tools/tempoctl/examples",
      destination: "/tools/presto/examples",
    },
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
  ],
  description:
    "Machine Payments Protocol - Machine-native payments for machine-to-machine transactions",
  checkDeadlinks: "warn",
  editLink: {
    link: "https://github.com/tempoxyz/mpp/edit/main/src/pages/:path",
    text: "Suggest changes to this page",
  },
  iconUrl: "/favicon-dollar.svg",
  logoUrl: {
    light: "/logo-light.svg",
    dark: "/logo-dark.svg",
  },
  mcp: {
    enabled: true,
    sources: [
      McpSource.github({ name: "mppx", repo: "wevm/mppx" }),
      McpSource.github({ name: "mpp-rs", repo: "tempoxyz/mpp-rs" }),
      McpSource.github({ name: "mpp-tools", repo: "tempoxyz/mpp-tools" }),
      McpSource.github({ name: "pympp", repo: "tempoxyz/pympp" }),
      McpSource.github({
        name: "payment-auth-spec",
        repo: "tempoxyz/payment-auth-spec",
      }),
      McpSource.github({ name: "tempo", repo: "tempoxyz/tempo" }),
    ],
  },
  ogImageUrl: (path, { baseUrl: base } = { baseUrl: "" }) =>
    path === "/"
      ? `${base}/og.png`
      : `${base}/api/og?title=%title&description=%description`,
  sidebar: {
    "/": [
      {
        text: "Introduction",
        items: [
          { text: "Overview", link: "/overview" },
          { text: "Services", link: "/services" },
          {
            text: "IETF Specs",
            link: "https://tempoxyz.github.io/mpp-specs/",
          },
          { text: "FAQ", link: "/faq" },
        ],
      },
      {
        text: "Quick Start",
        items: [
          { text: "Overview", link: "/quickstart" },
          { text: "Client", link: "/quickstart/client" },
          { text: "Server", link: "/quickstart/server" },
          { text: "CLI (presto)", link: "/quickstart/presto" },
        ],
      },
      {
        text: "Guides",
        items: [
          { text: "Build with AI", link: "/guides/building-with-ai" },
          {
            text: "Accept One-Time Payments",
            link: "/guides/one-time-payments",
          },
          {
            text: "Accept Pay-As-You-Go Payments",
            link: "/guides/pay-as-you-go",
          },
          {
            text: "Accept Streamed Payments",
            link: "/guides/streamed-payments",
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
              { text: "MCP", link: "/protocol/transports/mcp" },
            ],
          },
        ],
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
              { text: "Session", link: "/payment-methods/tempo/session" },
              { text: "Charge", link: "/payment-methods/tempo/charge" },
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
          { text: "Custom", link: "/payment-methods/custom" },
        ],
      },
      {
        text: "SDKs & Tools",
        items: [
          { text: "Overview", link: "/sdk" },
          {
            text: "TypeScript",
            collapsed: true,
            items: [
              { text: "Getting Started", link: "/sdk/typescript" },
              { text: "Installation", link: "/sdk/installation" },
              {
                text: "Client Reference",
                items: [
                  {
                    text: "Methods",
                    collapsed: true,
                    items: [
                      {
                        text: "tempo.charge",
                        link: "/sdk/typescript/client/Method.tempo.charge",
                      },
                      {
                        text: "tempo.session",
                        link: "/sdk/typescript/client/Method.tempo.session",
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
                ],
              },
              {
                text: "Server Reference",
                items: [
                  {
                    text: "Methods",
                    collapsed: true,
                    items: [
                      {
                        text: "tempo.charge",
                        link: "/sdk/typescript/server/Method.tempo.charge",
                      },
                      {
                        text: "tempo.session",
                        link: "/sdk/typescript/server/Method.tempo.session",
                      },
                    ],
                  },
                  {
                    text: "Mppx",
                    collapsed: true,
                    items: [
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
                ],
              },
              {
                text: "Middleware Reference",
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
                text: "Core Reference",
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
                        text: ".fromResponse",
                        link: "/sdk/typescript/core/Challenge.fromResponse",
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
              { text: "CLI Reference", link: "/sdk/typescript/cli" },
            ],
          },
          {
            text: "Python",
            collapsed: true,
            items: [
              { text: "Overview", link: "/sdk/python" },
              { text: "Core Types", link: "/sdk/python/core" },
              { text: "Client", link: "/sdk/python/client" },
              { text: "Server", link: "/sdk/python/server" },
            ],
          },
          {
            text: "Rust",
            collapsed: true,
            items: [
              { text: "Overview", link: "/sdk/rust" },
              { text: "Client", link: "/sdk/rust/client" },
              { text: "Server", link: "/sdk/rust/server" },
            ],
          },
          {
            text: "CLI (presto)",
            collapsed: true,
            items: [
              { text: "Reference", link: "/tools/presto" },
              { text: "Examples", link: "/tools/presto/examples" },
            ],
          },
        ],
      },
    ],
  },
  socials: [
    { icon: "x", link: "https://x.com/mpp" },
    { icon: "github", link: "https://github.com/tempoxyz/payment-auth-spec" },
  ],
  title: "Machine Payments Protocol",
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
    { text: "SDKs & Tools", link: "/sdk" },
    { text: "IETF Specs", link: "https://tempoxyz.github.io/mpp-specs/" },
    {
      text: "GitHub",
      items: [
        { text: "mppx [TypeScript]", link: "https://github.com/wevm/mppx" },
        { text: "mpp-rs [Rust]", link: "https://github.com/tempoxyz/mpp-rs" },
        { text: "pympp [Python]", link: "https://github.com/tempoxyz/pympp" },
        {
          text: "IETF Specs",
          link: "https://github.com/tempoxyz/payment-auth-spec",
        },
      ],
    },
  ],
});
