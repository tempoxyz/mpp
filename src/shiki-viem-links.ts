import type { ShikiTransformer } from "shiki";

type Element = Parameters<NonNullable<ShikiTransformer["pre"]>>[0];
type Node = Element | Element["children"][number];

function rewriteLinks(node: Node) {
  if (
    "tagName" in node &&
    node.tagName === "a" &&
    typeof node.properties.href === "string" &&
    /^\/tokens\/guides\/defining-tokens(?:[?#]|$)/.test(node.properties.href)
  ) {
    node.properties.href = `https://viem.sh${node.properties.href}`;
  }
  if ("children" in node) {
    for (const child of node.children) rewriteLinks(child);
  }
}

/** Keep Viem's site-relative token guide links valid in Twoslash popups. */
export function viemTokenLinks() {
  return {
    enforce: "post",
    name: "mpp:viem-token-links",
    pre: rewriteLinks,
  } satisfies ShikiTransformer;
}
