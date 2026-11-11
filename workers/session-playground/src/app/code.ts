// The code panes, highlighted and diffed at build time (vite.config.ts, prerenderCode): the page
// ships neither Shiki nor a diff renderer, only each pane's lines and the colors they use.

/** The Shiki theme the panes are highlighted in, at build time only. */
export const theme = "github-dark-dimmed";

/** Stand-ins for what the visitor picks: highlighted as strings, filled in as they pick. */
export const slots = { deposit: "__MPP_DEPOSIT__" } as const;

export type Values = { deposit: string };

/** A token: its text alone in the default color, or its text and its color's class (.t0, .t1…). */
export type Token = string | [text: string, color: number];

/** A pane's line: an index into lines, unchanged, or with 1 added or -1 deleted from the base. */
export type PaneLine = number | [line: number, change: 1 | -1];

export type Code = {
  /** Every distinct line of every pane, once. */
  lines: Token[][];
  /** Each pane's lines: client.ts and server.ts, and with :explain, diffed from a per-request charge. */
  panes: Record<string, PaneLine[]>;
};

/** Fills the visitor's values into a token's slots. */
export function fill(text: string, values: Values) {
  return text.includes(slots.deposit)
    ? text.replace(slots.deposit, () => values.deposit)
    : text;
}
