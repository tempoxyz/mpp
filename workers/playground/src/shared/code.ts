// Code panes highlighted at build time (shared/prerender-code.ts): the page ships no
// highlighter, only each pane's lines and the colors they use.

/** The Shiki theme the panes are highlighted in, at build time only. */
export const theme = "github-dark-dimmed";

/** A token: its text alone in the default color, or its text and its color's class (.t0, .t1…). */
export type Token = string | [text: string, color: number];

export type Code = {
  /** Every distinct line of every pane, once. */
  lines: Token[][];
  /** Each pane's lines, as indexes into lines. */
  panes: Record<string, number[]>;
};

/** A note under the first line that starts with its prefix. */
export type Note = readonly [prefix: string, note: string];

/** Notes under the lines that matter, anchored to their text so edits can't shift them. */
export function explanations(source: string, notes: readonly Note[]) {
  return source.split("\n").flatMap((line, index) => {
    const note = notes.find(([prefix]) => line.trimStart().startsWith(prefix));
    return note ? [{ lineNumber: index + 1, metadata: note[1] }] : [];
  });
}
