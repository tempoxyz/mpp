"use client";

import { useEffect, useRef, useState } from "react";

const defaultFrameHeight = 420;

export function PaymentLinkDemo() {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [frameHeight, setFrameHeight] = useState(defaultFrameHeight);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        typeof event.data === "object" &&
        event.data !== null &&
        "type" in event.data &&
        event.data.type === "resize" &&
        typeof event.data.height === "number"
      ) {
        setFrameHeight(Math.max(defaultFrameHeight, event.data.height));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="not-prose">
      <div
        style={{
          border: "1px solid light-dark(#e5e5e5, #262626)",
          borderRadius: 12,
        }}
      >
        <iframe
          allow="publickey-credentials-get *; publickey-credentials-create *"
          ref={frameRef}
          src="/api/payment-link/photo"
          title="Payment link demo — Tempo"
          style={{
            border: "none",
            borderRadius: 12,
            display: "block",
            height: frameHeight,
            overflow: "hidden",
            width: "100%",
          }}
        />
      </div>
    </div>
  );
}

Object.assign(PaymentLinkDemo, {
  toMarkdown: () => ({
    children: [
      {
        children: [{ type: "text", value: "Open the live payment link" }],
        type: "link",
        url: "https://mpp.dev/api/payment-link/photo",
      },
      { type: "text", value: " to pay $0.01 with Tempo and receive a photo." },
    ],
    type: "paragraph",
  }),
});
