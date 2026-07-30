/**
 * Replaces interactive documentation components with semantic Markdown nodes.
 *
 * Vocs runs this plugin only for generated Markdown output. The React site
 * continues to render the original MDX components.
 */
export default function remarkMppMarkdown(options = {}) {
  return (tree) => {
    tree.children = transformNodes(tree.children, 2, options.blogPosts);
  };
}

function transformNodes(nodes, defaultHeadingDepth, blogPosts) {
  let headingDepth = defaultHeadingDepth - 1;
  const transformed = [];

  for (const node of nodes) {
    const replacements = transformNode(node, headingDepth, blogPosts);
    for (const replacement of replacements) {
      transformed.push(replacement);
      if (replacement.type === "heading") headingDepth = replacement.depth;
    }
  }

  return transformed;
}

function transformNode(node, headingDepth, blogPosts) {
  if (node.type !== "mdxJsxFlowElement" && node.type !== "mdxJsxTextElement")
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
      return [transformChildren(node, headingDepth, blogPosts)];
  }
}

function transformChildren(node, headingDepth, blogPosts) {
  if (!node.children) return node;
  return {
    ...node,
    children: transformNodes(node.children, headingDepth + 1, blogPosts),
  };
}

function transformTabs(node, headingDepth, blogPosts) {
  const depth = Math.min(headingDepth + 1, 6);
  const nodes = [];

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

function blogPostList(posts) {
  if (!Array.isArray(posts))
    throw new TypeError("BlogPostList requires configured blogPosts.");
  return {
    type: "list",
    ordered: false,
    spread: true,
    children: posts.map((post) => {
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

function landingPage(posts) {
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

function requiredRecordString(value, key, context) {
  if (
    !value ||
    typeof value !== "object" ||
    typeof value[key] !== "string" ||
    value[key].length === 0
  )
    throw new TypeError(`${context} requires a static ${key} string.`);
  return value[key];
}

function card(node) {
  return linkCard({
    description: requiredString(node, "description"),
    title: requiredString(node, "title"),
    to: requiredString(node, "to"),
  });
}

function downloadLinks(node) {
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

function mermaidDiagram(node) {
  return {
    type: "code",
    lang: "mermaid",
    value: requiredString(node, "chart"),
  };
}

function mppxCreateReferenceCard(node) {
  return linkCard({
    description: "Full API documentation",
    title: "Mppx.create reference",
    to: requiredString(node, "to"),
  });
}

function promptBlock(node) {
  return {
    type: "code",
    lang: "text",
    value: node.children.map(expressionText).join(""),
  };
}

function badgeGithub(node) {
  const repo = requiredString(node, "repo");
  return componentNodes(node, [
    link(`https://github.com/${repo}`, [text(`GitHub: ${repo}`)]),
  ]);
}

function badgeMaintainer(node) {
  return componentNodes(node, [
    text("Maintained by "),
    link(requiredString(node, "href"), [text(requiredString(node, "name"))]),
  ]);
}

function specCard(node) {
  return linkCard({
    description:
      stringAttribute(node, "description") ?? "Read the full specification",
    title: stringAttribute(node, "title") ?? "IETF Specification",
    to: requiredString(node, "to"),
  });
}

function componentNodes(node, children) {
  return node.type === "mdxJsxTextElement" ? children : [paragraph(children)];
}

function linkCard({ description, title, to }) {
  return paragraph([link(to, [text(title)]), text(` — ${description}`)]);
}

function requiredString(node, name) {
  const value = stringAttribute(node, name);
  if (value === undefined)
    throw new TypeError(
      `${node.name} requires a static ${name} attribute for Markdown output.`,
    );
  return value;
}

function requiredArray(node, name) {
  const value = attributeValue(node, name);
  if (!Array.isArray(value))
    throw new TypeError(
      `${node.name} requires a static ${name} array for Markdown output.`,
    );
  return value;
}

function stringAttribute(node, name) {
  const value = attributeValue(node, name);
  return typeof value === "string" ? value : undefined;
}

function attributeValue(node, name) {
  const attribute = node.attributes.find(
    (candidate) =>
      candidate.type === "mdxJsxAttribute" && candidate.name === name,
  );
  if (!attribute) return undefined;
  if (typeof attribute.value === "string") return attribute.value;
  return expressionValue(attribute.value?.data?.estree?.body?.[0]?.expression);
}

function expressionText(node) {
  if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression")
    return (
      expressionValue(node.data?.estree?.body?.[0]?.expression) ??
      node.value ??
      ""
    );
  return inlineNodes(node)
    .map((child) => child.value ?? "")
    .join("");
}

function expressionValue(expression) {
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
      expression.properties.map((property) => [
        property.key.name ?? property.key.value,
        property.value,
      ]),
    );
  }
  return expression;
}

function inlineNodes(node) {
  if (typeof node === "string") return [text(node)];
  if (node?.type === "Literal") return [text(String(node.value))];
  if (node?.type === "JSXText") return [text(node.value)];
  if (node?.type === "JSXFragment") return node.children.flatMap(inlineNodes);
  if (node?.type === "JSXElement") {
    const children = node.children.flatMap(inlineNodes);
    const name = node.openingElement.name.name;
    if (name === "code")
      return [
        {
          type: "inlineCode",
          value: children.map((child) => child.value).join(""),
        },
      ];
    return children;
  }
  if (node?.type === "JSXExpressionContainer")
    return inlineNodes(node.expression);
  return [text(String(node ?? ""))];
}

function isComponent(node, name) {
  return (
    (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
    node.name === name
  );
}

function heading(depth, value) {
  return { type: "heading", depth, children: [text(value)] };
}

function link(url, children) {
  return { type: "link", url, children };
}

function paragraph(children) {
  return { type: "paragraph", children };
}

function text(value) {
  return { type: "text", value };
}
