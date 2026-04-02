"use client";

const PAYMENT_LINK_URL = "/api/payment-link/photo";

export function PaymentLinkDemo() {
  return (
    <div className="not-prose">
      <div
        style={{
          border: "1px solid var(--vocs-color_border)",
          borderRadius: 12,
          overflow: "hidden",
          background: "var(--vocs-color_backgroundDark)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <a
          href={PAYMENT_LINK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline! px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80"
          style={{
            fontSize: "0.9375rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
            color: "light-dark(#fff, #111)",
            backgroundColor: "light-dark(#111, rgba(255,255,255,0.92))",
            textDecoration: "none",
          }}
        >
          Open payment link ↗
        </a>
      </div>
    </div>
  );
}
