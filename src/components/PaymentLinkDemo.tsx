"use client";

import { useCallback, useState } from "react";

const METHODS = [
  { embed: true, label: "Tempo", src: "/api/payment-link/photo" },
  { embed: false, label: "Stripe", src: "/api/payment-link/photo-stripe" },
] as const;

export function PaymentLinkDemo() {
  const [active, setActive] = useState(0);
  const method = METHODS[active];
  const onIframeLoad = useCallback((e: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const doc = e.currentTarget.contentDocument;
      if (!doc) return;
      const style = doc.createElement("style");
      style.textContent = ".mppx-header { display: none !important; }";
      doc.head.appendChild(style);
    } catch (_) {}
  }, []);

  return (
    <div className="not-prose">
      <div
        className="overflow-hidden"
        style={{
          border: "1px solid light-dark(#e5e5e5, #262626)",
          borderRadius: 12,
        }}
      >
        <div
          style={{
            borderBottom: "1px solid light-dark(#e5e5e5, #262626)",
            padding: "8px 12px",
          }}
        >
          <select
            value={active}
            onChange={(e) => setActive(Number(e.target.value))}
            style={{
              appearance: "auto",
              background: "transparent",
              border: "none",
              color: "light-dark(#111, #fff)",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: 500,
              outline: "none",
            }}
          >
            {METHODS.map((m, i) => (
              <option key={m.label} value={i}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        {method.embed ? (
          <iframe
            key={active}
            onLoad={onIframeLoad}
            src={method.src}
            title={`Payment link demo — ${method.label}`}
            style={{
              border: "none",
              display: "block",
              height: 420,
              width: "100%",
            }}
          />
        ) : (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
              padding: "48px 24px",
            }}
          >
            <a
              href={method.src}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: "light-dark(#111, #fff)",
                borderRadius: 8,
                color: "light-dark(#fff, #111)",
                fontSize: "0.9375rem",
                fontWeight: 500,
                padding: "10px 20px",
                textDecoration: "none",
              }}
            >
              Open payment link
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
