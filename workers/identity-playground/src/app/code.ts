// The code panes, highlighted and diffed at build time (vite.config.ts, prerenderCode): the page
// ships neither Shiki nor a diff renderer, only each pane's lines and the colors they use.
import type { SampleTier } from "./samples.js";

/** The Shiki theme the panes are highlighted in, at build time only. */
export const theme = "github-dark-dimmed";

/** Stand-ins for what the visitor types: highlighted as strings, filled in as they type. */
export const slots = {
  apiKey: "__MPP_API_KEY__",
  email: "__MPP_EMAIL__",
  topic: "__MPP_TOPIC__",
} as const;

export type Values = { apiKey: string; email: string; topic: string };

/** A token: its text alone in the default color, or its text and its color's class (.t0, .t1…). */
export type Token = string | [text: string, color: number];

/** A pane's line: an index into lines, unchanged, or with 1 added or -1 deleted from the base. */
export type PaneLine = number | [line: number, change: 1 | -1];

export type Code = {
  /** Every distinct line of every pane, once. */
  lines: Token[][];
  /** Each pane's lines, by paneKey. */
  panes: Record<string, PaneLine[]>;
};

/** A pane's variant: client.ts gains a line when there is a topic. */
export function paneKey(name: string, tier: SampleTier, topic: boolean) {
  return `${name}:${tier}${name === "client.ts" && topic ? ":topic" : ""}`;
}

/** Fills the visitor's values into a token's slots, escaped and defaulted as usage() writes them. */
export function fill(text: string, values: Values) {
  if (!text.includes("__MPP_")) return text;
  const quoted = (value: string) => JSON.stringify(value).slice(1, -1);
  return text
    .replace(slots.email, () => quoted(values.email || "you@example.com"))
    .replace(slots.apiKey, () => quoted(values.apiKey || "haiku-demo-key"))
    .replace(slots.topic, () => quoted(values.topic));
}
