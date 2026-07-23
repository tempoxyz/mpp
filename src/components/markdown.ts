type MarkdownNode = {
  children?: MarkdownNode[];
  depth?: number;
  lang?: string;
  ordered?: boolean;
  spread?: boolean;
  start?: number;
  type: string;
  url?: string;
  value?: string;
};

type MarkdownComponent = {
  toMarkdown: () => MarkdownNode | MarkdownNode[];
};

export function code(value: string, lang = "text"): MarkdownNode {
  return { lang, type: "code", value };
}

export function linkCard({
  description,
  title,
  to,
}: {
  description: string;
  title: string;
  to: string;
}): MarkdownNode {
  return {
    children: [
      { children: [{ type: "text", value: title }], type: "link", url: to },
      { type: "text", value: ` — ${description}` },
    ],
    type: "paragraph",
  };
}

export function withMarkdown<Component extends object>(
  component: Component,
  toMarkdown: MarkdownComponent["toMarkdown"],
): Component & MarkdownComponent {
  return Object.assign(component, { toMarkdown });
}
