"use client";

import { code, withMarkdown } from "./markdown";
import { Terminal } from "./Terminal";
import { gallery } from "./terminal-steps";

const STEPS = [gallery()];

export const TerminalGallery = withMarkdown(
  function TerminalGallery() {
    return <Terminal className="h-full" steps={STEPS} />;
  },
  () =>
    code(
      "GET /api/sessions/photo\n\n402 Payment Required\n\nOpen a Tempo payment session and pay $0.01 for each photo.",
    ),
);
