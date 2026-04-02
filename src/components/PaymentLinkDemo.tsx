"use client";

const PAYMENT_LINK_URL = "/api/payment-link/photo";

export function PaymentLinkDemo() {
  return (
    <div className="not-prose">
      <div
        className="rounded-xl overflow-hidden"
        style={{
          border: "1px solid light-dark(#e5e5e5, #262626)",
          height: 420,
        }}
      >
        <iframe
          src={PAYMENT_LINK_URL}
          title="Payment link demo"
          style={{
            border: "none",
            display: "block",
            height: 560,
            transform: "scale(0.75)",
            transformOrigin: "top left",
            width: "133.33%",
          }}
        />
      </div>
    </div>
  );
}
