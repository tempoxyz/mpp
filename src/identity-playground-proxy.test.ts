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
});
