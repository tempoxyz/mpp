import code from "virtual:identity-code";
import { Fragment, type ReactNode } from "react";

import { fill, paneKey, type Values } from "./code.js";
import { explanations, type SampleTier } from "./samples.js";

type Row = {
  change: 0 | 1 | -1;
  /** The part of a changed line that differs from the line it replaces, as [start, end). */
  changed?: [number, number] | undefined;
  tokens: { color: number | undefined; text: string }[];
};

/**
 * A code pane, as additions to (and deletions from) the anonymous sample: highlighted and diffed
 * at build time, so it paints final from the page's first byte and needs no highlighter.
 */
export function CodeLines({
  explain,
  name,
  now,
  tier,
  values,
}: {
  explain: boolean;
  name: string;
  now: string;
  tier: SampleTier;
  values: Values;
}) {
  const pane = code.panes[paneKey(name, tier, Boolean(values.topic))] ?? [];
  const rows: Row[] = pane.map((entry) => {
    const [line, change] =
      typeof entry === "number" ? [entry, 0 as const] : entry;
    return {
      change,
      tokens: (code.lines[line] ?? []).map((token) =>
        typeof token === "string"
          ? { color: undefined, text: fill(token, values) }
          : { color: token[1], text: fill(token[0], values) },
      ),
    };
  });
  markChanged(rows);
  const shown = rows.filter((row) => row.change !== -1);
  // The build covers every tier, so this only shows plain code if samples.ts and the build drift.
  if (`${shown.map((row) => text(row)).join("\n")}\n` !== now)
    return <pre className="code-lines code-plain">{now}</pre>;
  const notes = new Map(
    explain
      ? explanations(now).map((note) => [note.lineNumber, note.metadata])
      : [],
  );
  let lineNumber = 0;
  return (
    // Without changes there is no change bar, so no gutter for it.
    <pre
      className="code-lines"
      data-diff={rows.some((row) => row.change !== 0) || undefined}
    >
      {rows.map((row, index) => {
        const note = row.change === -1 ? undefined : notes.get(++lineNumber);
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity beyond their place
          <Fragment key={index}>
            <div
              className="code-line"
              data-change={
                row.change === 1 ? "add" : row.change === -1 ? "del" : undefined
              }
            >
              {renderTokens(row)}
            </div>
            {note && (
              <div className="code-note">
                <div className="code-explanation">{note}</div>
              </div>
            )}
          </Fragment>
        );
      })}
    </pre>
  );
}

function text(row: Row) {
  return row.tokens.map((token) => token.text).join("");
}

/** Marks what changed within lines that replace deleted lines, pairing them in order. */
function markChanged(rows: Row[]) {
  for (let i = 0; i < rows.length; i++) {
    let dels = i;
    while (rows[dels]?.change === -1) dels++;
    let adds = dels;
    while (rows[adds]?.change === 1) adds++;
    // Pairs them in order, as far as both go.
    for (let k = 0; k < Math.min(dels - i, adds - dels); k++) {
      const [del, add] = [rows[i + k]!, rows[dels + k]!];
      const [a, b] = [text(del), text(add)];
      let start = 0;
      while (start < a.length && start < b.length && a[start] === b[start])
        start++;
      let end = 0;
      while (
        end < a.length - start &&
        end < b.length - start &&
        a[a.length - 1 - end] === b[b.length - 1 - end]
      )
        end++;
      if (start + end > 0) {
        if (a.length - end > start) del.changed = [start, a.length - end];
        if (b.length - end > start) add.changed = [start, b.length - end];
      }
    }
    i = Math.max(i, adds - 1);
  }
}

/** A line's tokens, with the part that changed wrapped in one highlight. */
function renderTokens(row: Row) {
  const out: ReactNode[] = [];
  const marked: ReactNode[] = [];
  let offset = 0;
  const push = (color: number | undefined, value: string, inMark: boolean) => {
    if (!value) return;
    const target = inMark ? marked : out;
    target.push(
      color === undefined ? (
        value
      ) : (
        <span
          className={`t${color}`}
          key={`${offset}:${value.length}:${inMark}`}
        >
          {value}
        </span>
      ),
    );
  };
  const [start, end] = row.changed ?? [Number.POSITIVE_INFINITY, 0];
  for (const { color, text } of row.tokens) {
    const from = offset;
    const to = offset + text.length;
    const a = Math.min(Math.max(start, from), to) - from;
    const b = Math.min(Math.max(end, from), to) - from;
    push(color, text.slice(0, a), false);
    if (b > a) {
      if (marked.length === 0) out.push(marked);
      push(color, text.slice(a, b), true);
    }
    push(color, text.slice(Math.max(a, b)), false);
    offset = to;
  }
  return out.map((part) =>
    part === marked ? (
      <span className="code-changed" key="changed">
        {marked}
      </span>
    ) : (
      part
    ),
  );
}
