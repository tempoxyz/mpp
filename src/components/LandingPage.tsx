"use client";

import { useMutation } from "@tanstack/react-query";
import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
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
// Data
// ---------------------------------------------------------------------------

const AGENT_COMMANDS = [
  { bin: "claude", args: "-p" },
  { bin: "codex", args: null },
  { bin: "amp", args: null },
];

const SERVICES = [
  {
    name: "fal.ai",
    logo: FalLogo,
    task: '"Generate 3 hero image variations for a landing page — dark theme, abstract geometric, 1200x630"',
  },
  {
    name: "Codex",
    logo: CodexLogo,
    task: '"Use Codex to look up the top 5 tokens on Base by 24h volume and summarize the price action"',
  },
  {
    name: "Cloudflare",
    logo: CloudflareLogo,
    task: '"Classify the sentiment of these 50 customer reviews using Cloudflare AI"',
  },
  {
    name: "OpenRouter",
    logo: OpenRouterLogo,
    task: '"Run this prompt through GPT-4o, Claude, and Gemini via OpenRouter and compare the outputs"',
  },
  {
    name: "ElevenLabs",
    logo: ElevenLabsLogo,
    task: '"Read my changelog aloud as a narrated audio update using ElevenLabs"',
  },
];

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

				.service-logos-grid {
					display: grid !important;
					grid-template-columns: repeat(6, 1fr) !important;
					max-width: 300px !important;
					margin-left: auto !important;
					margin-right: auto !important;
					gap: 8px !important;
				}
				.service-logos-grid > * {
					grid-column: span 2;
					display: flex !important;
					justify-content: center !important;
					border: 1px solid var(--vocs-border-color-secondary);
					border-radius: 8px;
					padding: 8px 6px 6px;
				}
				.service-logos-grid > :nth-child(4) { grid-column: 2 / 4; }
				.service-logos-grid > :nth-child(5) { grid-column: 4 / 6; }
				.service-logos-grid .service-logo-icon svg {
					width: 28px !important;
					height: 28px !important;
				}
				.service-logos-grid .service-logo-label {
					font-size: 11px !important;
				}

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
          <div className="hero-right flex-[9] min-w-0 order-first lg:order-last text-left flex flex-col items-start justify-between gap-4">
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

            {/* Agent prompt tabs */}
            <div
              className="w-full max-w-xl"
              style={anim(shouldAnimate, 1800, 700)}
            >
              <AgentTabs />
            </div>

            {/* CTA buttons — mt-auto pushes to bottom edge of CLI demo */}
            <div
              className="flex flex-col items-start gap-4 lg:mt-auto"
              style={anim(shouldAnimate, 2100, 700)}
            >
              <CTAButtons />
            </div>
          </div>
        </div>

        {/* Service logos — full width below both columns */}
        <div className="w-full" style={{ marginTop: 40, paddingBottom: 24 }}>
          <ServiceLogos shouldAnimate={shouldAnimate} />
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
// Service logo icons
// ---------------------------------------------------------------------------

function FalLogo({
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
      viewBox="0 0 202 200"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M124.46 19C127.267 19 129.515 21.282 129.783 24.0755C132.176 48.9932 152.007 68.8231 176.924 71.2162C179.719 71.4845 182 73.7336 182 76.54V123.46C182 126.266 179.719 128.515 176.924 128.784C152.007 131.177 132.176 151.007 129.783 175.924C129.515 178.718 127.267 181 124.46 181H77.5404C74.734 181 72.4849 178.718 72.2165 175.924C69.8235 151.007 49.9933 131.177 25.0755 128.784C22.282 128.515 20 126.266 20 123.46V76.54C20 73.7336 22.282 71.4845 25.0755 71.2162C49.9933 68.8231 69.8235 48.9932 72.2165 24.0755C72.4849 21.282 74.734 19 77.5404 19H124.46ZM52.5273 99.8627C52.5273 126.817 74.3534 148.667 101.277 148.667C128.201 148.667 150.028 126.817 150.028 99.8627C150.028 72.9087 128.201 51.058 101.277 51.058C74.3534 51.058 52.5273 72.9087 52.5273 99.8627Z"
      />
    </svg>
  );
}

function CodexLogo({
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
      viewBox="0 0 76 86"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M62.3047 52.9227L62.2831 53.6195C62.0605 60.7171 60.9542 66.6365 58.9858 71.2341C53.3466 73.6478 46.5723 74.8763 38.8497 74.8763C31.1272 74.8763 23.9578 73.5329 18.2324 70.8893C14.9063 64.1006 13.2181 54.4888 13.2181 42.3123C13.2181 30.1358 15.014 20.4234 18.5628 13.6348C24.044 11.2857 30.8614 10.1004 38.8426 10.1004C46.3137 10.1004 52.815 11.1707 58.1812 13.2899C59.8694 17.083 61.0116 21.9679 61.5863 27.8227L61.651 28.4692H75.099L74.7613 27.5138C72.3835 20.7395 67.0244 15.4451 59.2516 12.1765C55.4227 3.98698 48.749 0 38.8497 0C28.9505 0 22.0038 4.21686 17.5355 12.5285C5.89786 17.7295 0 27.7508 0 42.3195C0 56.8881 5.94096 66.5718 17.1764 71.9812C21.6662 80.6879 28.9577 85.0987 38.8497 85.0987C48.7418 85.0987 56.0836 80.8029 60.0706 72.326C68.2816 68.4899 73.6479 62.0892 75.6018 53.8063L75.8102 52.9227H62.3047Z" />
    </svg>
  );
}

function CloudflareLogo({
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
      viewBox="0 0 202 200"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M137.698 138.284C138.356 136.546 138.587 134.675 138.374 132.828C138.161 130.982 137.509 129.213 136.472 127.67C135.407 126.394 134.101 125.341 132.629 124.571C131.156 123.8 129.546 123.327 127.89 123.179L56.7796 122.362C56.3709 122.362 55.9622 121.954 55.5535 121.954C55.4583 121.883 55.3811 121.79 55.3279 121.684C55.2747 121.578 55.247 121.461 55.247 121.342C55.247 121.223 55.2747 121.106 55.3279 120.999C55.3811 120.893 55.4583 120.801 55.5535 120.729C55.9622 119.913 56.3709 119.505 57.1882 119.505L128.707 118.688C133.248 118.185 137.572 116.482 141.235 113.756C144.898 111.029 147.768 107.377 149.55 103.174L153.637 92.5597C153.637 92.1514 154.045 91.7432 153.637 91.3349C151.415 81.4486 146.023 72.5572 138.281 66.0116C130.538 59.466 120.869 55.6241 110.741 55.0697C100.613 54.5154 90.5814 57.2788 82.1695 62.9402C73.7576 68.6015 67.4256 76.8513 64.1358 86.4358C59.8649 83.3887 54.6555 81.9432 49.4233 82.3533C44.6216 82.8881 40.1449 85.0386 36.7285 88.4514C33.3122 91.8642 31.1595 96.3363 30.6241 101.133C30.3519 103.588 30.4901 106.072 31.0327 108.482C23.2635 108.696 15.8846 111.93 10.4657 117.496C5.04675 123.062 2.01543 130.52 2.01651 138.284C1.94944 139.793 2.08691 141.304 2.42518 142.775C2.44395 143.094 2.57915 143.395 2.80514 143.62C3.03113 143.846 3.33219 143.981 3.65123 144H134.837C135.655 144 136.472 143.592 136.472 142.775L137.698 138.284Z" />
      <path d="M160.175 92.5597H158.132C157.723 92.5597 157.315 92.9679 156.906 93.3762L154.045 103.174C153.388 104.913 153.156 106.784 153.369 108.63C153.583 110.477 154.235 112.246 155.271 113.789C156.336 115.064 157.642 116.117 159.115 116.888C160.587 117.659 162.198 118.132 163.854 118.28L178.975 119.096C179.383 119.096 179.792 119.505 180.201 119.505C180.296 119.576 180.373 119.668 180.426 119.775C180.48 119.881 180.507 119.998 180.507 120.117C180.507 120.236 180.48 120.353 180.426 120.459C180.373 120.566 180.296 120.658 180.201 120.729C179.792 121.546 179.383 121.954 178.566 121.954L163.036 122.771C158.496 123.274 154.172 124.977 150.508 127.703C146.845 130.43 143.975 134.082 142.194 138.284L141.376 141.959C140.968 142.367 141.376 143.183 142.194 143.183H196.139C196.306 143.207 196.476 143.192 196.635 143.139C196.795 143.086 196.94 142.996 197.059 142.877C197.178 142.758 197.267 142.614 197.321 142.454C197.374 142.295 197.389 142.125 197.365 141.959C198.338 138.5 198.887 134.935 199 131.344C198.935 121.078 194.824 111.25 187.557 103.991C180.29 96.7314 170.452 92.6244 160.175 92.5597Z" />
    </svg>
  );
}

function OpenRouterLogo({
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
      viewBox="0 0 202 200"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M11.0968 99.4902C16.428 99.4902 37.0417 94.9289 47.7039 88.9388C58.3662 82.9486 58.3662 82.9486 80.4016 67.4447C108.3 47.8157 128.026 54.3879 160.369 54.3879" />
      <path d="M71.1457 54.5138C104.459 31.0751 132.161 38.5316 160.369 38.5316V70.2441C123.892 70.2441 112.142 64.5564 89.6578 80.3755C67.576 95.9121 67.0111 96.3169 55.5889 102.734C48.4606 106.739 39.0677 109.789 31.5183 111.783C24.3264 113.682 16.0521 115.346 11.0968 115.346V83.6338C10.8661 83.6338 11.9296 83.5911 14.6641 83.0908C17.0682 82.651 20.0716 81.9872 23.2842 81.1387C30.0399 79.3545 36.285 77.1288 39.819 75.1434C49.7213 69.5802 49.1569 69.9849 71.1457 54.5138Z" />
      <path d="M191.645 54.5835L137 85.8619V23.3052L191.645 54.5835Z" />
      <path d="M192 54.5835L136.823 86.167V23L192 54.5835ZM137.178 85.5565L191.289 54.5835L137.178 23.6101V85.5565Z" />
      <path d="M10.0306 99.5096C15.3617 99.5096 35.9754 104.071 46.6377 110.061C57.3 116.051 57.3 116.051 79.3353 131.555C107.234 151.184 126.96 144.612 159.302 144.612" />
      <path d="M10.0306 83.6533C14.9859 83.6533 23.2602 85.3177 30.452 87.2172C38.0015 89.2111 47.3944 92.261 54.5227 96.2657C65.9449 102.683 66.5097 103.088 88.5916 118.624C111.075 134.443 122.826 128.756 159.302 128.756V160.468C131.095 160.468 103.393 167.925 70.0794 144.486C48.0907 129.015 48.6551 129.419 38.7528 123.856C35.2188 121.871 28.9736 119.645 22.2179 117.861C19.0053 117.012 16.0019 116.349 13.5979 115.909C10.8633 115.409 9.79985 115.366 10.0306 115.366V83.6533Z" />
      <path d="M190.578 144.416L135.934 113.138V175.695L190.578 144.416Z" />
      <path d="M190.934 144.416L135.757 176V112.833L190.934 144.416ZM136.112 175.389L190.223 144.416L136.112 113.443V175.389Z" />
    </svg>
  );
}

function ElevenLabsLogo({
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
      viewBox="310 250 256 376"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M468 292H528V584H468V292Z" />
      <path d="M348 292H408V584H348V292Z" />
    </svg>
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
// Service logos section
// ---------------------------------------------------------------------------

function ServiceLogos({ shouldAnimate }: { shouldAnimate: boolean }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMobile = () =>
    typeof window !== "undefined" && window.innerWidth < 768;

  const showDesktop = (idx: number) => {
    if (isMobile()) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveIndex(idx);
  };
  const hideDesktop = () => {
    if (isMobile()) return;
    timeoutRef.current = setTimeout(() => setActiveIndex(null), 150);
  };
  const handleTap = (idx: number) => {
    if (isMobile()) setActiveIndex((prev) => (prev === idx ? null : idx));
  };
  const dismiss = () => setActiveIndex(null);
  const goPrev = () =>
    setActiveIndex((i) =>
      i === null ? null : (i - 1 + SERVICES.length) % SERVICES.length,
    );
  const goNext = () =>
    setActiveIndex((i) => (i === null ? null : (i + 1) % SERVICES.length));

  const baseDelay = 2200;
  const activeService = activeIndex !== null ? SERVICES[activeIndex] : null;

  return (
    <>
      <div className="max-w-2xl mx-auto px-4">
        <div
          className="flex items-center justify-center gap-4 pb-8 transition-opacity duration-200"
          style={{
            opacity: activeIndex !== null ? 0 : 1,
            ...anim(shouldAnimate, baseDelay, 600),
          }}
        >
          <div
            className="flex-1 h-px"
            style={{ background: "var(--vocs-border-color-secondary)" }}
          />
          <span
            className="text-sm shrink-0"
            style={{ color: "var(--vocs-text-color-muted)" }}
          >
            Works instantly with powerful APIs
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "var(--vocs-border-color-secondary)" }}
          />
        </div>
        <div
          className="service-logos-grid flex flex-wrap items-center justify-center"
          style={{ gap: "1.5rem 2.5rem" }}
        >
          {SERVICES.map((service, i) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: desktop hover + mobile tap
            // biome-ignore lint/a11y/useKeyWithClickEvents: mobile tap target
            <div
              key={service.name}
              className="relative"
              onMouseEnter={() => showDesktop(i)}
              onMouseLeave={hideDesktop}
              onClick={() => handleTap(i)}
              style={{
                cursor: isMobile() ? "pointer" : undefined,
                ...anim(shouldAnimate, baseDelay + 200 + i * 120, 600),
              }}
            >
              <ServiceLogoButton
                service={service}
                isActive={activeIndex === i}
                onTap={() => handleTap(i)}
              />
              <DesktopTooltip
                service={service}
                isOpen={activeIndex === i}
                onMouseEnter={() => showDesktop(i)}
                onMouseLeave={hideDesktop}
              />
            </div>
          ))}
        </div>
      </div>
      {activeService && isMobile() && (
        <MobileServiceCard
          service={activeService}
          onDismiss={dismiss}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </>
  );
}

function ServiceLogoButton({
  service,
  isActive,
  onTap,
}: {
  service: (typeof SERVICES)[number];
  isActive: boolean;
  onTap: () => void;
}) {
  const Logo = service.logo;
  return (
    <button
      type="button"
      onClick={onTap}
      className="service-logo-item flex flex-col items-center gap-2 cursor-pointer"
      style={
        {
          "--service-accent": ACCENT,
          color: isActive ? ACCENT : "var(--vocs-text-color-primary)",
          background: "none",
          border: "none",
          padding: 0,
        } as React.CSSProperties
      }
    >
      <div
        className="service-logo-icon"
        style={{ transition: "color 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        <Logo style={{ width: 36, height: 36 }} />
      </div>
      <span
        className="service-logo-label text-sm"
        style={{ color: "var(--vocs-text-color-muted)" }}
      >
        {service.name}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Desktop hover tooltip
// ---------------------------------------------------------------------------

function DesktopTooltip({
  service,
  isOpen,
  onMouseEnter,
  onMouseLeave,
}: {
  service: (typeof SERVICES)[number];
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { activeAgent } = useContext(AgentContext);
  const agent = AGENT_COMMANDS[activeAgent];
  const fullPrompt = [agent.bin, agent.args, service.task]
    .filter(Boolean)
    .join(" ");
  const prefix = [agent.bin, agent.args].filter(Boolean).join(" ");
  const setupCmd = [
    agent.bin,
    agent.args,
    `"Add ${QUICKSTART_URL} (MPP quickstart) & ${SERVICES_URL} (MPP service endpoints) to my SKILLS.md for future reference."`,
  ]
    .filter(Boolean)
    .join(" ");

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${PRESTO_INSTALL} && ${PRESTO_LOGIN} && ${setupCmd} && ${fullPrompt}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="hidden md:flex items-center justify-between gap-3 w-full text-left cursor-pointer"
      style={{
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: isOpen
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(4px)",
        marginBottom: 10,
        width: 300,
        padding: "12px 16px",
        borderRadius: 6,
        border: "1px solid var(--vocs-border-color-secondary)",
        background: "var(--vocs-background-color-surface)",
        zIndex: 100,
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
    >
      <span
        className="text-sm font-mono whitespace-pre-wrap break-words text-left"
        style={{
          margin: 0,
          padding: 0,
          userSelect: "text",
          WebkitUserSelect: "text",
        }}
      >
        <span style={{ color: "var(--vocs-text-color-heading)" }}>
          {prefix}{" "}
        </span>
        <span style={{ color: AGENT_COLOR }}>{service.task}</span>
      </span>
      <span
        className="shrink-0"
        style={{
          color: copied ? ACCENT : "var(--vocs-text-color-muted)",
          transition: "color 0.15s",
        }}
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
  );
}

// ---------------------------------------------------------------------------
// Mobile service card (bottom sheet with arrow navigation)
// ---------------------------------------------------------------------------

function MobileServiceCard({
  service,
  onDismiss,
  onPrev,
  onNext,
}: {
  service: (typeof SERVICES)[number];
  onDismiss: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { activeAgent } = useContext(AgentContext);
  const agent = AGENT_COMMANDS[activeAgent];
  const fullPrompt = [agent.bin, agent.args, service.task]
    .filter(Boolean)
    .join(" ");
  const prefix = [agent.bin, agent.args].filter(Boolean).join(" ");
  const Logo = service.logo;
  const setupCmd = [
    agent.bin,
    agent.args,
    `"Add ${QUICKSTART_URL} (MPP quickstart) & ${SERVICES_URL} (MPP service endpoints) to my SKILLS.md for future reference."`,
  ]
    .filter(Boolean)
    .join(" ");

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${PRESTO_INSTALL} && ${PRESTO_LOGIN} && ${setupCmd} && ${fullPrompt}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const chevron: React.CSSProperties = {
    background: "none",
    border: "none",
    padding: 8,
    color: "var(--vocs-text-color-muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: dismiss overlay
    // biome-ignore lint/a11y/noStaticElementInteractions: dismiss overlay
    <div
      className="fixed inset-0"
      style={{ zIndex: 10000 }}
      onClick={onDismiss}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: card body */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: card body */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4"
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
        }}
      >
        <div
          style={{
            borderRadius: 12,
            border: "1px solid var(--vocs-border-color-primary)",
            background: "light-dark(#fff, oklch(0.22 0 0))",
            padding: 20,
            boxShadow: "0 -8px 32px rgba(0,0,0,0.25)",
          }}
        >
          {/* Header with arrows */}
          <div
            className="flex items-center justify-between mb-4"
            style={{
              borderBottom: "1px solid var(--vocs-border-color-secondary)",
              paddingBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={onPrev}
              style={chevron}
              aria-label="Previous service"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <Logo
                style={{
                  width: 32,
                  height: 32,
                  color: "var(--vocs-text-color-heading)",
                }}
              />
              <span
                className="text-base font-medium"
                style={{ color: "var(--vocs-text-color-heading)" }}
              >
                {service.name}
              </span>
            </div>
            <button
              type="button"
              onClick={onNext}
              style={chevron}
              aria-label="Next service"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          {/* Prompt */}
          <div
            className="font-mono text-sm whitespace-pre-wrap break-words mb-4 text-left"
            style={{ userSelect: "text", WebkitUserSelect: "text" }}
          >
            <span style={{ color: "var(--vocs-text-color-heading)" }}>
              {prefix}{" "}
            </span>
            <span style={{ color: AGENT_COLOR }}>{service.task}</span>
          </div>
          {/* Actions */}
          <div className="flex gap-2">
            <Link
              to="/guides/building-with-ai"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-md no-underline transition-colors"
              style={{
                border: "1px solid var(--vocs-border-color-primary)",
                color: "var(--vocs-text-color-heading)",
              }}
              onClick={onDismiss}
            >
              View all services
            </Link>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-colors"
              style={{
                background: ACCENT,
                color: "var(--vocs-background-color-primary)",
              }}
            >
              {copied ? "Copied!" : "Copy prompt"}
            </button>
          </div>
        </div>
      </div>
    </div>
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
  const taskPrompt = `"Use fal.ai to generate a logo for my startup called 'Moonshot Labs'"`;
  const displayPrompt = taskPrompt;
  const commands = [
    {
      label: "Claude",
      bin: "claude",
      args: "-p",
      icon: ClaudeLogo,
    },
    {
      label: "Codex",
      bin: "codex",
      args: null,
      icon: OpenAILogo,
    },
    {
      label: "Amp",
      bin: "amp",
      args: null,
      icon: AmpLogo,
    },
  ];
  const cmd = commands[active];
  const setupCmd = [cmd.bin, cmd.args, setupPrompt].filter(Boolean).join(" ");
  const taskCmd = [cmd.bin, cmd.args, taskPrompt].filter(Boolean).join(" ");
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
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
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
              <Icon className="w-4.5 h-4.5" />
              {a.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="px-4 py-3 flex items-center justify-between gap-3 w-full text-left cursor-pointer transition-colors"
        style={{ color: "var(--vocs-background-color-surface)" }}
      >
        <span
          className="font-mono whitespace-pre-wrap break-words text-left"
          style={{
            fontSize: 15,
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
          <span style={{ color: AGENT_COLOR }}> {displayPrompt}</span>
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
