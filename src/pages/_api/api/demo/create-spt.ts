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
  if (params.networkId)
    body.set("seller_details[network_id]", params.networkId);
  if (params.metadata) {
    for (const [key, value] of Object.entries(params.metadata)) {
      body.set(`metadata[${key}]`, value);
    }
  }

  const sptUrl =
    "https://api.stripe.com/v1/test_helpers/shared_payment/granted_tokens";
  const sptHeaders = {
    Authorization: `Basic ${btoa(`${secretKey}:`)}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  let response = await fetch(sptUrl, {
    method: "POST",
    headers: sptHeaders,
    body,
  });

  if (!response.ok) {
    const errorBody = (await response.json()) as {
      error: { message: string };
    };
    console.warn(
      `[demo/create-spt] initial Stripe SPT request failed: ${errorBody.error.message}`,
    );
    if (
      (params.metadata || params.networkId) &&
      errorBody.error.message.includes("Received unknown parameter")
    ) {
      console.warn(
        "[demo/create-spt] retrying Stripe SPT request without metadata/network_id",
      );
      const fallbackBody = new URLSearchParams({
        payment_method: params.paymentMethod,
        "usage_limits[currency]": params.currency,
        "usage_limits[max_amount]": params.amount,
        "usage_limits[expires_at]": params.expiresAt.toString(),
      });
      response = await fetch(sptUrl, {
        method: "POST",
        headers: sptHeaders,
        body: fallbackBody,
      });
      if (!response.ok) {
        const fallbackError = (await response.json()) as {
          error: { message: string };
        };
        console.error(
          `[demo/create-spt] Stripe fallback request failed: ${fallbackError.error.message}`,
        );
        return Response.json(
          { error: fallbackError.error.message },
          { status: 400 },
        );
      }
    } else {
      console.error(
        `[demo/create-spt] Stripe SPT request failed: ${errorBody.error.message}`,
      );
      return Response.json({ error: errorBody.error.message }, { status: 400 });
    }
  }

  const { id } = (await response.json()) as { id: string };
  return Response.json({ spt: id });
}
