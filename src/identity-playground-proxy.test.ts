import { afterEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./identity-playground-proxy.ts";

describe("/playground/identity proxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function stubFetch() {
    const calls: { init?: RequestInit; url: string }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ init, url: String(input) });
        return new Response("ok", {
          headers: {
            "content-encoding": "gzip",
            "content-type": "text/html",
            "transfer-encoding": "chunked",
          },
        });
      }),
    );
    return calls;
  }

  it("proxies to the deployed Worker by default", async () => {
    vi.stubEnv("IDENTITY_PLAYGROUND_WORKER_ORIGIN", "");
    vi.stubEnv("VERCEL_ENV", "production");
    const calls = stubFetch();

    const response = await proxy(
      new Request("https://mpp.dev/playground/identity/api/haiku?tier=email", {
        body: "{}",
        headers: {
          "accept-encoding": "gzip, deflate, br, zstd",
          "x-real-ip": "203.0.113.7",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-encoding")).toBeNull();
    expect(response.headers.get("transfer-encoding")).toBeNull();
    expect(calls[0]?.url).toBe(
      "https://mpp-identity-playground.porto.workers.dev/playground/identity/api/haiku?tier=email",
    );
    expect(new Headers(calls[0]?.init?.headers).get("x-real-ip")).toBe(
      "203.0.113.7",
    );
    expect(
      new Headers(calls[0]?.init?.headers).get("accept-encoding"),
    ).toBeNull();
    expect(calls[0]?.init?.body).toBeInstanceOf(ArrayBuffer);
  });

  it("serves the page at the unslashed path", async () => {
    vi.stubEnv(
      "IDENTITY_PLAYGROUND_WORKER_ORIGIN",
      "https://playground.example.workers.dev/",
    );
    const calls = stubFetch();

    await proxy(new Request("https://mpp.dev/playground/identity"));

    expect(calls[0]?.url).toBe(
      "https://playground.example.workers.dev/playground/identity/",
    );
  });

  it("is off on preview deployments", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const calls = stubFetch();

    const response = await proxy(
      new Request("https://preview.vercel.app/playground/identity/"),
    );

    expect(response.status).toBe(404);
    expect(calls).toHaveLength(0);
  });

  it("caches hashed assets for good and the page briefly", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    stubFetch();

    const asset = await proxy(
      new Request("https://mpp.dev/playground/identity/assets/index-abc123.js"),
    );
    expect(asset.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(asset.headers.get("vercel-cdn-cache-control")).toBe(
      "max-age=31536000",
    );

    const page = await proxy(
      new Request("https://mpp.dev/playground/identity"),
    );
    expect(page.headers.get("vercel-cdn-cache-control")).toBe(
      "max-age=60, stale-while-revalidate=300",
    );

    const api = await proxy(
      new Request("https://mpp.dev/playground/identity/api/config"),
    );
    expect(api.headers.get("vercel-cdn-cache-control")).toBeNull();
  });
});
