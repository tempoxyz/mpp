"use client";

import { useMutation } from "@tanstack/react-query";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { Link } from "vocs";
import { useConnectorClient } from "wagmi";
import { fetch } from "../mppx.client";
import { pathUsd } from "../wagmi.config";
import * as Cli from "./Cli";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "var(--vocs-text-color-heading)";
const AGENT_COLOR = "#16A34A";
const ANIM_STORAGE_KEY = "mpp-landing-animated";
const PRESTO_INSTALL =
  "curl -fsSL https://raw.githubusercontent.com/tempoxyz/presto/main/install.sh | bash";
const PRESTO_LOGIN = "presto login";
const QUICKSTART_URL = "https://mpp.sh/quickstart/client.md";
const SERVICES_URL = "https://mpp.tempo.xyz/llms.txt";

// ---------------------------------------------------------------------------
// Context — shares active agent tab index across components
// ---------------------------------------------------------------------------

const AgentContext = createContext<{
  activeAgent: number;
  setActiveAgent: (i: number) => void;
}>({ activeAgent: 0, setActiveAgent: () => {} });

// ---------------------------------------------------------------------------
// Entrance animation helper
// ---------------------------------------------------------------------------

function anim(active: boolean, delayMs: number, durationMs = 900) {
  if (!active) return {};
  return {
    opacity: 0,
    transform: "translateY(12px)",
    animation: `reveal ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms forwards`,
  } as React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Landing page (exported)
// ---------------------------------------------------------------------------

export function LandingPage() {
  const [activeAgent, setActiveAgent] = useState(0);

  const [shouldAnimate, setShouldAnimate] = useState(false);
  useEffect(() => {
    const already = localStorage.getItem(ANIM_STORAGE_KEY);
    if (already) return;
    localStorage.setItem(ANIM_STORAGE_KEY, "1");
    setShouldAnimate(true);
  }, []);

  return (
    <AgentContext.Provider value={{ activeAgent, setActiveAgent }}>
      <div
        className="not-prose"
        style={{
          color: ACCENT,
          fontFamily: "var(--font-copy)",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <LandingStyles />
        <Hero shouldAnimate={shouldAnimate} />
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
			[data-v-logo] { visibility: hidden !important; width: 0 !important; overflow: hidden !important; }
			[data-v-main] { padding-bottom: 0 !important; }
			[data-v-main] article[data-v-content] { padding-top: 0 !important; padding-bottom: 0 !important; }
			[data-v-main] article[data-v-content] > * { margin-top: 0 !important; }
			[data-v-gutter-top] { position: fixed !important; z-index: 50 !important; user-select: none !important; -webkit-user-select: none !important; }

			.landing-hero {
				min-height: calc(100dvh - var(--vocs-spacing-topNav, 64px) - var(--vocs-spacing-banner, 0px));
			}

			.lockup-wide { display: none; }
			.lockup-stacked { display: block; }

			@media (min-width: 768px) {
				[data-v-gutter-top] {
					background: linear-gradient(to bottom, oklch(from var(--vocs-background-color-primary) l c h / 0.97) 0%, oklch(from var(--vocs-background-color-primary) l c h / 0.7) 60%, transparent 100%) !important;
					backdrop-filter: blur(12px) !important;
					-webkit-backdrop-filter: blur(12px) !important;
				}
				[data-v-main]::after {
					content: '';
					position: fixed;
					bottom: 0; left: 0; right: 0;
					height: 80px;
					background: linear-gradient(to top, oklch(from var(--vocs-background-color-primary) l c h / 0.8) 0%, transparent 100%);
					pointer-events: none;
					z-index: 49;
				}
			}

			@media (min-width: 1280px) {
				.landing-hero {
					height: calc(100dvh - var(--vocs-spacing-topNav, 64px) - var(--vocs-spacing-banner, 0px));
					min-height: auto;
					overflow: hidden;
				}
			}

			@media (max-width: 1023px) {
				.hero-right .lockup-wide { display: none !important; }
				.hero-right .lockup-stacked { display: block !important; }
				.co-designed-by { padding-top: 64px; }
			}

			@media (max-width: 767px) {
				.lockup-stacked { max-width: 320px; margin: 0 auto; }
				.hero-right {
					align-items: center !important;
					text-align: center !important;
				}
				.cli-demo-pane { margin: 0 auto; }
				[data-v-gutter-top] {
					background: var(--vocs-background-color-primary) !important;
					background-color: var(--vocs-background-color-primary) !important;
					backdrop-filter: none !important;
					-webkit-backdrop-filter: none !important;
				}
				.lockup-stacked { max-width: 320px; }
				.hero-right { align-items: flex-start !important; text-align: left !important; }
				.co-designed-by { padding-top: 32px; }
				.not-prose p { font-size: 17px; }
				.not-prose .text-sm { font-size: 15px; }
				.not-prose .font-mono { font-size: 15px; }

				section { padding-bottom: max(1.5rem, env(safe-area-inset-bottom, 1.5rem)) !important; }
			}

			@keyframes reveal {
				from { opacity: 0; transform: translateY(12px); }
				to { opacity: 1; transform: translateY(0); }
			}
		`}</style>
  );
}

// ---------------------------------------------------------------------------
// Hero section
// ---------------------------------------------------------------------------

function Hero({ shouldAnimate }: { shouldAnimate: boolean }) {
  return (
    <section
      className="landing-hero flex flex-col items-center px-6"
      style={{
        position: "relative",
        zIndex: 2,
      }}
    >
      <div
        className="w-full flex flex-col items-center"
        style={{
          maxWidth: 1200,
          marginTop: "auto",
          marginBottom: "auto",
          paddingTop: 24,
        }}
      >
        {/* Two-column layout: CLI left, hero right */}
        <div className="w-full flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">
          {/* Left pane — interactive CLI demo (animates in first) */}
          <div
            className="cli-demo-pane flex-[11] w-full min-w-0 flex flex-col order-last lg:order-first max-w-[574px] lg:max-w-none"
            style={anim(shouldAnimate, 200, 900)}
          >
            <Cli.Demo
              title="agent-demo"
              token={pathUsd}
              height={337}
              restartStep={1}
            >
              <Cli.Startup />
              <Cli.ConnectWallet />
              <Cli.Faucet />
              <SelectQuery />
            </Cli.Demo>
          </div>

          {/* Right pane — hero content (staggers in after CLI) */}
          <div className="hero-right flex-[9] min-w-0 order-first lg:order-last text-left flex flex-col items-start justify-between gap-5">
            {/* Lockup */}
            <div
              className=""
              style={{
                width: "min(560px, 92vw)",
                ...anim(shouldAnimate, 800, 900),
              }}
            >
              <Lockup />
            </div>

            {/* Co-designed by */}
            <div style={anim(shouldAnimate, 1100, 700)}>
              <CoDesignedBy shouldAnimate={false} />
            </div>

            {/* Tagline */}
            <Tagline shouldAnimate={shouldAnimate} />

            {/* Agent prompt tabs + CTA — centered in remaining space */}
            <div className="w-full flex flex-col items-start gap-5 lg:my-auto">
              <div
                className="w-full max-w-xl"
                style={anim(shouldAnimate, 1800, 700)}
              >
                <AgentTabs />
              </div>
              <div
                className="flex flex-col items-start gap-3"
                style={anim(shouldAnimate, 2100, 700)}
              >
                <CTAButtons />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tagline — extracted to avoid JSX whitespace indent issues
// ---------------------------------------------------------------------------

function Tagline({ shouldAnimate }: { shouldAnimate: boolean }) {
  return (
    <div
      className="text-base leading-relaxed max-w-xl font-normal"
      style={{
        color: "var(--vocs-text-color-secondary)",
        ...anim(shouldAnimate, 1400, 700),
      }}
    >
      <div>
        The open protocol for internet-native payments. Charge for API calls,
        tool calls, or content. Agents, apps, and humans securely pay per call.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// "Co-designed by Tempo x Stripe"
// ---------------------------------------------------------------------------

function CoDesignedBy({ shouldAnimate }: { shouldAnimate: boolean }) {
  return (
    <div className="co-designed-by inline-flex flex-col items-center gap-2">
      <div
        className="flex items-center gap-3"
        style={{
          fontFamily: "var(--font-mono)",
          ...anim(shouldAnimate, 300, 800),
        }}
      >
        <span
          className="font-medium font-mono uppercase"
          style={{
            color: "var(--vocs-text-color-muted)",
            letterSpacing: "0.1em",
            fontSize: "12px",
            paddingTop: 2,
          }}
        >
          Co-designed by
        </span>
        <a
          href="https://tempo.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline"
          style={{
            color: "var(--vocs-text-color-primary)",
            opacity: 0.5,
            transition: "opacity 0.15s",
            display: "inline-flex",
            willChange: "opacity",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.5";
          }}
        >
          <TempoLogo style={{ height: 14, width: "auto" }} />
        </a>
        <span
          className="text-[12px]"
          style={{ color: "var(--vocs-text-color-muted)", opacity: 1 }}
        >
          &times;
        </span>
        <a
          href="https://stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="no-underline"
          style={{
            color: "var(--vocs-text-color-primary)",
            opacity: 0.5,
            transition: "opacity 0.15s, color 0.15s",
            display: "inline-flex",
            willChange: "opacity",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.color = "#635BFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.5";
            e.currentTarget.style.color = "var(--vocs-text-color-primary)";
          }}
        >
          <StripeLogo style={{ height: 22, width: "auto" }} />
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lockup wordmark
// ---------------------------------------------------------------------------

function Lockup() {
  const lockupSize = "clamp(2rem, 5.5vw, 2.85rem)";

  return (
    <div
      style={{
        color: ACCENT,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        lineHeight: 1,
        opacity: 0.9,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: lockupSize,
          fontWeight: 550,
          letterSpacing: "-0.055em",
        }}
      >
        MACHINE PAYMENTS PROTOCOL
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent tab logos
// ---------------------------------------------------------------------------

function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3.127 10.604l3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z" />
    </svg>
  );
}

function OpenAILogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function AmpLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.9197 13.61L17.3816 26.566L14.242 27.4049L11.2645 16.2643L0.119926 13.2906L0.957817 10.15L13.9197 13.61Z" />
      <path d="M13.7391 16.0892L4.88169 24.9056L2.58872 22.6019L11.4461 13.7865L13.7391 16.0892Z" />
      <path d="M18.9386 8.58315L22.4005 21.5392L19.2609 22.3781L16.2833 11.2374L5.13879 8.26381L5.97668 5.12318L18.9386 8.58315Z" />
      <path d="M23.9803 3.55632L27.4422 16.5124L24.3025 17.3512L21.325 6.21062L10.1805 3.23698L11.0183 0.0963593L23.9803 3.55632Z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Partner logos
// ---------------------------------------------------------------------------

function TempoLogo({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
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

function StripeLogo({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
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
// CTA buttons
// ---------------------------------------------------------------------------

function CTAButtons() {
  const [hovered, setHovered] = useState<"primary" | "secondary" | null>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap gap-3">
        <Link
          to="/quickstart"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-md no-underline! transition-all duration-150"
          style={{
            backgroundColor: ACCENT,
            color: "var(--vocs-background-color-primary)",
            opacity: hovered === "primary" ? 0.85 : 1,
          }}
          onMouseEnter={() => setHovered("primary")}
          onMouseLeave={() => setHovered(null)}
        >
          Get started
        </Link>
        <Link
          to="/protocol"
          className="cta-secondary inline-flex items-center gap-2 px-5 py-2.5 border text-sm font-medium rounded-md no-underline transition-all duration-150"
          style={{
            borderColor: "var(--vocs-border-color-primary)",
            backgroundColor:
              "light-dark(var(--vocs-background-color-surface), oklch(0.28 0 0))",
            color:
              hovered === "secondary"
                ? ACCENT
                : "var(--vocs-text-color-heading)",
          }}
          onMouseEnter={() => setHovered("secondary")}
          onMouseLeave={() => setHovered(null)}
        >
          Learn more
        </Link>
      </div>
      <div
        className="text-sm transition-opacity duration-200"
        style={{
          color: "var(--vocs-text-color-muted)",
          opacity: hovered ? 1 : 0,
          height: 20,
          marginTop: 8,
        }}
      >
        {hovered === "primary" && "Let your agent use paid APIs instantly"}
        {hovered === "secondary" && "How MPP works under the hood"}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent prompt tabs (Claude / Codex / Amp)
// ---------------------------------------------------------------------------

function AgentTabs() {
  const { activeAgent: active, setActiveAgent: setActive } =
    useContext(AgentContext);
  const [copied, setCopied] = useState(false);
  const setupPrompt = `"Add ${QUICKSTART_URL} (MPP quickstart) & ${SERVICES_URL} (MPP service endpoints) to my SKILLS.md for future reference."`;
  const commands = [
    {
      label: "Claude",
      bin: "claude",
      args: "-p",
      icon: ClaudeLogo,
      prompt: `"Read https://mpp.sh/overview.md and charge agents 0.01 USD for using my API"`,
    },
    {
      label: "Codex",
      bin: "codex",
      args: null,
      icon: OpenAILogo,
      prompt: `"Read https://mpp.sh/overview.md and charge agents 0.01 USD for reading my site"`,
    },
    {
      label: "Amp",
      bin: "amp",
      args: null,
      icon: AmpLogo,
      prompt: `"Read https://mpp.sh/overview.md and charge agents 0.01 USD per MCP tool call"`,
    },
  ];
  const cmd = commands[active];
  const setupCmd = [cmd.bin, cmd.args, setupPrompt].filter(Boolean).join(" ");
  const taskCmd = [cmd.bin, cmd.args, cmd.prompt].filter(Boolean).join(" ");
  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${PRESTO_INSTALL} && ${PRESTO_LOGIN} && ${setupCmd} && ${taskCmd}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="w-full max-w-xl rounded-md overflow-hidden text-left"
      style={{
        border: "1px solid var(--vocs-border-color-primary)",
        boxShadow:
          "light-dark(0 0 40px rgba(0,0,0,0.04), 0 0 40px rgba(255,255,255,0.03)), 0 1px 3px light-dark(rgba(0,0,0,0.08), rgba(0,0,0,0.2))",
      }}
    >
      <div
        className="flex"
        style={{
          background:
            "light-dark(var(--vocs-background-color-surfaceMuted), oklch(0.22 0 0))",
          borderBottom: "1px solid var(--vocs-border-color-primary)",
        }}
      >
        {commands.map((a, i) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              type="button"
              onClick={() => setActive(i)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer"
              style={{
                color: i === active ? ACCENT : "var(--vocs-text-color-muted)",
                background:
                  i === active
                    ? "var(--vocs-background-color-surface)"
                    : "transparent",
                borderRight:
                  i < commands.length - 1
                    ? "1px solid var(--vocs-border-color-secondary)"
                    : "none",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {a.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="px-3 py-2 flex items-center justify-between gap-3 w-full text-left cursor-pointer transition-colors"
        style={{ color: "var(--vocs-background-color-surface)" }}
      >
        <span
          className="font-mono whitespace-pre-wrap break-words text-left"
          style={{
            fontSize: 13,
            margin: 0,
            padding: 0,
            userSelect: "text",
            WebkitUserSelect: "text",
          }}
        >
          <span style={{ color: "var(--vocs-text-color-muted)", opacity: 0.4 }}>
            $
          </span>
          <span style={{ color: "var(--vocs-text-color-heading)" }}>
            {" "}
            {cmd.bin}
          </span>
          {cmd.args && (
            <span
              style={{ color: "var(--vocs-text-color-heading)", opacity: 0.6 }}
            >
              {" "}
              {cmd.args}
            </span>
          )}
          <span style={{ color: AGENT_COLOR }}> {cmd.prompt}</span>
        </span>
        <span
          className="hover:text-accent transition-colors shrink-0"
          style={{ color: "var(--vocs-text-color-muted)" }}
        >
          {copied ? (
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
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
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
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CLI Demo: query presets & interactive select
// ---------------------------------------------------------------------------

type ApiCall = {
  description: string;
  endpoint: string;
  name: string;
  params?: Record<string, string>;
  price: string;
};

type QueryPreset = {
  calls: ApiCall[];
  id: string;
  label: string;
  prompt: string;
  response: string;
};

const presets: QueryPreset[] = [
  {
    calls: [
      {
        description: "Get current location",
        endpoint: "/api/agent/location",
        name: "location.lookup",
        price: "$0.001",
      },
      {
        description: "Search nearby coffee shops",
        endpoint: "/api/agent/search",
        name: "places.search",
        params: { q: "coffee" },
        price: "$0.002",
      },
      {
        description: "Aggregate reviews for top result",
        endpoint: "/api/agent/reviews",
        name: "reviews.aggregate",
        params: { place: "place_001" },
        price: "$0.003",
      },
      {
        description: "Get walking directions",
        endpoint: "/api/agent/directions",
        name: "directions.get",
        params: { to: "The Coffee Movement" },
        price: "$0.002",
      },
    ],
    id: "coffee",
    label: "Coffee Shop",
    prompt: "Find the best coffee shop nearby",
    response:
      '"The Coffee Movement is the top-rated coffee shop nearby (4.6★, 0.4mi). Known for specialty pour-overs and single-origin beans. It\'s an 8 minute walk — head north on Market St to Nob Hill, 1030 Washington St."',
  },
  {
    calls: [
      {
        description: "Get current location",
        endpoint: "/api/agent/location",
        name: "location.lookup",
        price: "$0.001",
      },
      {
        description: "Search Italian restaurants",
        endpoint: "/api/agent/search",
        name: "places.search",
        params: { q: "italian restaurant" },
        price: "$0.002",
      },
      {
        description: "Check ratings and availability",
        endpoint: "/api/agent/reviews",
        name: "reviews.aggregate",
        params: { place: "place_002" },
        price: "$0.003",
      },
      {
        description: "Get directions to restaurant",
        endpoint: "/api/agent/directions",
        name: "directions.get",
        params: { to: "Flour + Water" },
        price: "$0.002",
      },
    ],
    id: "restaurant",
    label: "Restaurant",
    prompt: "Find a highly-rated Italian restaurant",
    response:
      '"Flour + Water is an excellent choice — 4.7★ with 2,400+ reviews. Known for house-made pasta. It\'s 0.8mi away, about 15 min walk or 5 min drive."',
  },
  {
    calls: [
      {
        description: "Get current location",
        endpoint: "/api/agent/location",
        name: "location.lookup",
        price: "$0.001",
      },
      {
        description: "Search parking garages",
        endpoint: "/api/agent/search",
        name: "places.search",
        params: { q: "parking garage Union Square" },
        price: "$0.002",
      },
      {
        description: "Check availability and rates",
        endpoint: "/api/agent/reviews",
        name: "reviews.aggregate",
        params: { place: "place_003" },
        price: "$0.003",
      },
      {
        description: "Get driving directions",
        endpoint: "/api/agent/directions",
        name: "directions.get",
        params: { to: "Union Square Garage" },
        price: "$0.002",
      },
    ],
    id: "parking",
    label: "Parking",
    prompt: "Find available parking near Union Square",
    response:
      '"Union Square Garage has spots available — $8/hr or $32 max daily. 450 Post St entrance. Turn right on Geary, 2 blocks, garage on left. ~3 min drive."',
  },
  {
    calls: [
      {
        description: "Get current location",
        endpoint: "/api/agent/location",
        name: "location.lookup",
        price: "$0.001",
      },
      {
        description: "Get weather data",
        endpoint: "/api/agent/search",
        name: "places.search",
        params: { q: "weather forecast" },
        price: "$0.002",
      },
      {
        description: "Aggregate hourly forecast",
        endpoint: "/api/agent/reviews",
        name: "reviews.aggregate",
        params: { place: "weather_001" },
        price: "$0.003",
      },
      {
        description: "Check precipitation timing",
        endpoint: "/api/agent/directions",
        name: "directions.get",
        params: { to: "forecast" },
        price: "$0.002",
      },
    ],
    id: "weather",
    label: "Weather",
    prompt: "What's the weather today?",
    response:
      '"Currently 62°F and partly cloudy in San Francisco. 20% chance of light rain after 4pm. I\'d suggest bringing a light jacket — umbrella optional."',
  },
];

function SelectQuery() {
  const { data: client } = useConnectorClient();

  const [results, setResults] = useState<
    {
      calls: ApiCall[];
      query: QueryPreset;
      status: "pending" | "done" | "error";
    }[]
  >([]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (queryId: string) => {
      const query = presets.find((q) => q.id === queryId);
      if (!query) throw new Error("Unknown query");

      const index = results.length;
      setResults((r) => [...r, { calls: [], query, status: "pending" }]);

      for (const call of query.calls) {
        const url = new URL(call.endpoint, window.location.origin);
        if (call.params)
          for (const [key, value] of Object.entries(call.params))
            url.searchParams.set(key, value);

        setResults((r) =>
          r.map((item, i) =>
            i === index ? { ...item, calls: [...item.calls, call] } : item,
          ),
        );

        await fetch(url.toString(), {
          context: { account: client?.account },
        });

        await new Promise((r) => setTimeout(r, 800));
      }

      setResults((r) =>
        r.map((item, i) => (i === index ? { ...item, status: "done" } : item)),
      );

      await new Promise((r) => setTimeout(r, 1000));
    },
    onError: () => {
      setResults((r) => {
        const last = r.length - 1;
        return r.map((item, i) =>
          i === last ? { ...item, status: "error" } : item,
        );
      });
    },
  });

  return (
    <>
      {results.map((result, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable list
        <QueryResult key={i} {...result} />
      ))}
      {!isPending && (
        <Cli.Block>
          <Cli.Line variant="info">Select a query to run:</Cli.Line>
          <Cli.Select autoFocus onSubmit={(v) => mutate(v)}>
            {presets.map((query) => (
              <Cli.Select.Option key={query.id} value={query.id}>
                {query.prompt}
              </Cli.Select.Option>
            ))}
          </Cli.Select>
        </Cli.Block>
      )}
    </>
  );
}

function QueryResult({
  calls,
  query,
  status,
}: {
  calls: ApiCall[];
  query: QueryPreset;
  status: "pending" | "done" | "error";
}) {
  return (
    <Cli.Block>
      <Cli.Line variant="input" prefix="❯">
        agent.query("{query.prompt}")
      </Cli.Line>
      <Cli.Line variant="info">
        Planning: {query.calls.length} API calls, ~$
        {query.calls
          .reduce((sum, c) => sum + Number.parseFloat(c.price.slice(1)), 0)
          .toFixed(3)}{" "}
        total
      </Cli.Line>
      <Cli.Blank />
      {calls.map((call, i) => (
        <div key={call.name}>
          <Cli.Line variant="warning" prefix="→">
            [{i + 1}/{query.calls.length}] {call.name} — {call.price}
          </Cli.Line>
          {i === calls.length - 1 && status === "pending" ? (
            <Cli.Line variant="loading">{call.description}...</Cli.Line>
          ) : (
            <Cli.Line variant="success" prefix="✓">
              {call.description}
            </Cli.Line>
          )}
        </div>
      ))}
      {status === "done" && (
        <>
          <Cli.Blank />
          <Cli.Line variant="success" prefix="✓">
            Complete — {query.calls.length} calls
          </Cli.Line>
          <Cli.Blank />
          <Cli.Line>{query.response}</Cli.Line>
        </>
      )}
      {status === "error" && (
        <>
          <Cli.Blank />
          <Cli.Line variant="error" prefix="✗">
            Query failed
          </Cli.Line>
        </>
      )}
    </Cli.Block>
  );
}
