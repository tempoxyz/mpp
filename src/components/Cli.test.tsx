// @vitest-environment happy-dom
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { getFirstOptionValue, Poem, store } from "./Cli";

// ---------------------------------------------------------------------------
// Poem.joinWords
// ---------------------------------------------------------------------------

describe("Poem.joinWords", () => {
  it("joins words with spaces", () => {
    expect(Poem.joinWords(["hello", "world"])).toBe("hello world");
  });

  it("handles newline escape sequences", () => {
    expect(Poem.joinWords(["hello", "\\n", "world"])).toBe("hello\nworld");
  });

  it("returns empty string for empty array", () => {
    expect(Poem.joinWords([])).toBe("");
  });

  it("handles single word", () => {
    expect(Poem.joinWords(["hello"])).toBe("hello");
  });

  it("does not add space after newline", () => {
    expect(Poem.joinWords(["line1", "\\n", "line2"])).toBe("line1\nline2");
  });

  it("handles consecutive newlines", () => {
    expect(Poem.joinWords(["a", "\\n", "\\n", "b"])).toBe("a\n\nb");
  });

  it("handles newline at start", () => {
    expect(Poem.joinWords(["\\n", "hello"])).toBe("\nhello");
  });

  it("handles newline at end", () => {
    expect(Poem.joinWords(["hello", "\\n"])).toBe("hello\n");
  });

  it("handles multi-word poem", () => {
    const words = ["Roses", "are", "red,", "\\n", "Violets", "are", "blue."];
    expect(Poem.joinWords(words)).toBe("Roses are red,\nViolets are blue.");
  });
});

// ---------------------------------------------------------------------------
// getFirstOptionValue
// ---------------------------------------------------------------------------

describe("getFirstOptionValue", () => {
  it("returns the value prop of the first valid element", () => {
    const children = [
      createElement("div", { value: "first" }),
      createElement("div", { value: "second" }),
    ];
    expect(getFirstOptionValue(children)).toBe("first");
  });

  it("returns empty string when no children have value prop", () => {
    const children = [
      createElement("div", { key: "a" }),
      createElement("span", { key: "b" }),
    ];
    expect(getFirstOptionValue(children)).toBe("");
  });

  it("returns empty string for null children", () => {
    expect(getFirstOptionValue(null)).toBe("");
  });

  it("returns empty string for empty array", () => {
    expect(getFirstOptionValue([])).toBe("");
  });

  it("skips non-element children", () => {
    const children = ["plain text", createElement("div", { value: "found" })];
    expect(getFirstOptionValue(children)).toBe("found");
  });
});

// ---------------------------------------------------------------------------
// store initial state
// ---------------------------------------------------------------------------

describe("store", () => {
  it("has correct initial state shape", () => {
    const state = store.state;
    expect(state.initialBalance).toBeUndefined();
    expect(state.interaction).toBeNull();
    expect(state.restartStep).toBe(0);
    expect(state.sessionDeposit).toBe(0n);
    expect(state.sessionSpent).toBe(0n);
    expect(state.stepIndex).toBe(0);
    expect(state.token).toBeUndefined();
    expect(state.view).toBe("main");
  });
});
