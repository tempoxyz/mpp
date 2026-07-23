import { describe, expect, it } from "vitest";
import { AsciiLogo } from "./AsciiLogo";
import {
  CardChargeCard,
  CardMethodCard,
  ChallengesCard,
  ClientQuickstartCard,
  CredentialsCard,
  CustomMethodCard,
  EvmChargeCard,
  EvmMethodCard,
  GoClientCard,
  GoCoreTypesCard,
  GoSdkCard,
  GoServerCard,
  Http402Card,
  LightningMethodCard,
  LightningSessionCard,
  MonadChargeCard,
  MonadMethodCard,
  OneTimePaymentsCard,
  PayAsYouGoCard,
  PaymentMethodsCard,
  ProtocolConceptsCard,
  PythonClientCard,
  PythonCoreTypesCard,
  PythonSdkCard,
  PythonServerCard,
  QuickstartCard,
  ReceiptsCard,
  RedotPayChargeCard,
  RedotPayMethodCard,
  RubyClientCard,
  RubyCoreTypesCard,
  RubySdkCard,
  RubyServerCard,
  RustSdkCard,
  ServerQuickstartCard,
  SolanaChargeCard,
  SolanaMethodCard,
  SolanaSessionCard,
  StellarChannelCard,
  StellarMethodCard,
  StripeChargeCard,
  StripeMethodCard,
  TempoChargeCard,
  TempoMethodCard,
  TempoSubscriptionCard,
  TransportsCard,
  TypeScriptSdkCard,
  WalletCliCard,
} from "./cards";
import { EcosystemDiagram } from "./EcosystemDiagram";
import { LandingPage } from "./LandingPage";
import { NotFoundPage } from "./NotFoundPage";
import { PaymentFlowDiagram } from "./PaymentFlowDiagram";
import { PaymentLinkDemo } from "./PaymentLinkDemo";
import {
  ClientPrompt,
  QuickstartPrompts,
  ServerPrompt,
} from "./QuickstartPrompt";
import { ServicesPage } from "./ServicesPage";
import { TerminalGallery } from "./TerminalGallery";
import { TerminalPhoto } from "./TerminalPhoto";
import { TerminalPing } from "./TerminalPing";
import { TerminalPoem } from "./TerminalPoem";

type MarkdownComponent = { toMarkdown: () => unknown };

const components = {
  AsciiLogo,
  CardChargeCard,
  CardMethodCard,
  ChallengesCard,
  ClientPrompt,
  ClientQuickstartCard,
  CredentialsCard,
  CustomMethodCard,
  EcosystemDiagram,
  EvmChargeCard,
  EvmMethodCard,
  GoClientCard,
  GoCoreTypesCard,
  GoSdkCard,
  GoServerCard,
  Http402Card,
  LandingPage,
  LightningMethodCard,
  LightningSessionCard,
  MonadChargeCard,
  MonadMethodCard,
  NotFoundPage,
  OneTimePaymentsCard,
  PayAsYouGoCard,
  PaymentFlowDiagram,
  PaymentLinkDemo,
  PaymentMethodsCard,
  ProtocolConceptsCard,
  PythonClientCard,
  PythonCoreTypesCard,
  PythonSdkCard,
  PythonServerCard,
  QuickstartCard,
  QuickstartPrompts,
  ReceiptsCard,
  RedotPayChargeCard,
  RedotPayMethodCard,
  RubyClientCard,
  RubyCoreTypesCard,
  RubySdkCard,
  RubyServerCard,
  RustSdkCard,
  ServerPrompt,
  ServerQuickstartCard,
  ServicesPage,
  SolanaChargeCard,
  SolanaMethodCard,
  SolanaSessionCard,
  StellarChannelCard,
  StellarMethodCard,
  StripeChargeCard,
  StripeMethodCard,
  TempoChargeCard,
  TempoMethodCard,
  TempoSubscriptionCard,
  TerminalGallery,
  TerminalPhoto,
  TerminalPing,
  TerminalPoem,
  TransportsCard,
  TypeScriptSdkCard,
  WalletCliCard,
} as unknown as Record<string, MarkdownComponent>;

describe("MDX component Markdown hooks", () => {
  it("provides Markdown for every static custom MDX component", () => {
    for (const [name, component] of Object.entries(components)) {
      expect(component.toMarkdown, name).toBeTypeOf("function");
      expect(JSON.stringify(component.toMarkdown()), name).not.toContain(
        `<${name}`,
      );
    }
  });
});
