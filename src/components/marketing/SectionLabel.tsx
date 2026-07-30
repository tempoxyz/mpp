import { cx } from "./cx";

export function SectionLabel({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  return (
    <div className={cx("flex items-center gap-1", className)}>
      <span className="size-[11px] shrink-0 bg-[#757575]" />
      <span className="font-mono text-sm uppercase leading-4 tracking-[-0.14px] text-[#757575]">
        {label}
      </span>
    </div>
  );
}
