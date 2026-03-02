"use client";

import { Terminal } from "./Terminal";
import { ping } from "./terminal-steps";

const STEPS = [ping()];

export function TerminalPing() {
  return <Terminal className="h-full" steps={STEPS} />;
}
