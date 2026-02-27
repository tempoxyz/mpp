"use client";

import { createContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "vocs";
import { AnalyticsEvents, captureEvent } from "../lib/posthog";
import { Terminal } from "./Terminal";

const ACCENT = "var(--vocs-text-color-heading)";
const ACCENT_MUTED = "light-dark(rgba(0,0,0,0.85), rgba(255,255,255,0.85))";

const AgentContext = createContext<{
  activeAgent: number;
  setActiveAgent: (i: number) => void;
}>({ activeAgent: 0, setActiveAgent: () => {} });

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

export function LandingPage() {
  const [activeAgent, setActiveAgent] = useState(0);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolledPastHero(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });

    const nav = document.querySelector<HTMLElement>("[data-v-gutter-top]");
    const saved: string[] = [];
    if (nav) {
      for (const cls of Array.from(nav.classList)) {
        if (cls.includes("bg-")) {
          saved.push(cls);
          nav.classList.remove(cls);
        }
      }
      nav.style.cssText +=
        "; background: linear-gradient(to bottom, var(--vocs-background-color-primary) 60%, transparent 100%) !important; background-color: transparent !important;";
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (nav) {
        for (const cls of saved) nav.classList.add(cls);
        nav.style.removeProperty("background");
        nav.style.removeProperty("background-color");
        nav.style.removeProperty("background-image");
      }
    };
  }, []);

  return (
    <AgentContext.Provider value={{ activeAgent, setActiveAgent }}>
      <div
        className="not-prose landing-page"
        style={{
          color: ACCENT,
          fontFamily: "var(--font-copy)",
          marginTop: "calc(var(--vocs-spacing-topNav) * -1) !important",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <LandingStyles />

        <NavLogoOverlay />

        {/* Hero — two-column on desktop: title left, description+CTAs right */}
        <div
          className="landing-hero px-3 md:px-6"
          style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}
        >
          <div className="hero-layout">
            {/* Left: title */}
            <div className="hero-title">
              <Lockup />
            </div>

            {/* Right: description + buttons, vertically justified to match title height */}
            <div className="hero-right">
              <Tagline />
              <div
                className="flex items-center gap-3 md:gap-4 landing-ctas"
                style={{ marginTop: "12px" }}
              >
                <Link
                  to="/quickstart/presto"
                  className="no-underline! rounded-lg transition-opacity hover:opacity-80"
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 500,
                    color: "var(--vocs-background-color-primary)",
                    backgroundColor: ACCENT_MUTED,
                    padding: "0.5rem 1.5rem",
                  }}
                  onClick={() =>
                    captureEvent(AnalyticsEvents.LANDING_CTA_CLICKED, {
                      cta_label: "Use with agents",
                      href: "/quickstart/presto",
                    })
                  }
                >
                  Use with agents
                </Link>
                <Link
                  to="/quickstart"
                  className="no-underline! rounded-lg server-cta"
                  style={{
                    fontSize: "1.0625rem",
                    fontWeight: 500,
                    color: "var(--vocs-text-color-heading)",
                    backgroundColor:
                      "light-dark(rgba(0,0,0,0.04), rgba(255,255,255,0.06))",
                    border: "1px solid var(--vocs-border-color-primary)",
                    transition: "background-color 0.15s, border-color 0.15s",
                    padding: "0.5rem 1.5rem",
                  }}
                  onClick={() =>
                    captureEvent(AnalyticsEvents.LANDING_CTA_CLICKED, {
                      cta_label: "Install to server",
                      href: "/quickstart",
                    })
                  }
                >
                  Install to server
                </Link>
              </div>
            </div>
          </div>
          <div className="designed-by-mobile" style={{ display: "none" }}>
            <DesignedBy />
          </div>
        </div>

        {/* Terminal — explicit height, snaps when it overflows */}
        <div className="landing-terminal px-3 md:px-6">
          <div
            style={{
              height: "clamp(320px, 55vh, 540px)",
              width: "100%",
              maxWidth: 960,
              position: "relative",
            }}
          >
            <Terminal className="absolute inset-0" />
          </div>
        </div>

        {/* Fade overlays — only visible at short viewports via CSS */}
        <div
          className="landing-top-fade"
          style={{
            opacity: scrolledPastHero ? 1 : 0,
            transition: "opacity 0.3s",
          }}
        />
        <div
          className="landing-bottom-fade"
          style={{
            opacity: scrolledPastHero ? 0 : 1,
            transition: "opacity 0.3s",
          }}
        />
      </div>
    </AgentContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Scoped styles
// ---------------------------------------------------------------------------

function LandingStyles() {
  return (
    <style>{`
      [data-v-logo] { visibility: hidden !important; width: 0 !important; overflow: hidden !important; }
      html, body { overflow: hidden !important; height: 100dvh !important; }
      [data-v-main] { padding: 0 !important; margin: 0 !important; overflow: hidden !important; height: 100dvh !important; }
      [data-v-main] article[data-v-content] { padding: 0 !important; margin: 0 !important; max-width: none !important; overflow: hidden !important; }
      [data-v-main] article[data-v-content] > * { margin-top: 0 !important; }
      [data-v-gutter-top] { position: sticky !important; top: 0 !important; z-index: 100 !important; user-select: none !important; -webkit-user-select: none !important; }

      /* Flex column fills remaining viewport below nav */
      .landing-page {
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: calc(100dvh - var(--vocs-spacing-topNav, 56px));
        overflow: hidden;
        row-gap: clamp(2rem, 4vh, 4rem);
      }
      .landing-hero { flex-shrink: 0; margin-top: clamp(2rem, 6vh, 5rem); }

      /* Two-column hero: title left, description+CTAs right */
      .hero-layout {
        display: flex;
        gap: 2.5rem;
        align-items: stretch;
      }
      .hero-title { flex-shrink: 0; }
      .hero-right {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 0.75rem;
        padding: 0.25rem 0;
        margin-top: 10px;
      }

      /* Mobile: stack vertically, fix sizing and order */
      @media (max-width: 767px) {
        .hero-layout { flex-direction: column; gap: 0; }
        .hero-right { gap: 0; margin-top: 0 !important; padding: 0 !important; }
        .hero-title span { font-size: clamp(2.25rem, 7vw, 3.5rem) !important; }
        .hero-title span span:first-child { font-size: clamp(4rem, 18vw, 7rem) !important; margin-left: -4px !important; line-height: 0.85 !important; }
        .lockup-subtitle { text-align: left !important; text-align-last: auto !important; margin-top: 0.25rem !important; letter-spacing: 0.04em !important; }
        .hero-right .text-base { font-size: 1.125rem !important; line-height: 1.6 !important; margin-top: 1.5rem !important; }
        .landing-terminal { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
        .landing-hero { padding: 5.5rem 1.5rem 0 !important; margin-top: 0 !important; }
        .landing-page { row-gap: 1.5rem !important; }
        .landing-ctas { margin-top: 2rem !important; gap: 1rem !important; }
        .landing-ctas a { font-size: 1.0625rem !important; padding: 0.75rem 1.75rem !important; }
        .designed-by-mobile { display: block !important; margin-top: 2.5rem; }
        .NavLogoOverlay-wrap { display: none !important; }
        [data-v-logo] { visibility: visible !important; width: auto !important; overflow: visible !important; }
      }
      .landing-terminal { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
      .landing-top-fade, .landing-bottom-fade { display: none; }

      /* Short viewport: terminal overflows, activate snap scroll */
      @media (max-height: 920px) {
        .landing-page {
          height: calc(100dvh - var(--vocs-spacing-topNav, 56px)) !important;
          overflow-y: auto !important;
          scroll-snap-type: y mandatory !important;
          scroll-behavior: smooth !important;
          justify-content: flex-start !important;
        }
        .landing-hero { scroll-snap-align: start; padding-top: clamp(4rem, 10vh, 7rem); }
        .landing-terminal {
          min-height: calc(100dvh - var(--vocs-spacing-topNav, 64px));
          scroll-snap-align: start;
          padding-bottom: 128px;
          padding-top: 0;
        }

        .landing-top-fade, .landing-bottom-fade { display: block; }

        /* Top fade — dissolves hero when snapped to terminal */
        .landing-top-fade {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 140px;
          background: linear-gradient(to bottom, var(--vocs-background-color-primary) 0%, oklch(from var(--vocs-background-color-primary) l c h / 0.85) 40%, transparent 100%);
          pointer-events: none;
          z-index: 48;
        }

        /* Bottom fade — fades the terminal peek */
        .landing-bottom-fade {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 120px;
          background: linear-gradient(to top, var(--vocs-background-color-primary) 0%, oklch(from var(--vocs-background-color-primary) l c h / 0.8) 30%, transparent 100%);
          pointer-events: none;
          z-index: 49;
        }
      }

      .server-cta:hover {
        background-color: light-dark(rgba(0,0,0,0.08), rgba(255,255,255,0.10)) !important;
        border-color: light-dark(rgba(0,0,0,0.18), rgba(255,255,255,0.18)) !important;
      }

      [data-v-gutter-top][data-v-gutter-top][data-v-gutter-top],
      [data-v-gutter-top][data-v-gutter-top][data-v-gutter-top] * {
        background: linear-gradient(to bottom, var(--vocs-background-color-primary) 60%, transparent 100%) !important;
        background-color: transparent !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border-bottom: none !important;
        box-shadow: none !important;
      }

      @media (max-width: 767px) {
        [data-terminal] p,
        [data-terminal] .text-sm,
        [data-terminal] .font-mono { font-size: inherit !important; }
      }
    `}</style>
  );
}

// ---------------------------------------------------------------------------
// Nav logo overlay — portals to body to escape stacking contexts
// ---------------------------------------------------------------------------

function NavLogoOverlay() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div
      className="NavLogoOverlay-wrap"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "var(--vocs-spacing-topNav, 64px)",
        display: "flex",
        alignItems: "center",
        paddingLeft: "1.25rem",
        paddingTop: 2,
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      <DesignedBy />
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Tagline
// ---------------------------------------------------------------------------

function Tagline() {
  return (
    <div
      className="text-base md:text-lg xl:text-xl leading-relaxed max-w-xl font-normal"
      style={{ color: "var(--vocs-text-color-secondary)" }}
    >
      <div>
        The open protocol for internet-native payments. Charge for API requests,
        tool calls, or content. Agents, apps, and humans securely pay per
        request.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tempo wordmark
// ---------------------------------------------------------------------------

function TempoLogo() {
  return (
    <svg
      style={{ height: 14, width: "auto" }}
      viewBox="0 0 830 185"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tempo"
    >
      <title>Tempo</title>
      <path
        d="M61.5297 181.489H12.6398L57.9524 43.1662H0L12.6398 2.62335H174.096L161.456 43.1662H106.604L61.5297 181.489Z"
        fill="currentColor"
      />
      <path
        d="M243.464 181.489H127.559L185.75 2.62335H301.178L290.207 36.727H223.192L211.029 75.1235H275.898L264.928 108.75H199.821L187.658 147.385H254.196L243.464 181.489Z"
        fill="currentColor"
      />
      <path
        d="M295.923 181.489H257.05L315.479 2.62335H380.348L378.202 99.2107L441.401 2.62335H512.47L454.279 181.489H405.628L444.262 61.2912H443.547L364.131 181.489H335.274L336.466 59.8603H335.989L295.923 181.489Z"
        fill="currentColor"
      />
      <path
        d="M567.193 35.7731L548.353 93.487H553.6C565.524 93.487 575.461 90.7046 583.411 85.1399C591.36 79.4162 596.527 71.3077 598.912 60.8142C600.979 51.7517 599.866 45.3126 595.573 41.4968C591.281 37.681 584.126 35.7731 574.109 35.7731H567.193ZM519.973 181.489H471.083L529.274 2.62335H588.657C602.331 2.62335 614.096 4.84923 623.953 9.30099C633.97 13.5938 641.283 19.7944 645.894 27.903C650.664 35.8526 652.254 45.1536 650.664 55.806C648.597 69.7973 643.191 82.1191 634.447 92.7715C625.702 103.424 614.334 111.692 600.343 117.574C586.511 123.298 571.009 126.16 553.838 126.16H537.859L519.973 181.489Z"
        fill="currentColor"
      />
      <path
        d="M767.195 170.041C750.977 179.581 733.727 184.351 715.443 184.351H714.966C698.749 184.351 685.076 180.773 673.946 173.619C662.976 166.305 655.106 156.448 650.336 144.046C645.725 131.645 644.612 118.051 646.997 103.265C650.018 84.6629 656.934 67.4919 667.745 51.7517C678.557 36.0116 692.071 23.4512 708.288 14.0707C724.505 4.69025 741.836 0 760.279 0H760.755C777.609 0 791.52 3.57731 802.491 10.7319C813.62 17.8865 821.331 27.6645 825.624 40.0658C830.076 52.3082 831.03 66.061 828.486 81.3241C825.465 99.2902 818.549 116.223 807.737 132.122C796.926 147.862 783.412 160.502 767.195 170.041ZM699.703 139.277C703.995 147.385 711.468 151.439 722.121 151.439H722.597C731.342 151.439 739.451 148.18 746.923 141.661C754.555 134.984 760.994 126.08 766.241 114.951C771.646 103.821 775.621 91.4201 778.165 77.7468C780.55 64.3915 779.596 53.6596 775.303 45.551C771.01 37.2835 763.617 33.1497 753.124 33.1497H752.647C744.538 33.1497 736.668 36.4885 729.037 43.1662C721.564 49.8438 715.045 58.8268 709.481 70.1152C703.916 81.4036 699.862 93.646 697.318 106.842C694.774 120.198 695.569 131.009 699.703 139.277Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Stripe wordmark
// ---------------------------------------------------------------------------

function StripeLogo() {
  return (
    <svg
      style={{ height: 22, width: "auto" }}
      viewBox="0 0 60 25"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Stripe"
      fill="currentColor"
    >
      <title>Stripe</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M59.6444 14.2813h-8.062c.1843 1.9296 1.5983 2.5476 3.2032 2.5476 1.6352 0 2.9534-.3656 4.0453-.9506v3.3179c-1.1186.7115-2.5964 1.1068-4.5645 1.1068-4.011 0-6.8218-2.5122-6.8218-7.4783 0-4.19441 2.3837-7.52509 6.3017-7.52509 3.912 0 5.9537 3.28038 5.9537 7.49819 0 .3982-.0372 1.261-.0556 1.4835Zm-5.9241-5.62407c-1.0294 0-2.1739.72812-2.1739 2.58387h4.2573c0-1.85362-1.0721-2.58387-2.0834-2.58387ZM40.9547 20.303c-1.4411 0-2.322-.6087-2.9133-1.0417l-.0088 4.6271-4.1181.8755-.0014-19.19053h3.7543l.0864 1.01784c.6035-.52914 1.6114-1.29157 3.2256-1.29162 2.8925 0 5.6162 2.6052 5.6162 7.39971 0 5.2327-2.6948 7.6037-5.6409 7.6037Zm-.959-11.35573c-.9453 0-1.5376.34559-1.9669.81586l.0245 6.11967c.3997.433.9763.7813 1.9424.7813 1.5231 0 2.5437-1.6575 2.5437-3.8745 0-2.1544-1.037-3.84233-2.5437-3.84233Zm-11.7602-3.3739h4.1341V20.0088h-4.1341V5.57337Zm0-4.694699L32.3696 0v3.35821l-4.1341.87868V.878671ZM23.9198 10.2223v9.7861h-4.1156V5.57296h3.6867l.1317 1.21751c1.0035-1.7722 3.0722-1.41321 3.6209-1.21594v3.78524c-.5242-.16908-2.2894-.42779-3.3237.86253Zm-8.5525 4.7221c0 2.4275 2.5988 1.6719 3.1263 1.4609v3.3522c-.5492.3013-1.5437.5458-2.8901.5458-2.4441 0-4.2773-1.7999-4.2773-4.2379l.0173-13.17658 4.0206-.85464.0032 3.5395h3.1278V9.0857h-3.1278v5.8588-.0001Zm-4.9069.7026c0 2.9645-2.31051 4.6562-5.73464 4.6562-1.41958 0-2.92289-.2761-4.453935-.9347v-3.9319c1.382085.7516 3.093705 1.315 4.457755 1.315.91864 0 1.53106-.2459 1.53106-1.0069C6.26064 13.7786 0 14.5192 0 9.95995 0 7.04457 2.27622 5.2998 5.61655 5.2998c1.36404 0 2.72806.20934 4.09208.75351V9.9317c-1.25265-.67618-2.84332-1.05979-4.09588-1.05979-.86296 0-1.44753.24965-1.44753.8924.0001 1.85329 6.29518.97249 6.29518 5.88279v-.0001Z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Designed by
// ---------------------------------------------------------------------------

function DesignedBy() {
  return (
    <div
      className="flex items-center gap-3"
      style={{ color: "var(--vocs-text-color-muted)" }}
    >
      <span className="text-sm">Designed by</span>
      <a
        href="https://tempo.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline transition-colors flex items-center"
        style={{ color: "inherit" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
        onMouseLeave={(e) => (e.currentTarget.style.color = "inherit")}
      >
        <TempoLogo />
      </a>
      <span className="text-base">×</span>
      <a
        href="https://stripe.com"
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline transition-colors flex items-center"
        style={{ color: "inherit" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#635BFF")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "inherit")}
      >
        <StripeLogo />
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lockup wordmark
// ---------------------------------------------------------------------------

function Lockup() {
  return (
    <span
      style={{
        color: ACCENT,
        fontFamily: '"VTC Du Bois", "Geist Mono", monospace',
        fontSize: "clamp(2rem, 5vw, 3rem)",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        margin: 0,
        textTransform: "uppercase" as const,
        width: "fit-content",
      }}
    >
      <span
        style={{
          fontSize: "clamp(.5rem, 12vw, 7.5rem)",
          display: "block",
          marginLeft: "-4px",
        }}
      >
        Machine
      </span>
      <span
        className="lockup-subtitle"
        style={{
          display: "block",
          textAlign: "justify",
          textAlignLast: "justify",
        }}
      >
        Payments Protocol
      </span>
    </span>
  );
}
