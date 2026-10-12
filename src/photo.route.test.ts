import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const withReceipt = vi.fn((response: Response) => {
  const headers = new Headers(response.headers);
  headers.set("x-test-receipt", "1");
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
});

vi.mock("./mppx.server", () => ({
  mppx: {
    charge: () => async () => ({
      status: 200 as const,
      withReceipt,
    }),
  },
}));

describe("/api/photo", () => {
  beforeEach(() => {
    withReceipt.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("issues a Receipt with a canned URL when Picsum fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    const { GET } = await import("./pages/_api/api/photo");
    const response = await GET(new Request("https://mpp.dev/api/photo"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-test-receipt")).toBe("1");
    expect(withReceipt).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toEqual({
      url: "https://picsum.photos/id/237/1024/1024",
      warning:
        "Using canned photo because Picsum is unavailable right now.",
    });
  });

  it("issues a Receipt with the upstream URL when Picsum succeeds", async () => {
    const upstream = new Response(null, { status: 200 });
    Object.defineProperty(upstream, "url", {
      value: "https://fastly.picsum.photos/id/12/1024/1024.jpg",
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(upstream);

    // Re-import is cached; handler uses live fetch mock.
    const { GET } = await import("./pages/_api/api/photo");
    const response = await GET(new Request("https://mpp.dev/api/photo"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-test-receipt")).toBe("1");
    await expect(response.json()).resolves.toEqual({
      url: "https://fastly.picsum.photos/id/12/1024/1024.jpg",
    });
  });
});
