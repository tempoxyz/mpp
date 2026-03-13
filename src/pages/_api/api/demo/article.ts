import { getProxyFetch } from "../../../../mppx-proxy-client";
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

  const proxyFetch = getProxyFetch();
  const fullUrl = input.startsWith("http") ? input : `https://${input}`;
  if (!proxyFetch && input) {
    console.warn(
      "Parallel Extract unavailable: set FEE_PAYER_PRIVATE_KEY to enable paid extraction.",
    );
  }
  if (proxyFetch && input) {
    try {
      // Step 1: Extract page content via Parallel Extract
      const extractRes = await proxyFetch(
        "https://parallel.mpp.moderato.tempo.xyz/v1beta/extract",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            excerpts: { max_chars_per_result: 1000 },
            full_content: false,
            urls: [fullUrl],
          }),
        },
      );

      if (extractRes.ok) {
        const data = (await extractRes.json()) as {
          results?: Array<{
            excerpts?: string[];
            title?: string;
            url?: string;
          }>;
        };
        const excerpts = data.results?.[0]?.excerpts;
        if (excerpts?.length) {
          // Step 2: Summarize via Parallel Chat
          const chatRes = await proxyFetch(
            "https://parallel.mpp.moderato.tempo.xyz/v1beta/chat/completions",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "default",
                messages: [
                  {
                    role: "system",
                    content:
                      "Summarize the following page content in 2-3 concise sentences. No markdown, no bullet points.",
                  },
                  { role: "user", content: excerpts.join("\n") },
                ],
              }),
            },
          );

          if (chatRes.ok) {
            const chatData = (await chatRes.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            const summary = chatData.choices?.[0]?.message?.content;
            if (summary) {
              const lines = summary
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => `  ${line.trim()}`);
              return result.withReceipt(Response.json({ lines }));
            }
          } else {
            console.error(
              `[demo/article] Parallel Chat failed (${chatRes.status})`,
            );
          }
        }
        console.warn(
          `[demo/article] Parallel Extract returned no excerpts for ${fullUrl}`,
        );
      } else {
        const body = await extractRes.text();
        console.error(
          `[demo/article] Parallel Extract failed (${extractRes.status} ${extractRes.statusText}) for ${fullUrl}: ${body.slice(0, 500)}`,
        );
      }
    } catch (e) {
      console.error("[demo/article] Parallel error:", e);
    }
    // Fall through to canned response
  }

  // Fall back to canned summary for known domains when extraction is unavailable.
  const summary = SUMMARIES[domain];
  if (summary) {
    const warning =
      "Using canned summary because live extraction is unavailable right now.";
    console.warn(`[demo/article] ${warning} domain=${domain || "unknown"}`);
    return result.withReceipt(Response.json({ lines: summary, warning }));
  }

  // Fallback for unknown domains without Parallel results
  const warning =
    "No live extraction result available, and no canned summary exists for this domain.";
  console.warn(`[demo/article] ${warning} domain=${domain || "unknown"}`);
  const lines = [`  No summary available for ${domain}`];

  return result.withReceipt(Response.json({ lines, warning }));
}
