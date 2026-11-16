import type { gsap as Gsap } from "gsap";

let gsapPromise: Promise<typeof Gsap> | undefined;

/**
 * GSAP only drives hover wipes and logo intros, so it loads as its own chunk
 * after the page is interactive instead of in every page's startup bundle.
 */
export function loadGsap(): Promise<typeof Gsap> {
  gsapPromise ??= import("gsap").then((module) => module.gsap);
  return gsapPromise;
}
