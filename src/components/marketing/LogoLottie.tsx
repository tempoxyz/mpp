import { useEffect, useRef } from "react";
import { type LottieAnimation, loadLottiePlayer } from "../../lib/lottie";
import { cx } from "./cx";

export function LogoLottie({ className }: { className?: string }) {
  const animationRef = useRef<LottieAnimation | undefined>(undefined);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const hostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cancelled = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    Promise.all([
      loadLottiePlayer(),
      fetch("/lottie/02_MPP_Logo_Loading_Animation.json").then((response) => {
        if (!response.ok) throw new Error("Unable to load logo animation");
        return response.json();
      }),
    ])
      .then(([lottie, animationData]) => {
        if (cancelled || !hostRef.current) return;
        const animation = lottie.loadAnimation({
          animationData,
          autoplay: false,
          container: hostRef.current,
          loop: false,
          renderer: "svg",
          rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
        }) as LottieAnimation;
        animationRef.current = animation;
        animation.setSpeed(2);
        animation.addEventListener("DOMLoaded", () => {
          if (cancelled) return;
          fallbackRef.current?.style.setProperty("visibility", "hidden");
          if (reduced) {
            animation.goToAndStop(animation.totalFrames - 1, true);
          } else {
            animation.goToAndPlay(0, true);
          }
          window.dispatchEvent(new Event("mpp:logo-lines"));
        });
      })
      .catch(() => {});

    const replay = () => {
      if (!reduced) {
        animationRef.current?.goToAndPlay(0, true);
        window.dispatchEvent(new Event("mpp:logo-lines"));
      }
    };
    window.addEventListener("mpp:route", replay);

    return () => {
      cancelled = true;
      window.removeEventListener("mpp:route", replay);
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
