"use client";

import { useState } from "react";
import { code, withMarkdown } from "./markdown";
import { TerminalGallery } from "./TerminalGallery";
import { TerminalPoem } from "./TerminalPoem";

const DEMOS = [
  { id: "per-request", label: "Per request" },
  { id: "streaming", label: "Streaming" },
] as const;

type DemoId = (typeof DEMOS)[number]["id"];

/** Shows one usage-based demo at a time; the terminal handles keys page-wide. */
export const UsageDemo = withMarkdown(
  function UsageDemo() {
    const [demo, setDemo] = useState<DemoId>("per-request");
    return (
      <div className="flex h-full flex-col gap-2">
        <div className="flex gap-2">
          {DEMOS.map(({ id, label }) => (
            <button
              aria-pressed={demo === id}
              className={
                demo === id
                  ? "border border-current px-3 py-1 text-offwhite"
                  : "border border-transparent px-3 py-1 text-secondary"
              }
              key={id}
              onClick={() => setDemo(id)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          {demo === "per-request" ? <TerminalGallery /> : <TerminalPoem />}
        </div>
      </div>
    );
  },
  () =>
    code(
      "GET /api/sessions/photo\n\n402 Payment Required\n\nOpen a Tempo payment session and pay $0.01 for each photo.\n\nGET /api/sessions/poem\n\n402 Payment Required\n\nOpen a Tempo payment session and pay for streamed output.",
    ),
);
