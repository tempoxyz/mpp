/** The demo routes' price: 100 USD cents (`/api/demo/*` and `/api/payment-link/photo-stripe`). */
const amount = "100";
const currency = "usd";
/** How long a token stays usable: long enough to pay one challenge. */
const ttlSeconds = 10 * 60;

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("[demo/create-spt] STRIPE_SECRET_KEY not configured");
    return Response.json(
      { error: "STRIPE_SECRET_KEY not configured" },
      { status: 500 },
    );
  }
  if (!isTestModeSecretKey(secretKey)) {
    console.error(
      "[demo/create-spt] Stripe test-helper endpoint requires a test-mode secret key",
    );
    return Response.json(
      {
        error:
          "Stripe SPT test-helper endpoint requires STRIPE_SECRET_KEY=sk_test_...",
      },
      { status: 500 },
    );
  }

  // The client picks only the payment method; the server sets the token's limits.
  const params = (await request.json().catch(() => undefined)) as
    | { paymentMethod?: unknown }
    | undefined;
  const paymentMethod = params?.paymentMethod;
  if (typeof paymentMethod !== "string" || !/^pm_\w+$/.test(paymentMethod))
    return Response.json({ error: "Invalid paymentMethod." }, { status: 400 });

  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = new URLSearchParams({
    payment_method: paymentMethod,
    "usage_limits[currency]": currency,
    "usage_limits[expires_at]": expiresAt.toString(),
    "usage_limits[max_amount]": amount,
  });

  const response = await fetch(
    "https://api.stripe.com/v1/test_helpers/shared_payment/granted_tokens",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${secretKey}:`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!response.ok) {
    const errorBody = (await response.json()) as {
      error: { message: string };
    };
    console.error(
      `[demo/create-spt] Stripe SPT request failed: ${errorBody.error.message}`,
    );
    return Response.json({ error: errorBody.error.message }, { status: 400 });
  }

  const { id } = (await response.json()) as { id: string };
  return Response.json({ spt: id });
}

function isTestModeSecretKey(secretKey: string) {
  return secretKey.startsWith("sk_test_") || secretKey.startsWith("rk_test_");
}
