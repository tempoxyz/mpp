// The code panes' highlighter, loaded lazily: @pierre/diffs bundles Shiki.
import { File, MultiFileDiff } from "@pierre/diffs/react";
import type { ReactNode } from "react";

import type { explanations } from "./samples.js";

/** One file, or its additions to the anonymous base when it differs. */
export default function CodeView({
  annotations,
  name,
  now,
  old,
  renderAnnotation,
}: {
  annotations: ReturnType<typeof explanations>;
  name: string;
  now: string;
  old: string;
  renderAnnotation: (annotation: { metadata: string }) => ReactNode;
}) {
  if (old === now)
    return (
      <File
        file={{ contents: now, name }}
        lineAnnotations={annotations}
        options={codeOptions}
        renderAnnotation={renderAnnotation}
      />
    );
  return (
    <MultiFileDiff
      lineAnnotations={annotations.map((annotation) => ({
        ...annotation,
        side: "additions" as const,
      }))}
      renderAnnotation={renderAnnotation}
      newFile={{ contents: now, name }}
      oldFile={{ contents: old, name }}
      options={{ ...codeOptions, diffStyle: "unified", expandUnchanged: true }}
    />
  );
}

const codeOptions = {
  disableFileHeader: true,
  disableLineNumbers: true,
  overflow: "wrap",
  theme: { dark: "github-dark-dimmed", light: "github-light" },
  themeType: "dark",
} as const;
