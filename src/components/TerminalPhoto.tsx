"use client";

import { Terminal } from "./Terminal";
import { photo } from "./terminal-steps";

const STEPS = [photo()];

export function TerminalPhoto() {
  return <Terminal className="h-full" steps={STEPS} />;
}
