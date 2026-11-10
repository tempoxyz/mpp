// The code panes' highlighter, loaded lazily: @pierre/diffs bundles Shiki.

import prerendered from "virtual:prerendered-diffs";
import { File, MultiFileDiff } from "@pierre/diffs/react";
import { type ReactNode, type RefObject, useEffect, useRef } from "react";

import { codeOptions } from "./codeOptions.js";
import type { explanations } from "./samples.js";

/** One file, or its additions to the anonymous base when it differs. */
export default function CodeView({
  annotations,
  name,
  now,
  old,
  onPaint,
  renderAnnotation,
}: {
  annotations: ReturnType<typeof explanations>;
  name: string;
  now: string;
  old: string;
  onPaint: () => void;
  renderAnnotation: (annotation: { metadata: string }) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  usePainted(ref, onPaint);
  return (
    <div ref={ref}>
      {old === now ? (
        <File
          file={{ contents: now, name }}
          // The build-time render of this exact file, as diffs.com does it: the pane shows final
          // highlighted code as soon as it mounts, without waiting for Shiki to start.
          prerenderedHTML={
            annotations.length === 0 && prerendered[name]?.source === now
              ? prerendered[name].html
              : undefined
          }
          lineAnnotations={annotations}
          options={codeOptions}
          renderAnnotation={renderAnnotation}
        />
      ) : (
        <MultiFileDiff
          lineAnnotations={annotations.map((annotation) => ({
            ...annotation,
            side: "additions" as const,
          }))}
          renderAnnotation={renderAnnotation}
          newFile={{ contents: now, name }}
          oldFile={{ contents: old, name }}
          options={{
            ...codeOptions,
            diffStyle: "unified",
            expandUnchanged: true,
          }}
        />
      )}
    </div>
  );
}

/**
 * Calls onPaint once the highlighter has drawn the code: @pierre/diffs renders into a shadow
 * root with empty lines first, and fills them in once Shiki has started.
 */
function usePainted(
  ref: RefObject<HTMLDivElement | null>,
  onPaint: () => void,
) {
  useEffect(() => {
    const painted = () =>
      ref.current
        ?.querySelector("diffs-container")
        ?.shadowRoot?.querySelector("code span[style]") != null;
    if (painted()) return onPaint();
    const timer = setInterval(() => {
      if (!painted()) return;
      clearInterval(timer);
      onPaint();
    }, 50);
    return () => clearInterval(timer);
  }, [ref, onPaint]);
}
