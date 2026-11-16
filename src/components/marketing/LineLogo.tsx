import type { gsap as Gsap } from "gsap";
import { useEffect, useLayoutEffect, useRef } from "react";
import { cx } from "./cx";
import { type LineLogoName, lineLogos } from "./lineLogos";
import { loadGsap } from "./loadGsap";

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
    let cancelled = false;
    let context: ReturnType<typeof Gsap.context> | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        // Keep the server-rendered logo visible while the optional plugin loads.
        void Promise.all([loadGsap(), import("gsap/ScrollTrigger")])
          .then(([gsap, { ScrollTrigger }]) => {
            if (cancelled) return;
            gsap.registerPlugin(ScrollTrigger);
            context = gsap.context(() => {
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
          })
          .catch(() => {
            // The static logo remains usable if the animation cannot load.
          });
      },
      { rootMargin: "300px" },
    );
    observer.observe(svg.closest("footer") ?? svg);
    return () => {
      cancelled = true;
      observer.disconnect();
      context?.revert();
    };
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
    // The logo stays hidden until GSAP has set its starting state. It plays on
    // mpp:logo-lines or after 1s, whichever comes first, as soon as GSAP is in.
    // If GSAP still isn't in at 1s, the static logo shows and the intro is
    // skipped, so a slow chunk never leaves a blank space.
    let gsap: typeof Gsap | undefined;
    let wanted = false;
    let played = false;
    let skipped = false;
    let cancelled = false;
    const play = () => {
      wanted = true;
      if (played || !gsap) return;
      played = true;
      const g = gsap;
      elements.forEach((rect, index) => {
        g.fromTo(
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
    const fallback = window.setTimeout(() => {
      if (gsap) return play();
      skipped = true;
      svg.style.visibility = "visible";
    }, 1_000);
    void loadGsap()
      .then((loaded) => {
        if (cancelled || skipped) return;
        gsap = loaded;
        for (const rect of elements) {
          loaded.set(rect, { attr: slot(rect), opacity: 0 });
        }
        svg.style.visibility = "visible";
        if (wanted) play();
      })
      .catch(() => {
        // Show the static logo if the animation can't load.
        if (!cancelled) svg.style.visibility = "visible";
      });
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      window.removeEventListener("mpp:logo-lines", play);
      gsap?.killTweensOf(elements);
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
