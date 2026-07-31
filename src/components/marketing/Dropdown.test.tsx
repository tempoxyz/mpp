// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Dropdown } from "./Dropdown";

afterEach(cleanup);

describe("Dropdown", () => {
  it("opens on click but not hover", () => {
    const { container } = render(
      <Dropdown
        items={[{ href: "https://github.com/wevm/mppx", label: "mppx" }]}
        label="GitHub"
      />,
    );

    const trigger = screen.getByRole("button", { name: "GitHub" });
    const menu = container.querySelector('[role="menu"]');

    expect(menu).not.toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(menu?.classList.contains("hidden")).toBe(true);

    fireEvent.mouseEnter(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(menu?.classList.contains("hidden")).toBe(true);

    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(menu?.classList.contains("hidden")).toBe(false);
  });
});
