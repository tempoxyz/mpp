"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import lockupDarkRaw from "../assets/lockup-dark.svg?raw";
import lockupLightRaw from "../assets/lockup-light.svg?raw";
import logoDarkRaw from "../assets/logo-dark.svg?raw";
import logoLightRaw from "../assets/logo-light.svg?raw";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;

const POSTHOG_SNIPPET = POSTHOG_KEY
  ? `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetGroupPropertiesForFlags setGroupPropertiesForFlags resetPersonPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('${POSTHOG_KEY}',{api_host:'https://us.i.posthog.com',disable_session_recording:true});`
  : null;

function usePostHog() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!POSTHOG_SNIPPET) return;
    if (window.posthog?.__SV) return;

    const inject = () => new Function(POSTHOG_SNIPPET)();

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(inject);
    } else {
      setTimeout(inject, 50);
    }
  }, []);
}

function useGoogleAnalytics() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!id) return;
    if (document.querySelector(`script[src*="googletagmanager"]`)) return;

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    gtag("js", new Date());
    gtag("config", id);
  }, []);
}

function MobileNav() {
  return (
    <nav data-mobile-nav="" aria-label="Main navigation">
      <a href="/overview" data-mobile-nav-item="">
        Docs
      </a>
      <a href="/services" data-mobile-nav-item="">
        Services
      </a>
      <a
        href="https://paymentauth.org"
        target="_blank"
        rel="noopener noreferrer"
        data-mobile-nav-item=""
      >
        Specification
      </a>
      <span data-mobile-nav-label="">GitHub</span>
      <div data-mobile-nav-subitems="" data-mobile-nav-flat="">
        <a
          href="https://github.com/wevm/mppx"
          target="_blank"
          rel="noopener noreferrer"
          data-mobile-nav-subitem=""
        >
          mppx (TypeScript)
        </a>
        <a
          href="https://github.com/tempoxyz/mpp-rs"
          target="_blank"
          rel="noopener noreferrer"
          data-mobile-nav-subitem=""
        >
          mpp-rs (Rust)
        </a>
        <a
          href="https://github.com/tempoxyz/pympp"
          target="_blank"
          rel="noopener noreferrer"
          data-mobile-nav-subitem=""
        >
          pympp (Python)
        </a>
      </div>

      {/* Docs section label */}
      <span data-mobile-nav-label="">Docs</span>
    </nav>
  );
}

function MobileNavPortal() {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    const update = () => {
      const path = window.location.pathname;
      if (path !== "/" && path !== "/services") {
        setTarget(null);
        return;
      }
      const sidebar = document.querySelector("[data-v-sidebar]");
      if (sidebar?.isConnected) {
        setTarget((prev) => (prev === sidebar ? prev : sidebar));
      } else {
        setTarget(null);
      }
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!target || !target.isConnected) return null;
  return createPortal(<MobileNav />, target);
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: "light-dark(#15803d, #4ade80)" }}
    >
      <title>Check</title>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Copy</title>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Download</title>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  width: "100%",
  padding: "0.65rem 1rem",
  border: "none",
  background: "transparent",
  color: "var(--vocs-text-color-muted)",
  fontSize: 14,
  fontFamily: "var(--font-sans)",
  cursor: "pointer",
  textDecoration: "none",
  textAlign: "left",
  transition: "color 0.1s",
};

function LogoMenu({
  pos,
  onClose,
}: {
  pos: { x: number; y: number };
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copySvg = useCallback(
    (svgText: string, label: string) => {
      const ta = document.createElement("textarea");
      ta.value = svgText;
      ta.style.cssText = "position:fixed;opacity:0;left:-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
      navigator.clipboard?.writeText(svgText).catch(() => {});
      setCopied(label);
      setTimeout(() => {
        setCopied(null);
        onClose();
      }, 2000);
    },
    [onClose],
  );

  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const maxX = typeof window !== "undefined" ? window.innerWidth - 240 : pos.x;
  const left = Math.min(pos.x, maxX);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: pos.y,
        left,
        zIndex: 9999,
        minWidth: 220,
        background:
          "var(--vocs-background-color-surface, var(--vocs-background-color-primary))",
        border: "1px solid var(--vocs-border-color-primary)",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        padding: "4px 0",
        fontFamily: "var(--font-sans)",
      }}
    >
      <button
        type="button"
        onClick={() => copySvg(isDark ? logoLightRaw : logoDarkRaw, "icon")}
        style={menuItemStyle}
        onMouseEnter={(e) => {
          if (!copied)
            e.currentTarget.style.color = "var(--vocs-text-color-heading)";
        }}
        onMouseLeave={(e) => {
          if (!copied)
            e.currentTarget.style.color = "var(--vocs-text-color-muted)";
        }}
      >
        {copied === "icon" ? <CheckIcon /> : <CopyIcon />}
        {copied === "icon" ? "Copied!" : "Copy icon"}
      </button>
      <button
        type="button"
        onClick={() => copySvg(isDark ? lockupLightRaw : lockupDarkRaw, "logo")}
        style={menuItemStyle}
        onMouseEnter={(e) => {
          if (!copied)
            e.currentTarget.style.color = "var(--vocs-text-color-heading)";
        }}
        onMouseLeave={(e) => {
          if (!copied)
            e.currentTarget.style.color = "var(--vocs-text-color-muted)";
        }}
      >
        {copied === "logo" ? <CheckIcon /> : <CopyIcon />}
        {copied === "logo" ? "Copied!" : "Copy full logo"}
      </button>
      <a
        href="/brand"
        onClick={() => setTimeout(onClose, 100)}
        style={menuItemStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--vocs-text-color-heading)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--vocs-text-color-muted)";
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <title>Brand</title>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Brand page
      </a>
      <a
        href="/brand.zip"
        download
        onClick={() => setTimeout(onClose, 100)}
        style={menuItemStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--vocs-text-color-heading)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--vocs-text-color-muted)";
        }}
      >
        <DownloadIcon />
        Download brand assets
      </a>
    </div>
  );
}

function LogoContextMenu() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const logo = (e.target as HTMLElement).closest("[data-v-logo]");
      if (!logo) return;
      e.preventDefault();
      setPos({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      if (
        menuRef.current &&
        e.target instanceof Node &&
        menuRef.current.contains(e.target)
      )
        return;
      setPos(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPos(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("scroll", close, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [pos]);

  if (!pos) return null;
  return createPortal(
    <div ref={menuRef}>
      <LogoMenu pos={pos} onClose={() => setPos(null)} />
    </div>,
    document.body,
  );
}

function useLogoFullReload() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest?.(
        "[data-v-logo] a",
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      if (window.location.pathname === "/") return;
      e.preventDefault();
      e.stopPropagation();
      window.location.href = "/";
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);
}

export default function Layout(props: React.PropsWithChildren) {
  usePostHog();
  useGoogleAnalytics();
  useLogoFullReload();

  const ahrefsKey = import.meta.env.VITE_AHREFS_VERIFICATION;

  return (
    <>
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: inline perf fix
        dangerouslySetInnerHTML={{
          __html: `(function(){var o=Element.prototype.scrollTo;Element.prototype.scrollTo=function(a){if(a&&typeof a==='object'&&this.matches&&this.matches('[data-v-sidebar-container]')){a=Object.assign({},a,{behavior:'instant'})}return o.apply(this,arguments)};})();`,
        }}
      />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1"
      />
      {ahrefsKey && (
        <meta name="ahrefs-site-verification" content={ahrefsKey} />
      )}
      <link
        rel="preload"
        href="/fonts/VTCDuBoisTrial-Regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/VTCDuBoisTrial-Bold.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/Geist-Regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/Geist-Medium.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <MobileNavPortal />
      <LogoContextMenu />
      {props.children}
    </>
  );
}
