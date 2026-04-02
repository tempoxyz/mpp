"use client";

import { useEffect, useRef } from "react";

const PAYMENT_LINK_URL = "/api/payment-link/photo";

export function PaymentLinkDemo() {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("color", "white", "important");
    el.style.setProperty("-webkit-text-fill-color", "white", "important");
  }, []);

  return (
    <div className="not-prose">
      <div
        className="rounded-xl"
        style={{
          border: "1px solid light-dark(#e5e5e5, #262626)",
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
          ref={ref}
          href={PAYMENT_LINK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-lg"
          style={{
            backgroundColor: "black",
            fontSize: "0.9375rem",
            fontWeight: 500,
            textDecoration: "none",
            transition: "background-color 0.15s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={() => {
            if (ref.current) {
              ref.current.style.backgroundColor = "#333";
              ref.current.style.setProperty("color", "white", "important");
              ref.current.style.setProperty("-webkit-text-fill-color", "white", "important");
            }
          }}
          onMouseLeave={() => {
            if (ref.current) {
              ref.current.style.backgroundColor = "black";
              ref.current.style.setProperty("color", "white", "important");
              ref.current.style.setProperty("-webkit-text-fill-color", "white", "important");
            }
          }}
        >
          Open payment link
        </a>
      </div>
    </div>
  );
}
