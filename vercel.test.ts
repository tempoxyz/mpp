import { describe, expect, it, vi } from "vitest";
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

describe("identity playground rewrite", () => {
  it("proxies /playground/identity to the Worker when its origin is set", async () => {
    vi.resetModules();
    vi.stubEnv(
      "IDENTITY_PLAYGROUND_WORKER_ORIGIN",
      "https://playground.example.workers.dev/",
    );
    const { config: withOrigin } = await import("./vercel");
    vi.unstubAllEnvs();

    expect(withOrigin.rewrites).toEqual(
      expect.arrayContaining([
        {
          source: "/playground/identity",
          destination:
            "https://playground.example.workers.dev/playground/identity/",
        },
        {
          source: "/playground/identity/:path*",
          destination:
            "https://playground.example.workers.dev/playground/identity/:path*",
        },
      ]),
    );
  });

  it("proxies to the deployed Worker by default", async () => {
    vi.resetModules();
    vi.stubEnv("IDENTITY_PLAYGROUND_WORKER_ORIGIN", "");
    const { config } = await import("./vercel");
    vi.unstubAllEnvs();

    expect(config.rewrites).toEqual(
      expect.arrayContaining([
        {
          source: "/playground/identity/:path*",
          destination:
            "https://mpp-identity-playground.porto.workers.dev/playground/identity/:path*",
        },
      ]),
    );
  });

  it("leaves the rewrite out of preview deployments", async () => {
    vi.resetModules();
    vi.stubEnv("VERCEL_ENV", "preview");
    const { config } = await import("./vercel");
    vi.unstubAllEnvs();

    expect(JSON.stringify(config.rewrites ?? [])).not.toContain(
      "/playground/identity",
    );
  });
});
