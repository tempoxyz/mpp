"use client";

import { code, withMarkdown } from "./markdown";
import { Terminal } from "./Terminal";
import { poem } from "./terminal-steps";

const STEPS = [poem()];

export const TerminalPoem = withMarkdown(
  function TerminalPoem() {
    return <Terminal className="h-full" steps={STEPS} />;
  },
  () =>
    code(
      "GET /api/sessions/poem\n\n402 Payment Required\n\nOpen a Tempo payment session and pay for streamed output.",
    ),
);
