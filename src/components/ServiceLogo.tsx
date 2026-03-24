"use client";

import { useState } from "react";
import type { Service } from "../data/registry";
import { iconUrl } from "../data/registry";

function domainFrom(s: Service): string | undefined {
  if (!s.provider?.url) return undefined;
  try {
    return new URL(s.provider.url).hostname;
  } catch {
    return undefined;
  }
}

export function ServiceLogo({
  service,
  size = 28,
  className,
  style,
}: {
  service: Service;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [imgError, setImgError] = useState(false);

  if (!service.id || imgError) {
    return <ServiceLogoFallback name={service.name} size={size} />;
  }

  return (
    <img
      src={iconUrl(service.id, domainFrom(service))}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{
        borderRadius: 6,
        objectFit: "contain",
        display: "block",
        ...style,
      }}
      onError={() => setImgError(true)}
    />
  );
}

export function ServiceLogoFallback({
  name,
  size = 28,
}: {
  name: string;
  size?: number;
}) {
  const initials = name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: "light-dark(rgba(0,0,0,0.06), rgba(255,255,255,0.10))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize:
          initials.length > 1
            ? Math.round(size * 0.36)
            : Math.round(size * 0.46),
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: "var(--vocs-text-color-secondary)",
        border:
          "1px solid light-dark(rgba(0,0,0,0.08), rgba(255,255,255,0.08))",
      }}
    >
      {initials || "?"}
    </div>
  );
}
