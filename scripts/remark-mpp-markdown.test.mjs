import { describe, expect, it } from "vitest";
import remarkMppMarkdown from "./remark-mpp-markdown.mjs";

function attribute(name, value) {
  return { name, type: "mdxJsxAttribute", value };
}

function expression(expression) {
  return {
    data: { estree: { body: [{ expression }] } },
    type: "mdxJsxAttributeValueExpression",
    value: "",
  };
}

function literal(value) {
  return { type: "Literal", value };
}

function flow(name, attributes = [], children = []) {
  return { attributes, children, name, type: "mdxJsxFlowElement" };
}

function textComponent(name, attributes = [], children = []) {
  return { attributes, children, name, type: "mdxJsxTextElement" };
}

function names(nodes) {
  return nodes.flatMap((node) => [
    ...(node.name ? [node.name] : []),
    ...(node.children ? names(node.children) : []),
  ]);
}

function transform(children) {
  const tree = { children, type: "root" };
  remarkMppMarkdown()(tree);
  return tree;
}

function object(properties) {
  return {
    properties: Object.entries(properties).map(([name, value]) => ({
      key: { name },
      value,
    })),
    type: "ObjectExpression",
  };
}

function paragraph(children) {
  return { children, type: "paragraph" };
}

describe("remarkMppMarkdown", () => {
  it("replaces every audited component with semantic Markdown", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            textComponent("Badge", [], [{ type: "text", value: "New" }]),
          ],
        },
        flow("BlogPostList", [
          attribute(
            "posts",
            expression({
              elements: [
                {
                  properties: [
                    { key: { name: "date" }, value: literal("June 17, 2026") },
                    {
                      key: { name: "description" },
                      value: {
                        children: [
                          { type: "JSXText", value: "Session updates" },
                        ],
                        type: "JSXFragment",
                      },
                    },
                    { key: { name: "title" }, value: literal("Sessions") },
                    { key: { name: "to" }, value: literal("/blog/sessions") },
                  ],
                  type: "ObjectExpression",
                },
              ],
              type: "ArrayExpression",
            }),
          ),
        ]),
        flow(
          "Cards",
          [],
          [
            flow("Card", [
              attribute("description", "Use the API"),
              attribute("title", "Quickstart"),
              attribute("to", "/quickstart"),
            ]),
            flow("MppxCreateReferenceCard", [
              attribute("to", "/sdk/Mppx.create"),
            ]),
            flow("SpecCard", [attribute("to", "https://paymentauth.org")]),
          ],
        ),
        flow("DownloadSvgButton", [
          attribute(
            "files",
            expression({
              elements: [literal("/logo-dark.svg"), literal("/logo-light.svg")],
              type: "ArrayExpression",
            }),
          ),
        ]),
        flow("MermaidDiagram", [
          attribute(
            "chart",
            expression({
              expressions: [],
              quasis: [{ value: { cooked: "sequenceDiagram\\nA->>B: Pay" } }],
              type: "TemplateLiteral",
            }),
          ),
        ]),
        flow(
          "PromptBlock",
          [],
          [
            {
              data: {
                estree: { body: [{ expression: literal("Build a paid API") }] },
              },
              type: "mdxFlowExpression",
              value: '"Build a paid API"',
            },
          ],
        ),
        {
          type: "paragraph",
          children: [
            textComponent("SdkBadge.GitHub", [
              attribute("repo", "tempoxyz/mpp"),
            ]),
            textComponent("SdkBadge.Maintainer", [
              attribute("href", "https://github.com/tempoxyz"),
              attribute("name", "Tempo"),
            ]),
          ],
        },
        flow(
          "Tabs",
          [],
          [
            flow(
              "Tab",
              [attribute("title", "Accounts SDK")],
              [
                {
                  type: "paragraph",
                  children: [{ type: "text", value: "Accounts example" }],
                },
              ],
            ),
            flow(
              "Tab",
              [attribute("title", "viem")],
              [
                {
                  type: "paragraph",
                  children: [{ type: "text", value: "viem example" }],
                },
              ],
            ),
          ],
        ),
      ],
    };

    remarkMppMarkdown()(tree);

    expect(names(tree.children)).not.toEqual(
      expect.arrayContaining([
        "Badge",
        "BlogPostList",
        "Card",
        "Cards",
        "DownloadSvgButton",
        "MermaidDiagram",
        "MppxCreateReferenceCard",
        "PromptBlock",
        "SdkBadge.GitHub",
        "SdkBadge.Maintainer",
        "SpecCard",
        "Tab",
        "Tabs",
      ]),
    );
    expect(tree.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ lang: "mermaid", type: "code" }),
        expect.objectContaining({
          lang: "text",
          type: "code",
          value: "Build a paid API",
        }),
        expect.objectContaining({ depth: 2, type: "heading" }),
      ]),
    );
  });

  it("converts cards to titled Markdown links with their descriptions", () => {
    const tree = transform([
      flow("Card", [
        attribute("description", "Start accepting payments"),
        attribute("title", "Quickstart"),
        attribute("to", "/quickstart"),
      ]),
      flow("MppxCreateReferenceCard", [attribute("to", "/sdk/Mppx.create")]),
      flow("SpecCard", [
        attribute("description", "Read the charge specification"),
        attribute("title", "Charge specification"),
        attribute("to", "https://paymentauth.org/charge"),
      ]),
    ]);

    expect(tree.children).toEqual([
      paragraph([
        {
          children: [{ type: "text", value: "Quickstart" }],
          type: "link",
          url: "/quickstart",
        },
        { type: "text", value: " — Start accepting payments" },
      ]),
      paragraph([
        {
          children: [{ type: "text", value: "Mppx.create reference" }],
          type: "link",
          url: "/sdk/Mppx.create",
        },
        { type: "text", value: " — Full API documentation" },
      ]),
      paragraph([
        {
          children: [{ type: "text", value: "Charge specification" }],
          type: "link",
          url: "https://paymentauth.org/charge",
        },
        { type: "text", value: " — Read the charge specification" },
      ]),
    ]);
  });

  it("preserves every tab as a sequential subsection at the active heading level", () => {
    const tree = transform([
      {
        children: [{ type: "text", value: "Examples" }],
        depth: 2,
        type: "heading",
      },
      flow(
        "Tabs",
        [],
        [
          flow(
            "Tab",
            [attribute("title", "Accounts SDK")],
            [
              paragraph([
                textComponent(
                  "Badge",
                  [],
                  [{ type: "text", value: "Recommended" }],
                ),
              ]),
            ],
          ),
          flow(
            "Tab",
            [attribute("title", "viem")],
            [paragraph([{ type: "text", value: "Use viem." }])],
          ),
        ],
      ),
    ]);

    expect(tree.children).toEqual([
      {
        children: [{ type: "text", value: "Examples" }],
        depth: 2,
        type: "heading",
      },
      {
        children: [{ type: "text", value: "Accounts SDK" }],
        depth: 3,
        type: "heading",
      },
      paragraph([{ type: "text", value: "Recommended" }]),
      {
        children: [{ type: "text", value: "viem" }],
        depth: 3,
        type: "heading",
      },
      paragraph([{ type: "text", value: "Use viem." }]),
    ]);
  });

  it("serializes blog metadata, inline code, downloads, diagrams, and prompts", () => {
    const tree = transform([
      flow("BlogPostList", [
        attribute(
          "posts",
          expression({
            elements: [
              object({
                date: literal("June 17, 2026"),
                description: {
                  children: [
                    { type: "JSXText", value: "Install " },
                    {
                      children: [{ type: "JSXText", value: "mppx" }],
                      openingElement: { name: { name: "code" } },
                      type: "JSXElement",
                    },
                  ],
                  type: "JSXFragment",
                },
                title: literal("Sessions"),
                to: literal("/blog/sessions"),
              }),
            ],
            type: "ArrayExpression",
          }),
        ),
      ]),
      flow("DownloadSvgButton", [
        attribute(
          "files",
          expression({
            elements: [literal("/logo-dark.svg"), literal("/logo-light.svg")],
            type: "ArrayExpression",
          }),
        ),
      ]),
      flow("MermaidDiagram", [
        attribute(
          "chart",
          expression({
            expressions: [],
            quasis: [{ value: { cooked: "sequenceDiagram\nA->>B: Pay" } }],
            type: "TemplateLiteral",
          }),
        ),
      ]),
      flow(
        "PromptBlock",
        [],
        [
          {
            data: {
              estree: { body: [{ expression: literal("Build a paid API") }] },
            },
            type: "mdxFlowExpression",
            value: '"Build a paid API"',
          },
        ],
      ),
    ]);

    expect(tree.children[0].children[0].children[0].children).toEqual([
      {
        children: [{ type: "text", value: "Sessions" }],
        type: "link",
        url: "/blog/sessions",
      },
    ]);
    expect(tree.children[0].children[0].children[1].children).toEqual([
      { type: "text", value: "June 17, 2026 — " },
      { type: "text", value: "Install " },
      { type: "inlineCode", value: "mppx" },
    ]);
    expect(tree.children[1].children).toHaveLength(2);
    expect(tree.children[2]).toMatchObject({
      lang: "mermaid",
      type: "code",
      value: "sequenceDiagram\nA->>B: Pay",
    });
    expect(tree.children[3]).toMatchObject({
      lang: "text",
      type: "code",
      value: "Build a paid API",
    });
  });

  it("renders SDK badges in text and flow contexts", () => {
    const tree = transform([
      paragraph([
        textComponent("SdkBadge.GitHub", [attribute("repo", "tempoxyz/mpp")]),
        textComponent("SdkBadge.Maintainer", [
          attribute("href", "https://github.com/tempoxyz"),
          attribute("name", "Tempo"),
        ]),
      ]),
      flow("SdkBadge.GitHub", [attribute("repo", "wevm/mppx")]),
    ]);

    expect(tree.children[0].children).toEqual([
      {
        children: [{ type: "text", value: "GitHub: tempoxyz/mpp" }],
        type: "link",
        url: "https://github.com/tempoxyz/mpp",
      },
      { type: "text", value: "Maintained by " },
      {
        children: [{ type: "text", value: "Tempo" }],
        type: "link",
        url: "https://github.com/tempoxyz",
      },
    ]);
    expect(tree.children[1]).toEqual(
      paragraph([
        {
          children: [{ type: "text", value: "GitHub: wevm/mppx" }],
          type: "link",
          url: "https://github.com/wevm/mppx",
        },
      ]),
    );
  });

  it("leaves unknown components unchanged after transforming their children", () => {
    const tree = transform([
      flow(
        "CustomWrapper",
        [],
        [flow("Tab", [], [paragraph([{ type: "text", value: "Child" }])])],
      ),
    ]);

    expect(tree.children).toEqual([
      flow(
        "CustomWrapper",
        [],
        [paragraph([{ type: "text", value: "Child" }])],
      ),
    ]);
  });

  it.each([
    [
      flow("Card", [
        attribute("title", "Quickstart"),
        attribute("to", "/quickstart"),
      ]),
    ],
    [
      flow("DownloadSvgButton", [
        attribute("files", expression({ type: "Identifier" })),
      ]),
    ],
    [
      flow("MermaidDiagram", [
        attribute("chart", expression({ type: "Identifier" })),
      ]),
    ],
    [flow("Tabs", [], [flow("Tab")])],
    [
      flow("BlogPostList", [
        attribute(
          "posts",
          expression({
            elements: [object({ title: literal("Missing fields") })],
            type: "ArrayExpression",
          }),
        ),
      ]),
    ],
  ])("rejects incomplete static component data", (children) => {
    expect(() => transform(children)).toThrow(TypeError);
  });
});
