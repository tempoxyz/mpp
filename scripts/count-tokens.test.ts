import { describe, expect, it } from "vitest";
import { countTokens } from "./count-tokens.js";

describe("countTokens", () => {
  it("counts tokens in a simple string", () => {
    const count = countTokens("hello world");
    expect(count).toBeGreaterThan(0);
    expect(count).toBe(2);
  });

  it("returns 0 for an empty string", () => {
    expect(countTokens("")).toBe(0);
  });

  it("handles longer text", () => {
    const text = "The quick brown fox jumps over the lazy dog. ".repeat(100);
    const count = countTokens(text);
    expect(count).toBeGreaterThan(100);
  });
});
