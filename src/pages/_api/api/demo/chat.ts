import { mppx } from "../../../../mppx.server";
import { getProxyFetch } from "../../../../mppx-proxy-client";

const responses = [
  [
    "Great question! MPP uses HTTP 402 to signal that a resource requires payment.",
    "When your client receives a 402, it automatically negotiates a payment channel.",
    "The server issues a Challenge, your wallet signs a Credential, and the stream begins.",
    "Each token you consume is charged in real time—no upfront costs, no billing portals.",
    "It's like a pay-as-you-go meter, but for API calls.",
  ],
  [
    "Stablecoins make micropayments practical in a way credit cards never could.",
    "A credit card transaction costs around $0.30 in fees—that's absurd for a $0.001 API call.",
    "With USDC on Tempo, transaction fees are fractions of a cent.",
    "MPP opens payment channels so you can stream thousands of micro-charges efficiently.",
    "The result: APIs can charge per token, per byte, or per request without overhead.",
  ],
  [
    "Setting up a paid API with MPP takes just a few lines of code.",
    "On the server, wrap your handler with `mppx.session()` to define pricing.",
    "On the client, use `Fetch.polyfill()` to handle 402 responses automatically.",
    "Your existing fetch calls work unchanged—MPP handles the payment negotiation transparently.",
    "No Stripe dashboard, no webhook endpoints, no billing logic to maintain.",
  ],
  [
    "Payment channels are the key innovation behind MPP streaming.",
    "Instead of settling every micropayment on-chain, MPP batches them into a channel.",
    "The client pre-authorizes a budget, and the server charges against it incrementally.",
    "Only the final balance is settled on-chain, keeping gas costs minimal.",
    "This means you can charge $0.0001 per token without worrying about transaction fees.",
  ],
  [
    "AI agents need a native payment protocol—and that's exactly what MPP provides.",
    "Agents can autonomously discover prices via 402 challenges, no human in the loop.",
    "They sign credentials with their own wallet keys and stream payments as they consume data.",
    "MPP works over both HTTP and MCP transports, so agents can pay for tools natively.",
    "The web finally has a machine-readable way to say 'this costs money.'",
  ],
  [
    "Think of MPP as the missing payment layer for the internet.",
    "HTTP has status codes for everything—301 for redirects, 404 for not found.",
    "But 402 Payment Required has been 'reserved for future use' since 1999.",
    "MPP finally gives 402 a real implementation with Challenges, Credentials, and Receipts.",
    "Any HTTP endpoint can now require payment, and any client can pay automatically.",
  ],
  [
    "The best part about MPP? Your users don't need to sign up for anything.",
    "No account creation, no credit card forms, no KYC verification.",
    "A wallet address is your identity, and a signature is your authorization.",
    "Payments settle in stablecoins—real USD value without volatility risk.",
    "It's permissionless commerce: if you have a wallet, you can pay and get paid.",
  ],
];

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (let i = 0; i < text.length; i += 4) {
    tokens.push(text.slice(i, i + 4));
  }
  return tokens;
}

export default async function handler(request: Request) {
  const result = await mppx.session({
    amount: "0.0001",
    unitType: "token",
  })(request);

  if (result.status === 402) return result.challenge;

  // POST = voucher update (no body needed)
  if (request.method === "POST") return result.withReceipt();

  // GET = stream a chat response
  const proxyFetch = getProxyFetch();
  const prompt = new URL(request.url).searchParams.get("prompt");

  if (!proxyFetch && prompt) {
    console.warn(
      "[demo/chat] OpenAI proxy unavailable: set FEE_PAYER_PRIVATE_KEY to enable paid chat.",
    );
  }

  if (proxyFetch && prompt) {
    try {
      // Call OpenAI through mpp-proxy (proxy handles API key)
      const res = await proxyFetch(
        "https://openai.mpp.moderato.tempo.xyz/v1/chat/completions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful assistant. Keep responses concise — 3 to 6 sentences.",
              },
              { role: "user", content: prompt },
            ],
          }),
        },
      );

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          // Convert newlines to tabs (client decodes tabs → newlines)
          const text = content.replaceAll("\n", "\t");
          const tokens = tokenize(text);

          return result.withReceipt(async function* (stream) {
            for (const token of tokens) {
              await stream.charge();
              yield token;
            }
          });
        }
        console.warn(
          "[demo/chat] OpenAI response did not contain message content",
        );
      } else {
        const body = await res.text();
        console.error(
          `[demo/chat] OpenAI request failed (${res.status} ${res.statusText}): ${body.slice(0, 500)}`,
        );
      }
    } catch (e) {
      console.error(
        `[demo/chat] mpp-proxy OpenAI error for prompt="${prompt}":`,
        e,
      );
    }
    // Fall through to canned response
  }

  // Fallback: canned response
  console.warn(
    "[demo/chat] using canned response because live chat is unavailable",
  );
  const response = responses[Math.floor(Math.random() * responses.length)];
  const text = [
    "[warning] Live chat unavailable; showing canned response.",
    "",
    ...response,
  ].join("\t");
  const tokens = tokenize(text);

  return result.withReceipt(async function* (stream) {
    for (const token of tokens) {
      await stream.charge();
      yield token;
    }
  });
}
