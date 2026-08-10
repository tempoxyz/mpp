// @vitest-environment happy-dom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadLottiePlayer } from "../../lib/lottie";
import { LogoLottie } from "./LogoLottie";

vi.mock("../../lib/lottie", () => ({ loadLottiePlayer: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("LogoLottie", () => {
  it("plays the complete animation from the first frame", async () => {
    const animationData = {
      layers: [{ nm: "Block 1" }, { nm: "Block 2" }, { nm: "M" }],
    };
    const animation = {
      addEventListener: vi.fn(
        (event: string, listener: () => void) =>
          event === "DOMLoaded" && listener(),
      ),
      destroy: vi.fn(),
      goToAndPlay: vi.fn(),
      goToAndStop: vi.fn(),
      setSpeed: vi.fn(),
      totalFrames: 90,
    };
    const loadAnimation = vi.fn(
      (_config: { animationData: unknown }) => animation,
    );
    vi.mocked(loadLottiePlayer).mockResolvedValue({
      loadAnimation,
    } as never);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => animationData,
        ok: true,
      })),
    );

    render(<LogoLottie />);

    await waitFor(() => expect(loadAnimation).toHaveBeenCalledOnce());
    expect(loadAnimation.mock.calls[0]?.[0]?.animationData).toBe(animationData);
    expect(animation.setSpeed).toHaveBeenCalledWith(2);
    expect(animation.goToAndPlay).toHaveBeenCalledWith(0, true);
  });
});
