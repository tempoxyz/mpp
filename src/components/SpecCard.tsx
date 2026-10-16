import { type ComponentType, lazy } from "react";
import type { MarkdownRenderer } from "vocs";

// Keep the module importable by the Markdown exporter: Vocs UI imports virtual icons.
const Card = lazy(async () => {
  const { Card } = await import("vocs");
  return { default: Card };
}) as ComponentType<{
  description: string;
  icon: string;
  title: string;
  to: string;
}>;

const defaultTitle = "IETF Specification";
const defaultDescription = "Read the full specification";

export function SpecCard({
  title = defaultTitle,
  description = defaultDescription,
  to,
}: {
  title?: string;
  description?: string;
  to: string;
}) {
  return (
    <Card
      description={description}
      icon="lucide:file-text"
      title={title}
      to={to}
    />
  );
}

/** Export the same link and description without loading or rendering React. */
export const markdown = {
  SpecCard: ((props, context) => {
    const {
      description = defaultDescription,
      title = defaultTitle,
      to,
    } = props;
    if (
      typeof to !== "string" ||
      typeof title !== "string" ||
      typeof description !== "string"
    )
      throw new TypeError(
        "SpecCard requires static string props for Markdown output.",
      );
    const children = [
      {
        type: "link" as const,
        url: to,
        children: [{ type: "text" as const, value: title }],
      },
      { type: "text" as const, value: ` — ${description}` },
    ];
    return context.inline ? children : [{ type: "paragraph", children }];
  }) satisfies MarkdownRenderer,
};
