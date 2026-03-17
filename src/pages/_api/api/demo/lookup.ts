import { stripeMppx } from "../../../../mppx-stripe.server";

const COMPANIES: Record<string, { title: string; description: string }> = {
  "stratechery.com": {
    title: "Stratechery by Ben Thompson",
    description:
      "Stratechery provides analysis of the strategy and business side of technology and media.",
  },
  "stripe.com": {
    title: "Stripe | Financial Infrastructure for the Internet",
    description:
      "Stripe powers online and in-person payment processing and financial solutions for businesses of all sizes.",
  },
  "tempo.xyz": {
    title: "Tempo | The Network for Stablecoins",
    description:
      "Tempo is a high-performance blockchain network purpose-built for stablecoins and payments.",
  },
  "openai.com": {
    title: "OpenAI",
    description:
      "OpenAI is an AI research and deployment company dedicated to ensuring that artificial general intelligence benefits all of humanity.",
  },
  "github.com": {
    title: "GitHub: Let's build from here",
    description:
      "GitHub is where over 100 million developers shape the future of software, together.",
  },
  "vercel.com": {
    title:
      "Vercel: Build and deploy the best web experiences with the Frontend Cloud",
    description:
      "Vercel provides the developer tools and cloud infrastructure to build, scale, and secure a faster, more personalized web.",
  },
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
    description: "Company lookup",
  })(request);

  if (result.status === 402) return result.challenge;

  const url = new URL(request.url);
  const input = url.searchParams.get("url") ?? "";
  const domain = normalizeUrl(input);
  const company = COMPANIES[domain];

  const lines = company
    ? [
        `  title       ${company.title}`,
        `  description ${company.description}`,
        `  url         https://${domain}`,
      ]
    : [
        `  title       ${domain}`,
        "  description No description available",
        `  url         https://${domain}`,
      ];

  return result.withReceipt(Response.json({ lines }));
}
