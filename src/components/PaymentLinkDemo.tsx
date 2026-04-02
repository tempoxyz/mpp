"use client";

export function PaymentLinkDemo() {
  return (
    <div className="not-prose">
      <div
        className="overflow-hidden"
        style={{
          border: "1px solid light-dark(#e5e5e5, #262626)",
          borderRadius: 12,
        }}
      >
        <iframe
          src="/api/payment-link/photo"
          title="Payment link demo — Tempo"
          style={{
            border: "none",
            display: "block",
            height: 420,
            width: "100%",
          }}
        />
      </div>
    </div>
  );
}
