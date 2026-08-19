// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ServicesAgentDiscovery } from "./ServicesAgentDiscovery";

afterEach(cleanup);

describe("ServicesAgentDiscovery", () => {
  it("links service owners to the submission template", () => {
    render(<ServicesAgentDiscovery />);

    expect(screen.getByRole("heading", { name: "List your service" }).id).toBe(
      "list-your-service",
    );
    expect(
      screen
        .getByRole("link", { name: "Open a pull request" })
        .getAttribute("href"),
    ).toBe(
      "https://github.com/tempoxyz/mpp/compare?expand=1&template=service.md",
    );
  });
});
