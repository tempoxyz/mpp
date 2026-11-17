import { describe, expect, it } from "vitest";
import { markdown } from "./SpecCard";

const context = { inline: false, pageUrl: "/specs", renderChildren: () => [] };
describe("SpecCard Markdown", () => {
  it.each([
    [{ to: "/specs" }, "IETF Specification", "Read the full specification"],
    [
      { to: "/specs", title: "Charge", description: "Charge specification" },
      "Charge",
      "Charge specification",
    ],
  ])("preserves the link and description for %j", (props, title, description) => {
    expect(markdown.SpecCard(props, context)).toEqual([
      {
        type: "paragraph",
        children: [
          {
            type: "link",
            url: "/specs",
            children: [{ type: "text", value: title }],
          },
          { type: "text", value: ` — ${description}` },
        ],
      },
    ]);
  });
  it("returns phrasing nodes for inline cards", () => {
    expect(
      markdown.SpecCard({ to: "/specs" }, { ...context, inline: true })[0].type,
    ).toBe("link");
  });
  it.each([
    {},
    { to: 42 },
    { to: "/specs", title: null },
  ])("rejects invalid props %j", (props) => {
    expect(() => markdown.SpecCard(props, context)).toThrow(
      "static string props",
    );
  });
});
