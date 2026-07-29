import { describe, expect, it } from "vitest";
import { config } from "./vercel";

const CACHE_CONTROL =
  "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000";

describe("static asset caching", () => {
  it.each([
    "/fonts/:path*",
    "/icons/:path*",
    "/lottie/:path*",
    "/marketing/:path*",
    "/vendor/:path*",
  ])("caches %s in browsers and at the CDN", (source) => {
    const rule = config.headers.find(
      (candidate) => candidate.source === source,
    );

    expect(rule?.headers).toContainEqual({
      key: "Cache-Control",
      value: CACHE_CONTROL,
    });
  });
});
