import { Badge, Card } from "vocs";

export function QuickstartCard() {
  return (
    <Card
      description="Build a payment-enabled API"
      icon="lucide:rocket"
      title="Quickstart"
      to="/quickstart"
    />
  );
}

export function ClientQuickstartCard() {
  return (
    <Card
      description="Learn how to pay for resources"
      icon="lucide:user"
      title="Client quickstart"
      to="/quickstart/client"
    />
  );
}

export function ServerQuickstartCard() {
  return (
    <Card
      description="Learn how to charge for resources"
      icon="lucide:server"
      title="Server quickstart"
      to="/quickstart/server"
    />
  );
}

export function PrestoCliCard() {
  return (
    <Card
      description="Command-line tool for making paid HTTP requests"
      icon="lucide:terminal"
      title="presto CLI"
      to="/tools/presto"
    />
  );
}

export function TempoMethodCard() {
  return (
    <Card
      description="Web scale payments with TIP-20 stablecoins on Tempo with sub second settlement"
      icon='<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10.55 17h-2.73l2.53-7.73h-3.24l.71-2.27h9.03l-.71 2.27h-3.07L10.55 17Z"/></svg>'
      title="Tempo"
      to="/payment-methods/tempo"
    />
  );
}

export function OneTimePaymentsCard() {
  return (
    <Card
      description="Charge per request with a payment-gated API"
      icon="lucide:zap"
      title="Accept one-time payments"
      to="/guides/one-time-payments"
    />
  );
}

export function PayAsYouGoCard() {
  return (
    <Card
      description="Session-based billing with payment channels"
      icon="lucide:repeat"
      title="Accept pay-as-you-go payments"
      to="/guides/pay-as-you-go"
    />
  );
}

export function ProtocolConceptsCard() {
  return (
    <Card
      description="Learn about MPP's core control flow"
      icon="lucide:book-open"
      title="Protocol concepts"
      to="/protocol"
    />
  );
}

export function TypeScriptSdkCard() {
  return (
    <Card
      description="Get started with `mppx`, the reference implementation of the MPP SDKs"
      icon="simple-icons:typescript"
      title="TypeScript"
      to="/sdk/typescript"
    />
  );
}

export function PythonSdkCard() {
  return (
    <Card
      description="Get started with `pympp`, the official MPP SDK for Python"
      icon="simple-icons:python"
      title="Python"
      to="/sdk/python"
    />
  );
}

export function RustSdkCard() {
  return (
    <Card
      description="Get started with `mpp-rs`, the official MPP SDK for Rust"
      icon="simple-icons:rust"
      title="Rust"
      to="/sdk/rust"
    />
  );
}

export function MppxCreateReferenceCard({
  to,
}: {
  to: string;
}) {
  return (
    <Card
      description="Full API documentation"
      icon="lucide:book-open"
      title="Mppx.create reference"
      to={to}
    />
  );
}

export function PaymentMethodsCard() {
  return (
    <Card
      description="Method-specific request schemas"
      icon="lucide:credit-card"
      title="Payment Methods"
      to="/payment-methods"
    />
  );
}

export function PrestoExamplesCard() {
  return (
    <Card
      description="Usage patterns, examples, and full reference"
      icon="lucide:code"
      title="Examples"
      to="/tools/presto/examples"
    />
  );
}

export function PrestoDownloadCard() {
  return (
    <Card
      description="Download presto for your platform"
      icon="lucide:download"
      title="Download presto"
      to="https://github.com/tempoxyz/presto"
    />
  );
}

export function Http402Card() {
  return (
    <Card
      description="The 402 status code that signals payment is required"
      icon="lucide:alert-circle"
      title="HTTP 402"
      to="/protocol/http-402"
    />
  );
}

export function ChallengesCard() {
  return (
    <Card
      description="Server-issued payment requirements in WWW-Authenticate"
      icon="lucide:file-question"
      title="Challenges"
      to="/protocol/challenges"
    />
  );
}

export function CredentialsCard() {
  return (
    <Card
      description="Client-submitted payment proofs in Authorization"
      icon="lucide:key"
      title="Credentials"
      to="/protocol/credentials"
    />
  );
}

export function ReceiptsCard() {
  return (
    <Card
      description="Server acknowledgment of successful payment"
      icon="lucide:receipt"
      title="Receipts"
      to="/protocol/receipts"
    />
  );
}

export function TransportsCard() {
  return (
    <Card
      description="HTTP and MCP transport bindings"
      icon="lucide:network"
      title="Transports"
      to="/protocol/transports"
    />
  );
}

export function StripeMethodCard() {
  return (
    <Card
      description="Traditional payment methods through Stripe"
      icon="simple-icons:stripe"
      title="Stripe"
      to="/payment-methods/stripe"
    />
  );
}

export function CustomMethodCard() {
  return (
    <Card
      description="Build your own method or extend existing methods with the SDK."
      icon="lucide:anvil"
      title="Custom"
      to="/payment-methods/custom"
    />
  );
}

export function TempoChargeCard() {
  return (
    <Card
      description="Immediate one-time payments settled on-chain"
      icon='<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10.55 17h-2.73l2.53-7.73h-3.24l.71-2.27h9.03l-.71 2.27h-3.07L10.55 17Z"/></svg>'
      title="Tempo charge"
      to="/payment-methods/tempo/charge"
    />
  );
}

export function TempoSessionCard() {
  return (
    <Card
      description="Pay-as-you-go payment sessions over payment channels"
      icon="lucide:waves"
      title="Session"
      to="/payment-methods/tempo/session"
      topRight={<Badge variant="info">Recommended</Badge>}
    />
  );
}

export function StripeChargeCard() {
  return (
    <Card
      description="One-time payment using Shared Payment Tokens (SPTs)"
      icon="lucide:credit-card"
      title="Charge"
      to="/payment-methods/stripe/charge"
    />
  );
}

export function PythonCoreTypesCard() {
  return (
    <Card
      description="Challenge, Credential, Receipt types"
      icon="lucide:box"
      title="Core types"
      to="/sdk/python/core"
    />
  );
}

export function PythonClientCard() {
  return (
    <Card
      description="Handle 402 responses automatically"
      icon="lucide:send"
      title="Client"
      to="/sdk/python/client"
    />
  );
}

export function PythonServerCard() {
  return (
    <Card
      description="Protect endpoints with payments"
      icon="lucide:server"
      title="Server"
      to="/sdk/python/server"
    />
  );
}
