import { useEffect, useRef, useState } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";

export function CopyBadge({
  className,
  label,
  text,
}: {
  className?: string;
  label?: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      aria-label={copied ? "Copied to clipboard" : `Copy ${text}`}
      className={cx(
        "inline-flex min-w-0 max-w-full items-center gap-2 border bg-[#101010] px-3 py-1.5 font-mono text-sm uppercase leading-4 tracking-[-0.14px] transition-colors",
        copied
          ? "border-term-green text-term-green"
          : "border-border text-secondary hover:border-[rgba(235,235,235,0.4)] hover:text-offwhite",
        className,
      )}
      onClick={async (event) => {
        event.stopPropagation();
        event.preventDefault();
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1200);
        } catch {}
      }}
      type="button"
    >
      <span className="min-w-0 truncate">
        {copied ? "Copied" : (label ?? text)}
      </span>
      <Icon className="shrink-0" name="copy" />
    </button>
  );
}
