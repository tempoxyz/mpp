import { describe, expect, it } from "vitest";
import { sectionIndex, transformMarkdownOutput } from "./markdown-output";

describe("final Markdown transform", () => {
  it("keeps every generated entry and page while grouping the index", async () => {
    const index =
      "# MPP\n\n- [SDK](/sdk/python.md): Python SDK\n- [Start](/quickstart.md): Start here\n- [New](/new-page.md): New content\n";
    const pages = {
      "/sdk/python": "# SDK",
      "/quickstart": "# Start",
      "/new-page": "# New",
    };
    const result = await transformMarkdownOutput({ index, pages });
    expect(result.pages).toEqual(pages);
    expect(result.index).toContain(
      "## Quickstart\n\n- [Start](/quickstart.md)",
    );
    expect(result.index).toContain("## SDKs\n\n- [SDK](/sdk/python.md)");
    expect(result.index).toContain("## Other\n\n- [New](/new-page.md)");
    expect(result.index.match(/^- \[/gm)).toHaveLength(3);
  });
  it("limits long descriptions without changing the link", () => {
    const output = sectionIndex(
      `# MPP\n\n- [SDK](/sdk/python.md): ${"a".repeat(100)}`,
    );
    expect(output).toContain(`- [SDK](/sdk/python.md): ${"a".repeat(87)}...`);
  });
  it("does not invent entries for an empty inventory", () => {
    expect(sectionIndex("# MPP\n")).toBe("# MPP\n");
  });
});
