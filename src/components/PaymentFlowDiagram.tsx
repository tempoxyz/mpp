import { MermaidDiagram } from "./MermaidDiagram";
import { code } from "./markdown";

/**
 * Shared MPP payment flow diagram and step list.
 * Used on protocol overview, main overview, and other pages that explain the core 402 flow.
 */
export function PaymentFlowDiagram() {
  return (
    <>
      <MermaidDiagram
        chart={`sequenceDiagram
    participant Client
    participant Server
    Client->>Server: (1) GET /resource
    Server-->>Client: (2) 402 Payment Required + Challenge
    Note over Client: (3) Client fulfills payment challenge
    Client->>Server: (4) GET /resource + Credential
    Note over Server: (5) Server verifies and settles
    Server-->>Client: (6) 200 OK + Receipt
`}
      />
      <ol className="payment-flow-steps">
        <li>
          <strong>Client: Requests the resource</strong>—
          <code data-v>GET /resource</code>
        </li>
        <li>
          <strong>Server: Returns a payment challenge</strong>—
          <code data-v>402</code> Payment Required with{" "}
          <code data-v>WWW-Authenticate: Payment</code> header
        </li>
        <li>
          <strong>Client: Fulfills the payment</strong>—Sign a transaction, pay
          an invoice, or complete a card payment
        </li>
        <li>
          <strong>Client: Retries with a payment credential</strong>—{" "}
          <code data-v>GET /resource</code> with{" "}
          <code data-v>Authorization: Payment</code> header
        </li>
        <li>
          <strong>
            Server: Verifies the payment and delivers the resource
          </strong>
          —<code data-v>200</code> OK with <code data-v>Payment-Receipt</code>{" "}
          header
        </li>
      </ol>
    </>
  );
}

Object.assign(PaymentFlowDiagram, {
  toMarkdown: () => [
    code(
      `sequenceDiagram
  participant Client
  participant Server
  Client->>Server: GET /resource
  Server-->>Client: 402 Payment Required + Challenge
  Client->>Server: GET /resource + Credential
  Server-->>Client: 200 OK + Receipt`,
      "mermaid",
    ),
    {
      children: [
        {
          children: [
            {
              children: [{ type: "text", value: "Request the resource." }],
              spread: false,
              type: "paragraph",
            },
          ],
          spread: false,
          type: "listItem",
        },
        {
          children: [
            {
              children: [{ type: "text", value: "Receive a 402 Challenge." }],
              spread: false,
              type: "paragraph",
            },
          ],
          spread: false,
          type: "listItem",
        },
        {
          children: [
            {
              children: [
                {
                  type: "text",
                  value: "Fulfill the payment and retry with a Credential.",
                },
              ],
              spread: false,
              type: "paragraph",
            },
          ],
          spread: false,
          type: "listItem",
        },
        {
          children: [
            {
              children: [
                { type: "text", value: "Receive the resource and Receipt." },
              ],
              spread: false,
              type: "paragraph",
            },
          ],
          spread: false,
          type: "listItem",
        },
      ],
      ordered: true,
      spread: false,
      start: 1,
      type: "list",
    },
  ],
});
