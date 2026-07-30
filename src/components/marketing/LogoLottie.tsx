import { cx } from "./cx";

export function LogoLottie({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cx(className)}>
      <img alt="MPP" className="h-full w-auto" src="/marketing/mpp-logo.svg" />
    </span>
  );
}
