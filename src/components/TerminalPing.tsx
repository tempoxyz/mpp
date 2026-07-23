"use client";

import { code, withMarkdown } from "./markdown";
import { Terminal } from "./Terminal";
import { ping } from "./terminal-steps";

const STEPS = [ping()];

export const TerminalPing = withMarkdown(
  function TerminalPing() {
    return <Terminal className="h-full" steps={STEPS} />;
  },
  () =>
    code(
      "GET /api/ping/paid\n\n402 Payment Required\n\nPay $0.001 with Tempo.\n\n200 OK\npong",
    ),
);
