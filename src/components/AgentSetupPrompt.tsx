"use client";

import { useEffect, useRef, useState } from "react";
import { code, withMarkdown } from "./markdown";
import { Icon } from "./marketing/Icon";

export const AGENT_SETUP_PROMPT =
  "Read https://tempo.xyz/SKILL.md and set up tempo";

type AgentSetupPromptProps = {
  manualSetupHref?: string;
  variant?: "docs" | "marketing";
};

/** Displays the canonical Tempo setup prompt with a copy action. */
export const AgentSetupPrompt = withMarkdown(
  function AgentSetupPrompt({
    manualSetupHref = "#manual-setup",
    variant = "docs",
  }: AgentSetupPromptProps) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);

    const docs = variant === "docs";
    const copyPrompt = async () => {
      try {
        await navigator.clipboard.writeText(AGENT_SETUP_PROMPT);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 1800);
      } catch {}
    };

    return (
      <div
        className={
          docs
            ? "vocs:my-6 vocs:flex vocs:flex-col vocs:gap-3"
            : "flex flex-col gap-3"
        }
      >
        <p
          className={
            docs
              ? "vocs:m-0 vocs:text-heading"
              : "font-sans text-sm leading-[1.2] text-offwhite"
          }
        >
          Paste this into Codex, Claude Code, Amp, or another coding agent:
        </p>
        {docs ? (
          <button
            aria-label={
              copied ? "Copied — paste into your agent" : "Copy prompt"
            }
            className="vocs:flex vocs:w-full vocs:flex-col vocs:items-start vocs:gap-3 vocs:rounded-lg vocs:border vocs:border-primary vocs:bg-surface vocs:p-4 vocs:text-left vocs:transition-colors vocs:hover:bg-surfaceTint vocs:sm:flex-row vocs:sm:items-center vocs:sm:justify-between"
            onClick={copyPrompt}
            type="button"
          >
            <code className="vocs:min-w-0 vocs:whitespace-pre-wrap vocs:break-words vocs:font-mono vocs:text-sm vocs:text-heading">
              {AGENT_SETUP_PROMPT}
            </code>
            <span
              aria-live="polite"
              className="vocs:inline-flex vocs:shrink-0 vocs:items-center vocs:gap-2 vocs:rounded-md vocs:border vocs:border-primary vocs:px-3 vocs:py-2 vocs:text-sm vocs:font-medium vocs:text-secondary"
            >
              {copied ? "Copied — paste into your agent" : "Copy prompt"}
              <Icon className="shrink-0" name="copy" />
            </span>
          </button>
        ) : (
          <div className="flex w-full items-start gap-3 border border-border bg-[#101010] p-3">
            <code className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-sm leading-[1.4] text-offwhite">
              {AGENT_SETUP_PROMPT}
            </code>
            <button
              aria-label={copied ? "Copied to clipboard" : "Copy prompt"}
              className={
                copied
                  ? "ml-auto inline-flex shrink-0 border border-term-green p-1.5 text-term-green"
                  : "ml-auto inline-flex shrink-0 border border-border p-1.5 text-secondary transition-colors hover:border-[rgba(235,235,235,0.4)] hover:text-offwhite"
              }
              onClick={copyPrompt}
              title={copied ? "Copied" : "Copy prompt"}
              type="button"
            >
              <Icon name="copy" size={14} />
            </button>
          </div>
        )}
        <p
          className={
            docs
              ? "vocs:m-0 vocs:text-secondary"
              : "font-sans text-sm leading-[1.2] text-secondary"
          }
        >
          Your agent installs Tempo, pauses when browser and passkey login is
          required, and verifies your wallet.{" "}
          <a
            className={
              docs
                ? "vocs:underline"
                : "underline transition-colors hover:text-offwhite"
            }
            href={manualSetupHref}
          >
            Manual setup
          </a>
        </p>
      </div>
    );
  },
  () => [
    {
      children: [
        {
          type: "text",
          value:
            "Paste this into Codex, Claude Code, Amp, or another coding agent:",
        },
      ],
      type: "paragraph",
    },
    code(AGENT_SETUP_PROMPT),
    {
      children: [
        {
          type: "text",
          value:
            "Your agent installs Tempo, pauses when browser and passkey login is required, and verifies your wallet.",
        },
      ],
      type: "paragraph",
    },
  ],
);
