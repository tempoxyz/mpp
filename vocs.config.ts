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
  accentColor: "#171717",
  colorScheme: "light dark",
  baseUrl,
  redirects: [
    { source: "/docs", destination: "/overview" },
    { source: "/specifications", destination: "/specs" },
    { source: "/quickstart/pget", destination: "/quickstart/tempoctl" },
    { source: "/tools/pget", destination: "/tools/tempoctl" },
    { source: "/tools/pget/examples", destination: "/tools/tempoctl/examples" },
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
    "Machine Payment Protocol: internet-native payments for machine-to-machine transactions",
  checkDeadlinks: "warn",
  iconUrl: {
    light: "/favicon-dark.png",
    dark: "/favicon-light.png",
  },
  logoUrl: {
    light: "/mpp-logo-dark.svg",
    dark: "/mpp-logo-light.svg",
  },
  mcp: {
    enabled: true,
    sources: [
      McpSource.github({ name: "mppx", repo: "wevm/mppx" }),
      McpSource.github({ name: "mpay-rs", repo: "tempoxyz/mpay-rs" }),
      McpSource.github({ name: "mpay-sdks", repo: "tempoxyz/mpay-sdks" }),
      McpSource.github({ name: "pympay", repo: "tempoxyz/pympay" }),
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
        text: "Setup & use",
        items: [
          { text: "Use with agents", link: "/setup/agents" },
          { text: "Integrate into apps", link: "/setup/integrate" },
          { text: "Frequently asked", link: "/setup/faq" },
        ],
      },
      {
        text: "Integrate now",
        items: [
          {
            text: "Introduction",
            collapsed: true,
            items: [
              { text: "Overview", link: "/overview" },
              { text: "Specifications", link: "/specs" },
              { text: "Frequently asked 🚧", disabled: true },
            ],
          },
          {
            text: "Quick Start",
            collapsed: true,
            items: [
              { text: "Overview", link: "/quickstart" },
              { text: "Client", link: "/quickstart/client" },
              { text: "Server", link: "/quickstart/server" },
              { text: "tempoctl CLI", link: "/quickstart/tempoctl" },
            ],
          },
          {
            text: "Guides",
            collapsed: true,
            items: [
              { text: "Build with AI", link: "/guides/building-with-ai" },
              { text: "One-time payments 🚧", disabled: true },
              { text: "Pay-as-you-go 🚧", disabled: true },
            ],
          },
          {
            text: "Protocol",
            collapsed: true,
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
            text: "Payment methods & intents",
            collapsed: true,
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
                  {
                    text: "Session",
                    link: "/payment-methods/tempo/session",
                  },
                  {
                    text: "Charge",
                    link: "/payment-methods/tempo/charge",
                  },
                ],
              },
              {
                text: "Stripe",
                collapsed: true,
                items: [
                  { text: "Overview", link: "/payment-methods/stripe" },
                  { text: "Charge 🚧", disabled: true },
                ],
              },
              { text: "Custom", link: "/payment-methods/custom" },
            ],
          },
          {
            text: "SDKs & tools",
            collapsed: true,
            items: [
              { text: "Overview", link: "/sdk" },
              {
                text: "TypeScript",
                collapsed: true,
                items: [
                  {
                    text: "Getting started",
                    link: "/sdk/typescript",
                  },
                  {
                    text: "Client reference",
                    items: [
                      {
                        text: "Mpay",
                        collapsed: true,
                        items: [
                          {
                            text: ".create",
                            link: "/sdk/typescript/client/Mpay.create",
                          },
                          {
                            text: ".restore",
                            link: "/sdk/typescript/client/Mpay.restore",
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
                        text: "Method",
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
                    ],
                  },
                  {
                    text: "Server reference",
                    items: [
                      {
                        text: "Mpay",
                        collapsed: true,
                        items: [
                          {
                            text: ".create",
                            link: "/sdk/typescript/server/Mpay.create",
                          },
                          {
                            text: ".toNodeListener",
                            link: "/sdk/typescript/server/Mpay.toNodeListener",
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
                        text: "Method",
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
                    text: "Core reference",
                    items: [
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
                        text: "Expires",
                        link: "/sdk/typescript/core/Expires",
                      },
                    ],
                  },
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
                text: "tempoctl CLI",
                collapsed: true,
                items: [
                  { text: "Reference", link: "/tools/tempoctl" },
                  {
                    text: "Examples",
                    link: "/tools/tempoctl/examples",
                  },
                ],
              },
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
    { text: "Docs", link: "/setup/agents", match: (path) => path !== "/" },
    {
      text: "SDKs",
      items: [
        { text: "TypeScript — mppx", link: "https://github.com/wevm/mppx" },
        { text: "Rust — mpay-rs", link: "https://github.com/tempoxyz/mpay-rs" },
        { text: "Python — pympay", link: "https://github.com/tempoxyz/pympay" },
      ],
    },
    { text: "Updates", link: "https://x.com/mpp" },
  ],
});
