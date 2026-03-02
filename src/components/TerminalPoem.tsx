"use client";

import { Terminal } from "./Terminal";
import { poem } from "./terminal-steps";

const STEPS = [poem()];

export function TerminalPoem() {
  return <Terminal className="h-full" steps={STEPS} />;
}
