import type {
  Expression,
  JSXElement,
  JSXExpressionContainer,
  JSXFragment,
  JSXText,
  Program,
  SpreadElement,
} from "estree-jsx";
import type {
  Code,
  Heading,
  Link,
  List,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Text,
} from "mdast";
import type {} from "mdast-util-mdx-expression";
import type { MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx-jsx";

type BlogPost = {
  date: string;
  description: string;
  title: string;
  to: string;
};

type MdxJsxElement = MdxJsxFlowElement | MdxJsxTextElement;
type Options = { blogPosts?: unknown };

/**
 * Replaces interactive documentation components with semantic Markdown nodes.
 *
 * Vocs runs this plugin only for generated Markdown output. The React site
 * continues to render the original MDX components.
 */
export default function remarkMppMarkdown(options: Options = {}) {
  return (tree: Root) => {
    tree.children = transformNodes(tree.children, 2, options.blogPosts);
  };
}

function transformNodes(
  nodes: RootContent[],
  defaultHeadingDepth: number,
  blogPosts: unknown,
): RootContent[] {
  let headingDepth = defaultHeadingDepth - 1;
  const transformed: RootContent[] = [];

  for (const node of nodes) {
    const replacements = transformNode(node, headingDepth, blogPosts);
    for (const replacement of replacements) {
      transformed.push(replacement);
      if (replacement.type === "heading") headingDepth = replacement.depth;
    }
  }

  return transformed;
}

function transformNode(
  node: RootContent,
  headingDepth: number,
  blogPosts: unknown,
): RootContent[] {
  if (!isMdxJsxElement(node))
    return [transformChildren(node, headingDepth, blogPosts)];

  switch (node.name) {
    case "Badge":
    case "Cards":
    case "Tab":
      return transformNodes(node.children, headingDepth + 1, blogPosts);
    case "Tabs":
      return transformTabs(node, headingDepth, blogPosts);
    case "BlogPostList":
      return [blogPostList(blogPosts)];
    case "BlogIndexPage":
      return [heading(2, "See updates"), blogPostList(blogPosts)];
    case "Card":
      return [card(node)];
    case "DownloadSvgButton":
      return [downloadLinks(node)];
    case "LandingPage":
      return landingPage(blogPosts);
    case "MermaidDiagram":
      return [mermaidDiagram(node)];
    case "MppxCreateReferenceCard":
      return [mppxCreateReferenceCard(node)];
    case "PromptBlock":
      return [promptBlock(node)];
    case "ServicesPage":
      return [
        heading(2, "Browse services"),
        paragraph([
          text("Browse payment-enabled services in "),
          link("/services/llms.txt", [text("the services llms.txt catalog")]),
          text("."),
        ]),
      ];
    case "SdkBadge.GitHub":
      return badgeGithub(node);
    case "SdkBadge.Maintainer":
      return badgeMaintainer(node);
    case "SpecCard":
      return [specCard(node)];
    default:
      // Imported static components run their `toMarkdown` hooks before this
      // plugin. Preserve anything else so `vocs markdown-audit` reports it.
      return [transformChildren(node, headingDepth, blogPosts)];
  }
}

function transformChildren(
  node: RootContent,
  headingDepth: number,
  blogPosts: unknown,
): RootContent {
  if (!("children" in node) || !Array.isArray(node.children)) return node;
  return {
    ...node,
    children: transformNodes(node.children, headingDepth + 1, blogPosts),
  } as RootContent;
}

function transformTabs(
  node: MdxJsxElement,
  headingDepth: number,
  blogPosts: unknown,
): RootContent[] {
  const depth = Math.min(headingDepth + 1, 6) as Heading["depth"];
  const nodes: RootContent[] = [];

  for (const child of node.children) {
    if (!isComponent(child, "Tab")) {
      nodes.push(...transformNode(child, depth, blogPosts));
      continue;
    }

    nodes.push(heading(depth, requiredString(child, "title")));
    nodes.push(...transformNodes(child.children, depth + 1, blogPosts));
  }

  return nodes;
}

function blogPostList(posts: unknown): List {
  if (!Array.isArray(posts))
    throw new TypeError("BlogPostList requires configured blogPosts.");
  return {
    type: "list",
    ordered: false,
    spread: true,
    children: (posts as unknown[]).map((post) => {
      const date = requiredRecordString(post, "date", "BlogPostList post");
      const description = requiredRecordString(
        post,
        "description",
        "BlogPostList post",
      );
      const title = requiredRecordString(post, "title", "BlogPostList post");
      const to = requiredRecordString(post, "to", "BlogPostList post");
      return {
        type: "listItem",
        spread: true,
        children: [
          paragraph([link(to, [text(title)])]),
          paragraph([text(`${date} — ${description}`)]),
        ],
      };
    }),
  };
}

function landingPage(posts: unknown): RootContent[] {
  return [
    heading(2, "Start building"),
    linkCard({
      description: "Accept your first payment with MPP",
      title: "Quickstart",
      to: "/quickstart",
    }),
    heading(2, "Latest from the blog"),
    blogPostList(posts),
  ];
}

function requiredRecordString(
  value: unknown,
  key: keyof BlogPost,
  context: string,
): string {
  if (
    !isRecord(value) ||
    typeof value[key] !== "string" ||
    value[key].length === 0
  )
    throw new TypeError(`${context} requires a static ${key} string.`);
  return value[key];
}

function card(node: MdxJsxElement): Paragraph {
  return linkCard({
    description: requiredString(node, "description"),
    title: requiredString(node, "title"),
    to: requiredString(node, "to"),
  });
}

function downloadLinks(node: MdxJsxElement): List {
  const files = requiredArray(node, "files");
  return {
    type: "list",
    ordered: false,
    spread: false,
    children: files.map((file) => {
      if (typeof file !== "string")
        throw new TypeError("DownloadSvgButton files must be static strings.");
      return {
        type: "listItem",
        spread: false,
        children: [
          paragraph([link(file, [text(file.split("/").at(-1) ?? file)])]),
        ],
      };
    }),
  };
}

function mermaidDiagram(node: MdxJsxElement): Code {
  return {
    type: "code",
    lang: "mermaid",
    value: requiredString(node, "chart"),
  };
}

function mppxCreateReferenceCard(node: MdxJsxElement): Paragraph {
  return linkCard({
    description: "Full API documentation",
    title: "Mppx.create reference",
    to: requiredString(node, "to"),
  });
}

function promptBlock(node: MdxJsxElement): Code {
  return {
    type: "code",
    lang: "text",
    value: node.children.map(expressionText).join(""),
  };
}

function badgeGithub(node: MdxJsxElement): RootContent[] {
  const repo = requiredString(node, "repo");
  return componentNodes(node, [
    link(`https://github.com/${repo}`, [text(`GitHub: ${repo}`)]),
  ]);
}

function badgeMaintainer(node: MdxJsxElement): RootContent[] {
  return componentNodes(node, [
    text("Maintained by "),
    link(requiredString(node, "href"), [text(requiredString(node, "name"))]),
  ]);
}

function specCard(node: MdxJsxElement): Paragraph {
  return linkCard({
    description:
      stringAttribute(node, "description") ?? "Read the full specification",
    title: stringAttribute(node, "title") ?? "IETF Specification",
    to: requiredString(node, "to"),
  });
}

function componentNodes(
  node: MdxJsxElement,
  children: PhrasingContent[],
): RootContent[] {
  return node.type === "mdxJsxTextElement" ? children : [paragraph(children)];
}

function linkCard({
  description,
  title,
  to,
}: {
  description: string;
  title: string;
  to: string;
}): Paragraph {
  return paragraph([link(to, [text(title)]), text(` — ${description}`)]);
}

function requiredString(node: MdxJsxElement, name: string): string {
  const value = stringAttribute(node, name);
  if (value === undefined)
    throw new TypeError(
      `${node.name} requires a static ${name} attribute for Markdown output.`,
    );
  return value;
}

function requiredArray(node: MdxJsxElement, name: string): unknown[] {
  const value = attributeValue(node, name);
  if (!Array.isArray(value))
    throw new TypeError(
      `${node.name} requires a static ${name} array for Markdown output.`,
    );
  return value;
}

function stringAttribute(
  node: MdxJsxElement,
  name: string,
): string | undefined {
  const value = attributeValue(node, name);
  return typeof value === "string" ? value : undefined;
}

function attributeValue(node: MdxJsxElement, name: string): unknown {
  const attribute = node.attributes.find(
    (candidate) =>
      candidate.type === "mdxJsxAttribute" && candidate.name === name,
  );
  if (attribute?.type !== "mdxJsxAttribute") return undefined;
  if (typeof attribute.value === "string") return attribute.value;
  return expressionValue(programExpression(attribute.value?.data?.estree));
}

function expressionText(node: RootContent): string {
  if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression")
    return String(
      expressionValue(programExpression(node.data?.estree)) ?? node.value ?? "",
    );
  return inlineNodes(node).map(inlineValue).join("");
}

function expressionValue(
  expression: Expression | SpreadElement | null | undefined,
): unknown {
  if (!expression) return undefined;
  if (expression.type === "Literal") return expression.value;
  if (expression.type === "TemplateLiteral") {
    if (expression.expressions.length > 0) return undefined;
    return expression.quasis
      .map((quasi) => quasi.value.cooked ?? quasi.value.raw)
      .join("");
  }
  if (expression.type === "ArrayExpression")
    return expression.elements.map(expressionValue);
  if (expression.type === "ObjectExpression") {
    return Object.fromEntries(
      expression.properties.map((property) => {
        if (property.type === "SpreadElement")
          return ["...", property.argument];
        return [propertyKey(property.key), property.value];
      }),
    );
  }
  return expression;
}

function inlineNodes(node: unknown): PhrasingContent[] {
  if (typeof node === "string") return [text(node)];
  if (!isRecord(node) || typeof node.type !== "string")
    return [text(String(node ?? ""))];
  if (node.type === "Literal" && "value" in node)
    return [text(String(node.value))];
  if (node.type === "JSXText")
    return [text((node as unknown as JSXText).value)];
  if (node.type === "JSXFragment")
    return (node as unknown as JSXFragment).children.flatMap(inlineNodes);
  if (node.type === "JSXElement") {
    const element = node as unknown as JSXElement;
    const children = element.children.flatMap(inlineNodes);
    const name =
      element.openingElement.name.type === "JSXIdentifier"
        ? element.openingElement.name.name
        : undefined;
    if (name === "code")
      return [
        {
          type: "inlineCode",
          value: children.map(inlineValue).join(""),
        },
      ];
    return children;
  }
  if (node?.type === "JSXExpressionContainer")
    return inlineNodes((node as unknown as JSXExpressionContainer).expression);
  return [text(String(node ?? ""))];
}

function isMdxJsxElement(node: RootContent): node is MdxJsxElement {
  return node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement";
}

function isComponent(node: RootContent, name: string): node is MdxJsxElement {
  return (
    (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
    node.name === name
  );
}

function heading(depth: Heading["depth"], value: string): Heading {
  return { type: "heading", depth, children: [text(value)] };
}

function link(url: string, children: PhrasingContent[]): Link {
  return { type: "link", url, children };
}

function paragraph(children: PhrasingContent[]): Paragraph {
  return { type: "paragraph", children };
}

function text(value: string): Text {
  return { type: "text", value };
}

function inlineValue(node: PhrasingContent): string {
  return "value" in node && typeof node.value === "string" ? node.value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function programExpression(
  program: Program | null | undefined,
): Expression | undefined {
  const statement = program?.body[0];
  return statement && "expression" in statement
    ? (statement.expression as Expression)
    : undefined;
}

function propertyKey(key: Expression): string {
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal") return String(key.value);
  return String(expressionValue(key));
}
