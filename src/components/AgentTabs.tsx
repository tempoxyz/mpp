"use client";

import { useCallback, useRef, useState } from "react";

const AGENT_COLOR = "#e8873a";
const CMD_PURPLE = "#c084fc";
const WALLET_GREEN = "#4ade80";
const FLAG_GREY = "var(--vocs-text-color-muted)";
const WALLET_INSTALL = "curl -fsSL https://tempo.xyz/install | bash";
const WALLET_LOGIN = "tempo wallet login";
const QUICKSTART_URL = "https://mpp.dev/quickstart/client.md";
const SERVICES_URL = "https://mpp.dev/llms.txt";

function CopyIcon({ copied }: { copied: boolean }) {
  const color = copied
    ? "var(--vocs-text-color-heading)"
    : "var(--vocs-text-color-muted)";
  return copied ? (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3.127 10.604l3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z" />
    </svg>
  );
}
function CodexLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}
function AmpLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.9197 13.61L17.3816 26.566L14.242 27.4049L11.2645 16.2643L0.119926 13.2906L0.957817 10.15L13.9197 13.61Z" />
      <path d="M13.7391 16.0892L4.88169 24.9056L2.58872 22.6019L11.4461 13.7865L13.7391 16.0892Z" />
      <path d="M18.9386 8.58315L22.4005 21.5392L19.2609 22.3781L16.2833 11.2374L5.13879 8.26381L5.97668 5.12318L18.9386 8.58315Z" />
      <path d="M23.9803 3.55632L27.4422 16.5124L24.3025 17.3512L21.325 6.21062L10.1805 3.23698L11.0183 0.0963593L23.9803 3.55632Z" />
    </svg>
  );
}

const SETUP_PROMPT = `"Add ${QUICKSTART_URL} (MPP quickstart) & ${SERVICES_URL} (MPP service endpoints) to my SKILLS.md for future reference."`;
const TASK_PROMPT = `"Use fal.ai to generate a logo for my startup called 'Moonshot Labs' - modern, minimal, space themed."`;

const AGENTS = [
  { label: "Claude", bin: "claude", args: "-p", icon: ClaudeLogo },
  { label: "Codex", bin: "codex", args: "--full-auto", icon: CodexLogo },
  { label: "Amp", bin: "amp", args: null, icon: AmpLogo },
];

export function AgentTabs() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const agent = AGENTS[active];
  const setupCmd = [agent.bin, agent.args, SETUP_PROMPT]
    .filter(Boolean)
    .join(" ");
  const taskCmd = [agent.bin, agent.args, TASK_PROMPT]
    .filter(Boolean)
    .join(" ");
  const allSteps = `${WALLET_INSTALL} && ${WALLET_LOGIN} && ${setupCmd} && ${taskCmd}`;

  const copy = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) return;
    navigator.clipboard.writeText(allSteps);
    setCopied(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setCopied(false), 2000);
  }, [allSteps]);

  return (
    <div className="not-prose flex flex-col gap-3">
      <div
        className="rounded-md overflow-hidden text-left"
        style={{
          border: "1px solid var(--vocs-border-color-primary)",
          boxShadow: "0 1px 3px light-dark(rgba(0,0,0,0.08), rgba(0,0,0,0.2))",
        }}
      >
        {/* Agent tabs */}
        <div
          className="flex"
          style={{
            background:
              "light-dark(var(--vocs-background-color-surfaceMuted), oklch(0.22 0 0))",
            borderBottom: "1px solid var(--vocs-border-color-primary)",
          }}
        >
          {AGENTS.map((a, i) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                type="button"
                onClick={() => setActive(i)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
                style={{
                  color:
                    i === active
                      ? "var(--vocs-text-color-heading)"
                      : "var(--vocs-text-color-muted)",
                  background:
                    i === active
                      ? "var(--vocs-background-color-surface)"
                      : "transparent",
                  borderRight:
                    i < AGENTS.length - 1
                      ? "1px solid var(--vocs-border-color-secondary)"
                      : "none",
                }}
              >
                <Icon className="w-4.5 h-4.5" />
                {a.label}
              </button>
            );
          })}
        </div>

        {/* biome-ignore lint/a11y/useSemanticElements: code block with divs can't be a button */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard copy via Cmd+C is standard */}
        <div
          role="button"
          tabIndex={0}
          className="px-4 py-3 font-mono text-sm whitespace-pre-wrap break-words text-left cursor-pointer"
          onClick={copy}
          style={{
            userSelect: "text",
            WebkitUserSelect: "text",
            lineHeight: 1.7,
            background: "var(--vocs-background-color-primary)",
          }}
        >
          <div style={{ color: "var(--vocs-text-color-muted)" }}>
            # Install Tempo CLI + wallet
          </div>
          <div>
            <span style={{ color: CMD_PURPLE }}>curl</span>
            <span style={{ color: FLAG_GREY }}> -fsSL</span>
            <span style={{ color: "var(--vocs-text-color-heading)" }}>
              {" "}
              https://tempo.xyz/install
            </span>
            <span style={{ color: FLAG_GREY }}> |</span>
            <span style={{ color: CMD_PURPLE }}> bash</span>
          </div>
          <div>
            <span style={{ color: WALLET_GREEN }}>tempo</span>
            <span style={{ color: "var(--vocs-text-color-heading)" }}>
              {" "}
              add wallet
            </span>
          </div>
          <div
            style={{
              color: "var(--vocs-text-color-muted)",
              marginTop: 8,
            }}
          >
            # Connect wallet
          </div>
          <div>
            <span style={{ color: WALLET_GREEN }}>tempo</span>
            <span style={{ color: "var(--vocs-text-color-heading)" }}>
              {" "}
              wallet login
            </span>
          </div>
          <div
            style={{
              color: "var(--vocs-text-color-muted)",
              marginTop: 8,
            }}
          >
            # Setup
          </div>
          <div>
            <span style={{ color: AGENT_COLOR }}>{agent.bin}</span>
            {agent.args && (
              <span style={{ color: FLAG_GREY }}> {agent.args}</span>
            )}
            <span style={{ color: "var(--vocs-text-color-heading)" }}>
              {" "}
              {SETUP_PROMPT}
            </span>
          </div>
          <div
            style={{
              color: "var(--vocs-text-color-muted)",
              marginTop: 8,
            }}
          >
            # Try it
          </div>
          <div>
            <span style={{ color: AGENT_COLOR }}>{agent.bin}</span>
            {agent.args && (
              <span style={{ color: FLAG_GREY }}> {agent.args}</span>
            )}
            <span style={{ color: "var(--vocs-text-color-heading)" }}>
              {" "}
              {TASK_PROMPT}
            </span>
          </div>

          {/* Copy indicator */}
          <div
            className="flex items-center gap-2 pt-3 mt-3"
            style={{
              borderTop: "1px solid var(--vocs-border-color-secondary)",
            }}
          >
            <CopyIcon copied={copied} />
            <span
              className="text-xs"
              style={{ color: "var(--vocs-text-color-muted)" }}
            >
              {copied ? "Copied!" : "Click to copy"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
