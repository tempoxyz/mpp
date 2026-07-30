import { describe, expect, it } from "vitest";
import { resolveMppxSecretKey } from "./mppx-secret.server";

describe("resolveMppxSecretKey", () => {
  it.each([
    {
      expected: "configured-key",
      isDevelopment: false,
      lifecycleEvent: "build",
      secretKey: "configured-key",
    },
    {
      expected: "configured-key",
      isDevelopment: true,
      lifecycleEvent: "dev",
      secretKey: "configured-key",
    },
    {
      expected: "local-development-only-example-key",
      isDevelopment: false,
      lifecycleEvent: "build",
      secretKey: undefined,
    },
    {
      expected: "local-development-only-example-key",
      isDevelopment: true,
      lifecycleEvent: "dev",
      secretKey: undefined,
    },
    {
      expected: undefined,
      isDevelopment: false,
      lifecycleEvent: "start",
      secretKey: undefined,
    },
  ])("returns $expected for development=$isDevelopment and lifecycle=$lifecycleEvent", ({
    expected,
    isDevelopment,
    lifecycleEvent,
    secretKey,
  }) => {
    expect(
      resolveMppxSecretKey({
        isDevelopment,
        lifecycleEvent,
        secretKey,
      }),
    ).toBe(expected);
  });
});
