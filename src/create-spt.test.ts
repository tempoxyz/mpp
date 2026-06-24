import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./pages/_api/api/demo/create-spt";

const originalSecretKey = process.env.STRIPE_SECRET_KEY;

describe("demo/create-spt", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ id: "spt_test_123" }),
    );
    Reflect.deleteProperty(process.env, "STRIPE_SECRET_KEY");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreEnv("STRIPE_SECRET_KEY", originalSecretKey);
  });

  it("rejects live-mode keys before calling Stripe", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_123";

    const response = await POST(createRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error:
        "Stripe SPT test-helper endpoint requires STRIPE_SECRET_KEY=sk_test_...",
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("uses the test-mode key for the Stripe test-helper endpoint", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";

    const response = await POST(createRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ spt: "spt_test_123" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.stripe.com/v1/test_helpers/shared_payment/granted_tokens",
      expect.objectContaining({
        method: "POST",
      }),
    );

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Basic ${btoa("sk_test_123:")}`);
  });
});

function createRequest() {
  return new Request("https://mpp.dev/api/demo/create-spt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: "100",
      currency: "usd",
      expiresAt: 1782279932,
      paymentMethod: "pm_card_visa",
    }),
  });
}

function restoreEnv(key: "STRIPE_SECRET_KEY", value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else process.env[key] = value;
}
