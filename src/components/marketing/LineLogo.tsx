import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useRef } from "react";
import { cx } from "./cx";
import { type LineLogoName, lineLogos } from "./lineLogos";

gsap.registerPlugin(ScrollTrigger);

const slot = (rect: SVGRectElement) => ({
  width: Number(rect.dataset.sw),
  x: Number(rect.dataset.sx),
});
const resolved = (rect: SVGRectElement) => ({
  width: Number(rect.dataset.rw),
  x: Number(rect.dataset.rx),
});

export function LineLogo({
  className,
  label,
  mode = "auto",
  name,
}: {
  className?: string;
  label: string;
  mode?: "auto" | "scrub";
  name: LineLogoName;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const { rects, viewBox } = lineLogos[name];

  useEffect(() => {
    if (mode !== "scrub") return;
    const svg = ref.current;
    if (!svg || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const elements = Array.from(svg.querySelectorAll<SVGRectElement>("rect"));
    const ys = elements.map((rect) => Number(rect.getAttribute("y")) || 0);
    const min = Math.min(...ys);
    const range = Math.max(...ys) - min || 1;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          end: "bottom bottom",
          scrub: 2,
          start: "top center",
          trigger: svg.closest("footer") ?? svg,
        },
      });
      elements.forEach((rect, index) => {
        timeline.from(
          rect,
          { attr: slot(rect), duration: 2, ease: "expo.out" },
          ((ys[index] - min) / range) * 2,
        );
      });
    }, svg);
    return () => context.revert();
  }, [mode]);

  useLayoutEffect(() => {
    if (mode !== "auto") return;
    const svg = ref.current;
    if (!svg) return;
    const elements = Array.from(svg.querySelectorAll<SVGRectElement>("rect"));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      svg.style.visibility = "visible";
      return;
    }
    const midpoint = (elements.length - 1) / 2;
    const expo = (progress: number) =>
      progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
    const ease = (progress: number) =>
      progress === 0 ? 0 : 0.7 + 0.3 * expo(progress);
    for (const rect of elements) {
      gsap.set(rect, { attr: slot(rect), opacity: 0 });
    }
    svg.style.visibility = "visible";

    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      elements.forEach((rect, index) => {
        gsap.fromTo(
          rect,
          { attr: slot(rect), opacity: 0 },
          {
            attr: resolved(rect),
            delay: Math.abs(index - midpoint) * 0.007,
            duration: 0.75,
            ease,
            opacity: 1,
          },
        );
      });
    };
    window.addEventListener("mpp:logo-lines", play, { once: true });
    const fallback = window.setTimeout(play, 1_000);
    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener("mpp:logo-lines", play);
      gsap.killTweensOf(elements);
    };
  }, [mode]);

  return (
    <svg
      aria-label={label}
      className={cx("block", className)}
      fill="#EBEBEB"
      ref={ref}
      role="img"
      style={mode === "auto" ? { visibility: "hidden" } : undefined}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      {rects.map(([x, y, width, height, slotX, slotWidth]) => (
        <rect
          data-rw={width}
          data-rx={x}
          data-sw={slotWidth}
          data-sx={slotX}
          height={height}
          key={`${x}-${y}-${width}-${height}`}
          width={width}
          x={x}
          y={y}
        />
      ))}
    </svg>
  );
}
