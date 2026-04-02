"use client";

import { useCallback } from "react";

export function PaymentLinkDemo() {
  const onIframeLoad = useCallback(
    (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      try {
        const doc = e.currentTarget.contentDocument;
        if (!doc) return;
        const style = doc.createElement("style");
        style.textContent = ".mppx-header { display: none !important; }";
        doc.head.appendChild(style);
      } catch (_) {}
    },
    [],
  );

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
          onLoad={onIframeLoad}
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
