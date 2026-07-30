import { useEffect, useRef } from "react";
import { cx } from "./cx";

type LottieAnimation = {
  addEventListener?: (event: string, callback: () => void) => void;
  destroy: () => void;
  goToAndStop: (frame: number, isFrame: boolean) => void;
  totalFrames: number;
};

export function LogoLottie({ className }: { className?: string }) {
  const animationRef = useRef<LottieAnimation | undefined>(undefined);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const hostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cancelled = false;
    import("lottie-web/build/player/lottie_light").then(
      ({ default: lottie }) => {
        if (cancelled || !hostRef.current) return;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const animation = lottie.loadAnimation({
          autoplay: !reduced,
          container: hostRef.current,
          loop: false,
          path: "/lottie/02_MPP_Logo_Loading_Animation.json",
          renderer: "svg",
          rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
        }) as LottieAnimation;
        animationRef.current = animation;
        animation.addEventListener?.("DOMLoaded", () => {
          if (cancelled) return;
          if (reduced) {
            animation.goToAndStop(animation.totalFrames - 1, true);
          }
          fallbackRef.current?.style.setProperty("display", "none");
        });
      },
    );
    return () => {
      cancelled = true;
      animationRef.current?.destroy();
    };
  }, []);

  return (
    <span aria-hidden="true" className={cx("relative", className)}>
      <img
        alt="MPP"
        className="h-full w-auto"
        ref={fallbackRef}
        src="/marketing/mpp-logo.svg"
      />
      <span className="absolute inset-0" ref={hostRef} />
    </span>
  );
}
