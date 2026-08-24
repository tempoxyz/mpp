import { withMarkdown } from "./markdown";
import { StructuredData } from "./StructuredData";

export const FAQ_ENTRIES = [
  {
    answer:
      "No. MPP is payment-method agnostic. Production implementations support Tempo stablecoin payments, card payments through Card or Stripe, and Lightning payments. Anyone can add a custom payment method.",
    question: "Is MPP only for stablecoins?",
  },
  {
    answer:
      "No. Card and Stripe methods let you pay with cards, and Lightning lets you pay with Bitcoin. Stablecoin payments require a wallet, but SDKs and wallet CLIs can handle key management.",
    question: "Do I need a stablecoin wallet?",
  },
  {
    answer:
      "MPP and x402 both use HTTP 402. MPP uses standard HTTP authentication semantics and supports payment rails including stablecoins, cards, and Lightning. x402 focuses on on-chain payment mechanisms. MPP also defines core Challenge binding, Receipts, and payment intents.",
    question: "How is MPP different from x402?",
  },
  {
    answer:
      "Yes. The x402 exact flow maps onto MPP's charge intent. mppx can run x402-compatible EVM charges inline so one endpoint serves both MPP and x402 clients.",
    question: "Is MPP compatible with x402?",
  },
  {
    answer:
      "MPP works with any payment rail and does not require Tempo. Tempo is well suited to high-throughput, low-value machine payments because it provides deterministic finality, predictable costs, payment lanes, and native stablecoin support.",
    question: "Why build MPP on Tempo?",
  },
  {
    answer:
      "Sessions enable streaming, pay-as-you-go payments. A client funds a channel reserve, sends signed off-chain vouchers for requests, and the server periodically settles the accumulated value on-chain.",
    question: "What are sessions?",
  },
  {
    answer:
      "Each service sets its own price. The MPP protocol is free and open, with no licensing fees. Session payments can support lower per-request prices because individual interactions use signed vouchers and only net settlement reaches the payment network.",
    question: "How much does it cost?",
  },
  {
    answer:
      "MPP requires TLS 1.2 or later and binds Challenge IDs to prevent replay. Unpaid requests do not perform protected side effects. Each payment method also applies the security model of its underlying payment rail.",
    question: "Is it safe?",
  },
  {
    answer:
      "Store MPP_SECRET_KEY in a secrets manager, keep it server-side, never log it, and rotate it immediately if exposed. During rotation, verify with current and previous keys so in-flight Challenges continue to work.",
    question: "How do I handle MPP_SECRET_KEY?",
  },
  {
    answer:
      "The service returns an RFC 9457 Problem Details response. The client can retry with another payment method or surface the error. Failed requests do not deduct money.",
    question: "What happens if a payment fails?",
  },
  {
    answer:
      "Yes. The MPP SDKs include server middleware and primitives for accepting payments from APIs built with frameworks including Hono, Express, Next.js, and Elysia.",
    question: "Can I accept MPP payments for my own service?",
  },
  {
    answer:
      "The core Payment HTTP Authentication Scheme is submitted to the IETF standards track. Payment method and intent specifications are separate documents that can evolve independently.",
    question: "Is MPP an IETF standard?",
  },
  {
    answer:
      "Yes. MPP includes an MCP transport binding that maps the Challenge-Credential-Receipt flow onto the Model Context Protocol so MCP servers can charge for tool calls.",
    question: "Can I use MPP outside of HTTP?",
  },
  {
    answer:
      "MPP is co-authored by Tempo and Stripe. Its core specification is developed openly and can be extended by any payment network or provider.",
    question: "Who is building MPP?",
  },
] as const;

function FaqStructuredDataComponent() {
  return (
    <StructuredData
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ_ENTRIES.map(({ answer, question }) => ({
          "@type": "Question",
          acceptedAnswer: {
            "@type": "Answer",
            text: answer,
          },
          name: question,
        })),
      }}
    />
  );
}

export const FaqStructuredData = withMarkdown(
  FaqStructuredDataComponent,
  () => [],
);
