"use client";

const PAYMENT_LINK_URL = "/api/payment-link/photo";

export function PaymentLinkDemo() {
  return (
    <div className="not-prose">
      <div
        className="rounded-xl overflow-hidden"
        style={{
          border: "1px solid light-dark(#e5e5e5, #262626)",
        }}
      >
        <iframe
          src={PAYMENT_LINK_URL}
          title="Payment link demo"
          style={{
            border: "none",
            display: "block",
            height: 320,
            width: "100%",
          }}
        />
      </div>
    </div>
  );
}
