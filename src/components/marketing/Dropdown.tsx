import { useEffect, useRef, useState } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";

export interface DropdownItem {
  href?: string;
  label: string;
  onSelect?: () => void;
  selected?: boolean;
}

export function Dropdown({
  align = "left",
  className,
  items,
  label,
  size = "md",
}: {
  align?: "left" | "right";
  className?: string;
  items: DropdownItem[];
  label: string;
  size?: "md" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const click = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("click", click);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const itemOuter =
    "group block w-full py-0.5 text-left font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-secondary";
  const itemInner = cx(
    "flex w-full items-center transition-colors group-hover:bg-[#1f1f1f] group-hover:text-offwhite group-data-[selected]:bg-[#262626] group-data-[selected]:text-offwhite",
    size === "sm" ? "px-3 py-1.5" : "px-4 py-2.5",
  );

  return (
    <div className={cx("relative", className)} ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={cx(
          "flex items-center gap-2 whitespace-nowrap border border-border bg-[#101010] font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-offwhite transition-colors hover:border-[rgba(235,235,235,0.4)]",
          size === "sm" ? "px-3 py-1.5" : "h-10 px-4",
        )}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        type="button"
      >
        <span>{label}</span>
        <Icon
          className={cx(
            "transition-transform duration-200",
            open && "rotate-180",
          )}
          name="chevron-down"
        />
      </button>
      <div
        className={cx(
          "absolute top-[calc(100%+8px)] z-50 max-h-[360px] w-max min-w-[220px] overflow-y-auto border border-border bg-[#101010] px-2 py-1.5",
          align === "right" ? "right-0" : "left-0",
          !open && "hidden",
        )}
        role="menu"
      >
        {items.map((item) =>
          item.href ? (
            <a
              className={itemOuter}
              href={item.href}
              key={item.label}
              onClick={() => setOpen(false)}
              rel="noopener noreferrer"
              role="menuitem"
              target="_blank"
            >
              <span
                className={cx(
                  itemInner,
                  "justify-between gap-4 whitespace-nowrap",
                )}
              >
                {item.label}
                <Icon name="arrow-linkout" />
              </span>
            </a>
          ) : (
            <button
              className={itemOuter}
              data-selected={item.selected ? "" : undefined}
              key={item.label}
              onClick={() => {
                item.onSelect?.();
                setOpen(false);
              }}
              role="menuitem"
              type="button"
            >
              <span className={itemInner}>{item.label}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
