import { afterEach, describe, expect, it, vi } from "vitest";
import { HEAD, OPTIONS } from "./pages/_api/mcp/services.ts";

describe("/mcp/services proxy route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("proxies HEAD requests to the services MCP Worker", async () => {
    vi.stubEnv(
      "MPP_SERVICES_MCP_WORKER_ORIGIN",
      "https://mpp-services-mcp.example.workers.dev/",
    );

    let requestedUrl: string | undefined;
    let requestInit: RequestInit | undefined;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        requestedUrl = String(input);
        requestInit = init;

        return new Response(null, {
          status: 200,
          headers: {
            "content-encoding": "gzip",
            "content-length": "42",
            "content-type": "application/json",
          },
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await HEAD(
      new Request("https://mpp.dev/mcp/services?probe=1", {
        method: "HEAD",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-methods")).toBe(
      "GET,HEAD,POST,OPTIONS",
    );
    expect(response.headers.get("content-length")).toBeNull();
    expect(response.headers.get("content-encoding")).toBeNull();
    expect(requestedUrl).toBe(
      "https://mpp-services-mcp.example.workers.dev/mcp/services?probe=1",
    );
    expect(requestInit).toEqual(
      expect.objectContaining({
        method: "HEAD",
        redirect: "manual",
      }),
    );
    expect(requestInit).not.toHaveProperty("body");
  });

  it("advertises HEAD support in CORS preflight responses", () => {
    const response = OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-methods")).toBe(
      "GET,HEAD,POST,OPTIONS",
    );
  });
});
