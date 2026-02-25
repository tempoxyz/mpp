import { stripeMppx } from "../../../../mppx-stripe.server";

const SUMMARIES: Record<string, string[]> = {
  "stripe.com": [
    "  Stripe processes hundreds of billions of dollars annually",
    "  across 195+ countries. The platform provides unified APIs for",
    "  payments, billing, and financial services that power businesses",
    "  from startups to Fortune 500 companies.",
  ],
  "tempo.xyz": [
    "  Tempo is a high-performance blockchain network purpose-built",
    "  for stablecoins and payments. It delivers sub-second finality",
    "  and near-zero transaction costs, making it the foundation for",
    "  the next generation of financial infrastructure.",
  ],
  "openai.com": [
    "  OpenAI builds and deploys advanced AI systems including GPT",
    "  and DALL-E. The company focuses on ensuring artificial general",
    "  intelligence benefits humanity through research, safety work,",
    "  and widely accessible AI products.",
  ],
  "github.com": [
    "  GitHub hosts over 400 million repositories and serves more",
    "  than 100 million developers worldwide. The platform provides",
    "  version control, CI/CD, code review, and project management",
    "  tools that power modern software development.",
  ],
  "vercel.com": [
    "  Vercel provides frontend cloud infrastructure for deploying",
    "  web applications with zero configuration. The platform offers",
    "  serverless functions, edge rendering, and analytics that help",
    "  teams ship faster and more reliably.",
  ],
};

function normalizeUrl(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export async function GET(request: Request) {
  const result = await stripeMppx.charge({
    amount: "100",
    currency: "usd",
    decimals: 0,
    description: "Article summary",
  })(request);

  if (result.status === 402) return result.challenge;

  const url = new URL(request.url);
  const input = url.searchParams.get("url") ?? "";
  const domain = normalizeUrl(input);
  const summary = SUMMARIES[domain];

  const lines = summary ?? [`  No summary available for ${domain}`];

  return result.withReceipt(Response.json({ lines }));
}
