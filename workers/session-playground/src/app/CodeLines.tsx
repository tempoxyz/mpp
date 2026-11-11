import code from "virtual:code";

import { fill, type Values } from "./code.js";

/**
 * A code pane, highlighted at build time, so it paints final from the page's first byte. The
 * lines the current step runs are lit; the rest dim while a step is lit.
 */
export function CodeLines({
  lit,
  name,
  now,
  values,
}: {
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
  return (
    <pre
      className="code-lines"
      data-lit={lit && lit.size > 0 ? true : undefined}
    >
      {rows.map((row, index) => (
        <div
          className="code-line"
          data-lit={lit?.has(index + 1) || undefined}
          // biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity beyond their place
          key={index}
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
      ))}
    </pre>
  );
}
