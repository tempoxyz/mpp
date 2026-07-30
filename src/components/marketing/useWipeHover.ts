import { gsap } from "gsap";
import { type RefObject, useEffect } from "react";

export function useWipeHover(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled || !matchMedia("(hover: hover)").matches) return;

    const speed = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 1;
    const bands = element.querySelectorAll<HTMLElement>(".wipe-band");
    const label = element.querySelector<HTMLElement>(".wipe-label");
    if (!bands.length || !label) return;

    gsap.set(bands, { scaleX: 0, transformOrigin: "left center" });
    const timeline = gsap.timeline({ paused: true });
    bands.forEach((band, index) => {
      timeline.to(
        band,
        {
          duration: (0.4 + index * 0.15) * speed,
          ease: "power2.out",
          scaleX: 1,
        },
        0,
      );
    });
    timeline.to(
      label,
      { color: "#101010", duration: 0.3 * speed, ease: "power2.out" },
      0,
    );

    const enter = () => timeline.play();
    const leave = () => timeline.reverse();
    element.addEventListener("mouseenter", enter);
    element.addEventListener("mouseleave", leave);
    element.addEventListener("focus", enter);
    element.addEventListener("blur", leave);
    return () => {
      element.removeEventListener("mouseenter", enter);
      element.removeEventListener("mouseleave", leave);
      element.removeEventListener("focus", enter);
      element.removeEventListener("blur", leave);
      timeline.kill();
      gsap.set(bands, { clearProps: "transform" });
      gsap.set(label, { clearProps: "color" });
    };
  }, [enabled, ref]);
}
