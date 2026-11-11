import code from "virtual:code";
import { Fragment } from "react";

import { fill, type Values } from "./code.js";
import { explanations } from "./samples.js";

/**
 * A code pane, highlighted at build time, so it paints final from the page's first byte. The
 * lines the current step runs are lit; the rest dim while a step is lit. Explained, notes sit
 * under the lines that matter.
 */
export function CodeLines({
  explain,
  lit,
  name,
  now,
  values,
}: {
  explain: boolean;
  /** The 1-based lines to light, or none. */
  lit: ReadonlySet<number> | undefined;
  name: string;
  now: string;
  values: Values;
}) {
  const rows = (code.panes[name] ?? []).map((line) =>
    (code.lines[line] ?? []).map((token) =>
      typeof token === "string"
        ? { color: undefined, text: fill(token, values) }
        : { color: token[1], text: fill(token[0], values) },
    ),
  );
  // The build covers every sample, so this only shows plain code if samples.ts and the build drift.
  const text = rows
    .map((row) => row.map((token) => token.text).join(""))
    .join("\n");
  if (`${text}\n` !== now)
    return <pre className="code-lines code-plain">{now}</pre>;
  const notes = new Map(
    explain
      ? explanations(now).map((note) => [note.lineNumber, note.metadata])
      : [],
  );
  return (
    <pre
      className="code-lines"
      data-lit={lit && lit.size > 0 ? true : undefined}
    >
      {rows.map((row, index) => {
        const note = notes.get(index + 1);
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity beyond their place
          <Fragment key={index}>
            <div
              className="code-line"
              data-lit={lit?.has(index + 1) || undefined}
            >
              {row.map((token, i) =>
                token.color === undefined ? (
                  token.text
                ) : (
                  // biome-ignore lint/suspicious/noArrayIndexKey: tokens never reorder
                  <span className={`t${token.color}`} key={i}>
                    {token.text}
                  </span>
                ),
              )}
              {row.length === 0 && " "}
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
