export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("[demo/create-spt] STRIPE_SECRET_KEY not configured");
    return Response.json(
      { error: "STRIPE_SECRET_KEY not configured" },
      { status: 500 },
    );
  }

  const params = (await request.json()) as {
    amount: string;
    currency: string;
    expiresAt: number;
    metadata?: Record<string, string>;
    networkId?: string;
    paymentMethod: string;
  };

  const body = new URLSearchParams({
    payment_method: params.paymentMethod,
    "usage_limits[currency]": params.currency,
    "usage_limits[max_amount]": params.amount,
    "usage_limits[expires_at]": params.expiresAt.toString(),
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
