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

  it("sets the token's limits itself, ignoring the client's", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    vi.useFakeTimers({ now: new Date("2026-11-23T00:00:00Z") });

    try {
      const response = await POST(createRequest());
      expect(response.status).toBe(200);
    } finally {
      vi.useRealTimers();
    }

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const body = Object.fromEntries(init?.body as URLSearchParams);
    expect(body).toEqual({
      payment_method: "pm_card_visa",
      "usage_limits[currency]": "usd",
      "usage_limits[expires_at]": String(
        Date.parse("2026-11-23T00:10:00Z") / 1000,
      ),
      "usage_limits[max_amount]": "100",
    });
  });

  it("rejects a request without a payment method", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";

    const response = await POST(
      new Request("https://mpp.dev/api/demo/create-spt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: "100", currency: "usd" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

function createRequest() {
  return new Request("https://mpp.dev/api/demo/create-spt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: "99999",
      currency: "eur",
      expiresAt: 4102444800,
      paymentMethod: "pm_card_visa",
    }),
  });
}

function restoreEnv(key: "STRIPE_SECRET_KEY", value: string | undefined) {
  if (value === undefined) Reflect.deleteProperty(process.env, key);
  else process.env[key] = value;
}
