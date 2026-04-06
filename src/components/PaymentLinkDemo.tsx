"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const defaultFrameHeight = 420;

export function PaymentLinkDemo() {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [frameHeight, setFrameHeight] = useState(defaultFrameHeight);

  const syncFrameHeight = useCallback(() => {
    const frame = frameRef.current;
    const doc = frame?.contentWindow?.document;

    if (!doc) return;

    const nextHeight = Math.max(
      defaultFrameHeight,
      doc.body?.scrollHeight ?? 0,
      doc.body?.offsetHeight ?? 0,
      doc.documentElement.scrollHeight,
      doc.documentElement.offsetHeight,
    );

    setFrameHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight,
    );
  }, []);

  const observeFrame = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    const doc = frameRef.current?.contentWindow?.document;

    if (!doc) return;

    const observer = new ResizeObserver(() => {
      syncFrameHeight();
    });

    observer.observe(doc.documentElement);

    if (doc.body) observer.observe(doc.body);

    observerRef.current = observer;

    requestAnimationFrame(() => {
      syncFrameHeight();
    });
  }, [syncFrameHeight]);

  useEffect(() => {
    const handleResize = () => {
      syncFrameHeight();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [syncFrameHeight]);

  return (
    <div className="not-prose">
      <div
        style={{
          border: "1px solid light-dark(#e5e5e5, #262626)",
          borderRadius: 12,
        }}
      >
        <iframe
          onLoad={observeFrame}
          ref={frameRef}
          scrolling="no"
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
