"use client";

import { Terminal } from "./Terminal";
import { gallery } from "./terminal-steps";

const STEPS = [gallery()];

export function TerminalGallery() {
  return <Terminal className="h-full" steps={STEPS} />;
}
