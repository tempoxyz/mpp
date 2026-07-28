import { describe, expect, it } from "vitest";
import config from "./vocs.config";

function headFor(path: string) {
  if (typeof config.head !== "function")
    throw new Error("Expected route-aware head configuration");
  return config.head(path, {});
}

describe("font preloads", () => {
  it("does not preload unused fonts outside Services", () => {
    expect(headFor("/blog")).toBeUndefined();
    expect(headFor("/")?.link).toEqual([
      {
        as: "image",
        fetchpriority: "high",
        href: "/marketing/mpp-hero-poster.jpg",
        rel: "preload",
      },
    ]);
  });

  it("preloads the Services display fonts", () => {
    expect(headFor("/services")?.link).toEqual([
      {
        as: "font",
        crossorigin: "anonymous",
        href: "https://wgfdjv2jfqz2dlpx.public.blob.vercel-storage.com/fonts/VTCDuBois-Regular.woff2",
        rel: "preload",
        type: "font/woff2",
      },
      {
        as: "font",
        crossorigin: "anonymous",
        href: "https://wgfdjv2jfqz2dlpx.public.blob.vercel-storage.com/fonts/VTCDuBois-Bold.woff2",
        rel: "preload",
        type: "font/woff2",
      },
    ]);
  });
});
