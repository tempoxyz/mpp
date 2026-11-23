import { describe, expect, it } from "vitest";
import { viemTokenLinks } from "./shiki-viem-links.js";

function renderHref(href: string) {
  const link = {
    children: [],
    properties: { href },
    tagName: "a",
    type: "element" as const,
  };
  viemTokenLinks().pre({
    children: [
      { children: [link], properties: {}, tagName: "span", type: "element" },
    ],
    properties: {},
    tagName: "pre",
    type: "element",
  });
  return link.properties.href;
}

describe("Viem token links in Twoslash", () => {
  it.each([
    "",
    "#metadata",
    "?example=usdc",
  ])("qualifies the guide URL while preserving suffix %s", (suffix) => {
    expect(renderHref(`/tokens/guides/defining-tokens${suffix}`)).toBe(
      `https://viem.sh/tokens/guides/defining-tokens${suffix}`,
    );
  });

  it.each([
    "/sdk/typescript/core/Currency",
    "/tokens/guides/defining-tokens-other",
    "https://viem.sh/tokens/guides/defining-tokens",
    "https://example.com/tokens/guides/defining-tokens",
  ])("leaves other links unchanged: %s", (href) => {
    expect(renderHref(href)).toBe(href);
  });
});
