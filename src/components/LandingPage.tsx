"use client";

import { createContext, useEffect, useState } from "react";
import { Link } from "vocs";
import { AnalyticsEvents, captureEvent } from "../lib/posthog";
import { Terminal } from "./Terminal";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "var(--vocs-text-color-heading)";

const TERMINAL_STEPS = [
  Terminal.commands(["./demo.sh"]),
  Terminal.wizard([
    Terminal.chat(),
    Terminal.article(),
    Terminal.image(),
    Terminal.search(),
  ]),
];

// ---------------------------------------------------------------------------
// Context — shares active agent tab index across components
// ---------------------------------------------------------------------------

const AgentContext = createContext<{
  activeAgent: number;
  setActiveAgent: (i: number) => void;
}>({ activeAgent: 0, setActiveAgent: () => {} });

// ---------------------------------------------------------------------------
// Landing page (exported)
// ---------------------------------------------------------------------------

export function LandingPage() {
  const [activeAgent, setActiveAgent] = useState(0);
  useEffect(() => {
    const logoLink = document.querySelector(
      "[data-v-logo] a",
    ) as HTMLAnchorElement;
    if (!logoLink) return;
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    logoLink.addEventListener("click", handler);
    return () => logoLink.removeEventListener("click", handler);
  }, []);

  return (
    <AgentContext.Provider value={{ activeAgent, setActiveAgent }}>
      <div
        className="not-prose landing-page"
        style={{
          color: ACCENT,
          fontFamily: "var(--font-copy)",
        }}
      >
        <LandingStyles />

        {/* Hero + Terminal */}
        <div className="landing-main-section">
          <div className="landing-hero-part">
            <Hero />
          </div>

          <div className="landing-terminal-part">
            <div className="landing-terminal">
              <p className="landing-scroll-cta landing-try-cta">Try MPP now</p>

              <div
                className="landing-terminal-inner"
                style={{
                  height: 510,
                  width: "100%",
                  maxWidth: 960,
                  position: "relative",
                }}
              >
                <Terminal
                  className="absolute inset-0"
                  steps={TERMINAL_STEPS}
                  showLastVisit={false}
                />
                <div className="designed-by-desktop">
                  <DesignedBy />
                </div>
              </div>
              <div
                className="designed-by-mobile"
                style={{ width: "100%", maxWidth: 960 }}
              >
                <DesignedBy />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AgentContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Scoped styles injected into the page
// ---------------------------------------------------------------------------

function LandingStyles() {
  return (
    <style>{`
      :has(.landing-page) [data-v-logo] { display: flex !important; align-items: center !important; gap: 0.75rem !important; }
      :has(.landing-page) [data-v-main] { padding: 0 !important; margin: 0 !important; }
      :has(.landing-page) [data-v-main] article[data-v-content] { padding: 0 !important; margin: 0 !important; max-width: none !important; }
      :has(.landing-page) [data-v-main] article[data-v-content] > * { margin-top: 0 !important; }
      :has(.landing-page) [data-v-gutter-top] { position: sticky !important; top: 0 !important; z-index: 200 !important; user-select: none !important; -webkit-user-select: none !important; }

      .landing-page {
        margin-top: 0 !important;

      }

      /* ---- Main section: hero + terminal ---- */
      .landing-main-section {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: stretch;
        gap: 40px;
        min-height: calc(100dvh - var(--vocs-spacing-topNav, 56px) - 100px);
        position: relative;
      }

      .landing-hero-part {
        flex-shrink: 0;
        flex-grow: 0;
        display: flex;
        flex-direction: column;
      }
      .landing-hero { flex-shrink: 0; }

      .hero-row {
        display: flex;
        align-items: center;
        gap: clamp(2rem, 4vw, 4rem);
      }
      .hero-left { flex-shrink: 0; }
      .hero-right {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      /* Shimmer CTA — only visible on mobile */
      .landing-try-cta { display: none !important; }

      /* ---- Terminal part ---- */
      .landing-terminal-part {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 0;
        padding: 0 0.75rem;
      }

      .landing-terminal {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 0;
        width: 100%;
        padding: 0 0.75rem;
      }

      .landing-terminal-inner {
        flex: 1;
        min-height: 300px;
        max-height: 510px;
        border: 1px solid oklch(from var(--vocs-text-color-secondary) l c h / 0.12);
        border-radius: 12px;
        animation: terminalBorderShimmer 5s ease-in-out infinite;
      }

      .term-wizard-list { padding-left: 0; }

      @keyframes terminalBorderShimmer {
        0%, 100% { border-color: oklch(from var(--vocs-text-color-secondary) l c h / 0.08); }
        50% { border-color: oklch(from var(--vocs-text-color-secondary) l c h / 0.22); }
      }

      /* ---- DesignedBy ---- */
      .designed-by {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-end;
        gap: 0.35rem;
        position: relative;
        z-index: 10;
        margin-top: 0.5rem;
      }
      .designed-by-desktop { display: none; }
      .designed-by-mobile { margin-top: 12px; }
      @media (min-width: 768px) {
        .designed-by-desktop {
          display: block;
          position: absolute;
          bottom: 16px;
          right: 20px;
          z-index: 10;
        }
        .designed-by-desktop .designed-by {
          justify-content: flex-end;
          margin-top: 0;
        }
        .designed-by-mobile { display: none; }
      }

      .lockup-h1,
      .discovery-overlay-title {
        font-family: "VTC Du Bois", var(--font-sans) !important;
        text-transform: uppercase;
      }
      .lockup-for-light { }
      .lockup-for-dark { display: none; }
      :root[style*="color-scheme: dark"] .lockup-for-light { display: none; }
      :root[style*="color-scheme: dark"] .lockup-for-dark { display: block; }

      /* ---- Scroll CTA shimmer divider ---- */
      .landing-scroll-cta {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        color: var(--vocs-text-color-muted);
        font-size: 0.75rem;
        font-family: var(--font-mono, "Geist Mono", monospace);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin: 0;
        padding: 0;
        margin-top: auto;
        width: 100%;
        white-space: nowrap;
        opacity: 0.6;
        animation: ctaTextShimmer 5s ease-in-out infinite;
      }
      .landing-scroll-cta::before,
      .landing-scroll-cta::after {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg,
          oklch(from var(--vocs-text-color-secondary) l c h / 0.15),
          oklch(from var(--vocs-text-color-secondary) l c h / 0.4),
          oklch(from var(--vocs-text-color-secondary) l c h / 0.15));
        background-size: 200% 100%;
        animation: borderShimmer 5s ease-in-out infinite;
      }
      @keyframes borderShimmer {
        0%, 100% { background-position: 200% 0; }
        50% { background-position: -200% 0; }
      }
      @keyframes ctaTextShimmer {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.75; }
      }

      /* ---- Small screens: stack hero columns (mobile only, NOT tablet) ---- */
      @media (max-width: 767px) {
        .hero-row { flex-direction: column; align-items: flex-start; gap: 1rem; }
        .hero-left h1 { line-height: 0.95 !important; }
        .landing-hero { padding-left: 1.75rem !important; padding-right: 1.75rem !important; }
        .landing-ctas { margin-top: 1.5rem !important; }
        .hero-right .text-base { font-size: 1.0625rem !important; line-height: 1.65 !important; }
      }

      /* ---- Tablet ---- */
      @media (min-width: 768px) and (max-width: 1079px) {
        .landing-hero-part { padding-left: clamp(2rem, 5vw, 4rem); padding-right: clamp(2rem, 5vw, 4rem); }
        .landing-terminal-inner { max-width: 720px !important; }
        .landing-terminal { padding-left: 1.75rem !important; padding-right: 1.75rem !important; }
        .hero-row { flex-direction: column !important; align-items: center !important; text-align: center; gap: 1.25rem !important; }
        .hero-right { align-items: center !important; }
        .landing-ctas { justify-content: center !important; }
      }

      /* ---- Desktop ---- */
      @media (min-width: 1080px) {
        .landing-hero-part { padding-left: clamp(3rem, 6vw, 6rem); padding-right: clamp(3rem, 6vw, 6rem); }
        .landing-terminal-inner { max-width: 960px !important; }
        .hero-right { padding-right: 2rem !important; }
      }

      /* ---- Tablet+ layout ---- */
      @media (min-width: 768px) {
        .landing-terminal-part { flex: 0 1 auto !important; }
        .landing-terminal { flex: 0 1 auto !important; }
        .landing-terminal-inner { flex: 0 0 auto !important; }
      }

      /* ---- Transparent header on tablet+ ---- */
      @media (min-width: 768px) {
        :has(.landing-page) [data-v-gutter-top],
        :has(.landing-page) [data-v-header],
        :has(.landing-page) header {
          background: transparent !important;
          background-color: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border-bottom: none !important;
          box-shadow: none !important;
        }
        .landing-terminal { padding-left: 1.5rem; padding-right: 1.5rem; }
      }

      /* ---- Mobile ---- */
      @media (max-width: 767px) {

        /* Force gradient nav background */
        :has(.landing-page) [data-v-gutter-top] {
          background: linear-gradient(to bottom, var(--vocs-background-color-primary) 60%, transparent) !important;
          background-color: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border-bottom: none !important;
          box-shadow: none !important;
        }
        :has(.landing-page) [data-v-header],
        :has(.landing-page) header {
          background: transparent !important;
          background-color: transparent !important;
        }

        /* ---- Mobile layout ---- */

        .landing-main-section {
          min-height: auto !important;
          padding: 0 !important;
          display: block !important;
        }

        .landing-hero-part {
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          padding: 0 1.75rem 2rem !important;
          margin-top: 2rem !important;
          z-index: 1 !important;
        }
        .landing-hero-part .landing-hero {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        /* Show shimmer CTA above terminal */
        .landing-try-cta {
          display: flex !important;
          font-size: 0.75rem !important;
          margin-top: 2rem !important;
          flex-shrink: 0 !important;
          padding: 0 0.5rem !important;
          opacity: 0.6 !important;
          animation: ctaTextShimmer 5s ease-in-out infinite !important;
        }

        .landing-terminal-part {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          padding: 0 1rem !important;
        }
        .landing-terminal-part .landing-terminal {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          width: 100% !important;
          gap: 24px;
        }
        .landing-terminal-inner {
          max-height: 65vh !important;
          min-height: 420px !important;
          min-width: 90vw !important;
        }

        /* Hero content styles */
        .hero-row { align-items: center !important; text-align: center; gap: 1.5rem !important; }
        .hero-right { align-items: center !important; max-width: 90vw; gap: 0.75rem; }
        .landing-ctas { justify-content: center !important; margin-top: 1.5rem !important; }
        .lockup-img { width: clamp(260px, 72vw, 380px) !important; }

        /* DesignedBy row */
        .designed-by {
          flex-direction: row !important;
          align-items: center !important;
          gap: 8px !important;
          margin-top: 0.75rem !important;
          width: 100%;
          justify-content: center !important;
        }
        .designed-by-mobile { margin-top: 0rem; margin-bottom: 50px; display: flex; flex-direction: row; }

        /* Terminal font sizes */
        .term-wizard-list { padding-left: 0 !important; }
        .term-wizard-btn {
          display: block !important;
          width: 100% !important;
          padding: 0.5rem 0.75rem !important;
          margin: 0.2rem 0 !important;
          border: 1px solid var(--term-gray4) !important;
          border-radius: 6px !important;
          line-height: 1.5 !important;
          font-size: 13.5px !important;
        }

        .landing-scroll-cta { font-size: 0.8rem !important; margin-top: 0.5rem !important; margin-bottom: 0.25rem !important; }
      }
    `}</style>
  );
}

// ---------------------------------------------------------------------------
// "Designed by" — rendered below the terminal
// ---------------------------------------------------------------------------

function DesignedBy() {
  return (
    <div
      className="designed-by flex !flex-row items-center justify-center gap-2"
      style={{
        color: "var(--vocs-text-color-muted)",
        whiteSpace: "nowrap",
        opacity: 0.7,
      }}
    >
      <span
        className="tracking-widest uppercase"
        style={{
          fontFamily: 'var(--font-mono, "Geist Mono", monospace)',
          fontSize: "11px",
          paddingRight: "2px",
        }}
      >
        Designed by
      </span>
      <a
        href="https://tempo.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline transition-colors flex items-center"
        style={{ color: "inherit" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = ACCENT;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "inherit";
        }}
      >
        <TempoLogo />
      </a>
      <span style={{ fontSize: "13px" }}>×</span>
      <a
        href="https://stripe.com"
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline transition-colors flex items-center"
        style={{ color: "inherit" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#635BFF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "inherit";
        }}
      >
        <StripeLogo />
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero section
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section
      className="landing-hero px-3 md:px-6"
      style={{ position: "relative", zIndex: 2 }}
    >
      <div
        className="hero-row"
        style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}
      >
        <div className="hero-left">
          <Lockup />
        </div>
        <div className="hero-right">
          <Tagline />
          <div className="flex items-center gap-4 mt-3 landing-ctas">
            <Link
              to="/quickstart/agent"
              className="no-underline! px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80"
              style={{
                fontSize: "0.9375rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                color: "light-dark(#fff, #111)",
                backgroundColor: "light-dark(#111, rgba(255,255,255,0.92))",
              }}
              onClick={() =>
                captureEvent(AnalyticsEvents.LANDING_CTA_CLICKED, {
                  cta_label: "Use with agents",
                  href: "/quickstart/agent",
                })
              }
            >
              Use with agents
            </Link>
            <Link
              to="/quickstart/server"
              className="no-underline! px-5 py-2.5 rounded-lg transition-opacity hover:opacity-80"
              style={{
                fontSize: "0.9375rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                color: "var(--vocs-text-color-heading)",
                backgroundColor: "light-dark(#fff, rgba(255,255,255,0.06))",
                border: "1px solid var(--vocs-border-color-primary)",
              }}
              onClick={() =>
                captureEvent(AnalyticsEvents.LANDING_CTA_CLICKED, {
                  cta_label: "Add payments to your API",
                  href: "/quickstart/server",
                })
              }
            >
              Add payments to your API
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tagline
// ---------------------------------------------------------------------------

function Tagline() {
  return (
    <div
      className="leading-relaxed max-w-xl font-normal max-[1080px]:max-w-lg"
      style={{ color: "var(--vocs-text-color-secondary)" }}
    >
      The open protocol for machine-to-machine payments. Charge for API
      requests, tool calls, or content—agents and apps pay per request in the
      same HTTP call.
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
      viewBox="0 0 832 185"
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
// Lockup wordmark (light/dark SVG with entrance animation)
// ---------------------------------------------------------------------------

function Lockup() {
  return (
    <h1 className="lockup-h1" style={{ margin: 0 }}>
      <img
        src="/lockup-dark.svg"
        alt="Machine Payments Protocol"
        className="lockup-img lockup-for-light"
        style={{
          height: "auto",
          width: "clamp(288px, 33.6vw, 456px)",
          marginTop: "1rem",
        }}
      />
      <img
        src="/lockup-light.svg"
        alt="Machine Payments Protocol"
        className="lockup-img lockup-for-dark"
        style={{
          height: "auto",
          width: "clamp(288px, 33.6vw, 456px)",
          marginTop: "1rem",
        }}
      />
    </h1>
  );
}
