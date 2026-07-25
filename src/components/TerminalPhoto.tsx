"use client";

import { code, withMarkdown } from "./markdown";
import { Terminal } from "./Terminal";
import { photo } from "./terminal-steps";

const STEPS = [photo()];

export const TerminalPhoto = withMarkdown(
  function TerminalPhoto() {
    return <Terminal className="h-full" steps={STEPS} />;
  },
  () =>
    code(
      "GET /api/photo\n\n402 Payment Required\n\nPay $0.01 with Tempo to receive a photo.",
    ),
);
