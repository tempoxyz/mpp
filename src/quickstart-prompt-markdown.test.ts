import { describe, expect, it } from "vitest";
import {
  CLIENT_PROMPT,
  SERVER_PROMPT,
} from "./components/quickstart-prompts.js";
import { expandQuickstartPromptComponents } from "./quickstart-prompt-markdown.js";

describe("expandQuickstartPromptComponents", () => {
  it("expands the server prompt component", () => {
    const output = expandQuickstartPromptComponents("<ServerPrompt />");

    expect(output).not.toContain("<ServerPrompt");
    expect(output).toContain(SERVER_PROMPT);
  });

  it("expands the client prompt component", () => {
    const output = expandQuickstartPromptComponents("<ClientPrompt />");

    expect(output).not.toContain("<ClientPrompt");
    expect(output).toContain(CLIENT_PROMPT);
  });

  it("expands the combined quickstart prompts component", () => {
    const output = expandQuickstartPromptComponents("<QuickstartPrompts />");

    expect(output).not.toContain("<QuickstartPrompts");
    expect(output).toContain(CLIENT_PROMPT);
    expect(output).toContain(SERVER_PROMPT);
  });

  it("leaves markdown without prompt components unchanged", () => {
    const markdown = "# Quickstart\n\nNo prompt components here.";

    expect(expandQuickstartPromptComponents(markdown)).toBe(markdown);
  });
});
