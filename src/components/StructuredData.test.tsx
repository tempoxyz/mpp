// @vitest-environment happy-dom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StructuredData } from "./StructuredData";

afterEach(cleanup);

describe("StructuredData", () => {
  it("serializes JSON-LD without executable closing tags", () => {
    const value = "</script><script>alert('xss')</script>";
    const { container } = render(<StructuredData data={{ value }} />);
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    const serialized = script?.textContent ?? "";

    expect(serialized).not.toContain("</script>");
    expect(JSON.parse(serialized)).toEqual({ value });
  });
});
