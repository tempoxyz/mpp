import { Fragment } from "react";

import { type Code, explanations, type Note } from "./code.js";

/**
 * A code pane, highlighted at build time, so it paints final from the page's first byte.
 * Explained, notes sit under the lines that matter.
 */
export function CodeLines({
  code,
  explain,
  name,
  notes,
  now,
}: {
  code: Code;
  explain: boolean;
  name: string;
  notes: readonly Note[];
  now: string;
}) {
  const rows = (code.panes[name] ?? []).map((line) =>
    (code.lines[line] ?? []).map((token) =>
      typeof token === "string"
        ? { color: undefined, text: token }
        : { color: token[1], text: token[0] },
    ),
  );
  // The build covers every sample, so this only shows plain code if samples and the build drift.
  const text = rows
    .map((row) => row.map((token) => token.text).join(""))
    .join("\n");
  if (`${text}\n` !== now)
    return <pre className="code-lines code-plain">{now}</pre>;
  return <Lines explain={explain} notes={notes} rows={rows} source={now} />;
}

type Row = { color: number | string | undefined; text: string }[];

/** Rows of colored tokens, with notes under the lines that matter when explained. */
export function Lines({
  explain,
  notes,
  rows,
  source,
}: {
  explain: boolean;
  notes: readonly Note[];
  rows: Row[];
  source: string;
}) {
  const shown = new Map(
    explain
      ? explanations(source, notes).map((note) => [
          note.lineNumber,
          note.metadata,
        ])
      : [],
  );
  return (
    <pre className="code-lines">
      {rows.map((row, index) => {
        const note = shown.get(index + 1);
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity beyond their place
          <Fragment key={index}>
            <div className="code-line">
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
