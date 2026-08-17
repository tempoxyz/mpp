// @vitest-environment happy-dom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AGENT_SETUP_PROMPT, AgentSetupPrompt } from "./AgentSetupPrompt";

afterEach(cleanup);

describe("AgentSetupPrompt", () => {
  it("copies the canonical prompt and confirms the next action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<AgentSetupPrompt />);
    fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(AGENT_SETUP_PROMPT),
    );
    expect(screen.getByText("Copied — paste into your agent")).not.toBeNull();
  });

  it("links to manual setup from embedded marketing surfaces", () => {
    render(
      <AgentSetupPrompt
        manualSetupHref="/quickstart/agent#manual-setup"
        variant="marketing"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Manual setup" }).getAttribute("href"),
    ).toBe("/quickstart/agent#manual-setup");
    expect(
      screen.getByRole("button", { name: "Copy prompt" }).textContent,
    ).toBe("");
  });
});
