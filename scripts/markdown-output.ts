import type { MarkdownOutputTransform } from "vocs";

/** Group the current generated index before Vocs validates and hashes it. */
export const transformMarkdownOutput: MarkdownOutputTransform = ({
  index,
  pages,
}) => {
  return { index: sectionIndex(index), pages };
};

export function sectionIndex(current: string): string {
  const lines = current.split("\n");
  const firstEntry = lines.findIndex((line) => line.startsWith("- ["));
  if (firstEntry === -1) return current;

  const intro = lines.slice(0, firstEntry);
  const entries = lines
    .slice(firstEntry)
    .filter((line) => line.trim())
    .map(trimLlmsEntry);
  const groups = new Map<string, string[]>();
  for (const entry of entries) {
    const group = llmsGroupForEntry(entry);
    groups.set(group, [...(groups.get(group) ?? []), entry]);
  }

  const orderedGroups = [
    "Quickstart",
    "Guides",
    "Protocol",
    "Payment methods",
    "SDKs",
    "Services and ecosystem",
    "Blog",
    "Other",
  ];

  const next = [
    ...intro,
    ...orderedGroups.flatMap((group) => {
      const items = groups.get(group);
      if (!items?.length) return [];
      return [`## ${group}`, "", ...items, ""];
    }),
  ].join("\n");

  return next;
}

function trimLlmsEntry(entry: string): string {
  const [link, description] = entry.split(": ", 2);
  if (!description || description.length <= 90) return entry;
  return `${link}: ${description.slice(0, 87).trimEnd()}...`;
}

// Map generated page paths into coarse documentation areas. These names are
// intentionally broad so new pages fall into predictable agent-facing sections.
function llmsGroupForEntry(entry: string): string {
  const pathMatch = entry.match(/\]\(([^)]+)\)/);
  const pagePath = (pathMatch?.[1] ?? "").replace(/\.md$/, "");

  if (
    pagePath === "/index" ||
    pagePath.startsWith("/quickstart") ||
    pagePath === "/overview" ||
    pagePath === "/governance" ||
    pagePath === "/faq"
  )
    return "Quickstart";
  if (pagePath.startsWith("/guides")) return "Guides";
  if (pagePath.startsWith("/protocol") || pagePath.startsWith("/advanced"))
    return "Protocol";
  if (
    pagePath.startsWith("/payment-methods") ||
    pagePath.startsWith("/intents")
  )
    return "Payment methods";
  if (pagePath.startsWith("/sdk")) return "SDKs";
  if (
    pagePath.startsWith("/services") ||
    pagePath.startsWith("/use-cases") ||
    pagePath.startsWith("/extensions") ||
    pagePath.startsWith("/partner-integrations") ||
    pagePath === "/brand" ||
    pagePath === "/mpp-vs-x402"
  )
    return "Services and ecosystem";
  if (pagePath.startsWith("/blog")) return "Blog";
  return "Other";
}
