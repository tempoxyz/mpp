import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PICSUM_UNAVAILABLE_WARNING,
  resolvePicsumPhotoUrl,
} from "./picsum-photo";

describe("resolvePicsumPhotoUrl", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the upstream redirect URL on success", async () => {
    const upstream = new Response(null, { status: 200 });
    Object.defineProperty(upstream, "url", {
      value: "https://fastly.picsum.photos/id/12/1024/1024.jpg",
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(upstream);

    await expect(resolvePicsumPhotoUrl(1024, "photo")).resolves.toEqual({
      url: "https://fastly.picsum.photos/id/12/1024/1024.jpg",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://picsum.photos/1024/1024",
    );
  });

  it("returns a canned URL with warning when upstream responds non-OK", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 503 }),
    );

    await expect(resolvePicsumPhotoUrl(200, "sessions/photo")).resolves.toEqual(
      {
        url: "https://picsum.photos/id/237/200/200",
        warning: PICSUM_UNAVAILABLE_WARNING,
      },
    );
    expect(console.error).toHaveBeenCalled();
  });

  it("returns a canned URL with warning when fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    await expect(
      resolvePicsumPhotoUrl(1024, "payment-link/photo"),
    ).resolves.toEqual({
      url: "https://picsum.photos/id/237/1024/1024",
      warning: PICSUM_UNAVAILABLE_WARNING,
    });
  });
});
