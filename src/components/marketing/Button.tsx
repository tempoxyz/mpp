import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  useRef,
} from "react";
import { Link } from "waku";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";
import { useWipeHover } from "./useWipeHover";
import { WipeBands } from "./WipeBands";

type ButtonIcon = Extract<
  IconName,
  "arrow-left" | "arrow-right" | "copy" | "plus"
>;

type ButtonProps = {
  children?: ReactNode;
  className?: string;
  href?: string;
  icon?: ButtonIcon;
  iconOnly?: boolean;
  variant?: "primary" | "secondary";
  wipe?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

const base =
  "relative inline-flex items-center justify-center overflow-hidden border border-border font-mono text-sm uppercase tracking-[-0.14px] leading-4 text-offwhite backdrop-blur-[8px] transition-colors hover:border-[rgba(235,235,235,0.4)]";

export function Button({
  children,
  className,
  href,
  icon,
  iconOnly = false,
  variant = "secondary",
  wipe = true,
  ...rest
}: ButtonProps) {
  const ref = useRef<HTMLElement>(null);
  useWipeHover(ref, wipe);
  const classes = cx(
    base,
    iconOnly ? "size-10" : "h-10 px-4",
    variant === "primary" ? "bg-[#262626]" : "bg-[#101010]",
    className,
  );
  const content = (
    <>
      <WipeBands bars={3} />
      <span className="wipe-label relative z-10 inline-flex items-center gap-2">
        {children}
        {icon && <Icon name={icon} />}
      </span>
    </>
  );

  if (href?.startsWith("/") && !href.startsWith("/#")) {
    return (
      <Link
        className={classes}
        data-wipe=""
        ref={ref as React.Ref<HTMLAnchorElement>}
        to={href}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a
        className={classes}
        data-wipe=""
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      className={classes}
      data-wipe=""
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
