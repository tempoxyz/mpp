import { mppx } from "../../../../mppx.server";
import { getProxyFetch } from "../../../../mppx-proxy-client";

const searchResults = [
  [
    "  1. Micropayments Are Eating the API Economy",
    "     https://blog.tempo.xyz/micropayments-api-economy",
    "     How sub-cent payments are replacing API keys and rate limits across the web...",
    "",
    "  2. HTTP 402: The Status Code That Finally Has a Purpose",
    "     https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402",
    "     Originally reserved for future use, HTTP 402 Payment Required is now the backbone of machine-to-machine payments...",
    "",
    "  3. Stablecoin Settlement in Under 500ms",
    "     https://tempo.xyz/docs/settlement",
    "     Tempo achieves near-instant finality for USDC and USDT transfers using optimistic channel networks...",
  ],
  [
    "  1. Building AI Agents That Pay for Their Own Tools",
    "     https://arxiv.org/abs/2025.04821",
    "     A framework for autonomous agents that discover, negotiate, and pay for API access without human intervention...",
    "",
    "  2. The End of Free Tiers: Why Usage-Based Pricing Wins",
    "     https://a16z.com/end-of-free-tiers",
    "     Venture-subsidized free APIs are disappearing. Per-request micropayments offer a sustainable alternative...",
    "",
    "  3. MCP and the Future of Agent Interoperability",
    "     https://modelcontextprotocol.io/blog/agent-payments",
    "     How the Model Context Protocol enables AI agents to pay for tools across any provider...",
  ],
  [
    "  1. Real-Time Payments for Real-Time Data",
    "     https://tempo.xyz/blog/real-time-payments",
    "     Streaming payment channels allow continuous data feeds priced per byte, per token, or per result...",
    "",
    "  2. Why Stablecoins Beat Credit Cards for Machine Payments",
    "     https://stripe.com/blog/stablecoins-machine-payments",
    "     No chargebacks, no minimums, no merchant accounts. Stablecoins are the native currency of the API economy...",
    "",
    "  3. Parallel Search API: AI-Native Web Search",
    "     https://docs.parallel.ai/reference/search",
    "     AI-native search engine designed for agents, returning structured content from across the web...",
  ],
  [
    "  1. Payment Auth: An HTTP Authentication Scheme for Payments",
    "     https://datatracker.ietf.org/doc/draft-payment-auth",
    "     IETF draft specifying challenge-credential-receipt flows for HTTP 402 Payment Required...",
    "",
    "  2. TIP-20: Token Standard for the Tempo Network",
    "     https://tempo.xyz/docs/tip-20",
    "     A fungible token standard optimized for high-throughput micropayment channels on Tempo...",
    "",
    "  3. Verifiable Receipts with On-Chain Attestations",
    "     https://ethereum.org/en/developers/docs/attestations",
    "     Cryptographic receipts that prove payment without revealing transaction details...",
  ],
  [
    "  1. LLM Tool Use Is Getting Expensive — Here's How to Fix It",
    "     https://openai.com/research/tool-use-costs",
    "     Average agent workflows make 12 tool calls per task. Flat-rate pricing doesn't scale...",
    "",
    "  2. The Web3 Payments Stack in 2025",
    "     https://messari.io/report/web3-payments-2025",
    "     From L2 rollups to payment channels, a comprehensive overview of the stablecoin payments infrastructure...",
    "",
    "  3. How Cloudflare Workers Enable Pay-Per-Request APIs",
    "     https://blog.cloudflare.com/pay-per-request-workers",
    "     Edge computing meets micropayments: deploying payment-gated APIs with zero cold starts...",
  ],
];

export async function GET(request: Request) {
  const result = await mppx.charge({
    amount: "0.005",
    description: "Web search",
  })(request);

  if (result.status === 402) return result.challenge;

  const proxyFetch = getProxyFetch();
  const query = new URL(request.url).searchParams.get("query");

  if (!proxyFetch && query) {
    console.warn(
      `[demo/search] Parallel Search unavailable for query="${query}": set FEE_PAYER_PRIVATE_KEY to enable paid search.`,
    );
  }

  if (proxyFetch && query) {
    try {
      const res = await proxyFetch(
        "https://parallel.mpp.moderato.tempo.xyz/v1beta/search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            excerpts: { max_chars_per_result: 200 },
            max_results: 3,
            objective: query,
            search_queries: [query],
          }),
        },
      );

      if (res.ok) {
        const data = (await res.json()) as {
          results?: Array<{
            excerpts?: string[];
            title?: string;
            url?: string;
          }>;
        };

        if (data.results && data.results.length > 0) {
          const lines: string[] = [];
          data.results.forEach((r, i) => {
            if (i > 0) lines.push("");
            lines.push(`  ${i + 1}. ${r.title ?? "Untitled"}`);
            lines.push(`     ${r.url ?? ""}`);
            if (r.excerpts?.[0]) {
              const snippet = r.excerpts[0]
                .trim()
                .replace(/\s+/g, " ")
                .slice(0, 150);
              lines.push(`     ${snippet}...`);
            }
          });
          return result.withReceipt(Response.json({ lines }));
        }
        console.warn(
          `[demo/search] Parallel Search returned no results for query="${query}"`,
        );
      } else {
        const body = await res.text();
        console.error(
          `[demo/search] Parallel Search failed (${res.status} ${res.statusText}) for query="${query}": ${body.slice(0, 500)}`,
        );
      }
    } catch (e) {
      console.error(
        `[demo/search] mpp-proxy Parallel Search error for query="${query}":`,
        e,
      );
    }
    // Fall through to canned response
  }

  const warning =
    "Using canned search results because live search is unavailable right now.";
  console.warn(`[demo/search] ${warning} query=${query || "<empty>"}`);
  const lines = searchResults[Math.floor(Math.random() * searchResults.length)];

  return result.withReceipt(Response.json({ lines, warning }));
}
