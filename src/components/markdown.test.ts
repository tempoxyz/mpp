import { describe, expect, it } from "vitest";
import { AgentSetupPrompt } from "./AgentSetupPrompt";
import { AsciiLogo } from "./AsciiLogo";
import { staticCards } from "./cards";
import { EcosystemDiagram } from "./EcosystemDiagram";
import { FaqStructuredData } from "./FaqStructuredData";
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
import { SigningAccountTabs } from "./SigningAccountTabs";
import { TerminalGallery } from "./TerminalGallery";
import { TerminalPhoto } from "./TerminalPhoto";
import { TerminalPing } from "./TerminalPing";
import { TerminalPoem } from "./TerminalPoem";

type MarkdownComponent = { toMarkdown: () => unknown };

const components = {
  AgentSetupPrompt,
  AsciiLogo,
  ClientPrompt,
  EcosystemDiagram,
  FaqStructuredData,
  LandingPage,
  NotFoundPage,
  PaymentFlowDiagram,
  PaymentLinkDemo,
  QuickstartPrompts,
  ServerPrompt,
  ServicesPage,
  SigningAccountTabs,
  TerminalGallery,
  TerminalPhoto,
  TerminalPing,
  TerminalPoem,
  ...Object.fromEntries(
    staticCards.map((component) => [component.name, component]),
  ),
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

  it("emits payment-flow steps as list items", () => {
    const markdown = (
      PaymentFlowDiagram as unknown as MarkdownComponent
    ).toMarkdown() as Array<unknown>;
    const list = markdown[1] as { children: Array<{ type: string }> };

    expect(list.children).toHaveLength(4);
    expect(list.children.every((item) => item.type === "listItem")).toBe(true);
  });
});
