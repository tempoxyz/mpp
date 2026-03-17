"use client";

import { useCallback, useEffect, useState } from "react";
import LucideCheck from "~icons/lucide/check";
import LucideClipboard from "~icons/lucide/clipboard";

export function PromptBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(children);
    setCopied(true);
  }, [children]);

  return (
    <div data-v-code-container>
      <button
        type="button"
        onClick={copy}
        className="vocs:relative vocs:w-full vocs:text-left vocs:cursor-pointer vocs:appearance-none vocs:border-0 vocs:bg-transparent vocs:p-0 vocs:m-0"
      >
        <pre
          className="vocs:relative vocs:select-none"
          data-v
          style={{
            cursor: "pointer",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <code className="language-txt">{children}</code>
          <span
            className="vocs:absolute vocs:right-2.5 vocs:top-2.5 vocs:p-1.5 vocs:rounded-md vocs:transition-all vocs:duration-150 prompt-copy-icon"
            style={{
              color: copied
                ? "var(--vocs-color-success, #22c55e)"
                : "var(--vocs-color-text-secondary)",
              opacity: copied ? 1 : undefined,
            }}
            aria-hidden="true"
          >
            {copied ? (
              <LucideCheck className="vocs:size-4" />
            ) : (
              <LucideClipboard className="vocs:size-4" />
            )}
          </span>
        </pre>
      </button>
    </div>
  );
}
